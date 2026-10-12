import apiClient from './apiClient';

export interface OccupancyRecord {
  room_number: string;
  branch_name: string;
  type_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
  booking_status: string | null;
}

export interface BillingRecord {
  guest_name: string;
  branch_names?: string;
  booking_status: string;
  payment_status: string;
  total_charge: string | number;
  paid_amount: string | number;
  calculated_outstanding_amount: string | number;
}

export interface ServiceUsageRecord {
  room_number: string;
  service_name: string;
  total_quantity: string | number;
  total_amount: string | number;
}

export interface RevenueRecord {
  branch_name: string;
  room_and_tax_revenue: string | number;
  service_revenue: string | number;
}

export interface TopServiceRecord {
  service_name: string;
  total_quantity: string | number;
  booking_count: number;
  total_revenue: string | number;
}

export const reportApi = {
  getOccupancyReport: async (params: { from: string; to: string; branch_name?: string }) => {
    const response = await apiClient.get<{
      data: OccupancyRecord[];
      from: string;
      to: string;
    }>('/reports/occupancy', { params });
    return response.data;
  },

  getBillingReport: async (params?: { branch_name?: string }) => {
    const response = await apiClient.get<{ data: BillingRecord[] }>('/reports/billing', { params });
    return response.data;
  },

  // Backwards compatibility alias
  getBillingSummaryReport: async (params?: { branch_name?: string }) => {
    const response = await apiClient.get<{ data: BillingRecord[] }>('/reports/billing', { params });
    return response.data;
  },

  getServiceUsageReport: async (params?: { from?: string; to?: string }) => {
    const response = await apiClient.get<{ data: ServiceUsageRecord[] }>('/reports/service-usage', {
      params,
    });
    return response.data;
  },

  getRevenueReport: async (params: { from: string; to: string }) => {
    const response = await apiClient.get<{
      data: RevenueRecord[];
      from: string;
      to: string;
    }>('/reports/revenue', { params });
    return response.data;
  },

  getTopServicesReport: async () => {
    const response = await apiClient.get<{ data: TopServiceRecord[] }>('/reports/top-services');
    return response.data;
  },
};
