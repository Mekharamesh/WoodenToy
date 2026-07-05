const express = require('express');
const router = express.Router();
const {
  getCart,
  replaceCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCart)
  .put(protect, replaceCart)
  .delete(protect, clearCart);

router.route('/items')
  .post(protect, addCartItem);

router.route('/items/:productId')
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

module.exports = router;
