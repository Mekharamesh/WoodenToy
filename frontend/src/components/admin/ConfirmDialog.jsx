import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './CommonComponents';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to perform this action?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false
}) => {
    if (!isOpen) return null;

    const variantColors = {
        danger: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200',
        warning: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200',
        success: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200',
        primary: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-transform duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full border ${variantColors[variant]}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button 
                        variant={variant === 'danger' ? 'danger' : 'primary'} 
                        onClick={onConfirm} 
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
