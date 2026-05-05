/**
 * hydrangea.service.js v4
 * - Multi-turn chat với session management
 * - Structured item selection theo danh mục (basket/wrapper/ribbon/flowers/accessories)
 * - Out-of-stock detection + alternatives
 * - Gemini image generation
 * - Custom bouquet order creation
 */
const axios = require('axios');
const Product = require('../../models/Product');
const CustomBouquetOrder = require('../../models/CustomBouquetOrder');
const { normalizeString } = require('../../utils/normalizer');
// generateBouquetImage được gọi qua aiImagePipeline.service.js — không import trực tiếp ở đây

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map();

// ── Câu hỏi bổ sung thông minh ───────────────────────────────────────────────
const MISSING_DATA_QUESTIONS = {
    flower_types: {
        question: 'Bạn thích loài hoa nào làm chủ đạo? 🌸',
        chips: ['Hoa hồng', 'Hoa cúc', 'Hoa ly', 'Hướng dương', 'Cẩm tú cầu']
    },
    colors: {
        question: 'Bạn muốn tông màu gì?',
        chips: ['Đỏ', 'Hồng', 'Trắng', 'Tím', 'Vàng', 'Cam', 'Xanh dương']
    },
    category: {
        question: 'Bạn muốn làm dạng giỏ, lẵng, hộp hay bó hoa? 🧺',
        chips: ['Giỏ hoa', 'Bó hoa', 'Lẵng hoa', 'Hộp hoa', 'Kệ hoa']
    },
    wrapper: {
        question: 'Bạn có yêu cầu gì về giấy gói và nơ không? 🎀 (ví dụ: giấy kraft, nơ đỏ...)',
        chips: ['Giấy kraft nơ đỏ', 'Giấy mờ nơ hồng', 'Chỉ cần nơ đơn giản', 'Không cần']
    },
    note: {
        question: 'Bạn có muốn gửi gắm lời chúc hay thông điệp gì không? Mình sẽ lưu lại giúp bạn nhé! 💌',
        chips: ['Chúc mừng sinh nhật!', 'Kỷ niệm ngày cưới', 'Không cần']
    },
    card_note: {
        question: '💌 Bạn muốn ghi nội dung gì lên thiệp chúc mừng? (thợ cắm hoa sẽ viết theo yêu cầu của bạn)',
        chips: ['Chúc mừng sinh nhật! Hạnh phúc! 🎂', 'Thành công trên con đường phía trước! 🎉', 'Yêu em mãi! ❤️', 'Kỷ niệm đáng nhớ 💐']
    }
};

class HydrangeaService {

    // ── Session management ───────────────────────────────────────────────────
    _makeSession() {
        return {
            entities: {
                flower_types: [], colors: [], color: null,
                structured_flowers: [],
                occasion: null, style: null, budget: 0,
                target: null, role_hint: {},
                category: null, wrapper: null, ribbon: null, accessories: [],
                removed_items: []
            },
            selectedItems: {
                basket: null, wrapper: null, ribbon: null,
                main_flowers: [], sub_flowers: [], accessories: []
            },
            current_bouquet: { items: [], image_url: null, total_price: 0, explanation: '' },
            intent: null,
            history: [],
            missingDataAsked: new Set(),
            lastActivity: Date.now(),
            // — Trạng thái tạo ảnh mới (Cloudinary) —
            generatedImages: [],    // [{ url, public_id }]
            promptUsed:      null,
            imageMetadata:   null,  // { type, flowers, colors }
            hasGreeting:     true,  // Trạng thái hỏi lời chúc
        };
    }

    getSession(sessionId) {
        const s = sessions.get(sessionId);
        if (!s || (Date.now() - s.lastActivity > SESSION_TTL_MS)) {
            const fresh = this._makeSession();
            sessions.set(sessionId, fresh);
            return fresh;
        }
        s.lastActivity = Date.now();
        return s;
    }

    // ── Entity merge ─────────────────────────────────────────────────────────
    mergeEntities(session, newEntities) {
        if (!newEntities) return;
        const sessionEntities = session.entities;

        // 1. Basic fields
        ['occasion', 'style', 'target', 'category', 'wrapper', 'ribbon'].forEach(k => {
            if (newEntities[k]) sessionEntities[k] = newEntities[k];
        });
        if (newEntities.budget > 0) sessionEntities.budget = newEntities.budget;

        // 2. Flowers (Grouped with color & quantity)
        // Support both 'flowers' and 'structured_flowers'
        const incomingFlowers = newEntities.flowers || newEntities.structured_flowers || [];
        if (incomingFlowers.length > 0) {
            const uniqueFlowers = [];
            const seenFlowers = new Set();
            
            incomingFlowers.forEach(f => {
                const typeN = normalizeString(f.type);
                const colorN = normalizeString(f.color || '');
                const key = `${typeN}|${colorN}`;
                
                if (!seenFlowers.has(key)) {
                    seenFlowers.add(key);
                    uniqueFlowers.push({
                        type: f.type,
                        color: f.color || null,
                        quantity: f.quantity || 1
                    });
                }
            });
            
            // Override existing flowers
            sessionEntities.flowers = uniqueFlowers;
            sessionEntities.structured_flowers = uniqueFlowers; // Backward compatibility
            sessionEntities.flower_types = uniqueFlowers.map(f => f.type);
            
            // Reset selection for flowers to trigger re-match
            if (session.selectedItems) {
                session.selectedItems.main_flowers = [];
                session.selectedItems.sub_flowers = [];
            }
        }

        // 3. Accessories
        const incomingAcc = newEntities.accessories || [];
        if (incomingAcc.length > 0) {
            const uniqueAcc = [];
            const seenAcc = new Set();
            
            incomingAcc.forEach(a => {
                const typeN = normalizeString(a.type);
                const colorN = normalizeString(a.color || '');
                const key = `${typeN}|${colorN}`;
                
                if (!seenAcc.has(key)) {
                    seenAcc.add(key);
                    uniqueAcc.push({
                        type: a.type,
                        color: a.color || null
                    });
                }
            });
            
            sessionEntities.accessories = uniqueAcc;
            // Reset accessories selection
            if (session.selectedItems) {
                session.selectedItems.accessories = [];
            }
        }

        // 4. Backward compat for colors list
        const newColors = [...(newEntities.colors || []), ...(newEntities.color ? [newEntities.color] : [])];
        if (newColors.length > 0) {
            sessionEntities.colors = Array.from(new Set(newColors.map(c => normalizeString(c))));
            sessionEntities.color = sessionEntities.colors[0];
        }

        if (newEntities.role_hint && Object.keys(newEntities.role_hint).length > 0) {
            sessionEntities.role_hint = { ...sessionEntities.role_hint, ...newEntities.role_hint };
        }
    }

