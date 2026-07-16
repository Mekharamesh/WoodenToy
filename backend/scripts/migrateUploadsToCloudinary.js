const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Product = require('../models/Product');
const ProductImage = require('../models/catalog/ProductImage');
const ProductVariant = require('../models/ProductVariant');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Review = require('../models/Review');
const CmsHeroBanner = require('../models/CmsHeroBanner');
const CmsThirdBanner = require('../models/CmsThirdBanner');
const CmsCategoryGrid = require('../models/CmsCategoryGrid');
const CmsFooter = require('../models/CmsFooter');
const CmsNavbar = require('../models/CmsNavbar');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryStorage');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const uploadedCache = new Map();
const stats = {
  uploaded: 0,
  reused: 0,
  updatedDocs: 0,
  skippedExternal: 0,
  skippedMissing: 0,
};

const isCloudinaryUrl = (value) => typeof value === 'string' && value.includes('res.cloudinary.com');

const getUploadFilename = (value) => {
  if (!value || typeof value !== 'string' || isCloudinaryUrl(value)) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const marker = '/uploads/';
      const markerIndex = url.pathname.indexOf(marker);
      return markerIndex >= 0 ? decodeURIComponent(url.pathname.slice(markerIndex + marker.length)) : null;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('/uploads/')) return trimmed.slice('/uploads/'.length);
  if (trimmed.startsWith('uploads/')) return trimmed.slice('uploads/'.length);
  return null;
};

const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jfif': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };
  return map[ext] || 'application/octet-stream';
};

const migrateUrl = async (value, folder) => {
  const filename = getUploadFilename(value);
  if (!filename) {
    if (value && !isCloudinaryUrl(value)) stats.skippedExternal += 1;
    return value;
  }

  if (uploadedCache.has(filename)) {
    stats.reused += 1;
    return uploadedCache.get(filename);
  }

  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing local file for ${value}: ${filePath}`);
    stats.skippedMissing += 1;
    return value;
  }

  const buffer = fs.readFileSync(filePath);
  const asset = await uploadBufferToCloudinary(
    {
      buffer,
      mimetype: getMimeType(filename),
      originalname: filename,
    },
    { folder }
  );

  uploadedCache.set(filename, asset.secure_url);
  stats.uploaded += 1;
  console.log(`Uploaded ${filename} -> ${asset.secure_url}`);
  return asset.secure_url;
};

const migrateStringArray = async (values, folder) => {
  if (!Array.isArray(values)) return { next: values, changed: false };
  let changed = false;
  const next = [];
  for (const value of values) {
    const migrated = await migrateUrl(value, folder);
    if (migrated !== value) changed = true;
    next.push(migrated);
  }
  return { next, changed };
};

const migrateDocFields = async (Model, fields, folder) => {
  const docs = await Model.find({});
  for (const doc of docs) {
    let changed = false;
    for (const field of fields) {
      const before = doc.get(field);
      const after = await migrateUrl(before, folder);
      if (after !== before) {
        doc.set(field, after);
        changed = true;
      }
    }
    if (changed) {
      await doc.save();
      stats.updatedDocs += 1;
      console.log(`Updated ${Model.modelName} ${doc._id}`);
    }
  }
};

const migrateDocArrays = async (Model, fields, folder) => {
  const docs = await Model.find({});
  for (const doc of docs) {
    let changed = false;
    for (const field of fields) {
      const { next, changed: fieldChanged } = await migrateStringArray(doc.get(field), folder);
      if (fieldChanged) {
        doc.set(field, next);
        changed = true;
      }
    }
    if (changed) {
      await doc.save();
      stats.updatedDocs += 1;
      console.log(`Updated ${Model.modelName} ${doc._id}`);
    }
  }
};

const migrateHeroBanners = async () => {
  const docs = await CmsHeroBanner.find({});
  for (const doc of docs) {
    let changed = false;
    for (const field of ['bannerImage', 'mobileBanner', 'desktopVideo', 'mobileVideo', 'ctaImage']) {
      const before = doc.get(field);
      const after = await migrateUrl(before, 'woodentoy/cms/hero');
      if (after !== before) {
        doc.set(field, after);
        changed = true;
      }
    }

    if (Array.isArray(doc.items)) {
      for (const item of doc.items) {
        for (const field of ['desktopUrl', 'mobileUrl']) {
          const before = item[field];
          const after = await migrateUrl(before, 'woodentoy/cms/hero');
          if (after !== before) {
            item[field] = after;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      await doc.save();
      stats.updatedDocs += 1;
      console.log(`Updated CmsHeroBanner ${doc._id}`);
    }
  }
};

const migrateCategoryGrids = async () => {
  const docs = await CmsCategoryGrid.find({});
  for (const doc of docs) {
    let changed = false;
    if (Array.isArray(doc.images)) {
      for (const image of doc.images) {
        const before = image.url;
        const after = await migrateUrl(before, 'woodentoy/cms/category-grid');
        if (after !== before) {
          image.url = after;
          changed = true;
        }
      }
    }
    if (changed) {
      await doc.save();
      stats.updatedDocs += 1;
      console.log(`Updated CmsCategoryGrid ${doc._id}`);
    }
  }
};

const run = async () => {
  const mongoUri = process.env.MIGRATION_MONGO_URI || process.env.MONGO_URI || process.env.ATLAS_MONGO_URI || process.env.LOCAL_MONGO_URI;
  if (!mongoUri) throw new Error('No MongoDB URI configured.');

  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

  await migrateDocArrays(Product, ['images'], 'woodentoy/products');
  await migrateDocFields(ProductImage, ['url'], 'woodentoy/products');
  await migrateDocArrays(ProductVariant, ['images'], 'woodentoy/products/variants');
  await migrateDocFields(Category, ['image', 'banner', 'icon'], 'woodentoy/categories');
  await migrateDocFields(SubCategory, ['image', 'banner'], 'woodentoy/subcategories');
  await migrateDocArrays(Review, ['images', 'videos'], 'woodentoy/reviews');
  await migrateHeroBanners();
  await migrateDocArrays(CmsThirdBanner, ['leftImages', 'rightImages'], 'woodentoy/cms/third-banner');
  await migrateCategoryGrids();
  await migrateDocFields(CmsFooter, ['logo'], 'woodentoy/cms/footer');
  await migrateDocFields(CmsNavbar, ['icon'], 'woodentoy/cms/navbar');

  console.log('Migration complete:', stats);
};

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
