const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Tất cả order routes yêu cầu đăng nhập
router.use(protect);

// === USER routes ===
router.post('/', createOrder);                           // Tạo đơn từ giỏ hàng
router.get('/my', getMyOrders);                          // Đơn hàng của tôi
router.get('/:id', getOrderById);                        // Chi tiết đơn (user xem đơn mình, admin xem tất cả)
router.put('/:id/cancel', cancelOrder);                  // Hủy đơn (chỉ khi pending)

// === ADMIN routes ===
router.get('/', authorize('Admin', 'Manager', 'Staff'), getAllOrders);           // Tất cả đơn hàng
router.put('/:id/status', authorize('Admin', 'Manager', 'Staff'), updateOrderStatus); // Cập nhật trạng thái

module.exports = router;
