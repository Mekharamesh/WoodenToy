const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import controllers
const categoryController = require('../controllers/categoryController');
const subCategoryController = require('../controllers/subCategoryController');
const attributeController = require('../controllers/attributeController');
const productController = require('../controllers/productController');
const productVariantController = require('../controllers/productVariantController');
const catalogController = require('../controllers/catalogController');
const uploadController = require('../controllers/uploadController');
const adminWrite = [protect, authorize('admin', 'staff')];

// ==========================================
// CATEGORY ROUTES
// ==========================================
router.get('/shop-categories', categoryController.getShopCategories);
router.post('/categories', ...adminWrite, categoryController.createCategory);
router.post('/categories/bulk', ...adminWrite, categoryController.bulkCreateCategory);
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/categories/:id/attributes', categoryController.getCategoryAttributes);
router.put('/categories/:id', ...adminWrite, categoryController.updateCategory);
router.delete('/categories/:id', ...adminWrite, categoryController.deleteCategory);
router.patch('/categories/:id/toggle-status', ...adminWrite, categoryController.toggleCategoryStatus);

// Legacy routes for backward compatibility
router.get('/category', categoryController.getCategories);
router.post('/category', ...adminWrite, categoryController.createCategory);
router.put('/category/:id', ...adminWrite, categoryController.updateCategory);
router.delete('/category/:id', ...adminWrite, categoryController.deleteCategory);

// ==========================================
// SUB CATEGORY ROUTES
// ==========================================
router.post('/subcategories', ...adminWrite, subCategoryController.createSubCategory);
router.get('/subcategories', subCategoryController.getSubCategories);
router.get('/subcategories/:id', subCategoryController.getSubCategoryById);
router.put('/subcategories/:id', ...adminWrite, subCategoryController.updateSubCategory);
router.delete('/subcategories/:id', ...adminWrite, subCategoryController.deleteSubCategory);
router.patch('/subcategories/:id/toggle-status', ...adminWrite, subCategoryController.toggleSubCategoryStatus);
router.patch('/subcategories/:id/attributes', ...adminWrite, subCategoryController.updateSubCategoryAttributes);

// ==========================================
// ATTRIBUTE ROUTES
// ==========================================
// Attributes
router.post('/attributes', ...adminWrite, attributeController.createAttribute);
router.get('/attributes', attributeController.getAttributes);
router.get('/attributes/:id', attributeController.getAttributeById);
router.put('/attributes/:id', ...adminWrite, attributeController.updateAttribute);
router.delete('/attributes/:id', ...adminWrite, attributeController.deleteAttribute);
router.patch('/attributes/:id/toggle-status', ...adminWrite, attributeController.toggleAttributeStatus);

// Attribute Values
router.post('/attributes/:id/values', ...adminWrite, attributeController.createAttributeValue);
router.get('/attributes/:id/values', attributeController.getAttributeValues);
router.put('/attribute-values/:id', ...adminWrite, attributeController.updateAttributeValue);
router.delete('/attribute-values/:id', ...adminWrite, attributeController.deleteAttributeValue);
router.patch('/attribute-values/:id/toggle-status', ...adminWrite, attributeController.toggleAttributeValueStatus);

// ==========================================
// SKU GENERATION
// ==========================================
router.get('/sku/generate', productController.generateSKU);

// ==========================================
// IMAGE UPLOAD ROUTES
// ==========================================
router.post('/upload', ...adminWrite, uploadController.uploadImages);
router.delete('/upload/:filename', ...adminWrite, uploadController.deleteImage);

// ==========================================
// PRODUCT ROUTES
// ==========================================
router.post('/products', ...adminWrite, productController.createProduct);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', ...adminWrite, productController.updateProduct);
router.delete('/products/:id', ...adminWrite, productController.deleteProduct);
router.patch('/products/:id/toggle-status', ...adminWrite, productController.toggleProductStatus);
router.get('/subcategories/:subCategoryId/attributes', productController.getSubCategoryAttributes);

// Legacy routes for backward compatibility
router.get('/product', productController.getProducts);
router.post('/product', ...adminWrite, productController.createProduct);
router.get('/product/:id', productController.getProductById);
router.put('/product/:id', ...adminWrite, productController.updateProduct);
router.delete('/product/:id', ...adminWrite, productController.deleteProduct);

// ==========================================
// PRODUCT VARIANT ROUTES
// ==========================================
router.post('/products/:productId/variants/generate', ...adminWrite, productVariantController.generateVariants);
router.get('/products/:productId/variants', productVariantController.getProductVariants);
router.get('/products/:productId/variants/config', productVariantController.getVariantConfig);
router.put('/variants/:variantId', ...adminWrite, productVariantController.updateVariant);
router.put('/products/:productId/variants/bulk-update', ...adminWrite, productVariantController.bulkUpdateVariants);
router.delete('/variants/:variantId', ...adminWrite, productVariantController.deleteVariant);
router.delete('/products/:productId/variants/bulk-delete', ...adminWrite, productVariantController.bulkDeleteVariants);
router.post('/variants/:variantId/images', ...adminWrite, productVariantController.addVariantImages);
router.delete('/variants/:variantId/images/:imageIndex', ...adminWrite, productVariantController.removeVariantImage);

// ==========================================
// INVENTORY ROUTES (Legacy)
// ==========================================
router.post('/inventory', ...adminWrite, catalogController.createInventory);
router.put('/inventory/:productId', ...adminWrite, catalogController.updateInventory);

module.exports = router;
