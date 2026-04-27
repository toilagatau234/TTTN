const path = require('path');
const Product = require('../models/Product');
const { removeBackground } = require('../utils/image/imageProcessor');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lấy URL ảnh đã xử lý (rembg) hoặc fallback về ảnh gốc
 * @param {Object} product
 * @param {string} type - 'flower' | 'basket' | 'decoration'
 */
async function resolveProductImageUrl(product, type = 'flower') {
    if (!product) return null;

    // 1. Đã có processed_image → dùng luôn
    if (product.processed_image) return product.processed_image;

    // 2. Thử lấy URL gốc và gọi rembg
    const rawUrl = product.images?.[0]?.url || product.images?.[0]?.secure_url;
    if (rawUrl) {
        try {
            const result = await removeBackground(rawUrl, type);
            if (result?.dataUrl) return result.dataUrl;
            if (result?.localPath) {
                // Convert local path to serve URL
                const fname = path.basename(result.localPath);
                return `/data/processed_images/${fname}`;
            }
        } catch (err) {
            console.warn(`[ImageController] rembg failed for ${product.name}: ${err.message}`);
        }
        return rawUrl; // fallback
    }

    return null;
}


/**
 * POST /api/images/product/:id/process
 * Remove bg + resize 1 sản phẩm, lưu vào processed_image
 */
exports.processProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { productType = 'flower' } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const rawUrl = product.images?.[0]?.url;
        if (!rawUrl) {
            return res.status(400).json({ success: false, message: 'Sản phẩm chưa có ảnh' });
        }

        const result = await removeBackground(rawUrl, productType);
        if (!result?.localPath) {
            return res.status(500).json({ success: false, message: 'Không thể xử lý ảnh' });
        }

        const serveUrl = `/data/processed_images/${path.basename(result.localPath)}`;
        product.processed_image = serveUrl;
        await product.save();

        return res.status(200).json({ success: true, processed_image: serveUrl });
    } catch (error) {
        console.error('[Process Image] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/images/batch-process
 * Batch remove bg cho nhiều sản phẩm
 */
exports.batchProcessImages = async (req, res) => {
    try {
        const { productType = 'flower', limit = 10 } = req.body;

        const products = await Product.find({
            status: 'active',
            $or: [
                { processed_image: null },
                { processed_image: '' },
                { processed_image: { $exists: false } }
            ],
            'images.0': { $exists: true }
        }).limit(parseInt(limit));

        res.status(200).json({
            success: true,
            message: `Đang xử lý ${products.length} ảnh...`,
            count: products.length
        });

        // Background job
        setImmediate(async () => {
            let ok = 0;
            for (const product of products) {
                try {
                    const rawUrl = product.images?.[0]?.url;
                    if (!rawUrl) continue;

                    const result = await removeBackground(rawUrl, productType);
                    if (result?.localPath) {
                        const serveUrl = `/data/processed_images/${path.basename(result.localPath)}`;
                        await Product.findByIdAndUpdate(product._id, { processed_image: serveUrl });
                        ok++;
                        console.log(`[BatchProcess] ${product.name}: ${serveUrl}`);
                    }
                } catch (err) {
                    console.error(`[BatchProcess] ${product.name}: FAIL — ${err.message}`);
                }
            }
            console.log(`[BatchProcess] Done: ${ok}/${products.length}`);
        });

    } catch (error) {
        console.error('[Batch Process] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
