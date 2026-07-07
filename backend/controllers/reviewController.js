const Review = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

/* ── multer for review media ──────────────────────── */
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename:    (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `review-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/quicktime'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

/* ── helpers ──────────────────────────────────────── */
const buildStatsForProduct = async (productId) => {
  const reviews = await Review.find({ product: productId, status: 'approved' });
  const total   = reviews.length;
  const avg     = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;
  const dist    = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   total ? Math.round((reviews.filter(r => r.rating === star).length / total) * 100) : 0,
  }));
  const photoReviews    = reviews.filter(r => r.images?.length > 0).length;
  const verifiedBuyers  = reviews.filter(r => r.isVerifiedPurchase).length;
  return { total, avg: Math.round(avg * 10) / 10, dist, photoReviews, verifiedBuyers };
};

/* ── Get reviews for a product ──────────────────── */
// GET /api/reviews/:productId
const getReviews = async (req, res) => {
  try {
    const { sort = 'newest', limit = 10, page = 1 } = req.query;
    const sortMap = {
      newest:         { createdAt: -1 },
      oldest:         { createdAt:  1 },
      highest_rating: { rating: -1 },
      lowest_rating:  { rating:  1 },
      most_helpful:   { 'helpfulVotes.length': -1 },
    };

    const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
      .populate('user', 'name profileImage')
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // attach helpful/not-helpful counts
    const enriched = reviews.map(r => ({
      ...r,
      helpfulCount:    r.helpfulVotes?.filter(v => v.vote === 'helpful').length || 0,
      notHelpfulCount: r.helpfulVotes?.filter(v => v.vote === 'not_helpful').length || 0,
      myVote: req.user ? (r.helpfulVotes?.find(v => String(v.user) === String(req.user._id))?.vote || null) : null,
    }));

    const stats = await buildStatsForProduct(req.params.productId);
    res.json({ reviews: enriched, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Get all images from reviews of a product ──── */
// GET /api/reviews/:productId/gallery
const getGallery = async (req, res) => {
  try {
    const reviews = await Review.find(
      { product: req.params.productId, status: 'approved', images: { $exists: true, $not: { $size: 0 } } },
      { images: 1, user: 1 }
    ).populate('user', 'name').lean();
    const gallery = reviews.flatMap(r => r.images.map(img => ({ url: img, userName: r.user?.name })));
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Create a review ─────────────────────────── */
// POST /api/reviews/:productId  (multipart/form-data)
const createReview = [
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      const { rating, title, description } = req.body;
      const productId = req.params.productId;

      // Check duplicate
      const existing = await Review.findOne({ product: productId, user: req.user._id });
      if (existing) return res.status(400).json({ message: 'You have already reviewed this product.' });

      const baseUrl   = `${req.protocol}://${req.get('host')}`;
      const imageUrls = (req.files?.images || []).map(f => `${baseUrl}/uploads/${f.filename}`);
      const videoUrls = (req.files?.videos || []).map(f => `${baseUrl}/uploads/${f.filename}`);

      // Check verified purchase
      const hasBought = await Order.findOne({
        user: req.user._id,
        'orderItems.product': productId,
        status: 'Delivered',
      });

      const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating: Number(rating),
        title: title || '',
        description: description || '',
        images: imageUrls,
        videos: videoUrls,
        isVerifiedPurchase: !!hasBought,
      });

      const populated = await review.populate('user', 'name profileImage');
      res.status(201).json(populated);
    } catch (err) {
      if (err.code === 11000) return res.status(400).json({ message: 'You have already reviewed this product.' });
      res.status(500).json({ message: err.message });
    }
  },
];

/* ── Vote helpful / not helpful ──────────────── */
// PUT /api/reviews/:reviewId/vote
const voteReview = async (req, res) => {
  try {
    const { vote } = req.body; // 'helpful' | 'not_helpful'
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Remove existing vote from this user
    review.helpfulVotes = review.helpfulVotes.filter(v => String(v.user) !== String(req.user._id));

    // Add new vote (toggle: if same vote, just remove)
    if (vote) {
      review.helpfulVotes.push({ user: req.user._id, vote });
    }
    await review.save();

    res.json({
      helpfulCount:    review.helpfulVotes.filter(v => v.vote === 'helpful').length,
      notHelpfulCount: review.helpfulVotes.filter(v => v.vote === 'not_helpful').length,
      myVote: vote || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Admin reply to review ───────────────────── */
// PUT /api/reviews/:reviewId/reply  (admin only)
const replyToReview = async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { adminReply: { text, repliedAt: new Date() } },
      { new: true }
    ).populate('user', 'name profileImage');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Delete review (admin or owner) ─────────── */
// DELETE /api/reviews/:reviewId
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    const isOwner = String(review.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Get review stats only ───────────────────── */
// GET /api/reviews/:productId/stats
const getStats = async (req, res) => {
  try {
    const stats = await buildStatsForProduct(req.params.productId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReviews, getGallery, createReview, voteReview, replyToReview, deleteReview, getStats };
