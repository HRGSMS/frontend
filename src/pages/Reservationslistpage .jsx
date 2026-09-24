import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

// TODO: replace with a real API call (e.g. reservationApi.listBookings(filters))
// once the backend endpoint exists. Shape assumed based on the Booking + Guest +
// BookingRooms tables in the ERD.
const mockReservations = [
  {
    bookingId: 'RES-4530',
    guestName: 'Nimal Perera',
    roomNumbers: ['204'],
    checkInTime: '2026-10-02T14:00:00',
    checkOutTime: '2026-10-05T11:00:00',
    bookingStatus: 'Confirmed',
    paymentStatus: 'Unpaid',
    totalCharge: 45000,
    outstandingAmount: 45000,
  },
  {
    bookingId: 'RES-4522',
    guestName: 'Anushka Fernando',
    roomNumbers: ['108'],
    checkInTime: '2026-09-24T15:30:00',
    checkOutTime: '2026-09-27T11:00:00',
    bookingStatus: 'Confirmed',
    paymentStatus: 'Partial',
    totalCharge: 36000,
    outstandingAmount: 12000,
  },
  {
    bookingId: 'RES-4519',
    guestName: 'Kasun Jayawardena',
    roomNumbers: ['311'],
    checkInTime: '2026-09-24T11:00:00',
    checkOutTime: '2026-09-26T11:00:00',
    bookingStatus: 'CheckedIn',
    paymentStatus: 'Paid',
    totalCharge: 24000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4501',
    guestName: 'Sanjeewa Herath',
    roomNumbers: ['112'],
    checkInTime: '2026-09-20T14:00:00',
    checkOutTime: '2026-09-24T11:00:00',
    bookingStatus: 'CheckedIn',
    paymentStatus: 'Paid',
    totalCharge: 52000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4497',
    guestName: 'Roshan Gunawardena',
    roomNumbers: ['305'],
    checkInTime: '2026-09-18T13:00:00',
    checkOutTime: '2026-09-23T11:00:00',
    bookingStatus: 'CheckedOut',
    paymentStatus: 'Paid',
    totalCharge: 61000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4488',
    guestName: 'Tharindu Bandara',
    roomNumbers: ['201', '202'],
    checkInTime: '2026-09-15T14:00:00',
    checkOutTime: '2026-09-17T11:00:00',
    bookingStatus: 'Cancelled',
    paymentStatus: 'Unpaid',
    totalCharge: 28000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4489',
    guestName: 'Tharindu Herath',
    roomNumbers: ['203'],
    checkInTime: '2026-09-15T14:00:00',
    checkOutTime: '2026-09-17T11:00:00',
    bookingStatus: 'paid',
    paymentStatus: 'Unpaid',
    totalCharge: 14000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4491',
    guestName: 'Tharindu Perera',
    roomNumbers: ['204'],
    checkInTime: '2026-09-15T14:00:00',
    checkOutTime: '2026-09-17T11:00:00',
    bookingStatus: 'Confirmed',
    paymentStatus: 'Partial',
    totalCharge: 28000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4490',
    guestName: 'Kasun Perera',
    roomNumbers: ['101'],
    checkInTime: '2026-09-18T14:00:00',
    checkOutTime: '2026-09-20T10:30:00',
    bookingStatus: 'confirmed',
    paymentStatus: 'Paid',
    totalCharge: 15000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4491',
    guestName: 'Dilini Fernando',
    roomNumbers: ['305'],
    checkInTime: '2026-09-21T12:00:00',
    checkOutTime: '2026-09-22T11:00:00',
    bookingStatus: 'pending',
    paymentStatus: 'Unpaid',
    totalCharge: 9500,
    outstandingAmount: 9500,
  },
  {
    bookingId: 'RES-4492',
    guestName: 'Nuwan Silva',
    roomNumbers: ['201', '202'],
    checkInTime: '2026-09-23T15:00:00',
    checkOutTime: '2026-09-26T11:00:00',
    bookingStatus: 'confirmed',
    paymentStatus: 'Partial',
    totalCharge: 42000,
    outstandingAmount: 12000,
  },
  {
    bookingId: 'RES-4493',
    guestName: 'Shenali De Silva',
    roomNumbers: ['402'],
    checkInTime: '2026-09-24T14:00:00',
    checkOutTime: '2026-09-25T10:00:00',
    bookingStatus: 'checked-in',
    paymentStatus: 'Paid',
    totalCharge: 18500,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4494',
    guestName: 'Malith Jayawardena',
    roomNumbers: ['104'],
    checkInTime: '2026-09-27T13:30:00',
    checkOutTime: '2026-09-29T11:00:00',
    bookingStatus: 'cancelled',
    paymentStatus: 'Refunded',
    totalCharge: 22000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4495',
    guestName: 'Amara Wijesinghe',
    roomNumbers: ['301', '302'],
    checkInTime: '2026-09-30T14:00:00',
    checkOutTime: '2026-10-03T11:00:00',
    bookingStatus: 'confirmed',
    paymentStatus: 'Paid',
    totalCharge: 45000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4496',
    guestName: 'Kavinda Rathnayake',
    roomNumbers: ['105'],
    checkInTime: '2026-10-01T15:00:00',
    checkOutTime: '2026-10-02T10:30:00',
    bookingStatus: 'checked-in',
    paymentStatus: 'Partial',
    totalCharge: 12500,
    outstandingAmount: 2500,
  },
  {
    bookingId: 'RES-4497',
    guestName: 'Chathuri Jayasinghe',
    roomNumbers: ['401'],
    checkInTime: '2026-10-04T12:30:00',
    checkOutTime: '2026-10-06T11:00:00',
    bookingStatus: 'pending',
    paymentStatus: 'Unpaid',
    totalCharge: 21000,
    outstandingAmount: 21000,
  },
  {
    bookingId: 'RES-4498',
    guestName: 'Dhanushka Bandara',
    roomNumbers: ['205', '206'],
    checkInTime: '2026-10-05T14:00:00',
    checkOutTime: '2026-10-08T11:00:00',
    bookingStatus: 'confirmed',
    paymentStatus: 'Paid',
    totalCharge: 52000,
    outstandingAmount: 0,
  },
  {
    bookingId: 'RES-4499',
    guestName: 'Nipuni Gunawardena',
    roomNumbers: ['102'],
    checkInTime: '2026-10-10T13:00:00',
    checkOutTime: '2026-10-11T10:00:00',
    bookingStatus: 'cancelled',
    paymentStatus: 'Refunded',
    totalCharge: 11000,
    outstandingAmount: 0,
  },
];

