import apiClient from './apiClient';

export interface PaymentPayload {
  amount: number;
  payment_method: string;
}

export const billingApi = {
  // Record payment for a booking - runs stored procedure sp_calculate_bill
  recordPayment: async (bookingPublicId: string, payload: PaymentPayload) => {
    const response = await apiClient.post(`/bookings/${bookingPublicId}/payments`, payload);
    return response.data;
  },

  // Recalculate bill using sp_calculate_bill
  calculateBill: async (bookingPublicId: string) => {
    const response = await apiClient.post('/calculate-bill', {
      booking_public_id: bookingPublicId,
    });
    return response.data;
  },

  // Get outstanding billing list from database report view
  getBillingReport: async () => {
    const response = await apiClient.get('/reports/billing');
    return response.data;
  },

  // Compatibility wrappers
  confirmPayment: async (
    bookingId: string | number,
    data: { amount: number; method?: string; payment_method?: string },
  ) => {
    const response = await apiClient.post(`/bookings/${bookingId}/payments`, {
      amount: data.amount,
      payment_method: data.payment_method || data.method || 'Credit Card',
    });
    return response.data;
  },

  getItemizedBill: async (bookingId: string | number) => {
    return billingApi.calculateBill(String(bookingId));
  },
};
