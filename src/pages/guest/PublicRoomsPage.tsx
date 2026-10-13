import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  type AvailableRoom,
  type BranchItem,
  guestApi,
  type HotelConfig,
  type PaymentMethod,
} from '../../api/guestApi';
import { useAuth } from '../../context/auth-state';
import {
  validateCard,
  formatCardNumber,
  formatExpiry,
  getCardBrand,
} from '../../lib/payment-validation';
import './PublicRoomsPage.css';

const CONFIG_DEFAULTS: HotelConfig = {
  hotel_name: 'SkyNest Hotels',
  hotel_tagline: 'Luxury Stays & Serenity',
  hotel_description:
    'Browse room availability in real time, reserve with flexible half-payments, and personalise your stay.',
  hotline_number: '',
  hotline_label: '24/7 Hotel Hotline',
  checkin_time: '14:00',
  checkout_time: '11:00',
  currency: 'LKR',
  copyright_text: 'Dedicated to comfort, elegance, and peace.',
};

export const PublicRoomsPage: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  // Date defaults
  const today = new Date().toISOString().split('T')[0];
  const defaultCheckout = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(defaultCheckout);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [minCapacity, setMinCapacity] = useState('1');

  // API-driven data
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [config, setConfig] = useState<HotelConfig>(CONFIG_DEFAULTS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reservation modal state
  const [bookingRoom, setBookingRoom] = useState<AvailableRoom | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<'half' | 'full'>('half');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [roomCardNumber, setRoomCardNumber] = useState('');
  const [roomCardHolder, setRoomCardHolder] = useState('');
  const [roomCardExpiry, setRoomCardExpiry] = useState('');
  const [roomCardCvv, setRoomCardCvv] = useState('');
  const [roomBankRef, setRoomBankRef] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [hotlineCopied, setHotlineCopied] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  /* ── Load config + branches + initial rooms safely ──────────────── */
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cfgRes, branchRes, methodRes, roomRes] = await Promise.allSettled([
          guestApi.getHotelConfig(),
          guestApi.getBranches(),
          guestApi.getPaymentMethods(),
          guestApi.getRooms({ available_from: checkIn, available_to: checkOut }),
        ]);

        if (cfgRes.status === 'fulfilled') {
          setConfig(cfgRes.value);
        }

        if (methodRes.status === 'fulfilled') {
          setPaymentMethods(methodRes.value);
          if (methodRes.value.length) setPaymentMethod(methodRes.value[0].method_name);
        }

        if (roomRes.status === 'fulfilled') {
          setRooms(roomRes.value);
          // If branch endpoint succeeded, use it; otherwise derive from rooms
          if (branchRes.status === 'fulfilled' && branchRes.value.length > 0) {
            setBranches(branchRes.value);
          } else {
            const derivedBranches = Array.from(
              new Map(
                roomRes.value.map((r) => [
                  r.branch_public_id,
                  { public_id: r.branch_public_id, name: r.branch_name, location_city: '' },
                ]),
              ).values(),
            );
            setBranches(derivedBranches);
          }
        } else if (roomRes.status === 'rejected') {
          const reason =
            roomRes.reason instanceof Error
              ? roomRes.reason.message
              : 'Unable to connect to live room inventory';
          setError(reason);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load room data');
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guestApi.getRooms({ available_from: checkIn, available_to: checkOut });
      setRooms(data);
      if (branches.length === 0) {
        const derivedBranches = Array.from(
          new Map(
            data.map((r) => [
              r.branch_public_id,
              { public_id: r.branch_public_id, name: r.branch_name, location_city: '' },
            ]),
          ).values(),
        );
        setBranches(derivedBranches);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load room availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out date must be after check-in date');
      return;
    }
    void fetchRooms();
  };

  /* ── Filtered rooms ─────────────────────────────────────────────── */
  const filteredRooms = rooms.filter((room) => {
    if (selectedBranch !== 'All' && room.branch_public_id !== selectedBranch) return false;
    if (Number(minCapacity) && room.capacity < Number(minCapacity)) return false;
    return true;
  });

  /* ── Pricing ──────────────────────────────────────────────────────── */
  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24)),
  );

  /* ── Confirm reservation ─────────────────────────────────────────── */
  const handleConfirmReservation = async () => {
    if (!bookingRoom) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=rooms');
      return;
    }
    setIsBooking(true);
    setBookingError(null);

    // Validate payment details for the required upfront deposit
    const activeMethod = paymentMethod || paymentMethods[0]?.method_name || 'Credit Card';
    if (activeMethod === 'Credit Card') {
      const cardVal = validateCard({
        number: roomCardNumber,
        name: roomCardHolder,
        expiry: roomCardExpiry,
        cvv: roomCardCvv,
      });
      if (!cardVal.valid) {
        setIsBooking(false);
        setBookingError(cardVal.error || 'Please provide valid card details');
        return;
      }
    } else if (activeMethod === 'Online Transfer') {
      if (!roomBankRef.trim()) {
        setIsBooking(false);
        setBookingError('Please enter your bank transfer reference or transaction ID');
        return;
      }
    }

    const checkinTime = config.checkin_time ?? '14:00';
    const checkoutTime = config.checkout_time ?? '11:00';

    try {
      const newBooking = await guestApi.createBooking({
        check_in_time: `${checkIn} ${checkinTime}:00`,
        check_out_time: `${checkOut} ${checkoutTime}:00`,
        room_public_ids: [bookingRoom.public_id],
        payment_method: paymentMethod || 'Credit Card',
        payment_option: paymentChoice,
      });

      setBookingSuccess(
        `Reservation confirmed! Reference: ${newBooking.public_id.slice(0, 8).toUpperCase()}`,
      );
      setTimeout(() => {
        setBookingRoom(null);
        setBookingSuccess(null);
        navigate('/guest/dashboard');
      }, 1800);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Reservation failed');
    } finally {
      setIsBooking(false);
    }
  };

  /* ── Pricing helpers ──────────────────────────────────────────────── */
  const currency = config.currency || 'LKR';
  function fmt(n: number) {
    return `${currency} ${n.toLocaleString()}`;
  }

  return (
    <div className="public-rooms-root">
      {/* ── Header ── */}
      <header className="public-rooms-header">
        <div className="public-rooms-header-inner">
          <Link to="/" className="public-brand-lockup">
            <div className="public-brand-monogram">
              {config.hotel_name.slice(0, 2).toUpperCase() || 'SN'}
            </div>
            <div>
              <span className="public-brand-title">{config.hotel_name}</span>
              <span className="public-brand-tagline">{config.hotel_tagline}</span>
            </div>
          </Link>

          <nav className="public-header-actions">
            {config.hotline_number && (
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(config.hotline_number);
                  }
                  setHotlineCopied(true);
                  setTimeout(() => setHotlineCopied(false), 2500);
                }}
                className="public-hotline-btn cursor-pointer"
                title="Click to copy 24/7 hotline number"
              >
                <span>📞 Hotline:</span>
                <span className="font-semibold text-slate-800">{config.hotline_number}</span>
                {hotlineCopied && (
                  <span className="ml-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Copied ✓
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'guest' ? '/guest/dashboard' : '/frontdesk/dashboard'}
                  className="public-btn-primary"
                >
                  {user?.role === 'guest' ? 'My Guest Portal' : 'Staff Dashboard'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="public-btn-primary">
                  Sign In / Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="public-hero-section">
        <div className="public-hero-inner">
          <p className="public-hero-eyebrow">
            {branches.length > 0
              ? `${branches.length} LOCATION${branches.length > 1 ? 'S' : ''} ACROSS SRI LANKA`
              : "SRI LANKA'S FINEST LUXURY ESCAPES"}
          </p>
          <h1 className="public-hero-heading">Find Your Sanctuary at {config.hotel_name}</h1>
          <p className="public-hero-desc">{config.hotel_description}</p>
        </div>

        {/* ── Availability Search Bar ── */}
        <div className="public-search-card">
          <form onSubmit={handleSearch} className="public-search-form">
            <div>
              <label className="public-search-label">Branch Location</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="public-search-select"
              >
                <option value="All">All Locations</option>
                {branches.map((b) => (
                  <option key={b.public_id} value={b.public_id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="public-search-label">Check-In Date</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="public-search-input"
                required
              />
            </div>

            <div>
              <label className="public-search-label">Check-Out Date</label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="public-search-input"
                required
              />
            </div>

            <div>
              <label className="public-search-label">Guests</label>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="public-search-select"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}+ {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button type="submit" className="public-search-btn">
                <span>🔍 Check Availability</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Rooms Results Section ── */}
      <main className="public-rooms-container">
        <div className="public-results-header">
          <div>
            <h2 className="public-results-title">
              Available Rooms & Suites ({filteredRooms.length})
            </h2>
            <p className="public-results-subtitle">
              Rates for stay between {checkIn} and {checkOut} ({nights}{' '}
              {nights === 1 ? 'night' : 'nights'})
            </p>
          </div>
          <div className="public-halfpay-badge">✓ 50% Advance Deposit Required to Confirm</div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-800 mb-3"></div>
            <p className="text-sm font-medium">
              Checking live room availability across all branches...
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="public-empty-state text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <p className="text-slate-800 text-base font-medium">
              No rooms match your filter criteria for these dates.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Try selecting another branch or adjusting your check-in/out dates.
            </p>
          </div>
        ) : (
          <div className="public-rooms-grid">
            {filteredRooms.map((room) => {
              const isAvailable = room.booking_availability === 1;
              const roomNightlyTotal = Math.round(Number(room.daily_rate) * nights);
              const amenityList = room.amenities
                ? room.amenities
                    .split(',')
                    .map((a) => a.trim())
                    .filter(Boolean)
                : [];

              return (
                <div key={room.public_id} className="public-room-card">
                  {/* Card Banner */}
                  <div className="public-card-banner">
                    <div className="public-card-meta-top">
                      <span className="public-branch-pill">{room.branch_name}</span>
                      <span
                        className={`public-avail-pill ${isAvailable ? 'available' : 'reserved'}`}
                      >
                        {isAvailable ? '● Available' : 'Reserved'}
                      </span>
                    </div>
                    <div>
                      <span className="public-room-num">Room {room.room_number}</span>
                      <h3 className="public-room-type">{room.type_name} Room</h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="public-card-body">
                    <div className="public-details-list">
                      <div className="public-detail-row">
                        <span className="public-detail-label">Max Capacity:</span>
                        <span className="public-detail-value">
                          👤 {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </div>
                      <div className="public-detail-row">
                        <span className="public-detail-label">Nightly Rate:</span>
                        <span className="public-detail-value">
                          {currency} {Number(room.daily_rate).toLocaleString()}
                        </span>
                      </div>
                      <div className="public-detail-row">
                        <span className="public-detail-label">Amenities:</span>
                        <span className="text-slate-600 text-right max-w-[60%] text-xs font-medium">
                          {amenityList.length > 0 ? amenityList.join(', ') : 'Included'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="public-price-summary mb-3">
                        <span className="public-price-label">
                          Total for {nights} {nights === 1 ? 'night' : 'nights'}:
                        </span>
                        <span className="public-price-amount">{fmt(roomNightlyTotal)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate('/login?redirect=rooms');
                          } else {
                            setBookingRoom(room);
                            setBookingError(null);
                            setBookingSuccess(null);
                            setPaymentChoice('half');
                            setPaymentMethod(paymentMethods[0]?.method_name || 'Credit Card');
                            setRoomCardNumber('');
                            setRoomCardHolder(user?.name && user.name !== 'Guest' ? user.name : '');
                            setRoomCardExpiry('');
                            setRoomCardCvv('');
                            setRoomBankRef('');
                          }
                        }}
                        className="public-book-btn"
                      >
                        {isAuthenticated ? 'Book This Room' : 'Sign In to Book'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Reservation Modal ── */}
      {bookingRoom && (
        <div className="public-modal-backdrop">
          <div className="public-modal-card">
            <div className="public-modal-header">
              <div>
                <h3 className="public-modal-title">Confirm Reservation</h3>
                <p className="public-modal-subtitle">
                  {bookingRoom.branch_name} • Room {bookingRoom.room_number} (
                  {bookingRoom.type_name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingRoom(null)}
                className="public-close-btn"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <div className="text-4xl text-emerald-600">✓</div>
                <p className="font-semibold text-lg">{bookingSuccess}</p>
                <p className="text-xs text-slate-500">Redirecting to your guest dashboard...</p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                    ⚠ {bookingError}
                  </div>
                )}

                {/* Stay dates from config */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Check-In:</span>
                    <span className="font-semibold text-slate-800">
                      {checkIn} (from {config.checkin_time})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Check-Out:</span>
                    <span className="font-semibold text-slate-800">
                      {checkOut} (until {config.checkout_time})
                    </span>
                  </div>
                </div>

                {/* Pricing summary */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Room Rate ({nights} nights @ {currency}{' '}
                      {Number(bookingRoom.daily_rate).toLocaleString()}):
                    </span>
                    <span className="font-medium text-slate-800">
                      {fmt(Math.round(Number(bookingRoom.daily_rate) * nights))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>+ Tax (per branch rate, calculated automatically)</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Estimate before tax:</span>
                    <span className="text-slate-900">
                      {fmt(Math.round(Number(bookingRoom.daily_rate) * nights))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1">
                    <span>
                      Due Now (
                      {paymentChoice === 'full' ? '100% Full Payment' : '50% Advance Deposit'}):
                    </span>
                    <span>
                      {fmt(
                        Math.round(
                          paymentChoice === 'full'
                            ? Number(bookingRoom.daily_rate) * nights
                            : (Number(bookingRoom.daily_rate) * nights) / 2,
                        ),
                      )}
                    </span>
                  </div>
                  {paymentChoice === 'half' && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Remaining 50% Balance:</span>
                      <span>Payable at hotel check-in</span>
                    </div>
                  )}
                </div>

                {/* Payment preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    Payment Preference:
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'half' as const,
                        label: 'Pay 50% Advance Deposit Now (Required)',
                        desc: 'Pay half today to lock in your reservation; settle remaining 50% at check-in.',
                      },
                      {
                        value: 'full' as const,
                        label: 'Pay Full Amount Now (100%)',
                        desc: 'Settle in full upfront for express arrival.',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`block p-3 rounded-xl border text-xs cursor-pointer transition ${
                          paymentChoice === opt.value
                            ? 'border-slate-800 bg-slate-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentChoice"
                            value={opt.value}
                            checked={paymentChoice === opt.value}
                            onChange={() => setPaymentChoice(opt.value)}
                            className="accent-slate-800"
                          />
                          <span className="font-semibold text-slate-800">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-5">{opt.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment method selector & details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                    >
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((m) => (
                          <option key={m.public_id} value={m.method_name}>
                            {m.display_name}
                          </option>
                        ))
                      ) : (
                        <option value="Credit Card">Credit Card</option>
                      )}
                    </select>
                  </div>

                  {(paymentMethod === 'Credit Card' || (!paymentMethod && paymentMethods[0]?.method_name === 'Credit Card')) && (
                    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-semibold text-slate-800 uppercase">
                            Card Number *
                          </label>
                          <span className="text-[10px] text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {getCardBrand(roomCardNumber)}
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={19}
                          value={roomCardNumber}
                          onChange={(e) => setRoomCardNumber(formatCardNumber(e.target.value))}
                          placeholder="•••• •••• •••• ••••"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-800 uppercase mb-1">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          value={roomCardHolder}
                          onChange={(e) => setRoomCardHolder(e.target.value)}
                          placeholder="Cardholder Full Name"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-800 uppercase mb-1">
                            Expires (MM/YY) *
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={roomCardExpiry}
                            onChange={(e) => setRoomCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-800 uppercase mb-1">
                            CVV / CVC *
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={roomCardCvv}
                            onChange={(e) => setRoomCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="•••"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200">
                        💡 <em>Card validation is active. Enter real card details or test credentials (e.g. <code>4000 0000 0000 0002</code>, future date, 3-digit CVV).</em>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Online Transfer' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
                      <p className="font-semibold text-slate-900">Direct Bank Transfer Instructions:</p>
                      <p className="text-[11px] text-slate-600">Bank: Commercial Bank of Ceylon · Account: 10002938481</p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-800 uppercase mb-1">
                          Bank Reference / Transaction ID *
                        </label>
                        <input
                          type="text"
                          value={roomBankRef}
                          onChange={(e) => setRoomBankRef(e.target.value)}
                          placeholder="e.g. TXN-892019482"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* SMS Notification Target Field */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">📱</span>
                      <label className="text-[11px] font-bold text-emerald-900 uppercase">
                        SMS Confirmation Phone
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-800 mb-2">
                      A payment confirmation SMS will be dispatched to this mobile number:
                    </p>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+94770000000"
                      className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    disabled={isBooking}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmReservation()}
                    disabled={isBooking}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : 'Confirm Reservation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="public-rooms-footer">
        <p className="max-w-4xl mx-auto">{config.copyright_text}</p>
      </footer>
    </div>
  );
};
export default PublicRoomsPage;
