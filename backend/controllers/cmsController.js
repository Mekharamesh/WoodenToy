const CmsNavbar = require('../models/CmsNavbar');
const CmsHeroBanner = require('../models/CmsHeroBanner');
const CmsThirdBanner = require('../models/CmsThirdBanner');
const CmsProductGrid = require('../models/CmsProductGrid');
const CmsCategoryGrid = require('../models/CmsCategoryGrid');
const CmsFooter = require('../models/CmsFooter');
const ProductVariant = require('../models/ProductVariant');
const productService = require('../services/productService');

// Utility to wrap async functions
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- HOMEPAGE SECTIONS (position-based) ---
exports.getHomepageSections = asyncHandler(async (req, res) => {
  const [heroBanners, thirdBanners, productGrids, categoryGrids, footers] = await Promise.all([
    CmsHeroBanner.find({ status: true }),
    CmsThirdBanner.find({ status: true }),
    CmsProductGrid.find({ status: true }),
    CmsCategoryGrid.find({ status: true }).populate('category'),
    CmsFooter.find({ status: true }),
  ]);

  // Pick the first active footer (sorted by position)
  const footer = footers.sort((a, b) => (a.position || 0) - (b.position || 0))[0] || null;

  // Build a flat list of all sections with type + position
  const sections = [];

  const heroBannersWithPos = heroBanners.filter(b => b.position != null);
  if (heroBannersWithPos.length > 0) {
    const sortedHeroes = [...heroBanners].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    sections.push({ type: 'heroGroup', position: heroBannersWithPos[0].position, data: sortedHeroes });
  }
  thirdBanners.forEach(b => {
    if (b.position != null) sections.push({ type: 'thirdBanner', position: b.position, data: b });
  });
  productGrids.forEach(g => {
    if (g.position != null) sections.push({ type: 'productGrid', position: g.position, data: g });
  });
  categoryGrids.forEach(g => {
    if (g.position != null) sections.push({ type: 'categoryGrid', position: g.position, data: g });
  });
  if (footer && footer.position != null) {
    sections.push({ type: 'footer', position: footer.position, data: footer });
  }

  sections.sort((a, b) => a.position - b.position);

  res.json({ success: true, data: sections });
});

// --- NAVBAR ---
exports.getNavbars = asyncHandler(async (req, res) => {
  const navbars = await CmsNavbar.find().sort({ order: 1 });
  res.json({ success: true, data: navbars });
});

exports.createNavbar = asyncHandler(async (req, res) => {
  const navbar = await CmsNavbar.create(req.body);
  res.status(201).json({ success: true, data: navbar });
});

exports.updateNavbar = asyncHandler(async (req, res) => {
  const navbar = await CmsNavbar.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  res.json({ success: true, data: navbar });
});

exports.deleteNavbar = asyncHandler(async (req, res) => {
  await CmsNavbar.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Navbar deleted' });
});

// --- HERO BANNER ---
exports.getHeroBanners = asyncHandler(async (req, res) => {
  const banners = await CmsHeroBanner.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: banners });
});

exports.createHeroBanner = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const banner = await CmsHeroBanner.create(body);
  res.status(201).json({ success: true, data: banner });
});

exports.updateHeroBanner = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const banner = await CmsHeroBanner.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true }
  );
  res.json({ success: true, data: banner });
});

exports.deleteHeroBanner = asyncHandler(async (req, res) => {
  await CmsHeroBanner.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Banner deleted' });
});

// --- THIRD BANNER ---
exports.getThirdBanners = asyncHandler(async (req, res) => {
  const banners = await CmsThirdBanner.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: banners });
});

exports.createThirdBanner = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined) body.position = null;
  else body.position = Number(body.position);
  const banner = await CmsThirdBanner.create(body);
  res.status(201).json({ success: true, data: banner });
});

exports.updateThirdBanner = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const banner = await CmsThirdBanner.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true }
  );
  res.json({ success: true, data: banner });
});

exports.deleteThirdBanner = asyncHandler(async (req, res) => {
  await CmsThirdBanner.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Banner deleted' });
});

// --- PRODUCT GRID ---
exports.getProductGrids = asyncHandler(async (req, res) => {
  const ProductImage = require('../models/catalog/ProductImage');
  const grids = await CmsProductGrid.find().populate('products').sort({ sortOrder: 1 });

  // Enrich each product with images from ProductImage collection
  const enrichedGrids = await Promise.all(grids.map(async (grid) => {
    const gridObj = grid.toObject();
    gridObj.products = await Promise.all((gridObj.products || []).map(async (prod) => {
      if (!prod || !prod._id) return prod;

      // 1st: Try ProductImage collection (new system)
      let productImages = await ProductImage.find({ product: prod._id }).sort({ displayOrder: 1 });

      // 2nd: Try ProductVariant images (some products use variants)
      if (productImages.length === 0) {
        const variants = await ProductVariant.find({ product: prod._id }).limit(3);
        for (const v of variants) {
          if (v.images && v.images.length > 0) {
            productImages = v.images.map((url, idx) => ({ url, isThumbnail: idx === 0, displayOrder: idx + 1 }));
            break;
          }
        }
      }

      // 3rd: Fall back to old Product.images plain string array
      const fallbackImages = (prod.images || [])
        .filter(url => typeof url === 'string' && url.trim().length > 0)
        .map(url => ({ url, isThumbnail: false, displayOrder: 1 }));

      const variants = await ProductVariant.find({ product: prod._id }).limit(3);
      const pricing = productService.buildProductPricing(prod, variants, productImages.length > 0 ? productImages : fallbackImages);

      return {
        ...prod,
        ...pricing,
        images: productImages.length > 0 ? productImages : fallbackImages,
      };
    }));
    return gridObj;
  }));

  res.json({ success: true, data: enrichedGrids });
});

