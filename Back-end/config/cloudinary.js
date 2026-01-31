const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flower-shop', // Tên folder trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Định dạng cho phép
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // (Tùy chọn) Resize ảnh ngay khi upload
  },
});

const upload = multer({ storage: storage });

module.exports = upload;