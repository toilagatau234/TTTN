/**
 * @fileoverview Hydrangea Service - Xử lý mạch quản lý State Machine (Multi-turn hội thoại).
 */

const sessionService = require('./session.service');
const nlpService = require('./nlp.service');
const geminiService = require('./gemini.service');
const Product = require('../models/Product');

/**
 * Xử lý luồng Chat của Hydrangea.
 * 
 * @param {string} userId - Định danh của người dùng (Session ID).
 * @param {string} message - Tin nhắn đầu vào.
 * @param {boolean} isConfirming - Cờ cho biết người dùng có đang nhấn "Xác nhận tạo giỏ hoa" không.
 * @returns {Promise<{botReply: string, imageUrl: string|null, entities: object}>}
 */
async function processChatMessage(userId, message, isConfirming) {
    // 1. Lấy Session hiện tại (State & Entities)
    const session = sessionService.getSession(userId);
    let replyText = "";
    let imageUrl = null;

    // 2. Nếu người dùng đang bấm Xác Nhận (nghĩa là State đã đầy đủ)
    if (isConfirming) {
        const prompt = geminiService.buildGeminiPrompt(session.entities);
        try {
            imageUrl = await geminiService.generateImage(prompt);
            replyText = "Hydrangea đã phác thảo xong giỏ hoa độc bản của bạn. Bạn xem có ưng ý không nhé!";

            // Clear session (hoặc cho phép chỉnh sửa tiếp)
            // sessionService.clearSession(userId);
        } catch (error) {
            replyText = "Xin lỗi bạn, lúc này Họa sĩ AI của Rosee đang bận vẽ ảnh cho vị khách khác rồi. Bạn vui lòng quay lại sau ít phút nha 🥲";
        }

        return { botReply: replyText, imageUrl, entities: session.entities };
    }

    // 3. Nếu không phải xác nhận, thì tiến hành phân tích tin nhắn (NLP)
    const { intent, entities: newEntities } = await nlpService.analyzeText(message);

    // 4. Update các Entities mới tìm được vào Session
    const updatedSession = sessionService.updateSession(userId, { entities: newEntities });
    const entities = updatedSession.entities;

    // 5. State Machine: Kiểm tra xem đã đủ thông tin cốt lõi chưa?
    // Yêu cầu: Bắt buộc tối thiểu phải biết 1 loại hoa HOẶC 1 màu sắc.
    if (!entities.flower && !entities.color) {
        replyText = "Bạn muốn giỏ hoa của mình có tone màu chủ đạo nào, hay mix các loại hoa cụ thể nào ạ? (Ví dụ: 'Tôi thích hoa hồng tone đỏ mộng mơ')";
        return { botReply: replyText, imageUrl: null, entities: entities };
    }

    // 6. Nếu đã có 1 trong 2 thông tin cốt lõi, tiến hành RAG query kho hoa
    const availableProducts = await _queryInventory(entities);

    // 7. Sinh Context Text phản hồi
    if (availableProducts.length === 0) {
        replyText = `Hiện tại kho Rosee đang tạm hết loại ${entities.flower || ''} màu ${entities.color || ''}. Bạn có muốn đổi sang tông màu khác không ạ? Mình vẫn sẵn sàng hỗ trợ bạn đổi nha!`;
    } else {
        const flowerNames = availableProducts.map(p => p.name).join(", ");
        replyText = `Tuyệt vời! Hydrangea vừa kiểm tra kho, hiện Rosee có sẵn các loại nguyên liệu mộc mạc và xinh xắn này hợp với ý của bạn: ${flowerNames}. Bạn có muốn nâng cấp thêm phụ kiện gì không, hay để mình bắt đầu lên bản phác thảo thiết kế 3D cho giỏ hoa này nhé? (Nhấn xác nhận nếu bạn đã đồng ý)`;
    }

    return { botReply: replyText, imageUrl: null, entities: entities };
}

/**
 * Trình truy vấn động kho RAG nội bộ
 */
async function _queryInventory(entities) {
    const query = {};
    if (entities.flower) query.name = { $regex: new RegExp(entities.flower, 'i') };
    // Để search màu chính xác, Model cần có trường 'color' (hoặc tìm text matching)
    // if (entities.color) query.color = entities.color; 

    const products = await Product.find(query).limit(3).lean();
    return products;
}

module.exports = {
    processChatMessage
};
