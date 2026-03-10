const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Lấy wishlist của user
// @route   GET /api/wishlist
const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('products', 'name price originalPrice images stock status slug averageRating');

        if (!wishlist) {
            return res.json({ success: true, data: { products: [] } });
        }

        res.json({ success: true, data: wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Thêm/bỏ sản phẩm khỏi wishlist (toggle)
// @route   POST /api/wishlist
// @body    { productId }
const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp productId' });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, products: [] });
        }

        const index = wishlist.products.indexOf(productId);
        let message;

        if (index > -1) {
            // Đã có → bỏ ra
            wishlist.products.splice(index, 1);
            message = 'Đã bỏ khỏi danh sách yêu thích';
        } else {
            // Chưa có → thêm vào
            wishlist.products.push(productId);
            message = 'Đã thêm vào danh sách yêu thích';
        }

        await wishlist.save();
        await wishlist.populate('products', 'name price originalPrice images stock status slug averageRating');

        res.json({ success: true, message, data: wishlist });
    } catch (error) {
        console.error('Toggle wishlist error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Xóa 1 sản phẩm khỏi wishlist
// @route   DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist trống' });
        }

        wishlist.products = wishlist.products.filter(
            (p) => p.toString() !== productId
        );
        await wishlist.save();

        res.json({ success: true, message: 'Đã bỏ khỏi danh sách yêu thích' });
    } catch (error) {
        console.error('Remove wishlist error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
