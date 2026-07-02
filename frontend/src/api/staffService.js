import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STAFF_URL = `${API_BASE_URL}/staff`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (url, options = {}) => {
  const doFetch = () =>
    fetch(url, {
      ...options,
      headers: { ...getHeaders(), ...(options.headers || {}) },
    });

  let res = await doFetch();

  // Auto-refresh token if expired
  if (res.status === 401) {
    const refreshed = await authService.refreshSession();
    if (refreshed) {
      res = await doFetch();
    } else {
      authService.logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const staffAPI = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`${STAFF_URL}?${q}`);
  },
  getById: (id) => request(`${STAFF_URL}/${id}`),
  create: (data) => request(STAFF_URL, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${STAFF_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`${STAFF_URL}/${id}`, { method: 'DELETE' }),
  updatePermissions: (id, permissions) =>
    request(`${STAFF_URL}/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  getModules: () => request(`${STAFF_URL}/modules`),
};
