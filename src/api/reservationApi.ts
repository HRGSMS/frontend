import apiClient from './apiClient';

export const reservationApi = {
  getAvailability: async (params: { branchId?: number; checkIn: string; checkOut: string; roomTypeId?: number }) => {
    const response = await apiClient.get('/rooms/availability', { params });
    return response.data;
  },

  createBooking: async (data: { guestId: number; roomIds: number[]; checkIn: string; checkOut: string; source: string }) => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  updateBooking: async (id: number, data: Partial<{ checkIn: string; checkOut: string; roomIds: number[]; source: string }>) => {
    const response = await apiClient.patch(`/bookings/${id}`, data);
    return response.data;
  },

  cancelBooking: async (id: number) => {
    const response = await apiClient.post(`/bookings/${id}/cancel`);
    return response.data;
  },

  checkIn: async (id: number) => {
    const response = await apiClient.post(`/bookings/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id: number) => {
    const response = await apiClient.post(`/bookings/${id}/check-out`);
    return response.data;
  },

  getBooking: async (id: number) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  listBookings: async (filters: { branchId?: number; guestId?: number; status?: string; dateFrom?: string; dateTo?: string }) => {
    const response = await apiClient.get('/bookings', { params: filters });
    return response.data;
  },

  listBranches: async () => {
    const response = await apiClient.get('/branches');
    return response.data;
  },

  listRoomTypes: async () => {
    const response = await apiClient.get('/room-types');
    return response.data;
  },

  createRoom: async (data: { branchId: number; roomTypeId: number; roomNumber: string }) => {
    const response = await apiClient.post('/rooms', data);
    return response.data;
  },

  updateRoomStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/rooms/${id}/status`, { status });
    return response.data;
  },
};