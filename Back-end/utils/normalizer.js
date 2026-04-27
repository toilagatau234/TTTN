/**
 * Database & AI Data Normalization Layer
 * Helps map AI-extracted entities to database-specific phrasing.
 */

const DICTIONARY = {
    // Only map true synonyms, do not translate to English
    "hoa cẩm chướng": "cẩm chướng",
    "cúc họa mi": "hoa cúc",
    "cẩm tú cầu": "cẩm tú cầu",
    "hoa hồng": "hoa hồng",
    
    // Colors
    "đỏ tươi": "đỏ",
    "hồng nhạt": "hồng"
};

/**
 * Clean, standard validation for string formatting
 * @param {string} value The raw string
 * @returns {string} Trims, lowercases, and maps to dictionary
 */
const normalizeString = (value) => {
    if (!value || typeof value !== 'string') return '';
    let normalized = value.trim().toLowerCase();
    
    // Map with Dictionary Fallback
    if (DICTIONARY[normalized]) {
        normalized = DICTIONARY[normalized];
    }
    
    return normalized;
};

const normalizePrice = (priceStr) => {
    if (!priceStr || typeof priceStr !== 'string') return 0;
    const str = priceStr.toLowerCase().trim();
    let multiplier = 1;
    if (str.includes('k') || str.includes('nghìn') || str.includes('ngàn')) multiplier = 1000;
    else if (str.includes('tr') || str.includes('triệu')) multiplier = 1000000;
    
    const numMatch = str.match(/[\d.,]+/);
    if (!numMatch) return 0;
    let numStr = numMatch[0].replace(/,/g, '.');
    if (numStr.split('.').length > 2 || (numStr.includes('.') && numStr.split('.')[1].length === 3)) {
         numStr = numStr.replace(/\./g, '');
    }
    const val = parseFloat(numStr);
    return isNaN(val) ? 0 : val * multiplier;
};

const nearKeyword = (text, target, keywords, windowSize = 25) => {
    if (!text || !target) return false;
    const lowerText = text.toLowerCase();
    const targetIdx = lowerText.indexOf(target.toLowerCase());
    if (targetIdx === -1) return false;
    
    return keywords.some(kw => {
        const kwIdx = lowerText.indexOf(kw.toLowerCase());
        if (kwIdx === -1) return false;
        const dist = Math.abs(kwIdx - targetIdx);
        return dist <= windowSize;
    });
};

const countOccurrences = (text, target) => {
    if (!text || !target) return 0;
    const regex = new RegExp(target, 'gi');
    return (text.match(regex) || []).length;
};

const createStrictEntitiesMap = (aiEntities, originalText) => {
    const strictFormat = {
        flowers: { main: [], secondary: [] },
        color: [],
        occasion: "",
        target: "",
        style: "",
        budget: 0
    };

    if (!aiEntities) return strictFormat;

    strictFormat.budget = normalizePrice(aiEntities.price_hint);
    
    if (aiEntities.color) {
        const c = Array.isArray(aiEntities.color) ? aiEntities.color : [aiEntities.color];
        strictFormat.color = [...new Set(c.map(normalizeString))].filter(Boolean);
    }
    
    if (aiEntities.occasion) strictFormat.occasion = normalizeString(aiEntities.occasion);
    if (aiEntities.style) strictFormat.style = normalizeString(aiEntities.style);

    if (Array.isArray(aiEntities.flowers)) {
        const flowerPriorityMapping = {
            'rose': 0.5,
            'tulip': 0.5,
            'sunflower': 0.5,
            'baby_breath': 0.1,
            'daisy': 0.3,
            'hydrangea': 0.4
        };

        const uniqueFlowers = [...new Set(aiEntities.flowers)];
        for (const rawFlower of uniqueFlowers) {
            const flower = normalizeString(rawFlower);
            if (!flower) continue;

            let score = 0;
            if (nearKeyword(originalText, flower, ["chủ đạo", "chính"])) score += 0.4;
            if (nearKeyword(originalText, flower, ["mix", "kèm", "phụ"])) score += 0.2;
            
            score += countOccurrences(originalText, flower) * 0.1;
            score += flowerPriorityMapping[flower] || 0.3;
            score = Math.min(score, 1);

            if (score > 0.8) {
                strictFormat.flowers.main.push(flower);
            } else {
                strictFormat.flowers.secondary.push(flower);
            }
        }
    }

    return strictFormat;
};

module.exports = {
    normalizeString,
    normalizePrice,
    createStrictEntitiesMap
};