    // ── Budget parser fallback ───────────────────────────────────────────────
    parseBudget(text) {
        const m = text.match(/(\d[\d.,]*)\s*(triệu|trieu|tr|nghìn|nghin|k)?\b/i);
        if (!m) return 0;
        let num = parseFloat(m[1].replace(/[.,]/g, ''));
        const unit = (m[2] || '').toLowerCase();
        if (['triệu', 'trieu', 'tr'].includes(unit)) num *= 1_000_000;
        else if (['nghìn', 'nghin', 'k'].includes(unit)) num *= 1_000;
        return num;
    }

    // ── Intent inference ─────────────────────────────────────────────────────
    inferIntent(text, session) {
        const t = text.toLowerCase();
        if (['đổi', 'thay', 'chỉnh', 'sửa', 'bỏ', 'thêm vào'].some(k => t.includes(k))) return 'MODIFY';
        if (['giá', 'bao nhiêu', 'chi phí', 'tổng'].some(k => t.includes(k))) return 'ASK_PRICE';
        if (this.hasCoreEntities(session.entities)) return 'CREATE_FLOWER_BASKET';
        return 'UNKNOWN';
    }

    hasCoreEntities(e) {
        return (e.flower_types?.length > 0) || (e.colors?.length > 0) || e.occasion || e.style;
    }

    // ── Tìm field thiếu quan trọng nhất để hỏi ──────────────────────────────
    _getMissingField(session) {
        const e = session.entities;
        const asked = session.missingDataAsked;
        if (!e.flower_types?.length && !asked.has('flower_types')) return 'flower_types';
        if (!e.colors?.length && !asked.has('colors')) return 'colors';
        // Fix [5]: Skip asking category if already detected from text
        if (!e.category && !asked.has('category') && !this._detectCategoryFromText(session._lastMessage || '')) return 'category';
        if (!e.wrapper && !asked.has('wrapper')) return 'wrapper';
        // BUG FIX #1: Nếu khách hàng đã yêu cầu thiệp (hasCard), hỏi ngay nội dung thiệp thay vì hỏi thêm lần nữa
        if (e.hasCard && !e.note && !asked.has('card_note')) return 'card_note';
        if (!e.note && !asked.has('note') && session.hasGreeting !== false) return 'note';
        return null;
    }

    // Fix [3]: Detect category from Vietnamese keywords
    _detectCategoryFromText(text) {
        if (!text) return null;
        const t = text.toLowerCase();
        if (t.includes('lẵng') || t.includes('giỏ')) return 'giỏ';
        if (t.includes('bó')) return 'bó';
        if (t.includes('hộp')) return 'hộp';
        if (t.includes('kệ')) return 'kệ';
        return null;
    }

