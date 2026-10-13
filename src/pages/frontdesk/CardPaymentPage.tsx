import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { bookingStore, type Booking } from '../../lib/bookingStore';
import { formatLKR } from '../../lib/currency';

interface CardPaymentState {
  bookingId?: string | number;
  booking?: Booking;
  amount?: number;
  paymentOption?: 'full' | 'partial';
  returnUrl?: string;
}

export default function CardPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as CardPaymentState) || {};

  const [booking, setBooking] = useState<Booking | null>(state.booking || null);
  const [isLoading, setIsLoading] = useState(!state.booking && !!state.bookingId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(booking?.guestName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Billing amount
  const payableAmount = state.amount || booking?.outstandingAmount || booking?.totalCharge || 0;

  useEffect(() => {
    if (!booking && state.bookingId) {
      setIsLoading(true);
      bookingStore
        .getBookingById(state.bookingId)
        .then((b) => {
          if (b) {
            setBooking(b);
            if (!cardHolder) setCardHolder(b.guestName);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [booking, state.bookingId, cardHolder]);

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 15) {
      setErrorMessage('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMessage('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (cardCvc.length < 3) {
      setErrorMessage('Please enter a valid 3 or 4-digit CVC code.');
      return;
    }

    if (!booking?.id && !state.bookingId) {
      setErrorMessage('No active booking linked to this payment transaction.');
      return;
    }

    setIsProcessing(true);
    try {
      const targetId = booking?.id || state.bookingId!;
      await bookingStore.recordPayment(targetId, payableAmount, 'Credit Card');

      setSuccessMessage(
        `Payment of ${formatLKR(payableAmount)} successfully authorized and settled. Transaction Ref: TXN-${Date.now().toString().slice(-6)}`,
      );

      setTimeout(() => {
        if (state.returnUrl) {
          navigate(state.returnUrl);
        } else if (booking?.id) {
          navigate(`/frontdesk/reservations/${booking.id}`);
        } else {
          navigate('/frontdesk/reservations');
        }
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err?.message || 'Payment processing failed. Please check card details or POS connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Card Brand Detection
  const cardBrand = () => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('51') || clean.startsWith('52') || clean.startsWith('53') || clean.startsWith('54') || clean.startsWith('55')) return 'MASTERCARD';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'AMEX';
    return 'CARD';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <svg className="h-5 w-5 animate-spin text-blue-900" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading booking payment gateway…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="border-b border-slate-200 pb-5 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link to="/frontdesk/dashboard" className="hover:text-blue-600 transition-colors">
                Front Desk
              </Link>
              <span>/</span>
              <Link to="/frontdesk/reservations" className="hover:text-blue-600 transition-colors">
                Reservations
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Card Payment</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Credit / Debit Card Checkout Gateway
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            &larr; Back
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-medium text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 text-lg">&times;</button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Card Form & Interactive Card Graphic (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Card Replica Preview */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-900 p-6 text-white shadow-xl aspect-[1.586/1]">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-11 rounded-md bg-amber-400/80 border border-amber-300/60 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5 p-0.5 opacity-60">
                      <div className="border border-amber-700/30" />
                      <div className="border border-amber-700/30" />
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tracking-wider text-slate-300">SkyNest Pay</span>
                </div>
                <span className="font-bold tracking-widest text-sm text-blue-200 uppercase font-mono">
                  {cardBrand()}
                </span>
              </div>

              <div className="mt-8 relative z-10">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Card Number</span>
                <p className="font-mono text-xl sm:text-2xl tracking-widest font-semibold text-slate-100 drop-shadow-sm">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
              </div>

              <div className="mt-6 flex justify-between items-end relative z-10 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                  <span className="font-medium tracking-wide text-slate-200 uppercase">
                    {cardHolder || (booking?.guestName || 'GUEST NAME')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expires</span>
                  <span className="font-mono font-medium text-slate-200">{cardExpiry || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            {/* Credit Card Input Form */}
            <form onSubmit={handleProcessPayment} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                  <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
                </svg>
                Card Information &amp; Authorization
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4532 0150 8820 9012"
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-2.5 font-bold text-xs text-slate-400 uppercase font-mono">
                    {cardBrand()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cardholder Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="e.g. AMARA PERERA"
                  className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Code (CVV / CVC) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="rounded-xs border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <span>Save tokenized card on file for incidental charges &amp; room service</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-blue-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Authorizing Transaction with POS Terminal…
                    </>
                  ) : (
                    `Authorize & Pay ${formatLKR(payableAmount)}`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Order / Folio Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sticky top-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Payment Summary
              </h2>

              {booking ? (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Reservation Reference</span>
                    <span className="font-mono font-semibold text-slate-900">
                      #{booking.bookingReference || booking.id}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Guest Name</span>
                    <span className="font-medium text-slate-900">{booking.guestName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Assigned Room</span>
                    <span className="font-medium text-slate-900">
                      Room {booking.roomNumbers} ({booking.branchName})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Stay Duration</span>
                    <span className="font-medium text-slate-900">
                      {booking.checkIn} &rarr; {booking.checkOut}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Reservation Cost</span>
                      <span>{formatLKR(booking.totalCharge)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Previously Settled</span>
                      <span className="text-emerald-700 font-medium">
                        {formatLKR(Math.max(0, (booking.totalCharge || 0) - (booking.outstandingAmount || 0)))}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-100 pt-2">
                      <span>Amount Due Now</span>
                      <span className="text-blue-900 text-base">{formatLKR(payableAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Type</span>
                    <span className="font-semibold text-slate-900">Direct Folio Charge</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-100 pt-2">
                    <span>Total Charge</span>
                    <span className="text-blue-900 text-base">{formatLKR(payableAmount)}</span>
                  </div>
                </div>
              )}

              {/* Security Badges */}
              <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-500 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>256-Bit SSL Encrypted End-to-End Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Real-time Stored Procedure Folio Reconciliation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
