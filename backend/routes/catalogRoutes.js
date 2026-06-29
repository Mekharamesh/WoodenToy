const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createProduct, getProducts, getProductById, updateProduct, deleteProduct,
    createCategory, getCategories, updateCategory, deleteCategory,
    createInventory, updateInventory
} = require('../controllers/catalogController');

// Categories
router.route('/category')
    .get(getCategories)
    .post(protect, authorize('admin', 'staff'), createCategory);

router.route('/category/:id')
    .put(protect, authorize('admin', 'staff'), updateCategory)
    .delete(protect, authorize('admin', 'staff'), deleteCategory);

// Products
router.route('/product')
    .get(getProducts)
    .post(protect, authorize('admin', 'staff'), createProduct);

router.route('/product/:id')
    .get(getProductById)
    .put(protect, authorize('admin', 'staff'), updateProduct)
    .delete(protect, authorize('admin', 'staff'), deleteProduct);

// Inventory
router.route('/inventory')
    .post(protect, authorize('admin', 'staff'), createInventory);

router.route('/inventory/:productId')
    .put(protect, authorize('admin', 'staff'), updateInventory);

module.exports = router;
