import apiClient from './apiClient';

export const billingApi = {
  getItemizedBill: async (bookingId: number) => {
    const response = await apiClient.get(`/bookings/${bookingId}/bill`);
    return response.data;
  },

  createPaymentIntent: async (bookingId: number, amount: number) => {
    const response = await apiClient.post(`/bookings/${bookingId}/payment-intent`, { amount });
    return response.data;
  },

  confirmPayment: async (
    bookingId: number,
    data: { gatewayTransactionId: string; amount: number; method: string },
  ) => {
    const response = await apiClient.post(`/bookings/${bookingId}/payments`, {
      ...data,
      bookingId,
    });
    return response.data;
  },

  getOutstandingBalances: async (filters: { branchId?: number }) => {
    const response = await apiClient.get('/payments/outstanding', { params: filters });
    return response.data;
  },
};
