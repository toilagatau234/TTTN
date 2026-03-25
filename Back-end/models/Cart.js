// Back-end/models/Cart.js
const mongoose = require('mongoose');

// Schema cho từng món hàng trong giỏ
const cartItemSchema = new mongoose.Schema({
    // -----------------------------------------
    // 1. DÀNH CHO SẢN PHẨM THÔNG THƯỜNG TRONG KHO
    // -----------------------------------------
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        // Bắt buộc phải có ObjectId nếu KHÔNG PHẢI là hàng AI tạo
        required: function() { return !this.isCustom; } 
    },

    // -----------------------------------------
    // 2. DÀNH CHUNG CHO CẢ 2 LOẠI (Số lượng)
    // -----------------------------------------
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Số lượng tối thiểu là 1']
    },

    // -----------------------------------------
    // 3. DÀNH CHO SẢN PHẨM CUSTOM (AI HYDRANGEA)
    // -----------------------------------------
    isCustom: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        // Bắt buộc có tên nếu là hàng AI tạo
        required: function() { return this.isCustom; }
    },
    image: {
        type: String,
        // Ảnh do Gemini render
        required: function() { return this.isCustom; }
    },
    price: {
        type: Number,
        // Giá được tính toán từ RAG tại thời điểm add to cart
        required: function() { return this.isCustom; }
    },
    // Lưu lại chi tiết thành phần của lẵng hoa
    components: [{
        item: String,
        qty: Number,
        unitPrice: Number,
        totalPrice: Number
    }],
    baseFee: {
        type: Number,
        default: 50000
    },
    note: {
        type: String // Ghi chú thêm (VD: "Tông màu đỏ chủ đạo")
    }
}, { 
    _id: true // Mongoose tự động tạo _id cho mỗi item, rất tiện để gọi API xoá item khỏi giỏ
});


// Schema chính của Giỏ hàng
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi User chỉ có duy nhất 1 giỏ hàng (Giỏ hàng thường trực)
    },
    items: [cartItemSchema]
}, {
    timestamps: true // Tự động có createdAt, updatedAt để biết user update giỏ hàng lần cuối khi nào
});

// Virtual field: Tự động tính tổng tiền của giỏ hàng (Tùy chọn bổ sung thêm)
cartSchema.virtual('totalCartPrice').get(function() {
    return this.items.reduce((total, item) => {
        // Đối với hàng thường, cần populate product mới có giá. 
        // Đối với hàng AI, giá đã lưu sẵn trong item.price.
        const itemPrice = item.isCustom ? item.price : (item.product ? item.product.price : 0);
        return total + (itemPrice * item.quantity);
    }, 0);
});

// Đảm bảo virtual fields được hiển thị khi JSON.stringify
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);