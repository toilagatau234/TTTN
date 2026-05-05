const mongoose = require('mongoose');

/**
 * CustomBouquetOrder — Đơn hàng giỏ hoa tùy chỉnh bằng AI (v2)
 *
 * Lưu lại toàn bộ quá trình AI tạo giỏ hoa:
 * - Entities người dùng mô tả
 * - Danh sách items được AI chọn
 * - Ảnh AI tạo (Cloudinary URL — KHÔNG lưu base64 lâu dài)
 * - Prompt đã dùng + metadata loại bó hoa
 * - Trạng thái: draft → image_generated → confirmed → processing → completed
 */
const customBouquetOrderSchema = new mongoose.Schema({
    // Người dùng
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    // Session AI
    sessionId: {
        type: String,
        required: true
    },

    // Entities AI bóc tách từ mô tả người dùng
    entities: {
        flower_types: [String],
        colors: [String],
        occasion: String,
        style: String,
        budget: Number,
        target: String,
    },

    // Mô tả gốc của người dùng
    userDescription: {
        type: String,
        trim: true
    },

    // Items AI đã chọn và xếp vào giỏ
    selectedItems: {
        basket: {
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String
        },
        wrapper: {
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String
        },
        ribbon: {
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String
        },
        main_flowers: [{
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String,
            quantity: { type: Number, default: 1 }
        }],
        sub_flowers: [{
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String,
            quantity: { type: Number, default: 1 }
        }],
        accessories: [{
            product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            image: String,
            quantity: { type: Number, default: 1 }
        }]
    },

    // Giá tổng
    totalPrice: {
        type: Number,
        default: 0
    },

    // Ảnh AI tạo — v2: Cloudinary URL (KHÔNG lưu base64)
    // Chỉ lưu ảnh được người dùng chọn (selected: true)
    generatedImages: [{
        url: String,        // Cloudinary secure_url
        public_id: String,        // để xóa Cloudinary nếu cần
        selected: { type: Boolean, default: false }
    }],

    // Prompt đã dùng để tạo ảnh
    promptUsed: { type: String, trim: true },

    // Metadata loại bó hoa do pipeline detect
    imageMetadata: {
        type: { type: String },       // 'bouquet' | 'basket' | 'box' | 'vase' | 'stand'
        flowers: [String],
        colors: [String],
        accessories: [String]
    },

    // (backward compat) Ảnh cũ có base64 — trước phiên bản v2
    generatedImage: {
        url: String,
        base64: String,
        generatedAt: Date,
        prompt: String,
        model: String,
    },

    // Trạng thái đơn
    status: {
        type: String,
        enum: ['draft', 'image_generated', 'confirmed', 'processing', 'completed', 'cancelled'],
        default: 'draft'
        // draft: đang chat, chưa tạo ảnh
        // image_generated: AI đã tạo ảnh, chờ user chọn
        // confirmed: user đồng ý ảnh, đã tạo đơn
        // processing: shop đang làm
        // completed: hoàn thành
        // cancelled: huỷ
    },

    // Ghi chú thêm
    note: {
        type: String,
        trim: true
    },

    // Lịch sử chat (snapshot)
    chatHistory: [{
        role: { type: String, enum: ['user', 'bot'] },
        text: String,
        ts: Date
    }],

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-update updatedAt
customBouquetOrderSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// Virtual: order code hiển thị
customBouquetOrderSchema.virtual('orderCode').get(function () {
    return `CB-${String(this._id).slice(-8).toUpperCase()}`;
});

module.exports = mongoose.model('CustomBouquetOrder', customBouquetOrderSchema);
