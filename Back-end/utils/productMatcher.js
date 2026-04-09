/**
 * Product Matcher Utility
 * 
 * Implement STEP 2: PRODUCT MATCHING FUNCTION
 * Scoring Rules:
 * score = category_match * 4 + 
 *         color_match * 3 + 
 *         occasion_match * 3 + 
 *         style_match * 2 + 
 *         flower_match * 1
 */

/**
 * Normalizes category input for matching
 * @param {any} productCategory - The category field from the product (could be ID or populated object)
 * @returns {string} - The lowercased category name
 */
const getCategoryName = (productCategory) => {
    if (!productCategory) return '';
    if (typeof productCategory === 'string') return productCategory.toLowerCase();
    if (productCategory.name) return productCategory.name.toLowerCase();
    if (productCategory.toString) return productCategory.toString().toLowerCase();
    return '';
};

/**
 * Matches products based on entities provided by AI pipeline
 * @param {Object} entities - The entities extracted from user request
 * @param {Array} products - List of products to match against
 * @returns {Array} - Top 5 matching products sorted by score DESC
 */
const matchProducts = (entities = {}, products = []) => {
    const scoredProducts = products.map(product => {
        let score = 0;

        // 1. Category Match (Weight: 4)
        // exact match -> 1
        const entityCategory = (entities.category || '').toLowerCase();
        const productCategoryName = getCategoryName(product.category);
        const categoryMatch = (entityCategory && productCategoryName === entityCategory) ? 1 : 0;
        score += categoryMatch * 4;

        // 2. Color Match (Weight: 3)
        // match dominant_color -> 1
        const entityColor = (entities.color || '').toLowerCase();
        const productDominantColor = (product.dominant_color || '').toLowerCase();
        const colorMatch = (entityColor && productDominantColor === entityColor) ? 1 : 0;
        score += colorMatch * 3;

        // 3. Occasion Match (Weight: 3)
        // if entities.occasion in product.occasion[] -> 1
        const entityOccasion = (entities.occasion || '').toLowerCase();
        const productOccasions = Array.isArray(product.occasion) 
            ? product.occasion.map(o => o.toLowerCase()) 
            : [];
        const occasionMatch = (entityOccasion && productOccasions.includes(entityOccasion)) ? 1 : 0;
        score += occasionMatch * 3;

        // 4. Style Match (Weight: 2)
        // if entities.style in product.style[] -> 1
        const entityStyle = (entities.style || '').toLowerCase();
        const productStyles = Array.isArray(product.style) 
            ? product.style.map(s => s.toLowerCase()) 
            : [];
        const styleMatch = (entityStyle && productStyles.includes(entityStyle)) ? 1 : 0;
        score += styleMatch * 2;

        // 5. Flower Match (Weight: 1)
        // if any entities.flower_types in product.main_flowers -> 1
        const entityFlowerTypes = Array.isArray(entities.flower_types) 
            ? entities.flower_types.map(f => f.toLowerCase()) 
            : [];
        const productMainFlowers = Array.isArray(product.main_flowers) 
            ? product.main_flowers.map(f => f.toLowerCase()) 
            : [];
        const flowerMatch = (entityFlowerTypes.some(flower => productMainFlowers.includes(flower))) ? 1 : 0;
        score += flowerMatch * 1;

        return {
            ...product.toObject ? product.toObject() : product,
            matchScore: score
        };
    });

    // Sort by score DESC and return top 5
    return scoredProducts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
};

module.exports = {
    matchProducts
};
