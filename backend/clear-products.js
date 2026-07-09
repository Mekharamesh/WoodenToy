require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

    const Product = require('./models/Product');
    const ProductVariant = require('./models/ProductVariant');
    const ProductVariantOption = require('./models/ProductVariantOption');
    const ProductAttributeValue = require('./models/ProductAttributeValue');
    const Inventory = require('./models/Inventory');
    const ProductImage = require('./models/catalog/ProductImage');
    const CmsProductGrid = require('./models/CmsProductGrid');

    const products = await Product.find({ isDeleted: false }).select('_id');
    const productIds = products.map((p) => p._id);
    const variantIds = (await ProductVariant.find({ product: { $in: productIds } }).select('_id')).map((v) => v._id);

    await ProductAttributeValue.deleteMany({ product: { $in: productIds } });
    await ProductImage.deleteMany({ product: { $in: productIds } });
    await ProductVariantOption.deleteMany({ variant: { $in: variantIds } });
    await ProductVariant.deleteMany({ product: { $in: productIds } });
    await Inventory.deleteMany({ product: { $in: productIds } });
    await Product.deleteMany({ _id: { $in: productIds } });
    await CmsProductGrid.updateMany({}, { $set: { products: [] } });

    console.log('Deleted products:', productIds.length);
    console.log('Product collections cleared');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
