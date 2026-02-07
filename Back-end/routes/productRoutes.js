const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const upload = require('../config/cloudinary');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Keep upload.array in case of server-side upload fallback
router.post('/', upload.array('images', 10), createProduct);
router.put('/:id', upload.array('images', 10), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
