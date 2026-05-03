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
    }
};

class HydrangeaService {

    // ── Session management ───────────────────────────────────────────────────
    _makeSession() {
        return {
            entities: {
                flower_types: [], colors: [], color: null,
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

        ['occasion', 'style', 'target', 'category', 'wrapper', 'ribbon'].forEach(k => {
            if (newEntities[k]) sessionEntities[k] = newEntities[k];
        });
        if (newEntities.accessories?.length > 0) {
            sessionEntities.accessories = Array.from(new Set([...(sessionEntities.accessories || []), ...newEntities.accessories]));
        }
        if (newEntities.budget > 0) sessionEntities.budget = newEntities.budget;

        const newFlowers = [
            ...(newEntities.flower_types || []),
            ...(newEntities.flowers || []),
            ...(newEntities.flower_type ? [newEntities.flower_type] : [])
        ];
        if (newFlowers.length > 0) {
            // FIX 1: Ghi đè (replace) thay vì gộp (append)
            sessionEntities.flower_types = newFlowers;
            
            // Xóa lựa chọn hoa hiện tại để hệ thống tự động tìm hoa mới
            if (session.selectedItems) {
                session.selectedItems.main_flowers = [];
                session.selectedItems.sub_flowers = [];
            }
        }

        const newColors = [...(newEntities.colors || []), ...(newEntities.color ? [newEntities.color] : [])];
        if (newColors.length > 0) {
            // FIX 1: Ghi đè màu
            sessionEntities.colors = newColors;
            sessionEntities.color = sessionEntities.colors[0] || null;
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
        if (!e.category && !asked.has('category')) return 'category';
        if (!e.wrapper && !asked.has('wrapper')) return 'wrapper';
        if (!e.note && !asked.has('note')) return 'note';
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
        if (isConfirming) return this._handleConfirm(session, sessionId);
        if (!message?.trim()) return this._handleSuggest(session);

        // Nếu đang trong trạng thái hỏi 'note'
        if (session.asking_for === 'note' && message?.trim()) {
            const lowMsg = message.trim().toLowerCase();
            if (!['không', 'không cần', 'bỏ qua', 'ko', 'ko cần'].includes(lowMsg)) {
                session.entities.note = message.trim();
            } else {
                session.entities.note = '';
            }
            session.asking_for = null;
            session.missingDataAsked.add('note');
            // Sau khi có note, tiếp tục quy trình để gen ảnh hoặc hỏi tiếp
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

        // Score function
        const score = (product) => {
            let s = 0;
            const pNameN = norm(product.name);
            const pColorN = norm(product.dominant_color || '');
            const pColorsAll = [pColorN, ...(product.secondary_colors || []).map(c => norm(c))];

            // === WRAPPER: ưu tiên màu sắc dominant_color, sau đó mới tên ===
            if (product.product_type === 'wrapper' && e.wrapper) {
                const wN = norm(e.wrapper);
                // Nếu entity wrapper là màu sắc → match dominant_color trước (điểm cao)
                if (pColorsAll.some(c => c.includes(wN) || wN.includes(c))) s += 60;
                // Match tên sản phẩm (ít ưu tiên hơn)
                if (pNameN.includes(wN)) s += 20;
            }

            // === RIBBON: ưu tiên màu sắc dominant_color ===
            if (product.product_type === 'ribbon' && e.ribbon) {
                const rN = norm(e.ribbon);
                if (pColorsAll.some(c => c.includes(rN) || rN.includes(c))) s += 60;
                if (pNameN.includes(rN)) s += 20;
            }

            // === WRAPPER/RIBBON: match màu chung từ entities.colors (fallback) ===
            if (product.product_type === 'wrapper' || product.product_type === 'ribbon') {
                e.colors?.forEach(c => {
                    const cN = norm(c);
                    if (pColorsAll.some(pc => pc.includes(cN) || cN.includes(pc))) s += 10;
                });
            }

            // === BASKET ===
            if (product.product_type === 'basket' && e.category) {
                const cN = norm(e.category);
                if (pNameN.includes(cN) || cN.includes(pNameN)) s += 50;
            }

            // === ACCESSORIES ===
            if (product.product_type === 'accessory' && e.accessories?.length > 0) {
                e.accessories.forEach(acc => {
                    const aN = norm(acc);
                    if (pNameN.includes(aN) || aN.includes(pNameN)) s += 50;
                });
            }

            // === HOA CHÍNH (flower_component / main_flower) ===
            // PHẢI match flower_type trước, rồi mới tính màu
            if (product.product_type === 'flower_component') {
                let flowerTypeMatched = false;

                e.flower_types?.forEach(ft => {
                    const ftN = norm(ft);
                    // Match tên loại hoa trong product.main_flowers[], sub_flowers[], tên sản phẩm
                    const nameMatch    = pNameN.includes(ftN);
                    const mainMatch    = product.main_flowers?.some(f => norm(f).includes(ftN) || ftN.includes(norm(f)));
                    const subMatch     = product.sub_flowers?.some(f => norm(f).includes(ftN) || ftN.includes(norm(f)));

                    if (mainMatch) { s += 80; flowerTypeMatched = true; }  // Match loại hoa chính → điểm rất cao
                    if (subMatch)  { s += 40; flowerTypeMatched = true; }
                    if (nameMatch) { s += 50; flowerTypeMatched = true; }
                });

                // Màu sắc chỉ cộng điểm nếu loại hoa đã match, hoặc không có flower_type entity
                const colorWeight = (flowerTypeMatched || !e.flower_types?.length) ? 20 : 2;
                e.colors?.forEach(c => {
                    const cN = norm(c);
                    if (pColorsAll.some(pc => pc.includes(cN) || cN.includes(pc))) s += colorWeight;
                });
            } else {
                // Các loại sản phẩm khác: color match bình thường
                e.colors?.forEach(c => {
                    const cN = norm(c);
                    if (pColorsAll.some(pc => pc.includes(cN) || cN.includes(pc))) s += 15;
                });
            }

            // Occasion
            if (e.occasion && product.occasion?.some(o => norm(o).includes(norm(e.occasion)) || norm(e.occasion).includes(norm(o)))) s += 25;

            // Style
            if (e.style && product.style?.some(st => norm(st).includes(norm(e.style)))) s += 15;

            // Popularity boost
            s += Math.min((product.sold || 0) * 0.1, 10);

            return s;
        };

        // Chọn basket tốt nhất
        let baskets = inStock
            .filter(p => p.product_type === 'basket')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);
            
        // FIX 3: Cắt cứng logic category cho basket (đảm bảo bó hoa không có giỏ)
        if (e.category) {
            const catNorm = norm(e.category);
            if (catNorm.includes('bó')) {
                baskets = []; // Bó hoa thì không dùng giỏ
            } else if (catNorm.includes('giỏ') || catNorm.includes('lẵng') || catNorm.includes('hộp') || catNorm.includes('kệ')) {
                // Chỉ giữ lại những basket có keyword tương ứng trong tên
                // VD: Hộp hoa thì tên basket phải có chữ 'hộp'
                baskets = baskets.filter(p => {
                    const pNameNorm = norm(p.name);
                    const keyword = catNorm.includes('giỏ') ? 'giỏ' : 
                                    catNorm.includes('lẵng') ? 'lẵng' : 
                                    catNorm.includes('hộp') ? 'hộp' : 
                                    catNorm.includes('kệ') ? 'kệ' : null;
                    return keyword ? pNameNorm.includes(keyword) : true;
                });
            }
        }

        // Chọn wrapper
        const wrappers = inStock
            .filter(p => p.product_type === 'wrapper')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Chọn ribbon
        const ribbons = inStock
            .filter(p => p.product_type === 'ribbon')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Hoa chính
        const mainFlowers = inStock
            .filter(p => p.product_type === 'flower_component' && p.role_type === 'main_flower')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Hoa phụ
        const subFlowers = inStock
            .filter(p => p.product_type === 'flower_component' && p.role_type === 'sub_flower')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Phụ kiện
        const accessories = inStock
            .filter(p => p.product_type === 'accessory')

            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Complete bouquet (legacy fallback)
        const completeBouquets = inStock
            .filter(p => p.product_type === 'complete_bouquet' || !p.product_type)
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

        // Out-of-stock items người dùng muốn + alternatives
        const outOfStockWarnings = [];
        if (e.flower_types?.length > 0) {
            outOfStock.forEach(oos => {
                const oosFt = [...(oos.main_flowers || []), ...(oos.sub_flowers || [])];
                const matches = e.flower_types.some(ft =>
                    oosFt.some(f => normalizeString(f).includes(normalizeString(ft)) || normalizeString(ft).includes(normalizeString(f)))
                );
                if (matches) {
                    // Tìm alternatives in-stock
                    const alternatives = inStock
                        .filter(p => {
                            const pFt = [...(p.main_flowers || []), ...(p.sub_flowers || [])];
                            return oosFt.some(f => pFt.some(pf =>
                                normalizeString(f).includes(normalizeString(pf)) || normalizeString(pf).includes(normalizeString(f))
                            ));
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

        // Check missing flowers from DB entirely
        const missingFlowersFromDB = [];
        if (e.flower_types?.length > 0) {
            e.flower_types.forEach(ft => {
                const ftN = normalizeString(ft);
                const foundAny = allProducts.some(p => {
                    return (p.main_flowers?.some(f => normalizeString(f).includes(ftN) || ftN.includes(normalizeString(f)))) ||
                           (p.sub_flowers?.some(f => normalizeString(f).includes(ftN) || ftN.includes(normalizeString(f)))) ||
                           (normalizeString(p.name).includes(ftN));
                });
                if (!foundAny) missingFlowersFromDB.push(ft);
            });
        }

        // Build structured items response
        const suggestedItems = {
            basket: baskets.slice(0, 3),
            wrapper: wrappers.slice(0, 3),
            ribbon: ribbons.slice(0, 3),
            main_flowers: mainFlowers.slice(0, 4),
            sub_flowers: subFlowers.slice(0, 3),
            accessories: accessories.slice(0, 3),
            complete_bouquets: completeBouquets.slice(0, 6), // fallback
        };

        // ── Auto-select items tốt nhất cho session ───────────────────────
        // HOA CHÍNH: CHỈ chọn nếu score >= 50 (có match đúng loại hoa)
        const mainAutoFilled = e.flower_types?.length > 0
            ? mainFlowers.filter(f => f._score >= 50).slice(0, 2)
            : mainFlowers.slice(0, 2);

        session.selectedItems = {
            basket: baskets[0] || null,
            // Wrapper: nếu entity.wrapper tồn tại → chọn lại theo score mới (màu đúng)
            wrapper: e.wrapper ? (wrappers[0] || null) : (session.selectedItems.wrapper || wrappers[0] || null),
            // Ribbon: tương tự
            ribbon:  e.ribbon  ? (ribbons[0]  || null) : (session.selectedItems.ribbon  || ribbons[0]  || null),
            main_flowers: session.selectedItems.main_flowers?.length ? session.selectedItems.main_flowers : mainAutoFilled,
            sub_flowers:  session.selectedItems.sub_flowers?.length  ? session.selectedItems.sub_flowers  : subFlowers.slice(0, 1),
            // Không tự động thêm phụ kiện nếu user không yêu cầu
            accessories:  session.selectedItems.accessories?.length  ? session.selectedItems.accessories  : (e.accessories?.length ? accessories.slice(0, 1) : []),
        };

        // Nếu HOA CHÍNH hoàn toàn không có trong kho → không nhét bừa loại hoa khác
        if (missingFlowersFromDB.length > 0) {
            session.selectedItems.main_flowers = [];
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