import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ==========================================
// CATEGORY API
// ==========================================
export const categoryAPI = {
    create: (data) => apiClient.post('/catalog/categories', data),
    bulkCreate: (data) => apiClient.post('/catalog/categories/bulk', data),
    getAll: (params) => apiClient.get('/catalog/categories', { params }),
    getById: (id) => apiClient.get(`/catalog/categories/${id}`),
    getAttributes: (id) => apiClient.get(`/catalog/categories/${id}/attributes`),
    update: (id, data) => apiClient.put(`/catalog/categories/${id}`, data),
    delete: (id) => apiClient.delete(`/catalog/categories/${id}`),
    toggleStatus: (id) => apiClient.patch(`/catalog/categories/${id}/toggle-status`),
};

// ==========================================
// SUB CATEGORY API
// ==========================================
export const subCategoryAPI = {
    create: (data) => apiClient.post('/catalog/subcategories', data),
    getAll: (params) => apiClient.get('/catalog/subcategories', { params }),
    getById: (id) => apiClient.get(`/catalog/subcategories/${id}`),
    update: (id, data) => apiClient.put(`/catalog/subcategories/${id}`, data),
    delete: (id) => apiClient.delete(`/catalog/subcategories/${id}`),
    toggleStatus: (id) => apiClient.patch(`/catalog/subcategories/${id}/toggle-status`),
    updateAttributes: (id, attributes) =>
        apiClient.patch(`/catalog/subcategories/${id}/attributes`, { attributes }),
};

// ==========================================
// ATTRIBUTE API
// ==========================================
export const attributeAPI = {
    create: (data) => apiClient.post('/catalog/attributes', data),
    getAll: (params) => apiClient.get('/catalog/attributes', { params }),
    getById: (id) => apiClient.get(`/catalog/attributes/${id}`),
    update: (id, data) => apiClient.put(`/catalog/attributes/${id}`, data),
    delete: (id) => apiClient.delete(`/catalog/attributes/${id}`),
    toggleStatus: (id) => apiClient.patch(`/catalog/attributes/${id}/toggle-status`),
    // Attribute Values
    createValue: (id, data) => apiClient.post(`/catalog/attributes/${id}/values`, data),
    getValues: (id, params) => apiClient.get(`/catalog/attributes/${id}/values`, { params }),
    updateValue: (id, data) => apiClient.put(`/catalog/attribute-values/${id}`, data),
    deleteValue: (id) => apiClient.delete(`/catalog/attribute-values/${id}`),
    toggleValueStatus: (id) => apiClient.patch(`/catalog/attribute-values/${id}/toggle-status`),
};

// ==========================================
// PRODUCT API
// ==========================================
export const productAPI = {
    create: (data) => apiClient.post('/catalog/products', data),
    getAll: (params) => apiClient.get('/catalog/products', { params }),
    getById: (id) => apiClient.get(`/catalog/products/${id}`),
    update: (id, data) => apiClient.put(`/catalog/products/${id}`, data),
    delete: (id) => apiClient.delete(`/catalog/products/${id}`),
    toggleStatus: (id) => apiClient.patch(`/catalog/products/${id}/toggle-status`),
    getSubCategoryAttributes: (subCategoryId) =>
        apiClient.get(`/catalog/subcategories/${subCategoryId}/attributes`),
    generateSKU: (categoryId, subCategoryId) =>
        apiClient.get('/catalog/sku/generate', { params: { category: categoryId, subCategory: subCategoryId } }),
};

// ==========================================
// UPLOAD API
// ==========================================
export const uploadAPI = {
    uploadImages: (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        return apiClient.post('/catalog/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteImage: (filename) => apiClient.delete(`/catalog/upload/${filename}`),
};

export default apiClient;

