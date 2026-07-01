import React, { useEffect, useMemo, useState } from 'react';
import { catalogService } from '../api/catalogService';

const finishOptions = ['Natural Maple', 'Oak Tint'];
const featureBullets = [
  '100% solid maple FSC-certified wood',
  'Water-based, non-toxic sealant',
  'Hand-finished for safe smooth edges',
  'Designed for lasting open-ended play',
];
const certifications = ['EN71 Certified', 'ASTM F963', 'CPSC Compliant'];
const relatedProducts = [
  { title: 'Building Blocks', price: '$42.00' },
  { title: 'Pull Along Friend', price: '$28.00' },
  { title: 'Earth Play Silks', price: '$18.00' },
  { title: 'Modern Shape Sorter', price: '$48.00' },
];

const formatFieldLabel = (key) => {
  if (key === '_id') return 'ID';
  if (key === 'sku') return 'SKU';
  if (key === 'hsnCode') return 'HSN Code';
  if (key === 'shortDescription') return 'Short Description';
  if (key === 'createdAt') return 'Created At';
  if (key === 'updatedAt') return 'Updated At';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());
};

const formatFieldValue = (value, key) => {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (key === 'price' || key === 'compareAtPrice' || key === 'costPrice') {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : value.toString();
  }

  if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  if (key === 'dimensions' && typeof value === 'object' && value !== null) {
    const { length, width, height } = value;
    if ([length, width, height].every((dim) => dim !== undefined && dim !== null)) {
      return `${length} x ${width} x ${height}`;
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    const primitive = value.every((v) => typeof v !== 'object' || v === null);
    if (primitive) return value.join(', ');

    const names = value
      .map((v) => {
        if (!v || typeof v !== 'object') return v;
        if (v.name) return v.name;
        if (v.value) return v.value;
        if (v.slug) return v.slug;
        if (v._id) return v._id;
        return JSON.stringify(v);
      })
      .filter(Boolean);
    return names.join(', ') || JSON.stringify(value);
  }

  if (typeof value === 'object') {
    if (key === 'category' && value.name) return value.name;
    if (key === 'subCategory' && value.name) return value.name;
    if (value.name) return value.name;
    if (value.slug) return value.slug;
    if (value._id) return value._id;
    return JSON.stringify(value);
  }

  return value.toString();
};

const buildProductFieldKeys = (product) => {
  if (!product || typeof product !== 'object') return [];

  const displayOrder = [
    '_id',
    'sku',
    'category',
    'subCategory',
    'shortDescription',
    'description',
    'price',
    'compareAtPrice',
    'ageGroup',
    'toyType',
    'woodType',
    'materialType',
    'skillDevelopment',
    'theme',
    'warranty',
    'returnPolicy',
    'additionalInfo',
    'barcode',
    'costPrice',
    'taxPercent',
    'hsnCode',
    'shippingWeight',
    'shippingClass',
    'dimensions',
    'minOrderQty',
    'maxOrderQty',
    'lowStockAlert',
    'isFeatured',
    'isBestSeller',
    'isNewArrival',
    'isRecommended',
    'metaKeywords',
    'tags',
    'relatedProducts',
    'crossSellProducts',
    'upSellProducts',
    'variants',
    'inventory',
    'attributes',
    'createdBy',
    'updatedBy',
    'createdAt',
    'updatedAt',
    'isActive',
    'isArchived',
    'isDeleted',
    'deletedAt',
  ];

  const excludedFields = new Set(['images', 'image', '__v']);
  const rawKeys = Object.keys(product).filter((key) => !excludedFields.has(key));

  return [
    ...displayOrder.filter((key) => rawKeys.includes(key)),
    ...rawKeys.filter((key) => !displayOrder.includes(key)),
  ];
};

export default function ProductDetails({ product: initialProduct, user, onNavigate, onAddToCart, onAddToWishlist }) {
  const [selectedFinish, setSelectedFinish] = useState(finishOptions[0]);
  const [quantity, setQuantity] = useState(1);
  const [zipCode, setZipCode] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [product, setProduct] = useState(initialProduct);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  useEffect(() => {
    if (!initialProduct?._id) return;

    let active = true;
    catalogService.getProductById(initialProduct._id)
      .then((data) => {
        if (active && data) {
          setProduct(data);
        }
      })
      .catch(() => {
        // Keep using the initial product object if detail fetch fails.
      });

    return () => { active = false; };
  }, [initialProduct?._id]);

  useEffect(() => {
    if (!Array.isArray(product?.attributes)) return;

    const initialAttributes = {};
    product.attributes.forEach((attr) => {
      const label = attr.attribute?.name || attr.attribute?.slug || 'Attribute';
      const type = attr.attribute?.type || 'Text';
      const attrKey = label;

      if ((type === 'MultiSelect' || type === 'Checkbox') && Array.isArray(attr.values) && attr.values.length) {
        initialAttributes[attrKey] = [...attr.values];
      } else if (Array.isArray(attr.values) && attr.values.length) {
        initialAttributes[attrKey] = attr.values[0];
      } else if (attr.value) {
        initialAttributes[attrKey] = attr.value;
      } else if (type === 'Boolean') {
        initialAttributes[attrKey] = attr.booleanValue === true ? 'Yes' : attr.booleanValue === false ? 'No' : '-';
      } else if (type === 'Number') {
        initialAttributes[attrKey] = attr.numericValue ?? '';
      }
    });

    setSelectedAttributes(initialAttributes);
  }, [product]);

  const handleAttributeValueClick = (attributeKey, type, option) => {
    setSelectedAttributes((prev) => {
      const currentValue = prev[attributeKey];

      if (type === 'MultiSelect' || type === 'Checkbox') {
        const currentArray = Array.isArray(currentValue) ? [...currentValue] : [];
        const alreadySelected = currentArray.includes(option);
        return {
          ...prev,
          [attributeKey]: alreadySelected
            ? currentArray.filter((value) => value !== option)
            : [...currentArray, option],
        };
      }

      return {
        ...prev,
        [attributeKey]: option,
      };
    });
  };

  const images = useMemo(() => {
    const imgs = [];
    if (Array.isArray(product?.images) && product.images.length) imgs.push(...product.images);
    if (product?.image) imgs.push(product.image);
    return imgs.length
      ? imgs
      : ['/wooden_train_set.png', '/rainbow_stacker.png', '/geometry_sorter.png', '/log_cabin_blocks.png'];
  }, [product]);

  const [selectedImage, setSelectedImage] = useState(images[0]);

  useEffect(() => {
    setSelectedImage(images[0]);
  }, [images]);

  const categoryName = typeof product?.category === 'object' && product.category !== null
    ? product.category.name
    : product?.category;

  const descriptionText = typeof product?.shortDescription === 'string'
    ? product.shortDescription
    : typeof product?.description === 'string'
      ? product.description
      : 'Handcrafted wooden toy designed for mindful play, beautiful display, and everyday use.';

  const productFieldKeys = useMemo(() => buildProductFieldKeys(product), [product]);

  const handleAction = (type) => {
    if (!user) {
      alert(`Please sign in to add to ${type.toLowerCase()}.`);
      onNavigate('login');
      return;
    }

    const item = { ...product, selectedFinish, quantity, selectedAttributes };
    if (type === 'Cart') {
      onAddToCart?.(item);
    } else {
      onAddToWishlist?.(item);
    }
  };

  if (!product) {
    return (
      <section className="py-24 px-6 text-center">
        <p className="text-sm text-slate-600">No product selected.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-slate-800"
        >
          Back to Shop
        </button>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Nordic Collection</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{product.name}</h1>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Shop
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl border border-slate-200">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-[540px] object-contain bg-[#F8F8F8]"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(src)}
                  className={`overflow-hidden rounded-3xl border p-2 transition ${selectedImage === src ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white hover:border-slate-900'}`}
                >
                  <img
                    src={src}
                    alt={`${product.name} view ${index + 1}`}
                    className="h-24 w-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{categoryName || 'Wooden Toy'}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{product.price != null ? `$${product.price.toFixed(2)}` : '-'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Share
                </button>

              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                {descriptionText}
              </p>

              <div className="mt-8 space-y-5">

                {Array.isArray(product.attributes) && product.attributes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Attributes</p>
                    <div className="mt-3 space-y-2">
                      {product.attributes.map((attr) => {
                        const label = attr.attribute?.name || attr.attribute?.slug || 'Attribute';
                        const type = attr.attribute?.type || 'Text';
                        const attrKey = label;

                        let resolvedValues = [];
                        if (type === 'Boolean') {
                          resolvedValues = [attr.booleanValue === true ? 'Yes' : attr.booleanValue === false ? 'No' : '-'];
                        } else if (type === 'Number') {
                          resolvedValues = [attr.numericValue !== null && attr.numericValue !== undefined ? attr.numericValue.toString() : '-'];
                        } else if (type === 'Date') {
                          resolvedValues = [attr.dateValue ? new Date(attr.dateValue).toLocaleDateString() : '-'];
                        } else if (Array.isArray(attr.values) && attr.values.length > 0) {
                          resolvedValues = attr.values;
                        } else if (attr.value) {
                          resolvedValues = [attr.value];
                        } else {
                          resolvedValues = ['-'];
                        }

                        const selectedValue = selectedAttributes[attrKey];
                        const isSelectable = Array.isArray(attr.values) && attr.values.length > 0 && ['Dropdown', 'RadioButton', 'ColorPicker', 'MultiSelect', 'Checkbox'].includes(type);
                        const currentValue = isSelectable
                          ? (type === 'MultiSelect' || type === 'Checkbox'
                              ? (Array.isArray(selectedValue) ? selectedValue : [])
                              : selectedValue ?? attr.values?.[0])
                          : resolvedValues;

                        const renderInteractiveValues = () => (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {attr.values.map((v, i) => {
                              const valueText = typeof v === 'string' ? v : String(v);
                              const isSelected = type === 'MultiSelect' || type === 'Checkbox'
                                ? Array.isArray(currentValue) && currentValue.includes(valueText)
                                : currentValue === valueText;

                              return (
                                <button
                                  key={`${attrKey}-${valueText}-${i}`}
                                  type="button"
                                  onClick={() => handleAttributeValueClick(attrKey, type, valueText)}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                    isSelected
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {type === 'ColorPicker' ? (
                                    <>
                                      <span
                                        className="inline-block h-4 w-4 rounded-full border border-slate-300"
                                        style={{ backgroundColor: valueText }}
                                      />
                                      {valueText}
                                    </>
                                  ) : (
                                    valueText
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );

                        const renderValue = () => {
                          if (type === 'Boolean') {
                            const bool = resolvedValues[0];
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                bool === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                <span>{bool === 'Yes' ? '✓' : '✗'}</span> {bool}
                              </span>
                            );
                          }
                          if (isSelectable) {
                            return renderInteractiveValues();
                          }
                          if (type === 'ColorPicker') {
                            return (
                              <div className="flex flex-wrap gap-2 justify-end">
                                {resolvedValues.map((v, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="inline-block h-5 w-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: v }} />
                                    <span className="text-xs text-slate-600">{v}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          if (type === 'MultiSelect' || type === 'Checkbox') {
                            return (
                              <div className="flex flex-wrap gap-2 justify-end">
                                {resolvedValues.map((v, i) => (
                                  <span key={i} className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">{v}</span>
                                ))}
                              </div>
                            );
                          }
                          if (type === 'Dropdown' || type === 'RadioButton') {
                            return <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{resolvedValues[0]}</span>;
                          }
                          if (type === 'Number') {
                            return <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{resolvedValues[0]}</span>;
                          }
                          if (type === 'Date') {
                            return <span className="text-sm text-slate-700">📅 {resolvedValues[0]}</span>;
                          }
                          return <span className="text-sm text-slate-700 break-words">{resolvedValues.join(', ')}</span>;
                        };

                        return (
                          <div key={attr._id || attrKey} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap pt-0.5">{label}</span>
                            <div className="text-right">{renderValue()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quantity</p>
                  <div className="mt-3 inline-flex items-center rounded-full border border-slate-300 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="px-6 text-base font-semibold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => value + 1)}
                      className="px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleAction('Cart')}
                    className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('Wishlist')}
                    className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 hover:bg-slate-50"
                  >
                    Add to Wishlist
                  </button>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Return & Exchange Policy</p>
                    <button
                      type="button"
                      onClick={() => setShowPolicy((value) => !value)}
                      className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {showPolicy ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showPolicy && (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {product.returnPolicy || 'Return within 30 days for a full refund. Items must be in original condition and packaging.'}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Share Product Link</p>
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
                    >
                      Copy
                    </button>
                  </div>
                  <input
                    value={window.location.href}
                    readOnly
                    className="mt-4 w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Share Product</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product Link</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={window.location.href}
                  readOnly
                  className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-slate-800 transition whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
