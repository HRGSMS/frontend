import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import {
  guestApi,
  type AvailableRoom,
  type BranchItem,
  type HotelConfig,
  type PaymentMethod,
} from '../../api/guestApi';
import { FloatingContactButton } from '../../components/FloatingContactButton';

/* ── Default fallbacks while config is loading ─────────────────── */
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
  const [paymentChoice, setPaymentChoice] = useState<'half' | 'full' | 'later'>('half');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  /* ── Load config + branches + initial rooms ─────────────────────── */
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [cfg, branchList, methodList, roomList] = await Promise.all([
          guestApi.getHotelConfig(),
          guestApi.getBranches(),
          guestApi.getPaymentMethods(),
          guestApi.getRooms({ available_from: checkIn, available_to: checkOut }),
        ]);
        setConfig(cfg);
        setBranches(branchList);
        setPaymentMethods(methodList);
        // Default to first active method
        if (methodList.length) setPaymentMethod(methodList[0].method_name);
        setRooms(roomList);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load data');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guestApi.getRooms({ available_from: checkIn, available_to: checkOut });
      setRooms(data);
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
    fetchRooms();
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
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24),
    ),
  );

  /* ── Confirm reservation ─────────────────────────────────────────── */
  const handleConfirmReservation = async () => {
    if (!bookingRoom) return;
    if (!isAuthenticated) {
      navigate('/guest/login?redirect=rooms');
      return;
    }
    setIsBooking(true);
    setBookingError(null);

    // Use check-in/out times from the DB config
    const checkinTime = config.checkin_time ?? '14:00';
    const checkoutTime = config.checkout_time ?? '11:00';

    try {
      const newBooking = await guestApi.createBooking({
        check_in_time: `${checkIn} ${checkinTime}:00`,
        check_out_time: `${checkOut} ${checkoutTime}:00`,
        room_public_ids: [bookingRoom.public_id],
      });

      // The backend's sp_calculate_bill returns the real total_charge
      const realTotal = Number(newBooking.total_charge ?? 0);
      const halfAmount = Math.round(realTotal / 2);

      if (paymentChoice === 'half') {
        await guestApi.makePayment(newBooking.public_id, {
          amount: halfAmount,
          payment_method: paymentMethod,
        });
      } else if (paymentChoice === 'full') {
        await guestApi.makePayment(newBooking.public_id, {
          amount: realTotal,
          payment_method: paymentMethod,
        });
      }

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
    <div className="min-h-screen bg-[#0d1824] text-slate-100 flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="border-b border-white/10 bg-[#09121d]/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1b3b38] border border-[#c5a86a] text-[#c5a86a] font-bold flex items-center justify-center text-sm shadow-md">
              {config.hotel_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-lg tracking-wide text-white block leading-tight">
                {config.hotel_name}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#c5a86a]">
                {config.hotel_tagline}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            {config.hotline_number && (
              <a
                href={`tel:${config.hotline_number}`}
                className="hidden sm:flex items-center gap-2 text-xs text-[#e4d4aa] hover:text-white px-3 py-1.5 rounded-full border border-[#c5a86a]/40 bg-[#1b3b38]/40"
              >
                <span>📞 Hotline:</span>
                <span className="font-mono font-bold">{config.hotline_number}</span>
              </a>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'guest' ? '/guest/dashboard' : '/frontdesk/dashboard'}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#c5a86a] text-[#0d1824] hover:bg-[#d8bd80] transition"
                >
                  {user?.role === 'guest' ? 'My Guest Portal' : 'Staff Dashboard'}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-slate-300 hover:text-white px-3 py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/guest/login"
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#c5a86a] text-[#c5a86a] hover:bg-[#c5a86a] hover:text-[#0d1824] transition"
                >
                  Guest Login / Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative py-14 px-6 text-center bg-gradient-to-b from-[#09121d] via-[#112133] to-[#0d1824]">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c5a86a] mb-2 block">
            {branches.length > 0
              ? `${branches.length} Location${branches.length > 1 ? 's' : ''} across Sri Lanka`
              : "Sri Lanka's Finest Luxury Escapes"}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif text-white font-normal tracking-wide">
            Find Your Sanctuary at {config.hotel_name}
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {config.hotel_description}
          </p>
        </div>

        {/* ── Availability Search Bar ── */}
        <div className="mt-8 max-w-5xl mx-auto bg-[#172738]/95 p-4 sm:p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-left"
          >
            {/* Branch filter — from database */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Branch Location
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a86a]"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Check-In Date
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a86a]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Check-Out Date
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a86a]"
                required
              />
            </div>

            {/* Guests filter — capacity is pulled from room_type.capacity */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Guests</label>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a86a]"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}+ {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-[#c5a86a] text-[#0d1824] font-semibold py-2.5 px-4 rounded-lg hover:bg-[#d8bd80] transition shadow-md text-sm flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                <span>Check Availability</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Rooms Grid ── */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Available Rooms & Suites ({filteredRooms.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Rates for stay between {checkIn} and {checkOut} ({nights}{' '}
              {nights === 1 ? 'night' : 'nights'})
            </p>
          </div>
          <div className="text-xs text-[#c5a86a]">✓ 50% Advance Half-Payment accepted</div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#c5a86a] mb-2"></div>
            <p>Checking live room availability...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 bg-[#122133] rounded-2xl border border-white/10 p-8">
            <p className="text-slate-300 text-base">
              No rooms match your filter criteria for these dates.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Try selecting another branch or adjusting your check-in/out dates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const isAvailable = room.booking_availability === 1;
              const roomNightlyTotal = Math.round(Number(room.daily_rate) * nights);
              const amenityList = room.amenities
                ? room.amenities.split(',').map((a) => a.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={room.public_id}
                  className="bg-[#122133] rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:border-[#c5a86a]/50 transition-all flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="h-44 bg-gradient-to-br from-[#1a384f] to-[#0e2233] p-5 flex flex-col justify-between relative">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0d1824]/80 text-[#c5a86a] border border-[#c5a86a]/30">
                        {room.branch_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isAvailable
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isAvailable ? '● Available' : 'Reserved'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                        Room {room.room_number}
                      </span>
                      <h3 className="text-xl font-serif text-white font-normal">
                        {room.type_name} Room
                      </h3>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Max Capacity:</span>
                        <span className="font-semibold text-white">
                          👤 {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Nightly Rate:</span>
                        <span className="font-semibold text-white">
                          {currency} {Number(room.daily_rate).toLocaleString()}
                        </span>
                      </div>
                      {/* Amenities from database */}
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Amenities:</span>
                        <span className="text-slate-300 text-right max-w-[60%]">
                          {amenityList.length > 0 ? amenityList.join(', ') : 'Details at reception'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-[11px] text-slate-400">
                          Total for {nights} {nights === 1 ? 'night' : 'nights'} (before tax):
                        </span>
                        <span className="text-base font-bold text-[#c5a86a]">
                          {fmt(roomNightlyTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate('/guest/login?redirect=rooms');
                          } else {
                            setBookingRoom(room);
                            setBookingError(null);
                          }
                        }}
                        className="w-full bg-[#1b3b38] hover:bg-[#25524e] text-white py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border border-[#c5a86a]/40 hover:border-[#c5a86a] transition shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#122133] border border-white/20 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-start pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-serif text-white">Confirm Reservation</h3>
                <p className="text-xs text-slate-400">
                  {bookingRoom.branch_name} • Room {bookingRoom.room_number} (
                  {bookingRoom.type_name})
                </p>
              </div>
              <button
                onClick={() => setBookingRoom(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center text-emerald-300 space-y-2">
                <div className="text-4xl">✓</div>
                <p className="font-semibold text-lg">{bookingSuccess}</p>
                <p className="text-xs text-slate-400">Redirecting to your guest dashboard...</p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-200 text-xs">
                    ⚠ {bookingError}
                  </div>
                )}

                {/* Stay dates from config */}
                <div className="grid grid-cols-2 gap-3 bg-[#0d1824] p-3 rounded-xl text-xs border border-white/5">
                  <div>
                    <span className="text-slate-400 block">Check-In:</span>
                    <span className="font-semibold text-white">
                      {checkIn} (from {config.checkin_time})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Check-Out:</span>
                    <span className="font-semibold text-white">
                      {checkOut} (until {config.checkout_time})
                    </span>
                  </div>
                </div>

                {/* Pricing — base rate estimate; final total confirmed by backend */}
                <div className="bg-[#0d1824] p-4 rounded-xl space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between text-slate-300">
                    <span>
                      Room Rate ({nights} nights @ {currency}{' '}
                      {Number(bookingRoom.daily_rate).toLocaleString()}):
                    </span>
                    <span>
                      {fmt(Math.round(Number(bookingRoom.daily_rate) * nights))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>+ Tax (per branch rate, calculated at confirmation)</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-white pt-2 border-t border-white/10">
                    <span>Estimate before tax:</span>
                    <span className="text-[#c5a86a]">
                      {fmt(Math.round(Number(bookingRoom.daily_rate) * nights))}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Exact total (with branch tax) will be shown in your dashboard after booking.
                  </p>
                </div>

                {/* Payment preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    Select Payment Preference:
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'half' as const,
                        label: 'Pay Half Deposit Now (50%)',
                        sub: 'Secure your room today. Pay the remaining 50% at check-in.',
                      },
                      {
                        value: 'full' as const,
                        label: 'Pay in Full Now (100%)',
                        sub: 'Complete total payment today for zero hassle at arrival.',
                      },
                      {
                        value: 'later' as const,
                        label: 'Pay on Arrival at Hotel',
                        sub: 'Reserve without paying now. Status will show as Payment Pending.',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-[#0d1824] cursor-pointer hover:border-[#c5a86a]"
                      >
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={paymentChoice === opt.value}
                          onChange={() => setPaymentChoice(opt.value)}
                          className="text-[#c5a86a]"
                        />
                        <div className="flex-1 text-xs">
                          <div className="font-semibold text-white">{opt.label}</div>
                          <p className="text-[11px] text-slate-400">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment method — from database */}
                {paymentChoice !== 'later' && paymentMethods.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#0d1824] border border-white/20 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m.public_id} value={m.method_name}>
                          {m.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isBooking}
                    onClick={handleConfirmReservation}
                    className="flex-1 py-2.5 rounded-xl bg-[#c5a86a] hover:bg-[#d8bd80] text-[#0d1824] text-xs font-bold transition shadow-lg disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : 'Confirm & Reserve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <FloatingContactButton phoneNumber={config.hotline_number} label={config.hotline_label} />

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#09121d] py-6 px-6 text-center text-xs text-slate-400">
        <p>
          © {new Date().getFullYear()} {config.hotel_name} Sri Lanka. {config.copyright_text}
        </p>
        {branches.length > 0 && (
          <p className="mt-1 text-slate-500">
            Branches: {branches.map((b) => b.name).join(' • ')}
            {config.hotline_number && (
              <>
                {' | '}Hotline:{' '}
                <a href={`tel:${config.hotline_number}`} className="text-[#c5a86a] underline">
                  {config.hotline_number}
                </a>
              </>
            )}
          </p>
        )}
      </footer>
    </div>
  );
};

export default PublicRoomsPage;
