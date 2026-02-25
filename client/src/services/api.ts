import axios from 'axios';
import { keysToCamel } from '../utils/caseConverter';

// Use same host as frontend but on port 5000 for API
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : `${window.location.protocol}//${window.location.hostname}:5000/api`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    let token = null;
    try {
      token = localStorage.getItem('accessToken');
    } catch (e) {
      console.warn('LocalStorage access denied', e);
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Transform snake_case keys to camelCase
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Rate limit retry with exponential backoff (max 3 retries)
    if (error.response?.status === 429 && (!originalRequest._retryCount || originalRequest._retryCount < 3)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        let refreshToken = null;
        try {
          refreshToken = localStorage.getItem('refreshToken');
        } catch (e) {
          console.warn('LocalStorage access denied', e);
        }

        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

          try {
            localStorage.setItem('accessToken', data.accessToken);
          } catch (e) {
            console.warn('LocalStorage access denied', e);
          }

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch (e) {
          console.warn('LocalStorage access denied', e);
        }

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
