// Back-end/controllers/cartController.js
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// =============================================
// 1. CRUD CHO SẢN PHẨM THƯỜNG (Từ kho)
// =============================================

// @desc    Lấy giỏ hàng của user hiện tại
// @route   GET /api/cart
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price originalPrice images stock status slug');

        if (!cart) {
            // Nếu chưa có giỏ hàng → trả giỏ rỗng
            return res.json({
                success: true,
                data: { user: req.user._id, items: [], totalCartPrice: 0 },
            });
        }

        res.json({ success: true, data: cart });
    } catch (error) {
        console.error('Get cart error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Thêm sản phẩm thường vào giỏ hàng
// @route   POST /api/cart
// @body    { productId, quantity }
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp productId',
            });
        }

        // Kiểm tra sản phẩm tồn tại và còn hàng
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại',
            });
        }

        if (product.status === 'out_of_stock' || product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm "${product.name}" không đủ hàng (tồn kho: ${product.stock})`,
            });
        }

        // Tìm hoặc tạo giỏ hàng
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Kiểm tra sản phẩm đã có trong giỏ chưa (chỉ check hàng thường)
        const existingItemIndex = cart.items.findIndex(
            (item) => !item.isCustom && item.product && item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Đã có → cộng thêm số lượng
            const newQty = cart.items[existingItemIndex].quantity + quantity;

            if (newQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vượt quá tồn kho (tối đa: ${product.stock})`,
                });
            }

            cart.items[existingItemIndex].quantity = newQty;
        } else {
            // Chưa có → thêm mới
            cart.items.push({
                product: productId,
                quantity,
                isCustom: false,
            });
        }

        await cart.save();

        // Populate lại để trả về đầy đủ thông tin
        await cart.populate('items.product', 'name price originalPrice images stock status slug');

        res.status(200).json({
            success: true,
            message: 'Đã thêm sản phẩm vào giỏ hàng',
            data: cart,
        });
    } catch (error) {
        console.error('Add to cart error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Cập nhật số lượng item trong giỏ
// @route   PUT /api/cart/:itemId
// @body    { quantity }
const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải >= 1',
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        // Tìm item theo _id
        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không có trong giỏ hàng',
            });
        }

        // Nếu là hàng thường → kiểm tra tồn kho
        if (!item.isCustom && item.product) {
            const product = await Product.findById(item.product);
            if (product && quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vượt quá tồn kho (tối đa: ${product.stock})`,
                });
            }
        }

        item.quantity = quantity;
        await cart.save();

        await cart.populate('items.product', 'name price originalPrice images stock status slug');

        res.json({
            success: true,
            message: 'Đã cập nhật số lượng',
            data: cart,
        });
    } catch (error) {
        console.error('Update cart item error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Xóa 1 item khỏi giỏ hàng
// @route   DELETE /api/cart/:itemId
const removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Giỏ hàng không tồn tại',
            });
        }

        // Kiểm tra item tồn tại
        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không có trong giỏ hàng',
            });
        }

        // Xóa item (Mongoose subdocument method)
        cart.items.pull({ _id: itemId });
        await cart.save();

        await cart.populate('items.product', 'name price originalPrice images stock status slug');

        res.json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            data: cart,
        });
    } catch (error) {
        console.error('Remove cart item error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Xóa toàn bộ giỏ hàng
// @route   DELETE /api/cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.json({
                success: true,
                message: 'Giỏ hàng đã trống',
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng',
            data: cart,
        });
    } catch (error) {
        console.error('Clear cart error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// 2. DÀNH CHO SẢN PHẨM CUSTOM (AI HYDRANGEA)
// =============================================

// @desc    Thêm lẵng hoa AI vào giỏ hàng
// @route   POST /api/cart/custom
const addCustomBouquetToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { entities, imageUrl } = req.body;

        // 1. RAG MAPPING: Tìm kiếm nguyên liệu thật trong kho (MongoDB)
        const flowerRegex = new RegExp(entities.flower || 'hoa', 'i');
        const colorRegex = new RegExp(entities.color || '', 'i');

        const matchingFlowers = await Product.find({
            category: 'nguyen-lieu',
            name: { $regex: flowerRegex },
            tags: { $regex: colorRegex },
        }).limit(3);

        // 2. Tính toán giá (Business Logic)
        let basePrice = 150000;
        let materials = [];

        if (matchingFlowers.length > 0) {
            const mainFlower = matchingFlowers[0];
            basePrice += mainFlower.price * 10;
            materials.push({
                productId: mainFlower._id,
                name: mainFlower.name,
                quantity: 10,
                price: mainFlower.price,
            });
        } else {
            basePrice += 300000;
            materials.push({
                name: `Hoa mix tông ${entities.color || 'tự do'} (Giao ngẫu nhiên theo kho)`,
                quantity: 1,
                price: 300000,
            });
        }

        // 3. Tạo Custom Cart Item
        const customItem = {
            isCustom: true,
            name: `Giỏ hoa thiết kế AI - ${entities.flower || 'Độc bản'}`,
            image: imageUrl,
            price: basePrice,
            quantity: 1,
            materials: materials,
            note: `Tông màu: ${entities.color}`,
        };

        // 4. Lưu vào Giỏ hàng
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        cart.items.push(customItem);
        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Đã thêm lẵng hoa AI vào giỏ hàng!',
            data: customItem,
        });
    } catch (error) {
        console.error('Lỗi Add to Cart AI:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm vào giỏ hàng.',
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    addCustomBouquetToCart,
};