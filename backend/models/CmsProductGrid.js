const mongoose = require('mongoose');

const productGridSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  mobileCount: {
    type: Number,
    default: 2,
  },
  desktopCount: {
    type: Number,
    default: 4,
  },
  ctaText: {
    type: String,
  },
  ctaUrl: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  position: {
    type: Number,
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model('CmsProductGrid', productGridSchema);
