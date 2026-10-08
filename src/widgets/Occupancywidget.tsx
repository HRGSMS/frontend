import type { FC } from 'react';
import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/rooms/occupancy) once the
// backend endpoint exists. Shape assumed:
// { totalRooms, occupiedRooms, vacantRooms, outOfOrderRooms, occupancyYesterday }

export interface OccupancyData {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  outOfOrderRooms: number;
  occupancyYesterday: number;
}

const mockOccupancy: OccupancyData = {
  totalRooms: 48,
  occupiedRooms: 34,
  vacantRooms: 12,
  outOfOrderRooms: 2,
  occupancyYesterday: 68, // percentage, for the trend comparison
};

export interface OccupancyWidgetProps {
  data?: OccupancyData;
}

const OccupancyWidget: FC<OccupancyWidgetProps> = ({ data = mockOccupancy }) => {
  const { totalRooms, occupiedRooms, vacantRooms, outOfOrderRooms, occupancyYesterday } = data;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const delta = occupancyRate - occupancyYesterday;
  const trendUp = delta >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Occupancy</h3>
        <Link to="/reports/occupancy" className="text-xs font-medium text-blue-600 hover:underline">
          View report
        </Link>
      </div>

      {/* Headline rate + trend */}
      <div className="mb-4 flex items-end gap-3">
        <span className="text-3xl font-bold text-gray-900">{occupancyRate}%</span>
        <span
          className={`mb-1 flex items-center text-xs font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trendUp ? '▲' : '▼'} {Math.abs(delta)}% vs yesterday
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${occupancyRate}%` }}
        />
      </div>

      {/* Room breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-red-50 py-2">
          <div className="text-lg font-semibold text-red-700">{occupiedRooms}</div>
          <div className="text-xs text-red-600">Occupied</div>
        </div>
        <div className="rounded-md bg-green-50 py-2">
          <div className="text-lg font-semibold text-green-700">{vacantRooms}</div>
          <div className="text-xs text-green-600">Vacant</div>
        </div>
        <div className="rounded-md bg-gray-100 py-2">
          <div className="text-lg font-semibold text-gray-700">{outOfOrderRooms}</div>
          <div className="text-xs text-gray-600">Out of Order</div>
        </div>
      </div>
    </div>
  );
};

export default OccupancyWidget;
