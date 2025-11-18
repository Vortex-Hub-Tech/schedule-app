import axios from 'axios';
import { TenantStorage } from '../utils/storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const tenant = await TenantStorage.getTenant();
    if (tenant) {
      config.headers['x-tenant-id'] = tenant.id;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('Tenant inativo ou não autorizado');
    }
    return Promise.reject(error);
  }
);

export { api };

export default {
  tenants: {
    getAll: () => axios.get(`${API_URL}/tenants`),
    getById: (id) => axios.get(`${API_URL}/tenants/${id}`),
    getBootstrap: (id) => axios.get(`${API_URL}/tenants/${id}/bootstrap`),
  },
  services: {
    getAll: () => api.get('/services'),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post('/services', data),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
  },
  appointments: {
    getAll: (params) => api.get('/appointments', { params }),
    getById: (id) => api.get(`/appointments/${id}`),
    create: (data) => api.post('/appointments', data),
    updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
    delete: (id) => api.delete(`/appointments/${id}`),
  },
  validation: {
    sendCode: (phone) => api.post('/validation/send-code', { phone }),
    verifyCode: (phone, code) => api.post('/validation/verify-code', { phone, code }),
  },
  owner: {
    verifyOwner: (tenantId, deviceId) => axios.post(`${API_URL}/owner/verify-owner`, { tenantId, deviceId }),
    claimOwnership: (tenantId, deviceId) => axios.post(`${API_URL}/owner/claim-ownership`, { tenantId, deviceId }),
  },
  analytics: {
    getDashboard: () => api.get('/analytics/dashboard'),
    getConversion: () => api.get('/analytics/conversion'),
  },
};
