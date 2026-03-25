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
const aiOrderController = require('../controllers/aiOrder.controller');

// Tất cả cart routes đều yêu cầu đăng nhập
router.use(protect);

// CRUD giỏ hàng (Sản phẩm thường)
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.delete('/', clearCart);

// Thêm sản phẩm custom AI vào giỏ
router.post('/custom', addCustomBouquetToCart);
router.post('/custom-add', aiOrderController.addCustomItem);

module.exports = router;
