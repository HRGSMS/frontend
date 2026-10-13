import apiClient from './apiClient';
export interface SystemSettings {
  hotelName: string;
  contactEmail: string;
  contactPhone: string;
  checkInTime: string;
  checkOutTime: string;
  revision: number;
}
export const managementApi = {
  settings: async () =>
    (await apiClient.get<{ data: SystemSettings | null }>('/management/settings')).data.data,
  saveSettings: async (data: SystemSettings) =>
    (await apiClient.put<{ data: SystemSettings }>('/management/settings', data)).data.data,
};
