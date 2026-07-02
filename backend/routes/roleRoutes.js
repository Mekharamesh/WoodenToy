const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getRoles, createRole } = require('../controllers/roleController');

const adminOnly = [protect, authorize('admin')];

router.get('/', ...adminOnly, getRoles);
router.post('/', ...adminOnly, createRole);

module.exports = router;
