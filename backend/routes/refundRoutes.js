const express = require('express');
const router = express.Router();
const { getRefunds, seedRefunds } = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin'), getRefunds);

router.route('/seed')
  .post(protect, authorize('admin'), seedRefunds);

module.exports = router;
