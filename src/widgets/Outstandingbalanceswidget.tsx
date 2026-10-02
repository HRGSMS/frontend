import type { FC } from 'react';
import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/billing/outstanding?branchId=...)
// once billingApi.getOutstandingBalances() exists. Shape assumed based on the
// Booking table's OutstandingAmount field: { id, guestName, roomNumber, outstandingAmount }[]

export interface OutstandingBalance {
  id: number;
  guestName: string;
  roomNumber: string;
  outstandingAmount: number;
}

const mockOutstanding: OutstandingBalance[] = [
  { id: 1, guestName: 'Nimal Perera', roomNumber: '204', outstandingAmount: 18500 },
  { id: 2, guestName: 'Ishara Wickramasinghe', roomNumber: '215', outstandingAmount: 42000 },
  { id: 3, guestName: 'Dilshan Rathnayake', roomNumber: '402', outstandingAmount: 9200 },
];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);

export interface OutstandingBalancesWidgetProps {
  balances?: OutstandingBalance[];
}

const OutstandingBalancesWidget: FC<OutstandingBalancesWidgetProps> = ({
  balances = mockOutstanding,
}) => {
  const total = balances.reduce((sum, b) => sum + b.outstandingAmount, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Outstanding Balances</h3>
        <Link to="/billing" className="text-xs font-medium text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="mb-3 text-3xl font-bold text-gray-900">{formatCurrency(total)}</div>

      <div className="space-y-5">
        {balances.slice(0, 3).map((b) => (
          <div key={b.id} className="flex items-center justify-between text-xs text-gray-600">
            <span className="truncate">
              {b.guestName} · Room {b.roomNumber}
            </span>
            <span className="shrink-0 font-medium text-red-600">
              {formatCurrency(b.outstandingAmount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutstandingBalancesWidget;
