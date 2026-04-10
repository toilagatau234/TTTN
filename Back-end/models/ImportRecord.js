const mongoose = require('mongoose');

const importItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false }); // Không cần tự sinh _id cho mỗi item

const importRecordSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [importItemSchema],
  totalAmount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ImportRecord', importRecordSchema);
