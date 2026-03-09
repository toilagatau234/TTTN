const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Kiểm tra các trường bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
      });
    }

    // Kiểm tra mật khẩu tối thiểu 6 ký tự
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký',
      });
    }

    // Tạo user mới (password sẽ tự động hash bởi middleware trong User model)
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Đăng nhập user & lấy token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm user trong DB
    const user = await User.findOne({ email });

    // Kiểm tra user và mật khẩu
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          token: generateToken(user._id, user.role),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Lấy thông tin user hiện tại (từ token)
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    // req.user đã được set bởi middleware protect
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại',
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { registerUser, loginUser, getMe };