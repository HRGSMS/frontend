import apiClient from './apiClient';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  verifyMfa: async (challengeToken: string, code: string) => {
    const response = await apiClient.post('/auth/mfa/verify', { challengeToken, code });
    return response.data;
  },

  register: async (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};