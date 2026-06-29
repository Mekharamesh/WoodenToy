const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, forgotPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/forgotpassword', forgotPassword);

// Example of a protected route requiring authentication
router.get('/profile', protect, (req, res) => {
    res.json({ message: 'Profile data accessible by any logged-in user', user: req.user });
});

// Example of an admin-only route
router.get('/admin', protect, authorize('admin'), (req, res) => {
    res.json({ message: 'Admin dashboard data accessible only by admins' });
});

// Example of a staff-only route (staff and admin can usually access staff areas)
router.get('/staff', protect, authorize('staff', 'admin'), (req, res) => {
    res.json({ message: 'Staff area data' });
});

module.exports = router;
