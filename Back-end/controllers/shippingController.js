const { Carrier, Shipment } = require('../models/Shipping');
const Order = require('../models/Order');

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
        const order = await Order.findById(orderId);
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
        if (!carrier) {
            return res.status(404).json({ success: false, message: 'Đối tác vận chuyển không tồn tại' });
        }

        // Tính phí ship
        const shippingFee = order.totalPrice >= carrier.freeShipMinOrder ? 0 : carrier.baseFee;

        const shipment = await Shipment.create({
            order: orderId,
            carrier: carrierId,
            shippingFee,
            statusHistory: [{ status: 'created', note: 'Tạo vận đơn' }],
        });

        // Cập nhật trạng thái đơn hàng → processing
        if (order.status === 'confirmed' || order.status === 'pending') {
            order.status = 'processing';
            order.shippingPrice = shippingFee;
            await order.save();
        }

        await shipment.populate('carrier', 'name code');

        res.status(201).json({
            success: true,
            message: `Tạo vận đơn thành công! Mã: ${shipment.trackingCode}`,
            data: shipment,
        });
    } catch (error) {
        console.error('Create shipment error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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

// @desc    Tính phí ship cho user (dùng ở checkout)
// @route   POST /api/shipping/calculate
const calculateShippingFee = async (req, res) => {
    try {
        const { orderTotal, carrierId } = req.body;

        let carrier;
        if (carrierId) {
            carrier = await Carrier.findById(carrierId);
        } else {
            // Lấy carrier mặc định (active, đầu tiên)
            carrier = await Carrier.findOne({ isActive: true });
        }

        if (!carrier) {
            return res.json({ success: true, data: { shippingFee: 30000, carrier: null } });
        }

        const shippingFee = orderTotal >= carrier.freeShipMinOrder ? 0 : carrier.baseFee;

        res.json({
            success: true,
            data: {
                shippingFee,
                carrier: { name: carrier.name, estimatedDays: carrier.estimatedDays },
                freeShipNote: shippingFee > 0 ? `Miễn phí ship cho đơn từ ${carrier.freeShipMinOrder.toLocaleString('vi-VN')}đ` : 'Miễn phí vận chuyển!',
            },
        });
    } catch (error) {
        console.error('Calculate fee error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    getCarriers,
    createCarrier,
    updateCarrier,
    getShipments,
    createShipment,
    syncShipmentStatus,
    calculateShippingFee,
};