    // ── MODIFY ops ───────────────────────────────────────────────────────────
    applyModifyOps(session, modifyOps = []) {
        if (!modifyOps?.length) return false;
        let changed = false;
        const norm = v => normalizeString(String(v || ''));
        const sessionEntities = session.entities;
        
        modifyOps.forEach(op => {
            // Determine target field. Default to flower_types.
            // If the text contains wrapper keywords, apply to wrapper instead.
            let targetField = 'flower_types';
            const textTo = op.to ? op.to.toLowerCase() : '';
            const textFrom = op.from ? op.from.toLowerCase() : '';
            const checkText = textTo || textFrom;

            if (checkText.includes('ruy băng') || checkText.includes('nơ') || checkText.includes('giấy') || checkText.includes('túi')) {
                targetField = 'wrapper';
            } else if (checkText.includes('gấu') || checkText.includes('thiệp') || checkText.includes('nến') || checkText.includes('pha lê')) {
                targetField = 'accessories';
            }

            if (targetField === 'flower_types') {
                if (op.op === 'replace' && op.from && op.to) {
                    const idx = sessionEntities.flower_types.findIndex(f =>
                        norm(f).includes(norm(op.from)) || norm(op.from).includes(norm(f)));
                    if (idx >= 0) { 
                        sessionEntities.flower_types[idx] = norm(op.to); 
                        changed = true; 
                        
                        // Remove the old flower from selected items
                        if (session.selectedItems) {
                            session.selectedItems.main_flowers = session.selectedItems.main_flowers.filter(f => 
                                !norm(f.name).includes(norm(op.from)) && !norm(op.from).includes(norm(f.name))
                            );
                            session.selectedItems.sub_flowers = session.selectedItems.sub_flowers.filter(f => 
                                !norm(f.name).includes(norm(op.from)) && !norm(op.from).includes(norm(f.name))
                            );
                        }
                    }
                } else if (op.op === 'replace_all' && op.to) {
                    const toNorm = norm(op.to);
                    sessionEntities.flower_types = [toNorm];
                    changed = true;
                    // Clear all flowers to pick new ones
                    if (session.selectedItems) {
                        session.selectedItems.main_flowers = [];
                        session.selectedItems.sub_flowers = [];
                    }
                } else if (op.op === 'remove' && op.from) {
            if (!sessionEntities.removed_items) sessionEntities.removed_items = [];
            sessionEntities.removed_items.push(op.from);

                    const before = sessionEntities.flower_types.length;
                    sessionEntities.flower_types = sessionEntities.flower_types.filter(f =>
                        !norm(f).includes(norm(op.from)) && !norm(op.from).includes(norm(f)));
                    if (sessionEntities.flower_types.length !== before) changed = true;
                    
                    // FIX 2: Remove directly from selectedItems to make the item empty
                    if (session.selectedItems) {
                        const mBefore = session.selectedItems.main_flowers.length;
                        session.selectedItems.main_flowers = session.selectedItems.main_flowers.filter(f => 
                            !norm(f.name).includes(norm(op.from)) && !norm(op.from).includes(norm(f.name))
                        );
                        const sBefore = session.selectedItems.sub_flowers.length;
                        session.selectedItems.sub_flowers = session.selectedItems.sub_flowers.filter(f => 
                            !norm(f.name).includes(norm(op.from)) && !norm(op.from).includes(norm(f.name))
                        );
                        if (session.selectedItems.main_flowers.length !== mBefore || session.selectedItems.sub_flowers.length !== sBefore) {
                            changed = true;
                        }
                    }
                } else if (op.op === 'add' && op.to) {
                    const toNorm = norm(op.to);
                    if (!sessionEntities.flower_types.includes(toNorm)) {
                        sessionEntities.flower_types.push(toNorm); changed = true;
                    }
                }
            } else if (targetField === 'wrapper') {
                if (op.op === 'add' || op.op === 'replace_all' || op.op === 'replace') {
                    sessionEntities.wrapper = op.to;
                    changed = true;
                } else if (op.op === 'remove') {
                    if (!sessionEntities.removed_items) sessionEntities.removed_items = [];
                    if (sessionEntities.wrapper) sessionEntities.removed_items.push(sessionEntities.wrapper);
                    sessionEntities.wrapper = null;
                    changed = true;
                }
            } else if (targetField === 'accessories') {
                if (op.op === 'add' && op.to) {
                    if (!sessionEntities.accessories) sessionEntities.accessories = [];
                    sessionEntities.accessories.push(op.to);
                    changed = true;
                } else if (op.op === 'remove' && op.from) {
                    if (!sessionEntities.removed_items) sessionEntities.removed_items = [];
                    sessionEntities.removed_items.push(op.from);

                    if (session.selectedItems.accessories) {
                        const before = session.selectedItems.accessories.length;
                        session.selectedItems.accessories = session.selectedItems.accessories.filter(a => 
                            !norm(a.name).includes(norm(op.from)) && !norm(op.from).includes(norm(a.name))
                        );
                        if (session.selectedItems.accessories.length !== before) changed = true;
                    }
                    if (sessionEntities.accessories) {
                        sessionEntities.accessories = sessionEntities.accessories.filter(a => 
                            !norm(a).includes(norm(op.from)) && !norm(op.from).includes(norm(a))
                        );
                    }
                }
            }
        });
        return changed;
    }

