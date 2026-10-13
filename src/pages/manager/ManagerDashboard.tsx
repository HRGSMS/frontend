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
import { guestApi, type BranchItem } from '../../api/guestApi';
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
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const from = '2026-10-01';
      const to = '2026-10-31';
      const [revRes, occRes, billRes, topRes, branchList] = await Promise.all([
        reportApi.getRevenueReport({ from, to }),
        reportApi.getOccupancyReport({ from, to }),
        reportApi.getBillingReport(),
        reportApi.getTopServicesReport(),
        guestApi.getBranches().catch(() => []),
      ]);

      setRevenueData(revRes.data || []);
      setOccupancyData(occRes.data || []);
      setBillingData(billRes.data || []);
      setTopServicesData(topRes.data || []);
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager reporting metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filter metrics by selected branch
  const activeRevenue = useMemo(() => {
    if (selectedBranch === 'All') return revenueData;
    return revenueData.filter((r) => r.branch_name === selectedBranch);
  }, [revenueData, selectedBranch]);

  const activeOccupancy = useMemo(() => {
    if (selectedBranch === 'All') return occupancyData;
    return occupancyData.filter((o) => o.branch_name === selectedBranch);
  }, [occupancyData, selectedBranch]);

  const activeBilling = useMemo(() => {
    if (selectedBranch === 'All') return billingData;
    return billingData.filter((b) => b.branch_names?.includes(selectedBranch));
  }, [billingData, selectedBranch]);

  // Compute live Room Types from Occupancy Data
  const dynamicRoomTypes = useMemo(() => {
    const groups: Record<
      string,
      { rooms: number; occupied: number; available: number; maintenance: number }
    > = {};

    for (const item of activeOccupancy) {
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
  }, [activeOccupancy]);

  const totalRooms = dynamicRoomTypes.reduce((total, room) => total + room.rooms, 0);
  const occupiedRooms = dynamicRoomTypes.reduce((total, room) => total + room.occupied, 0);
  const availableRooms = dynamicRoomTypes.reduce((total, room) => total + room.available, 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const filtered = dynamicRoomTypes.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Compute live Revenue & Balances
  const totalRevenue = activeRevenue.reduce((acc, r) => {
    return acc + Number(r.room_and_tax_revenue || 0) + Number(r.service_revenue || 0);
  }, 0);

  const totalOutstanding = activeBilling.reduce((acc, b) => {
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
      label: selectedBranch === 'All' ? 'Portfolio revenue' : `${selectedBranch} revenue`,
      value: isLoading ? '...' : formatLKR(totalRevenue),
      note: selectedBranch === 'All' ? 'Across all operating properties' : `Revenue generated by ${selectedBranch}`,
      icon: 'chart',
      featured: true, // Featured card in executive reports navy gradient
    },
    {
      label: 'Outstanding balance',
      value: isLoading ? '...' : formatLKR(totalOutstanding),
      note: `${activeBilling.filter((b) => Number(b.calculated_outstanding_amount || 0) > 0).length} guest accounts pending`,
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
    <main className="md-dashboard">
      {/* Heading (Original placement preserved) */}
      <div className="md-heading">
        <div>
          <p className="md-eyebrow">MANAGER · OPERATIONAL &amp; REVENUE OVERVIEW</p>
          <h1>A great day starts with a clear view.</h1>
          <p className="md-description">
            Welcome back, {firstName}. Here is your property and performance at a glance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="md-button-secondary"
            title="Refresh database records"
          >
            <Icon name="refresh" size={16} />
          </button>
          <Link to="/manager/reports" className="md-button">
            <Icon name="chart" size={18} />
            Full reports &amp; analytics
          </Link>
        </div>
      </div>

      {/* Caption & Status (Original placement preserved) */}
      <div className="md-caption">
        <span>
          <Icon name="calendar" size={15} />
          {date}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e9ecf5',
              background: '#ffffff',
              color: '#00152f',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,21,47,0.06)',
            }}
            aria-label="Filter property branch"
          >
            <option value="All">All Properties (Portfolio)</option>
            {branches.map((b) => (
              <option key={b.public_id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="md-live">
            <span />
            Live database records connected
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* 4 Primary Metric Cards (Original placement preserved) */}
      <section className="md-metrics" aria-label="Hotel summary">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`md-metric ${metric.featured ? 'md-featured' : ''}`}
          >
            <div className="md-metric-top">
              <h2>{metric.label}</h2>
              <div className="md-metric-icon">
                <Icon name={metric.icon} size={18} />
              </div>
            </div>
            <p className="md-metric-value">{metric.value}</p>
            {metric.label === 'Property occupancy' && (
              <div className="md-progress" aria-hidden="true">
                <span style={{ width: `${occupancyRate}%` }} />
              </div>
            )}
            <p className="md-metric-note">{metric.note}</p>
          </article>
        ))}
      </section>

      {/* Main 2-Column Grid (Original placement preserved) */}
      <div className="md-columns">
        <div className="md-primary-column">
          {/* Room Overview Table (Original placement preserved) */}
          <section className="md-panel" aria-labelledby="md-overview-heading">
            <div className="md-panel-heading">
              <div>
                <h2 id="md-overview-heading">Room category occupancy</h2>
                <p>Real-time room availability based on current booking logs.</p>
              </div>
              <Link to="/frontdesk/reservations" className="md-text-link">
                Reservations
                <Icon name="arrowUp" size={15} />
              </Link>
            </div>
            <div className="md-toolbar">
              <span className="md-description" style={{ margin: 0 }}>
                {totalRooms} catalog rooms
              </span>
              <label className="md-search">
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
            <div className="md-table-scroll">
              <table className="md-table">
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
                          <div className="md-guest">
                            <span className="md-avatar">
                              <Icon name="bed" size={16} />
                            </span>
                            <div>
                              <strong>{room.name}</strong>
                              <small>Hotel inventory</small>
                            </div>
                          </div>
                        </td>
                        <td>{room.rooms}</td>
                        <td>{room.occupied}</td>
                        <td>
                          <span className="md-badge md-badge-ready">{room.available}</span>
                        </td>
                        <td>
                          <span
                            className={`md-badge ${roomOccPct >= 50 ? 'md-badge-due' : 'md-badge-confirmed'}`}
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

            <div className="md-table-footer">
              <span>
                {filtered.length} of {dynamicRoomTypes.length} room categories
              </span>
              <Link
                to="/manager/reports"
                className="md-footer-link"
              >
                Inspect detailed occupancy report &rarr;
              </Link>
            </div>
          </section>

          {/* Quick Actions (Original placement preserved) */}
          <section className="md-quick-actions" aria-label="Quick actions">
            {shortcuts.map((action) => (
              <Link key={action.to} to={action.to} className="md-quick-action">
                <span className="md-action-icon">
                  <Icon name={action.icon} size={22} />
                </span>
                <div>
                  <h3>{action.title}</h3>
                  <p>{action.note}</p>
                </div>
                <Icon name="arrowUp" size={18} />
              </Link>
            ))}
          </section>
        </div>

        {/* Secondary Column (Original placement preserved) */}
        <aside className="md-secondary-column" aria-label="Occupancy and workspace overview">
          {/* Property Pulse Donut (Original placement preserved) */}
          <section className="md-panel md-room-panel" aria-labelledby="md-occupancy-heading">
            <div className="md-panel-heading">
              <div>
                <h2 id="md-occupancy-heading">Property pulse</h2>
                <p>Live occupancy from active reservations.</p>
              </div>
              <Icon name="bed" size={18} />
            </div>
            <div className="md-donut">
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
            <div className="md-room-legend">
              <span>
                <i className="md-occupied-dot" />
                Occupied ({occupiedRooms})
              </span>
              <span>
                <i className="md-available-dot" />
                Available ({availableRooms})
              </span>
            </div>
            <div className="md-room-availability">
              <div>
                <strong>{occupiedRooms}</strong>
                <span>of {totalRooms} rooms booked/occupied</span>
              </div>
            </div>
          </section>

          {/* Top Service Preview (Original placement preserved) */}
          <section className="md-panel md-management" aria-labelledby="md-services-heading">
            <h2 id="md-services-heading">Leading guest service</h2>
            <p className="md-description" style={{ margin: 0 }}>
              Highest grossing service in catalogue.
            </p>
            <div className="md-service-box">
              <div className="md-service-title">
                {topService ? topService.service_name : 'Room service'}
              </div>
              <div className="md-service-meta">
                <span>Orders: {topService?.total_quantity || 0}</span>
                <span className="md-service-rev">
                  {formatLKR(topService?.total_revenue || 0)}
                </span>
              </div>
            </div>
            <Link to="/manager/reports" className="md-service-link">
              <Icon name="chart" size={17} />
              <span>Service usage breakdown</span>
              <Icon name="arrowUp" size={15} />
            </Link>
          </section>
        </aside>
      </div>

      <footer className="md-footer">
        <span>SkyNest Hotels · Thoughtful hospitality, every day.</span>
        <span>Manager workspace · Live reports integration</span>
      </footer>
    </main>
  );
}
