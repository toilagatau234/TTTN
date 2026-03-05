const Product = require('../models/Product');

/**
 * Xử lý intent và sinh câu trả lời tự nhiên (Dynamic Template) cho Iris AI.
 *
 * @param {string} intent - Intent (ý định) nhân diện bởi NLP Engine.
 * @param {object} entities - Entities (thực thể) trích xuất bởi NLP Engine.
 * @returns {Promise<{botReply: string, responseData: object|null}>}
 */
async function processIntent(intent, entities = {}) {
    let botReply = "";
    let responseData = null;

    switch (intent) {
        case "GREETING":
            const greetings = [
                "Dạ Rosee xin chào ạ!",
                "Chào bạn, tiệm hoa Rosee có thể giúp gì cho bạn?",
                "Dạ shop nghe đây ạ!"
            ];
            botReply = greetings[Math.floor(Math.random() * greetings.length)];
            break;

        case "OUT_OF_DOMAIN":
            botReply = "Dạ Rosee là trợ lý AI chuyên về hoa tươi, những vấn đề khác mình chưa được học. Bạn hỏi mình về hoa nhé 🌸";
            break;

        case "CHECK_POLICY":
            botReply = "Dạ tiệm Rosee có hỗ trợ giao hoa hỏa tốc nội thành trong 2 giờ và freeship cho đơn từ 1 triệu đồng ạ. Đảm bảo hoa tươi 100% khi tới tay người nhận nha bạn.";
            break;

        case "ASK_PRICE_STOCK":
            // Sinh câu trả lời dựa trên từ khóa hoa khách hỏi
            let askedFlowers = entities.FLOWER && entities.FLOWER.length > 0
                ? entities.FLOWER.join(", ")
                : "hoa này";
            botReply = `Dạ hiện tại kho Rosee luôn cập nhật mới các dòng ${askedFlowers}. Bạn muốn lấy mức giá sinh viên hay cao cấp để shop lên đơn ạ?`;

            // Tìm hoa trong Database cung cấp thêm thông tin sản phẩm (RAG đơn giản)
            let query = {};
            if (entities.FLOWER && entities.FLOWER.length > 0) {
                query.name = { $regex: entities.FLOWER.join("|"), $options: "i" };
                const matchedProducts = await Product.find(query).limit(5);

                if (matchedProducts.length > 0) {
                    responseData = { products: matchedProducts };
                } else {
                    botReply = `Xin lỗi bạn, mình vừa kiểm tra thì hiện tại tiệm đang tạm hết dòng ${askedFlowers} mất rồi 🥲 Bạn có muốn tham khảo các mẫu hoa khác không ạ?`;
                }
            } else {
                // Nếu khách chỉ hỏi mông lung, gợi ý ngẫu nhiên hoặc các SP bán chạy
                const randomProducts = await Product.find().limit(5);
                responseData = { products: randomProducts };
            }
            break;

        case "CREATE_BOUQUET":
            // Nếu khách hàng muốn tạo giỏ hoa, Iris sẽ điều hướng họ qua AI Hydrangea
            botReply = "Dạ để tự tay thiết kế một lẵng hoa mang đậm dấu ấn cá nhân của bạn, bạn hãy sử dụng trợ lý Cẩm Tú Cầu (Hydrangea) ở trang Thiết kế giỏ hoa nhé! Mình là Iris chuyên hỗ trợ chính sách thôi ạ.";
            break;

        default:
            botReply = "Xin lỗi, hiện tại Iris chưa hiểu rõ ý của bạn lắm. Bạn có thể nói rõ hơn về vấn đề hoa tươi hoặc chính sách mua hàng được không ạ?";
    }

    return { botReply, responseData };
}

module.exports = {
    processIntent
};
