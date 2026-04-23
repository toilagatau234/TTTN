const express = require('express');
const router = express.Router();
const hydrangeaController = require('../ai/hydrangea/hydrangea.controller');
const { protect } = require('../middleware/auth');

// Public routes (chat không cần đăng nhập)
router.post('/hydrangea/chat', hydrangeaController.chatWithHydrangea);
router.post('/hydrangea/update-items', hydrangeaController.updateSelectedItems);
router.post('/hydrangea/generate', hydrangeaController.generateBouquetImage);
router.get('/hydrangea/check-api', hydrangeaController.checkApi);

// Protected routes (cần đăng nhập)
router.post('/hydrangea/confirm-order', protect, hydrangeaController.confirmOrder);
router.get('/hydrangea/my-orders', protect, hydrangeaController.getMyOrders);
router.get('/hydrangea/orders/:id', protect, hydrangeaController.getOrderDetail);

module.exports = router;