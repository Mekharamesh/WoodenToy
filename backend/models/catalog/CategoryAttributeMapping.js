const mongoose = require('mongoose');

const categoryAttributeMappingSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true,
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
        index: true,
    },
    attribute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attribute',
        required: true,
        index: true,
    },
    isRequired: {
        type: Boolean,
        default: false,
    },
    displayOrder: {
        type: Number,
        default: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Ensure unique mapping per subcategory-attribute pair
categoryAttributeMappingSchema.index({ category: 1, subCategory: 1, attribute: 1 }, { unique: true });
categoryAttributeMappingSchema.index({ category: 1, subCategory: 1, displayOrder: 1 });

module.exports = mongoose.model('CategoryAttributeMapping', categoryAttributeMappingSchema);
