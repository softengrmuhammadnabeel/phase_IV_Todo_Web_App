// src/services/api-client.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isTaskListGet = typeof url === 'string' && url.includes('from-token/tasks') && (error.config?.method === 'get' || error.config?.method === 'GET');
    if (status === 401 || status === 403) {
      if (isTaskListGet) {
        return Promise.reject(error);
      }
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiClientWithRetry = {
  get: <T>(url: string, config?: any) =>
    apiClient.get<T>(url, config).then(res => res.data),

  post: <T>(url: string, data?: any, config?: any) =>
    apiClient.post<T>(url, data, config).then(res => res.data),

  put: <T>(url: string, data?: any, config?: any) =>
    apiClient.put<T>(url, data, config).then(res => res.data),

  patch: <T>(url: string, data?: any, config?: any) =>
    apiClient.patch<T>(url, data, config).then(res => res.data),

  delete: <T>(url: string, config?: any) =>
    apiClient.delete<T>(url, config).then(res => res.data),
};

export default apiClient;
