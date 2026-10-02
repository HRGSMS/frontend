import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

// Real-time updates: listens for `serviceRequestUpdate` events from the backend.
// Falls back to mock data when the backend socket is not running.

export interface ServiceRequest {
  id: number;
  serviceName: string;
  roomNumber: string;
  quantity: number;
  usageTime: string;
}

const mockPendingRequests: ServiceRequest[] = [
  { id: 1, serviceName: 'Room Service', roomNumber: '204', quantity: 2, usageTime: '12:40 PM' },
  { id: 2, serviceName: 'Laundry', roomNumber: '108', quantity: 1, usageTime: '1:15 PM' },
  { id: 3, serviceName: 'Spa Booking', roomNumber: '311', quantity: 1, usageTime: '2:00 PM' },
];

export interface PendingServiceRequestsWidgetProps {
  initialRequests?: ServiceRequest[];
}

const PendingServiceRequestsWidget: FC<PendingServiceRequestsWidgetProps> = ({
  initialRequests = mockPendingRequests,
}) => {
  const { socket } = useSocket();
  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests);

  // Live update: `serviceRequestUpdate` may carry a full updated request or a
  // status change. We add new requests and remove completed/cancelled ones.
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (update: {
      action: 'new' | 'completed' | 'cancelled';
      request: ServiceRequest;
    }) => {
      if (update.action === 'new') {
        setRequests((prev) => [update.request, ...prev]);
      } else if (update.action === 'completed' || update.action === 'cancelled') {
        setRequests((prev) => prev.filter((r) => r.id !== update.request.id));
      }
    };

    socket.on('serviceRequestUpdate', handleUpdate);
    return () => {
      socket.off('serviceRequestUpdate', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Pending Service Requests</h3>
        <Link to="/service-requests" className="text-xs font-medium text-blue-600 hover:underline">
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
};

export default PendingServiceRequestsWidget;
