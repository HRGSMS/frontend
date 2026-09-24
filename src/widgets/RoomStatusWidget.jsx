import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/rooms/status) once the
// backend endpoint exists. Shape assumed: { id, number, floor, status }[]
const mockRooms = [
  { id: 1, number: '101', floor: 1, status: 'occupied' },
  { id: 2, number: '102', floor: 1, status: 'vacant-clean' },
  { id: 3, number: '103', floor: 1, status: 'vacant-dirty' },
  { id: 4, number: '104', floor: 1, status: 'out-of-order' },
  { id: 5, number: '201', floor: 2, status: 'occupied' },
  { id: 6, number: '202', floor: 2, status: 'occupied' },
  { id: 7, number: '203', floor: 2, status: 'vacant-clean' },
  { id: 8, number: '204', floor: 2, status: 'maintenance' },
  { id: 9, number: '301', floor: 3, status: 'vacant-clean' },
  { id: 10, number: '302', floor: 3, status: 'occupied' },
  { id: 11, number: '303', floor: 3, status: 'vacant-dirty' },
  { id: 12, number: '304', floor: 3, status: 'occupied' },
];

const statusConfig = {
  occupied: { label: 'Occupied', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  'vacant-clean': {
    label: 'Vacant · Clean',
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  'vacant-dirty': {
    label: 'Vacant · Dirty',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  'out-of-order': {
    label: 'Out of Order',
    dot: 'bg-gray-500',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
};

const RoomStatusWidget = ({ rooms = mockRooms }) => {
  const counts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Room Status</h3>
        <Link to="/rooms/status" className="text-xs font-medium text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {/* Status count summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}: {counts[key] || 0}
          </span>
        ))}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {rooms.map((room) => {
          const cfg = statusConfig[room.status] ?? statusConfig.occupied;
          return (
            <div
              key={room.id}
              title={cfg.label}
              className={`flex flex-col items-center justify-center rounded-md border border-gray-100 py-2 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
            >
              <span className={`mb-1 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {room.number}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomStatusWidget;
