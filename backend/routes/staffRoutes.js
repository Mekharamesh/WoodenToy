const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  updatePermissions,
  getPermissionModules,
} = require('../controllers/staffController');

const adminOnly = [protect, authorize('admin')];

router.get('/modules', ...adminOnly, getPermissionModules);
router.get('/', ...adminOnly, getAllStaff);
router.get('/:id', ...adminOnly, getStaffById);
router.post('/', ...adminOnly, createStaff);
router.put('/:id', ...adminOnly, updateStaff);
router.delete('/:id', ...adminOnly, deleteStaff);
router.put('/:id/permissions', ...adminOnly, updatePermissions);

module.exports = router;
