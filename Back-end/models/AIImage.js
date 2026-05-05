const mongoose = require('mongoose');

/**
 * AIImage — Lưu trữ các hình ảnh do AI tạo ra (Soft Rollback feature)
 * - Tách biệt vòng đời của ảnh và đơn hàng
 * - Lưu dưới dạng bản nháp (draft) trước khi được sử dụng trong đơn hàng
 */
const aiImageSchema = new mongoose.Schema({
    // Người dùng sở hữu ảnh
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    // ID sinh ra từ lúc generate (chống trùng lặp upload)
    generationId: {
        type: String,
        required: true,
        unique: true
    },

    // Đường dẫn ảnh Cloudinary
    imageUrl: {
        type: String,
        required: true
    },

    // ID public của Cloudinary (để có thể xoá sau này)
    publicId: {
        type: String,
        required: true
    },

    // Trạng thái sử dụng của ảnh
    status: {
        type: String,
        enum: ['draft', 'used', 'expired'],
        default: 'draft'
    },

    // Thông tin metadata về nội dung ảnh (tuỳ chọn)
    metadata: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Tự động quản lý createdAt và updatedAt
});

module.exports = mongoose.model('AIImage', aiImageSchema);
