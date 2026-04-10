const express = require('express');
const blogController = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', blogController.getAllBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id', blogController.getBlog);

router.post('/', protect, authorize('Admin', 'Manager'), blogController.createBlog);
router.put('/:id', protect, authorize('Admin', 'Manager'), blogController.updateBlog);
router.delete('/:id', protect, authorize('Admin', 'Manager'), blogController.deleteBlog);

module.exports = router;
