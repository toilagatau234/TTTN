const Order = require('../models/Order');
const { createPaymentUrl, verifySecureHash, getClientIp } = require('../utils/vnpay');
const { finalizeOrderPaid } = require('../services/orderFinalizeService');

const getVnpEnv = () => {
  const tmnCode = String(process.env.VNP_TMNCODE || '').trim();
  const secret = String(process.env.VNP_HASHSECRET || '').trim();
  const baseUrl = String(process.env.VNP_URL || '').trim();
  const returnUrl = String(process.env.VNP_RETURNURL || '').trim();

  if (!tmnCode || !secret || !baseUrl || !returnUrl) {
    throw new Error('Missing VNPAY env config (VNP_TMNCODE/VNP_HASHSECRET/VNP_URL/VNP_RETURNURL)');
  }

  return { tmnCode, secret, baseUrl, returnUrl };
};

// @route POST /api/payments/vnpay/create-payment-url
// body: { orderId, bankCode? }
const createPaymentUrlForOrder = async (req, res) => {
  try {
    const { orderId, bankCode } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing orderId' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (order.paymentMethod !== 'vnpay') {
      return res.status(400).json({ success: false, message: 'Order is not VNPAY payment method' });
    }

    if (order.isPaid) {
      return res.json({ success: true, message: 'Order already paid', data: { order, paymentUrl: null } });
    }

    const { tmnCode, secret, baseUrl, returnUrl } = getVnpEnv();

    const ipAddr = getClientIp(req);
    const txnRef = order.orderCode;
    const orderInfo = `Thanh toan don hang ${order.orderCode}`;

    const { url } = createPaymentUrl({
      baseUrl,
      tmnCode,
      secret,
      amountVnd: order.totalPrice,
      txnRef,
      orderInfo,
      returnUrl,
      ipAddr,
      bankCode,
    });

    order.payment = order.payment || {};
    order.payment.vnpay = order.payment.vnpay || {};
    order.payment.vnpay.txnRef = txnRef;
    order.payment.vnpay.amount = order.totalPrice;
    await order.save();

    return res.json({ success: true, data: { order, paymentUrl: url } });
  } catch (error) {
    console.error('[VNPAY] createPaymentUrl error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @route GET /api/payments/vnpay/verify-return
const verifyReturn = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const { secret } = getVnpEnv();

    const { ok } = verifySecureHash(vnpParams, secret);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const txnRef = vnpParams.vnp_TxnRef;
    const order = await Order.findOne({ orderCode: txnRef });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found for vnp_TxnRef' });

    // Persist raw callback (help debug)
    order.payment = order.payment || {};
    order.payment.vnpay = {
      txnRef: vnpParams.vnp_TxnRef,
      amount: Number(vnpParams.vnp_Amount ? Number(vnpParams.vnp_Amount) / 100 : order.totalPrice),
      responseCode: vnpParams.vnp_ResponseCode,
      transactionStatus: vnpParams.vnp_TransactionStatus,
      transactionNo: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      payDate: vnpParams.vnp_PayDate,
      secureHash: vnpParams.vnp_SecureHash,
      raw: vnpParams,
    };

    const isSuccess = vnpParams.vnp_ResponseCode === '00' && vnpParams.vnp_TransactionStatus === '00';
    if (isSuccess) {
      await order.save();
      const finalized = await finalizeOrderPaid({ orderId: order._id, paidAt: new Date() });
      return res.json({
        success: true,
        data: { order: finalized, paymentStatus: 'success' },
      });
    }

    await order.save();
    return res.json({
      success: true,
      data: { order, paymentStatus: 'failed', vnp_ResponseCode: vnpParams.vnp_ResponseCode },
    });
  } catch (error) {
    console.error('[VNPAY] verifyReturn error:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @route GET /api/payments/vnpay/ipn
const ipn = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const { secret } = getVnpEnv();

    const { ok } = verifySecureHash(vnpParams, secret);
    if (!ok) return res.json({ RspCode: '97', Message: 'Invalid signature' });

    const txnRef = vnpParams.vnp_TxnRef;
    const order = await Order.findOne({ orderCode: txnRef });
    if (!order) return res.json({ RspCode: '01', Message: 'Order not found' });

    const isSuccess = vnpParams.vnp_ResponseCode === '00' && vnpParams.vnp_TransactionStatus === '00';

    order.payment = order.payment || {};
    order.payment.vnpay = {
      txnRef: vnpParams.vnp_TxnRef,
      amount: Number(vnpParams.vnp_Amount ? Number(vnpParams.vnp_Amount) / 100 : order.totalPrice),
      responseCode: vnpParams.vnp_ResponseCode,
      transactionStatus: vnpParams.vnp_TransactionStatus,
      transactionNo: vnpParams.vnp_TransactionNo,
      bankCode: vnpParams.vnp_BankCode,
      payDate: vnpParams.vnp_PayDate,
      secureHash: vnpParams.vnp_SecureHash,
      raw: vnpParams,
    };
    await order.save();

    if (isSuccess) {
      await finalizeOrderPaid({ orderId: order._id, paidAt: new Date() });
    }

    return res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('[VNPAY] ipn error:', error.response?.data || error.message);
    return res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

module.exports = {
  createPaymentUrlForOrder,
  verifyReturn,
  ipn,
};

