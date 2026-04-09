const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const renderer = require('../utils/image/renderer');

/**
 * Controller for automated Image Generation based on Product
 * POST /api/generate-image
 */
exports.generateProductImage = async (req, res) => {
    try {
        const { product_id } = req.body;

        // 1. Fetch product from DB
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // 2. Map Product Attributes to Assets
        // Logic: flower + color -> filename. Example: rose + red -> rose_red
        
        // TASK 5: SAFE EXTRACTION FOR IMAGE GENERATION
        let main_flower_type = 'rose'; // Safe default
        if (Array.isArray(product.main_flowers) && product.main_flowers.length > 0) {
            const firstFlower = product.main_flowers[0];
            if (typeof firstFlower === 'string') {
                main_flower_type = firstFlower.toLowerCase();
            } else if (firstFlower && typeof firstFlower.type === 'string') {
                main_flower_type = firstFlower.type.toLowerCase();
            }
        }
        
        const dominant_color = (typeof product.dominant_color === 'string' && product.dominant_color.trim() !== '') 
            ? product.dominant_color.toLowerCase() 
            : 'red';
        
        // Asset mapping
        let mainFlowerAsset = `${main_flower_type}_${dominant_color}`;
        
        // Check if asset exists, fallback to rose_red if not
        const assetsBase = path.join(__dirname, '../utils/image/assets/flowers');
        if (!fs.existsSync(path.join(assetsBase, `${mainFlowerAsset}.png`))) {
            // Try generic name if color-specific not found
            if (fs.existsSync(path.join(assetsBase, `${main_flower_type}.png`))) {
                mainFlowerAsset = main_flower_type;
            } else {
                mainFlowerAsset = 'rose_red'; // ULTIMATE FALLBACK
            }
        }

        const subFlowerAsset = 'baby_white'; // Standard sub-flower
        const decorationAsset = (product.elements && product.elements.length > 0) ? 'ribbon' : 'ribbon';

        // 3. Generate Image using Renderer
        const imageBuffer = await renderer.generateBasket({
            mainFlower: mainFlowerAsset,
            subFlower: subFlowerAsset,
            decoration: decorationAsset
        });

        // 4. Save Image locally
        const fileName = `composition-${product_id}-${Date.now()}.png`;
        const publicDir = path.join(__dirname, '../public/generated-images');
        
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, fileName);
        fs.writeFileSync(filePath, imageBuffer);

        // 5. Return Response
        const imageUrl = `/public/generated-images/${fileName}`;

        return res.status(200).json({
            success: true,
            message: 'Tạo ảnh thành công',
            image_url: imageUrl
        });

    } catch (error) {
        console.error('[Image Controller] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi trong quá trình xử lý ảnh',
            error: error.message
        });
    }
};
