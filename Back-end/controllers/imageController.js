const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Product = require('../models/Product');
const renderer = require('../utils/image/renderer');
const { classifyProducts, resolveLayoutName, buildExplanation } = require('../utils/scoringService');
const { getProductImageUrl, removeBackground } = require('../utils/image/imageProcessor');

// ── In-memory composition cache ─────────────────────────────────────────────
// key = hash(sorted item IDs + style + occasion)
const _compositionCache = new Map();
const MAX_CACHE_SIZE = 50;

function makeCacheKey(items, style, occasion) {
    const sorted = [...items].sort((a, b) => String(a._id).localeCompare(String(b._id)));
    const keyStr = JSON.stringify({ ids: sorted.map(p => p._id), style, occasion });
    return crypto.createHash('md5').update(keyStr).digest('hex');
}

function getCached(key) {
    return _compositionCache.get(key) || null;
}

function setCache(key, value) {
    if (_compositionCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest (first inserted)
        const firstKey = _compositionCache.keys().next().value;
        _compositionCache.delete(firstKey);
    }
    _compositionCache.set(key, value);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getPublicDir() {
    const dir = path.join(__dirname, '../public/generated-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

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
 * POST /api/generate-image
 * 
 * Body:
 *   { entities: { flower_types, colors, occasion, style, budget, role_hint } }
 *   OR
 *   { product_id: string }
 * 
 * Response:
 *   {
 *     success, image_url, items, roles,
 *     total_price, explanation, layout_used
 *   }
 */
exports.generateProductImage = async (req, res) => {
    try {
        const { product_id, entities = {} } = req.body;
        console.log('[Image Generation] Input:', { product_id, entities });

        let mainProducts = [];
        let secondaryProducts = [];
        let decorationProducts = [];
        let basketProduct = null;
        let style = entities.style || 'default';
        let occasion = entities.occasion || null;

        // ── Mode 1: single product_id ─────────────────────────────────────
        if (product_id) {
            const product = await Product.findById(product_id).lean();
            if (!product) {
                return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            }
            mainProducts = [product];
            style = product.style?.[0] || 'default';
            occasion = product.occasion?.[0] || null;

            // Tìm basket và secondary
            const related = await Product.find({
                status: 'active',
                stock: { $gt: 0 },
                _id: { $ne: product._id }
            }).limit(20).lean();

            basketProduct = related.find(p =>
                (p.category?.name || '').toLowerCase().includes('giỏ') ||
                (p.layout || '').toLowerCase().includes('basket')
            ) || null;

            secondaryProducts = related
                .filter(p => p !== basketProduct)
                .slice(0, 2);

        // ── Mode 2: entities từ AI ────────────────────────────────────────
        } else if (Object.keys(entities).length > 0) {
            const allProducts = await Product.find({ status: 'active', stock: { $gt: 0 } })
                .populate('category', 'name').lean();

            const classified = classifyProducts(allProducts, entities, { maxSecondary: 3 });
            mainProducts    = classified.main;
            secondaryProducts = classified.secondary;
            decorationProducts = classified.decoration.slice(0, 2);

            // Tìm basket product
            basketProduct = allProducts.find(p =>
                (p.category?.name || '').toLowerCase().includes('giỏ') ||
                (p.layout || '').toLowerCase().includes('basket')
            ) || null;

        } else {
            return res.status(400).json({ success: false, message: 'Cần product_id hoặc entities' });
        }

        // ── Build all items list ──────────────────────────────────────────
        const allItems = [...mainProducts, ...secondaryProducts, ...decorationProducts];
        const layoutName = resolveLayoutName(style);
        const cacheKey = makeCacheKey(allItems, layoutName, occasion);

        // ── Composition cache check ───────────────────────────────────────
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('[Image Generation] Cache hit:', cacheKey);
            return res.status(200).json(cached);
        }

        // ── Resolve image URLs in parallel ───────────────────────────────
        const [
            basketUrl,
            ...mainUrls
        ] = await Promise.all([
            resolveProductImageUrl(basketProduct, 'basket'),
            ...mainProducts.map(p => resolveProductImageUrl(p, 'flower'))
        ]);

        const secondaryUrls = await Promise.all(
            secondaryProducts.map(p => resolveProductImageUrl(p, 'flower'))
        );
        const leavesUrl = decorationProducts[0]
            ? await resolveProductImageUrl(decorationProducts[0], 'decoration')
            : null;

        // ── Render ────────────────────────────────────────────────────────
        console.log(`[Image Generation] Rendering: main=${mainUrls.length}, secondary=${secondaryUrls.length}, layout=${layoutName}`);

        const imageBuf = await renderer.generateBasket({
            basketUrl,
            mainUrls: mainUrls.filter(Boolean),
            secondaryUrls: secondaryUrls.filter(Boolean),
            leavesUrl,
            style: layoutName,
            occasion,
            randomize: true
        });

        // ── Save to disk ──────────────────────────────────────────────────
        const fileName = `bouquet-${cacheKey}-${Date.now()}.png`;
        const filePath = path.join(getPublicDir(), fileName);
        fs.writeFileSync(filePath, imageBuf);
        const imageUrl = `/public/generated-images/${fileName}`;

        // ── Build response ────────────────────────────────────────────────
        const totalPrice = allItems.reduce((sum, p) => sum + (p.price || 0), 0);
        const explanation = buildExplanation(entities, mainProducts, secondaryProducts);

        const responseBody = {
            success: true,
            image_url: imageUrl,
            layout_used: layoutName,
            items: allItems.map(p => ({
                product_id: p._id,
                name: p.name,
                role: mainProducts.includes(p) ? 'main'
                    : secondaryProducts.includes(p) ? 'secondary' : 'decoration',
                price: p.price || 0,
                image_url: p.images?.[0]?.url || null,
                score: p._score || 0
            })),
            roles: {
                main: mainProducts.map(p => String(p._id)),
                secondary: secondaryProducts.map(p => String(p._id)),
                decoration: decorationProducts.map(p => String(p._id))
            },
            total_price: totalPrice,
            explanation
        };

        setCache(cacheKey, responseBody);
        console.log(`[Image Generation] Done: ${imageUrl}`);
        return res.status(200).json(responseBody);

    } catch (error) {
        console.error('[Image Controller] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý ảnh', error: error.message });
    }
};

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
