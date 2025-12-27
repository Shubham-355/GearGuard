import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  registerCompany: (data) => api.post('/auth/register-company', data),
  joinWithCode: (data) => api.post('/auth/join-with-code', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getTechnicians: () => api.get('/users/technicians'),
  getByRole: (role) => api.get(`/users/role/${role}`),
};

// Equipment API
export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getRequests: (id) => api.get(`/equipment/${id}/requests`),
  scrap: (id, data = {}) => api.post(`/equipment/${id}/scrap`, data),
  getCritical: () => api.get('/equipment/critical'),
};

// Maintenance Requests API
export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
  updateStage: (id, stage) => api.patch(`/requests/${id}/stage`, { stage }),
  assign: (id, technicianId) => api.patch(`/requests/${id}/assign`, { technicianId }),
  selfAssign: (id) => api.patch(`/requests/${id}/self-assign`),
  complete: (id, data) => api.put(`/requests/${id}/complete`, data),
  getByStage: (stage) => api.get(`/requests/stage/${stage}`),
  getCalendar: (params) => api.get('/requests/calendar', { params }),
  getOverdue: () => api.get('/requests/overdue'),
};

// Teams API
export const teamsAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, memberId) => api.delete(`/teams/${teamId}/members/${memberId}`),
  getMembers: (id) => api.get(`/teams/${id}/members`),
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Departments API
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Work Centers API
export const workCentersAPI = {
  getAll: (params) => api.get('/work-centers', { params }),
  getById: (id) => api.get(`/work-centers/${id}`),
  create: (data) => api.post('/work-centers', data),
  update: (id, data) => api.put(`/work-centers/${id}`, data),
  delete: (id) => api.delete(`/work-centers/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getCriticalEquipment: () => api.get('/dashboard/critical-equipment'),
  getTechnicianLoad: () => api.get('/dashboard/technician-load'),
  getOpenRequests: () => api.get('/dashboard/open-requests'),
  getRecentActivity: () => api.get('/dashboard/activity'),
  getRequestsByTeam: () => api.get('/dashboard/reports/requests-by-team'),
  getRequestsByCategory: () => api.get('/dashboard/reports/requests-by-category'),
  getNotifications: () => api.get('/dashboard/notifications'),
};

// Company API
export const companyAPI = {
  get: () => api.get('/company'),
  updateAllowedDomains: (data) => api.put('/company/allowed-domains', data),
};
