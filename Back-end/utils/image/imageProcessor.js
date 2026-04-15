/**
 * Back-end/utils/image/imageProcessor.js
 * 
 * Image processing pipeline — gọi Python AI service (rembg) thay vì Cloudinary paid plan.
 * 
 * Flow:
 *   product.images[0].url  →  POST /api/image/remove-bg (Python)
 *   → base64 PNG (transparent, resized)  →  serve as data URL hoặc save local
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Local cache directory (Node.js side — phòng khi Python cache miss)
const CACHE_DIR = path.join(__dirname, '../../data/processed_images');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/**
 * Product type map (đồng bộ với Python SIZE_MAP)
 */
const PRODUCT_TYPE_MAP = {
    flower: 'flower',
    basket: 'basket',
    decoration: 'decoration',
    ribbon: 'ribbon',
    default: 'flower'
};

/**
 * Cache key từ URL + type
 */
function cacheKey(imageUrl, productType) {
    return crypto.createHash('md5').update(`${imageUrl}:${productType}`).digest('hex');
}

/**
 * Kiểm tra có file cache local không
 */
function getCachedPath(key) {
    const p = path.join(CACHE_DIR, `${key}.png`);
    return fs.existsSync(p) ? p : null;
}

/**
 * Lưu buffer PNG vào local cache
 */
function saveCached(key, buffer) {
    const p = path.join(CACHE_DIR, `${key}.png`);
    fs.writeFileSync(p, buffer);
    return p;
}

/**
 * Gọi Python rembg service để remove background + resize
 * 
 * @param {string} imageUrl   - Cloudinary hoặc bất kỳ public URL nào
 * @param {string} productType - 'flower' | 'basket' | 'decoration' | 'ribbon'
 * @returns {Promise<{localPath: string, base64: string}>}
 */
async function removeBackground(imageUrl, productType = 'flower') {
    if (!imageUrl) return null;

    const pType = PRODUCT_TYPE_MAP[productType] || 'flower';
    const key = cacheKey(imageUrl, pType);

    // ── Check Node.js local cache ──
    const cachedPath = getCachedPath(key);
    if (cachedPath) {
        console.log(`[ImageProcessor] Cache hit (Node): ${key}`);
        const base64 = fs.readFileSync(cachedPath).toString('base64');
        return {
            localPath: cachedPath,
            base64,
            dataUrl: `data:image/png;base64,${base64}`,
            cached: true
        };
    }

    // ── Gọi Python AI service ──
    try {
        console.log(`[ImageProcessor] Gọi rembg: ${imageUrl}`);
        const resp = await axios.post(`${AI_SERVICE_URL}/api/image/remove-bg`, {
            image_url: imageUrl,
            product_type: pType,
            use_cache: true
        }, { timeout: 30000 }); // rembg có thể chậm lần đầu

        if (!resp.data.success) {
            throw new Error(resp.data.error || 'Unknown error from image service');
        }

        const base64 = resp.data.image_base64;
        const buffer = Buffer.from(base64, 'base64');

        // Lưu Node.js cache
        const localPath = saveCached(key, buffer);
        console.log(`[ImageProcessor] Saved: ${localPath}`);

        return {
            localPath,
            base64,
            dataUrl: `data:image/png;base64,${base64}`,
            cached: resp.data.cached || false
        };

    } catch (err) {
        console.error(`[ImageProcessor] rembg failed for ${imageUrl}: ${err.message}`);
        // Graceful degradation: trả về URL gốc thay vì null
        return { localPath: null, dataUrl: imageUrl, base64: null, cached: false };
    }
}

/**
 * Batch remove bg cho danh sách sản phẩm
 * Gọi Python /api/image/batch
 * 
 * @param {Array<{url: string, type: string}>} items
 * @returns {Promise<Array<{dataUrl: string, localPath: string}>>}
 */
async function batchRemoveBackground(items = []) {
    if (!items.length) return [];

    try {
        const requestItems = items.map(item => ({
            image_url: item.url,
            product_type: PRODUCT_TYPE_MAP[item.type] || 'flower',
            use_cache: true
        }));

        const resp = await axios.post(`${AI_SERVICE_URL}/api/image/batch`, {
            items: requestItems
        }, { timeout: 120000 }); // 2 minutes for batch

        const results = resp.data.results || [];
        return results.map((r, idx) => {
            if (!r.success) {
                return { dataUrl: items[idx]?.url || null, localPath: null, base64: null };
            }
            const buffer = Buffer.from(r.image_base64, 'base64');
            const key = cacheKey(r.image_url, r.product_type);
            const localPath = saveCached(key, buffer);
            return {
                dataUrl: `data:image/png;base64,${r.image_base64}`,
                base64: r.image_base64,
                localPath
            };
        });
    } catch (err) {
        console.error('[ImageProcessor] Batch failed:', err.message);
        return items.map(item => ({ dataUrl: item.url, localPath: null, base64: null }));
    }
}

/**
 * Get processed image URL for a product
 * Ưu tiên: processed_image field → rembg on-the-fly → ảnh gốc
 * 
 * @param {Object} product - Mongoose lean doc
 * @param {string} productType
 * @returns {string|null} URL hoặc data URL
 */
function getProductImageUrl(product, productType = 'flower') {
    if (!product) return null;
    
    // Đã có processed_image → dùng luôn
    if (product.processed_image) return product.processed_image;
    
    // Có ảnh gốc → trả URL gốc (lazy remove bg khi cần)
    const firstImg = product.images?.[0];
    if (firstImg?.url) return firstImg.url;
    
    return null;
}

/**
 * Process và lưu processed_image cho 1 product
 * Gọi rembg qua Python service
 * 
 * @param {Object} product - Mongoose product doc (live, not lean)
 * @param {string} productType
 * @returns {Promise<string|null>} dataUrl của ảnh đã xử lý
 */
async function processAndSaveProductImage(product, productType = 'flower') {
    if (!product) return null;
    
    const firstImg = product.images?.[0];
    const imageUrl = firstImg?.url || firstImg?.secure_url || null;
    
    if (!imageUrl) {
        console.warn(`[ImageProcessor] No image URL for product ${product._id}`);
        return null;
    }

    if (product.processed_image) {
        console.log(`[ImageProcessor] Already processed: ${product._id}`);
        return product.processed_image;
    }

    const result = await removeBackground(imageUrl, productType);
    // Trả về localPath dạng /data/processed_images/xxx.png để serve static
    if (result?.localPath) {
        const relativePath = `/data/processed_images/${path.basename(result.localPath)}`;
        return relativePath;
    }
    return imageUrl; // fallback
}

module.exports = {
    removeBackground,
    batchRemoveBackground,
    getProductImageUrl,
    processAndSaveProductImage,
    PRODUCT_TYPE_MAP
};
