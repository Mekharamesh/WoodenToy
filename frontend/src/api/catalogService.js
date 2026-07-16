import { authService } from './authService';
import { dedupeRequest } from './requestDedupe';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/catalog`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const publicJsonRequest = async (url, options = {}) => (
  dedupeRequest(`catalog:${url}`, async () => {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data.data ? data.data : data;
  })
);

// Helper for authenticated requests with retry on 401
const authenticatedRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store', // Always fetch fresh data from MongoDB
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token might have expired, try to refresh
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        // Retry request with new token headers
        const retryResponse = await fetch(url, {
          ...options,
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
          },
        });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || 'Request failed after refresh');
        }
        return retryData;
      } else {
        authService.logout();
        window.location.reload(); // Force refresh to redirect to login
        throw new Error('Session expired, please log in again.');
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data ? data.data : data;
  } catch (error) {
    throw error;
  }
};

export const catalogService = {
  // Get all products
  getProducts: async () => {
    try {
      return await publicJsonRequest(`${API_BASE_URL}/product`);
    } catch (error) {
      console.error('Catalog API Error:', error);
      throw error;
    }
  },

  // Get a single product by id
  getProductById: async (productId) => {
    try {
      return await publicJsonRequest(`${API_BASE_URL}/product/${productId}`);
    } catch (error) {
      console.error('Catalog API Error:', error);
      throw error;
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      return await publicJsonRequest(`${API_BASE_URL}/category?limit=1000`, { cache: 'default' });
    } catch (error) {
      console.error('Category API Error:', error);
      throw error;
    }
  },

  // Create category
  createCategory: async (data) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/category`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Create Category API Error:', error);
      throw error;
    }
  },

  // Update a category
  updateCategory: async (categoryId, categoryData) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/category/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
    } catch (error) {
      console.error('Update Category API Error:', error);
      throw error;
    }
  },

  // Bulk create a category
  bulkCreateCategory: async (categoryData) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/categories/bulk`, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
    } catch (error) {
      console.error('Bulk Create Category API Error:', error);
      throw error;
    }
  },

  // Toggle Category Status
  toggleCategoryStatus: async (categoryId) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/categories/${categoryId}/toggle-status`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Toggle Category Status API Error:', error);
      throw error;
    }
  },

  // Get Sub Categories
  getSubCategories: async () => {
    try {
      return await publicJsonRequest(`${API_BASE_URL}/subcategories?limit=1000`, { cache: 'default' });
    } catch (error) {
      console.error('Subcategory API Error:', error);
      throw error;
    }
  },

  // Delete a category
  deleteCategory: async (categoryId) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/category/${categoryId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete Category API Error:', error);
      throw error;
    }
  },

  // Create a product
  createProduct: async (productData) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/product`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    } catch (error) {
      console.error('Create Product API Error:', error);
      throw error;
    }
  },

  // Create/Initialize inventory
  createInventory: async (inventoryData) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        body: JSON.stringify(inventoryData),
      });
    } catch (error) {
      console.error('Create Inventory API Error:', error);
      throw error;
    }
  },

  // Update inventory
  updateInventory: async (productId, inventoryData) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/inventory/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData),
      });
    } catch (error) {
      console.error('Update Inventory API Error:', error);
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (productId) => {
    try {
      return await authenticatedRequest(`${API_BASE_URL}/product/${productId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete Product API Error:', error);
      throw error;
    }
  },

  // Get shop categories (main categories for homepage display)
  getShopCategories: async () => {
    try {
      const data = await publicJsonRequest(`${API_BASE_URL}/shop-categories`);
      return Array.isArray(data) ? { data } : data;
    } catch (error) {
      console.error('Shop Categories API Error:', error);
      throw error;
    }
  },
};
