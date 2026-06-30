const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const res = await Attribute.updateMany({ name: { $in: ['oak', 'colour', 'TOY MATERIAL'] } }, { $set: { isVariant: true } });
    console.log('Updated:', res);
    process.exit(0);
});
