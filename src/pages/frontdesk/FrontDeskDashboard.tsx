import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { useSocket } from '../../context/socket-state';

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
  const { user } = useAuth();
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

  return (
    <main className="fd-dashboard">
      <style>{dashboardStyles}</style>
      <div className="fd-heading">
        <div>
          <p className="fd-eyebrow">FRONT DESK · DAILY OVERVIEW</p>
          <h1>Every stay, well taken care of.</h1>
          <p className="fd-description">Welcome back, {firstName}. Here’s your day at a glance.</p>
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
                          <Icon name="arrow" size={18} />
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
                <h3>No guests found</h3>
                <p>Try a different guest name or room number.</p>
                <button type="button" className="fd-text-link" onClick={() => setQuery('')}>
                  Clear search
                </button>
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
                note: 'A smooth start. A seamless farewell.',
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
                <p>The small things that make a great stay.</p>
              </div>
              <span className="fd-check-count">
                {completed.length} / {checklist.length}
              </span>
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
                <circle cx="90" cy="90" r="68" fill="none" stroke="#e4ede7" strokeWidth="16" />
                <circle
                  cx="90"
                  cy="90"
                  r="68"
                  fill="none"
                  stroke="#224846"
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
    </main>
  );
}

const dashboardStyles = `
.fd-dashboard{--fd-ink:#192f33;--fd-muted:#737f80;--fd-line:#e6eae6;--fd-green:#224846;--fd-gold:#b79a61;box-sizing:border-box;background:#f6f7f3;color:var(--fd-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:calc(100vh - 74px);padding:38px clamp(20px,4vw,64px) 24px}
.fd-dashboard *, .fd-dashboard *::before,.fd-dashboard *::after{box-sizing:border-box}
.fd-dashboard svg{flex-shrink:0}
.fd-dashboard a{text-decoration:none}
.fd-dashboard button,.fd-dashboard input{font:inherit}
.fd-dashboard button,.fd-dashboard a,.fd-dashboard input{outline-offset:4px}
.fd-dashboard :focus-visible{outline:2px solid #987b3f}
.fd-dashboard button{cursor:pointer}
.fd-heading,.fd-caption,.fd-metrics,.fd-columns,.fd-footer{max-width:1390px;margin-left:auto;margin-right:auto}
.fd-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px}
.fd-eyebrow{margin:0 0 12px;color:#8d7853;font-size:10px;font-weight:700;letter-spacing:2px}
.fd-heading h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;letter-spacing:-1.1px;font-size:clamp(28px,3vw,40px);line-height:1.2;margin:0}
.fd-description{margin:12px 0 0;color:var(--fd-muted);font-size:13px;line-height:1.7}
.fd-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--fd-green);color:white;white-space:nowrap;border-radius:8px;padding:13px 18px;font-size:12px;font-weight:600;box-shadow:0 4px 10px #22484615;transition:background .15s,transform .15s}
.fd-button:hover{background:#163734;transform:translateY(-1px)}
.fd-caption{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px;color:#637273;font-size:11px}
.fd-caption>span{display:flex;gap:8px;align-items:center}
.fd-preview{font-size:10px;padding:5px 9px;border:1px solid #e2d8c3;border-radius:5px;background:#faf7ef;color:#886f3c}
.fd-preview>span{height:5px;width:5px;border-radius:50%;background:#b79a61}
.fd-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:28px}
.fd-metric{border:1px solid var(--fd-line);background:#fff;border-radius:11px;padding:22px 23px;min-height:153px;box-shadow:0 2px 4px #172c2503}
.fd-metric-top{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#80908c}
.fd-metric-top h2{font-size:11px;font-weight:500;color:#667674;margin:0}
.fd-metric-top svg{color:#879995}
.fd-metric-value{font-size:35px;letter-spacing:-1.3px;line-height:1;font-weight:500;margin:22px 0 13px;font-variant-numeric:tabular-nums}
.fd-metric-note{font-size:10px;color:var(--fd-muted);margin:0;line-height:1.5}
.fd-featured{background:var(--fd-green);border-color:var(--fd-green);color:white}
.fd-featured .fd-metric-top h2,.fd-featured .fd-metric-top svg{color:#ceded6}
.fd-featured .fd-metric-value{margin-top:19px;margin-bottom:12px}
.fd-featured .fd-metric-note{color:#bdcfc7}
.fd-progress{height:3px;background:#ffffff24;border-radius:4px;margin-bottom:11px;overflow:hidden}
.fd-progress span{display:block;height:100%;background:#d4bd88;border-radius:4px}
.fd-columns{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;align-items:start}
.fd-primary-column,.fd-secondary-column{display:grid;gap:20px;min-width:0}
.fd-panel{background:white;border:1px solid var(--fd-line);border-radius:12px;overflow:hidden}
.fd-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:23px 24px 19px}
.fd-panel-heading h2{font-size:15px;letter-spacing:-.3px;font-weight:600;line-height:1.4;margin:0}
.fd-panel-heading p{font-size:11px;color:var(--fd-muted);line-height:1.6;margin:6px 0 0}
.fd-panel-heading>svg{color:#8d9d95}
.fd-text-link{display:inline-flex;align-items:center;gap:6px;color:var(--fd-green);font-size:10px;font-weight:600;white-space:nowrap;background:none;border:0;padding:0}
.fd-text-link:hover{text-decoration:underline}
.fd-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 24px 20px}
.fd-segments{display:flex;gap:3px;background:#f2f4f1;padding:4px;border-radius:7px}
.fd-segments button{display:flex;align-items:center;gap:8px;background:transparent;border:0;border-radius:5px;padding:8px 12px;color:#788480;font-size:11px;font-weight:500;min-height:34px;white-space:nowrap}
.fd-segments button.is-selected{background:white;color:var(--fd-green);box-shadow:0 1px 4px #1e3e3010}
.fd-segments button>span{font-size:9px;padding:2px 5px;border-radius:4px;background:#e4eae4;color:#60716a;min-width:18px;text-align:center}
.fd-search{display:flex;align-items:center;gap:9px;border:1px solid #e5e9e3;border-radius:6px;padding:9px 12px;color:#97a19a;max-width:225px;width:100%;background:#fdfefd}
.fd-search:focus-within{border-color:#91a99d}
.fd-search input{min-width:0;width:100%;border:0;background:transparent;color:var(--fd-ink);font-size:11px;outline:none}
.fd-search input::placeholder{color:#8c9690}
.fd-table-scroll{overflow-x:auto}
.fd-table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
.fd-table thead{background:#f9faf7}
.fd-table th{font-weight:500;font-size:10px;color:#86928b;padding:12px 14px;border-top:1px solid #edf0e9;border-bottom:1px solid #edf0e9}
.fd-table th:first-child,.fd-table td:first-child{padding-left:24px}
.fd-table td:last-child{padding-right:22px}
.fd-table td{padding:17px 14px;border-bottom:1px solid #f0f2ed;font-size:12px}
.fd-table tbody tr:last-child td{border-bottom:0}
.fd-table tbody tr:hover{background:#fafcf8}
.fd-guest{display:flex;align-items:center;gap:11px}
.fd-avatar{width:35px;height:35px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:10px;font-weight:600;flex-shrink:0;background:#eaf0e9;color:#587557}
.fd-avatar-1{background:#f2eadd;color:#9b8051}.fd-avatar-2{background:#e9eef0;color:#67858b}
.fd-guest strong{display:block;font-size:12px;font-weight:500}
.fd-guest small{display:block;color:#8b9590;font-size:9px;margin-top:5px}
.fd-room-number{font-weight:500;font-size:12px;display:block}
.fd-room-type{color:#8b9590;font-size:9px;display:block;margin-top:5px}
.fd-time{font-size:11px;font-variant-numeric:tabular-nums}
.fd-badge{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:5px 7px;font-size:9px;font-weight:500}
.fd-badge>span{width:4px;height:4px;background:currentColor;border-radius:50%}
.fd-badge-ready{background:#edf4ed;color:#54785a}
.fd-badge-confirmed{background:#eff2f5;color:#637a8c}
.fd-badge-due{background:#fbf3e4;color:#987737}
.fd-row-action{display:flex;align-items:center;justify-content:center;min-width:32px;min-height:32px;border-radius:6px;color:#7b8c82}
.fd-row-action:hover{background:#edf3ed;color:var(--fd-green)}
.fd-table-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--fd-line);padding:15px 24px;color:#8b958f;font-size:9px}
.fd-table-footer>span:last-child{display:flex;align-items:center;gap:5px}
.fd-empty{display:flex;align-items:center;flex-direction:column;text-align:center;padding:35px 20px;color:#77867d;gap:10px}
.fd-empty h3{font-size:14px;margin:0;color:var(--fd-ink)}.fd-empty p{font-size:12px;margin:0}
.fd-quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fd-quick-action{display:flex;gap:13px;align-items:center;border:1px solid var(--fd-line);border-radius:10px;padding:19px;background:#fff;color:var(--fd-ink);transition:border-color .15s}
.fd-quick-action:hover{border-color:#a5b7ab}
.fd-action-icon{background:#f0f4ed;border:1px solid #e5ebdf;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;color:#6a8270;flex-shrink:0}
.fd-quick-action h3{font-size:11px;font-weight:600;margin:0}.fd-quick-action p{font-size:9px;color:#849088;margin:6px 0 0;line-height:1.5}
.fd-quick-action>svg{margin-left:auto;color:#86998a}
.fd-check-count{background:#f1f5ec;color:#6b8160;padding:5px 8px;border-radius:5px;font-size:10px;font-weight:500}
.fd-check-items{padding:0 24px 8px}
.fd-check-item{display:flex;align-items:center;gap:11px;padding:10px 0;font-size:11px;color:#66766c;cursor:pointer}
.fd-check-item input{width:16px;height:16px;accent-color:var(--fd-green);cursor:pointer;margin:0;flex-shrink:0}
.fd-check-item.is-complete span{text-decoration:line-through;color:#a0aaa2}
.fd-check-note{font-size:9px;color:#98a29a;padding:0 24px 19px;margin:0}
.fd-room-panel .fd-panel-heading{padding-bottom:7px}
.fd-donut{width:180px;height:180px;margin:10px auto 13px;position:relative}
.fd-donut svg{display:block;width:100%;height:100%}
.fd-donut>div{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.fd-donut strong{font-size:34px;letter-spacing:-1.5px;font-weight:500}
.fd-donut strong span{font-size:18px;font-weight:400;letter-spacing:0;margin-left:2px}
.fd-donut small{font-size:10px;color:#88958b;margin-top:3px}
.fd-room-legend{display:flex;gap:15px;justify-content:center;color:#849087;font-size:9px;margin-bottom:22px}
.fd-room-legend span{display:flex;gap:5px;align-items:center}
.fd-room-legend i{width:6px;height:6px;border-radius:50%}
.fd-occupied-dot{background:#224846}.fd-available-dot{background:#e4ede7}
.fd-room-availability{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--fd-line);padding:17px 23px;background:#fcfdf9}
.fd-room-availability>div{display:flex;align-items:center;gap:10px}
.fd-room-availability strong{font-size:24px;font-weight:500;letter-spacing:-.6px}
.fd-room-availability span{font-size:10px;color:#7d8d7f}
.fd-services .fd-panel-heading{padding-bottom:15px}
.fd-service-preview{margin:0 18px 18px;padding:22px 12px 20px;background:#f5f6ee;border:1px solid #eceedd;border-radius:8px;text-align:center}
.fd-service-illustration{display:flex;margin:0 auto 12px;width:53px;height:53px;align-items:center;justify-content:center;border-radius:50%;background:#ececdb;color:#9b9461}
.fd-service-preview h3{font-family:Georgia,serif;font-weight:400;font-size:17px;color:#555c42;letter-spacing:-.3px;margin:0 0 9px}
.fd-service-preview p{font-size:10px;color:#8c927d;line-height:1.8;margin:0}
.fd-service-link{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--fd-line);padding:16px 23px;font-size:10px;font-weight:500;color:var(--fd-green)}
.fd-service-link:hover{background:#f9fbf6}
.fd-management{padding:20px 23px}
.fd-management h2{font-size:12px;font-weight:600;margin:0 0 10px}
.fd-management a{display:flex;align-items:center;gap:10px;color:#75867a;font-size:11px;padding:11px 0}.fd-management a>svg:last-child{margin-left:auto}
.fd-management a:hover{color:var(--fd-green)}
.fd-footer{display:flex;justify-content:space-between;gap:20px;margin-top:27px;font-size:9px;color:#98a198;line-height:1.6}
@media(min-width:1700px){.fd-dashboard{padding-top:48px}.fd-columns{grid-template-columns:minmax(0,1fr) 330px}}
@media(max-width:1100px){.fd-columns{grid-template-columns:minmax(0,1fr) 265px;gap:18px}.fd-toolbar{align-items:flex-start;flex-wrap:wrap}.fd-search{max-width:none;flex-basis:100%}.fd-metric{padding:19px}.fd-quick-actions{grid-template-columns:1fr}.fd-table th,.fd-table td{padding-left:10px;padding-right:10px}}
@media(max-width:850px){.fd-columns{grid-template-columns:1fr}.fd-secondary-column{grid-template-columns:1fr 1fr}.fd-metrics{grid-template-columns:1fr 1fr}.fd-quick-actions{grid-template-columns:1fr 1fr}.fd-management{grid-column:1/-1}.fd-toolbar{flex-direction:row;align-items:center}.fd-search{flex-basis:auto;max-width:225px}}
@media(max-width:560px){.fd-dashboard{padding:25px 16px 20px}.fd-heading{align-items:flex-start;flex-direction:column;gap:20px;margin-bottom:25px}.fd-heading h1{font-size:30px;max-width:290px}.fd-button{font-size:11px;padding:11px 15px}.fd-caption{align-items:flex-start;flex-wrap:wrap;gap:10px}.fd-metrics{gap:10px;margin-bottom:20px}.fd-metric{padding:15px;min-height:142px}.fd-metric-top h2{font-size:10px}.fd-metric-top svg{width:16px}.fd-metric-value{font-size:30px}.fd-metric-note{font-size:9px}.fd-panel-heading{padding:19px 17px;align-items:flex-start}.fd-panel-heading h2{font-size:14px}.fd-panel-heading p{font-size:10px}.fd-panel-heading .fd-text-link{font-size:0;gap:0;min-width:25px;min-height:25px}.fd-toolbar{padding:0 17px 17px;flex-direction:column;align-items:stretch;gap:12px}.fd-segments{align-self:flex-start}.fd-search{max-width:none}.fd-table{min-width:560px}.fd-table th:first-child,.fd-table td:first-child{padding-left:17px}.fd-table-footer{padding:13px 17px;font-size:8px}.fd-quick-actions,.fd-secondary-column{grid-template-columns:1fr}.fd-quick-action{padding:18px}.fd-quick-action h3{font-size:12px}.fd-check-items{padding:0 17px 8px}.fd-check-note{padding-left:17px;padding-right:17px}.fd-check-item{font-size:11px}.fd-footer{flex-direction:column;gap:4px}.fd-service-preview{padding:25px}.fd-room-availability{padding:19px 24px}}
@media(prefers-reduced-motion:reduce){.fd-dashboard *{transition:none!important}}
`;
