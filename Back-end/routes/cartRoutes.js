const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    addCustomBouquetToCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Tất cả cart routes đều yêu cầu đăng nhập
router.use(protect);

// CRUD giỏ hàng (Sản phẩm thường)
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);

// Thêm sản phẩm custom vào giỏ (từ HydrangeaStudio)
router.post('/custom', addCustomBouquetToCart);

module.exports = router;
