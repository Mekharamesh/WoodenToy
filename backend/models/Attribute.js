const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
    },
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
    type: {
        type: String,
        enum: ['Text', 'Textarea', 'Dropdown', 'MultiSelect', 'Checkbox', 'RadioButton', 'Number', 'ColorPicker', 'Date', 'Boolean', 'File', 'Image'],
        required: true,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Order in which attribute should appear in forms
    displayOrder: {
        type: Number,
        default: 1,
    },
    // === NEW ENTERPRISE FIELDS (v2) ===
    code: {
        type: String,
        trim: true,
        uppercase: true,
    },
    isRequired: {
        type: Boolean,
        default: false,
    },
    isSearchable: {
        type: Boolean,
        default: false,
    },
    isFilterable: {
        type: Boolean,
        default: false,
    },
    isComparable: {
        type: Boolean,
        default: false,
    },
    // === VARIANT SYSTEM ===
    isVariant: {
        type: Boolean,
        default: false,
    },
    visibleOnProduct: {
        type: Boolean,
        default: true,
    },
    visibleOnWebsite: {
        type: Boolean,
        default: true,
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

attributeSchema.index({ isDeleted: 1, isActive: 1 });
attributeSchema.index({ category: 1, subCategory: 1, isDeleted: 1, isActive: 1 });
// Non-unique indexes for query performance — same attribute name can exist in multiple sub-categories
attributeSchema.index({ category: 1, subCategory: 1, slug: 1 });
attributeSchema.index({ category: 1, subCategory: 1, code: 1 }, { sparse: true });

module.exports = mongoose.model('Attribute', attributeSchema);