const statusConfig = {
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-700' },
  CheckedIn: { bg: 'bg-green-50', text: 'text-green-700' },
  CheckedOut: { bg: 'bg-gray-100', text: 'text-gray-700' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
  NoShow: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

const paymentStatusConfig = {
  Paid: { bg: 'bg-green-50', text: 'text-green-700' },
  Partial: { bg: 'bg-amber-50', text: 'text-amber-700' },
  Unpaid: { bg: 'bg-red-50', text: 'text-red-700' },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });

const ReservationsListPage = ({ reservations = mockReservations }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.bookingStatus === statusFilter;
      const matchesSearch =
        search.trim() === '' ||
        r.guestName.toLowerCase().includes(search.toLowerCase()) ||
        r.bookingId.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, search]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between ml-3">
        <h1 className="text-xl font-bold text-gray-900">All Reservations</h1>
        <Link
          to="/reservations/new"
          className="rounded-md bg-gray-900 px-3 mr-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New Reservation
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 ml-7">
        <input
          type="text"
          placeholder="Search guest or reservation ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {Object.keys(statusConfig).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm ml-3 mr-5">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Reservation</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Guest</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Room(s)</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Check-In</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Check-Out</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Payment</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Outstanding</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const sCfg = statusConfig[r.bookingStatus] ?? statusConfig.Confirmed;
              const pCfg = paymentStatusConfig[r.paymentStatus] ?? paymentStatusConfig.Unpaid;
              return (
                <tr key={r.bookingId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{r.bookingId}</td>
                  <td className="px-4 py-2 text-gray-700">{r.guestName}</td>
                  <td className="px-4 py-2 text-gray-700">{r.roomNumbers.join(', ')}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(r.checkInTime)}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(r.checkOutTime)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${sCfg.bg} ${sCfg.text}`}
                    >
                      {r.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${pCfg.bg} ${pCfg.text}`}
                    >
                      {r.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {r.outstandingAmount > 0 ? (
                      <span className="font-medium text-red-600">
                        {formatCurrency(r.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/reservations/${r.bookingId}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">
                  No reservations match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReservationsListPage;
