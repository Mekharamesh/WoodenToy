const mongoose = require('mongoose');

const attributeValueSchema = new mongoose.Schema({
    attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attribute',
        required: true,
    },
    value: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        lowercase: true,
    },
    // For color picker type
    colorCode: {
        type: String,
    },
    // Order in which value should appear
    displayOrder: {
        type: Number,
        default: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Create compound index to ensure unique values per attribute
attributeValueSchema.index({ attribute: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('AttributeValue', attributeValueSchema);
