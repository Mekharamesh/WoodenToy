const mongoose = require('mongoose');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');
require('dotenv').config();

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/woodentoys';
    await mongoose.connect(uri);

    console.log('--- COUPONS ---');
    const coupons = await Coupon.find({ couponCode: { $in: ['WELCOME12', 'WELCOM12'] } }).lean();
    coupons.forEach((c) => {
      console.log({
        code: c.couponCode,
        deleted: c.deleted,
        visible: c.visible,
        offerType: c.offerType,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        startDate: c.startDate,
        endDate: c.endDate,
      });
    });

    console.log('--- ORDERS ---');
    const orders = await Order.find({ couponCode: { $in: ['WELCOME12', 'WELCOM12'] } }).lean();
    console.log('order count', orders.length);
    orders.forEach((o) => {
      console.log({
        id: o._id.toString(),
        couponCode: o.couponCode,
        isPaid: o.isPaid,
        status: o.status,
        totalPrice: o.totalPrice,
        discountAmount: o.discountAmount,
      });
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
