const Product = require('../models/Product');
const ProductAttributeValue = require('../models/ProductAttributeValue');
const ProductVariant = require('../models/catalog/ProductVariant');
const ProductImage = require('../models/catalog/ProductImage');
const CategoryAttributeMapping = require('../models/catalog/CategoryAttributeMapping');
const auditService = require('./auditService');

const hasAttributeValue = (payload = {}) => {
    if (payload.value !== undefined && payload.value !== null && String(payload.value).trim() !== '') return true;
    if (Array.isArray(payload.values) && payload.values.length > 0) return true;
    if (payload.numericValue !== undefined && payload.numericValue !== null && payload.numericValue !== '') return true;
    if (payload.dateValue !== undefined && payload.dateValue !== null && payload.dateValue !== '') return true;
    if (payload.booleanValue !== undefined && payload.booleanValue !== null) return true;
    return false;
};

const normalizeAttributeValue = (av) => ({
    attributeId: av.attributeId || av.attribute,
    value: av.value,
    values: Array.isArray(av.values) ? av.values : [],
    numericValue: av.numericValue,
    dateValue: av.dateValue,
    booleanValue: av.booleanValue,
});

const validateAndNormalizeAttributeValues = async ({ category, subCategory, attributeValues = [] }) => {
    if (!subCategory) return [];

    const mappings = await CategoryAttributeMapping.find({
        category,
        subCategory,
        isActive: true,
    }).populate('attribute');

    const mappingByAttribute = new Map(
        mappings
            .filter(mapping => mapping.attribute && mapping.attribute.isDeleted !== true)
            .map(mapping => [mapping.attribute._id.toString(), mapping])
    );

    const normalized = attributeValues
        .map(normalizeAttributeValue)
        .filter(av => av.attributeId && mappingByAttribute.has(av.attributeId.toString()) && hasAttributeValue(av));

    const normalizedByAttribute = new Map(
        normalized.map(av => [av.attributeId.toString(), av])
    );

    const missingRequired = mappings
        .filter(mapping => mapping.isRequired || mapping.attribute?.isRequired)
        .filter(mapping => !hasAttributeValue(normalizedByAttribute.get(mapping.attribute._id.toString())))
        .map(mapping => mapping.attribute.name);

    if (missingRequired.length > 0) {
        throw new Error(`Missing required attributes: ${missingRequired.join(', ')}`);
    }

    return normalized;
};

/**
 * Get all products with filters, search, pagination, and populate references
 */
