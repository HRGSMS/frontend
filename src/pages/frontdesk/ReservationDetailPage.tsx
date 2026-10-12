import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingStore, type Booking, type BookingStatus } from '../../lib/bookingStore';
import { formatLKR } from '../../lib/currency';

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const found = await bookingStore.getBookingById(id);
        setBooking(found);
      } catch (err) {
        console.error('Failed to load reservation details', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookingDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    if (!booking) return;
    try {
      const updated = await bookingStore.updateBookingStatus(booking.id, newStatus);
      if (updated) {
        setBooking(updated);
        setNotification(`Reservation successfully updated to "${newStatus}".`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Failed to update reservation status', err);
    }
  };

  const handleSettleBalance = () => {
    if (!booking) return;
    const updated: Booking = {
      ...booking,
      outstandingAmount: 0,
      paymentStatus: 'Paid',
    };
    setBooking(updated);
    setIsProcessingPayment(false);
    setNotification('Outstanding balance successfully settled.');
    setTimeout(() => setNotification(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="h-6 w-6 animate-spin text-blue-900" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading reservation details...
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-6">
        <div className="mx-auto max-w-2xl py-16 text-center">
          <h2 className="text-xl font-bold text-slate-900">Reservation Not Found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Could not find reservation with ID #{id}. It may have been removed or does not exist.
          </p>
          <div className="mt-6">
            <Link
              to="/frontdesk/reservations"
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-800"
            >
              &larr; Back to Reservations List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Top Header & Breadcrumbs */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/frontdesk/dashboard" className="hover:text-blue-600 transition-colors">
              Front Desk
            </Link>
            <span>/</span>
            <Link to="/frontdesk/reservations" className="hover:text-blue-600 transition-colors">
              Reservations
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">#{booking.id}</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Reservation #{booking.id}
              </h1>
              {booking.bookingStatus === 'Booked' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Booked
                </span>
              )}
              {booking.bookingStatus === 'Checked-In' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Checked-In
                </span>
              )}
              {booking.bookingStatus === 'Checked-Out' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  Checked-Out
                </span>
              )}
              {booking.bookingStatus === 'Cancelled' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                  Cancelled
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {booking.bookingStatus === 'Booked' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Checked-In')}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
                >
                  Confirm Check In &rarr;
                </button>
              )}
              {booking.bookingStatus === 'Checked-In' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Checked-Out')}
                  className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                >
                  Complete Check Out &rarr;
                </button>
              )}
              {booking.bookingStatus === 'Booked' && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(true)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  Cancel Booking
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                Print Folio
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800 flex items-center justify-between">
            <span>{notification}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {isConfirmingCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Cancel this Reservation?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to cancel booking #{booking.id} for{' '}
                <span className="font-semibold text-slate-800">{booking.guestName}</span>? This room
                will be released back to the inventory.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  No, Keep Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusUpdate('Cancelled');
                    setIsConfirmingCancel(false);
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Yes, Cancel Reservation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settlement Modal */}
        {isProcessingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Settle Outstanding Balance</h3>
              <p className="mt-2 text-sm text-slate-500">
                Outstanding Balance for {booking.guestName}:{' '}
                <span className="font-bold text-slate-900">
                  {formatLKR(booking.outstandingAmount)}
                </span>
              </p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Payment Method</label>
                <select className="block w-full rounded-lg border border-slate-200 p-2 text-sm">
                  <option>Credit Card (POS Terminal)</option>
                  <option>Cash (Front Desk Till)</option>
                  <option>Direct Bank Transfer</option>
                  <option>Room Bill Master</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProcessingPayment(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSettleBalance}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Confirm Settle {formatLKR(booking.outstandingAmount)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Lifecycle Indicator */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Reservation Journey
          </h3>
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-white font-bold">
                ✓
              </div>
              <span className="mt-1.5 text-slate-900 font-semibold">Booked</span>
              <span className="text-[11px] text-slate-400">
                {booking.bookingTime?.split('T')[0] || 'Confirmed'}
              </span>
            </div>
            <div
              className={`h-0.5 flex-1 mx-2 ${booking.bookingStatus === 'Checked-In' || booking.bookingStatus === 'Checked-Out' ? 'bg-blue-900' : 'bg-slate-200'}`}
            />
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  booking.bookingStatus === 'Checked-In' || booking.bookingStatus === 'Checked-Out'
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {booking.bookingStatus === 'Checked-In' || booking.bookingStatus === 'Checked-Out'
                  ? '✓'
                  : '2'}
              </div>
              <span className="mt-1.5 text-slate-900 font-semibold">Checked-In</span>
              <span className="text-[11px] text-slate-400">{booking.checkIn}</span>
            </div>
            <div
              className={`h-0.5 flex-1 mx-2 ${booking.bookingStatus === 'Checked-Out' ? 'bg-blue-900' : 'bg-slate-200'}`}
            />
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  booking.bookingStatus === 'Checked-Out'
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {booking.bookingStatus === 'Checked-Out' ? '✓' : '3'}
              </div>
              <span className="mt-1.5 text-slate-900 font-semibold">Checked-Out</span>
              <span className="text-[11px] text-slate-400">{booking.checkOut}</span>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Guest & Stay Profile */}
          <div className="space-y-6 lg:col-span-2">
            {/* Guest Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
                Guest Profile
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Full Name</span>
                  <span className="font-semibold text-slate-900 text-base">
                    {booking.guestName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Email Address</span>
                  <span className="font-medium text-slate-800">{booking.guestEmail}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone Number</span>
                  <span className="font-medium text-slate-800">
                    {booking.guestPhone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Booking Channel</span>
                  <span className="font-medium text-slate-800">
                    {booking.source || 'Front Desk'}
                  </span>
                </div>
                {booking.specialRequests && (
                  <div className="sm:col-span-2 rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900">
                    <strong className="block font-semibold mb-0.5">Special Requests:</strong>
                    {booking.specialRequests}
                  </div>
                )}
              </div>
            </div>

            {/* Stay & Room Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100">
                Accommodation &amp; Stay
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Assigned Room</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="rounded bg-blue-100 px-2.5 py-1 font-mono text-xs font-bold text-blue-900">
                      Room {booking.roomNumbers}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {booking.roomType || 'Deluxe'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Branch Property</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {booking.branchName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Check-in Date</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {booking.checkIn}
                  </span>
                  <span className="text-[11px] text-slate-400">Standard check-in from 14:00</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Check-out Date</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {booking.checkOut}
                  </span>
                  <span className="text-[11px] text-slate-400">Standard check-out until 12:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Folio & Billing Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">Billing &amp; Folio</h3>
                {booking.paymentStatus === 'Paid' ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    Paid
                  </span>
                ) : booking.paymentStatus === 'Partially Paid' ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                    Partially Paid
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                    Pending
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Room Charges ({booking.nights || 1} nights)</span>
                  <span>
                    {formatLKR((booking.totalCharge || 0) - (booking.totalTaxAmount || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes &amp; Service Charge</span>
                  <span>{formatLKR(booking.totalTaxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2 text-base">
                  <span>Total Amount</span>
                  <span>{formatLKR(booking.totalCharge)}</span>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 mt-3 space-y-1.5 border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Amount Paid</span>
                    <span className="font-semibold text-emerald-700">
                      {formatLKR((booking.totalCharge || 0) - (booking.outstandingAmount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Balance Outstanding</span>
                    <span
                      className={`font-bold ${booking.outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-800'}`}
                    >
                      {formatLKR(booking.outstandingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {booking.outstandingAmount > 0 && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setIsProcessingPayment(true)}
                    className="w-full rounded-xl bg-blue-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                  >
                    Settle Balance ({formatLKR(booking.outstandingAmount)})
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions Nav */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-xs space-y-2">
              <Link
                to="/frontdesk/check-in-out"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              >
                <span>Go to Check-In / Check-Out Counter</span>
                <span>&rarr;</span>
              </Link>
              <Link
                to="/frontdesk/payment-processing"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              >
                <span>Payment Processing Module</span>
                <span>&rarr;</span>
              </Link>
              <Link
                to="/frontdesk/service-requests"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              >
                <span>Guest Service Requests</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
