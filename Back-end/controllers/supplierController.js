const Supplier = require('../models/Supplier');
const ImportRecord = require('../models/ImportRecord');

// Lấy danh sách NCC có tìm kiếm và phân trang
exports.getSuppliers = async (req, res) => {
  try {
    const { keyword = '', page = 1, limit = 10 } = req.query;
    
    // Tạo bộ lọc theo keyword nếu có
    const query = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword, $options: 'i' } }
          ]
        }
      : {};

    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(); // Dùng lean để có thể thêm field vào object

    // Đếm số lần nhập hàng thực tế cho từng NCC trong trang hiện tại
    const suppliersWithCount = await Promise.all(suppliers.map(async (s) => {
      const count = await ImportRecord.countDocuments({ supplierId: s._id });
      return { ...s, importCount: count };
    }));

    const total = await Supplier.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: suppliersWithCount,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy 1 NCC
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại!' });
    }
    return res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm NCC mới
exports.createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, status } = req.body;

    const existing = await Supplier.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên nhà cung cấp đã tồn tại!' });
    }

    const supplier = new Supplier({ name, phone, email, address, status });
    await supplier.save();

    return res.status(201).json({ success: true, data: supplier, message: 'Thêm nhà cung cấp thành công' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật NCC
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại!' });
    }

    return res.status(200).json({ success: true, data: supplier, message: 'Cập nhật thành công' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Xoá (hoặc vô hiệu hoá) NCC
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại!' });
    }
    return res.status(200).json({ success: true, message: 'Đã xoá nhà cung cấp' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