const getProducts = async (query = {}) => {
    const {
        search,
        category,
        subCategory,
        isActive,
        isArchived,
        isFeatured,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...rawFilters
    } = query;

    const filter = { isDeleted: false };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    if (isActive !== undefined && isActive !== '') {
        filter.isActive = isActive === 'true';
    }
    if (isArchived !== undefined && isArchived !== '') {
        filter.isArchived = isArchived === 'true';
    } else {
        filter.isArchived = false;
    }
    if (isFeatured !== undefined && isFeatured !== '') {
        filter.isFeatured = isFeatured === 'true';
    }

    const attributeFilters = Object.entries(rawFilters)
        .filter(([key, value]) => key.startsWith('attr_') && value !== undefined && value !== '')
        .map(([key, value]) => ({
            attribute: key.replace(/^attr_/, ''),
            value: Array.isArray(value) ? value : String(value),
        }));

    if (attributeFilters.length > 0) {
        const matchingSets = await Promise.all(attributeFilters.map(attrFilter =>
            ProductAttributeValue.find({
                attribute: attrFilter.attribute,
                $or: [
                    { value: attrFilter.value },
                    { values: attrFilter.value },
                    { numericValue: Number(attrFilter.value) },
                ],
            }).select('product')
        ));

        const productIdSets = matchingSets.map(rows => new Set(rows.map(row => row.product.toString())));
        const [firstSet, ...otherSets] = productIdSets;
        const matchingProductIds = [...(firstSet || new Set())]
            .filter(id => otherSets.every(set => set.has(id)));

        filter._id = { $in: matchingProductIds };
    }

    if (search) {
        const matchingAttributeRows = await ProductAttributeValue.find({
            $or: [
                { value: { $regex: search, $options: 'i' } },
                { values: { $elemMatch: { $regex: search, $options: 'i' } } },
            ],
        }).select('product');
        const productIdsFromAttributes = matchingAttributeRows.map(row => row.product);

        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { _id: { $in: productIdsFromAttributes } },
        ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    // Fetch extra details for each product (variants, images, attribute values)
    const result = [];
    for (const prod of products) {
        const variants = await ProductVariant.find({ product: prod._id });
        const images = await ProductImage.find({ product: prod._id }).sort({ displayOrder: 1 });
        result.push({
            ...prod.toObject(),
            variantsCount: variants.length,
            totalStock: variants.reduce((sum, v) => sum + (v.stock || 0), 0),
            images: images.map(img => img.toObject()),
        });
    }

    return {
        products: result,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get full details of a single product
 */
const getProductById = async (id) => {
    const product = await Product.findOne({ _id: id, isDeleted: false })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug category')
        .populate('relatedProducts', 'name slug price')
        .populate('crossSellProducts', 'name slug price')
        .populate('upSellProducts', 'name slug price');

    if (!product) {
        throw new Error('Product not found');
    }

    const variants = await ProductVariant.find({ product: id }).sort({ displayOrder: 1 });
    const images = await ProductImage.find({ product: id }).sort({ displayOrder: 1 });
    const attributeValues = await ProductAttributeValue.find({ product: id }).populate('attribute');

    return {
        ...product.toObject(),
        variants: variants.map(v => v.toObject()),
        images: images.map(img => img.toObject()),
        attributeValues: attributeValues.map(av => av.toObject()),
    };
};

/**
 * Create a new product with attribute values, images, and variants
 */
const createProduct = async (data, auditContext) => {
    const {
        name, description, category, subCategory, price, compareAtPrice, sku,
        barcode, shortDescription, costPrice, taxPercent, hsnCode,
        shippingWeight, shippingClass, dimensions, minOrderQty, maxOrderQty,
        lowStockAlert, isFeatured, isBestSeller, isNewArrival, isRecommended,
        warranty, returnPolicy, additionalInfo, seoTitle, seoDescription,
        metaKeywords, tags, relatedProducts, crossSellProducts, upSellProducts,
        isActive,
        
        // Relational details
        attributeValues, // Array of { attributeId, value, values, numericValue, dateValue }
        images,          // Array of { url, altText, displayOrder, isThumbnail }
        variants,        // Array of { variantAttributes: [{attribute, value}], sku, barcode, price, compareAtPrice, costPrice, stock, images }
    } = data;

    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await Product.findOne({ slug: generatedSlug, isDeleted: false });
    if (existing) {
        throw new Error('Product with this name/slug already exists');
    }

    const normalizedAttributeValues = await validateAndNormalizeAttributeValues({
        category,
        subCategory,
        attributeValues,
    });

    // Create Base Product
    const product = await Product.create({
        name,
        description,
        slug: generatedSlug,
        category,
        subCategory,
        price,
        compareAtPrice,
        sku,
        barcode,
        shortDescription,
        costPrice,
        taxPercent: taxPercent || 0,
        hsnCode,
        shippingWeight,
        shippingClass,
        dimensions,
        minOrderQty: minOrderQty || 1,
        maxOrderQty,
        lowStockAlert: lowStockAlert || 5,
        isFeatured: isFeatured || false,
        isBestSeller: isBestSeller || false,
        isNewArrival: isNewArrival || false,
        isRecommended: isRecommended || false,
        warranty,
        returnPolicy,
        additionalInfo,
        seoTitle,
        seoDescription,
        metaKeywords: metaKeywords || [],
        tags: tags || [],
        relatedProducts: relatedProducts || [],
        crossSellProducts: crossSellProducts || [],
        upSellProducts: upSellProducts || [],
        isActive: isActive !== undefined ? isActive : true,
        createdBy: auditContext.userId,
    });

    // 1. Add Attribute Values
    if (normalizedAttributeValues.length > 0) {
        const avDocs = normalizedAttributeValues
            .map(av => ({
                product: product._id,
                attribute: av.attributeId,
                value: av.value,
                values: av.values || [],
                numericValue: av.numericValue,
                dateValue: av.dateValue,
                booleanValue: av.booleanValue,
            }));
        if (avDocs.length > 0) {
            await ProductAttributeValue.insertMany(avDocs);
        }
    }

    // 2. Add Images
    let createdImages = [];
    if (images && Array.isArray(images)) {
        const imageDocs = images.map((img, idx) => ({
            product: product._id,
            url: img.url,
            altText: img.altText || '',
            displayOrder: img.displayOrder || (idx + 1),
            isThumbnail: img.isThumbnail || false,
        }));
        if (imageDocs.length > 0) {
            createdImages = await ProductImage.insertMany(imageDocs);
        }
    }

    // 3. Add Variants
    let createdVariants = [];
    if (variants && Array.isArray(variants)) {
        const variantDocs = variants.map((v, idx) => ({
            product: product._id,
            variantAttributes: v.variantAttributes || [],
            sku: v.sku ? v.sku.toUpperCase() : `${sku}-V${idx + 1}`.toUpperCase(),
            barcode: v.barcode,
            price: v.price || price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            stock: v.stock || 0,
            images: v.images || [],
            displayOrder: v.displayOrder || (idx + 1),
        }));
        if (variantDocs.length > 0) {
            createdVariants = await ProductVariant.insertMany(variantDocs);
        }
    }

    const fullProduct = await getProductById(product._id);

    await auditService.logAction(auditContext, {
        entityType: 'Product',
        entityId: product._id,
        action: 'CREATE',
        after: fullProduct,
    });

    return fullProduct;
};

/**
 * Update an existing product, updating attribute values, images, and variants safely
 */
const updateProduct = async (id, data, auditContext) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        throw new Error('Product not found');
    }

    const beforeState = await getProductById(id);

    const fields = [
        'name', 'description', 'slug', 'category', 'subCategory', 'price', 'compareAtPrice', 'sku',
        'barcode', 'shortDescription', 'costPrice', 'taxPercent', 'hsnCode',
        'shippingWeight', 'shippingClass', 'dimensions', 'minOrderQty', 'maxOrderQty',
        'lowStockAlert', 'isFeatured', 'isBestSeller', 'isNewArrival', 'isRecommended',
        'warranty', 'returnPolicy', 'additionalInfo', 'seoTitle', 'seoDescription',
        'metaKeywords', 'tags', 'relatedProducts', 'crossSellProducts', 'upSellProducts',
        'isActive', 'isArchived'
    ];

    fields.forEach(field => {
        if (data[field] !== undefined) {
            product[field] = data[field];
        }
    });

    product.updatedBy = auditContext.userId;
    const nextCategory = data.category || product.category;
    const nextSubCategory = data.subCategory || product.subCategory;
    const normalizedAttributeValues = Array.isArray(data.attributeValues)
        ? await validateAndNormalizeAttributeValues({
            category: nextCategory,
            subCategory: nextSubCategory,
            attributeValues: data.attributeValues,
        })
        : null;

    await product.save();

    // 1. Sync Attribute Values
    if (normalizedAttributeValues) {
        await ProductAttributeValue.deleteMany({ product: id });
        const avDocs = normalizedAttributeValues
            .map(av => ({
                product: id,
                attribute: av.attributeId,
                value: av.value,
                values: av.values || [],
                numericValue: av.numericValue,
                dateValue: av.dateValue,
                booleanValue: av.booleanValue,
            }));
        if (avDocs.length > 0) {
            await ProductAttributeValue.insertMany(avDocs);
        }
    }

    // 2. Sync Images
    if (data.images && Array.isArray(data.images)) {
        await ProductImage.deleteMany({ product: id });
        const imageDocs = data.images.map((img, idx) => ({
            product: id,
            url: img.url,
            altText: img.altText || '',
            displayOrder: img.displayOrder || (idx + 1),
            isThumbnail: img.isThumbnail || false,
        }));
        if (imageDocs.length > 0) {
            await ProductImage.insertMany(imageDocs);
        }
    }

    // 3. Sync Variants
    if (data.variants && Array.isArray(data.variants)) {
        await ProductVariant.deleteMany({ product: id });
        const variantDocs = data.variants.map((v, idx) => ({
            product: id,
            variantAttributes: v.variantAttributes || [],
            sku: v.sku ? v.sku.toUpperCase() : `${product.sku}-V${idx + 1}`.toUpperCase(),
            barcode: v.barcode,
            price: v.price || product.price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            stock: v.stock || 0,
            images: v.images || [],
            displayOrder: v.displayOrder || (idx + 1),
        }));
        if (variantDocs.length > 0) {
            await ProductVariant.insertMany(variantDocs);
        }
    }

    const afterState = await getProductById(id);

    await auditService.logAction(auditContext, {
        entityType: 'Product',
        entityId: id,
        action: 'UPDATE',
        before: beforeState,
        after: afterState,
    });

    return afterState;
};

/**
 * Soft delete product
 */
const deleteProduct = async (id, auditContext) => {
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        throw new Error('Product not found');
    }

    const beforeState = await getProductById(id);

    product.isDeleted = true;
    product.deletedAt = new Date();
    product.updatedBy = auditContext.userId;
    await product.save();

    // Mark variants as inactive
    await ProductVariant.updateMany({ product: id }, { $set: { isActive: false } });

    await auditService.logAction(auditContext, {
        entityType: 'Product',
        entityId: id,
        action: 'DELETE',
        before: beforeState,
        after: { ...beforeState, isDeleted: true, deletedAt: new Date() },
    });

    return product;
};

