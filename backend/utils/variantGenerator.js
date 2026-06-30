/**
 * Utility functions for Product Variant generation
 */

/**
 * Generate Cartesian product of variant attributes
 * @param {Array} variantAttributeValues - Array of { attributeId, attributeName, values: [...] }
 * @returns {Array} Array of variant combinations
 */
function generateCartesianProduct(variantAttributeValues) {
    if (!variantAttributeValues || variantAttributeValues.length === 0) {
        return [];
    }

    // Extract just the values arrays
    const valueArrays = variantAttributeValues.map(attr => 
        attr.values.map(val => ({ 
            attributeId: attr.attributeId, 
            attributeName: attr.attributeName,
            value: val 
        }))
    );

    // Generate Cartesian product
    return cartesianProduct(valueArrays);
}

/**
 * Recursive Cartesian product implementation
 * @param {Array} arrays - Array of arrays
 * @returns {Array} Cartesian product result
 */
function cartesianProduct(arrays) {
    if (arrays.length === 0) return [[]];
    
    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);
    
    return first.flatMap(item => 
        restProduct.map(combination => [item, ...combination])
    );
}

/**
 * Create variant combination string
 * @param {Array} options - Array of { value, attributeName }
 * @returns {String} Combination string like "Pine-Red-Small"
 */
function generateVariantCombination(options) {
    return options
        .map(opt => opt.value)
        .join('-');
}

/**
 * Auto-generate SKU for variant
 * @param {String} productSlug - Product slug
 * @param {Array} options - Variant options
 * @param {String} productCode - Optional product code
 * @returns {String} Generated SKU
 */
function generateVariantSKU(productSlug, options, productCode = null) {
    // Format: PRODUCT-CODE-VARIANT-OPTIONS
    // Example: WOOD-CAR-PINE-RED-S
    
    const baseCode = productCode 
        ? productCode.toUpperCase() 
        : productSlug.split('-')[0].toUpperCase(); // Take first word of slug
    
    const variantParts = options.map(opt => {
        // Take first 3 characters or full value if shorter
        return opt.value.substring(0, 3).toUpperCase();
    });
    
    return [baseCode, ...variantParts].join('-');
}

/**
 * Detect changes in variant attributes and values
 * @param {Array} oldVariantIds - Old variant attribute IDs
 * @param {Array} newVariantIds - New variant attribute IDs
 * @returns {Object} { added, removed, common }
 */
function detectVariantChanges(oldVariantIds, newVariantIds) {
    const oldSet = new Set(oldVariantIds.map(id => id.toString()));
    const newSet = new Set(newVariantIds.map(id => id.toString()));
    
    const added = Array.from(newSet).filter(id => !oldSet.has(id));
    const removed = Array.from(oldSet).filter(id => !newSet.has(id));
    const common = Array.from(oldSet).filter(id => newSet.has(id));
    
    return { added, removed, common };
}

/**
 * Generate only missing variant combinations
 * @param {Array} existingCombinations - Existing variant combination strings
 * @param {Array} allPossibleCombinations - All new possible combinations
 * @returns {Array} Only new combinations not in existing
 */
function findMissingCombinations(existingCombinations, allPossibleCombinations) {
    const existingSet = new Set(existingCombinations);
    return allPossibleCombinations.filter(combo => !existingSet.has(combo));
}

/**
 * Check for affected variants when removing an attribute value
 * @param {Array} existingVariants - Existing variant documents
 * @param {String} attributeId - Attribute ID to check
 * @param {String} valueToRemove - Value being removed
 * @returns {Array} Affected variant IDs
 */
function findAffectedVariants(existingVariants, attributeId, valueToRemove) {
    // This would be done in the controller with ProductVariantOption queries
    // This is just a utility to help identify affected variants
    return [];
}

/**
 * Prepare bulk variant data for insertion
 * @param {String} productId - Product ID
 * @param {Array} combinations - Array of option combinations
 * @param {Array} variantAttributeIds - Sorted attribute IDs for ordering
 * @returns {Array} Formatted variant data
 */
function prepareBulkVariantData(productId, combinations, variantAttributeIds) {
    const variants = [];
    
    combinations.forEach(optionCombo => {
        const combination = generateVariantCombination(optionCombo);
        
        variants.push({
            product: productId,
            variantCombination: combination,
            basePrice: 0, // Will be set by admin
            inventory: 0, // Will be set by admin
            images: [],
            isActive: true,
            isPrimary: false,
            options: optionCombo.map((opt, idx) => ({
                attribute: variantAttributeIds[idx],
                value: opt.value,
            })),
        });
    });
    
    return variants;
}

module.exports = {
    generateCartesianProduct,
    cartesianProduct,
    generateVariantCombination,
    generateVariantSKU,
    detectVariantChanges,
    findMissingCombinations,
    findAffectedVariants,
    prepareBulkVariantData,
};
