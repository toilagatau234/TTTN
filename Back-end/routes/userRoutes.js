const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Tất cả routes yêu cầu đăng nhập
router.use(protect);

// === USER routes (tự quản lý) ===
router.put('/profile', updateProfile);

// === ADMIN routes ===
router.get('/', authorize('Admin', 'Manager'), getAllUsers);
router.get('/:id', authorize('Admin', 'Manager'), getUserById);
router.post('/', authorize('Admin'), createUser);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