/**
 * Bulk operations
 */
const bulkUpdateStatus = async (ids, isActive, auditContext) => {
    const productsBefore = await Product.find({ _id: { $in: ids }, isDeleted: false });

    await Product.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { $set: { isActive, updatedBy: auditContext.userId } }
    );

    const productsAfter = await Product.find({ _id: { $in: ids }, isDeleted: false });

    for (const prod of productsAfter) {
        const before = productsBefore.find(p => p._id.toString() === prod._id.toString());
        await auditService.logAction(auditContext, {
            entityType: 'Product',
            entityId: prod._id,
            action: 'STATUS_CHANGE',
            before: before ? before.toObject() : null,
            after: prod.toObject(),
        });
    }

    return { updatedCount: productsAfter.length };
};

const bulkDelete = async (ids, auditContext) => {
    const productsBefore = await Product.find({ _id: { $in: ids }, isDeleted: false });

    await Product.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { 
            $set: { 
                isDeleted: true, 
                deletedAt: new Date(),
                updatedBy: auditContext.userId 
            } 
        }
    );

    // Deactivate variants
    await ProductVariant.updateMany({ product: { $in: ids } }, { $set: { isActive: false } });

    for (const prod of productsBefore) {
        await auditService.logAction(auditContext, {
            entityType: 'Product',
            entityId: prod._id,
            action: 'DELETE',
            before: prod.toObject(),
            after: { ...prod.toObject(), isDeleted: true, deletedAt: new Date() },
        });
    }

    return { deletedCount: productsBefore.length };
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateStatus,
    bulkDelete,
};
