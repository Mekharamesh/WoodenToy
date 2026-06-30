const mongoose = require('mongoose');

const productAttributeValueSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attribute',
        required: true,
    },
    // For single value attributes (Dropdown, RadioButton, etc)
    value: {
        type: String,
        trim: true,
    },
    // For multi-value attributes (MultiSelect, Checkbox, etc)
    values: [{
        type: String,
        trim: true,
    }],
    // For numeric attributes
    numericValue: {
        type: Number,
    },
    // For date attributes
    dateValue: {
        type: Date,
    },
    booleanValue: {
        type: Boolean,
    },
}, { timestamps: true });

// Create compound index to ensure unique attribute per product
productAttributeValueSchema.index({ product: 1, attribute: 1 }, { unique: true });
productAttributeValueSchema.index({ attribute: 1, value: 1 });
productAttributeValueSchema.index({ attribute: 1, values: 1 });
productAttributeValueSchema.index({ value: 'text', values: 'text' });

module.exports = mongoose.model('ProductAttributeValue', productAttributeValueSchema);
