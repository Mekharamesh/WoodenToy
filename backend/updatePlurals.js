const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const res = await Attribute.updateMany(
        { name: { $in: ['Colors', 'Wood Types'] } },
        { $set: { isVariant: true } }
    );
    console.log('Updated Attributes:', res);
    process.exit(0);
});
