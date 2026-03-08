const Product = require('../models/Product');

class IrisService {
    /**
     * Xử lý logic rẽ nhánh và sinh Template Response theo Intent
     * @param {string} intent - Ý định từ NLP Engine (vd: "Greeting", "Ask_Price", ...)
     * @param {object} entities - Thực thể bóc tách được (vd: { FLOWER: "hoa hồng" })
     * @param {string} userMessage - Tin nhắn gốc từ user
     */
    async handleIntent(intent, entities, userMessage) {
        let reply = "";
        let responseData = null;

        // Mapping các Case này khớp với nhãn đã train trong data_iris.json
        switch (intent) {
            case "Greeting":
            case "GREETING": {
                const greetings = [
                    "Dạ Rosee xin chào ạ! 🌸 Mình là Iris, trợ lý CSKH. Mình có thể giúp gì cho bạn?",
                    "Chào bạn, tiệm hoa Rosee nghe đây ạ! Bạn cần hỗ trợ về sản phẩm hay chính sách giao hàng nhỉ?",
                    "Dạ chào bạn, bạn đang tìm kiếm mẫu hoa cho dịp gì thế ạ?"
                ];
                reply = greetings[Math.floor(Math.random() * greetings.length)];
                break;
            }

            case "Ask_Policy":
            case "CHECK_POLICY":
                reply = "🚐 **Về chính sách của Rosee:**\n- Freeship cho đơn từ 1 triệu đồng nội thành.\n- Có hỗ trợ giao hỏa tốc 2H (có tính phí).\n- Cam kết hoa tươi 100% khi tới tay người nhận, hỗ trợ đổi trả nếu dập nát ạ.";
                break;

            case "CREATE_BOUQUET":
                reply = "Dạ để tự tay thiết kế một lẵng hoa mang đậm dấu ấn cá nhân, bạn hãy chuyển sang mục **Thiết kế giỏ hoa** để gặp trợ lý Hydrangea (Cẩm Tú Cầu) - chuyên gia thiết kế 3D của tiệm nhé! 🎨";
                break;

            case "Ask_Price":
            case "ASK_PRICE_STOCK": {
                // GỌI HÀM XỬ LÝ HYBRID (NER + DB + TEMPLATE)
                const priceInfo = await this._handleHybridPriceCheck(entities, userMessage);
                reply = priceInfo.reply;
                responseData = priceInfo.data;
                break;
            }

            case "Out_Of_Domain":
            case "OUT_OF_DOMAIN":
            default:
                reply = "Dạ Iris là trợ lý ảo chuyên về Hoa tươi của tiệm Rosee thôi ạ, những vấn đề khác mình chưa được học. Bạn hỏi mình về hoa tươi hoặc giá cả nhé 🌸";
                break;
        }

        return { reply, responseData };
    }

    /**
     * TRÁI TIM CỦA HYBRID CHATBOT: Xử lý hỏi giá (Entities -> DB -> Template)
     */
    async _handleHybridPriceCheck(entities, message) {
        try {
            entities = entities || {};

            // NER entities có thể là string "hoa hồng" hoặc đã có sẵn từ nlp.service
            // Lấy tên hoa từ entities (key có thể là FLOWER, flower, Flower tùy model NER)
            const flowerName = entities.FLOWER || entities.flower || entities.Flower || null;

            if (flowerName) {
                // Query DB tìm hoa sát tên nhất
                const products = await Product.find({
                    name: { $regex: new RegExp(flowerName, 'i') },
                }).limit(3);

                // TEMPLATE RESPONSE (Sinh câu trả lời tự nhiên có thật)
                if (products.length > 0) {
                    const topProduct = products[0];

                    let reply = `Dạ hiện tại dòng **${topProduct.name}** bên em đang có giá là **${topProduct.price.toLocaleString('vi-VN')} VNĐ** ạ. `;

                    if (products.length > 1) {
                        reply += `Ngoài ra em còn tìm thấy ${products.length - 1} mẫu tương tự. `;
                    }
                    reply += `Em gửi mẫu cho bạn xem thử nhé?`;

                    return { reply: reply, data: { products } };
                } else {
                    return {
                        reply: `Dạ xin lỗi bạn, mình vừa kiểm tra kho thì dòng hoa "${flowerName}" đang tạm hết hàng hoặc chưa được cập nhật giá 🥲. Bạn có muốn tham khảo sang mẫu Hoa Hồng hoặc Hướng Dương không ạ?`,
                        data: null
                    };
                }
            } else {
                // Khách hỏi chung chung "Hoa giá bao nhiêu", "báo giá shop ơi"
                const randomProducts = await Product.find().limit(3);
                return {
                    reply: "Dạ các mẫu hoa tại Rosee có giá đa dạng từ 200k đến 2 triệu đồng tuỳ vào kích cỡ lẵng. Mình gửi bạn tham khảo một vài mẫu đang bán chạy nhất tiệm nhé. Bạn ưng mẫu nào cứ chỉ mình ạ!",
                    data: { products: randomProducts }
                };
            }
        } catch (err) {
            console.error("Hybrid Price Check Error:", err.message);
            return {
                reply: "Dạ tiệm em có đa dạng các dòng hoa với giá từ 200k ạ. Bạn muốn tìm hoa loại nào để em báo giá chi tiết?",
                data: null
            };
        }
    }
}

module.exports = new IrisService();