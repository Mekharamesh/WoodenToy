const mongoose = require('mongoose');

const navbarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Navigation title is required'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'Navigation URL is required'],
    trim: true,
  },
  icon: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: Boolean,
    default: true,
  },
  position: {
    type: Number,
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model('CmsNavbar', navbarSchema);
