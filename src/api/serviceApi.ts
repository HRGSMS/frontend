import apiClient from './apiClient';

export const serviceApi = {
  getServiceCatalogue: async (filters: { branchId?: number }) => {
    const response = await apiClient.get('/services', { params: filters });
    return response.data;
  },

  updateServicePrice: async (id: string, price: number) => {
    const response = await apiClient.patch(`/services/${id}/price`, { price });
    return response.data;
  },

  requestService: async (data: {
    bookingPublicId: string;
    roomPublicId: string;
    servicePublicId: string;
    quantity: number;
  }) => {
    const { bookingPublicId, ...body } = data;
    const response = await apiClient.post(
      `/bookings/${bookingPublicId}/services`,
      {
        service_public_id: body.servicePublicId,
        room_public_id: body.roomPublicId,
        quantity: body.quantity,
      },
    );
    return response.data;
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
  }) => {
    const params = {
      booking_public_id: filters.bookingPublicId,
      room_public_id: filters.roomPublicId,
      service_public_id: filters.servicePublicId,
      status: filters.status,
    };
    const response = await apiClient.get('/service-requests', { params });
    return response.data;
  },
};
