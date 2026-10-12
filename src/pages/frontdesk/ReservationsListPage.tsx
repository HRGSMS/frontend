import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingStore, type Booking, type BookingStatus } from '../../lib/bookingStore';
import { formatLKR } from '../../lib/currency';

export default function ReservationsListPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await bookingStore.fetchBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleQuickStatusChange = async (id: string | number, newStatus: BookingStatus) => {
    try {
      const updated = await bookingStore.updateBookingStatus(id, newStatus);
      if (updated) {
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        setStatusMessage(`Reservation #${id} updated to ${newStatus}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Unique branches
  const branches = useMemo(() => {
    const list = Array.from(new Set(bookings.map((b) => b.branchName).filter(Boolean)));
    return ['All', ...list];
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        searchQuery === '' ||
        b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.roomNumbers).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.id).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || b.bookingStatus === selectedStatus;

      const matchesBranch = selectedBranch === 'All' || b.branchName === selectedBranch;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [bookings, searchQuery, selectedStatus, selectedBranch]);

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const booked = bookings.filter((b) => b.bookingStatus === 'Booked').length;
    const checkedIn = bookings.filter((b) => b.bookingStatus === 'Checked-In').length;
    const checkedOut = bookings.filter((b) => b.bookingStatus === 'Checked-Out').length;
    const cancelled = bookings.filter((b) => b.bookingStatus === 'Cancelled').length;
    const totalRevenue = bookings
      .filter((b) => b.bookingStatus !== 'Cancelled')
      .reduce((sum, b) => sum + (b.totalCharge || 0), 0);

    return { total, booked, checkedIn, checkedOut, cancelled, totalRevenue };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link to="/frontdesk/dashboard" className="hover:text-blue-600 transition-colors">
                Front Desk
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Reservations</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reservations &amp; Bookings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage room bookings, track guest arrivals and review reservation statuses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              title="Refresh bookings"
            >
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <Link
              to="/frontdesk/reservations/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Reservation
            </Link>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-sm font-medium text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {statusMessage}
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            <span className="text-xs text-slate-400">All bookings</span>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
              Booked
            </span>
            <p className="mt-1 text-2xl font-bold text-blue-950">{stats.booked}</p>
            <span className="text-xs text-blue-600">Awaiting arrival</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
              Checked In
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{stats.checkedIn}</p>
            <span className="text-xs text-emerald-600">In-house guests</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Checked Out
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.checkedOut}</p>
            <span className="text-xs text-slate-500">Completed stays</span>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">
              Cancelled
            </span>
            <p className="mt-1 text-2xl font-bold text-rose-950">{stats.cancelled}</p>
            <span className="text-xs text-rose-600">Void bookings</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">
              Total Value
            </span>
            <p className="mt-1 text-xl font-bold text-amber-950">
              {formatLKR(stats.totalRevenue, false)}
            </p>
            <span className="text-xs text-amber-600">Active revenue</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, email, room, or ID..."
              className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['All', 'Booked', 'Checked-In', 'Checked-Out', 'Cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedStatus === st
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Branch Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Filter by branch"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-600 focus:outline-hidden"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Branches' : b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              <svg
                className="h-6 w-6 animate-spin text-blue-900 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              Loading reservations...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">No reservations found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery || selectedStatus !== 'All' || selectedBranch !== 'All'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first reservation.'}
              </p>
              {(searchQuery || selectedStatus !== 'All' || selectedBranch !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                    setSelectedBranch('All');
                  }}
                  className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Ref / Guest
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Room &amp; Branch
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Dates &amp; Duration
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Financials
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Guest Info */}
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
                            <span className="text-[11px] font-mono text-slate-400">#{b.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Room & Branch */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                              Room {b.roomNumbers}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600">{b.roomType || 'Standard'}</span>
                          <span className="text-[11px] text-slate-400">{b.branchName}</span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-medium text-slate-800 text-xs block">
                            In: {b.checkIn}
                          </span>
                          <span className="font-medium text-slate-800 text-xs block">
                            Out: {b.checkOut}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {b.nights ? `${b.nights} night${b.nights > 1 ? 's' : ''}` : 'Scheduled'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div>
                          {b.bookingStatus === 'Booked' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                              Booked
                            </span>
                          )}
                          {b.bookingStatus === 'Checked-In' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              Checked-In
                            </span>
                          )}
                          {b.bookingStatus === 'Checked-Out' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
                              Checked-Out
                            </span>
                          )}
                          {b.bookingStatus === 'Cancelled' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {formatLKR(b.totalCharge)}
                          </span>
                          {b.outstandingAmount > 0 ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 mt-0.5">
                              Due: {formatLKR(b.outstandingAmount)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 mt-0.5">
                              Paid in full
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.bookingStatus === 'Booked' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(b.id, 'Checked-In')}
                              className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                              title="Check In guest"
                            >
                              Check In
                            </button>
                          )}
                          {b.bookingStatus === 'Checked-In' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(b.id, 'Checked-Out')}
                              className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
                              title="Check Out guest"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/frontdesk/reservations/${b.id}`)}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                          >
                            Details &rarr;
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredBookings.length}</strong> of{' '}
              <strong className="text-slate-800">{bookings.length}</strong> total records
            </span>
            <span>SkyNest Front Desk System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
