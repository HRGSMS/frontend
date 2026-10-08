import type { FC } from 'react';
import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/reports/revenue/today)
// once the backend endpoint exists. Shape assumed:
// { todayRevenue, roomsSold, totalRooms, last7Days: number[] }

export interface RevenueData {
  todayRevenue: number;
  roomsSold: number;
  totalRooms: number;
  last7Days: number[];
}

const mockRevenue: RevenueData = {
  todayRevenue: 584000,
  roomsSold: 34,
  totalRooms: 48,
  last7Days: [420000, 460000, 510000, 490000, 530000, 560000, 584000],
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);

const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((value, i) => {
        const heightPct = ((value - min) / range) * 70 + 30; // keep bars visible even near the min
        return (
          <div
            key={i}
            className="w-2 rounded-sm bg-blue-200 last:bg-blue-600"
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
};

export interface RevenueWidgetProps {
  data?: RevenueData;
}

const RevenueWidget: FC<RevenueWidgetProps> = ({ data = mockRevenue }) => {
  const { todayRevenue, roomsSold, totalRooms, last7Days } = data;
  const adr = roomsSold > 0 ? todayRevenue / roomsSold : 0;
  const revPar = totalRooms > 0 ? todayRevenue / totalRooms : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Revenue</h3>
        <Link to="/reports/revenue" className="text-xs font-medium text-blue-600 hover:underline">
          View report
        </Link>
      </div>

      {/* Headline revenue */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</span>
        <span className="ml-2 text-xs text-gray-500">today</span>
      </div>

      {/* ADR / RevPAR */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(adr)}</div>
          <div className="text-xs text-gray-500">ADR</div>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(revPar)}</div>
          <div className="text-xs text-gray-500">RevPAR</div>
        </div>
      </div>

      {/* 7-day trend */}
      <div>
        <div className="mb-1 text-xs text-gray-500">Last 7 days</div>
        <Sparkline values={last7Days} />
      </div>
    </div>
  );
};

export default RevenueWidget;
