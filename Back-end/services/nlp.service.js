/**
 * @fileoverview NLP Service cho Hydrangea AI Chatbot.
 *
 * Service này chịu trách nhiệm giao tiếp với Microservice Python NLP Engine
 * (chạy ở cổng 8000) để phân tích Intent và trích xuất Entities (NER) từ văn bản.
 */

const axios = require('axios');

// Địa chỉ của Python NLP Engine
const NLP_ENGINE_URL = process.env.NLP_ENGINE_URL || 'http://127.0.0.1:8000/api/nlp/analyze';

/**
 * Gửi văn bản tới Python NLP Engine để phân tích ý định (Intent) và thực thể (Entities).
 *
 * @param {string} text - Tin nhắn đầu vào của người dùng.
 * @returns {Promise<{intent: string, entities: object}>} Kết quả phân tích (Fallback về 'unknown' nếu lỗi).
 */
async function analyzeText(text) {
  try {
    const response = await axios.post(NLP_ENGINE_URL, { text });

    // Lấy intent và entities từ response, đảm bảo fallback entities là object {} nếu bị undefined
    const { intent, entities = {} } = response.data;

    return {
      intent: intent || 'unknown',
      entities,
    };
  } catch (error) {
    // Log lỗi để debug nhưng không quăng lỗi ra ngoài làm crash luồng ứng dụng
    console.error(`[NLPService] Lỗi kết nối đến Python NLP Engine: ${error.message}`);

    // Fallback result khi Microservice Python sập hoặc phản hồi lỗi
    return {
      intent: 'unknown',
      entities: {},
    };
  }
}

module.exports = {
  analyzeText,
};
