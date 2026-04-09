const axios = require('axios');
const Product = require('../models/Product');
const { matchProducts } = require('../utils/productMatcher');

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
                entities = aiResponse.data.entities;
            }
        } catch (aiError) {
            console.error('[Recommend API] AI Pipeline Error:', aiError.message);
            // STEP 3: EDGE CASES - AI fails -> fallback entities = {}
            // We already initialized entities with null/empty values
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
