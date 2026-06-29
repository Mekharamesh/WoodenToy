const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
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
    images: [{
        type: String, // Array of image URLs
    }],
    variants: [{
        name: String, // e.g., 'Color', 'Size'
        value: String, // e.g., 'Red', 'Small'
        additionalPrice: { type: Number, default: 0 }
    }],
    ageGroup: [{
        type: String,
        trim: true,
    }],
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    toyType: [{
        type: String,
        trim: true,
    }],
    woodType: {
        type: String,
        trim: true,
    },
    skillDevelopment: [{
        type: String,
        trim: true,
    }],
    theme: [{
        type: String,
        trim: true,
    }],
    materialType: {
        type: String,
        trim: true,
    },
    seoTitle: String,
    seoDescription: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
