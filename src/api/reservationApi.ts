import apiClient from './apiClient';

export interface RoomRecord {
  public_id: string;
  room_number: string;
  branch_name: string;
  type_name: string;
  capacity: number;
  daily_rate: number | string;
  current_status?: string;
  booking_availability?: number;
}

export interface GuestRecord {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface BookingRecord {
  public_id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  branch_names: string;
  room_numbers: string;
  booking_time: string;
  check_in_time: string;
  check_out_time: string;
  cancellation_time?: string | null;
  booking_status: 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
  payment_status: string;
  total_charge: number | string;
  outstanding_amount: number | string;
  total_tax_amount?: number | string;
}

export const reservationApi = {
  // Reference & Data endpoints
  listBranches: async () => {
    const response = await apiClient.get('/branches');
    return response.data;
  },

  listRoomTypes: async () => {
    const response = await apiClient.get('/room-types');
    return response.data;
  },

  listRooms: async (params?: { available_from?: string; available_to?: string }) => {
    const response = await apiClient.get('/rooms', { params });
    return response.data;
  },

  listGuests: async () => {
    const response = await apiClient.get('/guests');
    return response.data;
  },

  createGuest: async (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }) => {
    const response = await apiClient.post('/guests', data);
    return response.data;
  },

  updateGuest: async (
    publicId: string,
    data: Partial<{
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    }>,
  ) => {
    const response = await apiClient.patch(`/guests/${publicId}`, data);
    return response.data;
  },

  // Booking CRUD & Status transitions (Vidath's APIs)
  listBookings: async (filters?: { status?: string }) => {
    const response = await apiClient.get('/bookings', { params: filters });
    return response.data;
  },

  createBooking: async (data: {
    guest_public_id: string;
    room_public_ids: string[];
    check_in_time: string;
    check_out_time: string;
    booking_status?: 'Booked' | 'Checked-In';
    tax_public_id?: string;
  }) => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  updateBooking: async (
    publicId: string,
    data: {
      booking_status?: 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
      check_in_time?: string;
      check_out_time?: string;
    },
  ) => {
    const response = await apiClient.patch(`/bookings/${publicId}`, data);
    return response.data;
  },

  checkIn: async (publicId: string) => {
    const response = await apiClient.patch(`/bookings/${publicId}`, {
      booking_status: 'Checked-In',
    });
    return response.data;
  },

  checkOut: async (publicId: string) => {
    const response = await apiClient.patch(`/bookings/${publicId}`, {
      booking_status: 'Checked-Out',
    });
    return response.data;
  },

  cancelBooking: async (publicId: string) => {
    // Uses the cancellation trigger sp_cancel_booking procedure
    try {
      const response = await apiClient.post('/cancel-booking', {
        booking_public_id: publicId,
      });
      return response.data;
    } catch {
      // Fallback to catalogue DELETE endpoint
      const response = await apiClient.delete(`/bookings/${publicId}`);
      return response.data;
    }
  },

  // Legacy compatibility helpers
  getAvailability: async (params: {
    checkIn: string;
    checkOut: string;
  }) => {
    const response = await apiClient.get('/rooms', {
      params: { available_from: params.checkIn, available_to: params.checkOut },
    });
    return response.data;
  },
};
