import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, ToggleLeft, ToggleRight, Archive, Check } from 'lucide-react';
import { categoryV2API } from '../../../api/catalogV2Service';
import { SearchBar, Button, Badge, Card } from '../../../components/admin/CommonComponents';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import BulkActions from '../../../components/admin/BulkActions';

export const CategoriesPage = () => {
    // List state
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Form/Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        displayOrder: 1,
        isActive: true,
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        availableWoodTypes: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Selection/Bulk state
    const [selectedIds, setSelectedIds] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    useEffect(() => {
        fetchCategories();
    }, [search, isActiveFilter, page]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryV2API.getAll({
                search,
                isActive: isActiveFilter,
                page,
                limit: 10,
            });
            if (res.success) {
                setCategories(res.categories || []);
                setTotalPages(res.pagination?.pages || 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRow = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(categories.map(c => c._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleOpenForm = (category = null) => {
        if (category) {
            setEditId(category._id);
            setFormData({
                name: category.name || '',
                slug: category.slug || '',
                description: category.description || '',
                displayOrder: category.displayOrder || 1,
                isActive: category.isActive !== undefined ? category.isActive : true,
                seoTitle: category.seoTitle || '',
                seoDescription: category.seoDescription || '',
                seoKeywords: Array.isArray(category.seoKeywords) ? category.seoKeywords.join(', ') : '',
                availableWoodTypes: Array.isArray(category.availableWoodTypes) ? category.availableWoodTypes.join(', ') : '',
            });
        } else {
            setEditId(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                displayOrder: 1,
                isActive: true,
                seoTitle: '',
                seoDescription: '',
                seoKeywords: '',
                availableWoodTypes: '',
            });
        }
        setErrorMsg('');
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setErrorMsg('');

        // Parse list fields
        const payload = {
            ...formData,
            seoKeywords: formData.seoKeywords.split(',').map(s => s.trim()).filter(Boolean),
            availableWoodTypes: formData.availableWoodTypes.split(',').map(s => s.trim()).filter(Boolean),
            displayOrder: Number(formData.displayOrder),
        };

        try {
            if (editId) {
                await categoryV2API.update(editId, payload);
            } else {
                await categoryV2API.create(payload);
            }
            setIsFormOpen(false);
            fetchCategories();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save category');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmAction(() => async () => {
            await categoryV2API.delete(id);
            fetchCategories();
            setIsConfirmOpen(false);
        });
        setConfirmMessage('Are you sure you want to delete this category? This will soft-delete the category.');
        setIsConfirmOpen(true);
    };

    const handleBulkDelete = () => {
        setConfirmAction(() => async () => {
            await categoryV2API.bulkDelete(selectedIds);
            setSelectedIds([]);
            fetchCategories();
            setIsConfirmOpen(false);
        });
        setConfirmMessage(`Are you sure you want to delete the ${selectedIds.length} selected categories?`);
        setIsConfirmOpen(true);
    };

    const handleBulkStatus = async (isActive) => {
        setLoading(true);
        try {
            await categoryV2API.bulkStatus(selectedIds, isActive);
            setSelectedIds([]);
            fetchCategories();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            await categoryV2API.update(category._id, { isActive: !category.isActive });
            fetchCategories();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage main product categories, SEO settings, and wood preferences.</p>
                </div>
                <Button onClick={() => handleOpenForm()} className="shadow-lg hover:shadow-xl transition-all">
                    <Plus size={20} />
                    Add Category
                </Button>
            </div>

            {/* Filters panel */}
            <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search categories..."
                    className="w-full sm:max-w-xs"
                />
                <select
                    value={isActiveFilter}
                    onChange={(e) => setIsActiveFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </Card>

            {/* Bulk actions */}
            <BulkActions
                selectedIds={selectedIds}
                onBulkDelete={handleBulkDelete}
                onBulkStatusChange={handleBulkStatus}
            />

            {/* Data Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === categories.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4">Category Name</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Display Order</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-400">
                                        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        Loading categories...
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-400">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((cat) => (
                                    <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(cat._id)}
                                                onChange={(e) => handleSelectRow(cat._id, e.target.checked)}
                                                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                                        <td className="px-6 py-4">{cat.displayOrder}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(cat)}
                                                className="focus:outline-none hover:opacity-80 transition-opacity"
                                            >
                                                {cat.isActive ? (
                                                    <Badge variant="green">Active</Badge>
                                                ) : (
                                                    <Badge variant="gray">Inactive</Badge>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenForm(cat)}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-amber-700 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(cat._id)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Add/Edit Drawer Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-left">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editId ? 'Edit Category' : 'Create Category'}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Drawer content */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Category Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Building Blocks"
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Slug (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="e.g. building-blocks"
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter category description..."
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Display Order</label>
                                        <input
                                            type="number"
                                            value={formData.displayOrder}
                                            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 justify-center mt-6">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                                className="rounded text-amber-600 focus:ring-amber-500"
                                            />
                                            Active Status
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-6">
                                    <h3 className="font-bold text-gray-800 text-sm mb-3">SEO & Metadata Settings</h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-gray-600">SEO Title</label>
                                            <input
                                                type="text"
                                                value={formData.seoTitle}
                                                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                                placeholder="Meta title for Google search"
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-gray-600">SEO Description</label>
                                            <textarea
                                                rows={2}
                                                value={formData.seoDescription}
                                                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                                                placeholder="Meta description for search snippets"
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-gray-600">SEO Keywords (comma separated)</label>
                                            <input
                                                type="text"
                                                value={formData.seoKeywords}
                                                onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                                                placeholder="toys, blocks, stacking"
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-6">
                                    <h3 className="font-bold text-gray-800 text-sm mb-3">Preferences</h3>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-gray-600">Available Wood Types (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.availableWoodTypes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, availableWoodTypes: e.target.value }))}
                                            placeholder="Oak, Pine, Maple"
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" loading={formLoading}>
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmAction}
                message={confirmMessage}
            />
        </div>
    );
};

export default CategoriesPage;