    // ── Main chat processor ──────────────────────────────────────────────────
    async processChat(sessionId, message, isConfirming = false, incomingEntities = null) {
        const session = this.getSession(sessionId);

        if (incomingEntities && Object.keys(incomingEntities).length > 0) {
            this.mergeEntities(session, incomingEntities);
        }
        
        // Fix [4] Chat greeting logic
        if (message && message.toLowerCase().includes("không cần lời chúc")) {
            session.hasGreeting = false;
        }

        console.log("[HydrangeaService] Input:", message);
        if (isConfirming) return this._handleConfirm(session, sessionId);
        if (!message?.trim()) return this._handleSuggest(session);

        // Fix [3]: Auto-detect category from raw message before asking
        if (message) {
            const detectedCategory = this._detectCategoryFromText(message);
            if (detectedCategory && !session.entities.category) {
                session.entities.category = detectedCategory;
            }
            session._lastMessage = message;
        }
        if (session.asking_for === 'note' && message?.trim()) {
            const lowMsg = message.trim().toLowerCase();
            if (!['không', 'không cần', 'bỏ qua', 'ko', 'ko cần'].includes(lowMsg)) {
                session.entities.note = message.trim();
            } else {
                session.entities.note = '';
            }
            session.asking_for = null;
            session.missingDataAsked.add('note');
            return this.processChat(sessionId, '', false, null);
        }

        // BUG FIX #1b: Xử lý khi đang hỏi nội dung thiệp (card_note)
        if (session.asking_for === 'card_note' && message?.trim()) {
            const lowMsg = message.trim().toLowerCase();
            if (!['không', 'không cần', 'bỏ qua', 'ko', 'ko cần'].includes(lowMsg)) {
                session.entities.note = message.trim();
            } else {
                session.entities.note = '';
                session.entities.hasCard = false; // Hủy thiệp nếu không cần
            }
            session.asking_for = null;
            session.missingDataAsked.add('card_note');
            return this.processChat(sessionId, '', false, null);
        }

        // Gọi Python AI service
        let aiResult = null;
        try {
            const resp = await axios.post(`${AI_SERVICE_URL}/api/hydrangea/analyze`,
                { text: message }, { timeout: 8000 });
            aiResult = resp.data;
        } catch (err) {
            console.warn('[Hydrangea] AI service unavailable:', err.message);
        }

        const aiEntities = aiResult?.entities || {};
        this.mergeEntities(session, aiEntities);

        // Map category/wrapper (bổ sung cho normalizer)
        if (aiEntities.category) session.entities.category = aiEntities.category;
        if (aiEntities.wrapper) session.entities.wrapper = aiEntities.wrapper;

        // BUG FIX #2: Map accessories array đúng sang ribbon/wrapper/card
        if (aiEntities.accessories?.length > 0) {
            for (const acc of aiEntities.accessories) {
                const t = (acc.type || '').toLowerCase();
                const val = acc.color || acc.type;
                if (t === 'ribbon' || t === 'ruy băng') {
                    // Cập nhật đè lên luôn để tránh PhoBERT extract sai
                    session.entities.ribbon = val;
                } else if (t === 'wrapping' || t === 'giấy gói' || t === 'wrapper') {
                    session.entities.wrapper = val;
                } else if (t === 'card' || t === 'thiệp' || t === 'thư') {
                    // Đánh dấu khách hàng muốn thiệp — sẽ hỏi nội dung
                    session.entities.hasCard = true;
                }
            }
        }

        if (!session.entities.budget) {
            const b = this.parseBudget(message);
            if (b > 0) session.entities.budget = b;
        }

        const intent = aiResult?.intent || this.inferIntent(message, session);
        session.intent = intent;
        session.history.push({ role: 'user', text: message, ts: new Date() });

        // MODIFY intent
        if (intent === 'MODIFY' && aiEntities.modify_ops?.length > 0) {
            const changed = this.applyModifyOps(session, aiEntities.modify_ops);
            if (changed) {
                const opsDesc = aiEntities.modify_ops.map(op =>
                    op.op === 'replace' ? `đổi "${op.from}" → "${op.to}"` :
                    op.op === 'replace_all' ? `đổi thành "${op.to}"` :
                    op.op === 'remove' ? `bỏ "${op.from}"` : `thêm "${op.to}"`
                ).join(', ');
                return this._handleSuggest(session, `Đã ${opsDesc}. Đang tìm lại... `);
            }
        }

        // ASK_PRICE
        if (intent === 'ASK_PRICE') {
            const total = session.current_bouquet.total_price;
            const reply = total > 0
                ? `Giỏ hoa hiện tại tổng khoảng **${new Intl.NumberFormat('vi-VN').format(total)}đ**. Bạn muốn điều chỉnh không?`
                : 'Bạn muốn ngân sách khoảng bao nhiêu? (ví dụ: 500k, 1 triệu...)';
            return { success: true, reply, extractedEntities: session.entities, status: 'continue', suggestedItems: null };
        }

        // Chưa đủ data — hỏi thêm thông minh
        const missingField = this._getMissingField(session);
        if (missingField) {
            if (missingField === 'note') session.asking_for = 'note';
            if (missingField === 'card_note') session.asking_for = 'card_note';
            session.missingDataAsked.add(missingField);
            const q = MISSING_DATA_QUESTIONS[missingField];
            session.history.push({ role: 'bot', text: q.question, ts: new Date() });
            return {
                success: true,
                reply: q.question,
                quickChips: q.chips,
                extractedEntities: session.entities,
                status: 'asking',
                suggestedItems: null
            };
        }

        return this._handleSuggest(session);
    }

