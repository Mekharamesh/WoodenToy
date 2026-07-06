const express = require('express');
const router = express.Router();
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  seedRules,
} = require('../controllers/cancellationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin'), getRules)
  .post(protect, authorize('admin'), createRule);

router.route('/seed')
  .post(protect, authorize('admin'), seedRules);

router.route('/:id')
  .put(protect, authorize('admin'), updateRule)
  .delete(protect, authorize('admin'), deleteRule);

module.exports = router;
