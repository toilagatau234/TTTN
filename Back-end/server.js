const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const aiRoutes = require('./routes/aiRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const imageRoutes = require('./routes/imageRoutes');
const path = require('path');
const recommendController = require('./controllers/recommendController');
const supplierRoutes = require('./routes/supplierRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const blogRoutes = require('./routes/blogRoutes');




dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors()); // Cho phép React gọi API
app.use(express.json({ limit: '50mb' })); // Đọc dữ liệu JSON (giới hạn 50MB)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from 'public' folder
app.use('/public', express.static(path.join(__dirname, 'public')));
// Serve processed images (rembg output)
app.use('/data', express.static(path.join(__dirname, 'data')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', activityLogRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/generate-image', imageRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/blogs', blogRoutes);

// New Simplified Recommendation API
app.post('/api/recommend-products', recommendController.recommendProductsSimple);





// Cổng chạy
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});