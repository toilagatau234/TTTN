const mongoose = require('mongoose');
const ImportRecord = require('../models/ImportRecord');
const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

/**
 * Lấy danh sách phiếu nhập
 */
exports.getImports = async (query = {}) => {
  const { keyword, page = 1, limit = 10, startDate, endDate } = query;
  
  let filter = {};

  // Basic date filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const imports = await ImportRecord.find(filter)
    .populate('supplierId', 'name phone')
    .populate('importedBy', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await ImportRecord.countDocuments(filter);

  return {
    imports,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Lấy chi tiết 1 phiếu nhập
 */
exports.getImportById = async (id) => {
  return await ImportRecord.findById(id)
    .populate('supplierId', 'name phone email address')
    .populate('importedBy', 'name email')
    .populate({
      path: 'items.productId',
      select: 'name images price'
    });
};

/**
 * Hàm nhập hàng vào kho (Transactions)
 */
exports.importGoods = async (supplierId, items, totalAmount, notes, adminId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Lưu ImportRecord vào DB
    const importRecord = new ImportRecord({
      supplierId,
      importedBy: adminId,
      items,
      totalAmount,
      notes
    });
    await importRecord.save({ session });

    let totalQuantity = 0;

    // 2. Cập nhật tồn kho ($inc) cho từng sản phẩm
    for (const item of items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { new: true, session }
      );
      if (!product) {
        throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại.`);
      }
      totalQuantity += item.quantity;
    }

    // 3. Ghi ActivityLog đồng bộ
    const log = new ActivityLog({
      userId: adminId,
      action: 'IMPORT_GOODS',
      target: 'ImportRecord',
      targetId: importRecord._id.toString(),
      description: `Đã hoàn tất nhập kho ${totalQuantity} đơn vị sản phẩm từ nhà cung cấp.`
    });
    await log.save({ session });

    // Hoàn tất transaction
    await session.commitTransaction();
    return importRecord;
  } catch (error) {
    // Rút lui mọi cập nhật nếu có 1 bước lỗi
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Hàm xuất kho / nhập thêm (Transactions)
 */
exports.bulkAdjustStock = async (items, adminId, notes, type = 'out') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adjustments = [];
    let logDescription = type === 'out' ? `Đã báo huỷ/xuất giảm: ` : `Đã kiểm kê/cộng thêm: `;

    for (const item of items) {
      const { productId, quantity, reason } = item;

      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error(`Sản phẩm ID ${productId} không tồn tại.`);
      
      // Nếu là báo huỷ (out), kiểm tra tồn kho. Nếu là kiểm kê thêm (in), thì không cần.
      if (type === 'out') {
        if (product.stock < quantity) {
          throw new Error(`Sản phẩm "${product.name}" có số lượng báo huỷ (${quantity}) vượt quá tồn kho thực tế (${product.stock}).`);
        }
        product.stock -= quantity;
        logDescription += `[${product.name}: -${quantity}] `;
      } else {
         product.stock += quantity;
         logDescription += `[${product.name}: +${quantity}] `;
      }

      await product.save({ session });

      const adjustment = new StockAdjustment({
        productId,
        adjustedBy: adminId,
        quantity,
        reason: reason || (type === 'out' ? 'Damaged' : 'Inventory Surplus'),
        notes,
        type
      });
      // Nếu model StockAdjustment chưa có field 'type', nó sẽ bỏ qua.
      // Dùng chung note/reason để làm dấu vết.
      
      await adjustment.save({ session });
      adjustments.push(adjustment);
    }

    const log = new ActivityLog({
      userId: adminId,
      action: type === 'in' ? 'STOCK_ADJUST_ADD' : 'STOCK_ADJUST_SUB',
      target: 'StockAdjustment',
      description: logDescription.substring(0, 500)
    });
    await log.save({ session });

    await session.commitTransaction();
    return adjustments;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Lấy lịch sử Báo huỷ / Kiểm kê
 */
exports.getAdjustments = async (query = {}) => {
  const { page = 1, limit = 10, startDate, endDate, type } = query;
  
  let filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  if (type) {
    filter.type = type;
  }

  const adjustments = await StockAdjustment.find(filter)
    .populate('productId', 'name images')
    .populate('adjustedBy', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await StockAdjustment.countDocuments(filter);

  return {
    adjustments,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Lấy thống kê chung cho Dashboard Quản lý Kho
 */
exports.getInventoryStats = async () => {
  // 1. Giá trị kho (Chỉ tính những sp đang active/out_of_stock, giả sử là tất cả Product)
  const products = await Product.find({ status: { $ne: 'inactive' } }).select('stock price');
  const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  // Tính thời gian từ đầu tháng đến hiện tại
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 2. Các chỉ số trong tháng
  const monthImports = await ImportRecord.find({
    createdAt: { $gte: startOfMonth }
  });

  const monthImportCount = monthImports.length;
  const monthImportCost = monthImports.reduce((sum, record) => sum + record.totalAmount, 0);

  // 3. NCC thân thiết (Số lần order nhiều nhất)
  const supplierAggregation = await ImportRecord.aggregate([
    { $group: { _id: '$supplierId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplierDetails' } },
    { $unwind: '$supplierDetails' }
  ]);
  
  const topSupplierName = supplierAggregation.length > 0 ? supplierAggregation[0].supplierDetails.name : 'Chưa có';

  return {
    inventoryValue,
    monthImportCount,
    monthImportCost,
    topSupplierName
  };
};

