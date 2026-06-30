import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Breadcrumb } from './Breadcrumb';
import { SearchBar, FilterButton, Button, Badge } from './CommonComponents';
import { DataTable, Pagination } from './DataTable';
import { Modal, FormGroup, Input, Textarea, Select, Checkbox } from './FormComponents';
import { productAPI, categoryAPI, subCategoryAPI, uploadAPI } from '../../api/catalogAdminService';
import useAdminStore from '../../store/adminStore';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [dynamicAttributes, setDynamicAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generatingSku, setGeneratingSku] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState({ search: '', category: '', subCategory: '', status: '' });
    const { setLoading: setStoreLoading } = useAdminStore();

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category: '',
        subCategory: '',
        sku: '',
        price: 0,
        compareAtPrice: 0,
        images: [],
        attributes: {},
    });

    // Fetch Initial Data
    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll({ limit: 100 });
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    const fetchSubCategories = async (categoryId) => {
        try {
            const response = await subCategoryAPI.getAll({ category: categoryId, limit: 100 });
            if (response.data.success) {
                setSubCategories(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch subcategories');
        }
    };

    const fetchDynamicAttributes = async (categoryId, subCategoryId) => {
        try {
            let combined = [];
            // Get attributes mapped to Category
            if (categoryId) {
                const catRes = await categoryAPI.getAttributes(categoryId);
                if (catRes.data?.success) {
                    combined = [...combined, ...catRes.data.data];
                }
            }
            // Get attributes mapped to SubCategory
            if (subCategoryId) {
                const subRes = await productAPI.getSubCategoryAttributes(subCategoryId);
                if (subRes.data?.success) {
                    // Merge, avoiding duplicates by _id
                    const existingIds = new Set(combined.map(a => a._id));
                    const newAttrs = subRes.data.data.filter(a => !existingIds.has(a._id));
                    combined = [...combined, ...newAttrs];
                }
            }
            setDynamicAttributes(combined);
        } catch (error) {
            console.error('Failed to fetch attributes');
        }
    };

    const fetchProducts = async (page = 1, search = '', category = '', subCategory = '', status = '') => {
        setLoading(true);
        try {
            const response = await productAPI.getAll({
                page,
                limit: 10,
                search,
                category,
                subCategory,
                status: status ? (status === 'active' ? 'true' : 'false') : undefined,
            });

            if (response.data.success) {
                setProducts(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    // Handle Category/Subcategory changes to load dynamic attributes
    const handleCategoryChange = (categoryId) => {
        setFormData({ ...formData, category: categoryId, subCategory: '', attributes: {} });
        if (categoryId) {
            fetchSubCategories(categoryId);
            fetchDynamicAttributes(categoryId, null);
        } else {
            setSubCategories([]);
            setDynamicAttributes([]);
        }
    };

    const handleSubCategoryChange = (subCategoryId) => {
        setFormData({ ...formData, subCategory: subCategoryId, attributes: {} });
        if (subCategoryId || formData.category) {
            fetchDynamicAttributes(formData.category, subCategoryId);
        }
    };

    // Handle attribute values
    const handleAttributeChange = (attributeId, value) => {
        setFormData((prev) => ({
            ...prev,
            attributes: { ...prev.attributes, [attributeId]: value },
        }));
    };

    // Auto Generate SKU
    const handleGenerateSKU = async () => {
        if (!formData.category) {
            toast.error("Please select a category first to generate SKU");
            return;
        }
        setGeneratingSku(true);
        try {
            const response = await productAPI.generateSKU(formData.category, formData.subCategory);
            if (response.data.success) {
                setFormData(prev => ({ ...prev, sku: response.data.data.sku }));
                toast.success("SKU generated successfully");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate SKU");
        } finally {
            setGeneratingSku(false);
        }
    };

    // Image Upload Handlers
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const response = await uploadAPI.uploadImages(files);
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...response.data.data.urls]
                }));
                toast.success(`${files.length} image(s) uploaded successfully`);
            }
        } catch (error) {
            toast.error("Failed to upload images");
        } finally {
            setUploading(false);
            e.target.value = ''; // reset file input
        }
    };

    const handleRemoveImage = async (url) => {
        try {
            const filename = url.split('/').pop();
            await uploadAPI.deleteImage(filename);
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter(img => img !== url)
            }));
            toast.success("Image removed");
        } catch (error) {
            toast.error("Failed to delete image");
        }
    };

    // Table Actions
    const handleSearch = (search) => {
        setFilters({ ...filters, search });
        fetchProducts(1, search, filters.category, filters.subCategory, filters.status);
    };

    const handleCreateClick = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            category: '',
            subCategory: '',
            sku: '',
            price: 0,
            compareAtPrice: 0,
            images: [],
            attributes: {},
        });
        setSubCategories([]);
        setDynamicAttributes([]);
        setShowModal(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            category: product.category._id,
            subCategory: product.subCategory?._id || '',
            sku: product.sku || '',
            price: product.price,
            compareAtPrice: product.compareAtPrice || 0,
            images: product.images || [],
            attributes: product.attributes ? Object.keys(product.attributes).reduce((acc, key) => {
                // Flatten the API returned attribute structure for the form
                acc[key] = product.attributes[key].map(v => v.value);
                if (product.attributes[key].length === 1 && typeof product.attributes[key][0].value === 'string') {
                    acc[key] = product.attributes[key][0].value;
                }
                return acc;
            }, {}) : {},
        });
        fetchSubCategories(product.category._id);
        fetchDynamicAttributes(product.category._id, product.subCategory?._id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }

        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        
        if (!formData.sku) {
             toast.error('SKU is required');
             return;
        }

        if (!formData.price || formData.price <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }

        setStoreLoading(true);
        try {
            if (editingProduct) {
                const response = await productAPI.update(editingProduct._id, formData);
                if (response.data.success) {
                    toast.success('Product updated successfully');
                    fetchProducts(pagination.page, filters.search, filters.category, filters.subCategory, filters.status);
                }
            } else {
                const response = await productAPI.create(formData);
                if (response.data.success) {
                    toast.success('Product created successfully');
                    fetchProducts(1, '', '', '', '');
                }
            }
            setShowModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        } finally {
            setStoreLoading(false);
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete product "${product.name}"?`)) return;

        setLoading(true);
        try {
            const response = await productAPI.delete(product._id);
            if (response.data.success) {
                toast.success('Product deleted successfully');
                fetchProducts(pagination.page, filters.search, filters.category, filters.subCategory, filters.status);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (product) => {
        try {
            const response = await productAPI.toggleStatus(product._id);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchProducts(pagination.page, filters.search, filters.category, filters.subCategory, filters.status);
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const breadcrumbs = [
        { label: 'Admin', href: '/admin' },
        { label: 'Products' },
    ];

    const columns = [
        {
            field: 'images',
            label: 'Image',
            width: '10%',
            render: (value) => value && value.length > 0 ? (
                <img src={value[0]} alt="Product" className="w-10 h-10 object-cover rounded shadow-sm border border-gray-100" />
            ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    <ImageIcon size={16} />
                </div>
            ),
        },
        { field: 'name', label: 'Product Name', width: '25%' },
        {
            field: 'sku',
            label: 'SKU',
            width: '15%',
            render: (value) => <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">{value || '-'}</span>,
        },
        { field: 'price', label: 'Price', width: '12%', render: (value) => <span className="font-medium text-gray-900">₹{value.toFixed(2)}</span> },
        {
            field: 'category',
            label: 'Category',
            width: '18%',
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{typeof value === 'object' ? value.name : value}</span>
                    {row.subCategory && (
                        <span className="text-xs text-gray-500">{typeof row.subCategory === 'object' ? row.subCategory.name : row.subCategory}</span>
                    )}
                </div>
            ),
        },
        {
            field: 'isActive',
            label: 'Status',
            width: '12%',
            render: (value) => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Product Management"
                description="Create and manage products with dynamic attributes and photos"
                breadcrumbs={breadcrumbs}
            >
                <Button onClick={handleCreateClick} size="md">
                    <Plus size={20} /> Add Product
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <SearchBar
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="Search products..."
                    className="flex-1 min-w-[250px]"
                />
                <Select
                    options={categories.map((cat) => ({ label: cat.name, value: cat._id }))}
                    value={filters.category}
                    onChange={(e) => {
                        setFilters({ ...filters, category: e.target.value });
                        fetchProducts(1, filters.search, e.target.value, filters.subCategory, filters.status);
                    }}
                    placeholder="Filter by Category"
                    className="w-48"
                />
                <FilterButton
                    label="Status"
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ]}
                    value={filters.status}
                    onChange={(status) => {
                        setFilters({ ...filters, status });
                        fetchProducts(1, filters.search, filters.category, filters.subCategory, status);
                    }}
                />
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={products}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                className="mb-6"
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) =>
                        fetchProducts(page, filters.search, filters.category, filters.subCategory, filters.status)
                    }
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingProduct ? 'Edit Product' : 'Create Product'}
                size="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                    
                    {/* Classification */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                            1. Classification
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Category" required>
                                <Select
                                    options={categories.map((cat) => ({ label: cat.name, value: cat._id }))}
                                    value={formData.category}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup label="Sub Category">
                                <Select
                                    options={subCategories.map((subCat) => ({
                                        label: subCat.name,
                                        value: subCat._id,
                                    }))}
                                    value={formData.subCategory}
                                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                                    disabled={!formData.category}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            2. Basic Information
                        </h3>

                        <FormGroup label="Product Name" required>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Wooden Shape Sorter Puzzle"
                            />
                        </FormGroup>

                        <FormGroup label="SKU" required>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="e.g., PUZ-SHP-001"
                                    className="flex-1 font-mono text-sm"
                                    readOnly={generatingSku}
                                />
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={handleGenerateSKU}
                                    disabled={generatingSku || !formData.category}
                                    className="whitespace-nowrap bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    {generatingSku ? <RefreshCw className="animate-spin" size={16}/> : 'Generate SKU'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Select category and subcategory to auto-generate.</p>
                        </FormGroup>

                        <FormGroup label="Description">
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                placeholder="Describe the toy, educational benefits, materials used..."
                            />
                        </FormGroup>
                    </div>

                    {/* Pricing */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-green-800 flex items-center gap-2">
                            3. Pricing
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Price (₹)" required>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    step="0.01"
                                    min="0"
                                />
                            </FormGroup>

                            <FormGroup label="Compare at Price (₹) (Optional)">
                                <Input
                                    type="number"
                                    value={formData.compareAtPrice}
                                    onChange={(e) =>
                                        setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || 0 })
                                    }
                                    step="0.01"
                                    min="0"
                                />
                            </FormGroup>
                        </div>
                    </div>

                    {/* Product Images */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                            4. Product Photos
                        </h3>
                        
                        <div className="flex flex-wrap gap-4">
                            {/* Uploaded Images */}
                            {formData.images.map((url, index) => (
                                <div key={index} className="relative group w-24 h-24 border border-purple-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(url)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* Upload Button */}
                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-white hover:bg-purple-50 transition-colors">
                                {uploading ? (
                                    <RefreshCw className="animate-spin text-purple-400" size={24} />
                                ) : (
                                    <>
                                        <Upload className="text-purple-400 mb-1" size={24} />
                                        <span className="text-xs font-medium text-purple-600">Upload</span>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/jpeg, image/png, image/webp" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-purple-600">Upload JPG, PNG, or WEBP images. Max 5MB per file.</p>
                    </div>

                    {/* Dynamic Attributes */}
                    {dynamicAttributes.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
                            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                5. Attributes (Dynamic)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {dynamicAttributes.map((attribute) => (
                                    <div key={attribute._id} className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                                            {attribute.name}
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{attribute.type}</span>
                                        </label>

                                        {attribute.type === 'Dropdown' && (
                                            <select
                                                value={formData.attributes[attribute._id] || ''}
                                                onChange={(e) =>
                                                    handleAttributeChange(attribute._id, e.target.value)
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            >
                                                <option value="">Select {attribute.name}</option>
                                                {attribute.values.map((val) => (
                                                    <option key={val._id || val.value} value={val.value}>
                                                        {val.value}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {attribute.type === 'MultiSelect' && (
                                            <div className="border border-gray-300 rounded-lg bg-white p-2 max-h-32 overflow-y-auto">
                                                {attribute.values.map((val) => {
                                                    const isChecked = Array.isArray(formData.attributes[attribute._id]) && 
                                                                      formData.attributes[attribute._id].includes(val.value);
                                                    return (
                                                        <label key={val._id || val.value} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                                            <input 
                                                                type="checkbox"
                                                                className="text-blue-600 rounded focus:ring-blue-500"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const current = Array.isArray(formData.attributes[attribute._id]) 
                                                                        ? [...formData.attributes[attribute._id]] 
                                                                        : [];
                                                                    if (e.target.checked) {
                                                                        current.push(val.value);
                                                                    } else {
                                                                        const index = current.indexOf(val.value);
                                                                        if (index > -1) current.splice(index, 1);
                                                                    }
                                                                    handleAttributeChange(attribute._id, current);
                                                                }}
                                                            />
                                                            <span className="text-sm text-gray-700">{val.value}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {attribute.type === 'Text' && (
                                            <Input
                                                value={formData.attributes[attribute._id] || ''}
                                                onChange={(e) =>
                                                    handleAttributeChange(attribute._id, e.target.value)
                                                }
                                                placeholder={`Enter ${attribute.name}`}
                                            />
                                        )}

                                        {attribute.type === 'Number' && (
                                            <Input
                                                type="number"
                                                value={formData.attributes[attribute._id] || ''}
                                                onChange={(e) =>
                                                    handleAttributeChange(attribute._id, parseFloat(e.target.value))
                                                }
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-6 pb-2 border-t border-gray-100">
                        <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProductManagement;
