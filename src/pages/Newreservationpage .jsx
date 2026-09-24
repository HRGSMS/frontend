import { useMemo, useState } from 'react';

// TODO: replace with real API calls once these exist:
// - reservationApi.listBranches()
// - reservationApi.listRoomTypes()
// - reservationApi.getAvailability(params)
// - reservationApi.createBooking(data)
// - a guest search endpoint (not explicitly listed in api/ yet — flag for backend)

const mockGuests = [
  {
    guestId: 1,
    firstName: 'Nimal',
    lastName: 'Perera',
    email: 'nimal.perera@example.com',
    phoneNumber: '0771234567',
  },
  {
    guestId: 2,
    firstName: 'Anushka',
    lastName: 'Fernando',
    email: 'anushka.f@example.com',
    phoneNumber: '0719876543',
  },
  {
    guestId: 3,
    firstName: 'Kasun',
    lastName: 'Jayawardena',
    email: 'kasun.j@example.com',
    phoneNumber: '0765554433',
  },
];

const mockBranches = [
  { branchId: 1, name: 'Sky Nest Colombo' },
  { branchId: 2, name: 'Sky Nest Kandy' },
];

const mockRoomTypes = [
  { roomTypeId: 1, typeName: 'Standard', dailyRate: 12000 },
  { roomTypeId: 2, typeName: 'Deluxe', dailyRate: 18000 },
  { roomTypeId: 3, typeName: 'Suite', dailyRate: 32000 },
];

// Mock availability result — in reality this comes from getAvailability(params)
const mockAvailableRooms = [
  { roomId: 12, roomNumber: '204', roomTypeId: 2, typeName: 'Deluxe', dailyRate: 18000 },
  { roomId: 15, roomNumber: '207', roomTypeId: 2, typeName: 'Deluxe', dailyRate: 18000 },
  { roomId: 22, roomNumber: '310', roomTypeId: 3, typeName: 'Suite', dailyRate: 32000 },
];

const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);

const Stepper = ({ step }) => {
  const steps = ['Guest', 'Availability', 'Confirm'];
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? 'bg-green-600 text-white'
                  : active
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`text-sm ${active ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              {label}
            </span>
            {n < steps.length && <div className="mx-2 h-px w-8 bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );
};

const NewReservationPage = ({ onCreateBooking }) => {
  const [step, setStep] = useState(1);

  // Step 1: guest
  const [guestMode, setGuestMode] = useState('existing');
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  // Step 2: availability search
  const [branchId, setBranchId] = useState(mockBranches[0].branchId);
  const [roomTypeId, setRoomTypeId] = useState('all');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [searched, setSearched] = useState(false);

  // Step 3: room selection
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const filteredGuests = useMemo(
    () =>
      mockGuests.filter((g) =>
        `${g.firstName} ${g.lastName} ${g.email}`.toLowerCase().includes(guestSearch.toLowerCase()),
      ),
    [guestSearch],
  );

  const guest =
    guestMode === 'existing'
      ? selectedGuest
      : newGuest.firstName && newGuest.lastName
        ? newGuest
        : null;

  const nights = nightsBetween(checkInTime, checkOutTime);

  const availableRooms = useMemo(
    () =>
      mockAvailableRooms.filter((r) => roomTypeId === 'all' || r.roomTypeId === Number(roomTypeId)),
    [roomTypeId],
  );

  const selectedRoom = availableRooms.find((r) => r.roomId === selectedRoomId);
  const totalCharge = selectedRoom ? selectedRoom.dailyRate * nights : 0;

  const handleSearch = () => {
    setSearched(true);
    setStep(3);
  };

  const handleConfirmBooking = () => {
    const bookingData = {
      guest,
      branchId,
      roomId: selectedRoomId,
      checkInTime,
      checkOutTime,
      totalCharge,
    };
    onCreateBooking?.(bookingData);
    console.log('createBooking payload', bookingData);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-2 text-2xl">✓</div>
        <h2 className="mb-1 text-lg font-bold text-gray-900">Reservation Created</h2>
        <p className="text-sm text-gray-600">
          {guest?.firstName} {guest?.lastName} · Room {selectedRoom?.roomNumber} ·{' '}
          {formatCurrency(totalCharge)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-gray-900">New Reservation</h1>
      <Stepper step={step} />

      {/* Step 1: Guest */}
      {step === 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setGuestMode('existing')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                guestMode === 'existing' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Existing Guest
            </button>
            <button
              onClick={() => setGuestMode('new')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                guestMode === 'new' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              New Guest
            </button>
          </div>

          {guestMode === 'existing' ? (
            <div>
              <input
                type="text"
                placeholder="Search by name or email"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="mb-3 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="space-y-1">
                {filteredGuests.map((g) => (
                  <button
                    key={g.guestId}
                    onClick={() => setSelectedGuest(g)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                      selectedGuest?.guestId === g.guestId
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-900">
                      {g.firstName} {g.lastName}
                    </span>
                    <span className="text-xs text-gray-500">{g.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="First name"
                value={newGuest.firstName}
                onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Last name"
                value={newGuest.lastName}
                onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Email"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="Phone number"
                value={newGuest.phoneNumber}
                onChange={(e) => setNewGuest({ ...newGuest, phoneNumber: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              disabled={!guest}
              onClick={() => setStep(2)}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Availability search */}
      {step === 2 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={branchId}
              onChange={(e) => setBranchId(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              {mockBranches.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Any room type</option>
              {mockRoomTypes.map((rt) => (
                <option key={rt.roomTypeId} value={rt.roomTypeId}>
                  {rt.typeName} — {formatCurrency(rt.dailyRate)}/night
                </option>
              ))}
            </select>
            <input
              type="date"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Back
            </button>
            <button
              disabled={!checkInTime || !checkOutTime || nights <= 0}
              onClick={handleSearch}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Search Availability
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Room selection + confirm */}
      {step === 3 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {availableRooms.length} room(s) available · {nights} night{nights !== 1 ? 's' : ''}
          </h2>

          <div className="mb-4 space-y-1.5">
            {availableRooms.map((r) => (
              <button
                key={r.roomId}
                onClick={() => setSelectedRoomId(r.roomId)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                  selectedRoomId === r.roomId
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-900">
                  Room {r.roomNumber} · {r.typeName}
                </span>
                <span className="text-gray-600">{formatCurrency(r.dailyRate)}/night</span>
              </button>
            ))}
          </div>

          {selectedRoom && (
            <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Guest</span>
                <span className="font-medium text-gray-900">
                  {guest?.firstName} {guest?.lastName}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Room</span>
                <span className="font-medium text-gray-900">{selectedRoom.roomNumber}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total ({nights} nights)</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalCharge)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Back
            </button>
            <button
              disabled={!selectedRoom}
              onClick={handleConfirmBooking}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewReservationPage;
