const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
  logo: String,
  description: String,
  email: String,
  phone: String,
  facebook: String,
  instagram: String,
  youtube: String,
  twitter: String,
  copyright: String,
}, { timestamps: true });

// We only need one footer document typically, but defining a schema allows structured storage
module.exports = mongoose.model('CmsFooter', footerSchema);
