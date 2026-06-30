import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from './Breadcrumb';
import { SearchBar, FilterButton, Button, Badge } from './CommonComponents';
import { DataTable, Pagination } from './DataTable';
import { Modal, FormGroup, Input, Textarea, Select } from './FormComponents';
import { attributeAPI } from '../../api/catalogAdminService';
import useAdminStore from '../../store/adminStore';

const AttributeManagement = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showValueModal, setShowValueModal] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [attributeValues, setAttributeValues] = useState([]);
    const [valuePagination, setValuePagination] = useState({ total: 0, page: 1, pages: 1 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState({ search: '', type: '', status: '' });
    const [valueFilters, setValueFilters] = useState({ search: '' });
    const { setLoading: setStoreLoading } = useAdminStore();

    const [formData, setFormData] = useState({
        name: '',
        type: 'Dropdown',
        description: '',
        displayOrder: 1,
        isVariant: false,
    });

    const [valueFormData, setValueFormData] = useState({
        value: '',
        colorCode: '#000000',
        displayOrder: 1,
    });

    const attributeTypes = [
        { label: 'Text', value: 'Text' },
        { label: 'Dropdown', value: 'Dropdown' },
        { label: 'Multi Select', value: 'MultiSelect' },
        { label: 'Checkbox', value: 'Checkbox' },
        { label: 'Radio Button', value: 'RadioButton' },
        { label: 'Number', value: 'Number' },
        { label: 'Color Picker', value: 'ColorPicker' },
        { label: 'Date', value: 'Date' },
    ];

    // Fetch attributes
    const fetchAttributes = async (page = 1, search = '', type = '', status = '') => {
        setLoading(true);
        try {
            const response = await attributeAPI.getAll({
                page,
                limit: 10,
                search,
                type,
                status: status ? (status === 'active' ? 'true' : 'false') : undefined,
            });

            if (response.data.success) {
                setAttributes(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to fetch attributes');
        } finally {
            setLoading(false);
        }
    };

    // Fetch attribute values
    const fetchAttributeValues = async (attributeId, page = 1, search = '') => {
        try {
            const response = await attributeAPI.getValues(attributeId, {
                page,
                limit: 10,
                search,
            });

            if (response.data.success) {
                setAttributeValues(response.data.data);
                setValuePagination(response.data.pagination);
                setSelectedAttribute(response.data.attribute);
            }
        } catch (error) {
            toast.error('Failed to fetch attribute values');
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchAttributes();
    }, []);

    // Handle search
    const handleSearch = (search) => {
        setFilters({ ...filters, search });
        fetchAttributes(1, search, filters.type, filters.status);
    };

    // Handle type filter
    const handleTypeFilter = (type) => {
        setFilters({ ...filters, type });
        fetchAttributes(1, filters.search, type, filters.status);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        setFilters({ ...filters, status });
        fetchAttributes(1, filters.search, filters.type, status);
    };

    // Open modal for create
    const handleCreateClick = () => {
        setEditingAttribute(null);
        setFormData({ name: '', type: 'Dropdown', description: '', displayOrder: 1, isVariant: false });
        setShowModal(true);
    };

    // Open modal for edit
    const handleEdit = (attribute) => {
        setEditingAttribute(attribute);
        setFormData({
            name: attribute.name,
            type: attribute.type,
            description: attribute.description,
            displayOrder: attribute.displayOrder,
            isVariant: attribute.isVariant || false,
        });
        setShowModal(true);
    };

    // Open values modal
    const handleManageValues = (attribute) => {
        fetchAttributeValues(attribute._id);
        setShowValueModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Attribute name is required');
            return;
        }

        setStoreLoading(true);
        try {
            if (editingAttribute) {
                const response = await attributeAPI.update(editingAttribute._id, formData);
                if (response.data.success) {
                    toast.success('Attribute updated successfully');
                    fetchAttributes(pagination.page, filters.search, filters.type, filters.status);
                }
            } else {
                const response = await attributeAPI.create(formData);
                if (response.data.success) {
                    toast.success('Attribute created successfully');
                    fetchAttributes(1, '', '', '');
                }
            }
            setShowModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save attribute');
        } finally {
            setStoreLoading(false);
        }
    };

    // Handle value submit
    const handleValueSubmit = async (e) => {
        e.preventDefault();

        if (!valueFormData.value.trim()) {
            toast.error('Value is required');
            return;
        }

        setStoreLoading(true);
        try {
            const response = await attributeAPI.createValue(selectedAttribute.id, valueFormData);
            if (response.data.success) {
                toast.success('Attribute value created successfully');
                fetchAttributeValues(selectedAttribute.id);
                setValueFormData({ value: '', colorCode: '#000000', displayOrder: 1 });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save attribute value');
        } finally {
            setStoreLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (attribute) => {
        if (!window.confirm(`Delete attribute "${attribute.name}"?`)) return;

        setLoading(true);
        try {
            const response = await attributeAPI.delete(attribute._id);
            if (response.data.success) {
                toast.success('Attribute deleted successfully');
                fetchAttributes(pagination.page, filters.search, filters.type, filters.status);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete attribute');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete value
    const handleDeleteValue = async (valueId) => {
        if (!window.confirm('Delete this attribute value?')) return;

        try {
            const response = await attributeAPI.deleteValue(valueId);
            if (response.data.success) {
                toast.success('Attribute value deleted successfully');
                fetchAttributeValues(selectedAttribute.id);
            }
        } catch (error) {
            toast.error('Failed to delete attribute value');
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (attribute) => {
        try {
            const response = await attributeAPI.toggleStatus(attribute._id);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchAttributes(pagination.page, filters.search, filters.type, filters.status);
            }
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const breadcrumbs = [
        { label: 'Admin', href: '/admin' },
        { label: 'Catalog', href: '/admin/catalog' },
        { label: 'Attributes' },
    ];

    const columns = [
        { field: 'name', label: 'Attribute Name', width: '25%' },
        {
            field: 'type',
            label: 'Type',
            width: '15%',
            render: (value) => <Badge variant="amber">{value}</Badge>,
        },
        {
            field: 'isVariant',
            label: 'Variant',
            width: '12%',
            render: (value) => (
                <Badge variant={value ? 'green' : 'gray'} size="sm">
                    {value ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            field: 'valuesCount',
            label: 'Values',
            width: '13%',
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

    const valueColumns = [
        { field: 'value', label: 'Value', width: '40%' },
        {
            field: 'colorCode',
            label: 'Color',
            width: '20%',
            render: (value) => (
                value ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: value }}
                        ></div>
                        <span className="text-sm">{value}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">-</span>
                )
            ),
        },
        {
            field: 'isActive',
            label: 'Status',
            width: '20%',
            render: (value) => (
                <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Attribute Management"
                description="Create and manage product attributes with their values"
                breadcrumbs={breadcrumbs}
            >
                <Button onClick={handleCreateClick} size="md">
                    <Plus size={20} /> Add Attribute
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <SearchBar
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="Search attributes..."
                    className="flex-1 min-w-250"
                />
                <Select
                    options={attributeTypes}
                    value={filters.type}
                    onChange={handleTypeFilter}
                    placeholder="Filter by Type"
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

            {/* Attributes Table */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={attributes}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />
                {/* Add Values button */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {attributes.length > 0 && (
                        <div className="space-y-2">
                            {attributes.map((attr) => (
                                <button
                                    key={attr._id}
                                    onClick={() => handleManageValues(attr)}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    ↳ Manage values for "{attr.name}"
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) =>
                        fetchAttributes(page, filters.search, filters.type, filters.status)
                    }
                />
            )}

            {/* Attribute Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormGroup label="Attribute Name" required>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Color, Size, Weight"
                        />
                    </FormGroup>

                    <FormGroup label="Attribute Type" required>
                        <Select
                            options={attributeTypes}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        />
                    </FormGroup>

                    <FormGroup label="Description">
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
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

                    <FormGroup>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isVariant}
                                onChange={(e) =>
                                    setFormData({ ...formData, isVariant: e.target.checked })
                                }
                                className="w-4 h-4 rounded accent-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Use for Product Variants
                            </span>
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                            Check this if variants should be created using this attribute
                        </p>
                    </FormGroup>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingAttribute ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Attribute Values Modal */}
            <Modal
                isOpen={showValueModal}
                onClose={() => setShowValueModal(false)}
                title={selectedAttribute ? `Manage Values - ${selectedAttribute.name}` : 'Manage Values'}
                size="lg"
            >
                <div className="space-y-4">
                    {/* Values Form */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="font-semibold text-sm mb-3">Add New Value</h3>
                        <form onSubmit={handleValueSubmit} className="space-y-3">
                            <FormGroup label="Value" required>
                                <Input
                                    value={valueFormData.value}
                                    onChange={(e) =>
                                        setValueFormData({ ...valueFormData, value: e.target.value })
                                    }
                                    placeholder="e.g., Red, Small, 100g"
                                />
                            </FormGroup>

                            {selectedAttribute?.type === 'ColorPicker' && (
                                <FormGroup label="Color Code">
                                    <Input
                                        type="color"
                                        value={valueFormData.colorCode}
                                        onChange={(e) =>
                                            setValueFormData({ ...valueFormData, colorCode: e.target.value })
                                        }
                                    />
                                </FormGroup>
                            )}

                            <Button variant="success" type="submit" size="sm" className="w-full">
                                <Plus size={16} /> Add Value
                            </Button>
                        </form>
                    </div>

                    {/* Values List */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Existing Values</h3>
                        <DataTable
                            columns={valueColumns}
                            data={attributeValues}
                            onDelete={handleDeleteValue}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AttributeManagement;
