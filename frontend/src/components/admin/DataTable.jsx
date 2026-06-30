import React from 'react';
import { Edit, Trash2, Check, X, Eye } from 'lucide-react';
import { Button, Badge } from './CommonComponents';

export const DataTable = ({ 
    columns, 
    data, 
    loading = false, 
    onEdit = null, 
    onDelete = null, 
    onView = null,
    onToggleStatus = null,
    rowKey = '_id',
    className = ''
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 text-center">
                    <span className="text-4xl mb-2 block">📭</span>
                    No data found
                </p>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {columns.map((column) => (
                            <th
                                key={column.field}
                                className="px-6 py-3 text-left text-sm font-medium text-gray-700"
                                style={{ width: column.width }}
                            >
                                {column.label}
                            </th>
                        ))}
                        {(onEdit || onDelete || onView || onToggleStatus) && (
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={row[rowKey] || index}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            {columns.map((column) => (
                                <td
                                    key={`${row[rowKey]}-${column.field}`}
                                    className="px-6 py-4 text-sm text-gray-900"
                                >
                                    {column.render ? column.render(row[column.field], row) : row[column.field]}
                                </td>
                            ))}
                            {(onEdit || onDelete || onView || onToggleStatus) && (
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {onView && (
                                            <button
                                                onClick={() => onView(row)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(row)}
                                                className="text-amber-600 hover:text-amber-800 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}
                                        {onToggleStatus && (
                                            <button
                                                onClick={() => onToggleStatus(row)}
                                                className={`transition-colors ${
                                                    row.isActive
                                                        ? 'text-green-600 hover:text-green-800'
                                                        : 'text-red-600 hover:text-red-800'
                                                }`}
                                                title={row.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {row.isActive ? <Check size={18} /> : <X size={18} />}
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(row)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
    return (
        <div className={`flex items-center justify-between py-4 ${className}`}>
            <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default { DataTable, Pagination };
