const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// =============================================
// USER ENDPOINTS
// =============================================

// @desc    Tạo đơn hàng từ giỏ hàng
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { shippingInfo, paymentMethod, voucherCode } = req.body;

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
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    materials: item.materials,
                    note: item.note,
                });
                itemsPrice += item.price * item.quantity;
            } else {
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
                    image: product.images?.[0]?.url || '',
                    price: product.price,
                    quantity: item.quantity,
                    isCustom: false,
                });
                itemsPrice += product.price * item.quantity;
            }
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có sản phẩm hợp lệ trong giỏ hàng',
            });
        }

        // 4. Tính phí ship (có thể tùy chỉnh sau)
        const shippingPrice = itemsPrice >= 500000 ? 0 : 30000; // Free ship cho đơn >= 500k

        // 5. Tính tổng
        const totalPrice = itemsPrice + shippingPrice;

        // 6. Tạo đơn hàng
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingInfo,
            paymentMethod: paymentMethod || 'cod',
            itemsPrice,
            shippingPrice,
            discountPrice: 0,
            totalPrice,
        });

        // 7. Trừ tồn kho cho sản phẩm thường
        for (const item of orderItems) {
            if (!item.isCustom && item.product) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantity, sold: item.quantity },
                });
            }
        }

        // 8. Xóa giỏ hàng sau khi đặt thành công
        cart.items = [];
        await cart.save();

        res.status(201).json({
            success: true,
            message: `Đặt hàng thành công! Mã đơn: ${order.orderCode}`,
            data: order,
        });
    } catch (error) {
        console.error('Create order error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo đơn hàng' });
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
