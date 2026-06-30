const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantKey: {
        type: String,
        default: 'default',
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    barcode: {
        type: String,
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    warehouseLocation: {
        type: String,
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
    }
}, { timestamps: true });

inventorySchema.index({ product: 1, variantKey: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
