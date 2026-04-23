const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true,
        maxlength: [100, 'Tên sản phẩm không được quá 100 ký tự']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả sản phẩm'],
    },
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá sản phẩm'],
        min: [0, 'Giá sản phẩm phải lớn hơn 0']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Giá gốc phải lớn hơn 0']
    },
    stock: {
        type: Number,
        required: [true, 'Vui lòng nhập số lượng tồn kho'],
        default: 0,
        min: [0, 'Số lượng tồn kho phải lớn hơn hoặc bằng 0']
    },
    sold: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true, 'Vui lòng chọn danh mục cho sản phẩm']
    },
    // ==========================================
    // AI MATCHING ATTRIBUTES (New fields for Step 4)
    // ==========================================
    // Phân loại loại sản phẩm cho AI builder
    product_type: {
        type: String,
        enum: ['complete_bouquet', 'basket', 'wrapper', 'ribbon', 'flower_component', 'accessory'],
        default: 'complete_bouquet'
        // basket: giỏ/lẵng/hộp đựng hoa
        // wrapper: giấy gói
        // ribbon: ruy băng, nơ
        // flower_component: hoa (chính hoặc phụ) — dùng role_type để phân biệt
        // accessory: phụ kiện trang trí (thiệp, thú bông, nến...)
        // complete_bouquet: giỏ hoa hoàn chỉnh (legacy)
    },
    // Vai trò trong giỏ hoa (cho flower_component)
    role_type: {
        type: String,
        enum: ['main_flower', 'sub_flower', null],
        default: null
    },
    occasion: [{
        type: String,
        trim: true
        // vd: 'birthday', 'anniversary', 'wedding'
    }],
    style: [{
        type: String,
        trim: true
        // vd: 'luxury', 'minimalist', 'vintage'
    }],
    main_flowers: [{
        type: String,
        trim: true
        // vd: 'rose', 'tulip', 'sunflower'
    }],
    sub_flowers: [{
        type: String,
        trim: true
        // vd: 'baby breath', 'eucalyptus'
    }],
    dominant_color: {
        type: String,
        trim: true
        // vd: 'red', 'pink', 'white'
    },
    secondary_colors: [{
        type: String,
        trim: true
        // vd: 'green', 'gold'
    }],
    layout: {
        type: String,
        trim: true
        // vd: 'round', 'heart', 'cascade'
    },
    elements: [{
        type: String,
        trim: true
        // Các yếu tố trang trí khác vd: 'ribbon', 'pearl'
    }],
    // ==========================================
    processed_image: {
        type: String,
        trim: true
    },
    images: [
        {
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        }
    ],
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },
    isHot: {
        type: Boolean,
        default: false
    },
    isNewProduct: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware tạo slug từ tên trước khi lưu
productSchema.pre('save', function () {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
});

// Middleware cập nhật status dựa trên stock
productSchema.pre('save', function () {
    if (this.stock === 0) {
        this.status = 'out_of_stock';
    } else if (this.stock > 0 && this.status === 'out_of_stock') {
        this.status = 'active';
    }
});

module.exports = mongoose.model('Product', productSchema);
