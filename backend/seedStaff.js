const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woodentoys';

const PERMISSION_MODULES = [
  'dashboard', 'staff_management', 'users', 'products', 'categories',
  'brands', 'orders', 'inventory', 'coupons', 'reviews', 'customers',
  'reports', 'settings'
];

const makePerms = (viewAll, createEdit = false, del = false) =>
  PERMISSION_MODULES.map(module => ({
    module,
    view: viewAll,
    create: createEdit,
    edit: createEdit,
    delete: del,
  }));

const STAFF_SAMPLES = [
  {
    fullName: 'Arjun Sharma',
    email: 'arjun.sharma@woodentoys.com',
    mobile: '9876543210',
    password: 'Password@123',
    role: 'Admin',
    status: 'active',
    permissions: makePerms(true, true, true),
  },
  {
    fullName: 'Priya Mehta',
    email: 'priya.mehta@woodentoys.com',
    mobile: '9123456780',
    password: 'Password@123',
    role: 'Manager',
    status: 'active',
    permissions: makePerms(true, true, false),
  },
  {
    fullName: 'Ravi Kumar',
    email: 'ravi.kumar@woodentoys.com',
    mobile: '9988776655',
    password: 'Password@123',
    role: 'Inventory Staff',
    status: 'active',
    permissions: [
      ...['dashboard', 'inventory', 'products'].map(m => ({ module: m, view: true, create: false, edit: true, delete: false })),
      ...PERMISSION_MODULES.filter(m => !['dashboard', 'inventory', 'products'].includes(m)).map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    ],
  },
  {
    fullName: 'Sneha Patel',
    email: 'sneha.patel@woodentoys.com',
    mobile: '9876001234',
    password: 'Password@123',
    role: 'Sales Staff',
    status: 'active',
    permissions: [
      ...['dashboard', 'orders', 'customers', 'products'].map(m => ({ module: m, view: true, create: true, edit: true, delete: false })),
      ...PERMISSION_MODULES.filter(m => !['dashboard', 'orders', 'customers', 'products'].includes(m)).map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    ],
  },
  {
    fullName: 'Vikram Singh',
    email: 'vikram.singh@woodentoys.com',
    mobile: '9001122334',
    password: 'Password@123',
    role: 'Customer Support',
    status: 'active',
    permissions: [
      ...['dashboard', 'customers', 'orders', 'reviews'].map(m => ({ module: m, view: true, create: false, edit: true, delete: false })),
      ...PERMISSION_MODULES.filter(m => !['dashboard', 'customers', 'orders', 'reviews'].includes(m)).map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    ],
  },
  {
    fullName: 'Anjali Nair',
    email: 'anjali.nair@woodentoys.com',
    mobile: '9445566778',
    password: 'Password@123',
    role: 'Manager',
    status: 'inactive',
    permissions: makePerms(true, true, false),
  },
  {
    fullName: 'Kiran Rao',
    email: 'kiran.rao@woodentoys.com',
    mobile: '9334455667',
    password: 'Password@123',
    role: 'Inventory Staff',
    status: 'active',
    permissions: [
      ...['dashboard', 'inventory', 'products', 'categories'].map(m => ({ module: m, view: true, create: true, edit: true, delete: false })),
      ...PERMISSION_MODULES.filter(m => !['dashboard', 'inventory', 'products', 'categories'].includes(m)).map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    ],
  },
  {
    fullName: 'Deepa Krishnan',
    email: 'deepa.krishnan@woodentoys.com',
    mobile: '9556677889',
    password: 'Password@123',
    role: 'Sales Staff',
    status: 'active',
    permissions: [
      ...['dashboard', 'orders', 'coupons', 'reports'].map(m => ({ module: m, view: true, create: true, edit: false, delete: false })),
      ...PERMISSION_MODULES.filter(m => !['dashboard', 'orders', 'coupons', 'reports'].includes(m)).map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    ],
  },
];

async function seedStaff() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Load the Staff model (without triggering auto-registration issues)
    const Staff = require('./models/Staff');

    let created = 0;
    let skipped = 0;

    for (const sample of STAFF_SAMPLES) {
      const existing = await Staff.findOne({ email: sample.email });
      if (existing) {
        console.log(`⏭️  Skipping (already exists): ${sample.email}`);
        skipped++;
        continue;
      }

      // Hash the password manually to avoid any pre-save hook issues
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(sample.password, salt);

      await Staff.collection.insertOne({
        ...sample,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Created: ${sample.fullName} (${sample.role})`);
      created++;
    }

    console.log(`\n📊 Seed Summary: ${created} created, ${skipped} skipped`);
    await mongoose.disconnect();
    console.log('✅ Done. MongoDB disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seedStaff();
