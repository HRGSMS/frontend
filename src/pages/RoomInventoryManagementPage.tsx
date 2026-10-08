import type { FC } from 'react';
import { useState } from 'react';
import Table from '../components/common/Table';
import type { Column } from '../components/common/Table';
import CommonButton from '../components/common/Button';
import Modal from '../components/common/Modal';
import FormInput from '../components/common/FormInput';

export interface RoomRecord {
  id: number;
  roomNumber: string;
  floor: number;
  typeName: string;
  dailyRate: number;
  status: 'occupied' | 'vacant-clean' | 'vacant-dirty' | 'maintenance' | 'out-of-order';
}

const mockRoomsData: RoomRecord[] = [
  {
    id: 1,
    roomNumber: '101',
    floor: 1,
    typeName: 'Standard',
    dailyRate: 12000,
    status: 'occupied',
  },
  {
    id: 2,
    roomNumber: '102',
    floor: 1,
    typeName: 'Standard',
    dailyRate: 12000,
    status: 'vacant-clean',
  },
  {
    id: 3,
    roomNumber: '103',
    floor: 1,
    typeName: 'Standard',
    dailyRate: 12000,
    status: 'vacant-dirty',
  },
  {
    id: 4,
    roomNumber: '104',
    floor: 1,
    typeName: 'Standard',
    dailyRate: 12000,
    status: 'out-of-order',
  },
  { id: 5, roomNumber: '201', floor: 2, typeName: 'Deluxe', dailyRate: 18000, status: 'occupied' },
  { id: 6, roomNumber: '202', floor: 2, typeName: 'Deluxe', dailyRate: 18000, status: 'occupied' },
  {
    id: 7,
    roomNumber: '203',
    floor: 2,
    typeName: 'Deluxe',
    dailyRate: 18000,
    status: 'vacant-clean',
  },
  {
    id: 8,
    roomNumber: '204',
    floor: 2,
    typeName: 'Deluxe',
    dailyRate: 18000,
    status: 'maintenance',
  },
  {
    id: 9,
    roomNumber: '301',
    floor: 3,
    typeName: 'Suite',
    dailyRate: 32000,
    status: 'vacant-clean',
  },
  { id: 10, roomNumber: '302', floor: 3, typeName: 'Suite', dailyRate: 32000, status: 'occupied' },
  {
    id: 11,
    roomNumber: '303',
    floor: 3,
    typeName: 'Suite',
    dailyRate: 32000,
    status: 'vacant-dirty',
  },
  { id: 12, roomNumber: '304', floor: 3, typeName: 'Suite', dailyRate: 32000, status: 'occupied' },
];

export const RoomInventoryManagementPage: FC = () => {
  const [rooms, setRooms] = useState<RoomRecord[]>(mockRoomsData);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // New room state
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [typeName, setTypeName] = useState('Deluxe');
  const [dailyRate, setDailyRate] = useState('18000');

  const filteredRooms = rooms.filter((r) => statusFilter === 'all' || r.status === statusFilter);

  const handleStatusToggle = (id: number, nextStatus: RoomRecord['status']) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
  };

  const handleAddRoom = () => {
    if (!roomNumber) return;
    const newRoom: RoomRecord = {
      id: Date.now(),
      roomNumber,
      floor: Number(floor),
      typeName,
      dailyRate: Number(dailyRate),
      status: 'vacant-clean',
    };
    setRooms([...rooms, newRoom]);
    setModalOpen(false);
    setRoomNumber('');
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(val);

  const columns: Column<RoomRecord>[] = [
    { header: 'Room', accessor: 'roomNumber', sortable: true },
    { header: 'Floor', accessor: 'floor', sortable: true, align: 'center' },
    { header: 'Type', accessor: 'typeName' },
    {
      header: 'Daily Rate',
      accessor: 'dailyRate',
      render: (r) => formatCurrency(r.dailyRate),
      sortable: true,
      align: 'right',
    },
    {
      header: 'Condition Status',
      render: (r) => {
        const colors: Record<RoomRecord['status'], string> = {
          'vacant-clean': 'bg-green-100 text-green-800',
          'vacant-dirty': 'bg-amber-100 text-amber-800',
          occupied: 'bg-red-100 text-red-800',
          maintenance: 'bg-purple-100 text-purple-800',
          'out-of-order': 'bg-gray-100 text-gray-700',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[r.status]}`}>
            {r.status}
          </span>
        );
      },
    },
    {
      header: 'Quick Update',
      align: 'right',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatusToggle(r.id, e.target.value as RoomRecord['status'])}
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none"
        >
          <option value="vacant-clean">Vacant Clean</option>
          <option value="vacant-dirty">Vacant Dirty</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="out-of-order">Out of Order</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Inventory Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure room types, rates, and inspect housekeeping & maintenance states across all
            floors.
          </p>
        </div>

        <CommonButton onClick={() => setModalOpen(true)}>+ Add Room</CommonButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'vacant-clean', 'vacant-dirty', 'occupied', 'maintenance', 'out-of-order'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status.replace('-', ' ')}
            </button>
          ),
        )}
      </div>

      <Table
        columns={columns}
        data={filteredRooms}
        keyExtractor={(r) => r.id}
        searchFilter={(row, q) =>
          row.roomNumber.includes(q) || row.typeName.toLowerCase().includes(q)
        }
        searchPlaceholder="Search room number or type..."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Room"
        description="Add a new room to the property inventory."
        footer={
          <>
            <CommonButton variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </CommonButton>
            <CommonButton onClick={handleAddRoom}>Save Room</CommonButton>
          </>
        }
      >
        <div className="space-y-3">
          <FormInput
            label="Room Number"
            placeholder="e.g. 405"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />
          <FormInput
            label="Floor"
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Room Type
            </label>
            <select
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-gray-900"
            >
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Presidential Suite">Presidential Suite</option>
            </select>
          </div>
          <FormInput
            label="Daily Rate (LKR)"
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoomInventoryManagementPage;
