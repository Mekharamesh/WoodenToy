const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Attribute = require('./models/Attribute');
    const attrs = await Attribute.find({ name: { $in: ['Age Group', 'Color', 'Wood Type'] } }).populate('subCategory', 'name');
    console.log(attrs.map(x => x.name + ' -> ' + (x.subCategory ? x.subCategory.name : 'none')));
    process.exit(0);
});
