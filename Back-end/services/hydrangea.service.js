const axios = require('axios');
// Nếu bạn đã làm file gemini.service, hãy require nó. Nếu chưa có, ta mock (giả lập) trước để test
// const geminiService = require('./gemini.service');

// Quản lý session hội thoại (Trong thực tế nên dùng Redis, đồ án dùng Map() là ổn)
const sessions = new Map();

class HydrangeaService {
    
    // ĐÂY CHÍNH LÀ HÀM MÀ CONTROLLER ĐANG TÌM KIẾM
    async processChat(sessionId, message, isConfirming, incomingEntities) {
        
        // 1. Nếu user bấm nút "Xác Nhận Thiết Kế & Vẽ Mẫu"
        if (isConfirming) {
            try {
                // Gọi API Gemini để sinh ảnh (Giả lập hoặc gọi thật tùy bạn đã code tới đâu)
                // const imageResult = await geminiService.generateFlowerImage(incomingEntities);
                
                // MOCK DATA (Dùng tạm ảnh này để test UI Frontend trước, nếu Gemini chưa sẵn sàng)
                const mockImageUrl = "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=1000&auto=format&fit=crop";

                return {
                    success: true,
                    reply: "Tác phẩm của bạn đã hoàn thành! Bạn thấy sao?",
                    image: mockImageUrl // Thay bằng imageResult.imageUrl khi nối Gemini
                };
            } catch (error) {
                console.error("Gemini Error:", error);
                throw new Error("Lỗi khi vẽ ảnh Gemini");
            }
        }

        // 2. Nếu là tin nhắn chat bình thường (User đang mô tả)
        // Khởi tạo session nếu chưa có
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, { entities: {} });
        }
        const currentSession = sessions.get(sessionId);

        let extractedEntities = {};

        try {
            // GỌI SANG PYTHON SERVICE (FastAPI) ĐỂ BÓC TÁCH NER
            // Cần đảm bảo Python server đang chạy ở port 8000
            const nerResponse = await axios.post('http://localhost:8000/api/hydrangea/extract', { text: message });
            extractedEntities = nerResponse.data.entities || {};
            
        } catch (error) {
            console.warn("Python AI Service chưa bật hoặc lỗi, sử dụng fallback (Giả lập Regex)...");
            // FALLBACK TẠM THỜI ĐỂ BẠN TEST WEB KHÔNG BỊ CHẾT KHI CHƯA BẬT PYTHON
            if (message.toLowerCase().includes('hồng')) extractedEntities.flower = 'Hoa hồng';
            if (message.toLowerCase().includes('đỏ')) extractedEntities.color = 'Đỏ';
            if (message.toLowerCase().includes('sinh nhật')) extractedEntities.occasion = 'Sinh nhật';
        }

        // Merge entities mới vào session cũ
        currentSession.entities = { ...currentSession.entities, ...extractedEntities };

        // 3. Logic Dialog Manager (Kiểm tra thiếu thông tin)
        let reply = "";
        let isReadyToDraw = false;

        const { flower, color } = currentSession.entities;

        if (!flower && !color) {
            reply = "Bạn thích loài hoa nào và tông màu chủ đạo là gì nhỉ?";
        } else if (!flower) {
            reply = `Tông màu ${color} rất đẹp! Vậy bạn muốn dùng loài hoa chính nào? (VD: hoa hồng, hướng dương...)`;
        } else if (!color) {
            reply = `Giỏ ${flower} thì tuyệt vời. Bạn muốn phối theo tông màu gì? (VD: đỏ, pastel, trắng...)`;
        } else {
            reply = `Mình đã ghi nhận: Giỏ hoa tông màu ${color}, hoa chủ đạo là ${flower}. Bạn có muốn thêm yêu cầu gì không, hay chúng ta nhấn XÁC NHẬN để AI phác thảo ngay nhé?`;
            isReadyToDraw = true;
        }

        // Trả về cho Frontend
        return {
            success: true,
            reply: reply,
            extractedEntities: extractedEntities, // Gửi về để cập nhật dấu chấm xanh trên UI
            isReady: isReadyToDraw
        };
    }
}

module.exports = new HydrangeaService();