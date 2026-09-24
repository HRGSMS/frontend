import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/reservations/departures/today)
// once the backend endpoint exists. Shape assumed:
// { id, guestName, roomNumber, reservationId, outstandingAmount, status }[]
// status: 'pending' | 'checked-out'
const mockDepartures = [
  {
    id: 1,
    guestName: 'Sanjeewa Herath',
    roomNumber: '112',
    reservationId: 'RES-4501',
    outstandingAmount: 0,
    status: 'pending',
  },
  {
    id: 2,
    guestName: 'Chamari Silva',
    roomNumber: '207',
    reservationId: 'RES-4503',
    outstandingAmount: 12500,
    status: 'pending',
  },
  {
    id: 3,
    guestName: 'Roshan Gunawardena',
    roomNumber: '305',
    reservationId: 'RES-4497',
    outstandingAmount: 0,
    status: 'checked-out',
  },
];

// Front desk gets the "Check Out" action; other roles see the list read-only.
// Mirrors the backend rule: check-out is disabled while OutstandingAmount > 0.
const DeparturesWidget = ({ departures = mockDepartures, canCheckOut = false, onCheckOut }) => {
  const pendingCount = departures.filter((d) => d.status === 'pending').length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Today's Departures</h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            {pendingCount} pending
          </span>
        </div>
        <Link to="/reservations/all" className="text-xs font-medium text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {departures.slice(0, 5).map((dep) => {
          const hasBalance = dep.outstandingAmount > 0;
          return (
            <div
              key={dep.id}
              className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">{dep.guestName}</div>
                <div className="text-xs text-gray-500">
                  Room {dep.roomNumber}
                  {hasBalance && (
                    <span className="ml-1 font-medium text-red-600">
                      · LKR {dep.outstandingAmount.toLocaleString()} due
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {dep.status === 'checked-out' ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Checked Out
                  </span>
                ) : (
                  canCheckOut && (
                    <button
                      onClick={() => onCheckOut?.(dep.id)}
                      disabled={hasBalance}
                      title={hasBalance ? 'Outstanding balance must be settled first' : undefined}
                      className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Check Out
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeparturesWidget;
