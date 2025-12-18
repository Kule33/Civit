import axios from 'axios';
import { refreshToken as refreshTokenApi } from './authService';

// Shared axios instance with auto-refresh on 401
const apiClient = axios.create();

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const storedRefresh = localStorage.getItem('refresh_token');
      if (!storedRefresh) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const data = await refreshTokenApi(storedRefresh);
        const newAccessToken = data.access_token || data?.session?.access_token;
        const newRefreshToken = data.refresh_token || data?.session?.refresh_token;
        if (!newAccessToken) throw new Error('No new access token');

        localStorage.setItem('auth_token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
        apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // optional: clear tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
