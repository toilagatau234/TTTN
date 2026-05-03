const hydrangeaService = require('./hydrangea.service');
const { checkGeminiApiKey } = require('./gemini.image.service');
const CustomBouquetOrder = require('../../models/CustomBouquetOrder');
const { protect } = require('../../middleware/auth');

// POST /api/ai/hydrangea/chat
exports.chatWithHydrangea = async (req, res) => {
    try {
        const { sessionId, message, isConfirming, entities } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, reply: 'Thiếu sessionId' });

        const result = await hydrangeaService.processChat(sessionId, message, isConfirming, entities);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[Hydrangea Controller Error]:', error);
        return res.status(500).json({
            success: false,
            reply: 'Hệ thống AI đang quá tải, vui lòng thử lại sau!'
        });
    }
};

// POST /api/ai/hydrangea/update-items
// Frontend gửi lên items user đã chọn (override auto-select)
exports.updateSelectedItems = async (req, res) => {
    try {
        const { sessionId, selectedItems } = req.body;
        if (!sessionId) return res.status(400).json({ success: false });
        const totalPrice = hydrangeaService.updateSelectedItems(sessionId, selectedItems);
        return res.status(200).json({ success: true, totalPrice });
    } catch (error) {
        console.error('[UpdateItems Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/generate
// Trigger Gemini image generation
exports.generateBouquetImage = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, reply: 'Thiếu sessionId' });

        const result = await hydrangeaService.processChat(sessionId, null, true);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[Generate Image Error]:', error);
        return res.status(500).json({ success: false, reply: error.message });
    }
};

// POST /api/ai/hydrangea/confirm-order
// Tạo CustomBouquetOrder sau khi user đồng ý ảnh
exports.confirmOrder = async (req, res) => {
    try {
        const { sessionId, userDescription, note } = req.body;
        const userId = req.user?._id;

        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        if (!sessionId) return res.status(400).json({ success: false, message: 'Thiếu sessionId' });

        const order = await hydrangeaService.createOrder(sessionId, userId, userDescription, note);
        return res.status(201).json({
            success: true,
            message: 'Đơn hàng tùy chỉnh đã được lưu!',
            order: {
                _id: order._id,
                orderCode: order.orderCode,
                status: order.status,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt,
            }
        });
    } catch (error) {
        console.error('[ConfirmOrder Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/my-orders
// Lấy lịch sử đơn custom của user
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false });

        const orders = await CustomBouquetOrder.find({ user: userId })
            .select('orderCode status totalPrice entities generatedImage.url createdAt confirmedAt selectedItems sessionId')
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();

        // Tạo orderCode virtual cho lean docs
        const result = orders.map(o => ({
            ...o,
            orderCode: `CB-${String(o._id).slice(-8).toUpperCase()}`
        }));

        return res.status(200).json({ success: true, orders: result });
    } catch (error) {
        console.error('[GetMyOrders Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/orders/:id
// Chi tiết 1 đơn
exports.getOrderDetail = async (req, res) => {
    try {
        const userId = req.user?._id;
        const order = await CustomBouquetOrder.findOne({ _id: req.params.id, user: userId }).lean();
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

        return res.status(200).json({
            success: true,
            order: {
                ...order,
                orderCode: `CB-${String(order._id).slice(-8).toUpperCase()}`
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ai/hydrangea/restore-session
// Khôi phục phiên làm việc từ order cũ
exports.restoreSession = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { orderId } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });

        const sessionState = await hydrangeaService.restoreSession(orderId, userId);
        if (!sessionState) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        return res.status(200).json({
            success: true,
            sessionState
        });
    } catch (error) {
        console.error('[RestoreSession Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/ai/hydrangea/orders/:id
// Xóa lịch sử thiết kế
exports.deleteOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });

        const order = await CustomBouquetOrder.findOneAndDelete({ _id: id, user: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        return res.status(200).json({
            success: true,
            message: 'Đã xóa lịch sử thiết kế'
        });
    } catch (error) {
        console.error('[DeleteOrder Error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ai/hydrangea/check-api
// Kiểm tra Gemini API key
exports.checkApi = async (req, res) => {
    try {
        const status = await checkGeminiApiKey();
        return res.status(200).json({ success: true, gemini: status });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};