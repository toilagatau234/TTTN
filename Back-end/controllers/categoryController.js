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
            image: imageUrl, // Gán giá trị String URL vào đây
            // imagePublicId: publicId // (Nếu model có field này)
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
        const { id } = req.params;
        // Tìm danh mục trước để lấy thông tin ảnh
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
        // Nếu danh mục có ảnh (public_id), thực hiện xóa trên Cloudinary
        if (category.imagePublicId) {
             await cloudinary.uploader.destroy(category.imagePublicId);
        } else if (category.image) {
            const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
             await cloudinary.uploader.destroy(publicId);
        }

        // Xóa danh mục trong DB
        await Category.findByIdAndDelete(id);

        res.json({ message: 'Xoá danh mục và ảnh thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xoá danh mục', error: error.message });
    }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };