const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendEmail');

const OTP_EXPIRES_MINUTES = 5;

// Hàm tạo Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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

// @desc    Quên mật khẩu (Gửi OTP)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email.' });
  }

  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await Otp.deleteByEmail(email);
    await Otp.create({
      email: email.toLowerCase().trim(),
      code,
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
    });

    await sendOtpEmail(email, code, OTP_EXPIRES_MINUTES);
    res.json({ success: true, message: `Mã khôi phục đã được gửi đến ${email}` });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
  }
};

// @desc    Khôi phục mật khẩu (Xác nhận OTP và đổi mật khẩu)
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ email, mã OTP và mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    const defaultEmail = email.toLowerCase().trim();
    const otp = await Otp.findOne({ email: defaultEmail });

    if (!otp || otp.code !== String(code).trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc không tồn tại' });
    }

    if (otp.expiresAt < new Date()) {
      await otp.deleteOne();
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Đổi mật khẩu và tự động trigger hook pre('save') bcrypt để mã hoá mật khẩu
    user.password = newPassword;
    await user.save();

    await otp.deleteOne(); // Xoá OTP sau khi lấy lại pass thành công

    res.json({ success: true, message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi server khi khôi phục mật khẩu' });
  }
};

// @desc    Đăng nhập user & lấy token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Kiểm tra tài khoản bị khoá
      if (user.status === 'Blocked') {
        return res.status(403).json({
          success: false,
          isLocked: true,
          message: 'Tài khoản của bạn đã bị khoá.',
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

module.exports = { sendOtp, verifyOtp, registerUser, loginUser, getMe, forgotPassword, resetPassword };