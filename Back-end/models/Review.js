const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    rating: {
        type: Number,
        required: [true, 'Vui lòng chọn số sao'],
        min: [1, 'Tối thiểu 1 sao'],
        max: [5, 'Tối đa 5 sao']
    },
    comment: {
        type: String,
        required: [true, 'Vui lòng nhập nhận xét'],
        trim: true,
        maxlength: [1000, 'Nhận xét tối đa 1000 ký tự']
    },
    images: [{
        url: String,
        publicId: String
    }],
    isApproved: {
        type: Boolean,
        default: true  // Tự duyệt, admin có thể ẩn sau
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reply: {
        type: String,
        trim: true
    },
    repliedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Mỗi user chỉ review 1 lần cho mỗi sản phẩm
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method: Tính lại rating trung bình cho sản phẩm
reviewSchema.statics.calcAverageRating = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId, isApproved: true } },
        {
            $group: {
                _id: '$product',
                avgRating: { $avg: '$rating' },
                numReviews: { $sum: 1 }
            }
        }
    ]);

    // Cập nhật vào Product (nếu Product model có trường rating)
    const Product = mongoose.model('Product');
    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            averageRating: Math.round(stats[0].avgRating * 10) / 10,
            numReviews: stats[0].numReviews
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            averageRating: 0,
            numReviews: 0
        });
    }
};

// Sau khi save/remove → tính lại rating
reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.product);
});

reviewSchema.post('findOneAndDelete', function (doc) {
    if (doc) {
        doc.constructor.calcAverageRating(doc.product);
    }
});

module.exports = mongoose.model('Review', reviewSchema);
