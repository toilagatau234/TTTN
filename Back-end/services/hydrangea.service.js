const axios = require('axios');
const Product = require('../models/Product');

// Quản lý session hội thoại đơn giản
const sessions = new Map();

class HydrangeaService {
    
    async processChat(sessionId, message, isConfirming, incomingEntities) {
        
        // Bỏ logic tạo ảnh Gemini - giờ không hỗ trợ nữa
        if (isConfirming) {
             return {
                 success: false,
                 reply: "Chức năng AI tự tạo ảnh đang bảo trì, bù lại Rosee đã gợi ý cho bạn những giỏ hoa thật đẹp nhất dựa theo ý thích bên dưới nhé!",
                 status: "suggesting"
             };
        }

        // Khởi tạo session nếu chưa có
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                entities: {
                    flower_type: null,
                    color: null,
                    occasion: null,
                    style: null,
                    layout: null
                },
                history: []
            });
        }
        const session = sessions.get(sessionId);

        // NẾU TÍN HIỆU (message) TRỐNG -> dùng thực thể cũ gọi ý luôn
        if (!message || message.trim() === '') {
             const suggestions = await this.scoreAndMatchProducts(session.entities);
             return {
                 success: true,
                 reply: "Đây là các mẫu hoa gợi ý dựa trên yêu cầu hiện tại của bạn:",
                 extractedEntities: session.entities,
                 status: "suggesting",
                 suggestedProducts: suggestions
             };
        }

        // Gọi FastAPI mới để phân tích câu chat
        let analyzeResult = null;
        try {
            console.log(`[Hydrangea] Đang gửi message đến AI Service: "${message}"`);
            const apiResponse = await axios.post('http://localhost:8000/api/hydrangea/analyze', { text: message });
            analyzeResult = apiResponse.data;
            console.log(`[Hydrangea] AI Service Response:`, analyzeResult);
        } catch (error) {
            console.error("[Hydrangea] Lỗi gọi AI Service:", error.message);
            // Fallback logic in case AI is down
            return {
                success: false,
                reply: "Tin nhắn không gửi được. Xin lỗi, tổng đài AI đang bận. Vui lòng thử lại sau!",
                status: "error"
            };
        }

        const { intent, entities } = analyzeResult;

        // Cập nhật session entities với những thông tin mới nhận được (bỏ qua null)
        if (entities) {
            Object.keys(entities).forEach(key => {
                if (entities[key]) {
                    session.entities[key] = entities[key];
                }
            });
        }

        console.log(`[Hydrangea] Session sau khi cập nhật:`, session.entities);

        // CHẤM ĐIỂM (SCORING) SẢN PHẨM NẾU INTENT LÀ CREATE_BOUQUET hoặc ASK_PRICE_STOCK
        if (intent === 'CREATE_BOUQUET' || intent === 'ASK_PRICE_STOCK') {
            
            // Nếu chưa có hoa chính VÀ chưa có màu, hỏi thêm
            if (!session.entities.flower_type && !session.entities.color) {
                return {
                    success: true,
                    reply: "Bạn muốn tìm mẫu hoa theo tone màu gì, hoặc sử dụng loài hoa chính nào không (ví dụ: hoa hồng, hướng dương...)?",
                    extractedEntities: session.entities,
                    status: "continue",
                    suggestedProducts: []
                };
            }

            // Gọi hàm tính điểm gợi ý sản phẩm
            const suggestions = await this.scoreAndMatchProducts(session.entities);

            if (suggestions.length === 0) {
                 return {
                    success: true,
                    reply: "Tiếc quá, hiện kho Roseer chưa có mẫu nào đặc biệt nổi bật với đúng cấu hình hoa/màu sắc này. Bạn có muốn đổi sang tông màu khác như đỏ, hồng hoặc loài hoa khác không?",
                    extractedEntities: session.entities,
                    status: "continue",
                    suggestedProducts: []
                 };
            }

            let replyMsg = `Mình đã tìm thấy một số mẫu cực kỳ phù hợp với yêu cầu trang trí bằng hoa ${session.entities.flower_type || 'tự chọn'} tông ${session.entities.color || 'màu của bạn'} dưới đây nhé! Bạn có ưng mẫu nào không?`;
            
            if (!session.entities.flower_type && session.entities.color) {
                replyMsg = `Mình có những mẫu tông màu ${session.entities.color} này cực kỳ sang trọng. Bạn xem có thích món nào không nhé!`;
            }

            return {
                success: true,
                reply: replyMsg,
                extractedEntities: session.entities,
                status: "suggesting",
                suggestedProducts: suggestions
            };
        }

        // Với các Intent khác (GREETING, CHECK_POLICY...)
        if (intent === 'GREETING') {
             return {
                 success: true,
                 reply: "Chào bạn! Mình là Trợ lý Hoa Của Rosee. Mình có thể gợi ý cho bạn những giỏ hoa đẹp nhất. Bạn muốn mua hoa cho dịp gì, và màu sắc thích hợp là gì?",
                 extractedEntities: session.entities,
                 status: "continue"
             };
        }
        
        if (intent === 'CHECK_POLICY') {
              return {
                 success: true,
                 reply: "Rosee luôn cam kết chất lượng hoa! Mẫu được gợi ý từ kho đều có sẵn và được cắm cẩn thận. Bạn muốn mình gọi ý mẫu hoa nào hôm nay?",
                 extractedEntities: session.entities,
                 status: "continue"
             };
        }

        // Fallback catch-all
        return {
            success: true,
            reply: "Mình ghi nhận sở thích của bạn! Bạn có muốn bổ sung thêm hoa gì hay màu sắc nào khác không để mình tìm kiếm tốt hơn?",
            extractedEntities: session.entities,
            status: "continue",
            suggestedProducts: []
        };
    }

    // ===============================================
    // BƯỚC 5: RULE-BASED MATCHING & SCORING PRODUCTS
    // ===============================================
    async scoreAndMatchProducts(entities) {
        if (!entities || Object.keys(entities).length === 0) return [];

        // Lấy danh sách toàn bộ sản phẩm đang active
        const products = await Product.find({ status: 'active' }).populate('category', 'name').lean();
        
        let scoredProducts = products.map(product => {
            let score = 0;

            // 1. Match Layout (Bố cục - VD: lẵng, hộp, bó) => +3 điểm
            if (entities.layout && product.layout && typeof product.layout === 'string') {
                if (product.layout.toLowerCase() === entities.layout.toLowerCase()) {
                    score += 3;
                }
            }

            // 2. Match Hoa chính (Main flowers) => +5 điểm
            if (entities.flower_type) {
                const targetFlower = entities.flower_type.toLowerCase();
                const mainFlowers = (product.main_flowers || []).map(f => typeof f === 'string' ? f.toLowerCase() : '');
                const productName = product.name ? product.name.toLowerCase() : '';

                if (mainFlowers.includes(targetFlower) || productName.includes(targetFlower)) {
                     score += 5;
                }
            }

            // 3. Match Màu sắc (Dominant color) => +3 điểm
            if (entities.color) {
                const targetColor = entities.color.toLowerCase();
                const colorMatches = product.dominant_color && product.dominant_color.toLowerCase() === targetColor;
                
                // Fallback scan (do data cũ chưa có trường này)
                const descMatches = product.description && product.description.toLowerCase().includes(targetColor);
                const nameMatches = product.name && product.name.toLowerCase().includes(targetColor);

                if (colorMatches || descMatches || nameMatches) {
                    score += 3;
                }
            }

            // 4. Match Dịp tặng (Occasion) => +2 điểm
            if (entities.occasion && product.occasion && product.occasion.length > 0) {
                 const targetOcc = entities.occasion.toLowerCase();
                 const occs = product.occasion.map(o => typeof o === 'string' ? o.toLowerCase() : '');
                 if (occs.includes(targetOcc)) {
                     score += 2;
                 }
            }

            // 5. Match Phong cách (Style) => +1 điểm
            if (entities.style && product.style && product.style.length > 0) {
                 const targetStyle = entities.style.toLowerCase();
                 const styles = product.style.map(s => typeof s === 'string' ? s.toLowerCase() : '');
                 if (styles.includes(targetStyle)) {
                     score += 1;
                 }
            }

            return { ...product, aiScore: score };
        });

        // Lọc những sản phẩm thực sự liên quan (có điểm > 0)
        scoredProducts = scoredProducts.filter(p => p.aiScore > 0);
        
        // Sắp xếp giảm dần theo điểm AI, nếu bằng điểm thì ưu tiên sản phẩm mới dể ý
        scoredProducts.sort((a, b) => b.aiScore - a.aiScore);

        // Trả về top 3 gợi ý phù hợp nhất
        return scoredProducts.slice(0, 3);
    }

    // ===============================================
    // BƯỚC 8: TẠO ẢNH TỪ TEMPLATE QUA AI SERVICE
    // ===============================================
    async generateImage(layout, mainColor, subColor) {
        try {
            console.log(`[Hydrangea] Requesting image generation: layout=${layout}, main=${mainColor}`);
            const response = await axios.post('http://localhost:8000/api/hydrangea/generate-image', {
                layout: layout || "round",
                main_color: mainColor || "red",
                sub_color: subColor || "white",
                add_randomness: true
            });
            return response.data;
        } catch (error) {
            console.error("[Hydrangea] Lỗi gọi AI Service (Image Gen):", error.message);
            throw new Error("Không thể tạo ảnh lúc này.");
        }
    }
}

module.exports = new HydrangeaService();