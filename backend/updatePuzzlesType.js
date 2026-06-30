const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const res = await Attribute.updateOne({ name: 'Puzzles Type' }, { $set: { isVariant: true } });
    console.log('Updated:', res);
    process.exit(0);
});
