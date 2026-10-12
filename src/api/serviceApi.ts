import apiClient from './apiClient';

export interface ServiceCatalogueItem {
  public_id: string;
  service_name: string;
  service_description: string;
  current_price: number | string;
  price_update_time?: string;
}

export interface ServiceOrderPayload {
  service_public_id: string;
  room_public_id: string;
  quantity: number;
}

export const serviceApi = {
  // Get active hotel service catalogue
  getServiceCatalogue: async () => {
    const response = await apiClient.get('/services');
    return response.data;
  },

  // Record service consumption for a booking (calls sp_calculate_bill)
  orderService: async (bookingPublicId: string, payload: ServiceOrderPayload) => {
    const response = await apiClient.post(`/bookings/${bookingPublicId}/services`, payload);
    return response.data;
  },

  // Get service usage report
  getServiceUsage: async (params?: { from?: string; to?: string }) => {
    const response = await apiClient.get('/reports/service-usage', { params });
    return response.data;
  },

  // Catalogue management (admin/manager)
  createService: async (data: {
    service_name: string;
    service_description: string;
    current_price: number;
  }) => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  updateService: async (
    publicId: string,
    data: { service_description?: string; current_price?: number },
  ) => {
    const response = await apiClient.patch(`/services/${publicId}`, data);
    return response.data;
  },

  deleteService: async (publicId: string) => {
    const response = await apiClient.delete(`/services/${publicId}`);
    return response.data;
  },

  // Compatibility wrapper
  requestService: async (data: {
    bookingId?: string | number;
    bookingPublicId?: string;
    roomId?: string | number;
    roomPublicId?: string;
    serviceId?: string | number;
    servicePublicId?: string;
    quantity: number;
  }) => {
    const bId = data.bookingPublicId || String(data.bookingId);
    return serviceApi.orderService(bId, {
      service_public_id: data.servicePublicId || String(data.serviceId),
      room_public_id: data.roomPublicId || String(data.roomId),
      quantity: data.quantity,
    });
  },
};
