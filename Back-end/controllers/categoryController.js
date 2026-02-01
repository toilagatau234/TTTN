const Category = require('../models/Category');

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
    const { name, description, image, publicId } = req.body;
    
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại' });
    }

    const category = await Category.create({ name, description, image, publicId });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Cập nhật
const updateCategory = async (req, res) => {
  try {
    const { name, description, image, publicId, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.image = image || category.image;
    category.publicId = publicId || category.publicId;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    const updatedCategory = await category.save();
    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Xóa
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    
    await category.deleteOne();
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };