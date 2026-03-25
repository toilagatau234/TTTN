// Back-end/services/gemini.service.js
// Sử dụng Gemini 2.5 Flash Image để sinh ảnh hoa AI
const { buildPrompt } = require('./promptBuilder');
const axios = require('axios');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.error("⛔ [Gemini Service] KHÔNG CÓ GEMINI_API_KEY! Thêm vào file .env.");
        }
    }

    async generateFlowerImage(entities, retries = 3) {
        const englishPrompt = buildPrompt(entities);
        console.log("[Gemini Service] Entities:", entities);
        console.log("[Gemini Service] Prompt:", englishPrompt);

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (!this.apiKey) {
                    throw new Error("Server chưa được cấu hình GEMINI_API_KEY trong file .env");
                }

                console.log(`[Gemini Service] Gọi Gemini 2.5 Flash Image (Lần thử ${attempt})...`);

                // Gọi thẳng REST API vì SDK 0.24.1 chưa hỗ trợ responseModalities IMAGE
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${this.apiKey}`;

                const response = await axios.post(url, {
                    contents: [{
                        parts: [{ text: englishPrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['TEXT', 'IMAGE']
                    }
                }, {
                    timeout: 120000 // Chờ tối đa 2 phút cho ảnh phức tạp
                });

                // Duyệt qua các part trong response để tìm ảnh
                const parts = response.data.candidates[0].content.parts;

                for (const part of parts) {
                    if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
                        const base64Image = part.inlineData.data;
                        const mimeType = part.inlineData.mimeType;
                        console.log("[Gemini Service] ✅ Sinh ảnh thành công!");
                        return `data:${mimeType};base64,${base64Image}`;
                    }
                }

                throw new Error("Gemini không trả về ảnh. Parts: " + JSON.stringify(parts.map(p => Object.keys(p))));

            } catch (error) {
                const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
                console.error(`[Gemini Service] Lỗi tạo ảnh (Lần thử ${attempt}):`, errorMsg);

                if (attempt === retries) {
                    console.error("[Gemini Service] Hủy yêu cầu. Toàn bộ các lần thử đều lỗi!");
                    throw new Error(`Sinh ảnh từ Gemini thất bại: ${errorMsg}`);
                }

                const delay = Math.pow(2, attempt - 1) * 2000;
                console.log(`[Gemini Service] Chờ ${delay}ms trước khi thử lại...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
}

module.exports = new GeminiService();
