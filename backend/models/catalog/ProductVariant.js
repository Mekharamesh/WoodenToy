const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    variantAttributes: [{
        attribute: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attribute',
            required: true,
        },
        value: {
            type: String,
            required: true,
        },
    }],
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    barcode: {
        type: String,
        sparse: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    compareAtPrice: {
        type: Number,
        min: 0,
    },
    costPrice: {
        type: Number,
        min: 0,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    images: [{
        type: String,
    }],
    weight: {
        type: Number,
        min: 0,
    },
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    displayOrder: {
        type: Number,
        default: 1,
    },
}, { timestamps: true });

productVariantSchema.index({ product: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
