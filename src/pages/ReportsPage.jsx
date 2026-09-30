import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Download, ChevronDown } from 'lucide-react';

const ReportsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState({ start: '2026-09-01', end: '2026-09-30' });
  const [branch, setBranch] = useState('all');
  const [roomType, setRoomType] = useState('all');
  const [reportType, setReportType] = useState('overview');

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['occupancy', 'revenue', 'billing-summary', 'service-usage'].includes(path)) {
      setReportType(path);
    } else {
      setReportType('overview');
    }
  }, [location]);

  const handleTabChange = (key) => {
    setReportType(key);
    if (key === 'overview') {
      navigate('/reports');
    } else {
      navigate(`/reports/${key}`);
    }
  };

  const handleGenerate = () => {
    alert('Generate Report clicked!');
  };

  const handleExport = () => {
    alert('Export clicked!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-[popins] bg-[#F7F9FC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Hotel performance and operational analytics</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-5 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Date Range</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-gray-50/50 text-gray-700"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-gray-50/50 text-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Branch</label>
          <div className="relative">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-gray-50/50 text-gray-700 min-w-[150px]"
            >
              <option value="all">All Branches</option>
              <option value="colombo">Colombo</option>
              <option value="kandy">Kandy</option>
              <option value="galle">Galle</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Room Type</label>
          <div className="relative">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-gray-50/50 text-gray-700 min-w-[150px]"
            >
              <option value="all">All Types</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-all shadow-indigo-200"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Type Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto p-1 bg-gray-100/50 rounded-lg w-fit">
        {['Overview', 'Occupancy', 'Revenue', 'Billing Summary', 'Service Usage'].map((tab) => {
          const tabKey = tab.toLowerCase().replace(' ', '-');
          const isActive = reportType === tabKey || (reportType === 'overview' && tabKey === 'overview');
          return (
            <button
              key={tabKey}
              onClick={() => handleTabChange(tabKey)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Render the specific report based on sub-route */}
      <Outlet />
      
    </div>
  );
};

export default ReportsPage;
