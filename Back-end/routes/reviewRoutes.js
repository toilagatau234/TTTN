const express = require('express');
const router = express.Router();
const {
    createReview,
    getProductReviews,
    deleteReview,
    getAllReviews,
    toggleApproveReview,
    updateReview,
    likeReview,
    replyReview,
} = require('../controllers/reviewController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.param('id', validateObjectId);

// Public: xem đánh giá theo sản phẩm (optionalProtect để biết user đã mua chưa)
router.get('/product/:productId', optionalProtect, getProductReviews);

// User: tạo/sửa/xóa review (cần đăng nhập)
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.put('/:id/like', protect, likeReview);
router.delete('/:id', protect, deleteReview);

// Admin: quản lý reviews
router.get('/', protect, authorize('Admin', 'Manager'), getAllReviews);
router.put('/:id/approve', protect, authorize('Admin', 'Manager'), toggleApproveReview);
router.put('/:id/reply', protect, authorize('Admin', 'Manager'), replyReview);

module.exports = router;
