import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

/* ── Status badges ─────────────────────────────────────────────── */
const BookingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Booked:      'bg-blue-900/60 text-blue-200 border-blue-500/40',
    'Checked-In':  'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
    'Checked-Out': 'bg-slate-800 text-slate-300 border-slate-500/40',
    Cancelled:   'bg-red-900/60 text-red-200 border-red-500/40',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${map[status] ?? 'bg-slate-700 text-slate-300 border-slate-500'}`}>
      {status}
    </span>
  );
};

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Unpaid:         'bg-amber-900/60 text-amber-200 border-amber-500/40',
    'Partially Paid':'bg-sky-900/60 text-sky-200 border-sky-500/40',
    Paid:           'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
    'Credit Due':   'bg-violet-900/60 text-violet-200 border-violet-500/40',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${map[status] ?? 'bg-slate-700 text-slate-300 border-slate-500'}`}>
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
  return Math.max(1, Math.round((new Date(b.check_out_time).getTime() - new Date(b.check_in_time).getTime()) / 86400000));
}

/* ── Component ─────────────────────────────────────────────────── */
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
        guestApi.getHotelConfig(),
      ]);
      setProfile(p);
      setBookings(b);
      setServices(s);
      setPaymentMethods(methods);
      setHotelConfig(cfg);
      setPayMethod((prev) => prev || (methods[0]?.method_name ?? ''));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const loadUsage = async (bookingPublicId: string) => {
    if (usageByBooking[bookingPublicId]) return;
    try {
      const data = await guestApi.getBookingServices(bookingPublicId);
      setUsageByBooking((p) => ({ ...p, [bookingPublicId]: data }));
    } catch { /* silent */ }
  };

  const handleToggleBooking = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    loadUsage(id);
  };

  /* ── Payment submit ─────────────────────────────────────── */
  const handlePaySubmit = async () => {
    if (!payBooking) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { setPayError('Enter a valid amount'); return; }
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
      setOrderError('Please select a service and room'); return;
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
        delete copy[orderBooking.public_id]; // force refresh
        return copy;
      });
      await loadUsage(orderBooking.public_id);
      setTimeout(() => { setOrderBooking(null); setOrderSuccess(null); }, 1500);
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1824] flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#c5a86a]"></div>
          <p className="text-sm">Loading your guest portal…</p>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => ['Booked', 'Checked-In'].includes(b.booking_status));
  const pastBookings   = bookings.filter(b => !['Booked', 'Checked-In'].includes(b.booking_status));

  return (
    <div className="min-h-screen bg-[#0d1824] text-slate-100 font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09121d]/90 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1b3b38] border border-[#c5a86a] text-[#c5a86a] font-bold flex items-center justify-center text-xs">
              {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-base font-semibold text-white">
                {hotelConfig?.hotel_name ?? 'Hotel'}
              </span>
              <span className="text-[10px] text-[#c5a86a] ml-2 uppercase tracking-widest">Guest Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rooms')}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#c5a86a] hover:text-white border border-[#c5a86a]/30 hover:border-[#c5a86a] px-3 py-1.5 rounded-lg transition"
            >
              🏨 Browse Rooms
            </button>
            <span className="text-xs text-slate-400 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Welcome Card */}
        <section className="bg-gradient-to-r from-[#1b3b38] to-[#122133] rounded-2xl border border-white/10 px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-serif font-normal text-white">
              Welcome back, {profile?.first_name} 👋
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {profile?.email} · {profile?.phone_number}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Stays</p>
            <p className="text-3xl font-bold text-[#c5a86a]">{bookings.length}</p>
          </div>
        </section>

        {/* ── Active / Upcoming Bookings ── */}
        <section>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>🛏️</span> Active & Upcoming Stays ({activeBookings.length})
          </h3>

          {activeBookings.length === 0 ? (
            <div className="bg-[#122133] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
              <p>No upcoming reservations.</p>
              <button
                onClick={() => navigate('/rooms')}
                className="mt-3 text-xs text-[#c5a86a] underline"
              >
                Browse available rooms →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => {
                const nights     = nightCount(b);
                const paidAmount = Number(b.paid_amount ?? 0);
                const outstanding = Number(b.outstanding_amount ?? 0);
                const totalCharge = Number(b.total_charge ?? 0);
                const isExpanded = expandedId === b.public_id;
                const roomPids   = b.room_public_ids?.split(',') ?? [];

                return (
                  <div key={b.public_id} className="bg-[#122133] border border-white/10 rounded-2xl overflow-hidden">
                    {/* Booking summary row */}
                    <button
                      className="w-full text-left p-5 hover:bg-white/5 transition"
                      onClick={() => handleToggleBooking(b.public_id)}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] text-slate-400">
                              #{b.public_id.slice(0, 8).toUpperCase()}
                            </span>
                            <BookingStatusBadge status={b.booking_status} />
                            <PaymentStatusBadge status={b.payment_status} />
                          </div>
                          <p className="text-sm font-medium text-white">
                            {b.branch_names ?? 'Hotel'} — Room {b.room_numbers ?? '?'}{' '}
                            <span className="text-slate-400 text-xs">({b.room_types})</span>
                          </p>
                          <p className="text-xs text-slate-400">
                            {shortDate(b.check_in_time)} → {shortDate(b.check_out_time)} ({nights} {nights === 1 ? 'night' : 'nights'})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">Total Charge</p>
                          <p className="text-lg font-bold text-[#c5a86a]">{lkr(totalCharge)}</p>
                          {outstanding > 0 && (
                            <p className="text-[11px] text-amber-300">Balance due: {lkr(outstanding)}</p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-5 space-y-5 bg-[#0d1824]/50">

                        {/* Financial breakdown */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {[
                            { label: 'Total', value: lkr(totalCharge), color: 'text-white' },
                            { label: 'Paid', value: lkr(paidAmount), color: 'text-emerald-300' },
                            { label: 'Balance Due', value: lkr(outstanding), color: outstanding > 0 ? 'text-amber-300' : 'text-slate-400' },
                          ].map((item) => (
                            <div key={item.label} className="bg-[#122133] rounded-xl p-3 border border-white/5">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{item.label}</p>
                              <p className={`text-sm font-bold ${item.color} mt-1`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Service usages */}
                        {(usageByBooking[b.public_id]?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-2">Service Requests:</p>
                            <div className="space-y-1">
                              {usageByBooking[b.public_id].map((u) => (
                                <div key={u.public_id} className="flex justify-between text-xs bg-[#122133] rounded-lg px-3 py-2 border border-white/5">
                                  <span className="text-slate-300">{u.service_name} ×{u.quantity} (Room {u.room_number})</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{lkr(Number(u.price_at_usage) * u.quantity)}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${u.status === 'Completed' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'}`}>
                                      {u.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {outstanding > 0 && (
                            <button
                              onClick={() => { setPayBooking(b); setPayAmount(String(outstanding)); setPayError(null); }}
                              className="flex-1 min-w-[140px] text-xs font-semibold py-2 px-4 rounded-xl bg-[#c5a86a] text-[#0d1824] hover:bg-[#d8bd80] transition"
                            >
                              💳 Pay Balance ({lkr(outstanding)})
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
                              className="flex-1 min-w-[140px] text-xs font-semibold py-2 px-4 rounded-xl bg-[#1b3b38] text-white hover:bg-[#25524e] border border-[#c5a86a]/40 transition"
                            >
                              🍽️ Request a Service
                            </button>
                          )}
                          {b.booking_status === 'Booked' && (
                            <button
                              onClick={() => { setCancelBooking(b); setCancelError(null); }}
                              className="flex-1 min-w-[140px] text-xs font-semibold py-2 px-4 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-500/30 transition"
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

        {/* ── Past Bookings ── */}
        {pastBookings.length > 0 && (
          <section>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span>🕘</span> Past Stays ({pastBookings.length})
            </h3>
            <div className="space-y-2">
              {pastBookings.map((b) => (
                <div key={b.public_id} className="flex items-center justify-between bg-[#122133]/60 border border-white/5 rounded-xl px-5 py-3 text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500">#{b.public_id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-slate-300">{b.branch_names} — Room {b.room_numbers}</span>
                    <BookingStatusBadge status={b.booking_status} />
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-slate-400">{shortDate(b.check_in_time)} → {shortDate(b.check_out_time)}</span>
                    <span className="font-semibold text-slate-200">{lkr(b.total_charge)}</span>
                    <PaymentStatusBadge status={b.payment_status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA to browse rooms */}
        <section className="text-center py-6">
          <button
            onClick={() => navigate('/rooms')}
            className="inline-flex items-center gap-2 bg-[#1b3b38] hover:bg-[#25524e] border border-[#c5a86a]/40 hover:border-[#c5a86a] text-white px-8 py-3 rounded-xl font-semibold text-sm transition shadow-lg"
          >
            🏨 Book Another Room
          </button>
        </section>
      </main>

      {/* ══ PAY BALANCE MODAL ══ */}
      {payBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#122133] border border-white/20 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-4">Settle Balance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Booking #{payBooking.public_id.slice(0, 8).toUpperCase()} — Outstanding: {lkr(payBooking.outstanding_amount)}
            </p>
            {payError && <p className="text-red-300 text-xs mb-3">{payError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount to Pay (LKR)</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c5a86a] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white">
                  {paymentMethods.map((m) => (
                    <option key={m.public_id} value={m.method_name}>{m.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPayBooking(null)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs text-slate-300">Cancel</button>
              <button onClick={handlePaySubmit} disabled={isProcessingPay} className="flex-1 py-2.5 rounded-xl bg-[#c5a86a] hover:bg-[#d8bd80] text-[#0d1824] text-xs font-bold disabled:opacity-50">
                {isProcessingPay ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CANCEL MODAL ══ */}
      {cancelBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#122133] border border-white/20 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-serif text-red-300 mb-3">Cancel Reservation</h3>
            <p className="text-sm text-slate-300 mb-1">
              You are about to cancel booking{' '}
              <strong>#{cancelBooking.public_id.slice(0, 8).toUpperCase()}</strong>.
            </p>
            <p className="text-xs text-amber-300 bg-amber-900/20 border border-amber-500/20 rounded-lg p-3 mt-2">
              A cancellation fee may apply based on our policy. Once cancelled, this action cannot be reversed.
            </p>
            {cancelError && <p className="text-red-300 text-xs mt-3">{cancelError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCancelBooking(null)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs text-slate-300">Keep Reservation</button>
              <button onClick={handleCancelSubmit} disabled={isCancelling} className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50">
                {isCancelling ? 'Cancelling…' : 'Yes, Cancel It'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ORDER SERVICE MODAL ══ */}
      {orderBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#122133] border border-white/20 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-1">Request a Hotel Service</h3>
            <p className="text-xs text-slate-400 mb-5">
              Booking #{orderBooking.public_id.slice(0, 8).toUpperCase()} — {orderBooking.branch_names}
            </p>
            {orderSuccess && <p className="text-emerald-300 text-sm mb-3">✓ {orderSuccess}</p>}
            {orderError && <p className="text-red-300 text-xs mb-3">{orderError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Service</label>
                <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c5a86a] outline-none">
                  <option value="">— Choose a service —</option>
                  {services.map((s) => (
                    <option key={s.public_id} value={s.public_id}>
                      {s.service_name} — LKR {Number(s.current_price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room</label>
                <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c5a86a] outline-none">
                  {(orderBooking.room_public_ids?.split(',') ?? []).map((rid, idx) => (
                    <option key={rid} value={rid.trim()}>
                      Room {(orderBooking.room_numbers?.split(',') ?? [])[idx]?.trim() ?? idx + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                <input type="number" min="1" max="10" value={qty} onChange={(e) => setQty(e.target.value)}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c5a86a] outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOrderBooking(null)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs text-slate-300">Close</button>
              <button onClick={handleOrderSubmit} disabled={isOrdering} className="flex-1 py-2.5 rounded-xl bg-[#1b3b38] hover:bg-[#25524e] border border-[#c5a86a]/40 text-white text-xs font-bold disabled:opacity-50">
                {isOrdering ? 'Requesting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingContactButtonAuto />
    </div>
  );
};

export default GuestPortalPage;
