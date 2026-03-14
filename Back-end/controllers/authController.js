const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendEmail');

const OTP_EXPIRES_MINUTES = 5;

// Hàm tạo Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Gửi mã OTP xác nhận email
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
  }

  // Kiểm tra email đã tồn tại
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
  }

  try {
    // Sinh mã OTP 6 số ngẫu nhiên
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Xoá OTP cũ (nếu có) rồi tạo mới
    await Otp.deleteByEmail(email);
    await Otp.create({
      email: email.toLowerCase().trim(),
      code,
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    // Gửi email
    await sendOtpEmail(email, code, OTP_EXPIRES_MINUTES);

    res.json({ success: true, message: `Mã OTP đã được gửi đến ${email}` });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
  }
};

// @desc    Xác nhận mã OTP
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Thiếu email hoặc mã OTP' });
  }

  try {
    const otp = await Otp.findOne({ email: email.toLowerCase().trim() });

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn' });
    }

    if (otp.expiresAt < new Date()) {
      await otp.deleteOne();
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    if (otp.code !== String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });
    }

    // Xoá OTP sau khi xác nhận thành công
    await otp.deleteOne();

    res.json({ success: true, message: 'Xác nhận email thành công' });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký',
      });
    }

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
    const user = await User.findOne({ email });

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
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { sendOtp, verifyOtp, registerUser, loginUser, getMe };