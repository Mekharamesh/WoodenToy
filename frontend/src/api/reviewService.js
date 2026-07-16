import axios from 'axios';
import { dedupeRequest } from './requestDedupe';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reviews`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const reviewService = {
  getFeaturedReviews: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return dedupeRequest(`reviews:featured:${query}`, async () => {
      const res = await axios.get(`${API_URL}/featured`, { params });
      return res.data;
    });
  },

  getReviews: async (productId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return dedupeRequest(`reviews:${productId}:${query}`, async () => {
      const res = await axios.get(`${API_URL}/${productId}`, { params });
      return res.data;
    });
  },

  getGallery: async (productId) => {
    return dedupeRequest(`reviews:gallery:${productId}`, async () => {
      const res = await axios.get(`${API_URL}/${productId}/gallery`);
      return res.data;
    });
  },

  // Get the current user's own review for a product (null if none)
  getMyReview: async (productId) => {
    const res = await axios.get(`${API_URL}/${productId}/my-review`, {
      headers: getAuthHeaders(),
    });
    return res.data; // null or review object
  },

  getMyOrderItemReview: async (orderId, orderItemId) => {
    const res = await axios.get(`${API_URL}/order-item/${orderId}/${orderItemId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  createReview: async (productId, formData) => {
    const res = await axios.post(`${API_URL}/${productId}`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Update current user's existing review
  updateReview: async (productId, formData) => {
    const res = await axios.put(`${API_URL}/${productId}/my-review`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  voteReview: async (reviewId, vote) => {
    const res = await axios.put(`${API_URL}/${reviewId}/vote`, { vote }, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  deleteReview: async (reviewId) => {
    const res = await axios.delete(`${API_URL}/${reviewId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
};
