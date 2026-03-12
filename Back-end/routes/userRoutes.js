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
const { getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.param('id', validateObjectId);

// Tất cả routes yêu cầu đăng nhập
router.use(protect);

// === USER routes (tự quản lý) ===
router.get('/profile', getMe);
router.put('/profile', updateProfile);

// === ADMIN routes (cố định) ===
router.get('/', authorize('Admin', 'Manager'), getAllUsers);
router.post('/', authorize('Admin'), createUser);

// === ADMIN routes (với tham số :id) ===
router.get('/:id', authorize('Admin', 'Manager'), getUserById);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
