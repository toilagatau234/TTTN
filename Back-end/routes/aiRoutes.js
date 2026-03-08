// Back-end/routes/aiRoutes.js
const express = require('express');
const router = express.Router();

// Import các controllers
const hydrangeaController = require('../controllers/hydrangeaController');
const irisController = require('../controllers/iris.controller'); // Nếu bạn có file này, giữ nguyên

// ==========================================
// 1. Routes cho Trợ lý Hydrangea (AI Tạo Giỏ Hoa)
// ==========================================
router.post('/hydrangea/chat', hydrangeaController.chatWithHydrangea);

// ==========================================
// 2. Routes cho Trợ lý Iris (AI CSKH)
// ==========================================
router.post('/iris/chat', irisController.chatWithIris);

module.exports = router;