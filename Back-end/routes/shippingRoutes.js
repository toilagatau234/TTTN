const express = require('express');
const router = express.Router();
const {
    getCarriers,
    createCarrier,
    updateCarrier,
    getShipments,
    createShipment,
    syncShipmentStatus,
    calculateShippingFee,
} = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/auth');

// Public/User: tính phí ship (dùng ở checkout)
router.post('/calculate', protect, calculateShippingFee);

// Admin: Quản lý đối tác vận chuyển
router.get('/carriers', protect, authorize('Admin', 'Manager'), getCarriers);
router.post('/carriers', protect, authorize('Admin'), createCarrier);
router.put('/carriers/:id', protect, authorize('Admin'), updateCarrier);

// Admin: Quản lý vận đơn
router.get('/shipments', protect, authorize('Admin', 'Manager', 'Staff'), getShipments);
router.post('/shipments', protect, authorize('Admin', 'Manager', 'Staff'), createShipment);
router.post('/sync', protect, authorize('Admin', 'Manager', 'Staff'), syncShipmentStatus);

module.exports = router;
