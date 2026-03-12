const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendOtp, verifyOtp, registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Middleware giới hạn request chống spam/brute-force cho Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20, // Tối đa 20 request mỗi 15 phút từ 1 IP
    message: { success: false, message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.' }
});

// Public routes
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Protected routes (cần đăng nhập)
router.get('/me', protect, getMe);

module.exports = router;
