/**
 * Back-end/ai/hydrangea/hydrangea.service.js v3
 * 
 * Features:
 * - Multi-turn: create / modify intents
 * - MODIFY: "đổi hoa hồng thành hoa lan" → update session + re-suggest
 * - Session state: current_bouquet (flowers, colors, occasion, style, budget)
 * - Graceful AI fallback nếu Python service timeout
 * - Structured output theo BouquetOutput schema
 */
const axios = require('axios');
const Product = require('../../models/Product');
const { classifyProducts, resolveLayoutName, buildExplanation } = require('../../utils/scoringService');
const { normalizeString } = require('../../utils/normalizer');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── In-memory session store ─────────────────────────────────────────────────
const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

class HydrangeaService {

    // ── Session management ───────────────────────────────────────────────────
    _makeSession() {
        return {
            entities: {
                flower_types: [],
                colors: [],
                color: null,         // compat
                occasion: null,
                style: null,
                budget: 0,
                target: null,
                role_hint: {},
            },
            current_bouquet: {
                items: [],
                image_url: null,
                total_price: 0,
                explanation: ''
            },
            intent: null,
            history: [],
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

        // Scalar overwrite
        ['occasion', 'style', 'target'].forEach(k => {
            if (newEntities[k]) sessionEntities[k] = newEntities[k];
        });

        // Budget
        if (newEntities.budget > 0) sessionEntities.budget = newEntities.budget;

        // Flowers: deduplicated union
        const newFlowers = [
            ...(newEntities.flower_types || []),
            ...(newEntities.flowers || []),
            ...(newEntities.flower_type ? [newEntities.flower_type] : [])
        ];
        if (newFlowers.length > 0) {
            const merged = new Set([...sessionEntities.flower_types, ...newFlowers]);
            sessionEntities.flower_types = Array.from(merged);
        }

        // Colors: deduplicated union
        const newColors = [
            ...(newEntities.colors || []),
            ...(newEntities.color ? [newEntities.color] : [])
        ];
        if (newColors.length > 0) {
            const merged = new Set([...sessionEntities.colors, ...newColors]);
            sessionEntities.colors = Array.from(merged);
            sessionEntities.color = sessionEntities.colors[0] || null;
        }

        // Role hint: merge (new overwrites per-flower)
        if (newEntities.role_hint && Object.keys(newEntities.role_hint).length > 0) {
            sessionEntities.role_hint = {
                ...sessionEntities.role_hint,
                ...newEntities.role_hint
            };
        }
    }

    // ── Budget parser (fallback khi AI service down) ─────────────────────────
    parseBudget(text) {
        const m = text.match(/(\d[\d.,]*)\s*(triệu|trieu|tr|nghìn|nghin|k)?\b/i);
        if (!m) return 0;
        let num = parseFloat(m[1].replace(/[.,]/g, ''));
        const unit = (m[2] || '').toLowerCase();
        if (['triệu', 'trieu', 'tr'].includes(unit)) num *= 1_000_000;
        else if (['nghìn', 'nghin', 'k'].includes(unit)) num *= 1_000;
        return num;
    }

    // ── Intent inference khi AI timeout ────────────────────────────────────
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

    // ── MODIFY: extract flower changes từ text ────────────────────────────────
    applyModifyOps(sessionEntities, modifyOps = []) {
        if (!modifyOps || modifyOps.length === 0) return false;

        let changed = false;
        const norm = v => normalizeString(String(v || ''));

        modifyOps.forEach(op => {
            if (op.op === 'replace' && op.from && op.to) {
                // Tìm và thay thế loài hoa trong flower_types
                const fromNorm = norm(op.from);
                const toNorm = norm(op.to);
                const idx = sessionEntities.flower_types.findIndex(f =>
                    norm(f).includes(fromNorm) || fromNorm.includes(norm(f))
                );
                if (idx >= 0) {
                    sessionEntities.flower_types[idx] = toNorm;
                    changed = true;
                    // Cập nhật role_hint
                    if (sessionEntities.role_hint[fromNorm]) {
                        const role = sessionEntities.role_hint[fromNorm];
                        delete sessionEntities.role_hint[fromNorm];
                        sessionEntities.role_hint[toNorm] = role;
                    }
                }
            } else if (op.op === 'remove' && op.from) {
                const fromNorm = norm(op.from);
                const before = sessionEntities.flower_types.length;
                sessionEntities.flower_types = sessionEntities.flower_types.filter(f =>
                    !norm(f).includes(fromNorm) && !fromNorm.includes(norm(f))
                );
                if (sessionEntities.flower_types.length !== before) changed = true;
            } else if (op.op === 'add' && op.to) {
                const toNorm = norm(op.to);
                if (!sessionEntities.flower_types.includes(toNorm)) {
                    sessionEntities.flower_types.push(toNorm);
                    changed = true;
                }
            }
        });

        return changed;
    }

    // ── Main chat processor ──────────────────────────────────────────────────
    async processChat(sessionId, message, isConfirming = false, incomingEntities = null) {
        const session = this.getSession(sessionId);

        // Client gửi entities trực tiếp
        if (incomingEntities && Object.keys(incomingEntities).length > 0) {
            this.mergeEntities(session.entities, incomingEntities);
        }

        if (isConfirming) {
            return this._handleConfirm(session);
        }

        if (!message?.trim()) {
            return this._handleSuggest(session);
        }

        // ── Gọi Python AI service ────────────────────────────────────────
        let aiResult = null;
        try {
            const resp = await axios.post(`${AI_SERVICE_URL}/api/hydrangea/analyze`, {
                text: message
            }, { timeout: 8000 });
            aiResult = resp.data;
            console.log('[Hydrangea] AI result:', JSON.stringify(aiResult.entities || {}).substring(0, 200));
        } catch (err) {
            console.warn('[Hydrangea] AI service unavailable:', err.message, '— using keyword fallback');
        }

        // ── Merge AI entities ────────────────────────────────────────────
        const aiEntities = aiResult?.entities || {};
        this.mergeEntities(session.entities, aiEntities);

        // ── Budget fallback ──────────────────────────────────────────────
        if (!session.entities.budget) {
            const b = this.parseBudget(message);
            if (b > 0) session.entities.budget = b;
        }

        // ── Intent routing ───────────────────────────────────────────────
        const intent = aiResult?.intent || this.inferIntent(message, session);
        session.intent = intent;
        session.history.push({ role: 'user', text: message, ts: Date.now() });
        console.log(`[Hydrangea] intent=${intent}, entities:`, session.entities);

        // ── MODIFY: apply changes ─────────────────────────────────────────
        if (intent === 'MODIFY' && aiEntities.modify_ops?.length > 0) {
            const changed = this.applyModifyOps(session.entities, aiEntities.modify_ops);
            if (changed) {
                const opsDesc = aiEntities.modify_ops
                    .map(op => op.op === 'replace'
                        ? `đổi "${op.from}" → "${op.to}"`
                        : op.op === 'remove' ? `bỏ "${op.from}"`
                        : `thêm "${op.to}"`)
                    .join(', ');
                session.history.push({ role: 'bot', text: `Đã ${opsDesc}. Đang tìm lại cho bạn...` });
                return this._handleSuggest(session, `Đã cập nhật! `);
            }
        }

        // ── ASK_PRICE ─────────────────────────────────────────────────────
        if (intent === 'ASK_PRICE') {
            const totalPrice = session.current_bouquet.total_price;
            const reply = totalPrice > 0
                ? `Giỏ hoa hiện tại tổng khoảng **${new Intl.NumberFormat('vi-VN').format(totalPrice)}đ**. Bạn muốn điều chỉnh ngân sách không?`
                : `Bạn muốn ngân sách khoảng bao nhiêu? (ví dụ: 500k, 1 triệu...)`;
            return { success: true, reply, extractedEntities: session.entities, status: 'continue', suggestedProducts: [] };
        }

        // ── Không đủ info → hỏi thêm ────────────────────────────────────
        if (!this.hasCoreEntities(session.entities)) {
            return {
                success: true,
                reply: 'Mình cần biết thêm chút xíu! 🌸 Bạn muốn tặng ai, dịp gì, hay thích tông màu/loài hoa nào không?',
                extractedEntities: session.entities,
                status: 'continue',
                suggestedProducts: []
            };
        }

        return this._handleSuggest(session);
    }

    // ── Suggest products ─────────────────────────────────────────────────────
    async _handleSuggest(session, prefixMsg = '') {
        const products = await Product.find({ status: 'active', stock: { $gt: 0 } })
            .select('name price images dominant_color secondary_colors main_flowers sub_flowers occasion style sold priority _id')
            .lean();

        const { main, secondary, all } = classifyProducts(products, session.entities);

        const topProducts = [...main, ...secondary]
            .sort((a, b) => b._score - a._score)
            .slice(0, 6)
            .map(p => ({
                ...p,
                aiScore: Math.round(p._score * 10),
                role: main.includes(p) ? 'main' : 'secondary'
            }));

        // Fallback: hàng phổ biến nhất
        if (topProducts.length === 0) {
            const fallback = await Product.find({ status: 'active' })
                .sort({ sold: -1 }).limit(4).lean();
            return {
                success: true,
                reply: 'Kho hàng chưa có mẫu khớp chính xác! Đây là những mẫu bán chạy nhất:',
                extractedEntities: session.entities,
                status: 'suggesting',
                suggestedProducts: fallback,
                classification: { main: [], secondary: [] }
            };
        }

        // Cập nhật current_bouquet state
        const totalPrice = topProducts.slice(0, 3).reduce((s, p) => s + (p.price || 0), 0);
        const explanation = buildExplanation(session.entities, main, secondary);
        session.current_bouquet = {
            items: topProducts.slice(0, 3),
            total_price: totalPrice,
            explanation
        };

        const flowerStr = session.entities.flower_types?.join(', ') || 'đẹp';
        const colorStr = session.entities.colors?.[0] || session.entities.color || '';
        const reply = prefixMsg +
            `Tìm thấy ${topProducts.length} mẫu ${flowerStr}${colorStr ? ' tông ' + colorStr : ''} phù hợp nhất! 🌸 Bạn thích mẫu nào?`;

        return {
            success: true,
            reply,
            extractedEntities: session.entities,
            status: 'suggesting',
            suggestedProducts: topProducts,
            classification: {
                main: main.map(p => p._id),
                secondary: secondary.map(p => p._id)
            },
            current_bouquet: session.current_bouquet
        };
    }

    // ── Confirm (trigger image gen) ──────────────────────────────────────────
    async _handleConfirm(session) {
        return {
            success: true,
            reply: '✨ Đang cắm hoa cho bạn, chờ mình xíu nhé...',
            extractedEntities: session.entities,
            status: 'generating',
            triggerImageGeneration: true,
            imageEntities: session.entities,
            current_bouquet: session.current_bouquet
        };
    }
}

module.exports = new HydrangeaService();