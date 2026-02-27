const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route xử lý toàn bộ hội thoại với chatbot AI
router.post('/chat', aiController.chatWithAI);

module.exports = router;
