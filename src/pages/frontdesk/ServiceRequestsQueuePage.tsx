import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi, type ServiceCatalogueItem } from '../../api/serviceApi';
import { reservationApi, type RoomRecord } from '../../api/reservationApi';
import { bookingStore, type Booking } from '../../lib/bookingStore';
import { reportApi } from '../../api/reportApi';
import { formatLKR } from '../../lib/currency';
import './ServiceRequestsQueuePage.css';

interface ServiceRequestItem {
  id: string;
  bookingId: string | number;
  guestName: string;
  roomNumber: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  time: string;
  status: 'Pending' | 'In Progress' | 'Fulfilled';
  notes?: string;
}

const DEFAULT_SERVICES: ServiceCatalogueItem[] = [
  {
    public_id: 'srv-1',
    service_name: 'Room Dining Breakfast',
    service_description: 'Full continental breakfast served in suite',
    current_price: 4500,
  },
  {
    public_id: 'srv-2',
    service_name: 'Airport VIP Transfer',
    service_description: 'Luxury sedan transport to/from BIA airport',
    current_price: 18000,
  },
  {
    public_id: 'srv-3',
    service_name: 'Ayurvedic Spa Treatment',
    service_description: '60-minute revitalizing herbal therapy session',
    current_price: 12000,
  },
  {
    public_id: 'srv-4',
    service_name: 'Express Garment Laundry',
    service_description: 'Same-day steam press & dry cleaning package',
    current_price: 3500,
  },
  {
    public_id: 'srv-5',
    service_name: 'Late Check-out Privilege',
    service_description: 'Guaranteed 16:00 room extension',
    current_price: 15000,
  },
];

const INITIAL_QUEUE: ServiceRequestItem[] = [
  {
    id: 'req-101',
    bookingId: 'bkg-1003',
    guestName: 'Daniel Perera',
    roomNumber: 'K201',
    serviceName: 'Room Dining Breakfast',
    quantity: 2,
    unitPrice: 4500,
    totalPrice: 9000,
    time: '08:15 AM',
    status: 'In Progress',
    notes: 'Serve with Ceylon black tea and extra toast',
  },
  {
    id: 'req-102',
    bookingId: 'bkg-1004',
    guestName: 'Sophie Chen',
    roomNumber: 'G302',
    serviceName: 'Airport VIP Transfer',
    quantity: 1,
    unitPrice: 18000,
    totalPrice: 18000,
    time: '09:30 AM',
    status: 'Pending',
    notes: 'Departure to BIA at 14:00. Flight UL 302',
  },
  {
    id: 'req-103',
    bookingId: 'bkg-1001',
    guestName: 'John Smith',
    roomNumber: 'C101',
    serviceName: 'Express Garment Laundry',
    quantity: 3,
    unitPrice: 3500,
    totalPrice: 10500,
    time: 'Yesterday',
    status: 'Fulfilled',
    notes: 'Returned before 18:00',
  },
];

