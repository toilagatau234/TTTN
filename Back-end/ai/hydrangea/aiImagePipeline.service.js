/**
 * Back-end/ai/hydrangea/aiImagePipeline.service.js
 *
 * Pipeline tạo ảnh AI cho Hydrangea Studio — 8 bước:
 *
 * 1. validateInput       — kiểm tra đầu vào
 * 2. detectBouquetType   — nhận dạng loại bó hoa (logic nội bộ, KHÔNG AI)
 * 3. buildStructuredPrompt — xây dựng prompt có cấu trúc
 * 4. callGeminiForEnhancement — cải thiện câu từ (DUY NHẤT dùng Gemini)
 * 5. deletePreviousImages — xóa ảnh cũ Cloudinary (khi regenerate)
 * 6. generateVariations  — tạo 2 ảnh từ Pollinations AI
 * 7. uploadToCloudinary  — lưu ảnh lên Cloudinary, lấy URL
 * 8. filterResults       — lọc kết quả, đảm bảo ít nhất 1 ảnh hợp lệ
 *
 * Ràng buộc:
 * - Gemini chỉ dùng để enhance wording (không quyết định logic)
 * - Tất cả logic kinh doanh là deterministic (nội bộ)
 * - Timeout toàn cục: 25 giây
 */

const https = require('https');
const http  = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { uploadBase64Image, deleteImages } = require('../../services/cloudinary.service');

const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;
const GLOBAL_TIMEOUT_MS = 90_000; // 90s toàn cục (2 ảnh mỗi ảnh tối đa 45s)
const GEMINI_TIMEOUT_MS = 10_000; // 10s cho Gemini
const IMAGE_TIMEOUT_MS  = 45_000; // 45s mỗi ảnh Pollinations
const MAX_RETRIES       = 1;      // Chỉ retry 1 lần (tránh spam 429)
const VARIATION_DELAY   = 3000;   // 3s giữa 2 lần gọi (tránh rate limit)

// ── ENUM loại bó hoa ───────────────────────────────────────────────────────────
const BOUQUET_TYPES = {
    BOUQUET: 'bouquet',
    BASKET:  'basket',
    BOX:     'box',
    VASE:    'vase',
    STAND:   'stand',
};

// ── Bảng ánh xạ Tiếng Việt → loại bó hoa ─────────────────────────────────────
const BOUQUET_TYPE_MAP = {
    'bó hoa':   BOUQUET_TYPES.BOUQUET,
    'bó':       BOUQUET_TYPES.BOUQUET,
    'giỏ hoa':  BOUQUET_TYPES.BASKET,
    'giỏ':      BOUQUET_TYPES.BASKET,
    'lẵng hoa': BOUQUET_TYPES.BASKET,
    'lẵng':     BOUQUET_TYPES.BASKET,
    'hộp hoa':  BOUQUET_TYPES.BOX,
    'hộp':      BOUQUET_TYPES.BOX,
    'bình hoa': BOUQUET_TYPES.VASE,
    'bình':     BOUQUET_TYPES.VASE,
    'kệ hoa':   BOUQUET_TYPES.STAND,
    'kệ':       BOUQUET_TYPES.STAND,
};

// ── Mô tả tiếng Anh cho từng loại (dùng trong prompt) ─────────────────────────
const BOUQUET_TYPE_LABELS = {
    [BOUQUET_TYPES.BOUQUET]: 'hand-tied bouquet',
    [BOUQUET_TYPES.BASKET]:  'flower basket arrangement',
    [BOUQUET_TYPES.BOX]:     'flower box arrangement',
    [BOUQUET_TYPES.VASE]:    'vase flower arrangement',
    [BOUQUET_TYPES.STAND]:   'flower stand display',
};

