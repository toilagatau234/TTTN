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
const matchProducts = (filters = {}, products = []) => {
    return products.map(product => {
        let score = 0;

        // TASK 1 & 2: Safe Null Handling & Normalization
        
        // 1. Color Match (Weight: 3)
        // match dominant_color OR secondary_colors with SOFT MATCHING
        if (filters.color) {
            const normalizedFilterColor = normalize(filters.color);
            const normalizedDominantColor = normalize(product.dominant_color);
            
            // SOFT MATCH: (e.g., "red" matches "dark red")
            const isDominantMatch = normalizedDominantColor.includes(normalizedFilterColor) || 
                                    normalizedFilterColor.includes(normalizedDominantColor);
            
            const isSecondaryMatch = matchInArray(filters.color, product.secondary_colors);
            
            if (isDominantMatch || isSecondaryMatch) {
                score += 3;
            }
        }

        // 2. Occasion Match (Weight: 3)
        // TASK 4: Safe Array Matching
        if (filters.occasion) {
            if (matchInArray(filters.occasion, product.occasion)) {
                score += 3;
            }
        }

        // 3. Style Match (Weight: 2)
        if (filters.style) {
            if (matchInArray(filters.style, product.style)) {
                score += 2;
            }
        }

        // 4. Flower Match (Weight: 1)
        // TASK 3: Correct Flower Matching (main_flowers.type) with SOFT MATCHING
        if (Array.isArray(filters.flowers) && filters.flowers.length > 0) {
            const aiFlowers = filters.flowers.map(f => normalize(f));
            const productFlowers = Array.isArray(product.main_flowers) 
                ? product.main_flowers.map(f => normalize(f.type)) 
                : [];
            
            // If ANY AI flower SOFT-MATCHES product.main_flowers.type
            if (aiFlowers.some(aiTarget => 
                productFlowers.some(prodFlower => 
                    prodFlower.includes(aiTarget) || aiTarget.includes(prodFlower)
                )
            )) {
                score += 1;
            }
        }

        return {
            ...product.toObject ? product.toObject() : product,
            matchScore: score
        };
    });
};

module.exports = {
    matchProducts
};
