import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { PageHeader } from './Breadcrumb';
import { SearchBar, FilterButton, Button, Badge } from './CommonComponents';
import { DataTable, Pagination } from './DataTable';
import { Modal, FormGroup, Input, Textarea, Select, Checkbox } from './FormComponents';
import { subCategoryAPI, categoryAPI, attributeAPI } from '../../api/catalogAdminService';
import useAdminStore from '../../store/adminStore';

const SubCategoryManagement = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState({ search: '', category: '', status: '' });
    const { setLoading: setStoreLoading } = useAdminStore();

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        image: '',
        attributes: [],
        displayOrder: 1,
    });

    // Fetch initial data
    useEffect(() => {
        fetchCategories();
        fetchAttributes();
        fetchSubCategories();
    }, []);

    // Fetch categories for dropdown
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

    // Fetch attributes for mapping
    const fetchAttributes = async () => {
        try {
            const response = await attributeAPI.getAll({ limit: 100, status: 'true' });
            if (response.data.success) {
                setAttributes(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch attributes');
        }
    };

    // Fetch subcategories
    const fetchSubCategories = async (page = 1, search = '', category = '', status = '') => {
        setLoading(true);
        try {
            const response = await subCategoryAPI.getAll({
                page,
                limit: 10,
                search,
                category,
                status: status ? (status === 'active' ? 'true' : 'false') : undefined,
            });

            if (response.data.success) {
                setSubCategories(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to fetch subcategories');
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (search) => {
        setFilters({ ...filters, search });
        fetchSubCategories(1, search, filters.category, filters.status);
    };

    // Handle category filter
    const handleCategoryFilter = (category) => {
        setFilters({ ...filters, category });
        fetchSubCategories(1, filters.search, category, filters.status);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        setFilters({ ...filters, status });
        fetchSubCategories(1, filters.search, filters.category, status);
    };

    // Open modal for create
    const handleCreateClick = () => {
        setEditingSubCategory(null);
        setFormData({
            name: '',
            category: '',
            description: '',
            image: '',
            attributes: [],
            displayOrder: 1,
        });
        setShowModal(true);
    };

    // Open modal for edit
    const handleEdit = (subCategory) => {
        setEditingSubCategory(subCategory);
        setFormData({
            name: subCategory.name,
            category: subCategory.category._id,
            description: subCategory.description,
            image: subCategory.image,
            attributes: subCategory.attributes.map((attr) => attr._id || attr),
            displayOrder: subCategory.displayOrder,
        });
        setShowModal(true);
    };

    // Handle attribute toggle
    const handleAttributeToggle = (attributeId) => {
        setFormData((prev) => {
            const updatedAttributes = prev.attributes.includes(attributeId)
                ? prev.attributes.filter((id) => id !== attributeId)
                : [...prev.attributes, attributeId];
            return { ...prev, attributes: updatedAttributes };
        });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('SubCategory name is required');
            return;
        }

        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }

        setStoreLoading(true);
        try {
            if (editingSubCategory) {
                // Update
                const response = await subCategoryAPI.update(editingSubCategory._id, formData);
                if (response.data.success) {
                    toast.success('SubCategory updated successfully');
                    fetchSubCategories(pagination.page, filters.search, filters.category, filters.status);
                }
            } else {
                // Create
                const response = await subCategoryAPI.create(formData);
                if (response.data.success) {
                    toast.success('SubCategory created successfully');
                    fetchSubCategories(1, '', '', '');
                }
            }
            setShowModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save subcategory');
        } finally {
            setStoreLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (subCategory) => {
        if (!window.confirm(`Delete subcategory "${subCategory.name}"?`)) return;

        setLoading(true);
        try {
            const response = await subCategoryAPI.delete(subCategory._id);
            if (response.data.success) {
                toast.success('SubCategory deleted successfully');
                fetchSubCategories(pagination.page, filters.search, filters.category, filters.status);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete subcategory');
        } finally {
            setLoading(false);
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (subCategory) => {
        try {
            const response = await subCategoryAPI.toggleStatus(subCategory._id);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchSubCategories(pagination.page, filters.search, filters.category, filters.status);
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const breadcrumbs = [
        { label: 'Admin', href: '/admin' },
        { label: 'Catalog', href: '/admin/catalog' },
        { label: 'Sub Categories' },
    ];

    const columns = [
        { field: 'name', label: 'SubCategory Name', width: '25%' },
        {
            field: 'category',
            label: 'Category',
            width: '25%',
            render: (value) => (typeof value === 'object' ? value.name : value),
        },
        {
            field: 'attributeCount',
            label: 'Attributes',
            width: '15%',
            render: (value) => <Badge variant="amber">{value || 0}</Badge>,
        },
        {
            field: 'productCount',
            label: 'Products',
            width: '15%',
        },
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
                title="Sub Category Management"
                description="Create and manage product subcategories with attribute mappings"
                breadcrumbs={breadcrumbs}
            >
                <Button onClick={handleCreateClick} size="md">
                    <Plus size={20} /> Add Sub Category
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <SearchBar
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="Search subcategories..."
                    className="flex-1 min-w-250"
                />
                <Select
                    options={categories.map((cat) => ({ label: cat.name, value: cat._id }))}
                    value={filters.category}
                    onChange={handleCategoryFilter}
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
                    onChange={handleStatusFilter}
                />
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={subCategories}
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
                        fetchSubCategories(page, filters.search, filters.category, filters.status)
                    }
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingSubCategory ? 'Edit Sub Category' : 'Create Sub Category'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormGroup label="Category" required>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </FormGroup>

                    <FormGroup label="SubCategory Name" required>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Wooden Puzzles, LEGO Blocks"
                        />
                    </FormGroup>

                    <FormGroup label="Description">
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="SubCategory description"
                            rows={3}
                        />
                    </FormGroup>

                    <FormGroup label="Image URL">
                        <Input
                            type="url"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                        />
                    </FormGroup>

                    <FormGroup label="Display Order">
                        <Input
                            type="number"
                            value={formData.displayOrder}
                            onChange={(e) =>
                                setFormData({ ...formData, displayOrder: parseInt(e.target.value) })
                            }
                            min="1"
                        />
                    </FormGroup>

                    {/* Attribute Mapping */}
                    <FormGroup label="Assign Attributes">
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                            {attributes.map((attr) => (
                                <label key={attr._id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.attributes.includes(attr._id)}
                                        onChange={() => handleAttributeToggle(attr._id)}
                                        className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">{attr.name}</span>
                                    <Badge variant="gray" size="sm">
                                        {attr.type}
                                    </Badge>
                                </label>
                            ))}
                        </div>
                    </FormGroup>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingSubCategory ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SubCategoryManagement;
