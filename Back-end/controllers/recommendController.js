const Product = require('../models/Product');
const { matchProducts } = require('../utils/productMatcher');
const aiService = require('../services/ai.service');

/**
 * Controller for Product Recommendation API
 * POST /api/recommend
 */
exports.recommendProducts = async (req, res) => {
    try {
        const { text } = req.body;

        // STEP 3: EDGE CASES - Empty text
        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp nội dung yêu cầu (text)'
            });
        }

        // STEP 1.2: Call AI pipeline
        let entities = {
            category: null,
            flower_types: [],
            color: null,
            occasion: null,
            style: null
        };

        try {
            const aiResponse = await axios.post('http://localhost:8000/api/hydrangea/analyze', { text });
            if (aiResponse.data && aiResponse.data.entities) {
                // Map the standardized AI output back to what the matcher expects if necessary
                // Or simply pass it through
                entities = aiResponse.data.entities;
            }
        } catch (aiError) {
            console.error('[Recommend API] AI Pipeline Error:', aiError.message);
        }

        // STEP 1.3: Fetch products from database
        const allProducts = await Product.find({ status: 'active' })
            .populate('category', 'name')
            .lean();

        // STEP 1.4: Call matchProducts
        if (!allProducts || allProducts.length === 0) {
            return res.status(200).json({
                success: true,
                entities,
                products: []
            });
        }

        const recommendedProducts = matchProducts(entities, allProducts);

        // STEP 2: RESPONSE FORMAT
        return res.status(200).json({
            success: true,
            entities,
            products: recommendedProducts
        });

    } catch (error) {
        console.error('[Recommend API] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi trong quá trình gợi ý sản phẩm',
            error: error.message
        });
    }
};
/**
 * NEW: Simplified Recommendation API
 * POST /api/recommend-products
 */
exports.recommendProductsSimple = async (req, res) => {
    try {
        const { text } = req.body;

        // ISSUE 3 — EMPTY INPUT VALIDATION
        // If text is missing or empty string -> return fallback (5 most recent)
        if (!text || text.trim() === '') {
            const defaultProducts = await Product.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('category', 'name')
                .lean();

            return res.status(200).json({
                filters: {},
                products: defaultProducts,
                isAiGenerated: false // TASK 6: UX Clarity Flag
            });
        }

        // ISSUE 4 — SEPARATE AI SERVICE LAYER
        const aiResult = await aiService.analyzeText(text);
        const { intent, entities } = aiResult;
        
        // Create Strict Entities Map for matching
        const { createStrictEntitiesMap } = require('../utils/normalizer');
        const strictEntities = createStrictEntitiesMap(entities, text);
        
        // TASK 7: Minimal Logging
        console.log(`[Recommend API] AI Intent: ${intent}`);
        console.log(`[Recommend API] AI Filters (RAW):`, JSON.stringify(entities));
        console.log(`[Recommend API] Strict Entities:`, JSON.stringify(strictEntities));

        const hasMeaningfulData = 
            (strictEntities.flowers.main.length > 0) ||
            (strictEntities.flowers.secondary.length > 0) ||
            (strictEntities.color.length > 0) ||
            strictEntities.occasion || 
            strictEntities.budget > 0 ||
            strictEntities.style;

        // NEW RULE: IF entities contain meaningful data, treat as valid and continue.
        // ONLY fallback if: both intent UNKNOWN AND entities empty
        if (intent === 'UNKNOWN' && !hasMeaningfulData) {
            console.log(`[Recommend API] Fallback triggered: Intent UNKNOWN and no meaningful entities.`);
            const defaultProducts = await Product.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('category', 'name')
                .lean();

            return res.status(200).json({
                filters: strictEntities,
                products: defaultProducts,
                isAiGenerated: false
            });
        }
        
        console.log(`[Recommend API] Proceeding with recommendation...`);

        // 1. Fetch all active products
        const allProducts = await Product.find({ status: 'active' }).populate('category', 'name').lean();

        // 2. Perform Matching and Scoring
        const scoredProducts = matchProducts(strictEntities, allProducts, true);

        // TASK 5: LIMIT RESULT SIZE
        let finalProducts = scoredProducts
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        // TASK 6 — FALLBACK LOGIC (STRICT)
        let isAiGenerated = true;
        
        if (finalProducts.length === 0) {
            console.log(`[Recommend API] Zero Match Fallback triggered.`);
            finalProducts = await Product.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('category', 'name')
                .lean();
            isAiGenerated = false;
        } else {
            console.log(`[Recommend API] Top Match Score: ${finalProducts[0].matchScore}`);
        }

        // Return standardized format EXACTLY as required
        return res.status(200).json({
            filters: strictEntities,
            products: finalProducts,
            isAiGenerated // TASK 6: UX Clarity Flag
        });

    } catch (error) {
        console.error('[Recommend Simple] Critical Error:', error.message);
        
        // TASK 8: ERROR HANDLING HARDENING -> Return graceful empty state
        return res.status(200).json({ 
            success: false, 
            error: error.message,
            filters: {},
            products: [],
            isAiGenerated: false
        });
    }
};
