const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// Tất cả yêu cầu đăng nhập
router.use(protect);

router.get('/', getWishlist);
router.post('/', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
