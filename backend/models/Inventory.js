const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
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

module.exports = mongoose.model('Inventory', inventorySchema);
