/**
 * Cashfree Payment API Service (Frontend)
 * -----------------------------------------
 * Handles communication with our backend payment endpoints.
 * Credentials are NEVER stored in the frontend — only in backend .env
 */

import { API_URL } from '../config/api';

const API_BASE = API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

import { authService } from './authService';

/**
 * Step 1: Request a Cashfree payment session from our backend
 * @param {string} orderId  - MongoDB order _id
 * @returns {{ paymentSessionId, cfOrderId, orderId }}
 */
export const createCashfreeSession = async (orderId) => {
  let res = await fetch(`${API_BASE}/payment/cashfree/create-session`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId }),
  });

  if (res.status === 401) {
    const refreshed = await authService.refreshSession();
    if (refreshed) {
      res = await fetch(`${API_BASE}/payment/cashfree/create-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderId }),
      });
    } else {
      authService.logout();
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to initiate payment');
  return data;
};

/**
 * Step 2: Verify payment after Cashfree redirects back
 * @param {string} orderId    - MongoDB order _id
 * @param {string} cfOrderId  - Cashfree order id (cf_<orderId>)
 * @returns {{ success, isPaid, order }}
 */
export const verifyCashfreePayment = async (orderId, cfOrderId) => {
  let res = await fetch(`${API_BASE}/payment/cashfree/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId, cfOrderId }),
  });

  if (res.status === 401) {
    const refreshed = await authService.refreshSession();
    if (refreshed) {
      res = await fetch(`${API_BASE}/payment/cashfree/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderId, cfOrderId }),
      });
    } else {
      authService.logout();
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Payment verification failed');
  return data;
};
