import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/reservations/arrivals/today)
// once the backend endpoint exists. Shape assumed:
// { id, guestName, roomNumber, reservationId, expectedTime, status }[]
// status: 'confirmed' | 'checked-in' | 'no-show'
const mockArrivals = [
  {
    id: 1,
    guestName: 'Nimal Perera',
    roomNumber: '204',
    reservationId: 'RES-4521',
    expectedTime: '2:00 PM',
    status: 'confirmed',
  },
  {
    id: 2,
    guestName: 'Anushka Fernando',
    roomNumber: '108',
    reservationId: 'RES-4522',
    expectedTime: '3:30 PM',
    status: 'confirmed',
  },
  {
    id: 3,
    guestName: 'Kasun Jayawardena',
    roomNumber: '311',
    reservationId: 'RES-4519',
    expectedTime: '11:00 AM',
    status: 'checked-in',
  },
  {
    id: 4,
    guestName: 'Ishara Wickramasinghe',
    roomNumber: '215',
    reservationId: 'RES-4525',
    expectedTime: '1:00 PM',
    status: 'confirmed',
  },
  {
    id: 5,
    guestName: 'Dilshan Rathnayake',
    roomNumber: '402',
    reservationId: 'RES-4518',
    expectedTime: '10:00 AM',
    status: 'no-show',
  },
];

const statusConfig = {
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-700' },
  'checked-in': { label: 'Checked In', bg: 'bg-green-50', text: 'text-green-700' },
  'no-show': { label: 'No-show', bg: 'bg-red-50', text: 'text-red-700' },
};

// Front desk gets the "Check In" action; other roles see the list read-only.
const ArrivalsWidget = ({ arrivals = mockArrivals, canCheckIn = false, onCheckIn }) => {
  const pendingCount = arrivals.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Today's Arrivals</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {pendingCount} pending
          </span>
        </div>
        <Link to="/reservations/all" className="text-xs font-medium text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {arrivals.slice(0, 5).map((arrival) => {
          const cfg = statusConfig[arrival.status] ?? statusConfig.confirmed;
          return (
            <div
              key={arrival.id}
              className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {arrival.guestName}
                </div>
                <div className="text-xs text-gray-500">
                  Room {arrival.roomNumber} · {arrival.expectedTime}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                >
                  {cfg.label}
                </span>
                {canCheckIn && arrival.status === 'confirmed' && (
                  <button
                    onClick={() => onCheckIn?.(arrival.id)}
                    className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
                  >
                    Check In
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArrivalsWidget;
