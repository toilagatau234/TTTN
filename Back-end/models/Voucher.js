const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Vui lòng nhập mã voucher'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    // Loại giảm giá: phần trăm hoặc số tiền cố định
    discountType: {
        type: String,
        enum: ['percent', 'fixed'],
        required: true,
        default: 'percent'
    },
    // Giá trị giảm (VD: 10 = 10% hoặc 50000 = 50k)
    discountValue: {
        type: Number,
        required: [true, 'Vui lòng nhập giá trị giảm'],
        min: [0, 'Giá trị giảm phải >= 0']
    },
    // Giảm tối đa (chỉ áp dụng cho percent)
    maxDiscount: {
        type: Number,
        default: null
    },
    // Đơn hàng tối thiểu để áp dụng
    minOrderValue: {
        type: Number,
        default: 0
    },
    // Số lần sử dụng
    usageLimit: {
        type: Number,
        default: null  // null = không giới hạn
    },
    usedCount: {
        type: Number,
        default: 0
    },
    // Thời hạn
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày hết hạn']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual: kiểm tra voucher còn hiệu lực
voucherSchema.virtual('isValid').get(function () {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.startDate &&
        now <= this.endDate &&
        (this.usageLimit === null || this.usedCount < this.usageLimit)
    );
});

voucherSchema.set('toJSON', { virtuals: true });
voucherSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Voucher', voucherSchema);
