const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');

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

module.exports = router;