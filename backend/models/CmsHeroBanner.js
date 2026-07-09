const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  description: {
    type: String,
  },
  bannerImage: {
    type: String, // URL of the desktop image
    required: true,
  },
  mobileBanner: {
    type: String, // URL of the mobile image
  },
  ctaImage: {
    type: String,
  },
  ctaURL: {
    type: String,
  },
  buttonText: {
    type: String,
  },
  animation: {
    type: String,
    enum: ['Fade', 'Slide', 'Zoom'],
    default: 'Fade',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('CmsHeroBanner', heroBannerSchema);
