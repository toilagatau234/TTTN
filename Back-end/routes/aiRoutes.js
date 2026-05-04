const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const hydrangeaController = require('../ai/hydrangea/hydrangea.controller');
const { protect } = require('../middleware/auth');

// Rate limiter: tối đa 5 lần tạo ảnh / phút / IP
const generateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, reply: 'Bạn đang tạo ảnh quá nhanh, vui lòng đợi 1 phút rồi thử lại.' }
});

// Public routes
router.post('/hydrangea/chat', hydrangeaController.chatWithHydrangea);
router.post('/hydrangea/update-items', hydrangeaController.updateSelectedItems);
router.post('/hydrangea/generate', generateLimiter, hydrangeaController.generateBouquetImage);
router.post('/hydrangea/refine-generate', generateLimiter, hydrangeaController.refineGenerate);
router.get('/hydrangea/check-api', hydrangeaController.checkApi);
// Protected routes (cần đăng nhập)
router.post('/hydrangea/confirm-image-upload', protect, hydrangeaController.confirmImageUpload); // FIX v4: Protected
router.post('/hydrangea/confirm-order', protect, hydrangeaController.confirmOrder);
router.get('/hydrangea/my-orders', protect, hydrangeaController.getMyOrders);
router.get('/hydrangea/orders/:id', protect, hydrangeaController.getOrderDetail);
router.post('/hydrangea/restore-session', protect, hydrangeaController.restoreSession);
router.delete('/hydrangea/orders/:id', protect, hydrangeaController.deleteOrder);

// New APIs for AI Images (Drafts)
router.get('/hydrangea/images/drafts', protect, hydrangeaController.getDraftImages);
router.post('/hydrangea/images/retry', protect, hydrangeaController.retryOrderFromDraft);
router.delete('/hydrangea/images/:id', protect, hydrangeaController.deleteDraftImage);

module.exports = router;