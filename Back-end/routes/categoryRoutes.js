const express = require('express');
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');
const upload = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.param('id', validateObjectId);

// Public routes — Ai cũng xem được
router.get('/', getCategories);

// Protected routes — Chỉ Admin/Manager mới được thao tác
router.post('/', protect, authorize('Admin', 'Manager'), upload.single('image'), createCategory);
router.put('/:id', protect, authorize('Admin', 'Manager'), upload.single('image'), updateCategory);
router.delete('/:id', protect, authorize('Admin', 'Manager'), deleteCategory);

module.exports = router;