const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: Bảo vệ routes — Yêu cầu đăng nhập
const protect = async (req, res, next) => {
    let token;

    // Kiểm tra header Authorization có dạng "Bearer <token>" hay không
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Lấy token từ header
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user từ token (loại bỏ password khỏi kết quả)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error('Auth middleware error: User không tồn tại (Token ID:', decoded.id, ')');
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ — User không tồn tại',
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error (verify):', error.message);
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn',
            });
        }
    }

    if (!token) {
        console.error('Auth middleware error: Không có token trong header');
        console.error('Headers nhận được:', req.headers);
        return res.status(401).json({
            success: false,
            message: 'Không có quyền truy cập — Vui lòng đăng nhập',
        });
    }
};

// Middleware: Phân quyền theo role
// Sử dụng: authorize('Admin', 'Manager')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập trước',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' không có quyền thực hiện hành động này`,
            });
        }

        next();
    };
};

// Middleware: Tùy chọn đăng nhập — Nếu có token thì lấy user, không có thì thôi
const optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token sai hoặc hết hạn cũng kệ, không gán req.user
            console.error('Optional auth error:', error.message);
        }
    }
    next();
};

module.exports = { protect, authorize, optionalProtect };
