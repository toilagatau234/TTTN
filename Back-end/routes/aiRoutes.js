// Back-end/routes/aiRoutes.js
const express = require('express');
const router = express.Router();

// Import các controllers
const hydrangeaController = require('../ai/hydrangea/hydrangea.controller');

// ==========================================
// Routes cho Trợ lý Hydrangea (AI Thiết Kế Giỏ Hoa)
// ==========================================
router.post('/hydrangea/chat', hydrangeaController.chatWithHydrangea);
router.post('/hydrangea/generate-image', hydrangeaController.generateImage);

module.exports = router;