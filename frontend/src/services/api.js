import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: rawBaseUrl ? `${rawBaseUrl.replace(/\/+$/, '')}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Bearer token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fleetsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('fleetsphere_token');
      localStorage.removeItem('fleetsphere_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  getUsers: (params) => api.get('/auth/users', { params }),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data)
};

export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params })
};

export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status })
};

export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  updateStatus: (id, data) => api.patch(`/trips/${id}/status`, data)
};

export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data)
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data)
};

export const fuelAPI = {
  getAll: (params) => api.get('/fuel', { params }),
  create: (data) => api.post('/fuel', data)
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  create: (data) => api.post('/expenses', data),
  updateStatus: (id, data) => api.patch(`/expenses/${id}/status`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data)
};

export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`)
};

export const branchesAPI = {
  getAll: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data)
};

export const organizationsAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data)
};

export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params })
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications')
};

export const searchAPI = {
  query: (q) => api.get('/search', { params: { q } })
};

export default api;
