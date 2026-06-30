const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    url: {
        type: String,
        required: true,
    },
    altText: {
        type: String,
        default: '',
    },
    displayOrder: {
        type: Number,
        default: 1,
    },
    isThumbnail: {
        type: Boolean,
        default: false,
    },
    fileSize: {
        type: Number, // bytes
    },
    mimeType: {
        type: String,
    },
    width: {
        type: Number,
    },
    height: {
        type: Number,
    },
}, { timestamps: true });

productImageSchema.index({ product: 1, displayOrder: 1 });

module.exports = mongoose.model('ProductImage', productImageSchema);
