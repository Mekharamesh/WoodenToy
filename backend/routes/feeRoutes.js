const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const manageFees = [protect, authorize('admin', 'manager', 'staff')];

// Fee Categories
router.route('/categories')
  .get(feeController.getFeeCategories)
  .post(...manageFees, feeController.createFeeCategory);

router.route('/categories/:id')
  .delete(...manageFees, feeController.deleteFeeCategory);

// Payment Methods
router.route('/payment-methods')
  .get(feeController.getPaymentMethods)
  .post(...manageFees, feeController.createPaymentMethod);

// Fees
router.route('/')
  .get(feeController.getFees)
  .post(...manageFees, feeController.createFee);

router.route('/:feeId/weight-slabs')
  .post(...manageFees, feeController.createWeightSlab);

router.route('/:feeId/weight-slabs/reorder')
  .put(...manageFees, feeController.reorderWeightSlabs);

router.route('/:feeId/weight-slabs/:slabId')
  .put(...manageFees, feeController.updateWeightSlab)
  .delete(...manageFees, feeController.deleteWeightSlab);

router.route('/:id')
  .get(feeController.getFeeById)
  .put(...manageFees, feeController.updateFee)
  .delete(...manageFees, feeController.deleteFee);

module.exports = router;
