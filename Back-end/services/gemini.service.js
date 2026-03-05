/**
 * @fileoverview Gemini Service
 * 
 * Đóng vai trò làm "Họa sĩ AI" - Nhận yêu cầu (Prompt) và sinh ra ảnh tĩnh.
 * Tách biệt hoàn toàn API Key và logic gọi @google/generative-ai module ra khỏi Controller.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Kiểm tra Key khi khởi tạo Server
if (!GEMINI_API_KEY) {
    console.warn("⚠️ [Gemini Service] Warning: GEMINI_API_KEY hiện chưa được thiết lập trong biến môi trường!");
}

// Khởi tạo Gemini Client
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Hàm sinh prompt tiếng Anh tối ưu từ mô tả của khách hàng.
 * @param {object} entities Các thông số bóc tách từ khách hàng.
 * @returns {string} Prompt vẽ ảnh.
 */
function buildGeminiPrompt(entities) {
    const flower = entities.flower || 'mixed fresh flowers';
    const color = entities.color || 'pastel';

    return `A high-quality, ultra-realistic 8k studio photography of a beautiful custom flower basket. 
          Main colors: ${color}. 
          Main flowers: ${flower}. 
          Style: elegant, premium florist arrangement, soft natural lighting, clean background, photorealistic.`;
}

/**
 * Gọi API Google Generative AI (Imagen 3) để vẽ ảnh tĩnh.
 * @param {string} prompt Prompt cần vẽ ảnh.
 * @returns {Promise<string>} Base64 Image URI hoặc Image URL.
 */
async function generateImage(prompt) {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg',
        });

        // API trả về base64 byte array
        const base64Image = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64Image}`;

    } catch (error) {
        console.error('[Gemini Service] Lỗi khi gọi API vẽ ảnh:', error.message);
        throw new Error("Không thể sinh ảnh từ Gemini.");
    }
}

module.exports = {
    buildGeminiPrompt,
    generateImage
};
