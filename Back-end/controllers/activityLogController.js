const ActivityLog = require('../models/ActivityLog');

// @desc    Lấy danh sách nhật ký hoạt động (Admin)
// @route   GET /api/logs
const getLogs = async (req, res) => {
    try {
        const { action, target, search, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (action) filter.action = action;
        if (target) filter.target = target;
        
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }

        const total = await ActivityLog.countDocuments(filter);
        const logs = await ActivityLog.find(filter)
            .populate('userId', 'name email role avatar')
            .sort({ createdAt: -1 }) // Mới nhất trước
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get logs error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Helper nội bộ để ghi log (Không expose ra API directly cho client ghi log một cách tùy tiện)
const createLog = async ({ userId, action, target, targetId, description, ip }) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            target,
            targetId,
            description,
            ip
        });
    } catch (error) {
        console.error('Ghi nhật ký lỗi:', error.message);
        // Không throw lỗi ra ngoài để tránh làm treo luồng chính (Tạo sản phẩm, v.v.)
    }
};

module.exports = { 
    getLogs,
    createLog
};
