const { normalizeString } = require('./normalizer');

/**
 * Product Matcher Utility
 * Handles scoring and matching logic for flower products based on AI-extracted filters.
 */

/**
 * Normalizes string for safe comparison (lower, trim, dictionary)
 */
const normalize = (value) => {
    return normalizeString(value);
};

/**
 * Safely checks if a normalized target exists partially in a normalized source array
 * (Soft Matching Example: target="red", source=["dark red", "blue"])
 */
const matchInArray = (targetValue, sourceArray) => {
    if (!targetValue || !Array.isArray(sourceArray)) return false;
    const normalizedTarget = normalize(targetValue);
    
    // SOFT MATCH: Include check instead of strict ===
    return sourceArray.some(item => {
        const normalizedItem = normalize(item);
        return normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem);
    });
};

/**
 * Matches products based on entities provided by AI pipeline
 * Each match satisfies the specific condition (Issue 7 requirement)
 * 
 * Weights:
 * - Color: 3 (dominant_color OR secondary_colors)
 * - Occasion: 3
 * - Style: 2
 * - Flowers: 1 (main_flowers.type)
 * 
 * @param {Object} filters - Standardized AI filters { color, occasion, style, flowers, layout }
 * @param {Array} products - List of products from database
 * @returns {Array} - All products with calculated 'matchScore'
 */
const matchProducts = (filters = {}, products = [], strictMode = true) => {
    let validProducts = [];

    for (let product of products) {
        if (product.stock <= 0) continue; // Skip out of stock

        let totalScore = 0;
        let breakdown = { typeMatch: false, colorMatch: false, similarity: 0 };

        // 1. Flower Type Priority (CRITICAL)
        if (filters.structured_flowers && filters.structured_flowers.length > 0) {
            filters.structured_flowers.forEach(sf => {
                const typeNorm = normalizeString(sf.type);
                const colorNorm = sf.color ? normalizeString(sf.color) : null;
                const pNameNorm = normalizeString(product.name);
                
                const productTypes = [
                    ...(product.main_flowers || []).map(f => normalizeString(typeof f === 'string' ? f : f.type)),
                    ...(product.sub_flowers || []).map(f => normalizeString(typeof f === 'string' ? f : f.type))
                ];

                const typeMatch = productTypes.some(t => t.includes(typeNorm) || typeNorm.includes(t)) || pNameNorm.includes(typeNorm);
                const colorMatch = colorNorm && [normalizeString(product.dominant_color || ''), ...(product.secondary_colors || []).map(normalizeString)].some(c => c.includes(colorNorm) || colorNorm.includes(c));
                
                let similarity = 0;
                if (pNameNorm.includes(typeNorm)) {
                    similarity = typeNorm.length / pNameNorm.length;
                }

                const currentScore = (typeMatch ? 10 : -100) + (colorMatch ? 5 : 0) + (similarity * 2);
                
                if (currentScore > totalScore || totalScore === 0) {
                    totalScore = currentScore;
                    breakdown = { typeMatch, colorMatch, similarity };
                }
            });
        } else {
            // General scoring for non-structured filters
            if (filters.occasion && product.occasion?.some(o => normalizeString(o).includes(normalizeString(filters.occasion)))) totalScore += 5;
            if (filters.style && product.style?.some(s => normalizeString(s).includes(normalizeString(filters.style)))) totalScore += 2;
            if (filters.color) {
                const colors = Array.isArray(filters.color) ? filters.color : [filters.color];
                if (colors.some(c => [normalizeString(product.dominant_color || ''), ...(product.secondary_colors || []).map(normalizeString)].some(pc => pc.includes(normalizeString(c))))) totalScore += 3;
            }
        }

        validProducts.push({
            ...(product.toObject ? product.toObject() : product),
            matchScore: totalScore,
            matchBreakdown: breakdown
        });
    }

    // Sort by score DESC
    let matchedProducts = validProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Fallback Logic
    if (matchedProducts.length > 0 && matchedProducts[0].matchScore <= 0) {
        // Apply fallback penalty -20 if it was a keyword match but no type match
        matchedProducts = matchedProducts.map(p => {
            if (p.matchScore <= 0 && p.matchScore > -100) {
                return { ...p, matchScore: p.matchScore - 20 };
            }
            return p;
        });
    }

    return matchedProducts.filter(p => p.matchScore > -50);
};

module.exports = {
    matchProducts
};
