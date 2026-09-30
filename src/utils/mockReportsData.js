export const mockReportSummary = {
  occupancy: { value: '78.4%', trend: 'up', trendValue: '5.2%' },
  revenue: { value: 'Rs 2.84M', trend: 'up', trendValue: '8.1%' },
  outstanding: { value: 'Rs 420,000', trend: 'down', trendValue: '3.4%' },
  services: { value: '1,284 uses', trend: 'up', trendValue: '12.5%' },
};

export const mockRevenueByBranch = [
  { branch: 'Colombo', revenue: 'Rs 1.2M' },
  { branch: 'Kandy', revenue: 'Rs 920K' },
  { branch: 'Galle', revenue: 'Rs 720K' },
];

export const mockRoomOccupancy = {
  occupied: 78,
  available: 17,
  maintenance: 5,
};

export const mockTopServices = [
  { name: 'Laundry', count: 342 },
  { name: 'Room Service', count: 278 },
  { name: 'Spa', count: 190 },
];
