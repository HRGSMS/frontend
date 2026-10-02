import type { FC } from 'react';
import { useState } from 'react';
import Table from '../components/common/Table';
import type { Column } from '../components/common/Table';
import CommonButton from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormInput from '../components/common/FormInput';

export interface ServiceItem {
  id: number;
  roomNumber: string;
  guestName: string;
  serviceType: string;
  quantity: number;
  status: 'Requested' | 'In Progress' | 'Completed';
  createdAt: string;
  notes?: string;
}

const mockServices: ServiceItem[] = [
  {
    id: 1,
    roomNumber: '204',
    guestName: 'Nimal Perera',
    serviceType: 'Room Service: Dinner Special',
    quantity: 2,
    status: 'Requested',
    createdAt: '10 mins ago',
    notes: 'Extra spice requested',
  },
  {
    id: 2,
    roomNumber: '108',
    guestName: 'Anushka Fernando',
    serviceType: 'Laundry (Dry Clean)',
    quantity: 3,
    status: 'In Progress',
    createdAt: '25 mins ago',
    notes: 'Urgent for 6 PM',
  },
  {
    id: 3,
    roomNumber: '311',
    guestName: 'Kasun Jayawardena',
    serviceType: 'Spa Treatment - Full Body',
    quantity: 1,
    status: 'Requested',
    createdAt: '40 mins ago',
  },
  {
    id: 4,
    roomNumber: '215',
    guestName: 'Ishara Wickramasinghe',
    serviceType: 'Housekeeping: Extra Towels',
    quantity: 2,
    status: 'Completed',
    createdAt: '1 hr ago',
  },
  {
    id: 5,
    roomNumber: '102',
    guestName: 'Dilshan Rathnayake',
    serviceType: 'Maintenance: AC Remote Battery',
    quantity: 1,
    status: 'In Progress',
    createdAt: '2 hrs ago',
  },
];

export const ServiceRequestsQueuePage: FC = () => {
  const [requests, setRequests] = useState<ServiceItem[]>(mockServices);
  const [filter, setFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // New request form state
  const [newRoom, setNewRoom] = useState('');
  const [newGuest, setNewGuest] = useState('');
  const [newService, setNewService] = useState('Room Service');
  const [newQty, setNewQty] = useState('1');

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);

  const handleStatusChange = (
    id: number,
    nextStatus: 'Requested' | 'In Progress' | 'Completed',
  ) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
  };

  const handleAddRequest = () => {
    if (!newRoom) return;
    const item: ServiceItem = {
      id: Date.now(),
      roomNumber: newRoom,
      guestName: newGuest || 'Guest',
      serviceType: newService,
      quantity: Number(newQty) || 1,
      status: 'Requested',
      createdAt: 'Just now',
    };
    setRequests([item, ...requests]);
    setModalOpen(false);
    setNewRoom('');
    setNewGuest('');
  };

  const columns: Column<ServiceItem>[] = [
    { header: 'Room', accessor: 'roomNumber', sortable: true },
    { header: 'Guest', accessor: 'guestName', sortable: true },
    { header: 'Service', accessor: 'serviceType' },
    { header: 'Qty', accessor: 'quantity', align: 'center' },
    { header: 'Time', accessor: 'createdAt' },
    {
      header: 'Status',
      render: (row) => {
        const bg =
          row.status === 'Completed'
            ? 'bg-green-100 text-green-800'
            : row.status === 'In Progress'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800';
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          {row.status === 'Requested' && (
            <CommonButton
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(row.id, 'In Progress')}
            >
              Start
            </CommonButton>
          )}
          {row.status !== 'Completed' && (
            <CommonButton
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange(row.id, 'Completed')}
            >
              Done
            </CommonButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests Queue</h1>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch and track guest amenities, housekeeping, maintenance, and dining orders.
          </p>
        </div>

        <div className="flex gap-2">
          <CommonButton onClick={() => setModalOpen(true)}>+ New Request</CommonButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'Requested', 'In Progress', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === tab
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'all' ? 'All Requests' : tab}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.id}
        searchFilter={(row, q) =>
          row.roomNumber.includes(q) ||
          row.guestName.toLowerCase().includes(q) ||
          row.serviceType.toLowerCase().includes(q)
        }
        searchPlaceholder="Filter requests by room or service..."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Service Request"
        description="Log an on-demand guest request to the service queue."
        footer={
          <>
            <CommonButton variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </CommonButton>
            <CommonButton onClick={handleAddRequest}>Create Request</CommonButton>
          </>
        }
      >
        <div className="space-y-3">
          <FormInput
            label="Room Number"
            placeholder="e.g. 204"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            required
          />
          <FormInput
            label="Guest Name"
            placeholder="Guest name"
            value={newGuest}
            onChange={(e) => setNewGuest(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Service Category
            </label>
            <select
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-gray-900"
            >
              <option value="Room Service: Dinner Special">Room Service: Dinner Special</option>
              <option value="Housekeeping: Extra Towels & Pillows">
                Housekeeping: Extra Towels
              </option>
              <option value="Laundry Service (Express)">Laundry Service (Express)</option>
              <option value="Spa: Full Body Massage">Spa: Full Body Massage</option>
              <option value="Maintenance Request">Maintenance Request</option>
            </select>
          </div>
          <FormInput
            label="Quantity"
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            min="1"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ServiceRequestsQueuePage;
