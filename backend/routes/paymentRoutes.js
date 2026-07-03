/**
 * Payment Routes
 * ---------------
 * POST /api/payment/cashfree/create-session   â†’ Initiate Cashfree payment
 * POST /api/payment/cashfree/verify           â†’ Verify payment after redirect
 */

const express = require('express');
const router = express.Router();
const { diagnostics, createPaymentSession, verifyPayment } = require('../controllers/cashfreeController');
const { protect } = require('../middleware/authMiddleware');

// Diagnostics and payment routes
router.get('/cashfree/diagnostics', protect, diagnostics);
router.get('/cashfree/create-session', (req, res) => {
  res.status(405).json({
    message: 'Use POST /api/payment/cashfree/create-session to create a Cashfree payment session.',
    method: 'POST',
    requiresAuth: true,
  });
});
router.post('/cashfree/create-session', protect, createPaymentSession);
router.post('/cashfree/verify', verifyPayment);

module.exports = router;

