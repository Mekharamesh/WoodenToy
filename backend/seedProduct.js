const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const imgDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\c5117319-8c7c-4cd6-807d-904621ce6c6e';
const uploadDir = 'd:\\WoodenToys\\backend\\uploads';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

fs.copyFileSync(path.join(imgDir, 'wooden_dog_pull_toy_1782832594541.png'), path.join(uploadDir, 'dog.png'));
fs.copyFileSync(path.join(imgDir, 'wooden_elephant_pull_toy_1782832629746.png'), path.join(uploadDir, 'elephant.png'));
fs.copyFileSync(path.join(imgDir, 'wooden_duck_pull_toy_1782832661091.png'), path.join(uploadDir, 'duck.png'));

mongoose.connect('mongodb://localhost:27017/woodentoys1').then(async () => {
    const Category = require('./models/Category');
    const SubCategory = require('./models/SubCategory');
    const Attribute = require('./models/Attribute');
    const AttributeValue = require('./models/AttributeValue');
    const Product = require('./models/Product');
    
    const cat = await Category.findOne({ name: /Pull Along Toys/i });
    const subCat = await SubCategory.findOne({ name: /Animal Pull Toys/i });
    
    // Create Attribute
    const attr = await Attribute.create({
        name: 'Animal Type',
        slug: 'animal-type',
        code: 'ANML_TYP',
        category: cat._id,
        subCategory: subCat._id,
        type: 'Checkbox',
        isVariant: true,
        createdBy: '6a40fc1c2a437cef8baf9d6c'
    });
    
    // Create Values
    const valDog = await AttributeValue.create({ attribute: attr._id, value: 'Dog', displayOrder: 1 });
    const valElephant = await AttributeValue.create({ attribute: attr._id, value: 'Elephant', displayOrder: 2 });
    const valDuck = await AttributeValue.create({ attribute: attr._id, value: 'Duck', displayOrder: 3 });
    
    // Create Product
    const product = await Product.create({
        name: 'Wooden Animal Pull Toy Collection',
        slug: 'wooden-animal-pull-toy-collection',
        description: 'A beautiful collection of minimalist wooden pull toys.',
        shortDescription: 'Wooden pull toys',
        category: cat._id,
        subCategory: subCat._id,
        price: 19.99,
        costPrice: 8.50,
        sku: 'WPT-ANML',
        barcode: '123456789',
        isActive: true,
        images: ['/uploads/dog.png', '/uploads/elephant.png', '/uploads/duck.png'],
        attributeValues: [
            { attribute: attr._id, values: ['Dog', 'Elephant', 'Duck'] }
        ],
        variants: [
            {
                variantCombination: 'Dog',
                sku: 'WPT-ANML-DOG',
                basePrice: 19.99,
                costPrice: 8.50,
                inventory: 50,
                weight: 0.5,
                isActive: true,
                isPrimary: true,
                images: ['/uploads/dog.png'],
                options: [{ attribute: attr._id, value: 'Dog' }]
            },
            {
                variantCombination: 'Elephant',
                sku: 'WPT-ANML-ELE',
                basePrice: 24.99,
                costPrice: 10.00,
                inventory: 30,
                weight: 0.7,
                isActive: true,
                isPrimary: false,
                images: ['/uploads/elephant.png'],
                options: [{ attribute: attr._id, value: 'Elephant' }]
            },
            {
                variantCombination: 'Duck',
                sku: 'WPT-ANML-DCK',
                basePrice: 18.99,
                costPrice: 7.50,
                inventory: 40,
                weight: 0.4,
                isActive: true,
                isPrimary: false,
                images: ['/uploads/duck.png'],
                options: [{ attribute: attr._id, value: 'Duck' }]
            }
        ]
    });
    
    console.log('Created product with variants successfully!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
