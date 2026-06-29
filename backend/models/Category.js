const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    type: {
        type: String,
        enum: ['Main', 'AgeWise', 'Educational', 'Montessori', 'Puzzle'],
        default: 'Main',
    },
    description: {
        type: String,
    },
    image: {
        type: String, // URL to the category image
    },
    displayOrder: {
        type: Number,
        default: 1,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    seoTitle: {
        type: String,
    },
    seoDescription: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
