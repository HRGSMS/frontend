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
  type PaymentResult,
} from '../../api/guestApi';
import { FloatingContactButtonAuto } from '../../components/FloatingContactButton';
import {
  validateCard,
  formatCardNumber,
  formatExpiry,
  getCardBrand,
} from '../../lib/payment-validation';
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

  // Payment Gateway modal & state
  const [payBooking, setPayBooking] = useState<GuestBooking | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [gatewayStep, setGatewayStep] = useState<'form' | 'processing' | 'success'>('form');
  const [gatewayStatusText, setGatewayStatusText] = useState('Connecting to SkyNest Secure Gateway…');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      const [pRes, bRes, sRes, mRes, cRes] = await Promise.allSettled([
        guestApi.getProfile(),
        guestApi.getBookings(),
        guestApi.getServices(),
        guestApi.getPaymentMethods(),
        guestApi.getHotelConfig(),
      ]);

      if (pRes.status === 'fulfilled') {
        setProfile(pRes.value);
      }
      if (bRes.status === 'fulfilled') {
        setBookings(bRes.value);
      }
      if (sRes.status === 'fulfilled') {
        setServices(sRes.value);
      }
      if (mRes.status === 'fulfilled') {
        setPaymentMethods(mRes.value);
        if (mRes.value.length > 0) setPayMethod(mRes.value[0].method_name);
      }
      if (cRes.status === 'fulfilled') {
        setHotelConfig(cRes.value);
      }

      // If both core guest data calls failed, present the server error message
      if (pRes.status === 'rejected' && bRes.status === 'rejected') {
        const extractMsg = (err: unknown) => {
          if (err && typeof err === 'object' && 'response' in err) {
            const res = (err as { response?: { data?: { error?: string } } }).response;
            if (res?.data?.error) return res.data.error;
          }
          return err instanceof Error ? err.message : 'Unable to connect to database';
        };
        setError(extractMsg(pRes.reason));
      }
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

  /* ── Open Payment Gateway ───────────────────────────────── */
  const openPaymentGateway = (b: GuestBooking) => {
    const outstanding = Number(b.outstanding_amount ?? 0);
    setPayBooking(b);
    setPayAmount(String(outstanding > 0 ? outstanding : 0));
    setPayMethod(paymentMethods[0]?.method_name || 'Credit Card');
    setPayError(null);
    setGatewayStep('form');
    setPaymentSuccess(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder('');
    setBankRef('');
    setGuestPhone(profile?.phone_number || '+94760218879');
  };

  /* ── Payment Gateway submit ─────────────────────────────── */
  const handlePaySubmit = async () => {
    if (!payBooking) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Please enter a valid payment amount');
      return;
    }

    if (payMethod === 'Credit Card') {
      const cardVal = validateCard({
        number: cardNumber,
        name: cardHolder,
        expiry: cardExpiry,
        cvv: cardCvv,
      });
      if (!cardVal.valid) {
        setPayError(cardVal.error || 'Please enter valid credit card details');
        return;
      }
    } else if (payMethod === 'Online Transfer') {
      if (!bankRef.trim()) {
        setPayError('Please enter your bank transfer reference or transaction number');
        return;
      }
    }

    setIsProcessingPay(true);
    setPayError(null);
    setGatewayStep('processing');
    setGatewayStatusText('Connecting to SkyNest Secure Gateway…');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setGatewayStatusText('Verifying payment details with banking network…');
      await new Promise((r) => setTimeout(r, 600));

      const res = await guestApi.makePayment(payBooking.public_id, {
        amount,
        payment_method: payMethod || 'Credit Card',
        phone_number: guestPhone,
      });

      setGatewayStatusText('Finalizing payment receipt & sending SMS…');
      await new Promise((r) => setTimeout(r, 400));

      setPaymentSuccess(res.data);
      setGatewayStep('success');

      // Refresh stay list in background
      void reload();

      const phoneNum = res.data?.sms_notification?.phone_number || guestPhone;
      setToastMessage(
        `✓ Payment of ${lkr(amount)} successful! SMS confirmation sent to ${phoneNum}.`
      );
    } catch (e: unknown) {
      setGatewayStep('form');
      setPayError(e instanceof Error ? e.message : 'Payment authorization failed');
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

        {toastMessage && (
          <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-3 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Eyebrow & Hero Title (FrontDesk style) ── */}
        <p className="guest-eyebrow">GUEST SERVICES · STAY OVERVIEW</p>
        <h1 className="guest-hero-heading">
          Welcome back, {profile?.first_name || (user?.name && user.name !== 'Guest' ? user.name : '') || 'Valued Guest'}.
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
                            <div className="flex flex-col items-end gap-1.5 mt-1">
                              <p className="text-xs font-semibold text-amber-700">
                                Balance Due: {lkr(outstanding)}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPaymentGateway(b);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00152f] hover:bg-[#0f2a4a] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                💳 Settle Balance
                              </button>
                            </div>
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
                              type="button"
                              onClick={() => openPaymentGateway(b)}
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

      {/* ══ SKYNEST PAYMENT GATEWAY MODAL ══ */}
      {payBooking && (
        <div className="guest-modal-backdrop">
          <div className="guest-modal-card guest-gateway-card">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔒</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    256-Bit SSL Encrypted Gateway
                  </span>
                </div>
                <h3 className="guest-modal-title mt-1">SkyNest Payment Gateway</h3>
                <p className="text-xs text-[#626978]">
                  Reservation #{payBooking.public_id.slice(0, 8).toUpperCase()} · {payBooking.branch_names}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isProcessingPay) {
                    setPayBooking(null);
                    setGatewayStep('form');
                  }
                }}
                disabled={isProcessingPay}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: FORM VIEW */}
            {gatewayStep === 'form' && (
              <div className="space-y-4">
                {/* Stay bill summary pill */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#626978] block">Current Stay Balance:</span>
                    <span className="text-base font-bold text-[#00152f]">
                      {lkr(payBooking.outstanding_amount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#626978] block">Stay Room:</span>
                    <span className="font-semibold text-[#00152f]">
                      Room {payBooking.room_numbers}
                    </span>
                  </div>
                </div>

                {payError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {payError}
                  </div>
                )}

                {/* Amount to pay */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#00152f] uppercase">
                      Amount to Pay (LKR)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(Number(payBooking.outstanding_amount ?? 0)))}
                      className="text-[11px] text-[#806b43] hover:underline font-semibold"
                    >
                      Pay Full Balance
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                      LKR
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl pl-12 pr-3.5 py-2.5 text-sm font-semibold text-[#00152f] focus:border-[#00152f] outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#00152f] uppercase mb-1.5">
                    Select Gateway Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('Credit Card')}
                      className={`guest-gateway-tab ${payMethod === 'Credit Card' ? 'active' : ''}`}
                    >
                      <span>💳</span>
                      <span>Card Gateway</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('Online Transfer')}
                      className={`guest-gateway-tab ${payMethod === 'Online Transfer' ? 'active' : ''}`}
                    >
                      <span>🏦</span>
                      <span>Bank Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Card input fields (when Card Gateway is active) */}
                {payMethod === 'Credit Card' ? (
                  <div className="space-y-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-[#00152f] uppercase">
                          Card Number
                        </label>
                        <span className="text-[10px] text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {getCardBrand(cardNumber)}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs font-mono text-[#00152f] focus:border-[#00152f] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#00152f] uppercase mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Cardholder Full Name"
                        className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs text-[#00152f] focus:border-[#00152f] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#00152f] uppercase mb-1">
                          Expires (MM/YY)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs font-mono text-[#00152f] focus:border-[#00152f] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#00152f] uppercase mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="•••"
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs font-mono text-[#00152f] focus:border-[#00152f] outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200">
                      💡 <em>Card validation is active. Accepts real cards or test cards (e.g. <code>4000 0000 0000 0002</code>, future date, 3-digit CVV).</em>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 text-xs text-[#475569] space-y-3">
                    <div>
                      <p className="font-semibold text-[#00152f]">Direct Bank Transfer Instructions:</p>
                      <p className="text-[11px] text-slate-600 mt-1">Bank: Commercial Bank of Ceylon · Account: 10002938481</p>
                      <p className="text-[11px] text-slate-600">Booking Reference: #{payBooking.public_id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#00152f] uppercase mb-1">
                        Bank Transfer Reference / Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        placeholder="e.g. TXN-892019482"
                        className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-xs font-mono text-[#00152f] focus:border-[#00152f] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* SMS Notification Target Field */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">📱</span>
                    <label className="text-[11px] font-bold text-emerald-900 uppercase">
                      SMS Payment Notification Sender
                    </label>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-2">
                    A confirmation SMS receipt will be dispatched to this mobile number upon completion:
                  </p>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+94770000000"
                    className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-[#00152f] focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayBooking(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePaySubmit}
                    disabled={isProcessingPay}
                    className="flex-1 py-2.5 rounded-xl bg-[#00152f] hover:bg-[#0f2a4a] text-white text-xs font-bold disabled:opacity-50 transition shadow-sm cursor-pointer"
                  >
                    Authorize Payment ({lkr(Number(payAmount) || 0)}) 🔒
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PROCESSING GATEWAY VIEW */}
            {gatewayStep === 'processing' && (
              <div className="py-8 text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#00152f]"></div>
                <div>
                  <h4 className="text-sm font-bold text-[#00152f]">{gatewayStatusText}</h4>
                  <p className="text-xs text-[#626978] mt-1">
                    Contacting card issuer & dispatching transaction notification…
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-50 py-2 px-3 rounded-lg max-w-xs mx-auto border border-slate-100">
                  🔒 Safe & Encrypted • Do not refresh or navigate away
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS & SMS DISPATCH VIEW */}
            {gatewayStep === 'success' && paymentSuccess && (
              <div className="py-2 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#00152f]">Payment Confirmed!</h4>
                  <p className="text-xs text-[#626978] mt-0.5">
                    Transaction ID: #PAY-{paymentSuccess.public_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#626978]">Amount Paid:</span>
                    <span className="font-bold text-[#00152f]">{lkr(paymentSuccess.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#626978]">Reservation Status:</span>
                    <span className="font-bold text-emerald-600">
                      {paymentSuccess.payment_status || 'Paid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#626978]">Payment Method:</span>
                    <span className="font-semibold text-[#00152f]">{payMethod}</span>
                  </div>
                </div>

                {/* SMS notification dispatched box */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span>📱</span>
                      <span>SMS Notification Sent</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                      Delivered
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Sent to: <strong>{paymentSuccess.sms_notification?.phone_number || guestPhone}</strong>
                  </p>
                  <p className="text-xs text-emerald-900 italic bg-white/80 p-2.5 rounded-lg border border-emerald-100 font-mono leading-relaxed">
                    "{paymentSuccess.sms_notification?.message}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPayBooking(null);
                    setGatewayStep('form');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00152f] hover:bg-[#0f2a4a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
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
