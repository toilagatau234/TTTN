const User = require('../models/User');

// =============================================
// ADMIN ENDPOINTS
// =============================================

// @desc    Lấy danh sách tất cả users (Admin)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all users error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Lấy chi tiết 1 user (Admin)
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user by id error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Admin tạo user mới (VD: tạo tài khoản Staff)
// @route   POST /api/users
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng',
            });
        }

        const user = await User.create({ name, email, password, role: role || 'User' });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error('Create user error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Admin cập nhật user (role, info...)
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const { name, email, role, avatar, phone, status } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        // Nếu đổi email → kiểm tra trùng
        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi tài khoản khác',
                });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (avatar !== undefined) user.avatar = avatar;
        if (phone !== undefined) user.phone = phone;
        if (status !== undefined) user.status = status;

        await user.save();

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error('Update user error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// @desc    Admin xóa user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        // Không cho xóa chính mình
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa chính bạn',
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Đã xóa user' });
    } catch (error) {
        console.error('Delete user error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =============================================
// USER ENDPOINTS (tự quản lý profile)
// =============================================

// @desc    User cập nhật profile của mình
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        const { name, email, avatar, phone, address, gender, dateOfBirth, currentPassword, newPassword } = req.body;

        // Đổi email → kiểm tra trùng
        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng',
                });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (avatar !== undefined) user.avatar = avatar;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (gender !== undefined) user.gender = gender;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;

        // Đổi mật khẩu (phải cung cấp mật khẩu cũ)
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập mật khẩu hiện tại',
                });
            }

            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
                });
            }

            user.password = newPassword; // Sẽ tự hash bởi pre-save middleware
        }

        await user.save();

        res.json({
            success: true,
            message: 'Cập nhật profile thành công',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
};
