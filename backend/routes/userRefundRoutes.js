const express = require('express');
const router = express.Router();
const { getMyRefunds } = require('../controllers/refundController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyRefunds);

module.exports = router;
