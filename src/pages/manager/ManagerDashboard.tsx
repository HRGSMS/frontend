import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import {
  reportApi,
  type RevenueRecord,
  type OccupancyRecord,
  type BillingRecord,
  type TopServiceRecord,
} from '../../api/reportApi';
import '../frontdesk/FrontDeskDashboard.css';
import '../reports/ReportsPage.css';
import './ManagerDashboard.css';

function formatLKR(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type IconName =
  | 'calendar'
  | 'door'
  | 'bed'
  | 'chart'
  | 'plus'
  | 'arrow'
  | 'arrowUp'
  | 'search'
  | 'clock'
  | 'bell'
  | 'shield'
  | 'users'
  | 'refresh';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2" />
      </>
    ),
    door: <path d="M4 21h16M7 21V3h10v18M13 12h1" />,
    bed: (
      <>
        <path d="M3 18V8m18 10v-7a3 3 0 0 0-3-3h-7v6M3 14h18M3 18v3m18-3v3" />
        <rect x="3" y="8" width="8" height="6" rx="1" />
      </>
    ),
    chart: <path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    arrowUp: <path d="M6 18 18 6M6 6h12v12" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.65" />
      </>
    ),
    refresh: (
      <>
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

const shortcuts = [
  {
    title: 'Staff management',
    note: 'Review team coverage and duty schedules.',
    to: '/manager/staff',
    icon: 'users' as const,
  },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live reporting state
  const [revenueData, setRevenueData] = useState<RevenueRecord[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyRecord[]>([]);
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopServiceRecord[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = '2026-10-01';
      const to = '2026-10-31';
      const [revRes, occRes, billRes, topRes] = await Promise.all([
        reportApi.getRevenueReport({ from, to }),
        reportApi.getOccupancyReport({ from, to }),
        reportApi.getBillingReport(),
        reportApi.getTopServicesReport(),
      ]);

      setRevenueData(revRes.data || []);
      setOccupancyData(occRes.data || []);
      setBillingData(billRes.data || []);
      setTopServicesData(topRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager reporting metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute live Room Types from Occupancy Data
  const dynamicRoomTypes = useMemo(() => {
    if (!occupancyData.length) {
      return [
        { name: 'Single', rooms: 3, occupied: 0, available: 3, maintenance: 0 },
        { name: 'Double', rooms: 3, occupied: 1, available: 2, maintenance: 0 },
        { name: 'Deluxe', rooms: 2, occupied: 0, available: 2, maintenance: 0 },
        { name: 'Family', rooms: 2, occupied: 1, available: 1, maintenance: 0 },
        { name: 'Suite', rooms: 2, occupied: 1, available: 1, maintenance: 0 },
      ];
    }
    const groups: Record<
      string,
      { rooms: number; occupied: number; available: number; maintenance: number }
    > = {};

    for (const item of occupancyData) {
      const t = item.type_name || 'Standard';
      if (!groups[t]) {
        groups[t] = { rooms: 0, occupied: 0, available: 0, maintenance: 0 };
      }
      groups[t].rooms += 1;
      if (item.booking_status === 'Booked' || item.booking_status === 'Checked-In') {
        groups[t].occupied += 1;
      } else {
        groups[t].available += 1;
      }
    }

    return Object.entries(groups).map(([name, stats]) => ({
      name,
      ...stats,
    }));
  }, [occupancyData]);

  const totalRooms = dynamicRoomTypes.reduce((total, room) => total + room.rooms, 0);
  const occupiedRooms = dynamicRoomTypes.reduce((total, room) => total + room.occupied, 0);
  const availableRooms = dynamicRoomTypes.reduce((total, room) => total + room.available, 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const filtered = dynamicRoomTypes.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Compute live Revenue & Balances
  const totalRevenue = revenueData.reduce((acc, r) => {
    return acc + Number(r.room_and_tax_revenue || 0) + Number(r.service_revenue || 0);
  }, 0);

  const totalOutstanding = billingData.reduce((acc, b) => {
    const bal = Number(b.calculated_outstanding_amount || 0);
    return bal > 0 ? acc + bal : acc;
  }, 0);

  const topService = topServicesData[0];

  const metrics: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    featured?: boolean;
  }[] = [
    {
      label: 'Portfolio revenue',
      value: isLoading ? '...' : formatLKR(totalRevenue),
      note: 'Across all operating properties',
      icon: 'chart',
      featured: true, // Matching the featured total revenue card in Reports
    },
    {
      label: 'Outstanding balance',
      value: isLoading ? '...' : formatLKR(totalOutstanding),
      note: `${billingData.filter((b) => Number(b.calculated_outstanding_amount || 0) > 0).length} guest accounts pending`,
      icon: 'bell',
    },
    {
      label: 'Available rooms',
      value: isLoading ? '...' : String(availableRooms),
      note: `${occupiedRooms} rooms booked or in-house`,
      icon: 'bed',
    },
    {
      label: 'Property occupancy',
      value: isLoading ? '...' : `${occupancyRate}%`,
      note: `${occupiedRooms} of ${totalRooms} rooms occupied`,
      icon: 'chart',
    },
  ];

  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Colombo',
  }).format(new Date());

  const firstName = user?.name?.split(' ')[0] || 'Manager';

  return (
    <main className="fd-dashboard">
      {/* Workspace Sidebar Navigation (Matches /manager/reports rail) */}
      <aside className="fd-sidebar" aria-label="Management workspace rail">
        <Link to="/manager/dashboard" className="fd-brand">
          <span className="fd-brand-mark">
            <Icon name="chart" size={20} />
          </span>
          <span>
            SkyNest Hotels
            <small>MANAGEMENT WORKSPACE</small>
          </span>
        </Link>
        <nav className="fd-workspace-nav" aria-label="Manager workspace navigation">
          <span className="is-current" aria-current="page">
            <Icon name="arrow" size={17} />
            Manager dashboard
          </span>
          <Link to="/manager/reports">
            <Icon name="chart" size={17} />
            Analytics & reports
          </Link>
          <Link to="/manager/staff">
            <Icon name="users" size={17} />
            Staff management
          </Link>
        </nav>
        <div className="fd-sidebar-bottom">
          <Link to="/manager/reports" className="fd-button">
            <Icon name="chart" size={16} />
            Full reports
          </Link>
          <Link to="/account" className="fd-sidebar-account">
            <Icon name="shield" size={16} />
            Account security
          </Link>
        </div>
      </aside>

      {/* Main Content Area (Matches /manager/reports container) */}
      <div className="fd-content rp-container md-container">
        {/* Header */}
        <header className="rp-header">
          <p className="rp-eyebrow">HRGMS · OPERATIONAL &amp; REVENUE OVERVIEW</p>
          <div className="rp-title-row">
            <div>
              <h1>A great day starts with a clear view.</h1>
              <p className="rp-subtitle">
                Welcome back, {firstName}. Here is your property and performance at a glance.
              </p>
            </div>
            <div className="rp-actions-row">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={isLoading}
                className="rp-export-btn"
                title="Refresh database records"
              >
                <Icon name="refresh" size={16} />
                {isLoading ? 'Refreshing…' : 'Refresh'}
              </button>
              <Link to="/manager/reports" className="rp-filter-btn">
                <Icon name="chart" size={16} />
                Full reports &amp; analytics
              </Link>
            </div>
          </div>
        </header>

        {/* Date & Live Sync Bar */}
        <div className="md-caption-bar">
          <span className="md-caption-date">
            <Icon name="calendar" size={16} />
            {date}
          </span>
          <span className="md-live-pill">
            <span className="md-live-dot" />
            Live database records connected
          </span>
        </div>

        {error && (
          <div className="rp-error-banner" role="alert" style={{ marginBottom: '20px' }}>
            <span>
              <strong>Error loading metrics:</strong> {error}
            </span>
            <button type="button" className="rp-retry-btn" onClick={() => void loadData()}>
              Retry
            </button>
          </div>
        )}

        {/* 4 Metric Summary Cards */}
        <section className="rp-metrics-grid" aria-label="Hotel summary metrics">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className={`rp-metric-card ${metric.featured ? 'rp-featured' : ''}`}
            >
              <div className="rp-metric-top">
                <h2 className="rp-metric-label">{metric.label}</h2>
                <div className="rp-metric-icon">
                  <Icon name={metric.icon} size={18} />
                </div>
              </div>
              <p className="rp-metric-value">{metric.value}</p>
              {metric.label === 'Property occupancy' && (
                <div className="md-metric-progress" aria-hidden="true">
                  <span style={{ width: `${occupancyRate}%` }} />
                </div>
              )}
              <p className="rp-metric-sub">{metric.note}</p>
            </article>
          ))}
        </section>

        {/* Main 2-Column Content */}
        <div className="md-columns">
          <div className="md-primary-column">
            {/* Room Overview Table Panel */}
            <section className="rp-panel" aria-labelledby="md-overview-heading">
              <div className="rp-panel-header">
                <div>
                  <h2 id="md-overview-heading">Room category occupancy</h2>
                  <p>Real-time room availability based on current booking logs.</p>
                </div>
                <Link
                  to="/frontdesk/reservations"
                  style={{
                    color: '#00152f',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  Reservations
                  <Icon name="arrowUp" size={15} />
                </Link>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px 12px',
                  borderBottom: '1px solid #e9ecf5',
                }}
              >
                <span style={{ fontSize: '13px', color: '#626978' }}>
                  {totalRooms} catalog rooms
                </span>
                <label className="rp-search-box">
                  <Icon name="search" size={15} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search room categories"
                    aria-label="Search room categories"
                  />
                </label>
              </div>

              <div className="rp-table-scroll">
                <table className="rp-table">
                  <caption style={{ display: 'none' }}>Room category availability</caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Total</th>
                      <th scope="col">Occupied / Booked</th>
                      <th scope="col">Available</th>
                      <th scope="col">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((room) => {
                      const roomOccPct =
                        room.rooms > 0 ? Math.round((room.occupied / room.rooms) * 100) : 0;
                      return (
                        <tr key={room.name}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#f0f3ff',
                                  color: '#00152f',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Icon name="bed" size={16} />
                              </span>
                              <div>
                                <strong style={{ display: 'block', color: '#00152f', fontSize: '14px' }}>
                                  {room.name}
                                </strong>
                                <small style={{ color: '#626978', fontSize: '11px' }}>
                                  Hotel inventory
                                </small>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>{room.rooms}</td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>{room.occupied}</td>
                          <td>
                            <span
                              style={{
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #bbf7d0',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {room.available} ready
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                background: roomOccPct >= 50 ? '#fffbeb' : '#f0f3ff',
                                color: roomOccPct >= 50 ? '#b45309' : '#00152f',
                                border: `1px solid ${roomOccPct >= 50 ? '#fde68a' : '#d0ddf5'}`,
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {roomOccPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px', color: '#626978' }} role="status">
                  <Icon name="search" size={24} />
                  <h3 style={{ margin: '8px 0 4px', color: '#00152f', fontSize: '14px' }}>
                    No matching results
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px' }}>Try a different search term.</p>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderTop: '1px solid #e9ecf5',
                  padding: '14px 24px',
                  color: '#626978',
                  fontSize: '12px',
                }}
              >
                <span>
                  {filtered.length} of {dynamicRoomTypes.length} room categories
                </span>
                <Link
                  to="/manager/reports"
                  style={{ color: '#00152f', fontWeight: 600, display: 'flex', gap: '4px', textDecoration: 'none' }}
                >
                  Inspect detailed occupancy report &rarr;
                </Link>
              </div>
            </section>

            {/* Quick Actions (Staff Management) */}
            <section aria-label="Quick actions">
              {shortcuts.map((action) => (
                <Link key={action.to} to={action.to} className="md-quick-action">
                  <div className="md-action-icon">
                    <Icon name={action.icon} size={22} />
                  </div>
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.note}</p>
                  </div>
                  <Icon name="arrowUp" size={18} />
                </Link>
              ))}
            </section>
          </div>

          {/* Secondary Column: Property Pulse & Leading Service */}
          <aside className="md-secondary-column" aria-label="Occupancy and workspace overview">
            {/* Property Pulse Donut */}
            <section className="rp-panel" aria-labelledby="md-occupancy-heading">
              <div className="rp-panel-header">
                <div>
                  <h2 id="md-occupancy-heading">Property pulse</h2>
                  <p>Live occupancy from active reservations.</p>
                </div>
                <Icon name="bed" size={18} />
              </div>

              <div className="md-donut-box">
                <svg
                  viewBox="0 0 180 180"
                  role="img"
                  aria-label={`Live occupancy: ${occupancyRate} percent`}
                >
                  <circle cx="90" cy="90" r="68" fill="none" stroke="#e9ecf5" strokeWidth="16" />
                  <circle
                    cx="90"
                    cy="90"
                    r="68"
                    fill="none"
                    stroke="#00152f"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${(occupancyRate / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div>
                  <strong>
                    {occupancyRate}
                    <span>%</span>
                  </strong>
                  <small>Occupancy</small>
                </div>
              </div>

              <div className="md-donut-legend">
                <span>
                  <i className="md-occupied-dot" />
                  Occupied ({occupiedRooms})
                </span>
                <span>
                  <i className="md-available-dot" />
                  Available ({availableRooms})
                </span>
              </div>

              <div className="md-donut-footer">
                <div>
                  <strong>{occupiedRooms}</strong>
                  <span style={{ color: '#626978', marginLeft: '6px' }}>
                    of {totalRooms} rooms booked
                  </span>
                </div>
              </div>
            </section>

            {/* Leading Guest Service */}
            <section className="rp-panel" aria-labelledby="md-services-heading" style={{ padding: '20px 22px' }}>
              <h2 id="md-services-heading" style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px', color: '#00152f' }}>
                Leading guest service
              </h2>
              <p style={{ fontSize: '13px', color: '#626978', margin: '0 0 16px' }}>
                Highest grossing service in catalogue.
              </p>

              <div
                style={{
                  padding: '14px 16px',
                  background: '#f9f9ff',
                  borderRadius: '10px',
                  border: '1px solid #e9ecf5',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#00152f' }}>
                  {topService ? topService.service_name : 'Room service'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#626978',
                  }}
                >
                  <span>Orders: {topService?.total_quantity || 0}</span>
                  <span style={{ fontWeight: 700, color: '#00152f' }}>
                    {formatLKR(topService?.total_revenue || 0)}
                  </span>
                </div>
              </div>

              <Link
                to="/manager/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#00152f',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginTop: '16px',
                  textDecoration: 'none',
                }}
              >
                <Icon name="chart" size={16} />
                <span>Service usage breakdown</span>
                <span style={{ marginLeft: 'auto' }}>&rarr;</span>
              </Link>
            </section>
          </aside>
        </div>

        <footer className="md-footer">
          <span>SkyNest Hotels · Thoughtful hospitality, every day.</span>
          <span>Manager workspace · Live reports integration</span>
        </footer>
      </div>
    </main>
  );
}
