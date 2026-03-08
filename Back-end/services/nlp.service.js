// Back-end/services/nlp.service.js
const axios = require('axios');

class NlpService {
    constructor() {
        this.PYTHON_API_URL = 'http://localhost:8000';
    }

    /**
     * Gửi text sang Python Engine để lấy về cả Ý định (Intent) và Thực thể (Entities)
     * @param {string} text 
     * @returns {Promise<{intent: string, entities: object}>}
     */
    async analyzeText(text) {
        try {
            // Sử dụng Promise.all để gọi song song 2 mô hình AI cùng lúc (Tối ưu tốc độ)
            const [intentResponse, nerResponse] = await Promise.all([
                axios.post(`${this.PYTHON_API_URL}/api/iris/intent`, { text }),
                axios.post(`${this.PYTHON_API_URL}/api/hydrangea/extract`, { text }).catch(() => ({ data: { entities: {} } })) 
                // Catch lỗi ở NER để lỡ mô hình NER có sập thì Intent vẫn chạy được
            ]);

            return {
                intent: intentResponse.data.intent,
                entities: nerResponse.data.entities || {}
            };
        } catch (error) {
            console.error("[NLP Service Error]: Call to Python Engine failed", error.message);
            // Trả về Fallback an toàn nếu Python AI tắt
            return { intent: "OUT_OF_DOMAIN", entities: {} };
        }
    }
}

module.exports = new NlpService();