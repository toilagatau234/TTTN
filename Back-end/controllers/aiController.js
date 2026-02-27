const axios = require('axios');
const Product = require('../models/Product'); // Đảm bảo đường dẫn model đúng
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Gemini (Chỉ dùng model sinh ảnh theo yêu cầu của bạn)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const userText = req.body.message;
        if (!userText) return res.status(400).json({ success: false, message: 'Message is required' });

        // 1. Gửi văn bản sang Python để NLP xử lý (An toàn, không leak key)
        const nlpResponse = await axios.post('http://127.0.0.1:8000/api/nlp/analyze', { text: userText });
        const { intent, entities } = nlpResponse.data;

        // 2. SINH VĂN BẢN TRÒ CHUYỆN ĐỘNG (Dynamic Text Generation)
        let botReply = "";
        let responseData = null;

        switch (intent) {
            case "GREETING":
                const greetings = ["Dạ Rosee xin chào ạ!", "Chào bạn, tiệm hoa Rosee có thể giúp gì cho bạn?", "Dạ shop nghe đây ạ!"];
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
                let askedFlowers = entities.FLOWER ? entities.FLOWER.join(", ") : "hoa này";
                botReply = `Dạ hiện tại kho Rosee luôn cập nhật mới các dòng ${askedFlowers}. Bạn muốn lấy mức giá sinh viên hay cao cấp để shop lên đơn ạ?`;
                break;

            case "CREATE_BOUQUET":
                // ---> ĐÂY LÀ LÚC DUY NHẤT TRIGGER GEMINI VÀ DATABASE
                let query = {};
                if (entities.FLOWER) {
                    query.name = { $regex: entities.FLOWER.join("|"), $options: "i" };
                }
                // Tìm hoa trong DB
                const matchedProducts = await Product.find(query).limit(5);

                if (matchedProducts.length === 0) {
                    botReply = "Tiệm hiểu ý bạn rồi, nhưng hiện tại trong kho đang tạm hết dòng hoa này mất rồi, bạn đổi loại khác giúp tiệm nha 🥲";
                } else {
                    // Tính tổng giá và trích xuất tên hoa
                    const totalPrice = matchedProducts.reduce((sum, p) => sum + p.price, 0) + 50000;
                    const flowerNames = matchedProducts.map(p => p.name).join(", ");
                    const style = entities.STYLE ? entities.STYLE.join(" ") : "sang trọng";

                    botReply = `Tuyệt vời! Rosee đã tìm thấy các nguyên liệu thật trong kho để làm lẵng hoa theo phong cách ${style} cho bạn. AI của tiệm đang vẽ bản phác thảo, bạn đợi xíu nhé...`;
                    
                    // --- GỌI GEMINI VẼ ẢNH ---
                    try {
                        // Lưu ý: Nếu bạn có quyền dùng Imagen qua thư viện Google Gen AI Nodejs
                        // Tuy nhiên Gemini Text Model không trả về file ảnh trực tiếp mà trả về text.
                        // Nếu tài khoản Google AI Studio của bạn chưa mở khóa Imagen 3, có thể prompt Gemini mô tả bức ảnh.
                        const visualPrompt = `A hyper-realistic 8k studio photo of a flower bouquet strictly containing: ${flowerNames}. Style: ${style}. Clean background.`;
                        
                        // Mô phỏng gọi API vẽ ảnh
                        // ... code gọi API vẽ ảnh ...
                        const generatedImageUrl = "https://rosee-ecommerce.com/sample_ai_bouquet.jpg"; // Thay bằng link thật sau này

                        responseData = {
                            entities_used: entities,
                            products: matchedProducts,
                            total_price: totalPrice,
                            image: generatedImageUrl
                        };
                    } catch (apiError) {
                        console.error("Gemini Error:", apiError);
                        botReply = "Đã tìm thấy hoa thật nhưng AI vẽ ảnh đang bận chút việc, bạn xem tạm danh sách nguyên liệu bên dưới nhé!";
                        responseData = { products: matchedProducts, total_price: totalPrice };
                    }
                }
                break;

            default:
                botReply = "Xin lỗi, hệ thống chưa nhận diện được yêu cầu của bạn.";
        }

        // 3. TRẢ KẾT QUẢ VỀ CLIENT (React/Flutter)
        return res.status(200).json({
            success: true,
            intent: intent,
            message: botReply,
            data: responseData
        });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi giao tiếp AI' });
    }
};