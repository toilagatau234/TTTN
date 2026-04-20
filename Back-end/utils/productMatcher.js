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

        if (strictMode && filters.budget > 0) {
            const minBudget = filters.budget * 0.8;
            const maxBudget = filters.budget * 1.2;
            if (product.price < minBudget || product.price > maxBudget) continue;
        }

        let score = 0;

        // 1. Color Match (Array) (Weight: 3)
        if (Array.isArray(filters.color) && filters.color.length > 0) {
            let colorMatched = false;
            for (let c of filters.color) {
                const normalizedFilterColor = normalize(c);
                const normalizedDominantColor = normalize(product.dominant_color || "");
                const isDominantMatch = normalizedDominantColor.includes(normalizedFilterColor) || normalizedFilterColor.includes(normalizedDominantColor);
                const isSecondaryMatch = matchInArray(c, product.secondary_colors);
                if (isDominantMatch || isSecondaryMatch) colorMatched = true;
            }
            if (colorMatched) score += 3;
        }

        // 2. Occasion (Weight: 5 - High Priority)
        if (filters.occasion) {
            if (matchInArray(filters.occasion, product.occasion)) {
                score += 5;
            } else if (filters.occasion === "women's day" && matchInArray("8/3", product.occasion)) {
                score += 5; // Direct mapping for Women's Day
            }
        }

        // 3. Style (Weight: 2)
        if (filters.style) {
            if (matchInArray(filters.style, product.style)) score += 2;
        }

        // 4. Flowers (Main and Secondary) (Weight: 4 for Main)
        if (filters.flowers) {
            if (Array.isArray(filters.flowers.main) && filters.flowers.main.length > 0) {
                const productMainFlowers = (Array.isArray(product.main_flowers) ? product.main_flowers.map(f => normalize(typeof f === 'string' ? f : f.type)) : []);
                const matchedMain = filters.flowers.main.some(f => {
                    const normFlower = normalize(f);
                    return productMainFlowers.some(pmf => pmf.includes(normFlower) || normFlower.includes(pmf));
                });
                if (matchedMain) score += 4;
            }

            if (Array.isArray(filters.flowers.secondary) && filters.flowers.secondary.length > 0) {
                const productSubFlowers = (Array.isArray(product.sub_flowers) ? product.sub_flowers.map(f => normalize(typeof f === 'string' ? f : f.type)) : []);
                const matchedSub = filters.flowers.secondary.some(f => {
                    const normFlower = normalize(f);
                    return productSubFlowers.some(pmf => pmf.includes(normFlower) || normFlower.includes(pmf));
                });
                if (matchedSub) score += 1;
            }
        }
        
        // 5. Category/Layout Match (Weight: 3)
        if (filters.layout && product.category) {
            if (normalize(product.category.name || "").includes(normalize(filters.layout))) {
                score += 3;
            }
        }
        
        validProducts.push({
            ...(product.toObject ? product.toObject() : product),
            matchScore: score
        });
    }

    // Filter products that matched at least one criteria
    let matchedProducts = validProducts.filter(p => p.matchScore > 0);
    
    // MISSING FALLBACK STRATEGY 
    if (strictMode && matchedProducts.length === 0) {
        // Fallback: Relax constraints (ignore budget/color limits)
        return matchProducts(filters, products, false);
    }

    return matchedProducts;
};

module.exports = {
    matchProducts
};
