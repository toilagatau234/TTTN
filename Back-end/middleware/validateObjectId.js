const mongoose = require('mongoose');

const validateObjectId = (req, res, next, id) => {
    // Bỏ qua các endpoint không phải là ObjectId (ví dụ: /api/users/profile, /api/orders/my)
    if (['profile', 'my', 'apply', 'calculate', 'sync'].includes(id)) {
        return next();
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    next();
};

module.exports = validateObjectId;
