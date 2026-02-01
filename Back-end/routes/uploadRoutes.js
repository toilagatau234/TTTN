const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const cloudinary = require('cloudinary').v2;

// @route   POST /api/upload
// @desc    Upload 1 file ảnh
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file nào được chọn' });
    }

    // Trả về đường dẫn ảnh trên Cloudinary
    res.json({
      success: true,
      imageUrl: req.file.path, 
      publicId: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/upload
// @desc    Xóa ảnh trên Cloudinary
router.delete('/', async (req, res) => {
  try {
    const { publicId } = req.body; // Front-end sẽ gửi publicId lên
    if (!publicId) return res.status(400).json({ success: false, message: 'Thiếu publicId' });

    await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, message: 'Đã xóa ảnh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;