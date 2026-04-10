const inventoryService = require('../services/inventoryService');

exports.getImports = async (req, res) => {
  try {
    const result = await inventoryService.getImports(req.query);
    return res.status(200).json({
      success: true,
      data: result.imports,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getImportDetail = async (req, res) => {
  try {
    const importRecord = await inventoryService.getImportById(req.params.id);
    if (!importRecord) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }
    return res.status(200).json({ success: true, data: importRecord });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createImport = async (req, res) => {
  try {
    const { supplierId, items, totalAmount, notes } = req.body;
    const adminId = req.user.id; // Require Auth Middleware truyền vào req.user

    const result = await inventoryService.importGoods(supplierId, items, totalAmount, notes, adminId);
    
    return res.status(201).json({ 
      success: true, 
      data: result, 
      message: 'Nhập hàng thành công.' 
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.createStockAdjustment = async (req, res) => {
  try {
    // Nhận mảng items từ frontend thay vì từng cái đơn lẻ
    const { items, notes, type = 'out' } = req.body;
    const adminId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm điều chỉnh không hợp lệ.' });
    }

    const result = await inventoryService.bulkAdjustStock(items, adminId, notes, type);
    
    return res.status(201).json({ 
      success: true, 
      data: result, 
      message: `Đã hoàn tất kiểm kê/báo huỷ ${items.length} mặt hàng.` 
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAdjustments = async (req, res) => {
  try {
    const result = await inventoryService.getAdjustments(req.query);
    return res.status(200).json({
      success: true,
      data: result.adjustments,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const stats = await inventoryService.getInventoryStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
