const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Tạo đánh giá sản phẩm
// @route   POST /api/reviews
const createReview = async (req, res) => {
    try {
        const { productId, rating, comment, images, orderId } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ: sản phẩm, số sao, nhận xét',
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra user đã mua sản phẩm chưa (tùy chọn)
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                user: req.user._id,
                status: 'delivered',
                'items.product': productId,
            });
            if (!order) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng',
                });
            }
        }

        // Kiểm tra đã review chưa
        const existing = await Review.findOne({ user: req.user._id, product: productId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá sản phẩm này rồi',
            });
        }

        const review = await Review.create({
            user: req.user._id,
            product: productId,
            order: orderId || undefined,
            rating,
            comment,
            images: images || [],
        });

        // Populate user info
        await review.populate('user', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Đánh giá thành công!',
            data: review,
        });
    } catch (error) {
        console.error('Create review error:', error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Lấy đánh giá theo sản phẩm
// @route   GET /api/reviews/product/:productId
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const filter = { product: productId, isApproved: true };

        const total = await Review.countDocuments(filter);
        const reviews = await Review.find(filter)
            .populate('user', 'name avatar')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Thống kê rating
        const stats = await Review.aggregate([
            { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(productId), isApproved: true } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            }
        ]);

        const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats.forEach((s) => { ratingBreakdown[s._id] = s.count; });

        res.json({
            success: true,
            data: reviews,
            ratingBreakdown,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get product reviews error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    User xóa review của mình
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        }

        // Chỉ chủ review hoặc Admin mới xóa được
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này' });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Đã xóa đánh giá' });
    } catch (error) {
        console.error('Delete review error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Admin: Lấy tất cả reviews
// @route   GET /api/reviews
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, isApproved } = req.query;

        const filter = {};
        if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

        const total = await Review.countDocuments(filter);
        const reviews = await Review.find(filter)
            .populate('user', 'name email avatar')
            .populate('product', 'name slug images')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: reviews,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get all reviews error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Admin: Ẩn/hiện review
// @route   PUT /api/reviews/:id/approve
const toggleApproveReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
        }

        review.isApproved = !review.isApproved;
        await review.save();

        res.json({
            success: true,
            message: review.isApproved ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá',
            data: review,
        });
    } catch (error) {
        console.error('Toggle review error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    deleteReview,
    getAllReviews,
    toggleApproveReview,
};
