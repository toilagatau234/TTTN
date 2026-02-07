const express = require('express');
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');
const upload = require('../config/cloudinary');


router.post('/', upload.single('image'), createCategory);
router.put('/:id', upload.single('image'), updateCategory);

router.get('/', getCategories);
router.delete('/:id', deleteCategory);

module.exports = router;