    // ── Tìm và phân loại sản phẩm theo danh mục ─────────────────────────────
    async _handleSuggest(session, prefixMsg = '') {
        const e = session.entities;

        // Query tất cả products active
        const allProducts = await Product.find({ status: { $in: ['active', 'out_of_stock'] } })
            .select('name price images dominant_color secondary_colors main_flowers sub_flowers occasion style sold product_type role_type layout elements stock _id')
            .lean();

        // Lọc bỏ những sản phẩm nằm trong removed_items
        const norm = v => normalizeString(String(v || ''));
        const filteredProducts = allProducts.filter(p => {
            if (!e.removed_items || e.removed_items.length === 0) return true;
            const pName = norm(p.name);
            return !e.removed_items.some(rm => pName.includes(norm(rm)));
        });

        const inStock = filteredProducts.filter(p => p.stock > 0);
        const outOfStock = filteredProducts.filter(p => p.stock === 0);

        // BUG FIX #3: Score function — ưu tiên theo TÊN SẢN PHẨM trước, sau đó màu sắc
        const score = (product, targetType = null, targetColor = null) => {
            if (!targetType) return { total: 0, breakdown: {} };

            const tTypeN = normalizeString(targetType);
            const tColorN = targetColor ? normalizeString(targetColor) : null;
            const pNameN = normalizeString(product.name || '');

            const productTypes = [
                ...(product.main_flowers || []).map(normalizeString),
                ...(product.sub_flowers  || []).map(normalizeString)
            ];

            // 1. Khớp tên sản phẩm (name) — ưu tiên cao nhất
            const hasNameMatch = pNameN.includes(tTypeN) || tTypeN.includes(pNameN);
            // 2. Khớp theo main_flowers/sub_flowers
            const hasTypeMatch = productTypes.some(t => t.includes(tTypeN) || tTypeN.includes(t));
            // 3. Khớp màu sắc dominant_color
            const pColor = normalizeString(product.dominant_color || '');
            const secColors = (product.secondary_colors || []).map(normalizeString);
            const hasColorMatch = tColorN
                ? (pColor.includes(tColorN) || tColorN.includes(pColor) || secColors.some(c => c.includes(tColorN) || tColorN.includes(c)))
                : false;

            // Scoring: tên+màu > tên > type+màu > type (fallback)
            let total;
            if ((hasNameMatch || hasTypeMatch) && hasColorMatch) {
                total = hasNameMatch ? 120 : 100; // tên+màu = best match
            } else if (hasNameMatch) {
                total = 60;  // tên khớp, chưa có màu
            } else if (hasTypeMatch) {
                total = 10;  // type match only (fallback, same type)
            } else {
                total = -50; // không khớp gì
            }

            return {
                total,
                breakdown: {
                    nameMatch: hasNameMatch,
                    typeMatch: hasTypeMatch,
                    colorMatch: hasColorMatch,
                    isFallback: !hasNameMatch && hasTypeMatch && !hasColorMatch
                }
            };
        };

        const processFlowerProducts = (products, targetType, targetColor, targetQuantity = 1) => {
            let results = products.map(p => {
                const res = score(p, targetType, targetColor);
                return { 
                    ...p, 
                    _score: res.total, 
                    _breakdown: res.breakdown,
                    quantity: targetQuantity || 1
                };
            });

            // Nếu không có sản phẩm nào khớp loại hoa (score > 0), thực hiện tìm kiếm theo từ khóa
            if (!results.some(r => r._score > 0)) {
                results = products.map(p => {
                    const res = score(p, targetType, targetColor);
                    return {
                        ...p,
                        _score: res.total,
                        _breakdown: res.breakdown,
                        quantity: targetQuantity || 1
                    };
                });
            }

            const sorted = results.sort((a, b) => b._score - a._score);
            
            // Xử lý nhãn Fallback cho các kết quả có điểm thấp
            if (sorted.length > 0 && sorted[0]._score < 0) {
                sorted.forEach(p => { 
                    if (p._score > -50) {
                        p._score = -20;
                        if (p._breakdown) p._breakdown.isFallback = true;
                    }
                });
            }
            return sorted;
        };

        // Custom scoring for non-flower items
        const genericScore = (product, entityValue, type) => {
            if (!entityValue) return 0;
            const pNameN = normalizeString(product.name);
            const pColorsAll = [normalizeString(product.dominant_color || ''), ...(product.secondary_colors || []).map(c => normalizeString(c))];
            const eValN = normalizeString(entityValue);

            let s = 0;
            if (type === 'wrapper' || type === 'ribbon') {
                if (pColorsAll.some(c => c.includes(eValN) || eValN.includes(c))) s += 60;
                if (pNameN.includes(eValN)) s += 20;
            } else if (type === 'basket' || type === 'accessory') {
                if (pNameN.includes(eValN) || eValN.includes(pNameN)) s += 50;
                // Nhận diện thiệp chúc mừng nếu user yêu cầu
                if (type === 'accessory' && (eValN.includes('thiệp') || eValN.includes('thư'))) {
                    if (pNameN.includes('thiệp') || pNameN.includes('card')) s += 100;
                }
            }
            return s;
        };

        // 1. Process Baskets
        const baskets = inStock
            .filter(p => p.product_type === 'basket')
            .map(p => ({ ...p, _score: genericScore(p, e.category, 'basket') }))
            .sort((a, b) => b._score - a._score);

        // 2. Process Wrappers
        const wrappers = inStock
            .filter(p => p.product_type === 'wrapper')
            .map(p => ({ ...p, _score: genericScore(p, e.wrapper, 'wrapper') }))
            .sort((a, b) => b._score - a._score);

        // 3. Process Ribbons
        const ribbons = inStock
            .filter(p => p.product_type === 'ribbon')
            .map(p => ({ ...p, _score: genericScore(p, e.ribbon, 'ribbon') }))
            .sort((a, b) => b._score - a._score);

        // 4. Process Flowers (Main and Sub) - Multi-flower support
        let allMainFlowerResults = [];
        let allSubFlowerResults = [];

        const flowerEntities = e.flowers || e.structured_flowers || [];
        if (flowerEntities.length > 0) {
            const mainFlowersEntities = flowerEntities.filter(f => f.role === 'main');
            const subFlowersEntities = flowerEntities.filter(f => f.role === 'secondary');

            // If no roles, fallback
            if (mainFlowersEntities.length === 0 && subFlowersEntities.length === 0) {
                flowerEntities.forEach(sf => {
                    const mainMatches = processFlowerProducts(
                        inStock.filter(p => p.product_type === 'flower_component' && p.role_type === 'main_flower'),
                        sf.type, sf.color, sf.quantity
                    );
                    const subMatches = processFlowerProducts(
                        inStock.filter(p => p.product_type === 'flower_component' && p.role_type === 'sub_flower'),
                        sf.type, sf.color, sf.quantity
                    );
                    allMainFlowerResults.push(...mainMatches);
                    allSubFlowerResults.push(...subMatches);
                });
            } else {
                mainFlowersEntities.forEach(sf => {
                    const matches = processFlowerProducts(
                        inStock.filter(p => p.product_type === 'flower_component' && p.role_type === 'main_flower'),
                        sf.type, sf.color, sf.quantity
                    );
                    allMainFlowerResults.push(...matches);
                });
                subFlowersEntities.forEach(sf => {
                    const matches = processFlowerProducts(
                        inStock.filter(p => p.product_type === 'flower_component' && p.role_type === 'sub_flower'),
                        sf.type, sf.color, sf.quantity
                    );
                    allSubFlowerResults.push(...matches);
                });
            }
        }

        // Deduplicate and sort flowers
        const mainFlowers = Array.from(new Map(allMainFlowerResults.map(p => [String(p._id), p])).values())
            .sort((a, b) => b._score - a._score);
        const subFlowers = Array.from(new Map(allSubFlowerResults.map(p => [String(p._id), p])).values())
            .sort((a, b) => b._score - a._score);

        // 5. Process Accessories
        const accessories = inStock
            .filter(p => p.product_type === 'accessory')
            .map(p => {
                let bestScore = 0;
                if (e.accessories?.length > 0) {
                    bestScore = Math.max(...e.accessories.map(acc => genericScore(p, typeof acc === 'string' ? acc : acc.type, 'accessory')));
                }
                return { ...p, _score: bestScore };
            })
            .sort((a, b) => b._score - a._score);

        // 6. Complete bouquet (legacy fallback)
        const completeBouquets = inStock
            .filter(p => p.product_type === 'complete_bouquet' || !p.product_type)
            .map(p => ({ ...p, _score: 0 }))
            .sort((a, b) => b._score - a._score);

        // Build suggestedItems
        const suggestedItems = {
            basket: baskets.slice(0, 3),
            wrapper: wrappers.slice(0, 3),
            ribbon: ribbons.slice(0, 3),
            main_flowers: mainFlowers.filter(p => p._score > -50).slice(0, 4),
            sub_flowers: subFlowers.filter(p => p._score > -50).slice(0, 3),
            accessories: accessories.filter(p => p._score >= 0).slice(0, 3),
            complete_bouquets: completeBouquets.slice(0, 6),
        };

        console.log("[HydrangeaService] Structured:", JSON.stringify(e));
        console.log("[HydrangeaService] Matched:", JSON.stringify({
            main: suggestedItems.main_flowers.length,
            sub: suggestedItems.sub_flowers.length,
            acc: suggestedItems.accessories.length
        }));

        // Auto-selection logic
        let mainAutoFilled = session.selectedItems.main_flowers?.length ? session.selectedItems.main_flowers : mainFlowers.filter(p => p._score >= 10).slice(0, 2);
        
        session.selectedItems = {
            ...session.selectedItems,
            basket:  session.selectedItems.basket  || (baskets.length > 0 && baskets[0]._score > 0 ? baskets[0] : null),
            wrapper: session.selectedItems.wrapper || (wrappers.length > 0 && wrappers[0]._score > 0 ? wrappers[0] : null),
            ribbon:  session.selectedItems.ribbon  || (ribbons.length > 0 && ribbons[0]._score > 0 ? ribbons[0] : null),
            main_flowers: mainAutoFilled,
            sub_flowers:  session.selectedItems.sub_flowers?.length  ? session.selectedItems.sub_flowers  : subFlowers.filter(p => p._score >= 5).slice(0, 1),
            accessories:  session.selectedItems.accessories?.length  ? session.selectedItems.accessories  : accessories.filter(p => p._score >= 50).slice(0, 1),
        };

        // Logic kiểm tra Out of Stock theo yêu cầu khách hàng
        const missingItems = [];

        // Kiểm tra Hoa chính/Hoa phụ (nếu user đòi hoa mà system không tìm thấy flower_component nào khớp)
        if (e.flower_types?.length > 0) {
            e.flower_types.forEach(ft => {
                const ftN = normalizeString(ft);
                const isSelected = [...(session.selectedItems.main_flowers || []), ...(session.selectedItems.sub_flowers || [])].some(p => {
                    return p.name && normalizeString(p.name).includes(ftN) || 
                           (p.main_flowers && p.main_flowers.some(f => normalizeString(f).includes(ftN) || ftN.includes(normalizeString(f)))) ||
                           (p.sub_flowers && p.sub_flowers.some(f => normalizeString(f).includes(ftN) || ftN.includes(normalizeString(f))));
                });
                if (!isSelected) {
                    missingItems.push(`Hoa ${ft}`);
                }
            });
            // Nếu thiếu hoa chủ đạo, clear main_flowers để tránh chọn bừa
            if (missingItems.some(i => i.startsWith('Hoa '))) {
                session.selectedItems.main_flowers = [];
            }
        }

        // Kiểm tra Giấy gói
        if (e.wrapper && !session.selectedItems.wrapper) {
            missingItems.push(`Giấy gói (${e.wrapper})`);
        }

        // Kiểm tra Ruy băng
        if (e.ribbon && !session.selectedItems.ribbon) {
            missingItems.push(`Ruy băng (${e.ribbon})`);
        }

        // Kiểm tra Giỏ/Lẵng (nếu user không yêu cầu bó hoa mà yêu cầu giỏ/lẵng/hộp nhưng không tìm thấy)
        if (e.category && e.category !== 'bó' && !session.selectedItems.basket) {
            missingItems.push(`Phụ kiện cắm (${e.category})`);
        }

        if (missingItems.length > 0) {
            return {
                success: true,
                reply: `Hiện tại cửa hàng đang tạm hết các mặt hàng: ${missingItems.join(', ')}. Bạn có thể chọn loại khác giúp mình được không ạ?`,
                extractedEntities: e,
                status: 'missing_items',
                outOfStockWarnings: missingItems.map(item => ({ item: { name: item } }))
            };
        }

        // Tính tổng giá (SỬ DỤNG product.price * quantity)
        const calculateTotal = (items) => {
            if (!items) return 0;
            if (Array.isArray(items)) {
                return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            }
            return (items.price || 0) * (items.quantity || 1);
        };

        session.current_bouquet.total_price = 
            calculateTotal(session.selectedItems.basket) +
            calculateTotal(session.selectedItems.wrapper) +
            calculateTotal(session.selectedItems.ribbon) +
            calculateTotal(session.selectedItems.main_flowers) +
            calculateTotal(session.selectedItems.sub_flowers) +
            calculateTotal(session.selectedItems.accessories);

        // Debug Logging
        console.log(`[HydrangeaService] AI Entities:`, JSON.stringify(e));
        const logBreakdown = (p) => ({
            name: p.name,
            score: p._score,
            breakdown: p._breakdown,
            quantity: p.quantity
        });
        console.log(`[HydrangeaService] Matched Main Flowers:`, JSON.stringify(suggestedItems.main_flowers.map(logBreakdown), null, 2));
        console.log(`[HydrangeaService] Matched Sub Flowers:`, JSON.stringify(suggestedItems.sub_flowers.map(logBreakdown), null, 2));
        console.log(`[HydrangeaService] Final Selected Price:`, session.current_bouquet.total_price);

        const outOfStockWarnings = [];
        if (e.flower_types?.length > 0) {
            outOfStock.forEach(oos => {
                const oosFt = [
                    ...(oos.main_flowers || []), 
                    ...(oos.sub_flowers || [])
                ].map(normalizeString);
                
                const matches = e.flower_types.some(ft =>
                    oosFt.some(f => f.includes(normalizeString(ft)) || normalizeString(ft).includes(f))
                );

                if (matches) {
                    const alternatives = inStock
                        .filter(p => {
                            const pFt = [
                                ...(p.main_flowers || []), 
                                ...(p.sub_flowers || [])
                            ].map(normalizeString);
                            return oosFt.some(f => pFt.some(pf => pf.includes(f) || f.includes(pf)));
                        })
                        .slice(0, 3)
                        .map(p => ({ _id: p._id, name: p.name, price: p.price, images: p.images }));

                    outOfStockWarnings.push({
                        item: { _id: oos._id, name: oos.name, product_type: oos.product_type },
                        alternatives
                    });
                }
            });
        }



        // Tính tổng giá
        const allSelectedPrices = [
            session.selectedItems.basket?.price || 0,
            session.selectedItems.wrapper?.price || 0,
            session.selectedItems.ribbon?.price || 0,
            ...session.selectedItems.main_flowers.map(f => f.price || 0),
            ...session.selectedItems.sub_flowers.map(f => f.price || 0),
            ...session.selectedItems.accessories.map(f => f.price || 0),
            // fallback complete bouquet
            ...(baskets.length === 0 && completeBouquets.length > 0 ? [completeBouquets[0]?.price || 0] : [])
        ];
        session.current_bouquet.total_price = allSelectedPrices.reduce((a, b) => a + b, 0);

        const hasItems = Object.values(suggestedItems).some(arr => arr.length > 0);
        const flowerStr = e.flower_types?.join(', ') || 'hoa';
        
        let reply = prefixMsg;
        if (missingFlowersFromDB.length > 0) {
            reply += `Rất tiếc, hiện tại kho của mình không có loại hoa **${missingFlowersFromDB.join(', ')}** như bạn yêu cầu. 😢 Mình đã tự động chọn các loại hoa có tông màu và phong cách tương tự, bạn xem ở danh sách bên cạnh nhé!`;
        } else if (outOfStockWarnings.length > 0) {
            reply += `Loại hoa ${flowerStr} bạn cần hiện đang tạm hết hàng mất rồi. 😢 Mình đã tìm một vài hoa thay thế tương tự, bạn xem ở danh sách bên cạnh nhé!`;
        } else if (hasItems) {
            reply += `Mình đã tìm thấy các thành phần phù hợp cho giỏ hoa ${flowerStr} của bạn! 🌸 Xem danh sách bên cạnh và nhấn **"Tạo Giỏ Hoa"** khi bạn hài lòng nhé.`;
        } else {
            reply += `Kho hàng chưa có đủ thành phần phù hợp. Mình sẽ gợi ý những mẫu bán chạy nhất!`;
        }

        session.history.push({ role: 'bot', text: reply, ts: new Date() });

        return {
            success: true,
            reply,
            extractedEntities: session.entities,
            status: 'suggesting',
            suggestedItems,
            selectedItems: session.selectedItems,
            outOfStockWarnings,
            totalPrice: session.current_bouquet.total_price,
        };
    }

