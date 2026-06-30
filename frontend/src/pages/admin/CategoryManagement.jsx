import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit3, ChevronRight } from 'lucide-react';
import { PageHeader } from './Breadcrumb';
import { SearchBar } from './CommonComponents';
import { DataTable, Pagination } from './DataTable';
import { categoryAPI } from '../../api/catalogAdminService';
import useAdminStore from '../../store/adminStore';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState({ search: '', status: '', parentOnly: 'true' });
    const { setLoading: setStoreLoading } = useAdminStore();

    // New Bulk Form State
    const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        categoryId: '',
        newCategoryName: '',
        subCategories: '',
        ageWise: '',
        description: '',
    });

    // Fetch categories
    const fetchCategories = async (page = 1, search = '', status = '', parentOnly = 'true') => {
        setLoading(true);
        try {
            const response = await categoryAPI.getAll({
                page,
                limit: 10,
                search,
                status: status ? (status === 'active' ? 'true' : 'false') : undefined,
                parentOnly
            });

            if (response.data.success) {
                setCategories(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle Form Submit
    const handleBulkSubmit = async (e) => {
        e.preventDefault();

        if (!isCreatingNewCategory && !formData.categoryId) {
            toast.error('Please select an existing category or create a new one');
            return;
        }

        if (isCreatingNewCategory && !formData.newCategoryName.trim()) {
            toast.error('Please enter a new category name');
            return;
        }

        setStoreLoading(true);
        try {
            const payload = {
                brand: formData.brand,
                categoryId: isCreatingNewCategory ? undefined : formData.categoryId,
                newCategoryName: isCreatingNewCategory ? formData.newCategoryName : undefined,
                subCategories: formData.subCategories,
                ageWise: formData.ageWise,
                description: formData.description,
            };

            const response = await categoryAPI.bulkCreate(payload);
            if (response.data.success) {
                toast.success('Category data saved successfully');
                // Reset form
                setFormData({
                    brand: '',
                    categoryId: '',
                    newCategoryName: '',
                    subCategories: '',
                    ageWise: '',
                    description: '',
                });
                setIsCreatingNewCategory(false);
                fetchCategories(1, filters.search, filters.status, filters.parentOnly);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setStoreLoading(false);
        }
    };

    // Handle Delete
    const handleDelete = async (category) => {
        if (!window.confirm(`Delete category "${category.name}"?`)) return;

        setLoading(true);
        try {
            const response = await categoryAPI.delete(category._id);
            if (response.data.success) {
                toast.success('Category deleted successfully');
                fetchCategories(pagination.page, filters.search, filters.status, filters.parentOnly);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        } finally {
            setLoading(false);
        }
    };

    // Handle Status Toggle
    const handleToggleStatus = async (category) => {
        try {
            const response = await categoryAPI.toggleStatus(category._id);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchCategories(pagination.page, filters.search, filters.status, filters.parentOnly);
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const breadcrumbs = [
        { label: 'Admin', href: '/admin' },
        { label: 'Catalog', href: '/admin/catalog' },
        { label: 'Categories' },
    ];

    const columns = [
        {
            field: 'name',
            label: 'Category Name',
            width: '25%',
            render: (value, row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{value}</span>
                    {row.brand && row.brand !== 'General' && (
                        <span className="text-xs text-gray-500">Brand: {row.brand}</span>
                    )}
                </div>
            )
        },
        {
            field: 'attributes',
            label: 'Attributes',
            width: '35%',
            render: (value) => {
                if (!value || value.length === 0) return <span className="text-gray-400 text-xs">None</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {value.map((attr) => (
                            <span
                                key={typeof attr === 'object' ? attr._id : attr}
                                className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {typeof attr === 'object' ? attr.name : attr}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        { field: 'productCount', label: 'Products', width: '15%' },
        {
            field: 'isActive',
            label: 'Status',
            width: '15%',
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
                title="Categories"
                description="Manage your categories and settings."
                breadcrumbs={breadcrumbs}
            />

            {/* Bulk Create Form Container */}
            <div className="bg-[#f6fcf7] border border-[#e2efe3] rounded-xl p-6 mb-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Create New Category</h2>
                
                <form onSubmit={handleBulkSubmit} className="space-y-5">
                    
                    {/* Brand Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                                placeholder="e.g. MEEYAZH Threads"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                            <div className="w-10 h-[38px] bg-[#eef6ee] text-[#5b825b] border border-[#d3e6d3] rounded-md flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#e0eee0]">
                                <Edit3 size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name (Category) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                            <div className="flex gap-2">
                                {isCreatingNewCategory ? (
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                                        placeholder="Enter new category name..."
                                        value={formData.newCategoryName}
                                        onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                                        autoFocus
                                    />
                                ) : (
                                    <select
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm text-gray-700"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="">Select an existing category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                                    className={`w-10 h-[38px] rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                        isCreatingNewCategory 
                                            ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' 
                                            : 'bg-[#eef6ee] text-[#5b825b] border-[#d3e6d3] hover:bg-[#e0eee0]'
                                    }`}
                                    title={isCreatingNewCategory ? "Select existing category" : "Add new category"}
                                >
                                    {isCreatingNewCategory ? <ChevronRight size={18} /> : <Plus size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Sub Categories */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Categories (comma separated)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                                placeholder="e.g. Wooden Puzzles, Building Blocks"
                                value={formData.subCategories}
                                onChange={(e) => setFormData({ ...formData, subCategories: e.target.value })}
                            />
                        </div>
                        
                        {/* Age Wise Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Ages (comma separated)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                                placeholder="e.g. 0-2 Years, 3-5 Years, 5+ Years"
                                value={formData.ageWise}
                                onChange={(e) => setFormData({ ...formData, ageWise: e.target.value })}
                            />
                        </div>

                        {/* Empty spacer to align grid */}
                        <div className="hidden md:block"></div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm min-h-[100px]"
                            placeholder="Enter description here..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-[#4c784c] hover:bg-[#3e633e] text-white font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 text-sm"
                        >
                            Save Category
                        </button>
                    </div>
                </form>
            </div>

            {/* List Existing Categories */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 mt-12">Existing Categories</h3>
            
            <div className="flex gap-4 mb-4">
                <SearchBar
                    value={filters.search}
                    onChange={(search) => {
                        setFilters({ ...filters, search });
                        fetchCategories(1, search, filters.status, filters.parentOnly);
                    }}
                    placeholder="Search categories..."
                    className="flex-1 max-w-md"
                />
            </div>

            <DataTable
                columns={columns}
                data={categories}
                loading={loading}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                className="mb-6"
            />

            {pagination.pages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) => fetchCategories(page, filters.search, filters.status, filters.parentOnly)}
                />
            )}
        </div>
    );
};

export default CategoryManagement;
