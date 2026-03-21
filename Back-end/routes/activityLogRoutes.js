const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/logs
// @desc    Lấy danh sách nhật ký hoạt động (Yêu cầu Admin hoặc Manager)
router.get('/', protect, authorize('Admin', 'Manager'), getLogs);

module.exports = router;
