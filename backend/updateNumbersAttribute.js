const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const res = await Attribute.updateOne({ name: 'Numbers' }, { $set: { isVariant: true } });
    console.log('Updated Numbers:', res);
    process.exit(0);
});
