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

        // 1. Phân tích văn bản bằng Python NLP Engine
        const { intent, entities } = await nlpService.analyzeText(userText);

        // 2. Dựa vào Intent và Entities để sinh câu trả lời tự nhiên & query Database
        const { botReply, responseData } = await irisService.processIntent(intent, entities);

        // 3. Trả về cho Frontend React/Flutter
        return res.status(200).json({
            success: true,
            intent: intent,
            message: botReply,
            data: responseData
        });

    } catch (error) {
        console.error("Iris Controller Error:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi giao tiếp với Iris AI' });
    }
};
