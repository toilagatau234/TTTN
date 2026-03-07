const hydrangeaService = require('../services/hydrangea.service');

exports.chatWithHydrangea = async (req, res) => {
    try {
        // Lấy data từ Frontend gửi lên (theo đúng file HydrangeaStudio.jsx)
        const { sessionId, message, isConfirming, entities } = req.body;

        // Gọi đúng tên hàm trong service là processChat
        const result = await hydrangeaService.processChat(sessionId, message, isConfirming, entities);

        // Trả kết quả về cho Frontend
        return res.status(200).json(result);
        
    } catch (error) {
        console.error("[Hydrangea Controller Error]:", error);
        return res.status(500).json({ 
            success: false, 
            reply: 'Hệ thống AI đang quá tải, vui lòng thử lại sau!' 
        });
    }
};