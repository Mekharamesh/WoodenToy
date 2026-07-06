const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['COD', 'Cashfree'],
    required: true,
  },
  slaTimeline: {
    type: String,
    default: '-',
  },
  refundDestination: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Approved Refund', 'Pending', 'Processing', 'Failed', 'Completed'],
    default: 'Pending',
  },
  refundActionStatus: {
    type: String,
    enum: ['Refunded', 'Refund', 'Processing', 'Failed'],
    default: 'Refund',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Refund', refundSchema);
