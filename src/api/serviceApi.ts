
import apiClient from './apiClient';

interface ServiceOrderPayload {
  service_public_id: string;
  room_public_id: string;
  quantity: number;
}

export const serviceApi = {
  getServiceCatalogue: async (filters: { branchId?: number } = {}) => {
    const response = await apiClient.get('/services', { params: filters });
    return response.data;
  },

  updateServicePrice: async (id: string, price: number) => {
    const response = await apiClient.patch(`/services/${id}/price`, { price });
    return response.data;
  },

  // Record service consumption for a booking.
  orderService: async (
    bookingPublicId: string,
    payload: ServiceOrderPayload,
  ) => {
    const response = await apiClient.post(
      `/bookings/${bookingPublicId}/services`,
      payload,
    );
    return response.data;
  },

  // Compatibility wrapper for callers using either public or legacy IDs.
  requestService: async (data: {
    bookingId?: string | number;
    bookingPublicId?: string;
    roomId?: string | number;
    roomPublicId?: string;
    serviceId?: string | number;
    servicePublicId?: string;
    quantity: number;
  }) => {
    const bookingId = data.bookingPublicId ?? data.bookingId;
    const roomId = data.roomPublicId ?? data.roomId;
    const serviceId = data.servicePublicId ?? data.serviceId;

    if (bookingId == null || roomId == null || serviceId == null) {
      throw new Error(
        'Booking, room, and service identifiers are required.',
      );
    }

    return serviceApi.orderService(String(bookingId), {
      service_public_id: String(serviceId),
      room_public_id: String(roomId),
      quantity: data.quantity,
    });
  },

  completeService: async (publicId: string) => {
    const response = await apiClient.patch(
      `/service-requests/${publicId}/complete`,
    );
    return response.data;
  },

  listServiceUsage: async (filters: {
    bookingPublicId?: string;
    roomPublicId?: string;
    servicePublicId?: string;
    status?: string;
  } = {}) => {
    const params = {
      booking_public_id: filters.bookingPublicId,
      room_public_id: filters.roomPublicId,
      service_public_id: filters.servicePublicId,
      status: filters.status,
    };

    const response = await apiClient.get('/service-requests', { params });
    return response.data;
  },

  // Service usage report.
  getServiceUsage: async (params?: { from?: string; to?: string }) => {
    const response = await apiClient.get('/reports/service-usage', { params });
    return response.data;
  },

  // Catalogue management (admin/manager).
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
};
