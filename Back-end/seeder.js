const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany(); // Xóa dữ liệu cũ nếu có

    const adminUser = new User({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: '123', // Pass này sẽ được mã hóa tự động nhờ model
      role: 'Admin',
      avatar: 'https://i.pravatar.cc/150?img=11'
    });

    await adminUser.save();
    console.log('Đã tạo tài khoản Admin mẫu!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();