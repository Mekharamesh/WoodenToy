import React from 'react';
import { Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './CommonComponents';

export const BulkActions = ({
    selectedIds = [],
    onBulkDelete,
    onBulkStatusChange,
    loading = false
}) => {
    if (selectedIds.length === 0) return null;

    return (
        <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-6 shadow-sm animate-slide-down">
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold text-amber-900 text-sm">
                    {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                {onBulkStatusChange && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkStatusChange(true)}
                            disabled={loading}
                            className="bg-white border-green-600 text-green-700 hover:bg-green-50"
                        >
                            <CheckCircle2 size={16} />
                            Activate
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onBulkStatusChange(false)}
                            disabled={loading}
                            className="bg-white border-gray-400 text-gray-700 hover:bg-gray-50"
                        >
                            <XCircle size={16} />
                            Deactivate
                        </Button>
                    </>
                )}
                {onBulkDelete && (
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onBulkDelete}
                        disabled={loading}
                    >
                        <Trash2 size={16} />
                        Delete Selected
                    </Button>
                )}
            </div>
        </div>
    );
};

export default BulkActions;
