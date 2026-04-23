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
const { generateBouquetImage } = require('./gemini.image.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map();

// ── Câu hỏi bổ sung thông minh ───────────────────────────────────────────────
const MISSING_DATA_QUESTIONS = {
    flower_types: {
        question: 'Bạn thích loài hoa nào? 🌸',
        chips: ['Hoa hồng', 'Hoa cúc', 'Hoa ly', 'Hướng dương', 'Hoa lavender', 'Hoa tulip']
    },
    colors: {
        question: 'Bạn muốn tông màu gì?',
        chips: ['Đỏ', 'Hồng', 'Trắng', 'Tím', 'Vàng', 'Cam', 'Xanh']
    },
    occasion: {
        question: 'Giỏ hoa dành cho dịp nào? 🎉',
        chips: ['Sinh nhật', 'Khai trương', 'Valentine', 'Tốt nghiệp', 'Tặng mẹ', 'Anniversary', 'Chia buồn']
    },
    style: {
        question: 'Bạn muốn phong cách giỏ hoa như thế nào?',
        chips: ['Sang trọng', 'Đơn giản', 'Vintage', 'Hiện đại', 'Dễ thương', 'Tối giản']
    },
    budget: {
        question: 'Ngân sách của bạn khoảng bao nhiêu?',
        chips: ['Dưới 300k', '300k - 500k', '500k - 1 triệu', 'Trên 1 triệu']
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
            },
            selectedItems: {
                basket: null, wrapper: null, ribbon: null,
                main_flowers: [], sub_flowers: [], accessories: []
            },
            current_bouquet: { items: [], image_url: null, total_price: 0, explanation: '' },
            intent: null,
            history: [],
            missingDataAsked: new Set(),
            lastActivity: Date.now()
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
    mergeEntities(sessionEntities, newEntities) {
        if (!newEntities) return;
        ['occasion', 'style', 'target'].forEach(k => {
            if (newEntities[k]) sessionEntities[k] = newEntities[k];
        });
        if (newEntities.budget > 0) sessionEntities.budget = newEntities.budget;

        const newFlowers = [
            ...(newEntities.flower_types || []),
            ...(newEntities.flowers || []),
            ...(newEntities.flower_type ? [newEntities.flower_type] : [])
        ];
        if (newFlowers.length > 0) {
            sessionEntities.flower_types = Array.from(new Set([...sessionEntities.flower_types, ...newFlowers]));
        }

        const newColors = [...(newEntities.colors || []), ...(newEntities.color ? [newEntities.color] : [])];
        if (newColors.length > 0) {
            sessionEntities.colors = Array.from(new Set([...sessionEntities.colors, ...newColors]));
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
        // Ưu tiên: flowers → occasion → colors → style → budget
        if (!e.flower_types?.length && !asked.has('flower_types')) return 'flower_types';
        if (!e.occasion && !asked.has('occasion')) return 'occasion';
        if (!e.colors?.length && !asked.has('colors')) return 'colors';
        if (!e.style && !asked.has('style')) return 'style';
        if (!e.budget && !asked.has('budget')) return 'budget';
        return null;
    }

    // ── MODIFY ops ───────────────────────────────────────────────────────────
    applyModifyOps(sessionEntities, modifyOps = []) {
        if (!modifyOps?.length) return false;
        let changed = false;
        const norm = v => normalizeString(String(v || ''));
        modifyOps.forEach(op => {
            if (op.op === 'replace' && op.from && op.to) {
                const idx = sessionEntities.flower_types.findIndex(f =>
                    norm(f).includes(norm(op.from)) || norm(op.from).includes(norm(f)));
                if (idx >= 0) { sessionEntities.flower_types[idx] = norm(op.to); changed = true; }
            } else if (op.op === 'remove' && op.from) {
                const before = sessionEntities.flower_types.length;
                sessionEntities.flower_types = sessionEntities.flower_types.filter(f =>
                    !norm(f).includes(norm(op.from)) && !norm(op.from).includes(norm(f)));
                if (sessionEntities.flower_types.length !== before) changed = true;
            } else if (op.op === 'add' && op.to) {
                const toNorm = norm(op.to);
                if (!sessionEntities.flower_types.includes(toNorm)) {
                    sessionEntities.flower_types.push(toNorm); changed = true;
                }
            }
        });
        return changed;
    }

    // ── Main chat processor ──────────────────────────────────────────────────
    async processChat(sessionId, message, isConfirming = false, incomingEntities = null) {
        const session = this.getSession(sessionId);

        if (incomingEntities && Object.keys(incomingEntities).length > 0) {
            this.mergeEntities(session.entities, incomingEntities);
        }
        if (isConfirming) return this._handleConfirm(session, sessionId);
        if (!message?.trim()) return this._handleSuggest(session);

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
        this.mergeEntities(session.entities, aiEntities);

        if (!session.entities.budget) {
            const b = this.parseBudget(message);
            if (b > 0) session.entities.budget = b;
        }

        const intent = aiResult?.intent || this.inferIntent(message, session);
        session.intent = intent;
        session.history.push({ role: 'user', text: message, ts: new Date() });

        // MODIFY intent
        if (intent === 'MODIFY' && aiEntities.modify_ops?.length > 0) {
            const changed = this.applyModifyOps(session.entities, aiEntities.modify_ops);
            if (changed) {
                const opsDesc = aiEntities.modify_ops.map(op =>
                    op.op === 'replace' ? `đổi "${op.from}" → "${op.to}"` :
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
        if (!this.hasCoreEntities(session.entities)) {
            const missingField = this._getMissingField(session);
            if (missingField) {
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

        const inStock = allProducts.filter(p => p.stock > 0);
        const outOfStock = allProducts.filter(p => p.stock === 0);

        // Score function — không lọc theo targetType (đã filter ở trước)
        const score = (product) => {
            let s = 0;
            const norm = v => normalizeString(String(v || ''));

            // Flower match
            e.flower_types?.forEach(ft => {
                const ftN = norm(ft);
                if (product.main_flowers?.some(f => norm(f).includes(ftN) || ftN.includes(norm(f)))) s += 30;
                if (product.sub_flowers?.some(f => norm(f).includes(ftN) || ftN.includes(norm(f)))) s += 15;
                if (norm(product.name).includes(ftN)) s += 20;
            });

            // Color match
            e.colors?.forEach(c => {
                const cN = norm(c);
                if (norm(product.dominant_color || '').includes(cN) || cN.includes(norm(product.dominant_color || ''))) s += 20;
                if (product.secondary_colors?.some(sc => norm(sc).includes(cN))) s += 10;
            });

            // Occasion match
            if (e.occasion && product.occasion?.some(o => norm(o).includes(norm(e.occasion)) || norm(e.occasion).includes(norm(o)))) s += 25;

            // Style match
            if (e.style && product.style?.some(st => norm(st).includes(norm(e.style)))) s += 15;

            // Popularity boost
            s += Math.min((product.sold || 0) * 0.1, 10);

            return s;
        };

        // Chọn basket tốt nhất
        const baskets = inStock
            .filter(p => p.product_type === 'basket')
            .map(p => ({ ...p, _score: score(p) }))
            .sort((a, b) => b._score - a._score);

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

        // Auto-select items tốt nhất cho session
        session.selectedItems = {
            basket: baskets[0] || null,
            wrapper: wrappers[0] || null,
            ribbon: ribbons[0] || null,
            main_flowers: mainFlowers.slice(0, 2),
            sub_flowers: subFlowers.slice(0, 1),
            accessories: accessories.slice(0, 1),
        };

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
        const reply = prefixMsg + (hasItems
            ? `Mình đã tìm thấy các thành phần phù hợp cho giỏ hoa ${flowerStr} của bạn! 🌸 Xem danh sách bên cạnh và nhấn **"Tạo Giỏ Hoa"** khi bạn hài lòng nhé.`
            : `Kho hàng chưa có đủ thành phần phù hợp. Mình sẽ gợi ý những mẫu bán chạy nhất!`
        );

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

    // ── Tạo CustomBouquetOrder ───────────────────────────────────────────────
    async createOrder(sessionId, userId, userDescription, note = '') {
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
                basket: mapItem(session.selectedItems.basket),
                wrapper: mapItem(session.selectedItems.wrapper),
                ribbon: mapItem(session.selectedItems.ribbon),
                main_flowers: (session.selectedItems.main_flowers || []).map(f => ({ ...mapItem(f), quantity: 1 })),
                sub_flowers: (session.selectedItems.sub_flowers || []).map(f => ({ ...mapItem(f), quantity: 1 })),
                accessories: (session.selectedItems.accessories || []).map(a => ({ ...mapItem(a), quantity: 1 })),
            },
            totalPrice: session.current_bouquet.total_price,
            generatedImage: session.generatedImage ? {
                base64: session.generatedImage.base64,
                generatedAt: session.generatedImage.generatedAt,
                prompt: session.generatedImage.prompt,
                model: session.generatedImage.modelUsed,
            } : undefined,
            status: 'confirmed',
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
}

module.exports = new HydrangeaService();