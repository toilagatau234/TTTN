const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher'); // Thêm model Voucher
const { createPaymentUrl, getClientIp } = require('../utils/vnpay');
const { createGhnShipmentForOrder } = require('../services/shippingShipmentService');

// =============================================
// USER ENDPOINTS
// =============================================

// @desc    Tạo đơn hàng từ giỏ hàng
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { shippingInfo, paymentMethod, voucherCode, shippingFee, carrierId } = req.body; // Thêm shippingFee, voucherCode

        // 1. Validate thông tin giao hàng
        if (!shippingInfo || !shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin giao hàng (họ tên, SĐT, địa chỉ)',
            });
        }

        // 2. Lấy giỏ hàng
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images stock status');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống — không thể tạo đơn hàng',
            });
        }

        // 3. Tạo order items (snapshot thông tin sản phẩm)
        let itemsPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            if (item.isCustom) {
                // Sản phẩm AI custom
                orderItems.push({
                    isCustom: true,
                    name: item.name || 'Sản phẩm custom AI',
                    image: item.image || 'https://placehold.co/400x400?text=AI+Bouquet',
                    price: item.price || 0,
                    quantity: Number(item.quantity || 1),
                    materials: item.materials || [],
                    note: item.note || '',
                });
                itemsPrice += (item.price || 0) * Number(item.quantity || 1);
            }
 else {
                // Sản phẩm thường → kiểm tra tồn kho
                const product = item.product;
                if (!product) continue;

                if (product.status === 'out_of_stock' || product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm "${product.name}" không đủ hàng (tồn kho: ${product.stock})`,
                    });
                }

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    image: (product.images && product.images.length > 0) ? product.images[0].url : 'https://placehold.co/400x400?text=No+Image',
                    price: product.price || 0,
                    quantity: Number(item.quantity || 1),
                    isCustom: false,
                });
                itemsPrice += (product.price || 0) * Number(item.quantity || 1);
            }
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có sản phẩm hợp lệ trong giỏ hàng',
            });
        }

        // 4. Phí vận chuyển
        // Ưu tiên phí từ Frontend gửi lên, nếu không có thì dùng logic cũ của Backend
        const shippingPrice = typeof shippingFee === 'number' ? shippingFee : (itemsPrice >= 500000 ? 0 : 30000);

        // 5. Xử lý Voucher (Mã giảm giá)
        let discountPrice = 0;
        let voucherId = null;

        if (voucherCode && typeof voucherCode === 'string') {
            const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
            
            // Re-validate voucher trên Server
            if (voucher && voucher.isValid && itemsPrice >= (voucher.minOrderValue || 0)) {
                if (voucher.discountType === 'percent') {
                    discountPrice = Math.round((itemsPrice * (voucher.discountValue || 0)) / 100);
                    if (voucher.maxDiscount && discountPrice > voucher.maxDiscount) {
                        discountPrice = voucher.maxDiscount;
                    }
                } else {
                    discountPrice = voucher.discountValue || 0;
                }

                // Không để giảm vượt quá tiền hàng
                if (discountPrice > itemsPrice) {
                    discountPrice = itemsPrice;
                }

                voucherId = voucher._id;
            } else {
                // Nếu mã không hợp lệ (hết hạn, không đủ đơn tối thiểu...) thì bỏ qua hoặc báo lỗi?
                // Ở đây ta có thể chọn bỏ qua mã và log lại, hoặc trả lỗi về client
                console.warn(`[Order] Invalid voucher ignored: ${voucherCode}`);
            }
        }

        // 6. Tính tổng cuối cùng
        const totalPrice = Math.max(0, (itemsPrice || 0) + (shippingPrice || 0) - (discountPrice || 0));

        // 7. Làm sạch thông tin giao hàng (chỉ lấy các trường trong model để tránh lỗi Object/String)
        const sanitizedShippingInfo = {
            fullName: shippingInfo.fullName,
            phone: shippingInfo.phone,
            address: shippingInfo.address,
            ward: String(shippingInfo.ward || ''),
            district: String(shippingInfo.district || ''),
            city: String(shippingInfo.city || ''),
            wardCode: shippingInfo.wardCode ? String(shippingInfo.wardCode) : undefined,
            districtId: shippingInfo.districtId ? Number(shippingInfo.districtId) : undefined,
            note: String(shippingInfo.note || '')
        };

        const normalizedPaymentMethod = (paymentMethod || 'cod').toLowerCase();
        console.log(`[Order] Creating order for user ${req.user._id}. Method: ${normalizedPaymentMethod}`);

        // 8. Tạo đơn hàng
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingInfo: sanitizedShippingInfo,
            paymentMethod: normalizedPaymentMethod,
            carrier: carrierId || undefined,
            itemsPrice: Number(itemsPrice) || 0,
            shippingPrice: Number(shippingPrice) || 0,
            discountPrice: Number(discountPrice) || 0,
            totalPrice: Number(totalPrice) || 0,
            voucher: voucherId,
        });

        // VNPAY: tạo URL thanh toán, CHƯA trừ kho / CHƯA xóa giỏ / CHƯA tăng lượt dùng voucher
        if (normalizedPaymentMethod === 'vnpay') {
            const tmnCode = String(process.env.VNP_TMNCODE || '').trim();
            const secret = String(process.env.VNP_HASHSECRET || '').trim();
            const baseUrl = String(process.env.VNP_URL || '').trim();
            const returnUrl = String(process.env.VNP_RETURNURL || '').trim();

            if (!tmnCode || !secret || !baseUrl || !returnUrl) {
                return res.status(500).json({
                    success: false,
                    message: 'Thiếu cấu hình VNPAY trong .env (VNP_TMNCODE/VNP_HASHSECRET/VNP_URL/VNP_RETURNURL)',
                });
            }

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
            });

            order.payment = order.payment || {};
            order.payment.vnpay = order.payment.vnpay || {};
            order.payment.vnpay.txnRef = txnRef;
            order.payment.vnpay.amount = order.totalPrice;
            await order.save();

            return res.status(201).json({
                success: true,
                message: `Tạo đơn thành công, chuyển qua VNPAY để thanh toán. Mã đơn: ${order.orderCode}`,
                data: { order, paymentUrl: url },
            });
        }

        // 8. Cập nhật lượt dùng Voucher nếu có
        if (voucherId) {
            await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } });
        }

        // 9. Trừ tồn kho cho sản phẩm thường
        for (const item of orderItems) {
            if (!item.isCustom && item.product) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity, sold: item.quantity },
                });
            }
        }

        // 10. Xóa giỏ hàng sau khi đặt thành công
        cart.items = [];
        await cart.save();

        // Auto create GHN shipment if user selected a carrier
        if (carrierId) {
            try {
                const shipment = await createGhnShipmentForOrder({ orderId: order._id, carrierId });
                if (shipment?._id) {
                    order.shipment = shipment._id;
                    await order.save();
                }
            } catch (e) {
                console.error('[Order] Auto create GHN shipment failed:', e.response?.data || e.message);
            }
        }

        res.status(201).json({
            success: true,
            message: `Đặt hàng thành công! Mã đơn: ${order.orderCode}`,
            data: order,
        });
    } catch (error) {
        console.error('Create order error details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi tạo đơn hàng',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Lấy đơn hàng của user hiện tại
// @route   GET /api/orders/my
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get my orders error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Lấy chi tiết 1 đơn hàng (user chỉ xem được đơn của mình)
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // User thường chỉ xem đươc đơn của mình
        if (
            order.user._id.toString() !== req.user._id.toString() &&
            !['Admin', 'Manager', 'Staff'].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem đơn hàng này',
            });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get order by id error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    User hủy đơn hàng (chỉ khi status = pending)
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // Chỉ chủ đơn mới được hủy
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy đơn hàng này',
            });
        }

        // Chỉ hủy được khi đang pending
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Không thể hủy đơn hàng ở trạng thái "${order.status}"`,
            });
        }

        order.status = 'cancelled';
        order.cancelReason = req.body.reason || 'Khách hàng tự hủy';
        await order.save();

        // Hoàn lại tồn kho
        for (const item of order.items) {
            if (!item.isCustom && item.product) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity, sold: -item.quantity },
                });
            }
        }

        res.json({
            success: true,
            message: 'Đã hủy đơn hàng',
            data: order,
        });
    } catch (error) {
        console.error('Cancel order error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// ADMIN ENDPOINTS
// =============================================

// @desc    Lấy tất cả đơn hàng (Admin/Manager/Staff)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all orders error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Cập nhật trạng thái đơn hàng (Admin/Manager/Staff)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}`,
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại',
            });
        }

        // Không cho cập nhật đơn đã hủy hoặc đã giao
        if (['cancelled', 'delivered'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể cập nhật đơn hàng đã "${order.status}"`,
            });
        }

        // Nếu admin hủy → hoàn kho
        if (status === 'cancelled') {
            for (const item of order.items) {
                if (!item.isCustom && item.product) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: item.quantity, sold: -item.quantity },
                    });
                }
            }
            order.cancelReason = req.body.reason || 'Admin hủy đơn';
        }

        // Nếu delivered → ghi nhận thời gian
        if (status === 'delivered') {
            order.deliveredAt = Date.now();
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: `Đã cập nhật trạng thái đơn hàng thành "${status}"`,
            data: order,
        });
    } catch (error) {
        console.error('Update order status error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
};
