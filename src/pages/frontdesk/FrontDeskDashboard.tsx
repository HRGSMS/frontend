import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { useSocket } from '../../context/socket-state';
import './FrontDeskDashboard.css';

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
  | 'users';
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

interface Guest {
  id: number;
  guestName: string;
  roomNumber: string;
  roomType: string;
  time: string;
  nights: number;
  status: 'Room ready' | 'Confirmed' | 'Paid' | 'Balance due';
}
const sampleArrivals: Guest[] = [
  {
    id: 1,
    guestName: 'John Smith',
    roomNumber: '101',
    roomType: 'Deluxe king',
    time: '14:00',
    nights: 3,
    status: 'Room ready',
  },
  {
    id: 2,
    guestName: 'Jane Doe',
    roomNumber: '105',
    roomType: 'Superior twin',
    time: '14:30',
    nights: 2,
    status: 'Confirmed',
  },
  {
    id: 3,
    guestName: 'Daniel Perera',
    roomNumber: '201',
    roomType: 'Deluxe king',
    time: '15:00',
    nights: 2,
    status: 'Room ready',
  },
  {
    id: 4,
    guestName: 'Sophie Chen',
    roomNumber: '302',
    roomType: 'Executive suite',
    time: '15:30',
    nights: 5,
    status: 'Confirmed',
  },
  {
    id: 5,
    guestName: 'Liam Fernando',
    roomNumber: '108',
    roomType: 'Superior twin',
    time: '16:00',
    nights: 1,
    status: 'Room ready',
  },
  {
    id: 6,
    guestName: 'Isabella Martin',
    roomNumber: '204',
    roomType: 'Deluxe king',
    time: '17:00',
    nights: 4,
    status: 'Confirmed',
  },
];
const sampleDepartures: Guest[] = [
  {
    id: 7,
    guestName: 'Bob Johnson',
    roomNumber: '202',
    roomType: 'Deluxe king',
    time: '10:00',
    nights: 3,
    status: 'Paid',
  },
  {
    id: 8,
    guestName: 'Alice Brown',
    roomNumber: '205',
    roomType: 'Deluxe king',
    time: '10:30',
    nights: 2,
    status: 'Balance due',
  },
  {
    id: 9,
    guestName: 'Ethan Clarke',
    roomNumber: '305',
    roomType: 'Executive suite',
    time: '11:00',
    nights: 4,
    status: 'Paid',
  },
  {
    id: 10,
    guestName: 'Maya Silva',
    roomNumber: '106',
    roomType: 'Superior twin',
    time: '11:00',
    nights: 1,
    status: 'Balance due',
  },
];
const checklist = [
  'Review arrivals and special requests',
  'Confirm room readiness with housekeeping',
  'Review outstanding departure balances',
];
const statusClass: Record<Guest['status'], string> = {
  'Room ready': 'ready',
  Confirmed: 'confirmed',
  Paid: 'ready',
  'Balance due': 'due',
};

function guestFromEvent(payload: unknown, kind: 'arrival' | 'departure'): Guest | null {
  if (!payload || typeof payload !== 'object' || !(kind in payload)) return null;
  const value: unknown = (payload as Record<string, unknown>)[kind];
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'number' ||
    typeof item.guestName !== 'string' ||
    typeof item.roomNumber !== 'string'
  )
    return null;
  const time = kind === 'arrival' ? item.checkInTime : item.checkOutTime;
  return {
    id: item.id,
    guestName: item.guestName,
    roomNumber: item.roomNumber,
    roomType: typeof item.roomType === 'string' ? item.roomType : 'Assigned room',
    time: typeof time === 'string' ? time : '—',
    nights: typeof item.nights === 'number' ? item.nights : 1,
    status: kind === 'arrival' ? 'Confirmed' : 'Balance due',
  };
}
function upsertGuest(guests: Guest[], next: Guest) {
  return guests.some((guest) => guest.id === next.id)
    ? guests.map((guest) => (guest.id === next.id ? next : guest))
    : [...guests, next];
}