// ── Ràng buộc "NOT other types" trong prompt ──────────────────────────────────
const BOUQUET_TYPE_EXCLUSIONS = {
    [BOUQUET_TYPES.BOUQUET]: 'NOT a basket, NOT a box, NOT in any container',
    [BOUQUET_TYPES.BASKET]:  'NOT a hand-tied bouquet, NOT a box',
    [BOUQUET_TYPES.BOX]:     'NOT a basket, NOT a hand-tied bouquet',
    [BOUQUET_TYPES.VASE]:    'NOT a basket, NOT a hand-tied bouquet',
    [BOUQUET_TYPES.STAND]:   'NOT a basket, NOT a hand-tied bouquet',
};

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 1 — Kiểm tra đầu vào
// ═════════════════════════════════════════════════════════════════════════════
function validateInput(entities, selectedItems) {
    const hasFlowers = (entities?.flower_types?.length > 0) ||
                       (selectedItems?.main_flowers?.length > 0);
    const hasColors  = entities?.colors?.length > 0;

    if (!hasFlowers && !hasColors) {
        throw new Error(
            'Vui lòng mô tả loại hoa hoặc màu sắc bạn muốn trước khi tạo ảnh!'
        );
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 2 — Nhận dạng loại bó hoa (logic nội bộ, KHÔNG AI)
// ═════════════════════════════════════════════════════════════════════════════
function detectBouquetType(entities, selectedItems) {
    // Ưu tiên 1: entities.category từ Python AI
    if (entities?.category) {
        const cat = entities.category.toLowerCase().trim();
        for (const [keyword, type] of Object.entries(BOUQUET_TYPE_MAP)) {
            if (cat.includes(keyword)) {
                console.log(`[Pipeline] detectBouquetType: "${cat}" → "${type}" (from entities.category)`);
                return type;
            }
        }
    }

    // Ưu tiên 2: tên basket đã chọn
    const basketName = selectedItems?.basket?.name || '';
    if (basketName) {
        const bName = basketName.toLowerCase();
        for (const [keyword, type] of Object.entries(BOUQUET_TYPE_MAP)) {
            if (bName.includes(keyword)) {
                console.log(`[Pipeline] detectBouquetType: "${bName}" → "${type}" (from basket name)`);
                return type;
            }
        }
    }

    // Fallback an toàn
    console.log(`[Pipeline] detectBouquetType: fallback → "bouquet"`);
    return BOUQUET_TYPES.BOUQUET;
}

// ═════════════════════════════════════════════════════════════════════════════
// TỪ ĐIỂN DỊCH TỰ ĐỘNG (Bỏ Gemini để tránh sai màu)
// ═════════════════════════════════════════════════════════════════════════════
const VI_TO_EN_MAP = {
    // Màu sắc
    'đỏ': 'red', 'đỏ nhung': 'velvet red', 'đỏ cam': 'orange red', 'đỏ mận': 'burgundy',
    'xanh': 'blue', 'xanh dương': 'blue', 'xanh lá': 'green', 'xanh lơ': 'cyan', 'xanh ngọc': 'turquoise',
    'vàng': 'yellow', 'vàng chanh': 'lemon yellow', 'vàng cam': 'golden yellow',
    'trắng': 'white', 'trắng kem': 'cream white', 'trắng sữa': 'milky white',
    'hồng': 'pink', 'hồng phấn': 'pastel pink', 'hồng đào': 'peach pink', 'hồng đậm': 'hot pink',
    'tím': 'purple', 'tím nhạt': 'lavender', 'tím đậm': 'deep purple',
    'cam': 'orange', 'cam đất': 'terracotta', 'cam đào': 'peach',
    'đen': 'black', 'nâu': 'brown', 'nâu đất': 'earth brown', 'xám': 'gray',
    // Hoa
    'cẩm tú cầu': 'hydrangea', 'hoa hồng': 'rose', 'hướng dương': 'sunflower',
    'cúc': 'daisy', 'cúc mẫu đơn': 'peony', 'lan': 'orchid', 'lan hồ điệp': 'phalaenopsis orchid',
    'tulip': 'tulip', 'đồng tiền': 'gerbera', 'thạch thảo': 'aster', 'baby': 'baby breath',
    'cẩm chướng': 'carnation', 'ly': 'lily', 'hoa ly': 'lily', 'hoa sen': 'lotus',
    // Phụ kiện
    'giấy gói': 'wrapping paper', 'ruy băng': 'ribbon', 'giỏ': 'basket', 'lẵng': 'basket', 'hộp': 'box',
    'giấy': 'paper', 'trong suốt': 'transparent', 'kraft': 'kraft'
};

function translateViToEn(text) {
    if (!text) return text;
    let translated = text.toLowerCase();
    // Thay thế các cụm từ dài trước
    const sortedKeys = Object.keys(VI_TO_EN_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (translated.includes(key)) {
            translated = translated.replace(new RegExp(key, 'g'), VI_TO_EN_MAP[key]);
        }
    }
    return translated;
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 3 — Xây dựng prompt có cấu trúc
// ═════════════════════════════════════════════════════════════════════════════
function buildStructuredPrompt(bouquetType, entities, selectedItems) {
    // 1. Lấy thông tin Hoa chính (Ưu tiên từ selectedItems trước)
    let mainFlowers = [];
    if (selectedItems?.main_flowers?.length > 0) {
        mainFlowers = selectedItems.main_flowers.map(f => ({
            type: f.name,
            color: f.dominant_color || 'natural color'
        }));
    } else {
        mainFlowers = (entities?.flowers || entities?.structured_flowers || [])
            .filter(f => f.role === 'main' || !f.role);
    }
    
    // 2. Lấy thông tin Phụ kiện
    const wrapping = selectedItems?.wrapper;
    const ribbon = selectedItems?.ribbon;

    // Lấy màu giấy gói và ruy băng (Ưu tiên dominant_color từ DB)
    const wrappingColor = wrapping?.dominant_color || entities?.wrapper || "none";
    const ribbonColor = ribbon?.dominant_color || entities?.ribbon || "none";

    // Structured prompt as requested
    const prompt = `
A realistic, highly detailed, masterpiece photography of a ${translateViToEn(bouquetType)}:

Main flowers:
${mainFlowers.map(f => `- ${translateViToEn(f.color || "natural color")} ${translateViToEn(f.type)}`).join('\n')}

Accessories:
- Wrapping: ${translateViToEn(wrappingColor)}
- Ribbon: ${translateViToEn(ribbonColor)}

Professional studio lighting, 8k resolution, photorealistic, elegant composition, clean background.
`;

    const rawPrompt = prompt.trim();
    
    // Maintain metadata for later use
    const metadata = {
        type:    bouquetType,
        flowers: mainFlowers.map(f => f.type),
        colors:  mainFlowers.map(f => f.color).filter(Boolean),
        accessories: [wrappingColor, ribbonColor].filter(c => c !== "none")
    };

    console.log(`[Pipeline] buildStructuredPrompt: type="${bouquetType}", flowers=${JSON.stringify(metadata.flowers)}`);
    return { rawPrompt, metadata };
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 4 — Gọi Gemini để cải thiện câu từ (ĐÃ TẮT THEO YÊU CẦU ĐỂ TRÁNH SAI MÀU)
// ═════════════════════════════════════════════════════════════════════════════
async function callGeminiForEnhancement(rawPrompt) {
    return rawPrompt; // Bỏ qua hoàn toàn Gemini, trả về nguyên mẫu tĩnh
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 5 — Xóa ảnh Cloudinary cũ (chạy trước khi generate nếu là regenerate)
// ═════════════════════════════════════════════════════════════════════════════
async function deletePreviousImages(publicIds = []) {
    if (!publicIds?.length) return;
    console.log(`[Pipeline] Xóa ${publicIds.length} ảnh cũ khỏi Cloudinary...`);
    const result = await deleteImages(publicIds);
    console.log(`[Pipeline] Đã xóa ${result.deleted}/${publicIds.length} ảnh, lỗi: ${result.failed}`);
    // Không throw — lỗi xóa không được chặn luồng generate
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 6 — Tạo ảnh từ Pollinations AI
// ═════════════════════════════════════════════════════════════════════════════
function fetchImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, { timeout: IMAGE_TIMEOUT_MS }, (res) => {
            // Theo redirect
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Pollinations HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', c  => chunks.push(c));
            res.on('end',  () => resolve(Buffer.concat(chunks).toString('base64')));
            res.on('error',    reject);
        });

        req.on('error',   reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Pollinations timeout (${IMAGE_TIMEOUT_MS / 1000}s)`));
        });
    });
}

async function generateOneImage(prompt, retryCount = 0) {
    const seed    = Math.floor(Math.random() * 999999);
    const encoded = encodeURIComponent(prompt);
    const url     = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&model=flux&seed=${seed}&nologo=true`;

    try {
        console.log(`[Pipeline] Pollinations gọi lần ${retryCount + 1}, seed=${seed}`);
        const base64 = await fetchImageAsBase64(url);
        console.log(`[Pipeline] ✅ Ảnh nhận được, size=${base64.length} chars`);
        return { success: true, base64, mimeType: 'image/jpeg' };
    } catch (err) {
        const is429 = err.message?.includes('429');
        if (retryCount < MAX_RETRIES) {
            // Chờ lâu hơn nếu bị rate limit
            const waitMs = is429 ? 6000 : 2000 * (retryCount + 1);
            console.warn(`[Pipeline] Retry ${retryCount + 1}/${MAX_RETRIES} (wait ${waitMs}ms): ${err.message}`);
            await new Promise(r => setTimeout(r, waitMs));
            return generateOneImage(prompt, retryCount + 1);
        }
        console.error(`[Pipeline] ❌ Ảnh thất bại sau ${MAX_RETRIES} lần retry: ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function generateVariations(prompt, count = 1) {
    // FIX: Generate only 1 image (not 2) to reduce timeout risk
    // Typical: 30-40s for 1 image vs 60-90s for 2 images
    const results = [];
    for (let i = 0; i < count; i++) {
        if (i > 0) {
            // Delay giữa các lần gọi để tránh rate limit
            await new Promise(r => setTimeout(r, VARIATION_DELAY));
        }
        const result = await generateOneImage(prompt);
        results.push(result);
    }
    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 7 — Upload lên Cloudinary
// ═════════════════════════════════════════════════════════════════════════════
async function uploadVariationsToCloudinary(variations) {
    const uploaded = [];
    for (const v of variations) {
        if (!v.success || !v.base64) continue;
        try {
            const result = await uploadBase64Image(v.base64, 'hydrangea-generated', v.mimeType);
            uploaded.push({ url: result.url, public_id: result.public_id });
            console.log(`[Pipeline] ✅ Upload Cloudinary OK: ${result.url.substring(0, 60)}...`);
        } catch (err) {
            console.error('[Pipeline] ❌ Upload Cloudinary thất bại:', err.message);
            // Bỏ qua ảnh lỗi, tiếp tục
        }
    }
    return uploaded;
}

// ═════════════════════════════════════════════════════════════════════════════
// BƯỚC 8 — Lọc kết quả
// ═════════════════════════════════════════════════════════════════════════════
function filterResults(uploadedImages) {
    const valid = uploadedImages.filter(img => img?.url && img?.public_id);
    if (valid.length === 0) {
        throw new Error('Không thể tạo ảnh lúc này. Vui lòng thử lại sau!');
    }
    return valid;
}

// ═════════════════════════════════════════════════════════════════════════════
// HÀM XUẤT CHÍNH
// ═════════════════════════════════════════════════════════════════════════════

/**
 * generateBouquetImages
 *
 * Pipeline đầy đủ 8 bước. Timeout toàn cục 90 giây.
 * 
 * FIX v3: Tạo 1 ảnh + return base64 (KHÔNG upload Cloudinary ngay)
 * - User thấy preview (base64)
 * - Khi confirm → upload
 * - Tiết kiệm resource + tránh timeout
 *
 * @param {object} entities       - Thực thể từ AI (flower_types, colors, category, ...)
 * @param {object} selectedItems  - Items người dùng đã chọn (basket, main_flowers, ...)
 * @param {string} [customPrompt] - Prompt tùy chỉnh của người dùng (nếu dùng refine)
 * @returns {{ success, imageBase64, prompt_used, metadata, status }}
 */
async function generateBouquetImages(entities, selectedItems, customPrompt = null) {
    const pipeline = async () => {
        // Bước 1: Validate
        validateInput(entities, selectedItems);

        // Bước 2: Detect loại bó hoa
        const bouquetType = detectBouquetType(entities, selectedItems);

        // Bước 3: Build prompt
        const { rawPrompt, metadata } = buildStructuredPrompt(bouquetType, entities, selectedItems);

        // Nếu user override prompt (refine flow)
        const promptToEnhance = customPrompt?.trim() ? customPrompt.trim() : rawPrompt;

        // Bước 4: Gemini enhance
        const enhancedPrompt = await callGeminiForEnhancement(promptToEnhance);

        // Bước 6: Generate 1 ảnh (bước 5 — deletePreviousImages — chạy ở controller)
        const variations = await generateVariations(enhancedPrompt, 1);

        // FIX v3: Return base64 KHÔNG upload Cloudinary
        if (!variations[0]?.success || !variations[0]?.base64) {
            throw new Error('Không thể tạo ảnh. Vui lòng thử lại!');
        }

        // FIX v4: Generate generationId
        const crypto = require('crypto');
        const generationId = crypto.randomUUID();

        return {
            success:      true,
            generationId: generationId,
            imageBase64:  variations[0].base64,     // base64 string
            mimeType:     variations[0].mimeType,   // 'image/jpeg'
            prompt_used:  enhancedPrompt,
            metadata,                                // { type, flowers, colors }
            status:       'preview_ready',           // NEW: Chỉ preview, chưa upload Cloudinary
        };
    };

    // Timeout toàn cục 90s
    const globalTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Pipeline timeout (90s) — vui lòng thử lại!')), GLOBAL_TIMEOUT_MS)
    );

    try {
        return await Promise.race([pipeline(), globalTimeout]);
    } catch (err) {
        console.error('[Pipeline] ❌ Lỗi pipeline:', err.message);
        return {
            success: false,
            error:   err.message || 'Không thể tạo ảnh lúc này. Vui lòng thử lại!',
            status:  'error',
        };
    }
}

module.exports = {
    generateBouquetImages,
    deletePreviousImages,
    detectBouquetType,
    buildStructuredPrompt,
    BOUQUET_TYPES,
};
