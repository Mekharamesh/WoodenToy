const mongoose = require('mongoose'); 
const Order = require('./models/Order'); 
const Fee = require('./models/Fee'); 
require('./models/FeeCategory');
require('./models/PaymentMethod');
const { calculateOrderFees } = require('./utils/feeCalculator');

mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => { 
  const configuredFees = await Fee.find({ active: true })
    .populate('feeCategory', 'name')
    .populate('paymentMethod', 'name')
    .lean();

  const orders = await Order.find();
  for (const order of orders) {
    const subtotal = order.itemsPrice;
    
    // Simulate what the backend should have calculated
    const feeSummary = calculateOrderFees({
      fees: configuredFees,
      subtotal,
      items: order.orderItems,
      state: order.shippingAddress?.state,
      paymentMethod: order.paymentMethod,
    });

    const extraChargeSum = feeSummary.extraFeesList.reduce((sum, fee) => sum + fee.amount, 0);
    const calculatedTotalPrice = subtotal + feeSummary.shippingCharge + extraChargeSum;
    const calculatedBalanceAmount = order.paymentMethod === 'COD' && feeSummary.codAdvance > 0
      ? calculatedTotalPrice - feeSummary.codAdvance
      : 0;

    await Order.updateOne(
      { _id: order._id },
      { 
        $set: { 
          shippingPrice: feeSummary.shippingCharge, 
          totalPrice: calculatedTotalPrice, 
          balanceAmount: calculatedBalanceAmount, 
          fees: feeSummary.appliedFees.length > 0 ? feeSummary.appliedFees : order.fees
        } 
      }
    );
    console.log(`Updated order ${order._id}`);
  }
  
  console.log('All pending orders updated!'); 
  mongoose.disconnect(); 
});
