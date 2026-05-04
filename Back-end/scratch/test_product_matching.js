const { normalizeString } = require('../utils/normalizer');

// Mock scoring logic from hydrangea.service.js
const score = (product, targetType = null, targetColor = null) => {
    const pNameN = normalizeString(product.name);
    const pColorsAll = [normalizeString(product.dominant_color || ''), ...(product.secondary_colors || []).map(c => normalizeString(c))];
    
    if (!targetType) return { total: 0, breakdown: {} };

    const tTypeN = normalizeString(targetType);
    const tColorN = targetColor ? normalizeString(targetColor) : null;

    const productTypes = [
        ...(product.main_flowers || []).map(normalizeString),
        ...(product.sub_flowers || []).map(normalizeString)
    ];
    const hasTypeMatch = productTypes.some(t => t.includes(tTypeN) || tTypeN.includes(t)) || pNameN.includes(tTypeN);

    const hasColorMatch = tColorN && pColorsAll.some(pc => pc.includes(tColorN) || tColorN.includes(pc));

    let similarity = 0;
    if (pNameN.includes(tTypeN)) {
        similarity = tTypeN.length / pNameN.length;
    }

    let total = (hasTypeMatch ? 10 : -100) + (hasColorMatch ? 5 : 0) + (similarity * 2);

    return {
        total,
        breakdown: {
            typeMatch: hasTypeMatch,
            colorMatch: hasColorMatch,
            similarity: parseFloat(similarity.toFixed(2))
        }
    };
};

const processFlowerProducts = (products, targetType, targetColor) => {
    let results = products.map(p => {
        const { total, breakdown } = score(p, targetType, targetColor);
        return { ...p, _score: total, _breakdown: breakdown };
    });

    if (!results.some(r => r._score > 0)) {
        results = products.map(p => {
            const pNameN = normalizeString(p.name);
            const tTypeN = normalizeString(targetType);
            const hasKeyword = pNameN.split(' ').some(word => tTypeN.includes(word));
            
            let fallbackScore = -20;
            if (hasKeyword) fallbackScore += 5;

            return { 
                ...p, 
                _score: fallbackScore, 
                _breakdown: { typeMatch: false, colorMatch: false, similarity: 0, isFallback: true } 
            };
        });
    }

    return results.sort((a, b) => b._score - a._score);
};

// Test Cases
const mockProducts = [
    { name: "Hoa Cẩm Chướng Đỏ", dominant_color: "đỏ", main_flowers: ["cẩm chướng"], sub_flowers: [] },
    { name: "Hoa Cẩm Chướng Hồng", dominant_color: "hồng", main_flowers: ["cẩm chướng"], sub_flowers: [] },
    { name: "Lan Hồ Điệp Trắng", dominant_color: "trắng", main_flowers: ["lan hồ điệp"], sub_flowers: [] },
    { name: "Lan Hồ Điệp Tím", dominant_color: "tím", main_flowers: ["lan hồ điệp"], sub_flowers: [] },
    { name: "Hoa Hồng Đen", dominant_color: "đen", main_flowers: ["hoa hồng"], sub_flowers: [] }
];

console.log("--- Test 1: lan hồ điệp đen ---");
const test1 = processFlowerProducts(mockProducts, "lan hồ điệp", "đen");
console.log(JSON.stringify(test1.slice(0, 2), null, 2));

console.log("\n--- Test 2: hoa hồng đỏ ---");
const test2 = processFlowerProducts(mockProducts, "hoa hồng", "đỏ");
console.log(JSON.stringify(test2.slice(0, 2), null, 2));

console.log("\n--- Test 3: unknown flower (sen đá) ---");
const test3 = processFlowerProducts(mockProducts, "sen đá", null);
console.log(JSON.stringify(test3.slice(0, 2), null, 2));
