const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const hydrangeaController = require('../controllers/hydrangeaController');

// Route xử lý toàn bộ hội thoại với chatbot AI
router.post('/chat', aiController.chatWithAI);

// Route xử lý toàn bộ hội thoại với chatbot Hydrangea
router.post('/chat', hydrangeaController.processChat);

module.exports = router;
