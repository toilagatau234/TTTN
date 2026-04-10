const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên Banner']
  },
  image: {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  link: {
    type: String,
    default: '/'
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
