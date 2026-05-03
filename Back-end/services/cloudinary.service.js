/**
 * Back-end/services/cloudinary.service.js
 *
 * Xử lý upload và xóa ảnh trên Cloudinary.
 * Dùng cho: Hydrangea Studio AI-generated images.
 *
 * Lưu ý: KHÔNG lưu base64 vào DB — chỉ lưu URL + public_id sau khi upload xong.
 */
const cloudinary = require('cloudinary').v2;

// Cloudinary đã được cấu hình qua biến môi trường CLOUDINARY_*
// (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_TIMEOUT_MS = 15_000; // 15s per image

// ── Upload 1 ảnh base64 lên Cloudinary ────────────────────────────────────────
/**
 * @param {string} base64      - Chuỗi base64 thuần (không có "data:image/..." prefix)
 * @param {string} [folder]    - Tên folder trên Cloudinary
 * @param {string} [mimeType]  - MIME type (mặc định 'image/jpeg')
 * @returns {{ url: string, public_id: string }}
 */
async function uploadBase64Image(base64, folder = 'hydrangea-generated', mimeType = 'image/jpeg') {
    const dataUri = `data:${mimeType};base64,${base64}`;

    const uploadPromise = cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        overwrite:     false,
        quality:       'auto:good',
    });

    // Áp dụng timeout để tránh treo
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloudinary upload timeout (15s)')), UPLOAD_TIMEOUT_MS)
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]);

    return {
        url:       result.secure_url,
        public_id: result.public_id,
    };
}

// ── Xóa 1 ảnh khỏi Cloudinary ─────────────────────────────────────────────────
/**
 * @param {string} publicId - public_id lấy từ kết quả upload
 * @returns {{ success: boolean }}
 */
async function deleteImage(publicId) {
    if (!publicId) return { success: false, reason: 'empty public_id' };
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        const success = result.result === 'ok' || result.result === 'not found';
        return { success };
    } catch (err) {
        console.error(`[Cloudinary] deleteImage lỗi (${publicId}):`, err.message);
        return { success: false, error: err.message };
    }
}

// ── Xóa nhiều ảnh (batch) ─────────────────────────────────────────────────────
/**
 * Xóa tuần tự để tránh rate limit. Lỗi 1 ảnh không chặn các ảnh còn lại.
 * @param {string[]} publicIds
 * @returns {{ deleted: number, failed: number }}
 */
async function deleteImages(publicIds = []) {
    if (!publicIds?.length) return { deleted: 0, failed: 0 };

    let deleted = 0;
    let failed  = 0;

    for (const id of publicIds) {
        if (!id) continue;
        const result = await deleteImage(id);
        if (result.success) {
            deleted++;
            console.log(`[Cloudinary] ✅ Đã xóa: ${id}`);
        } else {
            failed++;
            console.warn(`[Cloudinary] ⚠️ Không xóa được: ${id} — ${result.error || result.reason}`);
        }
    }

    return { deleted, failed };
}

module.exports = { uploadBase64Image, deleteImage, deleteImages };
