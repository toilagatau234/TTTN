const Category = require('../models/Category');
const cloudinary = require('cloudinary').v2;

// GET: Lấy danh sách
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Tạo mới
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    let imageUrl = req.body.image || ''; // Lấy từ body (nếu frontend gửi link)
    let publicId = req.body.publicId || '';

    // Nếu có file upload kèm theo (legacy/fallback) -> ghi đè
    if (req.file) {
      imageUrl = req.file.path;
      publicId = req.file.filename;
    }

    const newCategory = new Category({
      name,
      description,
      image: imageUrl,
      publicId: publicId
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });

  } catch (error) {
    // Xóa ảnh trên cloudinary nếu lưu DB thất bại (chỉ khi upload qua multer)
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    // Nếu upload client-side, frontend tự lo hoặc ta có thể handle xóa ở đây nếu muốn (nhưng cần publicId)
    // Tạm thời chỉ cleanup file do multer tạo ra
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Cập nhật
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Xử lý ảnh:
    // 1. Nếu có file upload (multer)
    if (req.file) {
      // Xóa ảnh cũ
      if (category.publicId) {
        await cloudinary.uploader.destroy(category.publicId);
      }
      category.image = req.file.path;
      category.publicId = req.file.filename;
    }
    // 2. Nếu có image URL từ body (client-side upload) VÀ khác ảnh cũ
    else if (req.body.image && req.body.image !== category.image) {
      // Xóa ảnh cũ trước khi cập nhật mới
      if (category.publicId) {
        await cloudinary.uploader.destroy(category.publicId);
      }
      category.image = req.body.image;
      category.publicId = req.body.publicId || '';
    }
    // 3. Nếu image = "" (muốn xóa ảnh)
    else if (req.body.image === "" && category.publicId) {
      await cloudinary.uploader.destroy(category.publicId);
      category.image = "";
      category.publicId = "";
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    if (isActive !== undefined) category.isActive = isActive;

    const updatedCategory = await category.save();
    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Xóa
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Tìm danh mục trước để lấy thông tin ảnh
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    // Nếu danh mục có ảnh (publicId), thực hiện xóa trên Cloudinary
    if (category.publicId) {
      await cloudinary.uploader.destroy(category.publicId);
    } else if (category.image) {
      // Fallback for legacy images
      try {
        const publicId = category.image.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.log("Error extracting publicId from URL", e);
      }
    }

    // Xóa danh mục trong DB
    await Category.findByIdAndDelete(id);

    res.json({ message: 'Xoá danh mục và ảnh thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá danh mục', error: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };