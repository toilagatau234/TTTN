const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors()); // Cho phép React gọi API
app.use(express.json()); // Đọc dữ liệu JSON

// Routes
app.use('/api/auth', authRoutes);

// Cổng chạy
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});