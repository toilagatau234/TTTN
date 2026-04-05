const mongoose = require('mongoose');
const { Carrier } = require('../models/Shipping');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Tự động seed cấu hình GHN từ .env nếu chưa tồn tại hoặc bị thiếu Token
    try {
      const ghnToken = process.env.GHN_API_TOKEN || '';
      const ghnShopId = process.env.GHN_SHOP_ID || '';
      
      if (ghnToken) {
        // Tìm và cập nhật nếu thiếu Token/ShopId, hoặc tạo mới nếu chưa có
        const updated = await Carrier.findOneAndUpdate(
          { code: { $regex: /^GHN$/i } },
          { 
            $setOnInsert: {
              name: 'Giao Hàng Nhanh (GHN)',
              code: 'GHN',
              logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHN-Slogan-En.png',
              isActive: true,
              baseFee: 35000,
              isSandbox: true, // Mặc định dùng Dev/Sandbox cho Token mẫu
            },
            // Chỉ cập nhật apiToken/shopId nếu nó bị rỗng hoặc chưa có (avoid overwriting Admin settings)
          },
          { upsert: true, new: true }
        );

        if (!updated.apiToken || !updated.shopId) {
          updated.apiToken = updated.apiToken || ghnToken;
          updated.shopId = updated.shopId || ghnShopId;
          await updated.save();
          console.log('--- Synced GHN Carrier tokens from .env to Database ---');
        }
      }
    } catch (seedErr) {
       console.error('Error seeding GHN:', seedErr.message);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;