const express = require('express');
const router = express.Router();
const {
    getVouchers,
    getVoucherById,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    applyVoucher,
} = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/auth');

// User: áp dụng voucher (cần đăng nhập)
router.post('/apply', protect, applyVoucher);

// Admin: CRUD voucher
router.get('/', protect, authorize('Admin', 'Manager'), getVouchers);
router.get('/:id', protect, authorize('Admin', 'Manager'), getVoucherById);
router.post('/', protect, authorize('Admin', 'Manager'), createVoucher);
router.put('/:id', protect, authorize('Admin', 'Manager'), updateVoucher);
router.delete('/:id', protect, authorize('Admin'), deleteVoucher);

module.exports = router;
