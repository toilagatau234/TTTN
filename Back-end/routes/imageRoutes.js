const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/auth');

// POST /api/products/:id/process-image — Remove bg + resize 1 sản phẩm
router.post('/product/:id/process', protect, imageController.processProductImage);

// POST /api/images/batch-process — Xử lý hàng loạt ảnh sản phẩm (admin chỉ)
router.post('/batch-process', protect, imageController.batchProcessImages);

module.exports = router;
