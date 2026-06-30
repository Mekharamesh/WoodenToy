import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Eye, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { Button, Badge } from './CommonComponents';

/**
 * VariantTable Component
 * Dynamic table that displays variant columns based on variant attributes
 * Followed by static operational columns
 */
export const VariantTable = ({
    variants,
    dynamicColumns,
    onEdit,
    onDelete,
    onBulkUpdate,
    onViewImages,
    loading,
}) => {
    const [selectedVariants, setSelectedVariants] = useState(new Set());
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Static columns that always appear after dynamic ones
    const staticColumns = [
        { id: 'inventory', label: 'Inventory', type: 'number' },
        { id: 'basePrice', label: 'Base Price', type: 'number' },
        { id: 'discountPrice', label: 'Discount', type: 'number' },
        { id: 'costPrice', label: 'Cost Price', type: 'number' },
        { id: 'sku', label: 'SKU', type: 'text' },
        { id: 'barcode', label: 'Barcode', type: 'text' },
        { id: 'weight', label: 'Weight', type: 'number' },
        { id: 'length', label: 'Length', type: 'number' },
        { id: 'width', label: 'Width', type: 'number' },
        { id: 'height', label: 'Height', type: 'number' },
        { id: 'status', label: 'Status', type: 'status' },
        { id: 'isPrimary', label: 'Primary', type: 'checkbox' },
        { id: 'images', label: 'Images', type: 'images' },
    ];

    // Sort variants
    const sortedVariants = useMemo(() => {
        return [...(variants || [])].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [variants, sortBy, sortOrder]);

    const toggleSelectVariant = (variantId) => {
        const newSelected = new Set(selectedVariants);
        if (newSelected.has(variantId)) {
            newSelected.delete(variantId);
        } else {
            newSelected.add(variantId);
        }
        setSelectedVariants(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedVariants.size === sortedVariants.length) {
            setSelectedVariants(new Set());
        } else {
            setSelectedVariants(new Set(sortedVariants.map((v) => v._id)));
        }
    };

    const startEdit = (variant) => {
        setEditingId(variant._id);
        setEditData({
            inventory: variant.inventory,
            basePrice: variant.basePrice,
            discountPrice: variant.discountPrice || '',
            costPrice: variant.costPrice || '',
            sku: variant.sku,
            barcode: variant.barcode || '',
            weight: variant.weight || '',
            length: variant.length || '',
            width: variant.width || '',
            height: variant.height || '',
            isActive: variant.isActive,
            isPrimary: variant.isPrimary,
        });
    };

    const saveEdit = async () => {
        if (editingId) {
            await onEdit(editingId, editData);
            setEditingId(null);
            setEditData({});
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleInputChange = (field, value) => {
        setEditData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const renderDynamicCell = (variant, column) => {
        const option = variant.options?.find(
            (opt) => opt.attributeId === column.attributeId
        );
        return option ? option.value : '-';
    };

    const renderStaticCell = (variant, column) => {
        if (editingId === variant._id) {
            switch (column.type) {
                case 'number':
                    return (
                        <input
                            type="number"
                            value={editData[column.id] || ''}
                            onChange={(e) =>
                                handleInputChange(column.id, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    );
                case 'text':
                    return (
                        <input
                            type="text"
                            value={editData[column.id] || ''}
                            onChange={(e) =>
                                handleInputChange(column.id, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    );
                case 'checkbox':
                    return (
                        <input
                            type="checkbox"
                            checked={editData[column.id] || false}
                            onChange={(e) =>
                                handleInputChange(column.id, e.target.checked)
                            }
                            className="w-4 h-4 rounded accent-blue-600"
                        />
                    );
                case 'status':
                    return (
                        <select
                            value={editData.isActive ? 'active' : 'inactive'}
                            onChange={(e) =>
                                handleInputChange('isActive', e.target.value === 'active')
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    );
                case 'images':
                    return (
                        <button
                            onClick={() => onViewImages(variant)}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            {variant.images?.length || 0} images
                        </button>
                    );
                default:
                    return '-';
            }
        }

        switch (column.type) {
            case 'number':
                return variant[column.id] || '-';
            case 'text':
                return variant[column.id] || '-';
            case 'checkbox':
                return variant[column.id] ? '✓' : '';
            case 'status':
                return (
                    <Badge
                        variant={variant.isActive ? 'green' : 'gray'}
                        size="sm"
                    >
                        {variant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            case 'images':
                return (
                    <button
                        onClick={() => onViewImages(variant)}
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                        <ImageIcon className="w-4 h-4" />
                        {variant.images?.length || 0}
                    </button>
                );
            default:
                return '-';
        }
    };

    if (!variants || variants.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No variants yet. Generate variants to get started.</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header with selection info */}
            {selectedVariants.size > 0 && (
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-900">
                        {selectedVariants.size} variant{selectedVariants.size !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onBulkUpdate(Array.from(selectedVariants), 'status', true)}
                        >
                            Activate
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onBulkUpdate(Array.from(selectedVariants), 'status', false)}
                        >
                            Deactivate
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                            {/* Select All Checkbox */}
                            <th className="px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedVariants.size === sortedVariants.length &&
                                        sortedVariants.length > 0
                                    }
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded accent-blue-600"
                                />
                            </th>

                            {/* Dynamic Columns */}
                            {dynamicColumns.map((col) => (
                                <th
                                    key={col.attributeId}
                                    className="px-4 py-3 text-left font-medium text-gray-900 bg-blue-50"
                                >
                                    {col.name}
                                </th>
                            ))}

                            {/* Static Columns */}
                            {staticColumns.map((col) => (
                                <th
                                    key={col.id}
                                    className="px-4 py-3 text-left font-medium text-gray-900"
                                >
                                    {col.label}
                                </th>
                            ))}

                            {/* Actions */}
                            <th className="px-4 py-3 text-left font-medium text-gray-900 sticky right-0 bg-gray-50">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedVariants.map((variant, idx) => (
                            <tr
                                key={variant._id}
                                className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                                    selectedVariants.has(variant._id) ? 'bg-blue-50' : ''
                                } ${editingId === variant._id ? 'bg-yellow-50' : ''}`}
                            >
                                {/* Select Checkbox */}
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedVariants.has(variant._id)}
                                        onChange={() => toggleSelectVariant(variant._id)}
                                        className="w-4 h-4 rounded accent-blue-600"
                                    />
                                </td>

                                {/* Dynamic Cells */}
                                {dynamicColumns.map((col) => (
                                    <td
                                        key={`${variant._id}-${col.attributeId}`}
                                        className="px-4 py-3 font-medium text-gray-900 bg-blue-50/50"
                                    >
                                        {renderDynamicCell(variant, col)}
                                    </td>
                                ))}

                                {/* Static Cells */}
                                {staticColumns.map((col) => (
                                    <td
                                        key={`${variant._id}-${col.id}`}
                                        className="px-4 py-3 text-gray-700"
                                    >
                                        {renderStaticCell(variant, col)}
                                    </td>
                                ))}

                                {/* Actions */}
                                <td className="px-4 py-3 sticky right-0 bg-gray-50/50">
                                    <div className="flex gap-2">
                                        {editingId === variant._id ? (
                                            <>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={saveEdit}
                                                    loading={loading}
                                                >
                                                    Save
                                                </Button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEdit(variant)}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(variant._id)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VariantTable;
