const mongoose = require('mongoose');

const productVariantOptionSchema = new mongoose.Schema({
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true,
        index: true,
    },
    attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attribute',
        required: true,
        index: true,
    },
    // The selected value/option for this attribute in the variant
    // Can be a string, number, or reference to AttributeValue
    value: {
        type: mongoose.Schema.Types.String,
        trim: true,
        required: true,
    },
    // Optional: reference to AttributeValue if it exists
    attributeValue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttributeValue',
        sparse: true,
    },
}, { timestamps: true });

// Compound index to ensure unique attribute per variant
productVariantOptionSchema.index({ variant: 1, attribute: 1 }, { unique: true });

// Index for querying options by attribute
productVariantOptionSchema.index({ attribute: 1, value: 1 });

module.exports = mongoose.model('ProductVariantOption', productVariantOptionSchema);
