import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Button, Badge } from './CommonComponents';

/**
 * VariantGenerator Component
 * Generates all possible variant combinations from selected variant attributes
 */
export const VariantGenerator = ({ variantAttributes, onGenerate, loading }) => {
    const [expanded, setExpanded] = useState(false);
    const [selectedValues, setSelectedValues] = useState({});
    const [combinationCount, setCombinationCount] = useState(0);

    // Calculate number of combinations (Cartesian product)
    useEffect(() => {
        calculateCombinations();
    }, [selectedValues]);

    const calculateCombinations = () => {
        if (!variantAttributes || variantAttributes.length === 0) {
            setCombinationCount(0);
            return;
        }

        let total = 1;
        for (const attr of variantAttributes) {
            const selected = selectedValues[attr._id] || [];
            if (selected.length === 0) {
                total = 0;
                break;
            }
            total *= selected.length;
        }
        setCombinationCount(total);
    };

    const handleValueToggle = (attributeId, value) => {
        setSelectedValues((prev) => {
            const current = prev[attributeId] || [];
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];

            return {
                ...prev,
                [attributeId]: updated,
            };
        });
    };

    const handleSelectAll = (attributeId, values) => {
        setSelectedValues((prev) => ({
            ...prev,
            [attributeId]: values.map((v) => v.value),
        }));
    };

    const handleClearAll = (attributeId) => {
        setSelectedValues((prev) => ({
            ...prev,
            [attributeId]: [],
        }));
    };

    const handleGenerateVariants = async () => {
        // Transform selectedValues to the format expected by the API
        const variantAttributeOptions = variantAttributes.map((attr) => ({
            attributeId: attr._id,
            attributeName: attr.name,
            values: selectedValues[attr._id] || [],
        }));

        await onGenerate(variantAttributeOptions);

        // Reset form after generation
        setSelectedValues({});
        setExpanded(false);
    };

    const allAttributesSelected = variantAttributes.every(
        (attr) => (selectedValues[attr._id] || []).length > 0
    );

    if (!variantAttributes || variantAttributes.length === 0) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-amber-800 font-medium">No Variant Attributes</p>
                    <p className="text-amber-700 text-sm mt-1">
                        This subcategory has no attributes marked as variants. Map variant attributes to this subcategory first.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                        <p className="font-semibold text-gray-900">Generate Variants</p>
                        <p className="text-sm text-gray-600">
                            {variantAttributes.length} variant attribute
                            {variantAttributes.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Content */}
            {expanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-6">
                    {/* Attributes */}
                    {variantAttributes.map((attr) => (
                        <div key={attr._id} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{attr.name}</p>
                                    <p className="text-sm text-gray-600">
                                        <Badge variant="gray" size="sm">
                                            {attr.type}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleSelectAll(
                                                attr._id,
                                                attr.values || []
                                            )
                                        }
                                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={() => handleClearAll(attr._id)}
                                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Values Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {attr.values && attr.values.length > 0 ? (
                                    attr.values.map((value) => (
                                        <label
                                            key={value._id}
                                            className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(selectedValues[attr._id] || []).includes(value.value)}
                                                onChange={() =>
                                                    handleValueToggle(attr._id, value.value)
                                                }
                                                className="w-4 h-4 rounded accent-blue-600"
                                            />
                                            <span className="text-sm text-gray-700 flex-1">
                                                {value.value}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 col-span-full">
                                        No values available
                                    </p>
                                )}
                            </div>

                            {/* Selected count */}
                            <p className="text-xs text-gray-600">
                                {selectedValues[attr._id]?.length || 0} of{' '}
                                {attr.values?.length || 0} selected
                            </p>
                        </div>
                    ))}

                    {/* Combination Preview */}
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Total Combinations
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Cartesian product of selected values
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">
                                    {combinationCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="primary"
                            disabled={!allAttributesSelected || loading || combinationCount === 0}
                            onClick={handleGenerateVariants}
                            loading={loading}
                        >
                            Generate {combinationCount} Variant
                            {combinationCount !== 1 ? 's' : ''}
                        </Button>
                        <button
                            onClick={() => setExpanded(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantGenerator;
