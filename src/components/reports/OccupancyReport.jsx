import React from 'react';

const OccupancyReport = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Occupancy Report</h2>
        <p className="text-gray-500">Detailed room occupancy metrics will be displayed here.</p>
      </div>
    </div>
  );
};

export default OccupancyReport;