    // ── Confirm: gọi Gemini tạo ảnh ─────────────────────────────────────────
    async _handleConfirm(session, sessionId) {
        const { entities, selectedItems } = session;

        const imageResult = await generateBouquetImage(entities, selectedItems);

        if (!imageResult.success) {
            return {
                success: false,
                reply: `❌ Chưa thể tạo ảnh lúc này: ${imageResult.error}`,
                extractedEntities: entities,
                status: 'error',
            };
        }

        // Lưu vào session
        session.generatedImage = {
            base64: imageResult.imageBase64,
            mimeType: imageResult.mimeType,
            modelUsed: imageResult.modelUsed,
            prompt: imageResult.prompt,
            generatedAt: new Date(),
        };

        return {
            success: true,
            reply: '✨ Giỏ hoa AI tạo đã sẵn sàng! Bạn thấy thế nào — đồng ý để lưu đơn hoặc tạo lại nhé!',
            extractedEntities: entities,
            status: 'image_ready',
            imageBase64: imageResult.imageBase64,
            mimeType: imageResult.mimeType,
            selectedItems,
            totalPrice: session.current_bouquet.total_price,
        };
    }

    // ── Tạo CustomBouquetOrder (v2 — Cloudinary URL, không lưu base64) ────────
    async createOrder(sessionId, userId, userDescription, note = '', selectedImage = null, promptUsed = null, imageMetadata = null) {
        const session = this.getSession(sessionId);

        const mapItem = (p) => p ? {
            product: p._id,
            name: p.name,
            price: p.price,
            image: p.images?.[0]?.url || null
        } : null;

        const orderData = {
            user: userId,
            sessionId,
            entities: session.entities,
            userDescription,
            selectedItems: {
                basket:       mapItem(session.selectedItems.basket),
                wrapper:      mapItem(session.selectedItems.wrapper),
                ribbon:       mapItem(session.selectedItems.ribbon),
                main_flowers: (session.selectedItems.main_flowers || []).map(f => ({ ...mapItem(f), quantity: 1 })),
                sub_flowers:  (session.selectedItems.sub_flowers  || []).map(f => ({ ...mapItem(f), quantity: 1 })),
                accessories:  (session.selectedItems.accessories  || []).map(a => ({ ...mapItem(a), quantity: 1 })),
            },
            totalPrice:    session.current_bouquet.total_price,
            // Lưu chỉ ảnh được chọn (Cloudinary URL — không lưu base64)
            generatedImages: selectedImage ? [{ ...selectedImage, selected: true }] : [],
            promptUsed:      promptUsed || null,
            imageMetadata:   imageMetadata || null,
            status:          'confirmed',
            note,
            chatHistory: session.history.slice(-20),
            confirmedAt: new Date(),
        };

        const order = await CustomBouquetOrder.create(orderData);
        return order;
    }

