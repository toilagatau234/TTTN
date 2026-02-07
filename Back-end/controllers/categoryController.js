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

    let imageUrl = '';
    let publicId = '';

    if (req.file) {
      imageUrl = req.file.path;      // Đây mới là chuỗi URL chuẩn (String)
      publicId = req.file.filename;
    }

    const newCategory = new Category({
      name,
      description,
      image: imageUrl,
      publicId: publicId // Save the publicId to DB
    });

    await newCategory.save();
    res.status(201).json(newCategory);

  } catch (error) {
    // Xóa ảnh trên cloudinary nếu lưu DB thất bại để tránh rác
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ message: error.message });
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

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (category.publicId) {
        await cloudinary.uploader.destroy(category.publicId);
      } else if (category.image) {
        // Try to extract publicId from url if not saved in DB (legacy data)
        try {
          const publicId = category.image.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.log("Could not extract publicId from image url", e);
        }
      }

      category.image = req.file.path;
      category.publicId = req.file.filename;
    }

    category.name = name || category.name;
    category.description = description || category.description;
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