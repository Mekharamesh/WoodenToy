const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Category = require('./models/Category');
    const SubCategory = require('./models/SubCategory');
    const Attribute = require('./models/Attribute');
    const AttributeValue = require('./models/AttributeValue');
    
    const cat = await Category.findOne({ name: /Pull Along Toys/i });
    const subCat = await SubCategory.findOne({ name: /Animal Pull Toys/i });
    
    if(!cat || !subCat) {
        console.log('Category or subcategory not found!');
        process.exit(1);
    }
    
    await Attribute.updateOne({ name: 'Age Group' }, { $set: { category: cat._id, subCategory: subCat._id, isVariant: false, code: 'AGE_GRP' } });
    await Attribute.updateOne({ name: 'Color' }, { $set: { category: cat._id, subCategory: subCat._id, isVariant: true, type: 'ColorPicker', code: 'COLOR' } });
    await Attribute.updateOne({ name: 'Wood Type' }, { $set: { category: cat._id, subCategory: subCat._id, isVariant: true, type: 'Checkbox', code: 'WOOD_TYP' } });
    
    const colorAttr = await Attribute.findOne({ name: 'Color' });
    const woodAttr = await Attribute.findOne({ name: 'Wood Type' });
    
    // Seed some colors if empty
    if (colorAttr) {
        const colorVals = await AttributeValue.countDocuments({ attribute: colorAttr._id });
        if (colorVals === 0) {
            await AttributeValue.insertMany([
                { attribute: colorAttr._id, value: 'Red', colorCode: '#FF0000', displayOrder: 1 },
                { attribute: colorAttr._id, value: 'Blue', colorCode: '#0000FF', displayOrder: 2 },
                { attribute: colorAttr._id, value: 'Green', colorCode: '#00FF00', displayOrder: 3 },
                { attribute: colorAttr._id, value: 'Natural', colorCode: '#DEB887', displayOrder: 4 }
            ]);
        }
    }
    
    // Seed some woods if empty
    if (woodAttr) {
        const woodVals = await AttributeValue.countDocuments({ attribute: woodAttr._id });
        if (woodVals === 0) {
            await AttributeValue.insertMany([
                { attribute: woodAttr._id, value: 'Teak', displayOrder: 1 },
                { attribute: woodAttr._id, value: 'Oak', displayOrder: 2 },
                { attribute: woodAttr._id, value: 'Pine', displayOrder: 3 },
                { attribute: woodAttr._id, value: 'Neem', displayOrder: 4 }
            ]);
        }
    }
    
    console.log('Attributes updated successfully!');
    process.exit(0);
});
