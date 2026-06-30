import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import { PageHeader, Button, SearchBar } from './CommonComponents';
import { Breadcrumb } from './Breadcrumb';
import VariantGenerator from './VariantGenerator';
import VariantTable from './VariantTable';
import VariantImageUpload from './VariantImageUpload';
import { variantAPI } from '../api/catalogAdminService';
import { useAdminStore } from '../store/adminStore';

/**
 * ProductVariantManagement Page
 * Complete interface for managing product variants
 */
export const ProductVariantManagement = ({ productId, onClose }) => {
    const [variants, setVariants] = useState([]);
    const [variantConfig, setVariantConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedVariantForImages, setSelectedVariantForImages] = useState(null);
    const { setBreadcrumbs } = useAdminStore();

    // Load variant configuration and existing variants
    useEffect(() => {
        loadVariantConfig();
        loadVariants();
    }, [productId]);

    // Set breadcrumbs
    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin', href: '/admin' },
            { label: 'Products', href: '/admin/products' },
            { label: 'Manage Variants' },
        ]);
    }, []);

    const loadVariantConfig = async () => {
        try {
            setLoading(true);
            const response = await variantAPI.getVariantConfig(productId);
            setVariantConfig(response.data.data);
        } catch (error) {
            toast.error('Failed to load variant configuration');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadVariants = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = await variantAPI.getVariants(productId, {
                page,
                limit: 20,
                search,
            });

            setVariants(response.data.data);
            setTotalPages(response.data.pagination.pages);
            setCurrentPage(page);
        } catch (error) {
            toast.error('Failed to load variants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateVariants = async (variantAttributeOptions) => {
        try {
            setLoading(true);
            const response = await variantAPI.generateVariants(productId, variantAttributeOptions);

            toast.success(`${response.data.data.created} variant(s) generated`);
            loadVariants(); // Reload variants
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate variants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditVariant = async (variantId, data) => {
        try {
            setLoading(true);
            await variantAPI.updateVariant(variantId, data);

            toast.success('Variant updated successfully');
            loadVariants(currentPage, searchTerm);
        } catch (error) {
            toast.error('Failed to update variant');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdate = async (variantIds, field, value) => {
        try {
            setLoading(true);
            const updates = variantIds.map((id) => ({
                variantId: id,
                data: { [field]: value },
            }));

            await variantAPI.bulkUpdateVariants(productId, updates);

            toast.success('Variants updated successfully');
            loadVariants(currentPage, searchTerm);
        } catch (error) {
            toast.error('Failed to update variants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVariant = async (variantId) => {
        if (!window.confirm('Are you sure you want to delete this variant?')) {
            return;
        }

        try {
            setLoading(true);
            await variantAPI.deleteVariant(variantId);

            toast.success('Variant deleted successfully');
            loadVariants(currentPage, searchTerm);
        } catch (error) {
            toast.error('Failed to delete variant');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVariantImages = async (images) => {
        try {
            setLoading(true);
            await variantAPI.addImages(selectedVariantForImages._id, images);

            toast.success('Images added successfully');
            loadVariants(currentPage, searchTerm);
            setSelectedVariantForImages(null);
        } catch (error) {
            toast.error('Failed to add images');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveVariantImage = async (imageIndex) => {
        try {
            setLoading(true);
            await variantAPI.removeImage(selectedVariantForImages._id, imageIndex);

            toast.success('Image removed successfully');
            loadVariants(currentPage, searchTerm);
        } catch (error) {
            toast.error('Failed to remove image');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        loadVariants(1, value);
    };

    if (!variantConfig) {
        return <div className="text-center py-12">Loading...</div>;
    }

    const dynamicColumns = variantConfig.dynamicColumns || [];

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb />

            {/* Page Header */}
            <PageHeader
                title="Manage Product Variants"
                description="Generate and manage all variant combinations for this product"
                actions={[
                    {
                        label: 'Back to Product',
                        onClick: onClose,
                        variant: 'secondary',
                        icon: ChevronLeft,
                    },
                ]}
            />

            {/* Variant Generator */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Variants</h2>
                <VariantGenerator
                    variantAttributes={variantConfig.variantAttributes}
                    onGenerate={handleGenerateVariants}
                    loading={loading}
                />
            </div>

            {/* Variants List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Variant Combinations ({variants.length})
                    </h2>
                    <button
                        onClick={() => loadVariants(currentPage, searchTerm)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                {variants.length > 0 && (
                    <div className="mb-4">
                        <SearchBar
                            placeholder="Search by SKU, barcode, or combination..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                )}

                {/* Variant Table */}
                <VariantTable
                    variants={variants}
                    dynamicColumns={dynamicColumns}
                    onEdit={handleEditVariant}
                    onDelete={handleDeleteVariant}
                    onBulkUpdate={handleBulkUpdate}
                    onViewImages={(variant) => setSelectedVariantForImages(variant)}
                    loading={loading}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => loadVariants(currentPage - 1, searchTerm)}
                                disabled={currentPage === 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => loadVariants(currentPage + 1, searchTerm)}
                                disabled={currentPage === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Upload Modal */}
            {selectedVariantForImages && (
                <VariantImageUpload
                    variant={selectedVariantForImages}
                    onAddImages={handleAddVariantImages}
                    onRemoveImage={handleRemoveVariantImage}
                    onClose={() => setSelectedVariantForImages(null)}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default ProductVariantManagement;
