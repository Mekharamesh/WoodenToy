const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
  title: { type: String, default: 'Default Footer' },
  status: { type: Boolean, default: true },
  logo: String,
  description: String,
  email: String,
  phone: String,
  facebook: String,
  instagram: String,
  youtube: String,
  twitter: String,
  copyright: String,
  mapUrl: String,
  mapIframe: String,
  lists: [
    {
      title: String,
      links: [
        {
          label: String,
          url: String
        }
      ]
    }
  ],
  position: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('CmsFooter', footerSchema);
