const mongoose = require('mongoose');

// Schema cho từng item trong đơn hàng (snapshot tại thời điểm đặt)
const orderItemSchema = new mongoose.Schema({
    // --- Sản phẩm thường ---
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: function () { return !this.isCustom; }
    },

    // --- Thông tin snapshot (lưu tại thời điểm đặt hàng) ---
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },

    // --- Sản phẩm custom AI ---
    isCustom: { type: Boolean, default: false },
    materials: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number
    }],
    note: { type: String }
}, { _id: true });

// Schema chính cho đơn hàng
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderCode: {
        type: String,
        unique: true
    },
    items: [orderItemSchema],

    // Thông tin giao hàng
    shippingInfo: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        ward: { type: String },       // Phường/Xã
        district: { type: String },    // Quận/Huyện
        city: { type: String },        // Tỉnh/TP
        note: { type: String }         // Ghi chú giao hàng
    },

    // Thanh toán
    paymentMethod: {
        type: String,
        enum: ['cod', 'banking', 'momo', 'zalopay'],
        default: 'cod'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: { type: Date },

    // Giá
    itemsPrice: { type: Number, required: true },    // Tổng tiền hàng
    shippingPrice: { type: Number, default: 0 },     // Phí ship
    discountPrice: { type: Number, default: 0 },     // Giảm giá (voucher)
    totalPrice: { type: Number, required: true },     // Tổng cộng

    // Voucher
    voucher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher'
    },

    // Trạng thái đơn hàng
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },
    cancelReason: { type: String },
    deliveredAt: { type: Date }
}, {
    timestamps: true
});

// Tự tạo mã đơn hàng trước khi lưu: DH + timestamp + 4 số random
orderSchema.pre('save', function () {
    if (!this.orderCode) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        this.orderCode = `DH${timestamp}${random}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);
