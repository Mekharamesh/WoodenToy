import React, { useState } from 'react';
import {
    Upload,
    X,
    Eye,
    Trash2,
    GripVertical,
} from 'lucide-react';
import { Button } from './CommonComponents';

/**
 * VariantImageUpload Component
 * Handles image upload, preview, and management for product variants
 */
export const VariantImageUpload = ({
    variant,
    onAddImages,
    onRemoveImage,
    onClose,
    loading,
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [imageInput, setImageInput] = useState('');
    const [previewIndex, setPreviewIndex] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    };

    const handleFiles = (files) => {
        // In a real implementation, upload files to server and get URLs
        // For now, using URL input
        console.log('Files to upload:', files);
        // You would typically:
        // 1. Upload files to storage (S3, Cloudinary, etc.)
        // 2. Get URLs back
        // 3. Call onAddImages with URLs
    };

    const handleAddImageUrl = () => {
        if (imageInput.trim()) {
            onAddImages([imageInput.trim()]);
            setImageInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Manage Variant Images
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {variant?.variantCombination || 'Variant'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Upload Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-gray-50'
                        }`}
                    >
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="font-medium text-gray-900">
                            Drag and drop images here
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            or{' '}
                            <label className="text-blue-600 hover:underline cursor-pointer">
                                click to browse
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="hidden"
                                />
                            </label>
                        </p>
                    </div>

                    {/* Image URL Input */}
                    <div className="flex gap-2">
                        <input
                            type="url"
                            placeholder="Or paste image URL..."
                            value={imageInput}
                            onChange={(e) => setImageInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddImageUrl();
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddImageUrl}
                            disabled={!imageInput.trim() || loading}
                        >
                            Add
                        </Button>
                    </div>

                    {/* Current Images */}
                    {variant?.images && variant.images.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">
                                Current Images ({variant.images.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {variant.images.map((image, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                                    >
                                        <img
                                            src={image}
                                            alt={`Variant ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src =
                                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
                                            }}
                                        />
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setPreviewIndex(idx)}
                                                className="p-2 bg-white/90 rounded hover:bg-white"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4 text-gray-900" />
                                            </button>
                                            <button
                                                onClick={() => onRemoveImage(idx)}
                                                className="p-2 bg-red-500/90 rounded hover:bg-red-600"
                                                title="Remove"
                                                disabled={loading}
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                        </div>

                                        {/* Image Index */}
                                        <div className="absolute top-1 left-1 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                            {idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!variant?.images || variant.images.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No images yet</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 flex justify-end gap-2 sticky bottom-0 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded font-medium"
                    >
                        Done
                    </button>
                </div>

                {/* Preview Modal */}
                {previewIndex !== null && (
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                        onClick={() => setPreviewIndex(null)}
                    >
                        <div className="relative max-w-2xl max-h-96">
                            <button
                                onClick={() => setPreviewIndex(null)}
                                className="absolute top-4 right-4 p-2 bg-white rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <img
                                src={variant.images[previewIndex]}
                                alt={`Preview ${previewIndex + 1}`}
                                className="w-full h-auto rounded"
                            />
                            <p className="text-white text-center mt-4">
                                Image {previewIndex + 1} of {variant.images.length}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VariantImageUpload;
