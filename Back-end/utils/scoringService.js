/**
 * Back-end/utils/scoringService.js v3
 * 
 * Scoring formula:
 *   score = (context_weight + frequency + db_priority) / maxScore
 *   context_weight = flower:5 + color:3 + occasion:2 + style:2 + budget:1.5
 *   frequency = product.sold (normalized, +1.0 max)
 *   db_priority = product.priority (+1.0 max)
 * 
 * role_hint boost:
 *   product matches role_hint "main" → +0.5 added AFTER normalization (capped at 1.0)
 *   product matches role_hint "secondary" → +0.2
 */

const { normalizeString } = require('./normalizer');

/**
 * Chuẩn hóa chuỗi so sánh
 */
function norm(v) {
    return v ? normalizeString(String(v)) : '';
}

/**
 * Kiểm tra product có thuộc role_hint "main" hay "secondary" không
 * @param {Object} product
 * @param {Object} role_hint  { "rose": "main", "orchid": "secondary" }
 * @returns {'main'|'secondary'|null}
 */
function productRoleFromHint(product, role_hint = {}) {
    if (!role_hint || Object.keys(role_hint).length === 0) return null;

    const productFlowers = [
        ...(product.main_flowers || []).map(f => norm(typeof f === 'string' ? f : f.type)),
        norm(product.name)
    ];

    for (const [flowerName, role] of Object.entries(role_hint)) {
        const fn = norm(flowerName);
        if (productFlowers.some(pf => pf.includes(fn) || fn.includes(pf))) {
            return role; // 'main' | 'secondary'
        }
    }
    return null;
}

/**
 * Tính score cho 1 product
 * 
 * @param {Object} product - Mongoose lean doc
 * @param {Object} entities
 *   {
 *     flower_types: string[],
 *     colors: string[],        // v3 có colors[]
 *     color: string,           // compat
 *     occasion: string,
 *     style: string,
 *     budget: number,
 *     role_hint: {},
 *   }
 * @returns {number} 0.0 – 1.0 (sau khi áp role boost: có thể thấp hơn 1.5 trước cap)
 */
function scoreProduct(product, entities = {}) {
    let rawScore = 0;
    let maxScore = 0;

    // ── 1. Flower type match (+5 per match, capped) ──────────────────────────
    const flowerTypes = entities.flower_types || [];
    if (flowerTypes.length > 0) {
        maxScore += 5;
        const productFlowers = (product.main_flowers || []).map(f =>
            norm(typeof f === 'string' ? f : f.type || '')
        );
        const productName = norm(product.name || '');

        flowerTypes.forEach(ft => {
            const fn = norm(ft);
            if (
                productFlowers.some(pf => pf.includes(fn) || fn.includes(pf)) ||
                productName.includes(fn)
            ) {
                rawScore += 5;
            }
        });
    }

    // ── 2. Color match (+3) — hỗ trợ cả colors[] lẫn color string ───────────
    const colors = [
        ...(Array.isArray(entities.colors) ? entities.colors : []),
        ...(entities.color ? [entities.color] : [])
    ].filter(Boolean);

    if (colors.length > 0) {
        maxScore += 3;
        const domColor = norm(product.dominant_color || '');
        const secColors = (product.secondary_colors || []).map(norm);
        const productText = norm((product.description || '') + ' ' + (product.name || ''));

        colors.forEach(c => {
            const cn = norm(c);
            if (
                domColor.includes(cn) || cn.includes(domColor) ||
                secColors.some(sc => sc.includes(cn) || cn.includes(sc)) ||
                productText.includes(cn)
            ) {
                rawScore += 3;
            }
        });
    }

    // ── 3. Occasion match (+2) ───────────────────────────────────────────────
    if (entities.occasion) {
        maxScore += 2;
        const occ = norm(entities.occasion);
        const productOccs = (product.occasion || []).map(norm);
        if (productOccs.some(po => po.includes(occ) || occ.includes(po))) {
            rawScore += 2;
        }
    }

    // ── 4. Style match (+2) ──────────────────────────────────────────────────
    if (entities.style) {
        maxScore += 2;
        const st = norm(entities.style);
        const productStyles = (product.style || []).map(norm);
        if (productStyles.some(ps => ps.includes(st) || st.includes(ps))) {
            rawScore += 2;
        }
    }

    // ── 5. Budget fit (+1.5) ─────────────────────────────────────────────────
    if (entities.budget && entities.budget > 0) {
        maxScore += 1.5;
        const budget = entities.budget;
        const price = product.price || 0;
        // Trong range ±30%
        if (price >= budget * 0.7 && price <= budget * 1.3) {
            rawScore += 1.5;
        } else if (price <= budget) {
            // Dưới budget nhưng ngoài range → partial credit
            rawScore += 0.7;
        }
    }

    // ── 6. Frequency (product.sold normalized, +1.0 max) ─────────────────────
    if (product.sold != null && product.sold > 0) {
        maxScore += 1.0;
        // Normalize: giả sử bestseller có 1000 đơn
        const normalizedSold = Math.min(product.sold / 1000, 1.0);
        rawScore += normalizedSold;
    }

    // ── 7. DB priority (+1.0 max) ────────────────────────────────────────────
    if (product.priority != null) {
        maxScore += 1.0;
        rawScore += Math.min(product.priority / 10, 1.0); // priority 0-10
    }

    if (maxScore === 0) return 0;
    let normalizedScore = Math.min(rawScore / maxScore, 1.0);

    // ── 8. role_hint boost (sau khi normalize) ───────────────────────────────
    const role = productRoleFromHint(product, entities.role_hint);
    if (role === 'main') {
        normalizedScore = Math.min(normalizedScore + 0.5, 1.0);
    } else if (role === 'secondary') {
        normalizedScore = Math.min(normalizedScore + 0.2, 1.0);
    }

    return normalizedScore;
}

