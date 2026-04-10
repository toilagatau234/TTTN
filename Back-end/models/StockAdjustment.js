const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true }, // Số lượng điều chỉnh
  reason: { type: String, required: true }, // 'héo', 'dập nát', 'Inventory Check'
  type: { type: String, enum: ['in', 'out'], default: 'out' }, // Loại điều chỉnh: Tăng (in) / Giảm (out)
  notes: { type: String }, // Ghi chú thêm
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
