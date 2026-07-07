import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  };
};

const withAuthRetry = async (requestFn, fallbackMessage) => {
  try {
    const response = await requestFn(getAuthHeaders());
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const refreshed = await authService.refreshSession();
      if (refreshed) {
        const retryResponse = await requestFn(getAuthHeaders());
        return retryResponse.data;
      }
      authService.logout();
      window.location.href = '/?view=login';
      throw new Error('Session expired, please log in again.');
    }
    throw new Error(error.response?.data?.message || error.message || fallbackMessage);
  }
};

export const adminService = {
  getCancellationRules: async () => {
    return withAuthRetry(
      (config) => axios.get(`${API_URL}/cancellation-rules`, config),
      'Failed to load cancellation rules'
    );
  },

  createCancellationRule: async (ruleData) => {
    return withAuthRetry(
      (config) => axios.post(`${API_URL}/cancellation-rules`, ruleData, config),
      'Failed to create cancellation rule'
    );
  },

  updateCancellationRule: async (id, ruleData) => {
    return withAuthRetry(
      (config) => axios.put(`${API_URL}/cancellation-rules/${id}`, ruleData, config),
      'Failed to update cancellation rule'
    );
  },

  deleteCancellationRule: async (id) => {
    return withAuthRetry(
      (config) => axios.delete(`${API_URL}/cancellation-rules/${id}`, config),
      'Failed to delete cancellation rule'
    );
  },

  seedCancellationRules: async () => {
    return withAuthRetry(
      (config) => axios.post(`${API_URL}/cancellation-rules/seed`, {}, config),
      'Failed to seed cancellation rules'
    );
  },

  getRefunds: async () => {
    return withAuthRetry(
      (config) => axios.get(`${API_URL}/refunds`, config),
      'Failed to load refunds'
    );
  },

  seedRefunds: async () => {
    return withAuthRetry(
      (config) => axios.post(`${API_URL}/refunds/seed`, {}, config),
      'Failed to seed refunds'
    );
  },

  approveRefund: async (id) => {
    return withAuthRetry(
      (config) => axios.put(`${API_URL}/refunds/${id}/approve`, {}, config),
      'Failed to approve refund'
    );
  },

  getDashboardStats: async () => {
    return withAuthRetry(
      (config) => axios.get(`${API_URL}/orders/dashboard-stats`, config),
      'Failed to fetch dashboard stats'
    );
  },

  getCustomers: async () => {
    return withAuthRetry(
      (config) => axios.get(`${API_URL}/auth/customers`, config),
      'Failed to fetch customers'
    );
  },

  getCustomerOrders: async (userId) => {
    return withAuthRetry(
      (config) => axios.get(`${API_URL}/auth/customers/${userId}/orders`, config),
      'Failed to fetch customer orders'
    );
  },
};
