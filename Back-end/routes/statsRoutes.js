const express = require('express');
const router = express.Router();
const {
    getOverview,
    getRevenueStats,
    getTopProducts,
    getOrderStatusStats,
    getRecentOrders,
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

// Tất cả stats routes chỉ dành cho Admin/Manager
router.use(protect);
router.use(authorize('Admin', 'Manager'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenueStats);
router.get('/top-products', getTopProducts);
router.get('/order-status', getOrderStatusStats);
router.get('/recent-orders', getRecentOrders);

module.exports = router;
