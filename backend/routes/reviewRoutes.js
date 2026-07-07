const express = require('express');
const router  = express.Router();
const {
  getReviews, getGallery, createReview,
  voteReview, replyToReview, deleteReview, getStats,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: read reviews + stats + gallery
router.get('/:productId',          getReviews);
router.get('/:productId/stats',    getStats);
router.get('/:productId/gallery',  getGallery);

// Protected: write review
router.post('/:productId', protect, createReview);

// Protected: vote helpful
router.put('/:reviewId/vote', protect, voteReview);

// Admin only: reply
router.put('/:reviewId/reply', protect, authorize('admin', 'manager'), replyToReview);

// Owner / Admin: delete
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
