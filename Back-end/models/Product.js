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
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware tạo slug từ tên trước khi lưu
productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Middleware cập nhật status dựa trên stock
productSchema.pre('save', function (next) {
    if (this.stock === 0) {
        this.status = 'out_of_stock';
    } else if (this.stock > 0 && this.status === 'out_of_stock') {
        this.status = 'active';
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
