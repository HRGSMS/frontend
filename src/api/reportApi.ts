import apiClient from './apiClient';

export const reportApi = {
  getOccupancyReport: async (params: { branchId?: number; dateFrom?: string; dateTo?: string }) => {
    const response = await apiClient.get('/reports/occupancy', { params });
    return response.data;
  },

  getBillingSummaryReport: async (params: {
    branchId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get('/reports/billing-summary', { params });
    return response.data;
  },

  getServiceUsageReport: async (params: {
    branchId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get('/reports/service-usage', { params });
    return response.data;
  },

  getRevenueReport: async (params: { branchId?: number; dateFrom?: string; dateTo?: string }) => {
    const response = await apiClient.get('/reports/revenue', { params });
    return response.data;
  },

  exportReport: async (
    type: string,
    format: 'pdf' | 'excel' | 'csv',
    params: { branchId?: number; dateFrom?: string; dateTo?: string } = {},
  ) => {
    const response = await apiClient.get(`/reports/${type}/export?format=${format}`, {
      params,
      responseType: 'blob', // Important for file downloads
    });
    return response.data;
  },
};
