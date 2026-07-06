const mongoose = require('mongoose'); 
const Order = require('./models/Order'); 
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => { 
  await Order.updateOne({ _id: '6a4b592ee3d496a8d31bb3f1' }, { $set: { shippingPrice: 100, totalPrice: 730, balanceAmount: 530, fees: [{ name: 'Advance', amount: 200 }, { name: 'Platfrom Fee', amount: 100 }, { name: 'text', amount: 80 }, { name: 'Weight Charge', amount: 100, isWeightFee: true }] } }); 
  console.log('updated'); 
  mongoose.disconnect(); 
});
