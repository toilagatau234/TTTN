const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { upload } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.param('id', validateObjectId);

// Public routes — Ai cũng xem được
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes — Chỉ Admin/Manager/Staff mới được thao tác
router.post('/', protect, authorize('Admin', 'Manager'), upload.array('images', 10), createProduct);
router.put('/:id', protect, authorize('Admin', 'Manager'), upload.array('images', 10), updateProduct);
router.delete('/:id', protect, authorize('Admin', 'Manager'), deleteProduct);

module.exports = router;
