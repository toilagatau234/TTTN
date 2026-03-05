const express = require('express');
const router = express.Router();
const irisController = require('../controllers/iris.controller');
const hydrangeaController = require('../controllers/hydrangeaController');

// Route xử lý hội thoại với chatbot Iris (CSKH - Widget popup)
router.post('/iris/chat', irisController.chatWithIris);

// Route xử lý hội thoại với chatbot Hydrangea (Thiết kế giỏ hoa)
router.post('/hydrangea/chat', hydrangeaController.processChat);

module.exports = router;
