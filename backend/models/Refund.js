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
  customerPhone: {
    type: String,
    default: '',
  },
  customerEmail: {
    type: String,
    default: '',
  },
  orderRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  originalStatus: {
    type: String,
    default: '',
  },
  cancellationFee: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
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
    enum: ['Approved Refund', 'Approval Pending', 'Refund Approved', 'Pending', 'Processing', 'Failed', 'Completed'],
    default: 'Approval Pending',
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