export default function FrontDeskDashboard() {
  const { user, isLoading } = useAuth();
  const { socket } = useSocket();
  const [arrivals, setArrivals] = useState(sampleArrivals);
  const [departures, setDepartures] = useState(sampleDepartures);
  const [occupancyRate, setOccupancyRate] = useState(75);
  const [view, setView] = useState<'arrivals' | 'departures'>('arrivals');
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<number[]>([]);
  useEffect(() => {
    const onOccupancy = (payload: unknown) => {
      if (!payload || typeof payload !== 'object' || !('occupancyRate' in payload)) return;
      const rate = payload.occupancyRate;
      if (typeof rate === 'number' && Number.isFinite(rate) && rate >= 0 && rate <= 100)
        setOccupancyRate(rate);
    };
    const onArrival = (payload: unknown) => {
      const guest = guestFromEvent(payload, 'arrival');
      if (guest) setArrivals((previous) => upsertGuest(previous, guest));
    };
    const onDeparture = (payload: unknown) => {
      const guest = guestFromEvent(payload, 'departure');
      if (guest) setDepartures((previous) => upsertGuest(previous, guest));
    };
    socket?.on('occupancy-updated', onOccupancy);
    socket?.on('new-arrival', onArrival);
    socket?.on('new-departure', onDeparture);
    return () => {
      socket?.off('occupancy-updated', onOccupancy);
      socket?.off('new-arrival', onArrival);
      socket?.off('new-departure', onDeparture);
    };
  }, [socket]);

  const source = view === 'arrivals' ? arrivals : departures;
  const filtered = source.filter((guest) =>
    `${guest.guestName} ${guest.roomNumber} ${guest.roomType}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const balancesDue = departures.filter((guest) => guest.status === 'Balance due').length;
  const ready = arrivals.filter((guest) => guest.status === 'Room ready').length;
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Colombo',
  }).format(new Date());
  const firstName = user?.name?.split(' ')[0] || 'team';
  const management =
    user?.role === 'admin'
      ? [
          { label: 'User management', to: '/admin/users', icon: 'users' as const },
          { label: 'Reports', to: '/admin/reports', icon: 'chart' as const },
        ]
      : user?.role === 'manager'
        ? [
            { label: 'Staff management', to: '/manager/staff', icon: 'users' as const },
            { label: 'Reports', to: '/manager/reports', icon: 'chart' as const },
          ]
        : [];
  const metrics: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    featured?: boolean;
  }[] = [
    {
      label: 'Expected arrivals',
      value: String(arrivals.length).padStart(2, '0'),
      note: `${ready} rooms ready for check-in`,
      icon: 'calendar',
    },
    {
      label: 'Scheduled departures',
      value: String(departures.length).padStart(2, '0'),
      note: 'Standard check-out at 11:00',
      icon: 'door',
    },
    { label: 'Available rooms', value: '25', note: 'Sample rooms ready for guests', icon: 'bed' },
    {
      label: 'Occupancy',
      value: `${occupancyRate}%`,
      note: 'A snapshot of your property',
      icon: 'chart',
      featured: true,
    },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <main className="fd-dashboard">
      <aside className="fd-sidebar" aria-label="Front desk workspace">
        <Link to="/frontdesk/dashboard" className="fd-brand">
          <span className="fd-brand-mark">
            <Icon name="bed" size={20} />
          </span>
          <span>
            SkyNest Hotels<small>FRONT DESK OPERATIONS</small>
          </span>
        </Link>
        <nav className="fd-workspace-nav" aria-label="Front desk navigation">
          <span className="is-current" aria-current="page">
            <Icon name="chart" size={17} />
            Overview
          </span>
          <Link to="/frontdesk/reservations">
            <Icon name="calendar" size={17} />
            Reservations
          </Link>
          <Link to="/frontdesk/check-in-out">
            <Icon name="door" size={17} />
            Check-in & out
          </Link>
          <Link to="/frontdesk/service-requests">
            <Icon name="bell" size={17} />
            Guest services
          </Link>
          <Link to="/frontdesk/service-catalogue">
            <Icon name="bed" size={17} />
            Service Catalogue
          </Link>
        </nav>
        <div className="fd-sidebar-bottom">
          <Link to="/frontdesk/reservations/new" className="fd-button">
            <Icon name="plus" size={16} />
            New booking
          </Link>
          <Link to="/account" className="fd-sidebar-account">
            <Icon name="shield" size={16} />
            Account security
          </Link>
        </div>
      </aside>
      <div className="fd-content">
        <div className="fd-heading">
          <div>
            <p className="fd-eyebrow">FRONT DESK · DAILY OVERVIEW</p>
            <h1>Welcome back, {firstName}.</h1>
            <p className="fd-description">
              Here’s a clear overview of your guests and property today.
            </p>
          </div>
          <Link to="/frontdesk/reservations/new" className="fd-button">
            <Icon name="plus" size={18} />
            New reservation
          </Link>
        </div>
        <div className="fd-caption">
          <span>
            <Icon name="calendar" size={15} />
            {date}
          </span>
          <span className="fd-preview">
            <span />
            Sample operational data
          </span>
        </div>
        <section className="fd-metrics" aria-label="Daily hotel summary">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className={`fd-metric ${metric.featured ? 'fd-featured' : ''}`}
            >
              <div className="fd-metric-top">
                <h2>{metric.label}</h2>
                <Icon name={metric.icon} size={20} />
              </div>
              <p className="fd-metric-value">{metric.value}</p>
              {metric.featured && (
                <div className="fd-progress" aria-hidden="true">
                  <span style={{ width: `${occupancyRate}%` }} />
                </div>
              )}
              <p className="fd-metric-note">{metric.note}</p>
            </article>
          ))}
        </section>
        <section className="fd-attention" aria-label="Shift priorities">
          <span className="fd-attention-icon">
            <Icon name="clock" size={20} />
          </span>
          <div>
            <h2>Start your shift here</h2>
            <p>
              <strong>
                {ready} {ready === 1 ? 'arrival is' : 'arrivals are'} ready
              </strong>{' '}
              for check-in ·{' '}
              <strong>
                {balancesDue} {balancesDue === 1 ? 'departure has' : 'departures have'} a balance
                due
              </strong>
            </p>
          </div>
          <Link to="/frontdesk/check-in-out">
            Review check-ins <Icon name="arrow" size={16} />
          </Link>
        </section>
        <div className="fd-columns">
          <div className="fd-primary-column">
            <section className="fd-panel" aria-labelledby="fd-guest-heading">
              <div className="fd-panel-heading">
                <div>
                  <h2 id="fd-guest-heading">Today’s guest movements</h2>
                  <p>Every arrival and departure, in one place.</p>
                </div>
                <Link to="/frontdesk/reservations" className="fd-text-link">
                  All reservations
                  <Icon name="arrowUp" size={15} />
                </Link>
              </div>
              <div className="fd-toolbar">
                <div className="fd-segments" role="group" aria-label="Guest movement view">
                  <button
                    type="button"
                    className={view === 'arrivals' ? 'is-selected' : ''}
                    aria-pressed={view === 'arrivals'}
                    onClick={() => setView('arrivals')}
                  >
                    Arrivals<span>{arrivals.length}</span>
                  </button>
                  <button
                    type="button"
                    className={view === 'departures' ? 'is-selected' : ''}
                    aria-pressed={view === 'departures'}
                    onClick={() => setView('departures')}
                  >
                    Departures<span>{departures.length}</span>
                  </button>
                </div>
                <div className="fd-search">
                  <Icon name="search" size={17} />
                  <label htmlFor="fd-search-guests" className="sr-only">
                    Search guests, rooms or room types
                  </label>
                  <input
                    id="fd-search-guests"
                    type="search"
                    placeholder="Search guests or rooms"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="fd-table-scroll">
                <table className="fd-table">
                  <caption className="sr-only">
                    Today’s {view}. Includes sample operational data.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Guest</th>
                      <th scope="col">Room</th>
                      <th scope="col">{view === 'arrivals' ? 'Arrival' : 'Check-out'}</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((guest) => (
                      <tr key={guest.id}>
                        <td>
                          <div className="fd-guest">
                            <span className={`fd-avatar fd-avatar-${guest.id % 3}`}>
                              {guest.guestName
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((word) => word[0])
                                .join('')}
                            </span>
                            <div>
                              <strong>{guest.guestName}</strong>
                              <small>
                                {guest.nights} {guest.nights === 1 ? 'night' : 'nights'} ·{' '}
                                {view === 'arrivals' ? 'Arriving today' : 'Departing today'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="fd-room-number">{guest.roomNumber}</strong>
                          <small className="fd-room-type">{guest.roomType}</small>
                        </td>
                        <td>
                          <span className="fd-time">{guest.time}</span>
                        </td>
                        <td>
                          <span className={`fd-badge fd-badge-${statusClass[guest.status]}`}>
                            <span />
                            {guest.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to="/frontdesk/check-in-out"
                            className="fd-row-action"
                            aria-label={`Open ${view === 'arrivals' ? 'check-in' : 'check-out'} for ${guest.guestName}`}
                          >
                            {view === 'arrivals' ? 'Check in' : 'Check out'}
                            <Icon name="arrow" size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="fd-empty">
                  <Icon name="search" size={26} />
                  <h3>{query ? 'No matching guests' : `No ${view} scheduled`}</h3>
                  <p>
                    {query
                      ? 'Try a different guest name, room number or room type.'
                      : 'Guest movements will appear here when they are scheduled.'}
                  </p>
                  {query && (
                    <button type="button" className="fd-text-link" onClick={() => setQuery('')}>
                      Clear search
                    </button>
                  )}
                </div>
              )}
              <div className="fd-table-footer">
                <span role="status" aria-live="polite">
                  {filtered.length} {filtered.length === 1 ? 'guest' : 'guests'}{' '}
                  {query
                    ? 'matching your search'
                    : `scheduled for ${view === 'arrivals' ? 'arrival' : 'departure'}`}
                </span>
                <span>
                  <Icon name="clock" size={13} />
                  Sri Lanka time
                </span>
              </div>
            </section>
            <section className="fd-quick-actions" aria-label="Quick actions">
              {[
                {
                  title: 'Check-in & check-out',
                  note: 'Verify guests and manage room handovers.',
                  to: '/frontdesk/check-in-out',
                  icon: 'door' as const,
                },
                {
                  title: 'Process a payment',
                  note: 'Review bills and settle balances.',
                  to: '/frontdesk/payment-processing',
                  icon: 'shield' as const,
                },
              ].map((action) => (
                <Link key={action.to} to={action.to} className="fd-quick-action">
                  <span className="fd-action-icon">
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
            <section className="fd-panel fd-checklist" aria-labelledby="fd-checklist-heading">
              <div className="fd-panel-heading">
                <div>
                  <h2 id="fd-checklist-heading">Your shift checklist</h2>
                  <p>Keep the essentials covered before handover.</p>
                </div>
                <span className="fd-check-count">
                  {completed.length} / {checklist.length}
                </span>
              </div>
              <div
                className="fd-check-progress"
                role="progressbar"
                aria-label="Shift checklist completion"
                aria-valuemin={0}
                aria-valuemax={checklist.length}
                aria-valuenow={completed.length}
              >
                <span style={{ width: `${(completed.length / checklist.length) * 100}%` }} />
              </div>
              <div className="fd-check-items">
                {checklist.map((item, index) => (
                  <label
                    key={item}
                    className={`fd-check-item ${completed.includes(index) ? 'is-complete' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={completed.includes(index)}
                      onChange={() =>
                        setCompleted((previous) =>
                          previous.includes(index)
                            ? previous.filter((id) => id !== index)
                            : [...previous, index],
                        )
                      }
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <p className="fd-check-note">Personal checklist · resets when you leave this page</p>
            </section>
          </div>
          <aside className="fd-secondary-column" aria-label="Property and service overview">
            <section className="fd-panel fd-room-panel" aria-labelledby="fd-rooms-heading">
              <div className="fd-panel-heading">
                <div>
                  <h2 id="fd-rooms-heading">Property pulse</h2>
                  <p>At a glance, at your service.</p>
                </div>
                <Icon name="bed" size={20} />
              </div>
              <div className="fd-donut">
                <svg
                  viewBox="0 0 180 180"
                  role="img"
                  aria-label={`Occupancy: ${occupancyRate} percent`}
                >
                  <circle cx="90" cy="90" r="68" fill="none" stroke="#dee8ff" strokeWidth="16" />
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
              <div className="fd-room-legend">
                <span>
                  <i className="fd-occupied-dot" />
                  Occupied
                </span>
                <span>
                  <i className="fd-available-dot" />
                  Remaining capacity
                </span>
              </div>
              <div className="fd-room-availability">
                <div>
                  <strong>25</strong>
                  <span>sample rooms available</span>
                </div>
                <Link
                  to="/frontdesk/reservations/new"
                  className="fd-row-action"
                  aria-label="Find an available room"
                >
                  <Icon name="arrowUp" size={20} />
                </Link>
              </div>
            </section>
            <section className="fd-panel fd-services" aria-labelledby="fd-services-heading">
              <div className="fd-panel-heading">
                <div>
                  <h2 id="fd-services-heading">Guest services</h2>
                  <p>A few thoughtful touches.</p>
                </div>
                <Icon name="bell" size={19} />
              </div>
              <div className="fd-service-preview">
                <span className="fd-service-illustration">
                  <Icon name="bell" size={30} />
                </span>
                <h3>Make their stay memorable.</h3>
                <p>
                  Room service, laundry, transport.
                  <br />
                  Keep every guest request in view.
                </p>
              </div>
              <Link to="/frontdesk/service-requests" className="fd-service-link">
                Open service requests
                <Icon name="arrow" size={16} />
              </Link>
            </section>
            {management.length > 0 && (
              <section className="fd-panel fd-management" aria-label="Management shortcuts">
                <h2>Management workspace</h2>
                {management.map((item) => (
                  <Link key={item.to} to={item.to}>
                    <Icon name={item.icon} size={17} />
                    <span>{item.label}</span>
                    <Icon name="arrowUp" size={15} />
                  </Link>
                ))}
              </section>
            )}
          </aside>
        </div>
        <footer className="fd-footer">
          <span>SkyNest Hotels · Thoughtful hospitality, every day.</span>
          <span>Front desk workspace</span>
        </footer>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main
      className="fd-dashboard fd-loading"
      aria-busy="true"
      aria-label="Loading front desk overview"
    >
      <span role="status" className="sr-only">
        Loading your front desk overview…
      </span>
      <div className="fd-skeleton fd-skeleton-heading" />
      <div className="fd-metrics">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="fd-skeleton fd-skeleton-metric" />
        ))}
      </div>
      <div className="fd-columns">
        <div className="fd-skeleton fd-skeleton-table" />
        <div className="fd-skeleton fd-skeleton-table" />
      </div>
    </main>
  );
}
