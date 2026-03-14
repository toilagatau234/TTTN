const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Tổng quan dashboard (cards)
// @route   GET /api/stats/overview
const getOverview = async (req, res) => {
    try {
        const [totalOrders, totalRevenue, totalUsers, totalProducts] = await Promise.all([
            Order.countDocuments({ status: { $ne: 'cancelled' } }),
            Order.aggregate([
                { $match: { status: { $in: ['delivered', 'shipping', 'processing', 'confirmed'] } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            User.countDocuments({ role: 'User' }),
            Product.countDocuments({ status: 'active' }),
        ]);

        // Đơn hàng pending (chờ xử lý)
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                totalUsers,
                totalProducts,
                pendingOrders,
            },
        });
    } catch (error) {
        console.error('Get overview error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Doanh thu theo thời gian (cho biểu đồ)
// @route   GET /api/stats/revenue?period=week|month|year
const getRevenueStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let groupFormat;
        let startDate = new Date();

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
            groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
            groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        } else {
            // year
            startDate.setFullYear(startDate.getFullYear() - 1);
            groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        }

        const stats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['delivered', 'shipping', 'processing', 'confirmed'] },
                },
            },
            {
                $group: {
                    _id: groupFormat,
                    revenue: { $sum: '$totalPrice' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get revenue stats error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Top sản phẩm bán chạy
// @route   GET /api/stats/top-products?limit=10
const getTopProducts = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 10;

        const products = await Product.find({ sold: { $gt: 0 } })
            .select('name price images sold stock averageRating')
            .sort({ sold: -1 })
            .limit(limit);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Get top products error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Thống kê đơn hàng theo trạng thái
// @route   GET /api/stats/order-status
const getOrderStatusStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const result = {};
        stats.forEach((s) => { result[s._id] = s.count; });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Get order status stats error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Đơn hàng gần đây
// @route   GET /api/stats/recent-orders?limit=5
const getRecentOrders = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 5;

        const orders = await Order.find()
            .populate('user', 'name email avatar')
            .select('orderCode totalPrice status createdAt shippingInfo')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get recent orders error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Thống kê sản phẩm (Overview & Alerts)
// @route   GET /api/stats/products
const getProductStats = async (req, res) => {
    try {
        const [
            totalProducts,
            activeProducts,
            outOfStockProducts,
            lowStockProducts,
            lowRatingProducts,
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ status: 'active' }),
            Product.countDocuments({ stock: 0 }),
            Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
            Product.countDocuments({ averageRating: { $lt: 3, $gt: 0 } })
        ]);

        res.json({
            success: true,
            data: {
                totalProducts,
                activeProducts,
                alerts: {
                    outOfStock: outOfStockProducts,
                    lowStock: lowStockProducts,
                    lowRating: lowRatingProducts,
                }
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    getOverview,
    getRevenueStats,
    getTopProducts,
    getOrderStatusStats,
    getRecentOrders,
    getProductStats,
};