exports.createProductGrid = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined) body.position = null;
  else body.position = Number(body.position);
  const grid = await CmsProductGrid.create(body);
  res.status(201).json({ success: true, data: grid });
});

exports.updateProductGrid = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const grid = await CmsProductGrid.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true }
  ).populate('products');
  res.json({ success: true, data: grid });
});

exports.deleteProductGrid = async (req, res) => {
  try {
    const grid = await CmsProductGrid.findByIdAndDelete(req.params.id);
    if (!grid) return res.status(404).json({ success: false, message: 'Grid not found' });
    res.json({ success: true, message: 'Product Grid deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Map URL Resolver
exports.resolveMapUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    if (url.includes('maps.app.goo.gl')) {
      const https = require('https');
      const resolvedUrl = await new Promise((resolve, reject) => {
        https.get(url, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            resolve(response.headers.location);
          } else {
            resolve(url);
          }
        }).on('error', reject);
      });

      const match = resolvedUrl.match(/\/place\/([^\/]+)/);
      if (match) {
        const q = match[1];
        return res.json({ success: true, embedUrl: `https://maps.google.com/maps?q=${q}&t=&z=13&ie=UTF8&iwloc=&output=embed` });
      }
    }
    
    const match = url.match(/\/place\/([^\/]+)/);
    if (match) {
      const q = match[1];
      return res.json({ success: true, embedUrl: `https://maps.google.com/maps?q=${q}&t=&z=13&ie=UTF8&iwloc=&output=embed` });
    }

    res.json({ success: false, message: 'Could not resolve to an embeddable format' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CATEGORY GRID ---
exports.getCategoryGrids = asyncHandler(async (req, res) => {
  const ProductImage = require('../models/catalog/ProductImage');
  const grids = await CmsCategoryGrid.find().populate('category').populate('products').sort({ sortOrder: 1 });

  const enrichedGrids = await Promise.all(grids.map(async (grid) => {
    const gridObj = grid.toObject();
    gridObj.products = await Promise.all((gridObj.products || []).map(async (prod) => {
      if (!prod || !prod._id) return prod;

      let productImages = await ProductImage.find({ product: prod._id }).sort({ displayOrder: 1 });

      if (productImages.length === 0) {
        const variants = await ProductVariant.find({ product: prod._id }).limit(3);
        for (const v of variants) {
          if (v.images && v.images.length > 0) {
            productImages = v.images.map((url, idx) => ({ url, isThumbnail: idx === 0, displayOrder: idx + 1 }));
            break;
          }
        }
      }

      const fallbackImages = (prod.images || [])
        .filter(url => typeof url === 'string' && url.trim().length > 0)
        .map(url => ({ url, isThumbnail: false, displayOrder: 1 }));

      const variants = await ProductVariant.find({ product: prod._id }).limit(3);
      const pricing = productService.buildProductPricing(prod, variants, productImages.length > 0 ? productImages : fallbackImages);

      return {
        ...prod,
        ...pricing,
        images: productImages.length > 0 ? productImages : fallbackImages,
      };
    }));
    return gridObj;
  }));

  res.json({ success: true, data: enrichedGrids });
});

exports.createCategoryGrid = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined) body.position = null;
  else body.position = Number(body.position);
  const grid = await CmsCategoryGrid.create(body);
  res.status(201).json({ success: true, data: grid });
});

exports.updateCategoryGrid = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const grid = await CmsCategoryGrid.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true }
  ).populate('category').populate('products');
  res.json({ success: true, data: grid });
});

exports.deleteCategoryGrid = asyncHandler(async (req, res) => {
  await CmsCategoryGrid.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category grid deleted' });
});

// --- FOOTER (List-Based) ---
exports.getFooters = asyncHandler(async (req, res) => {
  const footers = await CmsFooter.find().sort({ createdAt: -1 });
  res.json({ success: true, data: footers });
});

exports.createFooter = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined) body.position = null;
  else body.position = Number(body.position);
  const footer = await CmsFooter.create(body);
  res.status(201).json({ success: true, data: footer });
});

exports.updateFooter = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.position === '' || body.position === undefined || body.position === null) body.position = null;
  else body.position = Number(body.position);
  const footer = await CmsFooter.findByIdAndUpdate(
    req.params.id,
    { $set: body },
    { new: true }
  );
  if (!footer) return res.status(404).json({ success: false, message: 'Footer not found' });
  res.json({ success: true, data: footer });
});

exports.deleteFooter = asyncHandler(async (req, res) => {
  await CmsFooter.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Footer deleted' });
});

// Legacy: return the first active footer (for public use in Footer.jsx)
exports.getFooter = asyncHandler(async (req, res) => {
  const footer = await CmsFooter.findOne({ status: true }).sort({ position: 1 });
  res.json({ success: true, data: footer || {} });
});