    // ── Update selected items từ frontend ────────────────────────────────────
    updateSelectedItems(sessionId, newSelectedItems) {
        const session = this.getSession(sessionId);
        session.selectedItems = { ...session.selectedItems, ...newSelectedItems };

        // Recalculate total
        const all = [
            session.selectedItems.basket,
            session.selectedItems.wrapper,
            session.selectedItems.ribbon,
            ...(session.selectedItems.main_flowers || []),
            ...(session.selectedItems.sub_flowers || []),
            ...(session.selectedItems.accessories || []),
        ].filter(Boolean);
        session.current_bouquet.total_price = all.reduce((s, p) => s + (p.price || 0), 0);
        return session.current_bouquet.total_price;
    }

    // ── Restore session từ DB ────────────────────────────────────────────────
    async restoreSession(orderId, userId) {
        const order = await CustomBouquetOrder.findOne({ _id: orderId, user: userId });
        if (!order) return null;
        
        const fresh = this._makeSession();
        fresh.entities = order.entities || fresh.entities;
        
        // Restore selectedItems (mapping back format)
        if (order.selectedItems) {
            const mapBack = (item) => item && item.product ? { _id: item.product, name: item.name, price: item.price, images: [{url: item.image}] } : null;
            fresh.selectedItems = {
                basket: mapBack(order.selectedItems.basket),
                wrapper: mapBack(order.selectedItems.wrapper),
                ribbon: mapBack(order.selectedItems.ribbon),
                main_flowers: (order.selectedItems.main_flowers || []).map(mapBack).filter(Boolean),
                sub_flowers: (order.selectedItems.sub_flowers || []).map(mapBack).filter(Boolean),
                accessories: (order.selectedItems.accessories || []).map(mapBack).filter(Boolean),
            };
        }
        
        fresh.current_bouquet.total_price = order.totalPrice;
        fresh.history = order.chatHistory || [];
        
        if (order.generatedImage && order.generatedImage.base64) {
            fresh.generatedImage = {
                base64: order.generatedImage.base64,
                mimeType: order.generatedImage.mimeType || 'image/png',
                prompt: order.generatedImage.prompt,
                modelUsed: order.generatedImage.model
            };
        }
        
        fresh.lastActivity = Date.now();
        sessions.set(order.sessionId, fresh);
        
        return {
            sessionId: order.sessionId,
            messages: fresh.history,
            entities: fresh.entities,
            selectedItems: fresh.selectedItems,
            totalPrice: fresh.current_bouquet.total_price,
            generatedImage: fresh.generatedImage ? { base64: fresh.generatedImage.base64, mimeType: fresh.generatedImage.mimeType } : null,
            status: fresh.generatedImage ? 'image_ready' : 'idle'
        };
    }
}

module.exports = new HydrangeaService();