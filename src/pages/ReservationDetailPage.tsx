import type { FC } from 'react';
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CommonButton from '../components/common/Button';
import Modal from '../components/common/Modal';

interface FolioItem {
  id: number;
  description: string;
  category: 'Room' | 'Service' | 'Tax' | 'Payment';
  amount: number;
  date: string;
}

export const ReservationDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bookingStatus, setBookingStatus] = useState<string>('CheckedIn');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Mock booking data
  const booking = {
    bookingId: id || 'RES-4530',
    guest: {
      id: 'GST-101',
      firstName: 'Nimal',
      lastName: 'Perera',
      email: 'nimal.perera@example.com',
      phoneNumber: '+94 77 123 4567',
      idNumber: '199245102948',
    },
    rooms: [
      { roomId: 12, roomNumber: '204', typeName: 'Deluxe Suite', dailyRate: 18000, nights: 3 },
    ],
    checkInTime: '2026-10-02T14:00:00',
    checkOutTime: '2026-10-05T11:00:00',
    specialRequests: 'High floor preferred, late check-in requested.',
    totalCharge: 54000,
    paidAmount: 24000,
    outstandingAmount: 30000,
  };

  const [folioItems] = useState<FolioItem[]>([
    { id: 1, description: 'Room Charge (Deluxe Suite, 3 nights)', category: 'Room', amount: 54000, date: '2026-10-02' },
    { id: 2, description: 'Room Service: Dinner special', category: 'Service', amount: 4500, date: '2026-10-02' },
    { id: 3, description: 'Deposit via Credit Card (•••• 4242)', category: 'Payment', amount: -28500, date: '2026-10-02' },
  ]);

  const currentOutstanding = folioItems.reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(val);

  const handleCheckIn = () => {
    setBookingStatus('CheckedIn');
  };

  const handleCheckOut = () => {
    if (currentOutstanding > 0) {
      alert('Outstanding balance must be settled before checkout!');
      return;
    }
    setBookingStatus('CheckedOut');
  };

  const handleCancelBooking = () => {
    setBookingStatus('Cancelled');
    setCancelModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/reservations/all" className="text-sm text-gray-500 hover:text-gray-900">
              ← Back to Reservations
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {bookingStatus}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Reservation {booking.bookingId}</h1>
        </div>

        <div className="flex items-center gap-2">
          {bookingStatus === 'Confirmed' && (
            <CommonButton variant="primary" onClick={handleCheckIn}>
              Check In Guest
            </CommonButton>
          )}

          {bookingStatus === 'CheckedIn' && (
            <CommonButton
              variant={currentOutstanding > 0 ? 'secondary' : 'primary'}
              onClick={handleCheckOut}
            >
              Check Out
            </CommonButton>
          )}

          {currentOutstanding > 0 && (
            <CommonButton
              variant="outline"
              onClick={() => navigate(`/billing/payment?bookingId=${booking.bookingId}`)}
            >
              Process Payment
            </CommonButton>
          )}

          {bookingStatus !== 'Cancelled' && bookingStatus !== 'CheckedOut' && (
            <CommonButton variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
              Cancel
            </CommonButton>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Stay & Room Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4">Stay Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs block">Check-In</span>
                <span className="font-semibold text-gray-800">Oct 02, 2026 (2:00 PM)</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Check-Out</span>
                <span className="font-semibold text-gray-800">Oct 05, 2026 (11:00 AM)</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Duration</span>
                <span className="font-semibold text-gray-800">3 Nights</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Assigned Rooms
              </h3>
              {booking.rooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/60"
                >
                  <div>
                    <span className="font-bold text-gray-900">Room {room.roomNumber}</span>
                    <span className="text-gray-500 text-xs ml-2">({room.typeName})</span>
                  </div>
                  <span className="font-medium text-gray-700">{formatCurrency(room.dailyRate)} / night</span>
                </div>
              ))}
            </div>

            {booking.specialRequests && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                <span className="font-semibold text-gray-700">Special Requests: </span>
                <span className="text-gray-600">{booking.specialRequests}</span>
              </div>
            )}
          </div>

          {/* Folio & Charges */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Billing Folio</h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  currentOutstanding > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {currentOutstanding > 0
                  ? `Due: ${formatCurrency(currentOutstanding)}`
                  : 'Fully Settled'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr className="text-gray-500 font-semibold text-left">
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {folioItems.map((item) => (
                    <tr key={item.id} className="text-gray-700">
                      <td className="py-2 whitespace-nowrap">{item.date}</td>
                      <td className="py-2 font-medium">{item.description}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">
                          {item.category}
                        </span>
                      </td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          item.amount < 0 ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Guest Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4">Guest Information</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-sm">
                {booking.guest.firstName[0]}
                {booking.guest.lastName[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {booking.guest.firstName} {booking.guest.lastName}
                </h3>
                <span className="text-gray-400 text-xs">Guest ID: {booking.guest.id}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div>
                <span className="text-gray-400 block">Email</span>
                <a href={`mailto:${booking.guest.email}`} className="text-blue-600 hover:underline">
                  {booking.guest.email}
                </a>
              </div>
              <div>
                <span className="text-gray-400 block">Phone</span>
                <span>{booking.guest.phoneNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block">National ID / Passport</span>
                <span>{booking.guest.idNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation?"
        description="Are you sure you want to cancel this reservation? This will free the allocated room(s)."
        footer={
          <>
            <CommonButton variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </CommonButton>
            <CommonButton variant="danger" onClick={handleCancelBooking}>
              Confirm Cancellation
            </CommonButton>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Booking <strong>{booking.bookingId}</strong> for <strong>{booking.guest.firstName} {booking.guest.lastName}</strong> will be marked as Cancelled.
        </p>
      </Modal>
    </div>
  );
};

export default ReservationDetailPage;
