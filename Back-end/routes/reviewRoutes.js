const express = require('express');
const router = express.Router();
const {
    createReview,
    getProductReviews,
    deleteReview,
    getAllReviews,
    toggleApproveReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public: xem đánh giá theo sản phẩm
router.get('/product/:productId', getProductReviews);

// User: tạo/xóa review (cần đăng nhập)
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

// Admin: quản lý reviews
router.get('/', protect, authorize('Admin', 'Manager'), getAllReviews);
router.put('/:id/approve', protect, authorize('Admin', 'Manager'), toggleApproveReview);

module.exports = router;
