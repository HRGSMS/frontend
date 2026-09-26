import apiClient from './apiClient';

export const serviceApi = {
  getServiceCatalogue: async (filters: { branchId?: number }) => {
    const response = await apiClient.get('/services', { params: filters });
    return response.data;
  },

  updateServicePrice: async (id: number, price: number) => {
    const response = await apiClient.patch(`/services/${id}/price`, { price });
    return response.data;
  },

  requestService: async (data: { bookingId: number; roomId: number; serviceId: number; quantity: number; instructions?: string }) => {
    const response = await apiClient.post('/service-requests', data);
    return response.data;
  },

  completeService: async (id: number) => {
    const response = await apiClient.patch(`/service-requests/${id}/complete`);
    return response.data;
  },

  listServiceUsage: async (filters: { bookingId?: number; roomId?: number; serviceId?: number; status?: string }) => {
    const response = await apiClient.get('/service-requests', { params: filters });
    return response.data;
  },
};