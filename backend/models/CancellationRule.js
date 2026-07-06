const mongoose = require('mongoose');

const cancellationRuleSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online'],
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'],
    required: true,
  },
  cancellationFee: {
    type: Number,
    default: 0,
  },
  refundPercentage: {
    type: Number,
    default: 100,
  },
  timeLimit: {
    type: String, // e.g., '24 Hours', '48 Hours', 'Before Delivery'
    default: '-',
  },
  isAllowed: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Disabled', 'Locked'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CancellationRule', cancellationRuleSchema);
