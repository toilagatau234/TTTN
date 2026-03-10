const mongoose = require('mongoose');

// Đối tác vận chuyển
const carrierSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },       // VD: "GHN", "GHTK", "J&T"
    code: { type: String, required: true, unique: true },       // VD: "ghn", "ghtk"
    logo: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    baseFee: { type: Number, default: 30000 },                  // Phí ship mặc định
    freeShipMinOrder: { type: Number, default: 500000 },        // Free ship khi đơn >= xxx
    estimatedDays: { type: String, default: '2-4 ngày' },       // Thời gian dự kiến
}, { timestamps: true });

// Vận đơn (liên kết đơn hàng ↔ hãng ship)
const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier',
        required: true
    },
    trackingCode: {
        type: String,
        unique: true,
        sparse: true  // Cho phép null nhưng nếu có thì unique
    },
    status: {
        type: String,
        enum: ['created', 'picked_up', 'in_transit', 'delivering', 'delivered', 'returned', 'failed'],
        default: 'created'
    },
    shippingFee: { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    statusHistory: [{
        status: String,
        time: { type: Date, default: Date.now },
        note: String
    }]
}, { timestamps: true });

// Auto tạo tracking code
shipmentSchema.pre('save', function (next) {
    if (!this.trackingCode) {
        const prefix = 'SHIP';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(100 + Math.random() * 900);
        this.trackingCode = `${prefix}${timestamp}${random}`;
    }
    next();
});

const Carrier = mongoose.model('Carrier', carrierSchema);
const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = { Carrier, Shipment };
