import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. GET /api/services/usage?status=Requested)
// once serviceApi.listServiceUsage() exists. Shape assumed based on the
// ServiceUsage table: { id, serviceName, roomNumber, quantity, usageTime }[]
const mockPendingRequests = [
  { id: 1, serviceName: 'Room Service', roomNumber: '204', quantity: 2, usageTime: '12:40 PM' },
  { id: 2, serviceName: 'Laundry', roomNumber: '108', quantity: 1, usageTime: '1:15 PM' },
  { id: 3, serviceName: 'Spa Booking', roomNumber: '311', quantity: 1, usageTime: '2:00 PM' },
];

const PendingServiceRequestsWidget = ({ requests = mockPendingRequests }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-900">Pending Service Requests</h3>
      <Link to="/services/request" className="text-xs font-medium text-blue-600 hover:underline">
        View queue
      </Link>
    </div>

    <div className="mb-3 text-3xl font-bold text-gray-900">{requests.length}</div>

    <div className="space-y-6">
      {requests.slice(0, 3).map((req) => (
        <div key={req.id} className="flex items-center justify-between text-xs text-gray-600">
          <span className="truncate">
            {req.serviceName} · Room {req.roomNumber}
          </span>
          <span className="shrink-0 text-gray-400">{req.usageTime}</span>
        </div>
      ))}
    </div>
  </div>
);

export default PendingServiceRequestsWidget;
