const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề bài viết']
  },
  slug: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Vui lòng chọn danh mục']
  },
  thumbnail: {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  summary: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung bài viết']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    // Lưu tạm tên user nếu tài khoản bị xóa
    type: String,
    default: 'Admin'
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Draft'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Middleware auto generated slug before saving if modified
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^\w\s-]/g, '') // remove symbols
      .replace(/\s+/g, '-') // replace space with -
      .replace(/-+/g, '-') // remove continuous -
      + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
