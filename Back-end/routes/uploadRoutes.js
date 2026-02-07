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
router.delete('/remove/:public_id', async (req, res) => {
    try {
        const { public_id } = req.params;
        if (!public_id) {
            return res.status(400).json({ message: 'Thiếu public_id' });
        }

        const result = await cloudinary.uploader.destroy(public_id);
        
        if (result.result !== 'ok') {
             return res.status(500).json({ message: 'Xóa ảnh trên Cloudinary thất bại', result });
        }

        res.json({ message: 'Đã xóa ảnh thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;