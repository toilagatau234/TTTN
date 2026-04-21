const axios = require('axios');
const Order = require('../models/Order');
const { Carrier, Shipment } = require('../models/Shipping');

const createGhnShipmentForOrder = async ({ orderId, carrierId }) => {
  if (!orderId || !carrierId) throw new Error('Missing orderId/carrierId');

  const order = await Order.findById(orderId).populate('user');
  if (!order) throw new Error('Order not found');

  const existingShipment = await Shipment.findOne({ order: orderId });
  if (existingShipment) return existingShipment;

  const carrier = await Carrier.findById(carrierId);
  if (!carrier) throw new Error('Carrier not found');

  if (!carrier.isActive) throw new Error('Carrier is inactive');
  if (String(carrier.code || '').toUpperCase() !== 'GHN') {
    throw new Error('Only GHN is supported for auto shipment');
  }

  const token = String(carrier.apiToken || '').trim();
  const shopId = String(carrier.shopId || '').trim();
  if (!token || !shopId) {
    throw new Error('GHN token/shopId not configured');
  }

  if (!order.shippingInfo?.districtId || !order.shippingInfo?.wardCode) {
    throw new Error('Order missing GHN districtId/wardCode');
  }

  const ghnItems = (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    weight: 1000,
  }));

  const totalWeight = ghnItems.length * 1000;

  const ghnPayload = {
    payment_type_id: 1,
    note: order.shippingInfo.note || 'Hang de vo, xin nhe tay',
    required_note: 'CHOXEMHANGKHONGTHU',
    client_order_code: order.orderCode,
    to_name: order.shippingInfo.fullName,
    to_phone: order.shippingInfo.phone,
    to_address: order.shippingInfo.address,
    to_ward_code: String(order.shippingInfo.wardCode),
    to_district_id: parseInt(order.shippingInfo.districtId, 10),
    cod_amount: order.paymentMethod === 'cod' ? order.totalPrice : 0,
    weight: totalWeight,
    length: 20,
    width: 20,
    height: 20,
    insurance_value: order.totalPrice <= 5000000 ? order.totalPrice : 5000000,
    service_type_id: 2,
    items: ghnItems,
  };

  const ghnDomain = carrier.isSandbox ? 'dev-online-gateway.ghn.vn' : 'online-gateway.ghn.vn';
  const response = await axios.post(
    `https://${ghnDomain}/shiip/public-api/v2/shipping-order/create`,
    ghnPayload,
    {
      headers: { Token: token, ShopId: shopId },
    }
  );

  const data = response?.data?.data;
  const ghnOrderCode = data?.order_code;
  if (!ghnOrderCode) {
    throw new Error(response?.data?.message || 'GHN create order failed');
  }

  const shippingFee = order.shippingPrice > 0 ? order.shippingPrice : data.total_fee;
  const shipment = await Shipment.create({
    order: orderId,
    carrier: carrierId,
    trackingCode: ghnOrderCode,
    shippingFee,
    estimatedDelivery: data.expected_delivery_time ? new Date(data.expected_delivery_time) : null,
    statusHistory: [{ status: 'created', note: 'Auto created on GHN' }],
  });

  if (!order.carrier) order.carrier = carrierId;
  order.shipment = shipment._id;
  if (order.status === 'confirmed' || order.status === 'pending') order.status = 'processing';
  await order.save();

  return shipment;
};

module.exports = { createGhnShipmentForOrder };

