const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const { createGhnShipmentForOrder } = require('./shippingShipmentService');

const finalizeOrderPaid = async ({ orderId, paidAt = new Date() }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  if (order.isPaid) return order;

  // Re-check stock, then deduct (idempotent via isPaid flag)
  for (const item of order.items) {
    if (item.isCustom || !item.product) continue;
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    if (product.status === 'out_of_stock' || product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}"`);
    }
  }

  for (const item of order.items) {
    if (item.isCustom || !item.product) continue;
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  order.isPaid = true;
  order.paidAt = paidAt;
  if (order.status === 'pending') order.status = 'confirmed';
  await order.save();

  // Mark voucher as used only when payment is confirmed
  if (order.voucher) {
    await Voucher.findByIdAndUpdate(order.voucher, { $inc: { usedCount: 1 } });
  }

  // Clear cart like current flow
  const cart = await Cart.findOne({ user: order.user });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  // Auto-create GHN shipment if user selected carrier and order has enough GHN address data
  if (order.carrier && !order.shipment) {
    try {
      const shipment = await createGhnShipmentForOrder({ orderId: order._id, carrierId: order.carrier });
      if (shipment?._id) {
        order.shipment = shipment._id;
        await order.save();
      }
    } catch (e) {
      // Do not fail payment finalization if shipment fails; keep for manual retry
      console.error('[FinalizePaidOrder] GHN shipment create failed:', e.response?.data || e.message);
    }
  }

  return order;
};

module.exports = { finalizeOrderPaid };
