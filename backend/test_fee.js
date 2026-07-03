const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoy')
.then(async () => {
    const Fee = require('./models/Fee');
    const newFee = new Fee({
      feeName: 'Test Script',
      feeCategory: '60c72b2f9b1d8b0015a7a7a7',
      feeType: 'Fixed Amount',
      flatFeeValue: 500,
      applicationState: 'Kerala',
      weightSlabs: [],
      active: true
    });
    console.log("Before save:", newFee.toObject());
    const saved = await newFee.save();
    console.log("After save:", saved.toObject());
    process.exit(0);
});
