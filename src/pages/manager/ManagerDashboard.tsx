import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';

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

const roomTypes = [
  { name: 'Deluxe king', rooms: 40, occupied: 32, available: 6, maintenance: 2 },
  { name: 'Superior twin', rooms: 40, occupied: 28, available: 9, maintenance: 3 },
  { name: 'Executive suite', rooms: 20, occupied: 15, available: 3, maintenance: 2 },
];
const checklist = [
  'Review arrivals and room readiness',
  'Confirm staffing with department leads',
  'Review revenue and outstanding balances',
];
const shortcuts = [
  {
    title: 'Staff management',
    note: 'Review your team and department coverage.',
    to: '/manager/staff',
    icon: 'users' as const,
  },
  {
    title: 'Hotel analytics',
    note: 'Review occupancy and hotel performance.',
    to: '/manager/analytics',
    icon: 'chart' as const,
  },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<number[]>([]);
  const totalRooms = roomTypes.reduce((total, room) => total + room.rooms, 0);
  const occupiedRooms = roomTypes.reduce((total, room) => total + room.occupied, 0);
  const availableRooms = roomTypes.reduce((total, room) => total + room.available, 0);
  const maintenanceRooms = roomTypes.reduce((total, room) => total + room.maintenance, 0);
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
  const filtered = roomTypes.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const metrics: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    featured?: boolean;
  }[] = [
    { label: 'Today’s revenue', value: '950K', note: 'LKR · sample daily revenue', icon: 'chart' },
    {
      label: 'Expected arrivals',
      value: '06',
      note: '4 departures scheduled today',
      icon: 'calendar',
    },
    {
      label: 'Available rooms',
      value: String(availableRooms),
      note: `${maintenanceRooms} rooms under maintenance`,
      icon: 'bed',
    },
    {
      label: 'Property occupancy',
      value: `${occupancyRate}%`,
      note: `${occupiedRooms} of ${totalRooms} sample rooms occupied`,
      icon: 'chart',
      featured: true,
    },
  ];
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Colombo',
  }).format(new Date());
  const firstName = user?.name?.split(' ')[0] || 'team';
  return (
    <main className="md-dashboard">
      <style>{dashboardStyles}</style>
      <div className="md-heading">
        <div>
          <p className="md-eyebrow">MANAGER · DAILY OVERVIEW</p>
          <h1>A great day starts with a clear view.</h1>
          <p className="md-description">
            Welcome back, {firstName}. Here’s your property at a glance.
          </p>
        </div>
        <Link to="/manager/reports" className="md-button">
          <Icon name="chart" size={18} />
          Revenue reports
        </Link>
      </div>
      <div className="md-caption">
        <span>
          <Icon name="calendar" size={15} />
          {date}
        </span>
        <span className="md-preview">
          <span />
          Sample data · not connected to live hotel records
        </span>
      </div>
      <section className="md-metrics" aria-label="Hotel summary">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`md-metric ${metric.featured ? 'md-featured' : ''}`}
          >
            <div className="md-metric-top">
              <h2>{metric.label}</h2>
              <Icon name={metric.icon} size={20} />
            </div>
            <p className="md-metric-value">{metric.value}</p>
            {metric.featured && (
              <div className="md-progress" aria-hidden="true">
                <span style={{ width: `${occupancyRate}%` }} />
              </div>
            )}
            <p className="md-metric-note">{metric.note}</p>
          </article>
        ))}
      </section>
      <div className="md-columns">
        <div className="md-primary-column">
          <section className="md-panel" aria-labelledby="md-overview-heading">
            <div className="md-panel-heading">
              <div>
                <h2 id="md-overview-heading">Room overview</h2>
                <p>Room availability and maintenance, in one place.</p>
              </div>
              <Link to="/frontdesk/reservations" className="md-text-link">
                Reservations
                <Icon name="arrowUp" size={15} />
              </Link>
            </div>
            <div className="md-toolbar">
              <span className="md-description">100 sample rooms</span>
              <label className="md-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search room types"
                  aria-label="Search room types"
                />
              </label>
            </div>
            <div className="md-table-scroll">
              <table className="md-table">
                <caption className="md-sr-only">Sample room availability</caption>
                <thead>
                  <tr>
                    <th scope="col">Room type</th>
                    <th scope="col">Total</th>
                    <th scope="col">Occupied</th>
                    <th scope="col">Available</th>
                    <th scope="col">Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((room, index) => (
                    <tr key={room.name}>
                      <td>
                        <div className="md-guest">
                          <span className={`md-avatar md-avatar-${index % 3}`}>
                            <Icon name="bed" size={18} />
                          </span>
                          <div>
                            <strong>{room.name}</strong>
                            <small>Sample property</small>
                          </div>
                        </div>
                      </td>
                      <td>{room.rooms}</td>
                      <td>{room.occupied}</td>
                      <td>
                        <span className="md-badge md-badge-ready">{room.available}</span>
                      </td>
                      <td>
                        <span className="md-badge md-badge-due">{room.maintenance}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="md-empty" role="status">
                <Icon name="search" size={24} />
                <h3>No matching results</h3>
                <p>Try a different search term.</p>
              </div>
            )}
            <div className="md-table-footer">
              <span>
                {filtered.length} of {roomTypes.length} room types
              </span>
              <span>
                <Icon name="clock" size={13} />
                Sri Lanka time
              </span>
            </div>
          </section>
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
          <section className="md-panel md-checklist" aria-labelledby="md-checklist-heading">
            <div className="md-panel-heading">
              <div>
                <h2 id="md-checklist-heading">Your daily checklist</h2>
                <p>A few priorities to keep the day on track.</p>
              </div>
              <span className="md-check-count">
                {completed.length} / {checklist.length}
              </span>
            </div>
            <div className="md-check-items">
              {checklist.map((item, index) => (
                <label
                  key={item}
                  className={`md-check-item ${completed.includes(index) ? 'is-complete' : ''}`}
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
            <p className="md-check-note">Personal checklist · resets when you leave this page</p>
          </section>
        </div>
        <aside className="md-secondary-column" aria-label="Occupancy and workspace overview">
          <section className="md-panel md-room-panel" aria-labelledby="md-occupancy-heading">
            <div className="md-panel-heading">
              <div>
                <h2 id="md-occupancy-heading">Property pulse</h2>
                <p>A snapshot of the sample property.</p>
              </div>
              <Icon name="bed" size={20} />
            </div>
            <div className="md-donut">
              <svg
                viewBox="0 0 180 180"
                role="img"
                aria-label={`Sample occupancy: ${occupancyRate} percent`}
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
            <div className="md-room-legend">
              <span>
                <i className="md-occupied-dot" />
                Occupied
              </span>
              <span>
                <i className="md-available-dot" />
                Remaining capacity
              </span>
            </div>
            <div className="md-room-availability">
              <div>
                <strong>{occupiedRooms}</strong>
                <span>of {totalRooms} sample rooms occupied</span>
              </div>
            </div>
          </section>
          <section className="md-panel md-management" aria-labelledby="md-team-heading">
            <h2 id="md-team-heading">Today’s team coverage</h2>
            <p className="md-description">Sample staff on duty by department.</p>
            <dl className="md-team-list">
              {[
                ['Front desk', 4],
                ['Housekeeping', 8],
                ['Guest services', 6],
              ].map(([department, count]) => (
                <div key={department}>
                  <dt>{department}</dt>
                  <dd>{count} on duty</dd>
                </div>
              ))}
            </dl>
            <Link to="/manager/staff">
              <Icon name="users" size={17} />
              <span>Review staff</span>
              <Icon name="arrowUp" size={15} />
            </Link>
          </section>
          <section className="md-panel md-management" aria-label="Workspace shortcuts">
            <h2>Workspace shortcuts</h2>
            <Link to="/frontdesk/dashboard">
              <Icon name="door" size={17} />
              <span>Front desk workspace</span>
              <Icon name="arrowUp" size={15} />
            </Link>
            <Link to="/frontdesk/service-requests">
              <Icon name="bell" size={17} />
              <span>Guest service requests</span>
              <Icon name="arrowUp" size={15} />
            </Link>
            <Link to="/manager/reports">
              <Icon name="chart" size={17} />
              <span>Revenue reports</span>
              <Icon name="arrowUp" size={15} />
            </Link>
          </section>
        </aside>
      </div>
      <footer className="md-footer">
        <span>SkyNest Hotels · Thoughtful hospitality, every day.</span>
        <span>Manager workspace</span>
      </footer>
    </main>
  );
}

const dashboardStyles = `
.md-dashboard{--md-ink:#192f33;--md-muted:#737f80;--md-line:#e6eae6;--md-green:#224846;--md-gold:#b79a61;box-sizing:border-box;background:#f6f7f3;color:var(--md-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:calc(100vh - 74px);padding:38px clamp(20px,4vw,64px) 24px}
.md-dashboard *, .md-dashboard *::before,.md-dashboard *::after{box-sizing:border-box}
.md-dashboard svg{flex-shrink:0}
.md-dashboard a{text-decoration:none}
.md-dashboard button,.md-dashboard input{font:inherit}
.md-dashboard button,.md-dashboard a,.md-dashboard input{outline-offset:4px}
.md-dashboard :focus-visible{outline:2px solid #987b3f}
.md-dashboard button{cursor:pointer}
.md-heading,.md-caption,.md-metrics,.md-columns,.md-footer{max-width:1390px;margin-left:auto;margin-right:auto}
.md-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px}
.md-eyebrow{margin:0 0 12px;color:#8d7853;font-size:12px;font-weight:700;letter-spacing:2px}
.md-heading h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;letter-spacing:-1.1px;font-size:clamp(28px,3vw,40px);line-height:1.2;margin:0}
.md-description{margin:12px 0 0;color:var(--md-muted);font-size:13px;line-height:1.7}
.md-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--md-green);color:white;white-space:nowrap;border-radius:8px;padding:13px 18px;font-size:14px;font-weight:600;box-shadow:0 4px 10px #22484615;transition:background .15s,transform .15s}
.md-button:hover{background:#163734;transform:translateY(-1px)}
.md-caption{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px;color:#637273;font-size:13px}
.md-caption>span{display:flex;gap:8px;align-items:center}
.md-preview{font-size:12px;padding:5px 9px;border:1px solid #e2d8c3;border-radius:5px;background:#faf7ef;color:#886f3c}
.md-preview>span{height:5px;width:5px;border-radius:50%;background:#b79a61}
.md-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:28px}
.md-metric{border:1px solid var(--md-line);background:#fff;border-radius:11px;padding:22px 23px;min-height:153px;box-shadow:0 2px 4px #172c2503}
.md-metric-top{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#80908c}
.md-metric-top h2{font-size:13px;font-weight:500;color:#667674;margin:0}
.md-metric-top svg{color:#879995}
.md-metric-value{font-size:35px;letter-spacing:-1.3px;line-height:1;font-weight:500;margin:22px 0 13px;font-variant-numeric:tabular-nums}
.md-metric-note{font-size:12px;color:var(--md-muted);margin:0;line-height:1.5}
.md-featured{background:var(--md-green);border-color:var(--md-green);color:white}
.md-featured .md-metric-top h2,.md-featured .md-metric-top svg{color:#ceded6}
.md-featured .md-metric-value{margin-top:19px;margin-bottom:12px}
.md-featured .md-metric-note{color:#bdcfc7}
.md-progress{height:3px;background:#ffffff24;border-radius:4px;margin-bottom:11px;overflow:hidden}
.md-progress span{display:block;height:100%;background:#d4bd88;border-radius:4px}
.md-columns{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;align-items:start}
.md-primary-column,.md-secondary-column{display:grid;gap:20px;min-width:0}
.md-panel{background:white;border:1px solid var(--md-line);border-radius:12px;overflow:hidden}
.md-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:23px 24px 19px}
.md-panel-heading h2{font-size:15px;letter-spacing:-.3px;font-weight:600;line-height:1.4;margin:0}
.md-panel-heading p{font-size:13px;color:var(--md-muted);line-height:1.6;margin:6px 0 0}
.md-panel-heading>svg{color:#8d9d95}
.md-text-link{display:inline-flex;align-items:center;gap:6px;color:var(--md-green);font-size:12px;font-weight:600;white-space:nowrap;background:none;border:0;padding:0}
.md-text-link:hover{text-decoration:underline}
.md-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 24px 20px}
.md-segments{display:flex;gap:3px;background:#f2f4f1;padding:4px;border-radius:7px}
.md-segments button{display:flex;align-items:center;gap:8px;background:transparent;border:0;border-radius:5px;padding:8px 12px;color:#788480;font-size:13px;font-weight:500;min-height:34px;white-space:nowrap}
.md-segments button.is-selected{background:white;color:var(--md-green);box-shadow:0 1px 4px #1e3e3010}
.md-segments button>span{font-size:11px;padding:2px 5px;border-radius:4px;background:#e4eae4;color:#60716a;min-width:18px;text-align:center}
.md-search{display:flex;align-items:center;gap:9px;border:1px solid #e5e9e3;border-radius:6px;padding:9px 12px;color:#97a19a;max-width:225px;width:100%;background:#fdfefd}
.md-search:focus-within{border-color:#91a99d}
.md-search input{min-width:0;width:100%;border:0;background:transparent;color:var(--md-ink);font-size:13px;outline:none}
.md-search input::placeholder{color:#8c9690}
.md-table-scroll{overflow-x:auto}
.md-table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
.md-table thead{background:#f9faf7}
.md-table th{font-weight:500;font-size:12px;color:#86928b;padding:12px 14px;border-top:1px solid #edf0e9;border-bottom:1px solid #edf0e9}
.md-table th:first-child,.md-table td:first-child{padding-left:24px}
.md-table td:last-child{padding-right:22px}
.md-table td{padding:17px 14px;border-bottom:1px solid #f0f2ed;font-size:14px}
.md-table tbody tr:last-child td{border-bottom:0}
.md-table tbody tr:hover{background:#fafcf8}
.md-guest{display:flex;align-items:center;gap:11px}
.md-avatar{width:35px;height:35px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:600;flex-shrink:0;background:#eaf0e9;color:#587557}
.md-avatar-1{background:#f2eadd;color:#9b8051}.md-avatar-2{background:#e9eef0;color:#67858b}
.md-guest strong{display:block;font-size:14px;font-weight:500}
.md-guest small{display:block;color:#8b9590;font-size:11px;margin-top:5px}
.md-room-number{font-weight:500;font-size:14px;display:block}
.md-room-type{color:#8b9590;font-size:11px;display:block;margin-top:5px}
.md-time{font-size:13px;font-variant-numeric:tabular-nums}
.md-badge{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:5px 7px;font-size:11px;font-weight:500}
.md-badge>span{width:4px;height:4px;background:currentColor;border-radius:50%}
.md-badge-ready{background:#edf4ed;color:#54785a}
.md-badge-confirmed{background:#eff2f5;color:#637a8c}
.md-badge-due{background:#fbf3e4;color:#987737}
.md-row-action{display:flex;align-items:center;justify-content:center;min-width:32px;min-height:32px;border-radius:6px;color:#7b8c82}
.md-row-action:hover{background:#edf3ed;color:var(--md-green)}
.md-table-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--md-line);padding:15px 24px;color:#8b958f;font-size:11px}
.md-table-footer>span:last-child{display:flex;align-items:center;gap:5px}
.md-empty{display:flex;align-items:center;flex-direction:column;text-align:center;padding:35px 20px;color:#77867d;gap:10px}
.md-empty h3{font-size:14px;margin:0;color:var(--md-ink)}.md-empty p{font-size:14px;margin:0}
.md-quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.md-quick-action{display:flex;gap:13px;align-items:center;border:1px solid var(--md-line);border-radius:10px;padding:19px;background:#fff;color:var(--md-ink);transition:border-color .15s}
.md-quick-action:hover{border-color:#a5b7ab}
.md-action-icon{background:#f0f4ed;border:1px solid #e5ebdf;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;color:#6a8270;flex-shrink:0}
.md-quick-action h3{font-size:13px;font-weight:600;margin:0}.md-quick-action p{font-size:11px;color:#849088;margin:6px 0 0;line-height:1.5}
.md-quick-action>svg{margin-left:auto;color:#86998a}
.md-check-count{background:#f1f5ec;color:#6b8160;padding:5px 8px;border-radius:5px;font-size:12px;font-weight:500}
.md-check-items{padding:0 24px 8px}
.md-check-item{display:flex;align-items:center;gap:11px;padding:10px 0;font-size:13px;color:#66766c;cursor:pointer}
.md-check-item input{width:16px;height:16px;accent-color:var(--md-green);cursor:pointer;margin:0;flex-shrink:0}
.md-check-item.is-complete span{text-decoration:line-through;color:#a0aaa2}
.md-check-note{font-size:11px;color:#98a29a;padding:0 24px 19px;margin:0}
.md-room-panel .md-panel-heading{padding-bottom:7px}
.md-donut{width:180px;height:180px;margin:10px auto 13px;position:relative}
.md-donut svg{display:block;width:100%;height:100%}
.md-donut>div{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.md-donut strong{font-size:34px;letter-spacing:-1.5px;font-weight:500}
.md-donut strong span{font-size:18px;font-weight:400;letter-spacing:0;margin-left:2px}
.md-donut small{font-size:12px;color:#88958b;margin-top:3px}
.md-room-legend{display:flex;gap:15px;justify-content:center;color:#849087;font-size:11px;margin-bottom:22px}
.md-room-legend span{display:flex;gap:5px;align-items:center}
.md-room-legend i{width:6px;height:6px;border-radius:50%}
.md-occupied-dot{background:#224846}.md-available-dot{background:#e4ede7}
.md-room-availability{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--md-line);padding:17px 23px;background:#fcfdf9}
.md-room-availability>div{display:flex;align-items:center;gap:10px}
.md-room-availability strong{font-size:24px;font-weight:500;letter-spacing:-.6px}
.md-room-availability span{font-size:12px;color:#7d8d7f}
.md-services .md-panel-heading{padding-bottom:15px}
.md-service-preview{margin:0 18px 18px;padding:22px 12px 20px;background:#f5f6ee;border:1px solid #eceedd;border-radius:8px;text-align:center}
.md-service-illustration{display:flex;margin:0 auto 12px;width:53px;height:53px;align-items:center;justify-content:center;border-radius:50%;background:#ececdb;color:#9b9461}
.md-service-preview h3{font-family:Georgia,serif;font-weight:400;font-size:17px;color:#555c42;letter-spacing:-.3px;margin:0 0 9px}
.md-service-preview p{font-size:12px;color:#8c927d;line-height:1.8;margin:0}
.md-service-link{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--md-line);padding:16px 23px;font-size:12px;font-weight:500;color:var(--md-green)}
.md-service-link:hover{background:#f9fbf6}
.md-management{padding:20px 23px}
.md-management h2{font-size:14px;font-weight:600;margin:0 0 10px}
.md-management a{display:flex;align-items:center;gap:10px;color:#75867a;font-size:13px;padding:11px 0}.md-management a>svg:last-child{margin-left:auto}
.md-management a:hover{color:var(--md-green)}
.md-footer{display:flex;justify-content:space-between;gap:20px;margin-top:27px;font-size:11px;color:#98a198;line-height:1.6}
@media(min-width:1700px){.md-dashboard{padding-top:48px}.md-columns{grid-template-columns:minmax(0,1fr) 330px}}
@media(max-width:1100px){.md-columns{grid-template-columns:minmax(0,1fr) 265px;gap:18px}.md-toolbar{align-items:flex-start;flex-wrap:wrap}.md-search{max-width:none;flex-basis:100%}.md-metric{padding:19px}.md-quick-actions{grid-template-columns:1fr}.md-table th,.md-table td{padding-left:10px;padding-right:10px}}
@media(max-width:850px){.md-columns{grid-template-columns:1fr}.md-secondary-column{grid-template-columns:1fr 1fr}.md-metrics{grid-template-columns:1fr 1fr}.md-quick-actions{grid-template-columns:1fr 1fr}.md-management{grid-column:1/-1}.md-toolbar{flex-direction:row;align-items:center}.md-search{flex-basis:auto;max-width:225px}}
@media(max-width:560px){.md-dashboard{padding:25px 16px 20px}.md-heading{align-items:flex-start;flex-direction:column;gap:20px;margin-bottom:25px}.md-heading h1{font-size:30px;max-width:290px}.md-button{font-size:13px;padding:11px 15px}.md-caption{align-items:flex-start;flex-wrap:wrap;gap:10px}.md-metrics{gap:10px;margin-bottom:20px}.md-metric{padding:15px;min-height:142px}.md-metric-top h2{font-size:12px}.md-metric-top svg{width:16px}.md-metric-value{font-size:30px}.md-metric-note{font-size:11px}.md-panel-heading{padding:19px 17px;align-items:flex-start}.md-panel-heading h2{font-size:14px}.md-panel-heading p{font-size:12px}.md-panel-heading .md-text-link{font-size:0;gap:0;min-width:25px;min-height:25px}.md-toolbar{padding:0 17px 17px;flex-direction:column;align-items:stretch;gap:12px}.md-segments{align-self:flex-start}.md-search{max-width:none}.md-table{min-width:560px}.md-table th:first-child,.md-table td:first-child{padding-left:17px}.md-table-footer{padding:13px 17px;font-size:8px}.md-quick-actions,.md-secondary-column{grid-template-columns:1fr}.md-quick-action{padding:18px}.md-quick-action h3{font-size:14px}.md-check-items{padding:0 17px 8px}.md-check-note{padding-left:17px;padding-right:17px}.md-check-item{font-size:13px}.md-footer{flex-direction:column;gap:4px}.md-service-preview{padding:25px}.md-room-availability{padding:19px 24px}}
@media(prefers-reduced-motion:reduce){.md-dashboard *{transition:none!important}}
.md-dashboard{color-scheme:light}
.md-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.md-team-list{margin:14px 0 0}.md-team-list>div{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--md-line);font-size:13px}.md-team-list dt{color:var(--md-muted)}.md-team-list dd{margin:0;font-weight:500}
`;
