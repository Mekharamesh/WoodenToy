/**
 * Sample Data Seeding Script
 * Run this to populate the database with example categories, attributes, and values
 * Usage: node seed-data.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
const Attribute = require('./models/Attribute');
const AttributeValue = require('./models/AttributeValue');

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wooden-toys');
        console.log('Connected to MongoDB');

        // Clear existing data (optional)
        // await Category.deleteMany({});
        // await SubCategory.deleteMany({});
        // await Attribute.deleteMany({});
        // await AttributeValue.deleteMany({});

        // ==========================================
        // CREATE CATEGORIES
        // ==========================================
        console.log('Creating categories...');
        const categories = await Category.insertMany([
            {
                name: 'Puzzles',
                slug: 'puzzles',
                description: 'Wooden puzzles for learning and development',
                displayOrder: 1,
                isActive: true,
            },
            {
                name: 'Building Blocks',
                slug: 'building-blocks',
                description: 'Colorful building blocks for creativity',
                displayOrder: 2,
                isActive: true,
            },
            {
                name: 'Ride On Toys',
                slug: 'ride-on-toys',
                description: 'Wooden ride-on toys for outdoor play',
                displayOrder: 3,
                isActive: true,
            },
            {
                name: 'Musical Toys',
                slug: 'musical-toys',
                description: 'Toys that make music and sounds',
                displayOrder: 4,
                isActive: true,
            },
            {
                name: 'Pretend Play',
                slug: 'pretend-play',
                description: 'Imaginative play toys',
                displayOrder: 5,
                isActive: true,
            },
            {
                name: 'Montessori Toys',
                slug: 'montessori-toys',
                description: 'Educational Montessori learning toys',
                displayOrder: 6,
                isActive: true,
            },
            {
                name: 'Stacking Toys',
                slug: 'stacking-toys',
                description: 'Toys for learning stacking and balance',
                displayOrder: 7,
                isActive: true,
            },
            {
                name: 'Shape Sorters',
                slug: 'shape-sorters',
                description: 'Shape sorting toys for cognitive development',
                displayOrder: 8,
                isActive: true,
            },
        ]);
        console.log(`✓ Created ${categories.length} categories`);

        // ==========================================
        // CREATE ATTRIBUTES
        // ==========================================
        console.log('Creating attributes...');
        const attributes = await Attribute.insertMany([
            {
                name: 'Age Group',
                slug: 'age-group',
                type: 'Dropdown',
                description: 'Recommended age range for the product',
                displayOrder: 1,
                isActive: true,
            },
            {
                name: 'Wood Type',
                slug: 'wood-type',
                type: 'Dropdown',
                description: 'Type of wood used',
                displayOrder: 2,
                isActive: true,
            },
            {
                name: 'Color',
                slug: 'color',
                type: 'MultiSelect',
                description: 'Available colors',
                displayOrder: 3,
                isActive: true,
            },
            {
                name: 'Weight',
                slug: 'weight',
                type: 'Dropdown',
                description: 'Product weight',
                displayOrder: 4,
                isActive: true,
            },
            {
                name: 'Theme',
                slug: 'theme',
                type: 'Dropdown',
                description: 'Theme of the toy',
                displayOrder: 5,
                isActive: true,
            },
            {
                name: 'Skill Development',
                slug: 'skill-development',
                type: 'MultiSelect',
                description: 'Skills developed by this toy',
                displayOrder: 6,
                isActive: true,
            },
            {
                name: 'Toy Type',
                slug: 'toy-type',
                type: 'Dropdown',
                description: 'Type of toy',
                displayOrder: 7,
                isActive: true,
            },
            {
                name: 'Pieces Count',
                slug: 'pieces-count',
                type: 'Number',
                description: 'Number of pieces in the toy',
                displayOrder: 8,
                isActive: true,
            },
            {
                name: 'Material',
                slug: 'material',
                type: 'Dropdown',
                description: 'Primary material',
                displayOrder: 9,
                isActive: true,
            },
            {
                name: 'Dimensions',
                slug: 'dimensions',
                type: 'Text',
                description: 'Product dimensions (L x W x H)',
                displayOrder: 10,
                isActive: true,
            },
            {
                name: 'Safety Certification',
                slug: 'safety-certification',
                type: 'Dropdown',
                description: 'Safety certifications',
                displayOrder: 11,
                isActive: true,
            },
            {
                name: 'Storage Box',
                slug: 'storage-box',
                type: 'Checkbox',
                description: 'Comes with storage box',
                displayOrder: 12,
                isActive: true,
            },
            {
                name: 'Assembly Required',
                slug: 'assembly-required',
                type: 'Checkbox',
                description: 'Assembly is required',
                displayOrder: 13,
                isActive: true,
            },
            {
                name: 'Indoor/Outdoor',
                slug: 'indoor-outdoor',
                type: 'RadioButton',
                description: 'Usage location',
                displayOrder: 14,
                isActive: true,
            },
        ]);
        console.log(`✓ Created ${attributes.length} attributes`);

        // ==========================================
        // CREATE ATTRIBUTE VALUES
        // ==========================================
        console.log('Creating attribute values...');

        const ageGroupValues = await AttributeValue.insertMany([
            { attribute: attributes[0]._id, value: '2-4 Years', slug: '2-4-years', displayOrder: 1 },
            { attribute: attributes[0]._id, value: '4-6 Years', slug: '4-6-years', displayOrder: 2 },
            { attribute: attributes[0]._id, value: '6-8 Years', slug: '6-8-years', displayOrder: 3 },
            { attribute: attributes[0]._id, value: '8-10 Years', slug: '8-10-years', displayOrder: 4 },
            { attribute: attributes[0]._id, value: '10+ Years', slug: '10-plus-years', displayOrder: 5 },
        ]);

        const woodTypeValues = await AttributeValue.insertMany([
            { attribute: attributes[1]._id, value: 'Beech Wood', slug: 'beech-wood', displayOrder: 1 },
            { attribute: attributes[1]._id, value: 'Pine Wood', slug: 'pine-wood', displayOrder: 2 },
            { attribute: attributes[1]._id, value: 'Rubber Wood', slug: 'rubber-wood', displayOrder: 3 },
            { attribute: attributes[1]._id, value: 'Neem Wood', slug: 'neem-wood', displayOrder: 4 },
            { attribute: attributes[1]._id, value: 'MDF', slug: 'mdf', displayOrder: 5 },
        ]);

        const colorValues = await AttributeValue.insertMany([
            { attribute: attributes[2]._id, value: 'Natural', slug: 'natural', colorCode: '#D2B48C', displayOrder: 1 },
            { attribute: attributes[2]._id, value: 'Red', slug: 'red', colorCode: '#FF0000', displayOrder: 2 },
            { attribute: attributes[2]._id, value: 'Blue', slug: 'blue', colorCode: '#0000FF', displayOrder: 3 },
            { attribute: attributes[2]._id, value: 'Yellow', slug: 'yellow', colorCode: '#FFFF00', displayOrder: 4 },
            { attribute: attributes[2]._id, value: 'Green', slug: 'green', colorCode: '#008000', displayOrder: 5 },
        ]);

        const weightValues = await AttributeValue.insertMany([
            { attribute: attributes[3]._id, value: '200g', slug: '200g', displayOrder: 1 },
            { attribute: attributes[3]._id, value: '500g', slug: '500g', displayOrder: 2 },
            { attribute: attributes[3]._id, value: '1kg', slug: '1kg', displayOrder: 3 },
            { attribute: attributes[3]._id, value: '2kg', slug: '2kg', displayOrder: 4 },
            { attribute: attributes[3]._id, value: '5kg', slug: '5kg', displayOrder: 5 },
        ]);

        const themeValues = await AttributeValue.insertMany([
            { attribute: attributes[4]._id, value: 'Animals', slug: 'animals', displayOrder: 1 },
            { attribute: attributes[4]._id, value: 'Numbers', slug: 'numbers', displayOrder: 2 },
            { attribute: attributes[4]._id, value: 'Alphabet', slug: 'alphabet', displayOrder: 3 },
            { attribute: attributes[4]._id, value: 'Space', slug: 'space', displayOrder: 4 },
            { attribute: attributes[4]._id, value: 'Vehicles', slug: 'vehicles', displayOrder: 5 },
            { attribute: attributes[4]._id, value: 'Farm', slug: 'farm', displayOrder: 6 },
            { attribute: attributes[4]._id, value: 'Ocean', slug: 'ocean', displayOrder: 7 },
        ]);

        const skillValues = await AttributeValue.insertMany([
            { attribute: attributes[5]._id, value: 'Motor Skills', slug: 'motor-skills', displayOrder: 1 },
            { attribute: attributes[5]._id, value: 'Cognitive Skills', slug: 'cognitive-skills', displayOrder: 2 },
            { attribute: attributes[5]._id, value: 'Problem Solving', slug: 'problem-solving', displayOrder: 3 },
            { attribute: attributes[5]._id, value: 'Creativity', slug: 'creativity', displayOrder: 4 },
            { attribute: attributes[5]._id, value: 'Social Skills', slug: 'social-skills', displayOrder: 5 },
        ]);

        const toyTypeValues = await AttributeValue.insertMany([
            { attribute: attributes[6]._id, value: 'Educational', slug: 'educational', displayOrder: 1 },
            { attribute: attributes[6]._id, value: 'Outdoor', slug: 'outdoor', displayOrder: 2 },
            { attribute: attributes[6]._id, value: 'Indoor', slug: 'indoor', displayOrder: 3 },
            { attribute: attributes[6]._id, value: 'Musical', slug: 'musical', displayOrder: 4 },
            { attribute: attributes[6]._id, value: 'Building', slug: 'building', displayOrder: 5 },
        ]);

        const materialValues = await AttributeValue.insertMany([
            { attribute: attributes[8]._id, value: 'Wood', slug: 'wood', displayOrder: 1 },
            { attribute: attributes[8]._id, value: 'Plastic', slug: 'plastic', displayOrder: 2 },
            { attribute: attributes[8]._id, value: 'Metal', slug: 'metal', displayOrder: 3 },
            { attribute: attributes[8]._id, value: 'Fabric', slug: 'fabric', displayOrder: 4 },
            { attribute: attributes[8]._id, value: 'Composite', slug: 'composite', displayOrder: 5 },
        ]);

        const certificationValues = await AttributeValue.insertMany([
            { attribute: attributes[10]._id, value: 'ISO 9001', slug: 'iso-9001', displayOrder: 1 },
            { attribute: attributes[10]._id, value: 'CE Certified', slug: 'ce-certified', displayOrder: 2 },
            { attribute: attributes[10]._id, value: 'BIS Certified', slug: 'bis-certified', displayOrder: 3 },
            { attribute: attributes[10]._id, value: 'CPSIA', slug: 'cpsia', displayOrder: 4 },
            { attribute: attributes[10]._id, value: 'EN 71', slug: 'en-71', displayOrder: 5 },
        ]);

        const indoorOutdoorValues = await AttributeValue.insertMany([
            { attribute: attributes[13]._id, value: 'Indoor', slug: 'indoor', displayOrder: 1 },
            { attribute: attributes[13]._id, value: 'Outdoor', slug: 'outdoor', displayOrder: 2 },
            { attribute: attributes[13]._id, value: 'Both', slug: 'both', displayOrder: 3 },
        ]);

        console.log(`✓ Created attribute values`);

        // ==========================================
        // CREATE SUB CATEGORIES
        // ==========================================
        console.log('Creating subcategories...');
        const subCategories = await SubCategory.insertMany([
            {
                name: 'Wooden Puzzles',
                slug: 'wooden-puzzles',
                category: categories[0]._id,
                description: 'High-quality wooden puzzles',
                attributes: [attributes[0]._id, attributes[1]._id, attributes[2]._id, attributes[4]._id],
                displayOrder: 1,
                isActive: true,
            },
            {
                name: 'Jigsaw Puzzles',
                slug: 'jigsaw-puzzles',
                category: categories[0]._id,
                description: 'Jigsaw puzzles with various difficulty levels',
                attributes: [attributes[0]._id, attributes[2]._id, attributes[6]._id],
                displayOrder: 2,
                isActive: true,
            },
            {
                name: 'LEGO Blocks',
                slug: 'lego-blocks',
                category: categories[1]._id,
                description: 'Classic LEGO building blocks',
                attributes: [attributes[0]._id, attributes[2]._id, attributes[5]._id],
                displayOrder: 1,
                isActive: true,
            },
            {
                name: 'Wooden Blocks',
                slug: 'wooden-blocks',
                category: categories[1]._id,
                description: 'Natural wooden building blocks',
                attributes: [attributes[0]._id, attributes[1]._id, attributes[2]._id],
                displayOrder: 2,
                isActive: true,
            },
        ]);
        console.log(`✓ Created ${subCategories.length} subcategories`);

        console.log('\\n✅ Database seeding completed successfully!');
        console.log(`\\nCreated:
  - ${categories.length} Categories
  - ${attributes.length} Attributes
  - Multiple Attribute Values
  - ${subCategories.length} Sub Categories
`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeding
seedDatabase();
