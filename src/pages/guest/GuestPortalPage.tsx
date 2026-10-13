import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import {
  guestApi,
  type GuestBooking,
  type GuestProfile,
  type GuestServiceUsage,
  type ServiceItem,
  type PaymentMethod,
  type HotelConfig,
} from '../../api/guestApi';
import { FloatingContactButtonAuto } from '../../components/FloatingContactButton';
import './GuestPortalPage.css';

/* ── Status badges matching FrontDesk Dashboard ────────────────── */
const BookingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Booked: 'bg-blue-50 text-blue-700 border-blue-200',
    'Checked-In': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Checked-Out': 'bg-slate-100 text-slate-700 border-slate-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        map[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
    'Partially Paid': 'bg-amber-50 text-amber-800 border-amber-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Credit Due': 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        map[status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
};

/* ── Helpers ──────────────────────────────────────────────────── */
function lkr(amount: number | string | undefined) {
  return `LKR ${Number(amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
}

function shortDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nightCount(b: GuestBooking) {
  if (!b.check_in_time || !b.check_out_time) return 0;
  return Math.max(
    1,
    Math.round(
      (new Date(b.check_out_time).getTime() - new Date(b.check_in_time).getTime()) / 86400000,
    ),
  );
}

export const GuestPortalPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active booking expanded in the UI
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageByBooking, setUsageByBooking] = useState<Record<string, GuestServiceUsage[]>>({});

  // Pay-balance modal
  const [payBooking, setPayBooking] = useState<GuestBooking | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Cancel modal
  const [cancelBooking, setCancelBooking] = useState<GuestBooking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Service order modal
  const [orderBooking, setOrderBooking] = useState<GuestBooking | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [qty, setQty] = useState('1');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, b, s, methods, cfg] = await Promise.all([
        guestApi.getProfile(),
        guestApi.getBookings(),
        guestApi.getServices(),
        guestApi.getPaymentMethods(),
        guestApi.getHotelConfig().catch(() => null),
      ]);
      setProfile(p);
      setBookings(b);
      setServices(s);
      setPaymentMethods(methods);
      setHotelConfig(cfg);
      if (methods.length > 0) setPayMethod(methods[0].method_name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load guest portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const loadUsage = async (bookingPid: string) => {
    if (usageByBooking[bookingPid]) return;
    try {
      const res = await guestApi.getBookingServices(bookingPid);
      setUsageByBooking((prev) => ({ ...prev, [bookingPid]: res }));
    } catch {
      // Non-critical, ignore
    }
  };

  const handleToggleBooking = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    void loadUsage(id);
  };

  /* ── Payment submit ─────────────────────────────────────── */
  const handlePaySubmit = async () => {
    if (!payBooking) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Enter a valid amount');
      return;
    }
    setIsProcessingPay(true);
    setPayError(null);
    try {
      await guestApi.makePayment(payBooking.public_id, { amount, payment_method: payMethod });
      setPayBooking(null);
      await reload();
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setIsProcessingPay(false);
    }
  };

  /* ── Cancel submit ──────────────────────────────────────── */
  const handleCancelSubmit = async () => {
    if (!cancelBooking) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await guestApi.cancelBooking(cancelBooking.public_id);
      setCancelBooking(null);
      await reload();
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : 'Cancellation failed');
    } finally {
      setIsCancelling(false);
    }
  };

  /* ── Order service submit ───────────────────────────────── */
  const handleOrderSubmit = async () => {
    if (!orderBooking || !selectedService || !selectedRoom) {
      setOrderError('Please select a service and room');
      return;
    }
    setIsOrdering(true);
    setOrderError(null);
    setOrderSuccess(null);
    try {
      await guestApi.orderService(orderBooking.public_id, {
        service_public_id: selectedService,
        room_public_id: selectedRoom,
        quantity: Math.max(1, Number(qty)),
      });
      setOrderSuccess('Service requested! Front desk has been notified.');
      setUsageByBooking((p) => {
        const copy = { ...p };
        delete copy[orderBooking.public_id];
        return copy;
      });
      await loadUsage(orderBooking.public_id);
      setTimeout(() => {
        setOrderBooking(null);
        setOrderSuccess(null);
      }, 1500);
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-portal-root flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#00152f]"></div>
          <p className="text-sm text-[#626978]">Verifying session and loading your stay portal…</p>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => ['Booked', 'Checked-In'].includes(b.booking_status));
  const pastBookings = bookings.filter((b) => !['Booked', 'Checked-In'].includes(b.booking_status));

  // Compute aggregate totals for top metrics
  const totalOutstanding = activeBookings.reduce(
    (sum, b) => sum + Number(b.outstanding_amount || 0),
    0,
  );
  const nextArrival = activeBookings[0] ? shortDate(activeBookings[0].check_in_time) : 'No upcoming stay';

  return (
    <div className="guest-portal-root">
      {/* ── Top Header Bar ── */}
      <header className="guest-portal-header">
        <div className="guest-portal-header-inner">
          <Link to="/" className="guest-brand-lockup">
            <div className="guest-brand-monogram">
              {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="guest-brand-title">{hotelConfig?.hotel_name ?? 'SkyNest Hotels'}</span>
              <span className="guest-brand-badge">Guest Portal</span>
            </div>
          </Link>
          <div className="guest-header-actions">
            <button
              onClick={() => navigate('/rooms')}
              className="guest-header-btn guest-btn-outline"
            >
              🏨 Browse Rooms
            </button>
            <span className="text-xs text-[#626978] hidden sm:inline-block">
              {profile ? `${profile.first_name} ${profile.last_name}` : user?.name}
            </span>
            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="guest-header-btn guest-btn-outline text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="guest-main-container">
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Eyebrow & Hero Title (FrontDesk style) ── */}
        <p className="guest-eyebrow">GUEST SERVICES · STAY OVERVIEW</p>
        <h1 className="guest-hero-heading">
          Welcome back, {profile?.first_name || user?.name || 'Valued Guest'}.
        </h1>
        <p className="guest-hero-desc">
          Here is a clear overview of your current room reservations, stay balance, and requested amenities.
        </p>

        {/* ── 4 Metrics Cards (Matches Frontdesk Daily Overview) ── */}
        <section className="guest-metrics-grid">
          <div className="guest-metric-card">
            <div className="guest-metric-top">
              <h2 className="guest-metric-title">NEXT CHECK-IN</h2>
              <span className="guest-metric-icon">📅</span>
            </div>
            <p className="guest-metric-value text-2xl sm:text-3xl">{nextArrival}</p>
            <p className="guest-metric-note">
              {activeBookings.length > 0 ? `${activeBookings.length} upcoming stay(s)` : 'No active arrivals scheduled'}
            </p>
          </div>

          <div className="guest-metric-card">
            <div className="guest-metric-top">
              <h2 className="guest-metric-title">TOTAL RESERVATIONS</h2>
              <span className="guest-metric-icon">🛏️</span>
            </div>
            <p className="guest-metric-value">{bookings.length < 10 ? `0${bookings.length}` : bookings.length}</p>
            <p className="guest-metric-note">Lifetime stays with SkyNest Hotels</p>
          </div>

          <div className="guest-metric-card">
            <div className="guest-metric-top">
              <h2 className="guest-metric-title">CHECK-OUT POLICY</h2>
              <span className="guest-metric-icon">⏰</span>
            </div>
            <p className="guest-metric-value text-2xl sm:text-3xl">
              {hotelConfig?.checkout_time ?? '11:00 AM'}
            </p>
            <p className="guest-metric-note">Standard check-in from {hotelConfig?.checkin_time ?? '14:00'}</p>
          </div>

          {/* Featured Navy Card */}
          <div className="guest-metric-card guest-metric-featured">
            <div className="guest-metric-top">
              <h2 className="guest-metric-title">OUTSTANDING BALANCE</h2>
              <span className="text-[#a5b4fc]">💳</span>
            </div>
            <p className="guest-metric-value text-2xl sm:text-3xl">{lkr(totalOutstanding)}</p>
            <p className="guest-metric-note">
              {totalOutstanding > 0 ? 'Payable online or upon front desk arrival' : 'All current balances are clear'}
            </p>
          </div>
        </section>

        {/* ── Active & Upcoming Stays ── */}
        <section className="mb-10">
          <div className="guest-section-header">
            <h2 className="guest-section-title">
              <span>Today's active & upcoming stays</span>
              <span className="guest-badge-count">{activeBookings.length}</span>
            </h2>
            <button
              onClick={() => navigate('/rooms')}
              className="text-xs font-semibold text-[#806b43] hover:underline"
            >
              + Reserve another room
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-white border border-[#e9ecf5] rounded-2xl p-10 text-center shadow-sm">
              <p className="text-sm text-[#626978] mb-3">You have no upcoming or active stays reserved.</p>
              <button
                onClick={() => navigate('/rooms')}
                className="guest-header-btn guest-btn-primary"
              >
                Browse Available Rooms →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => {
                const nights = nightCount(b);
                const paidAmount = Number(b.paid_amount ?? 0);
                const outstanding = Number(b.outstanding_amount ?? 0);
                const totalCharge = Number(b.total_charge ?? 0);
                const isExpanded = expandedId === b.public_id;
                const roomPids = b.room_public_ids?.split(',') ?? [];

                return (
                  <div key={b.public_id} className="guest-stay-card">
                    {/* Stay summary header */}
                    <button
                      className="guest-stay-header-btn"
                      onClick={() => handleToggleBooking(b.public_id)}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-4 w-full">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#00152f]">
                              #{b.public_id.slice(0, 8).toUpperCase()}
                            </span>
                            <BookingStatusBadge status={b.booking_status} />
                            <PaymentStatusBadge status={b.payment_status} />
                          </div>
                          <p className="text-base font-semibold text-[#00152f]">
                            {b.branch_names ?? 'Hotel Branch'} — Room {b.room_numbers ?? '?'}{' '}
                            <span className="text-xs font-normal text-[#626978]">({b.room_types})</span>
                          </p>
                          <p className="text-xs text-[#626978]">
                            Check-in: {shortDate(b.check_in_time)} · Check-out: {shortDate(b.check_out_time)} ({nights}{' '}
                            {nights === 1 ? 'night' : 'nights'})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-[#626978] uppercase">Total Charge</p>
                          <p className="text-xl font-bold text-[#00152f]">{lkr(totalCharge)}</p>
                          {outstanding > 0 ? (
                            <p className="text-xs font-semibold text-amber-700 mt-0.5">
                              Balance Due: {lkr(outstanding)}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-emerald-600 mt-0.5">Fully Paid ✓</p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="guest-stay-expanded space-y-5">
                        {/* 3 Metric Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white border border-[#e9ecf5] rounded-xl p-3 text-center shadow-xs">
                            <p className="text-[11px] font-semibold text-[#626978] uppercase">Total Reserved</p>
                            <p className="text-base font-bold text-[#00152f] mt-1">{lkr(totalCharge)}</p>
                          </div>
                          <div className="bg-white border border-[#e9ecf5] rounded-xl p-3 text-center shadow-xs">
                            <p className="text-[11px] font-semibold text-emerald-700 uppercase">Paid Advance</p>
                            <p className="text-base font-bold text-emerald-700 mt-1">{lkr(paidAmount)}</p>
                          </div>
                          <div className="bg-white border border-[#e9ecf5] rounded-xl p-3 text-center shadow-xs">
                            <p className="text-[11px] font-semibold text-[#806b43] uppercase">Remaining Due</p>
                            <p
                              className={`text-base font-bold mt-1 ${
                                outstanding > 0 ? 'text-amber-800' : 'text-slate-500'
                              }`}
                            >
                              {lkr(outstanding)}
                            </p>
                          </div>
                        </div>

                        {/* Room Service Requests */}
                        {(usageByBooking[b.public_id]?.length ?? 0) > 0 && (
                          <div className="bg-white border border-[#e9ecf5] rounded-xl p-4 shadow-xs">
                            <h3 className="text-xs font-bold text-[#00152f] uppercase tracking-wider mb-2">
                              Room Services & Requests
                            </h3>
                            <div className="space-y-1.5">
                              {usageByBooking[b.public_id].map((u) => (
                                <div
                                  key={u.public_id}
                                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-b-0"
                                >
                                  <span className="font-medium text-[#00152f]">
                                    {u.service_name} ×{u.quantity} (Room {u.room_number})
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#626978]">{lkr(Number(u.price_at_usage) * u.quantity)}</span>
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        u.status === 'Completed'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {u.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          {outstanding > 0 && (
                            <button
                              onClick={() => {
                                setPayBooking(b);
                                setPayAmount(String(outstanding));
                                setPayError(null);
                              }}
                              className="guest-header-btn guest-btn-primary"
                            >
                              💳 Settle Balance ({lkr(outstanding)})
                            </button>
                          )}
                          {(b.booking_status === 'Booked' || b.booking_status === 'Checked-In') && (
                            <button
                              onClick={() => {
                                setOrderBooking(b);
                                setSelectedService('');
                                setSelectedRoom(roomPids[0] ?? '');
                                setQty('1');
                                setOrderError(null);
                              }}
                              className="guest-header-btn guest-btn-outline"
                            >
                              🍽️ Request Room Service
                            </button>
                          )}
                          {b.booking_status === 'Booked' && (
                            <button
                              onClick={() => {
                                setCancelBooking(b);
                                setCancelError(null);
                              }}
                              className="guest-header-btn guest-btn-outline text-red-600 border-red-200 hover:bg-red-50"
                            >
                              ✕ Cancel Reservation
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Past Stay History ── */}
        {pastBookings.length > 0 && (
          <section className="mb-10">
            <div className="guest-section-header">
              <h2 className="guest-section-title">
                <span>Past Stay History</span>
                <span className="guest-badge-count">{pastBookings.length}</span>
              </h2>
            </div>
            <div className="bg-white border border-[#e9ecf5] rounded-2xl divide-y divide-[#e9ecf5] shadow-xs overflow-hidden">
              {pastBookings.map((b) => (
                <div
                  key={b.public_id}
                  className="flex items-center justify-between p-4 text-xs flex-wrap gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-semibold">
                      #{b.public_id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="font-semibold text-[#00152f]">
                      {b.branch_names} — Room {b.room_numbers}
                    </span>
                    <BookingStatusBadge status={b.booking_status} />
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[#626978]">
                      {shortDate(b.check_in_time)} → {shortDate(b.check_out_time)}
                    </span>
                    <span className="font-bold text-[#00152f]">{lkr(b.total_charge)}</span>
                    <PaymentStatusBadge status={b.payment_status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA to browse rooms */}
        <section className="text-center py-6">
          <button
            onClick={() => navigate('/rooms')}
            className="guest-header-btn guest-btn-primary px-8 py-3.5 text-sm"
          >
            🏨 Book Another Room at SkyNest Hotels
          </button>
        </section>
      </main>

      {/* ══ PAY BALANCE MODAL ══ */}
      {payBooking && (
        <div className="guest-modal-backdrop">
          <div className="guest-modal-card">
            <h3 className="guest-modal-title">Settle Balance</h3>
            <p className="text-xs text-[#626978] mb-4">
              Booking #{payBooking.public_id.slice(0, 8).toUpperCase()} · Outstanding: {lkr(payBooking.outstanding_amount)}
            </p>
            {payError && <p className="text-red-600 text-xs mb-3">{payError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1">
                  Amount to Pay (LKR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-[#00152f] focus:border-[#00152f] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-[#00152f] focus:border-[#00152f] outline-none"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.public_id} value={m.method_name}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPayBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#475569] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaySubmit}
                disabled={isProcessingPay}
                className="flex-1 py-2.5 rounded-xl bg-[#00152f] hover:bg-[#0f2a4a] text-white text-xs font-bold disabled:opacity-50"
              >
                {isProcessingPay ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL RESERVATION MODAL ══ */}
      {cancelBooking && (
        <div className="guest-modal-backdrop">
          <div className="guest-modal-card">
            <h3 className="guest-modal-title text-red-700">Cancel Reservation</h3>
            <p className="text-sm text-[#00152f] mb-2">
              You are about to cancel booking{' '}
              <strong>#{cancelBooking.public_id.slice(0, 8).toUpperCase()}</strong>.
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 my-3">
              Cancellation policies apply based on check-in lead time. Once cancelled, this action cannot be reversed.
            </p>
            {cancelError && <p className="text-red-600 text-xs mt-2">{cancelError}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCancelBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#475569] hover:bg-slate-50"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Yes, Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ORDER ROOM SERVICE MODAL ══ */}
      {orderBooking && (
        <div className="guest-modal-backdrop">
          <div className="guest-modal-card">
            <h3 className="guest-modal-title">Request a Hotel Service</h3>
            <p className="text-xs text-[#626978] mb-4">
              Booking #{orderBooking.public_id.slice(0, 8).toUpperCase()} · {orderBooking.branch_names}
            </p>
            {orderSuccess && (
              <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm mb-3">
                ✓ {orderSuccess}
              </p>
            )}
            {orderError && <p className="text-red-600 text-xs mb-3">{orderError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1">
                  Select Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-[#00152f] focus:border-[#00152f] outline-none"
                >
                  <option value="">— Choose from catalogue —</option>
                  {services.map((s) => (
                    <option key={s.public_id} value={s.public_id}>
                      {s.service_name} — LKR {Number(s.current_price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1">Room</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-[#00152f] focus:border-[#00152f] outline-none"
                >
                  {(orderBooking.room_public_ids?.split(',') ?? []).map((rid, idx) => (
                    <option key={rid} value={rid.trim()}>
                      Room {(orderBooking.room_numbers?.split(',') ?? [])[idx]?.trim() ?? idx + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-[#00152f] focus:border-[#00152f] outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOrderBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#475569] hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handleOrderSubmit}
                disabled={isOrdering}
                className="flex-1 py-2.5 rounded-xl bg-[#00152f] hover:bg-[#0f2a4a] text-white text-xs font-bold disabled:opacity-50"
              >
                {isOrdering ? 'Requesting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating 24/7 hotline button */}
      <FloatingContactButtonAuto />
    </div>
  );
};

export default GuestPortalPage;
