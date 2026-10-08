import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'hrgsms_auth_token';
const USER_KEY = 'hrgsms_auth_user';

let refreshRequest: Promise<string> | null = null;

export const refreshAccessToken = (currentToken: string): Promise<string> => {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${baseURL}/auth/refresh`, { token: currentToken })
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        const token = payload?.token ?? payload?.accessToken;
        if (typeof token !== 'string' || !token) {
          throw new Error('The token refresh response was incomplete.');
        }
        localStorage.setItem(TOKEN_KEY, token);
        return token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: handle 401 retry or logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRequest = /\/auth\/(login|register|refresh)(?:$|\?)/.test(
      originalRequest?.url ?? '',
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const currentToken = localStorage.getItem(TOKEN_KEY);
        if (!currentToken) {
          throw new Error('No session token is available to refresh.');
        }

        const newToken = await refreshAccessToken(currentToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        const response = await apiClient(originalRequest);
        return response;
      } catch (refreshError) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
