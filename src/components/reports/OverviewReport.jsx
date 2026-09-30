import React from 'react';
import { Building, DollarSign, FileText, Package, ChevronDown } from 'lucide-react';
import {
  mockReportSummary,
  mockRevenueByBranch,
  mockRoomOccupancy,
  mockTopServices,
} from '../../utils/mockReportsData';

// Mock data for the bar chart
const barChartData = [
  { label: 'Sep 23', value: 60 },
  { label: 'Sep 24', value: 45 },
  { label: 'Sep 25', value: 85 },
  { label: 'Sep 26', value: 55 },
  { label: 'Sep 27', value: 65 },
  { label: 'Sep 28', value: 40 },
  { label: 'Sep 29', value: 75 },
];

const getKpiIcon = (label) => {
  switch (label) {
    case 'Occupancy': return <Building className="w-5 h-5 text-gray-500" />;
    case 'Revenue': return <DollarSign className="w-5 h-5 text-gray-500" />;
    case 'Outstanding': return <FileText className="w-5 h-5 text-gray-500" />;
    case 'Services': return <Package className="w-5 h-5 text-gray-500" />;
    default: return null;
  }
};

const OverviewReport = () => {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: 'Occupancy', ...mockReportSummary.occupancy },
          { label: 'Revenue', ...mockReportSummary.revenue },
          { label: 'Outstanding', ...mockReportSummary.outstanding },
          { label: 'Services', ...mockReportSummary.services },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
              <div className="p-2 bg-gray-50 rounded-lg">
                {getKpiIcon(kpi.label)}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
              <div className="flex items-center text-sm">
                <span
                  className={`font-semibold flex items-center mr-2 ${
                    kpi.trend === 'up' && kpi.label !== 'Outstanding'
                      ? 'text-emerald-600'
                      : kpi.trend === 'down' && kpi.label === 'Outstanding'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {kpi.trend === 'up' ? '↗' : '↘'} {kpi.trendValue}
                </span>
                <span className="text-gray-400">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area - Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Revenue & Occupancy Trend</h3>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              View Details <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 mt-4 px-2">
            {barChartData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:opacity-80 relative"
                  style={{ height: `${bar.value}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                    {bar.value}%
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-3">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Content */}
        <div className="flex flex-col gap-6">
          {/* Room Occupancy */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Room Status</h3>
            
            {/* Donut chart placeholder */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 rounded-full border-[12px] border-gray-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[12px] border-indigo-500 border-r-transparent border-b-transparent transform -rotate-45"></div>
                <div className="absolute inset-0 rounded-full border-[12px] border-emerald-400 border-l-transparent border-t-transparent transform rotate-45"></div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">100</div>
                  <div className="text-xs text-gray-500">Rooms</div>
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Occupied</span>
                <span className="font-semibold text-gray-900">{mockRoomOccupancy.occupied}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Available</span>
                <span className="font-semibold text-gray-900">{mockRoomOccupancy.available}</span>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Maintenance</span>
                <span className="font-semibold text-gray-900">{mockRoomOccupancy.maintenance}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row - Services & Branch */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Revenue by Branch</h3>
          <ul className="space-y-4">
            {mockRevenueByBranch.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-gray-600 font-medium">{item.branch}</span>
                <span className="font-semibold text-gray-900">{item.revenue}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Top Used Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {mockTopServices.map((item, idx) => {
              const maxCount = mockTopServices[0].count;
              const percentage = Math.round((item.count / maxCount) * 100);
              const colors = ['bg-indigo-500', 'bg-emerald-400', 'bg-violet-500', 'bg-amber-400'];
              const colorClass = colors[idx % colors.length];
              
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{item.name}</span>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewReport;
