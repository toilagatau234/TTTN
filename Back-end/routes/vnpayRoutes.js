const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const {
  createPaymentUrlForOrder,
  verifyReturn,
  ipn,
} = require('../controllers/vnpayController');

router.post('/create-payment-url', protect, createPaymentUrlForOrder);
router.get('/verify-return', verifyReturn);
router.get('/ipn', ipn);

module.exports = router;

