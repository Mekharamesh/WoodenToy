const Attribute = require('./models/Attribute');
const AttributeValue = require('./models/AttributeValue');

const DEFAULT_ATTRIBUTES = [
  {
    name: 'Age Group',
    slug: 'age-group',
    type: 'MultiSelect',
    description: 'Suitable age range for this toy',
    displayOrder: 1,
    values: [
      { value: '0-2 Years', slug: '0-2-years' },
      { value: '2-4 Years', slug: '2-4-years' },
      { value: '4-6 Years', slug: '4-6-years' },
      { value: '6-8 Years', slug: '6-8-years' },
      { value: '8+ Years', slug: '8-plus-years' },
    ],
  },
  {
    name: 'Color',
    slug: 'color',
    type: 'ColorPicker',
    description: 'Available colors for this product',
    displayOrder: 2,
    values: [
      { value: 'Natural Wood', slug: 'natural-wood', colorCode: '#C8A882' },
      { value: 'Red', slug: 'red', colorCode: '#E53935' },
      { value: 'Blue', slug: 'blue', colorCode: '#1E88E5' },
      { value: 'Green', slug: 'green', colorCode: '#43A047' },
      { value: 'Yellow', slug: 'yellow', colorCode: '#FDD835' },
      { value: 'Orange', slug: 'orange', colorCode: '#FB8C00' },
      { value: 'Multi-color', slug: 'multi-color', colorCode: '#9C27B0' },
    ],
  },
  {
    name: 'Wood Type',
    slug: 'wood-type',
    type: 'Dropdown',
    description: 'Type of wood used in manufacturing',
    displayOrder: 3,
    values: [
      { value: 'Beech Wood', slug: 'beech-wood' },
      { value: 'Pine Wood', slug: 'pine-wood' },
      { value: 'Oak Wood', slug: 'oak-wood' },
      { value: 'Maple Wood', slug: 'maple-wood' },
      { value: 'Rubberwood', slug: 'rubberwood' },
      { value: 'Birch Wood', slug: 'birch-wood' },
      { value: 'Teak Wood', slug: 'teak-wood' },
    ],
  },
  {
    name: 'Toy Type',
    slug: 'toy-type',
    type: 'MultiSelect',
    description: 'Classification of toy',
    displayOrder: 4,
    values: [
      { value: 'Educational', slug: 'educational' },
      { value: 'Montessori', slug: 'montessori' },
      { value: 'Building & Stacking', slug: 'building-stacking' },
      { value: 'Pretend Play', slug: 'pretend-play' },
      { value: 'Sensory', slug: 'sensory' },
      { value: 'Outdoor', slug: 'outdoor' },
    ],
  },
  {
    name: 'Skill Development',
    slug: 'skill-development',
    type: 'MultiSelect',
    description: 'Skills developed through play',
    displayOrder: 5,
    values: [
      { value: 'Problem Solving', slug: 'problem-solving' },
      { value: 'Hand-Eye Coordination', slug: 'hand-eye-coordination' },
      { value: 'Fine Motor Skills', slug: 'fine-motor-skills' },
      { value: 'Spatial Awareness', slug: 'spatial-awareness' },
      { value: 'Creativity', slug: 'creativity' },
      { value: 'Language Skills', slug: 'language-skills' },
      { value: 'Social Skills', slug: 'social-skills' },
    ],
  },
  {
    name: 'Theme',
    slug: 'theme',
    type: 'MultiSelect',
    description: 'Toy theme or world',
    displayOrder: 6,
    values: [
      { value: 'Animals', slug: 'animals' },
      { value: 'Vehicles', slug: 'vehicles' },
      { value: 'Nature', slug: 'nature' },
      { value: 'Geometric Shapes', slug: 'geometric-shapes' },
      { value: 'Alphabet & Numbers', slug: 'alphabet-numbers' },
      { value: 'Fantasy', slug: 'fantasy' },
    ],
  },
];

const seedAttributes = async () => {
  try {
    const existingCount = await Attribute.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ Attributes already seeded (${existingCount} found). Skipping.`);
      return;
    }

    console.log('🌱 Seeding default wooden toy attributes...');

    for (const attrDef of DEFAULT_ATTRIBUTES) {
      const { values, ...attrData } = attrDef;
      const attribute = await Attribute.create({ ...attrData, isActive: true });

      for (let i = 0; i < values.length; i++) {
        await AttributeValue.create({
          attribute: attribute._id,
          value: values[i].value,
          slug: values[i].slug,
          colorCode: values[i].colorCode || undefined,
          displayOrder: i + 1,
          isActive: true,
        });
      }
      console.log(`  ✓ ${attribute.name} (${values.length} values)`);
    }

    console.log(`✅ Successfully seeded ${DEFAULT_ATTRIBUTES.length} attributes!`);
  } catch (error) {
    console.error('❌ Attribute seeding error:', error.message);
  }
};

module.exports = seedAttributes;
