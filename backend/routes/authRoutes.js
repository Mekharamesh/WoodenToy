const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, forgotPassword, getProfile, updateProfile, getCustomers, getCustomerOrders } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);

router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

// Example of an admin-only route
router.get('/admin', protect, authorize('admin'), (req, res) => {
    res.json({ message: 'Admin dashboard data accessible only by admins' });
});

// Example of a staff-only route (staff and admin can usually access staff areas)
router.get('/staff', protect, authorize('staff', 'admin'), (req, res) => {
    res.json({ message: 'Staff area data' });
});

// Admin: Customer Management
router.route('/customers').get(protect, authorize('admin', 'manager', 'staff'), getCustomers);
router.route('/customers/:id/orders').get(protect, authorize('admin', 'manager', 'staff'), getCustomerOrders);

module.exports = router;
