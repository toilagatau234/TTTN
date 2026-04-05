const { Carrier, Shipment } = require('../models/Shipping');
const Order = require('../models/Order');
const axios = require('axios');

const getGHNConfig = async () => {
    const carrier = await Carrier.findOne({ code: { $regex: /^GHN$/i } });
    if (!carrier || !carrier.isActive || !carrier.apiToken) {
        throw new Error('Đơn vị vận chuyển GHN chưa được cấu hình token hoặc đang bị tắt');
    }
    const domain = carrier.isSandbox ? 'dev-online-gateway.ghn.vn' : 'online-gateway.ghn.vn';
    return { token: carrier.apiToken, shopId: carrier.shopId, domain };
};

// =============================================
// CARRIERS (Đối tác vận chuyển)
// =============================================

// @desc    Lấy danh sách đối tác vận chuyển
// @route   GET /api/shipping/carriers
const getCarriers = async (req, res) => {
    try {
        const carriers = await Carrier.find().sort({ createdAt: -1 });
        res.json({ success: true, data: carriers });
    } catch (error) {
        console.error('Get carriers error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Tạo đối tác vận chuyển mới
// @route   POST /api/shipping/carriers
const createCarrier = async (req, res) => {
    try {
        const { name, code, logo, baseFee, freeShipMinOrder, estimatedDays } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và mã đối tác' });
        }

        const carrier = await Carrier.create({ name, code, logo, baseFee, freeShipMinOrder, estimatedDays });
        res.status(201).json({ success: true, data: carrier });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Mã hoặc tên đối tác đã tồn tại' });
        }
        console.error('Create carrier error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Cập nhật cấu hình đối tác
// @route   PUT /api/shipping/carriers/:id
const updateCarrier = async (req, res) => {
    try {
        const carrier = await Carrier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Đối tác không tồn tại' });
        }
        res.json({ success: true, data: carrier });
    } catch (error) {
        console.error('Update carrier error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// SHIPMENTS (Vận đơn)
// =============================================

// @desc    Lấy danh sách vận đơn
// @route   GET /api/shipping/shipments
const getShipments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const total = await Shipment.countDocuments(filter);
        const shipments = await Shipment.find(filter)
            .populate('order', 'orderCode shippingInfo totalPrice status')
            .populate('carrier', 'name code logo')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: shipments,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get shipments error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Tạo vận đơn (đẩy đơn hàng sang hãng ship)
// @route   POST /api/shipping/shipments
const createShipment = async (req, res) => {
    try {
        const { orderId, carrierId } = req.body;

        if (!orderId || !carrierId) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn đơn hàng và đối tác vận chuyển' });
        }

        // Kiểm tra đơn hàng
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        // Kiểm tra đã có vận đơn chưa
        const existingShipment = await Shipment.findOne({ order: orderId });
        if (existingShipment) {
            return res.status(400).json({ success: false, message: 'Đơn hàng đã có vận đơn', data: existingShipment });
        }

        // Kiểm tra carrier
        const carrier = await Carrier.findById(carrierId);
        if (!carrier || !carrier.isActive) {
            return res.status(404).json({ success: false, message: 'Đối tác vận chuyển không tồn tại hoặc đã bị tắt' });
        }

        // BẮT ĐẦU ĐẨY ĐƠN SANG GHN =======================
        if (carrier.code.toUpperCase() !== 'GHN') {
            return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ tạo đơn cho hệ thống GHN trong phiên bản này' });
        }
        
        if (!carrier.apiToken || !carrier.shopId) {
            return res.status(400).json({ success: false, message: 'Vui lòng vào Quản lý Vận Chuyển để điền Mật khẩu (Token) và Shop ID trước khi tạo đơn' });
        }

        if (!order.shippingInfo.districtId || !order.shippingInfo.wardCode) {
            return res.status(400).json({ success: false, message: 'Đơn hàng chưa có District ID hoặc Ward Code gốc từ GHN, không thể tạo đơn' });
        }

        // Chuẩn bị items format GHN
        const ghnItems = order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            weight: 1000 // Quy đổi mặc định 1Kg mỗi món
        }));

        const totalWeight = order.items.length * 1000;

        // Payload đẩy đơn GHN
        const ghnPayload = {
            payment_type_id: 1, // 1: Người tính mua phí
            note: order.shippingInfo.note || 'Hoa tươi, giao hàng cẩn thận',
            required_note: 'CHOXEMHANGKHONGTHU',
            client_order_code: order.orderCode,
            to_name: order.shippingInfo.fullName,
            to_phone: order.shippingInfo.phone,
            to_address: order.shippingInfo.address,
            to_ward_code: String(order.shippingInfo.wardCode),
            to_district_id: parseInt(order.shippingInfo.districtId),
            cod_amount: order.paymentMethod === 'cod' ? order.totalPrice : 0, 
            weight: totalWeight,
            length: 20, width: 20, height: 20,
            insurance_value: order.totalPrice <= 5000000 ? order.totalPrice : 5000000,
            service_type_id: 2, // E-commerce
            items: ghnItems
        };

        const ghnDomain = carrier.isSandbox ? 'dev-online-gateway.ghn.vn' : 'online-gateway.ghn.vn';
        const ghnResponse = await axios.post(`https://${ghnDomain}/shiip/public-api/v2/shipping-order/create`, ghnPayload, {
            headers: {
                'Token': carrier.apiToken,
                'ShopId': carrier.shopId
            }
        });

        const ghnOrderCode = ghnResponse.data.data.order_code;
        const ghnExpectedDelivery = ghnResponse.data.data.expected_delivery_time;
        const shippingFee = order.shippingPrice > 0 ? order.shippingPrice : ghnResponse.data.data.total_fee;

        // Tạo Shipment nội bộ lưu trữ
        const shipment = await Shipment.create({
            order: orderId,
            carrier: carrierId,
            trackingCode: ghnOrderCode,
            shippingFee: shippingFee,
            estimatedDelivery: ghnExpectedDelivery ? new Date(ghnExpectedDelivery) : null,
            statusHistory: [{ status: 'created', note: 'Đã tạo vận đơn trên hệ thống GHN' }],
        });

        // Cập nhật trạng thái đơn hàng → processing
        if (order.status === 'confirmed' || order.status === 'pending') {
            order.status = 'processing';
            await order.save();
        }

        await shipment.populate('carrier', 'name code');

        res.status(201).json({
            success: true,
            message: `Tạo vận đơn gốc GHN thành công! Mã: ${shipment.trackingCode}`,
            data: shipment,
        });
    } catch (error) {
        console.error('Create shipment (GHN) error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || 'Lỗi kết nối API đẩy đơn Giao Hàng Nhanh';
        res.status(500).json({ success: false, message: errorMsg });
    }
};

// @desc    Cập nhật trạng thái vận đơn (đồng bộ / thủ công)
// @route   POST /api/shipping/sync
const syncShipmentStatus = async (req, res) => {
    try {
        const { trackingCode, status, note } = req.body;

        if (!trackingCode) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã vận đơn' });
        }

        const shipment = await Shipment.findOne({ trackingCode });
        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Vận đơn không tồn tại' });
        }

        // Cập nhật status
        if (status) {
            shipment.status = status;
            shipment.statusHistory.push({
                status,
                note: note || `Cập nhật trạng thái: ${status}`,
                time: new Date(),
            });
        }

        await shipment.save();

        // Đồng bộ trạng thái sang Order
        const order = await Order.findById(shipment.order);
        if (order) {
            if (status === 'delivering' || status === 'in_transit') {
                order.status = 'shipping';
            } else if (status === 'delivered') {
                order.status = 'delivered';
                order.deliveredAt = new Date();
            }
            await order.save();
        }

        res.json({ success: true, message: 'Đã đồng bộ trạng thái', data: shipment });
    } catch (error) {
        console.error('Sync shipment error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// GHN API PROXIES (Địa chỉ)
// =============================================

// @desc    Lấy danh sách Tỉnh/Thành phố từ GHN
// @route   GET /api/shipping/ghn/provinces
const getProvinces = async (req, res) => {
    try {
        const config = await getGHNConfig();
        const response = await axios.get(`https://${config.domain}/shiip/public-api/master-data/province`, {
            headers: { 'Token': config.token }
        });
        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error('GHN getProvinces error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu Tỉnh/Thành từ GHN' });
    }
};

// @desc    Lấy danh sách Quận/Huyện từ GHN
// @route   GET /api/shipping/ghn/districts/:province_id
const getDistricts = async (req, res) => {
    try {
        const config = await getGHNConfig();
        const province_id = req.params.province_id;
        const response = await axios.get(`https://${config.domain}/shiip/public-api/master-data/district`, {
            headers: { 'Token': config.token },
            params: { province_id }
        });
        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error('GHN getDistricts error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu Quận/Huyện từ GHN' });
    }
};

// @desc    Lấy danh sách Phường/Xã từ GHN
// @route   GET /api/shipping/ghn/wards/:district_id
const getWards = async (req, res) => {
    try {
        const config = await getGHNConfig();
        const district_id = req.params.district_id;
        const response = await axios.get(`https://${config.domain}/shiip/public-api/master-data/ward`, {
            headers: { 'Token': config.token },
            params: { district_id }
        });
        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error('GHN getWards error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu Phường/Xã từ GHN' });
    }
};

// @desc    Tính phí ship cho user sử dụng API GHN
// @route   POST /api/shipping/calculate
const calculateShippingFee = async (req, res) => {
    try {
        const { orderTotal, to_district_id, to_ward_code, weightInGrams } = req.body;

        if (!to_district_id || !to_ward_code) {
           return res.status(400).json({ success: false, message: 'Thiếu thông tin Quận/Huyện hoặc Phường/Xã để tính phí GHN' });
        }

        const config = await getGHNConfig();

        // Gọi API của hàng ship GHN
        const response = await axios.post(`https://${config.domain}/shiip/public-api/v2/shipping-order/fee`, {
            service_type_id: 2, // 2: E-commerce
            to_district_id: parseInt(to_district_id),
            to_ward_code: String(to_ward_code),
            weight: weightInGrams || 1000, 
            insurance_value: orderTotal <= 5000000 ? orderTotal : 5000000 
        }, {
            headers: {
                'Token': config.token,
                'ShopId': config.shopId
            }
        });

        const shippingFee = response.data.data.total;
        
        res.json({
            success: true,
            data: {
                shippingFee,
                carrier: { name: 'Giao Hàng Nhanh', estimatedDays: '2 - 3 ngày' },
                freeShipNote: `Đã tính phí ship tự động qua GHN API`,
            },
        });
    } catch (error) {
        console.error('Calculate GHN fee error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu tính phí từ GHN' });
    }
};

module.exports = {
    getCarriers,
    createCarrier,
    updateCarrier,
    getShipments,
    createShipment,
    syncShipmentStatus,
    getProvinces,
    getDistricts,
    getWards,
    calculateShippingFee,
};
