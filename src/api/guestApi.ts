import apiClient from './apiClient';

export interface GuestProfile {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface GuestBooking {
  public_id: string;
  booking_time: string;
  check_in_time: string;
  check_out_time: string;
  cancellation_time: string | null;
  booking_status: 'Booked' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Credit Due';
  total_charge: number | string;
  outstanding_amount: number | string;
  total_tax_amount?: number | string;
  cancellation_fee?: number | string;
  paid_amount?: number | string;
  branch_names?: string;
  room_numbers?: string;
  room_types?: string;
  room_public_ids?: string;
}

export interface GuestServiceUsage {
  public_id: string;
  service_public_id: string;
  service_name: string;
  service_description: string;
  usage_time: string;
  quantity: number;
  price_at_usage: number | string;
  status: 'Pending' | 'Completed' | string;
  room_number: string;
  room_public_id: string;
}

export interface ServiceItem {
  public_id: string;
  service_name: string;
  service_description: string;
  current_price: number | string;
}

export interface AvailableRoom {
  public_id: string;
  room_number: string;
  branch_public_id: string;
  branch_name: string;
  type_name: string;
  capacity: number;
  daily_rate: number | string;
  current_status: number;
  booking_availability: number;
  /** Comma-separated amenity names joined from DB via GROUP_CONCAT */
  amenities: string;
}

export interface BranchItem {
  public_id: string;
  name: string;
  location_city: string;
}

/** Flat key→value map from the hotel_config table. */
export interface HotelConfig {
  hotel_name: string;
  hotel_tagline: string;
  hotel_description: string;
  hotline_number: string;
  hotline_label: string;
  checkin_time: string;
  checkout_time: string;
  currency: string;
  copyright_text: string;
  [key: string]: string; // allow extra config keys without TS errors
}

export interface PaymentMethod {
  public_id: string;
  method_name: string;
  display_name: string;
}

export interface PaymentResult {
  public_id: string;
  booking_public_id: string;
  amount: number;
  outstanding_amount?: number | string;
  payment_status?: string;
  sms_notification?: {
    sent: boolean;
    phone_number: string;
    message: string;
    timestamp: string;
  };
}

export const guestApi = {
  getProfile: async () => {
    const res = await apiClient.get<{ data: GuestProfile }>('/guest/profile');
    return res.data.data;
  },

  getBookings: async () => {
    const res = await apiClient.get<{ data: GuestBooking[] }>('/guest/bookings');
    return res.data.data;
  },

  createBooking: async (data: {
    check_in_time: string;
    check_out_time: string;
    room_public_ids: string[];
    payment_method: string;
    payment_option?: 'half' | 'full';
  }) => {
    const res = await apiClient.post<{ data: GuestBooking }>('/guest/bookings', data);
    return res.data.data;
  },

  makePayment: async (
    bookingPublicId: string,
    data: { amount: number; payment_method: string; phone_number?: string },
  ) => {
    const res = await apiClient.post<{ data: PaymentResult }>(
      `/guest/bookings/${bookingPublicId}/payments`,
      data,
    );
    return res.data;
  },

  cancelBooking: async (bookingPublicId: string) => {
    const res = await apiClient.post(`/guest/bookings/${bookingPublicId}/cancel`);
    return res.data;
  },

  getBookingServices: async (bookingPublicId: string) => {
    const res = await apiClient.get<{ data: GuestServiceUsage[] }>(
      `/guest/bookings/${bookingPublicId}/services`,
    );
    return res.data.data;
  },

  orderService: async (
    bookingPublicId: string,
    data: {
      service_public_id: string;
      room_public_id: string;
      quantity: number;
    },
  ) => {
    const res = await apiClient.post<{ data: { public_id: string; status: string } }>(
      `/guest/bookings/${bookingPublicId}/services`,
      data,
    );
    return res.data.data;
  },

  cancelServiceRequest: async (serviceRequestPublicId: string) => {
    const res = await apiClient.delete(`/guest/service-requests/${serviceRequestPublicId}`);
    return res.data;
  },

  getRooms: async (params?: { available_from?: string; available_to?: string }) => {
    const res = await apiClient.get<{ data: AvailableRoom[] }>('/rooms', { params });
    return res.data.data;
  },

  getServices: async () => {
    const res = await apiClient.get<{ data: ServiceItem[] }>('/services');
    return res.data.data;
  },

  getBranches: async () => {
    const res = await apiClient.get<{ data: BranchItem[] }>('/branches');
    return res.data.data;
  },

  /** Hotel-wide public settings from the hotel_config table. */
  getHotelConfig: async (): Promise<HotelConfig> => {
    const res = await apiClient.get<{ data: HotelConfig }>('/hotel-config');
    return res.data.data;
  },

  /** Active payment methods from the payment_method table. */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const res = await apiClient.get<{ data: PaymentMethod[] }>('/payment-methods');
    return res.data.data;
  },
};