export default function ServiceRequestsQueuePage() {
  const [catalogue, setCatalogue] = useState<ServiceCatalogueItem[]>(DEFAULT_SERVICES);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [inHouseBookings, setInHouseBookings] = useState<Booking[]>([]);
  const [queue, setQueue] = useState<ServiceRequestItem[]>(INITIAL_QUEUE);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load data from backend
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [catRes, roomRes, bkgList, usageRes] = await Promise.all([
          serviceApi.getServiceCatalogue().catch(() => ({ data: [] })),
          reservationApi.listRooms().catch(() => ({ data: [] })),
          bookingStore.fetchBookings(),
          reportApi.getServiceUsageReport().catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(catRes?.data) && catRes.data.length > 0) {
          setCatalogue(catRes.data);
          setSelectedServiceId(catRes.data[0].public_id);
        } else if (DEFAULT_SERVICES.length > 0) {
          setSelectedServiceId(DEFAULT_SERVICES[0].public_id);
        }

        if (Array.isArray(roomRes?.data)) {
          setRooms(roomRes.data);
        }

        // Active or in-house bookings
        const active = bkgList.filter((b) => b.bookingStatus === 'Checked-In' || b.bookingStatus === 'Booked');
        setInHouseBookings(active);
        if (active.length > 0) {
          setSelectedBookingId(String(active[0].id));
        }

        // Populate queue from real service usage in database
        if (Array.isArray(usageRes?.data) && usageRes.data.length > 0) {
          const dbQueue: ServiceRequestItem[] = usageRes.data.map((u: any, idx: number) => {
            const matchedBkg = bkgList.find(
              (b) => String(b.publicId) === String(u.booking_public_id) || b.roomNumbers === u.room_number,
            );
            return {
              id: `req-${1000 + idx}`,
              bookingId: u.booking_public_id || matchedBkg?.id || '',
              guestName: matchedBkg?.guestName || `Room ${u.room_number} Guest`,
              roomNumber: u.room_number,
              serviceName: u.service_name,
              quantity: Number(u.total_quantity) || 1,
              unitPrice: (Number(u.total_amount) || 0) / (Number(u.total_quantity) || 1),
              totalPrice: Number(u.total_amount) || 0,
              time: 'Recorded in system',
              status: 'Fulfilled',
            };
          });
          setQueue(dbQueue);
        }
      } catch (err) {
        console.error('Failed to load guest services metadata', err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  // Selected Service
  const currentService = useMemo(() => {
    return catalogue.find((s) => s.public_id === selectedServiceId) || catalogue[0];
  }, [catalogue, selectedServiceId]);

  const selectedBooking = useMemo(() => {
    return inHouseBookings.find((b) => String(b.id) === selectedBookingId) || inHouseBookings[0];
  }, [inHouseBookings, selectedBookingId]);

  const lineTotal = (Number(currentService?.current_price) || 0) * quantity;

  // Filter queue
  const filteredQueue = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return queue;
    return queue.filter(
      (item) =>
        item.guestName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [queue, search]);

  // Order submission
  const handleOrderService = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !currentService) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Find matching room public_id
      const targetRoom = rooms.find((r) => r.room_number === selectedBooking.roomNumbers) || rooms[0];
      const roomPublicId = targetRoom?.public_id || 'rm-default';

      // Call Vidath's backend POST /api/bookings/:publicId/services (sp_calculate_bill)
      await bookingStore.recordServiceUsage(
        selectedBooking.id,
        currentService.public_id,
        roomPublicId,
        quantity,
      );

      const newItem: ServiceRequestItem = {
        id: `req-${Date.now().toString().slice(-4)}`,
        bookingId: selectedBooking.id,
        guestName: selectedBooking.guestName,
        roomNumber: selectedBooking.roomNumbers,
        serviceName: currentService.service_name,
        quantity,
        unitPrice: Number(currentService.current_price) || 0,
        totalPrice: lineTotal,
        time: 'Just now',
        status: 'In Progress',
        notes: notes.trim() || undefined,
      };

      setQueue([newItem, ...queue]);
      setSuccessMessage(
        `Dispatched ${quantity}x "${currentService.service_name}" to Room ${selectedBooking.roomNumbers}. Charge (${formatLKR(lineTotal)}) posted to guest folio.`,
      );
      setNotes('');
      setQuantity(1);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err?.message || 'Failed to dispatch service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'Pending' | 'In Progress' | 'Fulfilled') => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
    );
  };

  // KPIs
  const activeOrdersCount = queue.filter((i) => i.status !== 'Fulfilled').length;
  const fulfilledOrdersCount = queue.filter((i) => i.status === 'Fulfilled').length;
  const totalBilled = queue.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <main className="sr-page">
      <div className="sr-container">
        {/* Header */}
        <header className="sr-header">
          <div>
            <p className="sr-eyebrow">FRONT DESK &amp; CONCIERGE · GUEST SERVICES DISPATCH</p>
            <h1>Guest Services &amp; Request Queue</h1>
            <p className="sr-subtitle">
              Dispatch hotel services, log room dining and concierge charges, and fulfill guest requests in real time.
            </p>
          </div>
          <div className="sr-header-actions">
            <Link to="/frontdesk/dashboard" className="sr-btn-secondary">
              &larr; Back to Front Desk
            </Link>
          </div>
        </header>

        {/* 4 Metric Cards */}
        <section className="sr-metrics-grid" aria-label="Guest services metrics">
          <article className="sr-metric-card featured">
            <div className="sr-metric-header">
              <span>Active Orders in Queue</span>
              <div className="sr-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
            </div>
            <p className="sr-metric-value">{activeOrdersCount}</p>
            <p className="sr-metric-note">Requests currently being prepared or in transit</p>
          </article>

          <article className="sr-metric-card">
            <div className="sr-metric-header">
              <span>Catalogue Services</span>
              <div className="sr-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
            </div>
            <p className="sr-metric-value">{catalogue.length}</p>
            <p className="sr-metric-note">Available guest services with automated billing rules</p>
          </article>

          <article className="sr-metric-card">
            <div className="sr-metric-header">
              <span>Fulfilled Requests</span>
              <div className="sr-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <p className="sr-metric-value">{fulfilledOrdersCount}</p>
            <p className="sr-metric-note">Orders successfully delivered and confirmed with guests</p>
          </article>

          <article className="sr-metric-card">
            <div className="sr-metric-header">
              <span>Service Revenue Billed</span>
              <div className="sr-metric-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p className="sr-metric-value">{formatLKR(totalBilled)}</p>
            <p className="sr-metric-note">Total add-on services posted to active folios</p>
          </article>
        </section>

        {/* Main 2-Column Content */}
        <div className="sr-layout">
          {/* Left Column: Live Queue Table */}
          <section className="sr-panel">
            <div className="sr-panel-header">
              <div>
                <h2>Live Service Requests Queue</h2>
                <p>Track request dispatch status and mark completed deliveries.</p>
              </div>
              <label className="sr-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626978" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  placeholder="Search room, guest, or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <div className="sr-table-scroll">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>Room &amp; Guest</th>
                    <th>Service Item</th>
                    <th>Qty</th>
                    <th>Total Charge</th>
                    <th>Status</th>
                    <th>Fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#626978' }}>
                        Loading active service queue…
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#626978' }}>
                        No service requests in queue matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => {
                      const isDone = item.status === 'Fulfilled';
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong style={{ display: 'block', color: '#00152f' }}>
                              Room {item.roomNumber}
                            </strong>
                            <small style={{ color: '#626978' }}>{item.guestName}</small>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500, color: '#1f2a38' }}>{item.serviceName}</span>
                            {item.notes && (
                              <small style={{ display: 'block', color: '#889895', fontStyle: 'italic' }}>
                                &ldquo;{item.notes}&rdquo;
                              </small>
                            )}
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {formatLKR(item.totalPrice)}
                          </td>
                          <td>
                            <span className={isDone ? 'sr-badge-done' : 'sr-badge-pending'}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {!isDone ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item.id, 'Fulfilled')}
                                className="sr-btn"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Mark Delivered
                              </button>
                            ) : (
                              <span style={{ color: '#166534', fontSize: '12px', fontWeight: 600 }}>
                                &check; Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Dispatch Service Order Drawer */}
          <aside className="sr-form-panel">
            <h2>Order Guest Service</h2>
            <p>Post add-on services directly to in-house guest folios.</p>

            {successMessage && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleOrderService}>
              {/* Select In-House Guest / Room */}
              <div className="sr-form-group">
                <label htmlFor="sr-booking">Guest Reservation &amp; Room</label>
                <select
                  id="sr-booking"
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  required
                >
                  {inHouseBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      Room {b.roomNumbers} &mdash; {b.guestName} ({b.branchName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Service from Catalogue */}
              <div className="sr-form-group">
                <label htmlFor="sr-service">Hotel Service Catalogue</label>
                <select
                  id="sr-service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                >
                  {catalogue.map((s) => (
                    <option key={s.public_id} value={s.public_id}>
                      {s.service_name} &mdash; {formatLKR(Number(s.current_price) || 0)}
                    </option>
                  ))}
                </select>
                {currentService?.service_description && (
                  <small style={{ display: 'block', color: '#626978', marginTop: '6px' }}>
                    {currentService.service_description}
                  </small>
                )}
              </div>

              {/* Quantity */}
              <div className="sr-form-group">
                <label htmlFor="sr-qty">Quantity</label>
                <input
                  id="sr-qty"
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                />
              </div>

              {/* Order Notes / Instructions */}
              <div className="sr-form-group">
                <label htmlFor="sr-notes">Special Instructions (Optional)</label>
                <textarea
                  id="sr-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Schedule for 19:30, deliver with extra cutlery..."
                />
              </div>

              {/* Live Charge Preview */}
              <div className="sr-bill-preview">
                <span>Total Folio Charge:</span>
                <strong>{formatLKR(lineTotal)}</strong>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedBooking}
                className="sr-btn"
                style={{ width: '100%', padding: '13px' }}
              >
                {isSubmitting ? 'Dispatching & Posting Bill…' : `Dispatch & Charge ${formatLKR(lineTotal)}`}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
