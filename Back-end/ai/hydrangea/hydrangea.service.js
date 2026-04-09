const axios = require('axios');
const Product = require('../../models/Product');

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
                    category: null,
                    flower_types: [],
                    color: null,
                    occasion: null,
                    style: null
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
            return {
                success: false,
                reply: "Tin nhắn không gửi được. Xin lỗi, hệ thống AI đang bảo trì. Vui lòng thử lại sau!",
                status: "error"
            };
        }

        const { intent, entities } = analyzeResult;

        // ── Cập nhật session entities (Merge mới vào cũ) ──
        if (entities) {
            // Category, Color, Occasion, Style (Ghi đè nếu có giá trị mới)
            ['category', 'color', 'occasion', 'style'].forEach(key => {
                if (entities[key]) {
                    session.entities[key] = entities[key];
                }
            });

            // Flower Types (Merge danh sách loài hoa)
            if (entities.flower_types && entities.flower_types.length > 0) {
                const combined = new Set([...session.entities.flower_types, ...entities.flower_types]);
                session.entities.flower_types = Array.from(combined);
            }
        }

        console.log(`[Hydrangea] Session sau khi cập nhật:`, session.entities);

        // ── Xử lý theo Intent chuẩn mới ──
        let resolvedIntent = intent;
        
        // Nếu AI phân loại Intent = UNKNOWN nhưng MÀ vẫn trích xuất được thực thể (Loài hoa, màu sắc...)
        // -> Chuyển intent thành CREATE_FLOWER_BASKET để bot tiếp tục báo giá và tư vấn
        const hasCoreEntities = session.entities.flower_types.length > 0 || session.entities.color || session.entities.category;
        if (intent === 'UNKNOWN' && hasCoreEntities) {
            resolvedIntent = 'CREATE_FLOWER_BASKET';
            console.log(`[Hydrangea] Tự động ép Intent từ UNKNOWN sang CREATE_FLOWER_BASKET do có chứa Entities.`);
        }

        if (resolvedIntent === 'CREATE_FLOWER_BASKET' || resolvedIntent === 'ASK_PRICE') {
            
            // Nếu chưa có thông tin cốt lõi (Loài hoa hoặc Màu hoặc Loại hình), hỏi thêm
            if (session.entities.flower_types.length === 0 && !session.entities.color && !session.entities.category) {
                return {
                    success: true,
                    reply: "Bạn muốn tìm mẫu hoa theo tông màu gì, loài hoa nào, hay kiểu dáng (giỏ, bó, lẵng) ra sao không?",
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
                    reply: "Tiếc quá, hiện kho Roseer chưa có mẫu nào khớp hoàn toàn với yêu cầu này. Bạn có muốn đổi sang tông màu khác hoặc loài hoa khác không?",
                    extractedEntities: session.entities,
                    status: "continue",
                    suggestedProducts: []
                 };
            }

            const flowerDisplay = session.entities.flower_types.join(', ') || 'tự chọn';
            const categoryDisplay = session.entities.category || 'mẫu';
            let replyMsg = `Mình đã tìm thấy một số ${categoryDisplay} cực kỳ phù hợp với yêu cầu hoa ${flowerDisplay} dưới đây nhé! Bạn có ưng mẫu nào không?`;
            
            if (resolvedIntent === 'ASK_PRICE') {
                replyMsg = `Dưới đây là giá của các ${categoryDisplay} hoa ${flowerDisplay} mà bạn quan tâm:`;
            }

            return {
                success: true,
                reply: replyMsg,
                extractedEntities: session.entities,
                status: "suggesting",
                suggestedProducts: suggestions
            };
        }

        // Với các Intent UNKNOWN thực sự (Không có entity nào bắt được)
        if (resolvedIntent === 'UNKNOWN') {
             return {
                 success: true,
                 reply: "Mình chưa hiểu rõ ý bạn lắm. Bạn có thể nói rõ hơn về loài hoa, màu sắc hoặc dịp tặng (sinh nhật, khai trương...) mà bạn muốn không?",
                 extractedEntities: session.entities,
                 status: "continue"
             };
        }

        // Fallback catch-all
        return {
            success: true,
            reply: "Mình đã ghi nhận yêu cầu của bạn! Để mình tìm kiếm những mẫu hoa phù hợp nhất nhé.",
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

            // 1. Match Category (Loại hình: basket, bouquet, box, stand) => +4 điểm
            if (entities.category) {
                const targetCat = entities.category.toLowerCase();
                const productCat = (product.category && product.category.name) ? product.category.name.toLowerCase() : '';
                const productLayout = product.layout ? product.layout.toLowerCase() : '';

                if (productCat.includes(targetCat) || productLayout.includes(targetCat)) {
                    score += 4;
                }
            }

            // 2. Match Flower Types (Hỗ trợ nhiều loài hoa) => +5 điểm mỗi loài
            if (entities.flower_types && entities.flower_types.length > 0) {
                const mainFlowers = (product.main_flowers || []).map(f => typeof f === 'string' ? f.toLowerCase() : '');
                const productName = product.name ? product.name.toLowerCase() : '';

                entities.flower_types.forEach(targetFlower => {
                    const flower = targetFlower.toLowerCase();
                    if (mainFlowers.includes(flower) || productName.includes(flower)) {
                        score += 5;
                    }
                });
            }

            // 3. Match Màu sắc (Dominant color) => +3 điểm
            if (entities.color) {
                const targetColor = entities.color.toLowerCase();
                const colorMatches = product.dominant_color && product.dominant_color.toLowerCase() === targetColor;
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
        
        // Sắp xếp giảm dần theo điểm AI, ưu tiên điểm cao nhất
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