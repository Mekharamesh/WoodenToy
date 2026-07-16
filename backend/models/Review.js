const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  images: [{ type: String }],   // uploaded image URLs
  videos: [{ type: String }],   // uploaded video URLs
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  orderItemId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  helpfulVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'not_helpful'] },
  }],
  adminReply: {
    text: { type: String, default: '' },
    repliedAt: { type: Date },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// Allow one review per delivered order item, even if the same product is purchased again later
reviewSchema.index({ user: 1, orderId: 1, orderItemId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
