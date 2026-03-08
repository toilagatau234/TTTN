const nlpService = require('../services/nlp.service');
const irisService = require('../services/iris.service');

/**
 * Controller xử lý hội thoại cho trợ lý Iris (Widget Popup CSKH).
 */
exports.chatWithIris = async (req, res) => {
    try {
        const userText = req.body.message;
        if (!userText) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // 1. Gọi Python NLP Engine lấy Intent + Entities (qua nlp.service.js)
        const { intent, entities } = await nlpService.analyzeText(userText);

        // 2. Gửi Intent + Entities cho Iris Service để sinh câu trả lời + query DB
        const result = await irisService.handleIntent(intent, entities, userText);

        // 3. Trả về cho Frontend
        return res.status(200).json({
            success: true,
            intent: intent,
            message: result.reply,
            data: result.responseData
        });

    } catch (error) {
        console.error("Iris Controller Error:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi giao tiếp với Iris AI' });
    }
};
