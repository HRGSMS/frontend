import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookingStore, type Booking } from '../../lib/bookingStore';

export default function CheckInOutPage() {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Active modal target
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<'check-in' | 'check-out' | null>(null);

  // Modal form states
  const [idVerified, setIdVerified] = useState(true);
  const [keyIssued, setKeyIssued] = useState(true);
  const [keyReturned, setKeyReturned] = useState(true);
  const [balanceSettled, setBalanceSettled] = useState(true);

  useEffect(() => {
    let active = true;
    bookingStore
      .fetchBookings()
      .then((data) => {
        if (active) {
          setBookings(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load bookings', err);
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter queues
  const arrivalsQueue = useMemo(() => {
    return bookings.filter((b) => b.bookingStatus === 'Booked');
  }, [bookings]);

  const departuresQueue = useMemo(() => {
    return bookings.filter((b) => b.bookingStatus === 'Checked-In');
  }, [bookings]);

  const currentList = activeTab === 'arrivals' ? arrivalsQueue : departuresQueue;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (b) =>
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        String(b.roomNumbers).toLowerCase().includes(q) ||
        String(b.id).toLowerCase().includes(q),
    );
  }, [currentList, searchQuery]);

  const openActionModal = (booking: Booking, type: 'check-in' | 'check-out') => {
    setSelectedBookingForAction(booking);
    setActionType(type);
    setIdVerified(true);
    setKeyIssued(true);
    setKeyReturned(true);
    setBalanceSettled(booking.outstandingAmount === 0);
  };

  const closeActionModal = () => {
    setSelectedBookingForAction(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedBookingForAction || !actionType) return;

    const newStatus = actionType === 'check-in' ? 'Checked-In' : 'Checked-Out';

    try {
      const updated = await bookingStore.updateBookingStatus(
        selectedBookingForAction.id,
        newStatus,
      );

      if (updated) {
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        setNotification(
          actionType === 'check-in'
            ? `Guest ${updated.guestName} successfully checked into Room ${updated.roomNumbers}.`
            : `Guest ${updated.guestName} successfully checked out from Room ${updated.roomNumbers}.`,
        );
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Failed to execute action', err);
    } finally {
      closeActionModal();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link to="/frontdesk/dashboard" className="hover:text-blue-600 transition-colors">
                Front Desk
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Check-In &amp; Check-Out</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Check-In &amp; Check-Out Hub
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Process guest arrivals, issue key cards, and complete room clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/frontdesk/reservations"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              All Reservations
            </Link>
            <Link
              to="/frontdesk/reservations/new"
              className="rounded-lg bg-blue-900 px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
            >
              + New Reservation
            </Link>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab & Search Bar */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('arrivals')}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === 'arrivals'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Arrivals (Check-In)</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === 'arrivals'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {arrivalsQueue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('departures')}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === 'departures'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Departures (Check-Out)</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === 'departures'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {departuresQueue.length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest, room, or ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-blue-900 focus:outline-hidden"
            />
            <svg
              className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Main List Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-slate-500">
              Loading operational queue...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                {activeTab === 'arrivals' ? 'No pending arrivals' : 'No scheduled departures'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery
                  ? 'No matching guests found with the current search query.'
                  : activeTab === 'arrivals'
                    ? 'All scheduled guests for today have been checked in.'
                    : 'All in-house departures have been processed.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Guest &amp; Reference
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Room &amp; Property
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Scheduled Dates
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Payment &amp; Folio
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Operational Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Guest Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-900 text-xs">
                            {b.guestName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {b.guestName}
                            </span>
                            <span className="text-xs text-slate-500 block">{b.guestEmail}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              Ref: #{b.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Room & Branch */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                            Room {b.roomNumbers}
                          </span>
                          <span className="text-xs text-slate-600 block mt-1">
                            {b.roomType || 'Standard'}
                          </span>
                          <span className="text-[11px] text-slate-400">{b.branchName}</span>
                        </div>
                      </td>

                      {/* Stay Dates */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-xs font-medium text-slate-800 block">
                            {activeTab === 'arrivals'
                              ? `Arrival: ${b.checkIn}`
                              : `Departure: ${b.checkOut}`}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {b.nights ? `${b.nights} night stay` : 'Active'}
                          </span>
                          {b.specialRequests && (
                            <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 font-medium border border-amber-200">
                              Special Request
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 text-xs block">
                            Total: ${b.totalCharge.toFixed(2)}
                          </span>
                          {b.outstandingAmount > 0 ? (
                            <span className="inline-flex items-center text-[11px] font-bold text-amber-600">
                              Balance due: ${b.outstandingAmount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-emerald-600">
                              Fully paid
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/frontdesk/reservations/${b.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </Link>
                          {activeTab === 'arrivals' ? (
                            <button
                              type="button"
                              onClick={() => openActionModal(b, 'check-in')}
                              className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
                            >
                              Check In &rarr;
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openActionModal(b, 'check-out')}
                              className="rounded-lg bg-blue-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                            >
                              Check Out &rarr;
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Operational Modal */}
        {selectedBookingForAction && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {actionType === 'check-in' ? 'Process Guest Check-In' : 'Process Guest Check-Out'}
                </h3>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBookingForAction.guestName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Room:</span>
                  <span className="font-bold text-slate-900">
                    Room {selectedBookingForAction.roomNumbers} (
                    {selectedBookingForAction.branchName})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Charge:</span>
                  <span className="font-semibold text-slate-800">
                    ${selectedBookingForAction.totalCharge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span
                    className={`font-bold ${selectedBookingForAction.outstandingAmount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}
                  >
                    ${selectedBookingForAction.outstandingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checklists */}
              <div className="mt-4 space-y-2.5">
                {actionType === 'check-in' ? (
                  <>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={idVerified}
                        onChange={(e) => setIdVerified(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span>Guest photo ID / Passport verified</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyIssued}
                        onChange={(e) => setKeyIssued(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span>Keycard encoded and handed to guest</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyReturned}
                        onChange={(e) => setKeyReturned(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span>Room keycard(s) returned and deactivated</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={balanceSettled}
                        onChange={(e) => setBalanceSettled(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <span>Folio review &amp; incidentals balance settled</span>
                    </label>
                  </>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs ${
                    actionType === 'check-in'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {actionType === 'check-in' ? 'Complete Check-In' : 'Complete Check-Out'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
