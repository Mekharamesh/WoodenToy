import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await axios.post(API_URL, orderData, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  getOrderById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  },

  getMyOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/myorders`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your orders');
    }
  },

  getAllOrders: async () => {
    try {
      const response = await axios.get(API_URL, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all orders');
    }
  },

  updateOrderToDelivered: async (id) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/deliver`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark as delivered');
    }
  },
  
  updateOrderToPaid: async (id, paymentResult) => {
      try {
        const response = await axios.put(`${API_URL}/${id}/pay`, paymentResult, getAuthHeaders());
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update payment status');
      }
  }
};
