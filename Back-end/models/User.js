const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Staff', 'Warehouse', 'User'],
    default: 'User'
  },
  department: { type: String, default: '' }, // Bộ phận (Kinh doanh, Kho vận...)
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active'
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Khác' },
  dateOfBirth: { type: Date },
  avatar: { type: String, default: '' },
}, { timestamps: true });

// Middleware: Tự động mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function () { 
  // Nếu mật khẩu không bị sửa đổi thì bỏ qua
  if (!this.isModified('password')) return;
  
  // Mã hóa
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Hàm kiểm tra mật khẩu (Dùng khi đăng nhập)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);