/**
 * Phân loại sản phẩm thành main / secondary / decoration
 * Support multiple main flowers (maxMain = max(2, flower_types.length))
 * 
 * @param {Array} products
 * @param {Object} entities
 * @param {Object} opts
 * @returns {{ main, secondary, decoration, all }}
 */
function classifyProducts(products = [], entities = {}, opts = {}) {
    // maxMain = flower_types.length nếu có nhiều loài, min 1, max 5
    const flowerCount = (entities.flower_types || []).length;
    const defaultMaxMain = Math.max(2, Math.min(flowerCount, 5));
    const { maxMain = defaultMaxMain, maxSecondary = 4 } = opts;

    const scored = products
        .filter(p => (p.stock ?? 0) > 0)
        .map(p => ({
            ...p,
            _score: scoreProduct(p, entities),
            _role: productRoleFromHint(p, entities.role_hint)
        }))
        .filter(p => p._score >= 0.15) // Loại bỏ hoàn toàn không liên quan
        .sort((a, b) => b._score - a._score);

    // Products có role_hint "main" luôn vào main (bất kể score threshold)
    const roleMainProducts = scored.filter(p => p._role === 'main').slice(0, maxMain);
    const roleMainIds = new Set(roleMainProducts.map(p => String(p._id)));

    // Còn lại: score-based classification
    const restScored = scored.filter(p => !roleMainIds.has(String(p._id)));

    const scoreMain = restScored
        .filter(p => p._score > 0.8)
        .slice(0, Math.max(0, maxMain - roleMainProducts.length));

    const main = [...roleMainProducts, ...scoreMain];
    const mainIds = new Set(main.map(p => String(p._id)));

    const secondary = scored
        .filter(p => !mainIds.has(String(p._id)) && p._score > 0.45 && p._score <= 0.8)
        .slice(0, maxSecondary);

    const mainAndSecIds = new Set([...main, ...secondary].map(p => String(p._id)));

    const decoration = scored
        .filter(p => !mainAndSecIds.has(String(p._id)) && p._score >= 0.15 && p._score <= 0.45);

    return { main, secondary, decoration, all: scored };
}

/**
 * Resolve layout name từ style string
 */
function resolveLayoutName(style = '') {
    const norm_s = String(style).toLowerCase();
    if (['luxury', 'sang trọng', 'elegant', 'tối giản'].some(k => norm_s.includes(k))) return 'luxury';
    if (['cute', 'dễ thương', 'vui', 'nhiều màu', 'colorful'].some(k => norm_s.includes(k))) return 'cute';
    return 'default';
}

/**
 * Tạo explanation text từ kết quả classify
 * @returns {string}
 */
function buildExplanation(entities, main, secondary) {
    const flowerDisplay = (entities.flower_types || []).join(', ') || 'hoa phù hợp';
    const colorDisplay = (entities.colors || [])[0] || (entities.color) || '';
    const occasionDisplay = entities.occasion || '';
    const budgetDisplay = entities.budget ? `ngân sách ${(entities.budget / 1000000).toFixed(1)} triệu` : '';

    let parts = [`Mình đã chọn ${main.length} loại hoa chính`];
    if (flowerDisplay) parts.push(`loài hoa ${flowerDisplay}`);
    if (colorDisplay) parts.push(`tông ${colorDisplay}`);
    if (occasionDisplay) parts.push(`phù hợp dịp ${occasionDisplay}`);
    if (budgetDisplay) parts.push(budgetDisplay);

    if (secondary.length > 0) {
        parts.push(`kết hợp ${secondary.length} loại hoa phụ để tạo chiều sâu và sắc màu`);
    }

    const topMain = main.slice(0, 2).map(p => p.name).join(', ');
    if (topMain) parts.push(`nổi bật nhất là ${topMain}`);

    return parts.join(', ') + '.';
}

module.exports = {
    scoreProduct,
    classifyProducts,
    resolveLayoutName,
    buildExplanation,
    productRoleFromHint
};
