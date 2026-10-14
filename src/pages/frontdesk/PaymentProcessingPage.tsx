import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { bookingStore, type Booking } from '../../lib/bookingStore';
import { formatLKR } from '../../lib/currency';
import './PaymentProcessingPage.css';

export default function PaymentProcessingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Bookings
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await bookingStore.fetchBookings();
      setBookings(data);
      if (data.length > 0 && !selectedBooking) {
        // Default to first booking with outstanding amount
        const withBalance = data.find((b) => b.outstandingAmount > 0);
        setSelectedBooking(withBalance || data[0]);
        if (withBalance) {
          setPaymentAmount(String(withBalance.outstandingAmount));
        }
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSelectBooking = (b: Booking) => {
    setSelectedBooking(b);
    setPaymentAmount(b.outstandingAmount > 0 ? String(b.outstandingAmount) : '');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // KPIs
  const totalOutstanding = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.outstandingAmount) || 0), 0);
  }, [bookings]);

  const settledCount = useMemo(() => {
    return bookings.filter((b) => b.outstandingAmount === 0 && b.paymentStatus === 'Paid').length;
  }, [bookings]);

  const pendingCount = useMemo(() => {
    return bookings.filter((b) => b.outstandingAmount > 0).length;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.roomNumbers.toLowerCase().includes(q) ||
        String(b.id).toLowerCase().includes(q),
    );
  }, [bookings, search]);

  const handleProcessPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || isProcessing) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Call Vidath's billing API (which triggers sp_calculate_bill in MySQL)
      const updated = await bookingStore.recordPayment(
        selectedBooking.id,
        amount,
        paymentMethod,
      );

      if (updated) {
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        setSelectedBooking(updated);
        setSuccessMessage(
          `Successfully processed ${formatLKR(amount)} via ${paymentMethod} for ${updated.guestName}.`,
        );
        setPaymentAmount(updated.outstandingAmount > 0 ? String(updated.outstandingAmount) : '');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err?.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="pp-page">
      <div className="pp-container">
        {/* Header */}
        <header className="pp-header">
          <div>
            <p className="pp-eyebrow">FRONT DESK · FINANCIAL &amp; CASHIERING</p>
            <h1>Payment Processing &amp; Guest Folios</h1>
            <p className="pp-subtitle">
              Settle guest accounts, process credit card or cash payments, and audit real-time guest balances.
            </p>
          </div>
          <div className="pp-header-actions">
            <Link to="/frontdesk/dashboard" className="pp-btn-secondary">
              &larr; Back to Front Desk
            </Link>
            <button onClick={() => void loadData()} className="pp-btn">
              Refresh Folios
            </button>
          </div>
        </header>

        {/* 4 Metric Cards */}
        <section className="pp-metrics-grid" aria-label="Cashier metrics">
          <article className="pp-metric-card featured">
            <div className="pp-metric-header">
              <span>Total Outstanding Folios</span>
              <div className="pp-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <p className="pp-metric-value">{formatLKR(totalOutstanding)}</p>
            <p className="pp-metric-note">Unsettled balances across in-house and upcoming reservations</p>
          </article>

          <article className="pp-metric-card">
            <div className="pp-metric-header">
              <span>Pending Settlement</span>
              <div className="pp-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <p className="pp-metric-value">{pendingCount}</p>
            <p className="pp-metric-note">Guest folios awaiting full or partial payment</p>
          </article>

          <article className="pp-metric-card">
            <div className="pp-metric-header">
              <span>Fully Settled</span>
              <div className="pp-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <p className="pp-metric-value">{settledCount}</p>
            <p className="pp-metric-note">Zero-balance folios ready for seamless departure</p>
          </article>

          <article className="pp-metric-card">
            <div className="pp-metric-header">
              <span>Accepted Payment Methods</span>
              <div className="pp-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p className="pp-metric-value" style={{ fontSize: '18px', paddingTop: '8px' }}>
              Visa &bull; MC &bull; Cash &bull; Wire
            </p>
            <p className="pp-metric-note">Automated stored procedure calculation enabled</p>
          </article>
        </section>

        {/* Main 2-Column Cashier Layout */}
        <div className="pp-layout">
          {/* Left Column: Guest Folios Queue Table */}
          <section className="pp-panel">
            <div className="pp-panel-header">
              <div>
                <h2>Guest Folios &amp; Reservation Balances</h2>
                <p>Select a guest folio to review itemized charges and post payments.</p>
              </div>
              <label className="pp-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626978" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  placeholder="Search guest, room, or booking ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <div className="pp-table-scroll">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Guest / Room</th>
                    <th>Dates</th>
                    <th>Total Charge</th>
                    <th>Outstanding</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#626978' }}>
                        Loading guest folios…
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#626978' }}>
                        No guest folios match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const isSelected = selectedBooking?.id === b.id;
                      const statusClass =
                        b.outstandingAmount === 0
                          ? 'pp-status-paid'
                          : b.paymentStatus === 'Partially Paid'
                            ? 'pp-status-partial'
                            : 'pp-status-unpaid';

                      return (
                        <tr
                          key={b.id}
                          className={isSelected ? 'selected' : ''}
                          onClick={() => handleSelectBooking(b)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <strong style={{ display: 'block', color: '#00152f' }}>{b.guestName}</strong>
                            <small style={{ color: '#626978' }}>
                              Room {b.roomNumbers} &bull; {b.branchName}
                            </small>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#1f2a38' }}>
                              {b.checkIn} &rarr; {b.checkOut}
                            </span>
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                            {formatLKR(b.totalCharge)}
                          </td>
                          <td
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 700,
                              color: b.outstandingAmount > 0 ? '#b91c1c' : '#166534',
                            }}
                          >
                            {formatLKR(b.outstandingAmount)}
                          </td>
                          <td>
                            <span className={`pp-status-badge ${statusClass}`}>
                              {b.outstandingAmount === 0 ? 'Fully Paid' : b.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBooking(b);
                              }}
                              className="pp-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Select Folio
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Payment Settlement Drawer */}
          <aside className="pp-form-panel">
            <h2>Process Payment</h2>
            <p>Post transactions directly to the selected guest folio.</p>

            {successMessage && (
              <div className="pp-success-banner">
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                {errorMessage}
              </div>
            )}

            {selectedBooking ? (
              <form onSubmit={handleProcessPayment}>
                {/* Folio Summary Breakdown */}
                <div className="pp-folio-summary">
                  <div className="pp-folio-row">
                    <span>Guest:</span>
                    <strong>{selectedBooking.guestName}</strong>
                  </div>
                  <div className="pp-folio-row">
                    <span>Room:</span>
                    <span>Room {selectedBooking.roomNumbers} ({selectedBooking.branchName})</span>
                  </div>
                  <div className="pp-folio-row">
                    <span>Folio ID:</span>
                    <span>{selectedBooking.id}</span>
                  </div>
                  <div className="pp-folio-row">
                    <span>Total Folio Amount:</span>
                    <span>{formatLKR(selectedBooking.totalCharge)}</span>
                  </div>
                  <div className="pp-folio-row">
                    <span>Current Outstanding:</span>
                    <span style={{ color: selectedBooking.outstandingAmount > 0 ? '#b91c1c' : '#166534' }}>
                      {formatLKR(selectedBooking.outstandingAmount)}
                    </span>
                  </div>
                </div>

                {/* Amount to pay */}
                <div className="pp-form-group">
                  <label htmlFor="payment-amount">Payment Amount (LKR)</label>
                  <input
                    id="payment-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount to pay..."
                    required
                  />
                  {selectedBooking.outstandingAmount > 0 && (
                    <div className="pp-presets">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(selectedBooking.outstandingAmount))}
                        className="pp-preset-pill"
                      >
                        Full Balance ({formatLKR(selectedBooking.outstandingAmount)})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentAmount(String(Math.round(selectedBooking.outstandingAmount / 2)))
                        }
                        className="pp-preset-pill"
                      >
                        50% Deposit
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="pp-form-group">
                  <label htmlFor="payment-method">Payment Method</label>
                  <select
                    id="payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Credit Card">Credit Card (Visa / Mastercard)</option>
                    <option value="Cash">Cash (Front Desk Counter)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Debit Card">Debit Card</option>
                  </select>
                </div>

                {/* Cashier Notes */}
                <div className="pp-form-group">
                  <label htmlFor="payment-note">Transaction Memo / Reference</label>
                  <input
                    id="payment-note"
                    type="text"
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    placeholder="e.g. POS Terminal #2 slip #9482"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !paymentAmount}
                  className="pp-btn"
                  style={{ width: '100%', padding: '13px', marginTop: '10px' }}
                >
                  {isProcessing ? 'Processing Transaction…' : `Post Payment (${formatLKR(Number(paymentAmount) || 0)})`}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#626978' }}>
                Select a guest reservation folio from the left table to begin cashiering.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
