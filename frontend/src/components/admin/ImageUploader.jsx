import React, { useRef, useState } from 'react';
import { Upload, X, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './CommonComponents';

export const ImageUploader = ({
    images = [],
    onChange,
    maxImages = 8
}) => {
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFiles = (files) => {
        const fileList = Array.from(files);
        const validImages = fileList.filter(file => file.type.startsWith('image/'));
        
        if (validImages.length === 0) return;

        // In a real application, you would upload to the backend here.
        // For local development, we create ObjectURLs for immediate display and simulation.
        const newImages = validImages.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return {
                url,
                altText: file.name.split('.')[0],
                isThumbnail: images.length === 0 && idx === 0, // set first image as thumbnail by default
                displayOrder: images.length + idx + 1
            };
        });

        const updated = [...images, ...newImages].slice(0, maxImages);
        onChange(updated);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFiles(e.target.files);
        }
    };

    const handleRemove = (index) => {
        const updated = images.filter((_, idx) => idx !== index);
        // If we deleted the thumbnail, set the first remaining image as thumbnail
        if (images[index]?.isThumbnail && updated.length > 0) {
            updated[0].isThumbnail = true;
        }
        onChange(updated);
    };

    const handleToggleThumbnail = (index) => {
        const updated = images.map((img, idx) => ({
            ...img,
            isThumbnail: idx === index
        }));
        onChange(updated);
    };

    const handleMove = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === images.length - 1) return;

        const updated = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        // Reset display order
        updated.forEach((img, idx) => {
            img.displayOrder = idx + 1;
        });

        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 ${
                    dragActive
                        ? 'border-amber-600 bg-amber-50/50'
                        : 'border-gray-300 hover:border-amber-500 hover:bg-gray-50/50'
                }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    multiple
                    accept="image/*"
                    className="hidden"
                />
                <div className="p-4 bg-amber-50 rounded-full text-amber-700 mb-3">
                    <Upload size={28} />
                </div>
                <p className="font-semibold text-gray-900 mb-1">
                    Drag and drop images, or <span className="text-amber-700 hover:underline">browse</span>
                </p>
                <p className="text-gray-500 text-xs">
                    Supports PNG, JPG, JPEG, WEBP up to 5MB (Max {maxImages} images)
                </p>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div
                            key={img.url + idx}
                            className={`group relative border rounded-xl overflow-hidden bg-gray-50 aspect-square flex flex-col justify-between transition-all ${
                                img.isThumbnail ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-gray-200'
                            }`}
                        >
                            <img
                                src={img.url}
                                alt={img.altText || 'product image'}
                                className="w-full h-full object-cover"
                            />

                            {/* Badges/Indicators */}
                            {img.isThumbnail && (
                                <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                    <Star size={8} fill="currentColor" /> Main
                                </span>
                            )}

                            {/* Operations overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleToggleThumbnail(idx)}
                                    title="Set as Thumbnail"
                                    className={`p-2 rounded-lg transition-colors ${
                                        img.isThumbnail ? 'bg-amber-600 text-white' : 'bg-white/90 text-gray-900 hover:bg-white'
                                    }`}
                                >
                                    <Star size={16} fill={img.isThumbnail ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(idx, 'up')}
                                    disabled={idx === 0}
                                    title="Move Up"
                                    className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white disabled:opacity-50"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(idx, 'down')}
                                    disabled={idx === images.length - 1}
                                    title="Move Down"
                                    className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white disabled:opacity-50"
                                >
                                    <ArrowDown size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    title="Delete Image"
                                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
