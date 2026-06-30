const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Category = require('./models/Category');
    const SubCategory = require('./models/SubCategory');
    const Attribute = require('./models/Attribute');
    const CategoryAttributeMapping = require('./models/catalog/CategoryAttributeMapping');
    
    const subCat = await SubCategory.findOne({ name: /Numers Learning toys/i });
    if(!subCat) {
        console.log('subcategory not found!');
        process.exit(1);
    }
    
    const attrs = await Attribute.find({ name: { $in: ['Age Group', 'Color', 'Wood Type'] } });
    
    for (const attr of attrs) {
        // Also ensure the Attribute document allows this category if needed, but in our schema 'category' and 'subCategory' on Attribute model are just for reference or initial creation. 
        // Let's just create the mapping.
        
        const existing = await CategoryAttributeMapping.findOne({ attribute: attr._id, subCategory: subCat._id });
        if (!existing) {
            await CategoryAttributeMapping.create({
                category: subCat.category,
                subCategory: subCat._id,
                attribute: attr._id,
                isRequired: false,
                displayOrder: attr.displayOrder || 1,
                isActive: true
            });
        }
    }
    
    console.log('Category Attribute Mappings for Numers updated successfully!');
    process.exit(0);
});
