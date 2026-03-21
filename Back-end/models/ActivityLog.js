const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true // e.g., 'CREATE', 'UPDATE', 'DELETE', 'BLOCK'
  },
  target: { 
    type: String, 
    required: true // e.g., 'Product', 'User', 'Category', 'Voucher'
  },
  targetId: { 
    type: String 
  },
  description: { 
    type: String 
  },
  ip: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
