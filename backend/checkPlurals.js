const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const a = await Attribute.find({ name: { $in: ['Colors', 'Ages Group', 'Wood Types'] } });
    console.log(a.map(x => x.name + ': isVariant=' + x.isVariant));
    process.exit(0);
});
