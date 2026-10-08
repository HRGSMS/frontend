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

const branches = [
  { name: 'Colombo', rooms: 100, occupied: 75, staff: 42, revenue: 950000 },
  { name: 'Kandy', rooms: 60, occupied: 41, staff: 24, revenue: 620000 },
  { name: 'Galle', rooms: 50, occupied: 43, staff: 18, revenue: 770000 },
];
const checklist = [
  'Review branch performance and reports',
  'Review staff accounts and access',
  'Check hotel settings and policies',
];
const shortcuts = [
  {
    title: 'User management',
    note: 'Review staff accounts and permissions.',
    to: '/admin/users',
    icon: 'users' as const,
  },
  {
    title: 'System settings',
    note: 'Manage hotel-wide configuration.',
    to: '/admin/settings',
    icon: 'shield' as const,
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<number[]>([]);
  const totalRooms = branches.reduce((total, branch) => total + branch.rooms, 0);
  const occupiedRooms = branches.reduce((total, branch) => total + branch.occupied, 0);
  const totalStaff = branches.reduce((total, branch) => total + branch.staff, 0);
  const revenue = branches.reduce((total, branch) => total + branch.revenue, 0);
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
  const filtered = branches.filter((branch) =>
    branch.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const metrics: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    featured?: boolean;
  }[] = [
    {
      label: 'Hotel branches',
      value: String(branches.length).padStart(2, '0'),
      note: 'Across the SkyNest network',
      icon: 'bed',
    },
    {
      label: 'Staff accounts',
      value: String(totalStaff),
      note: 'Across all sample branches',
      icon: 'users',
    },
    {
      label: 'Today’s revenue',
      value: `${(revenue / 1000000).toFixed(2)}M`,
      note: 'LKR · sample daily revenue',
      icon: 'chart',
    },
    {
      label: 'Overall occupancy',
      value: `${occupancyRate}%`,
      note: `${occupiedRooms} of ${totalRooms} sample rooms occupied`,
      icon: 'bed',
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
    <main className="ad-dashboard">
      <style>{dashboardStyles}</style>
      <div className="ad-heading">
        <div>
          <p className="ad-eyebrow">ADMINISTRATION · HOTEL NETWORK</p>
          <h1>A clear view of every property.</h1>
          <p className="ad-description">
            Welcome back, {firstName}. Here’s your hotel network at a glance.
          </p>
        </div>
        <Link to="/admin/reports" className="ad-button">
          <Icon name="chart" size={18} />
          System reports
        </Link>
      </div>
      <div className="ad-caption">
        <span>
          <Icon name="calendar" size={15} />
          {date}
        </span>
        <span className="ad-preview">
          <span />
          Sample data · not connected to live hotel records
        </span>
      </div>
      <section className="ad-metrics" aria-label="Hotel summary">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`ad-metric ${metric.featured ? 'ad-featured' : ''}`}
          >
            <div className="ad-metric-top">
              <h2>{metric.label}</h2>
              <Icon name={metric.icon} size={20} />
            </div>
            <p className="ad-metric-value">{metric.value}</p>
            {metric.featured && (
              <div className="ad-progress" aria-hidden="true">
                <span style={{ width: `${occupancyRate}%` }} />
              </div>
            )}
            <p className="ad-metric-note">{metric.note}</p>
          </article>
        ))}
      </section>
      <div className="ad-columns">
        <div className="ad-primary-column">
          <section className="ad-panel" aria-labelledby="ad-overview-heading">
            <div className="ad-panel-heading">
              <div>
                <h2 id="ad-overview-heading">Branch overview</h2>
                <p>Compare today’s sample performance across properties.</p>
              </div>
              <Link to="/admin/reports" className="ad-text-link">
                View reports
                <Icon name="arrowUp" size={15} />
              </Link>
            </div>
            <div className="ad-toolbar">
              <span className="ad-description">3 sample branches</span>
              <label className="ad-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search branches"
                  aria-label="Search branches"
                />
              </label>
            </div>
            <div className="ad-table-scroll">
              <table className="ad-table">
                <caption className="ad-sr-only">Sample branch performance</caption>
                <thead>
                  <tr>
                    <th scope="col">Branch</th>
                    <th scope="col">Rooms</th>
                    <th scope="col">Occupancy</th>
                    <th scope="col">Staff</th>
                    <th scope="col">Revenue (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((branch, index) => (
                    <tr key={branch.name}>
                      <td>
                        <div className="ad-guest">
                          <span className={`ad-avatar ad-avatar-${index % 3}`}>
                            {branch.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <strong>{branch.name}</strong>
                            <small>SkyNest Hotels</small>
                          </div>
                        </div>
                      </td>
                      <td>{branch.rooms}</td>
                      <td>
                        <span className="ad-badge ad-badge-ready">
                          {Math.round((branch.occupied / branch.rooms) * 100)}%
                        </span>
                      </td>
                      <td>{branch.staff}</td>
                      <td>{branch.revenue.toLocaleString('en-LK')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="ad-empty" role="status">
                <Icon name="search" size={24} />
                <h3>No matching results</h3>
                <p>Try a different search term.</p>
              </div>
            )}
            <div className="ad-table-footer">
              <span>
                {filtered.length} of {branches.length} branches
              </span>
              <span>
                <Icon name="clock" size={13} />
                Sri Lanka time
              </span>
            </div>
          </section>
          <section className="ad-quick-actions" aria-label="Quick actions">
            {shortcuts.map((action) => (
              <Link key={action.to} to={action.to} className="ad-quick-action">
                <span className="ad-action-icon">
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
          <section className="ad-panel ad-checklist" aria-labelledby="ad-checklist-heading">
            <div className="ad-panel-heading">
              <div>
                <h2 id="ad-checklist-heading">Your daily checklist</h2>
                <p>A few priorities to keep the day on track.</p>
              </div>
              <span className="ad-check-count">
                {completed.length} / {checklist.length}
              </span>
            </div>
            <div className="ad-check-items">
              {checklist.map((item, index) => (
                <label
                  key={item}
                  className={`ad-check-item ${completed.includes(index) ? 'is-complete' : ''}`}
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
            <p className="ad-check-note">Personal checklist · resets when you leave this page</p>
          </section>
        </div>
        <aside className="ad-secondary-column" aria-label="Occupancy and workspace overview">
          <section className="ad-panel ad-room-panel" aria-labelledby="ad-occupancy-heading">
            <div className="ad-panel-heading">
              <div>
                <h2 id="ad-occupancy-heading">Network occupancy</h2>
                <p>A snapshot across all sample branches.</p>
              </div>
              <Icon name="bed" size={20} />
            </div>
            <div className="ad-donut">
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
            <div className="ad-room-legend">
              <span>
                <i className="ad-occupied-dot" />
                Occupied
              </span>
              <span>
                <i className="ad-available-dot" />
                Remaining capacity
              </span>
            </div>
            <div className="ad-room-availability">
              <div>
                <strong>{occupiedRooms}</strong>
                <span>of {totalRooms} sample rooms occupied</span>
              </div>
            </div>
          </section>
          <section className="ad-panel ad-services" aria-labelledby="ad-team-heading">
            <div className="ad-panel-heading">
              <div>
                <h2 id="ad-team-heading">Administration</h2>
                <p>The tools to keep every branch connected.</p>
              </div>
              <Icon name="shield" size={20} />
            </div>
            <div className="ad-service-preview">
              <span className="ad-service-illustration">
                <Icon name="users" size={30} />
              </span>
              <h3>The right access for every role.</h3>
              <p>
                Manage staff accounts and review permissions
                <br />
                from one central workspace.
              </p>
            </div>
            <Link to="/admin/users" className="ad-service-link">
              Open user management
              <Icon name="arrow" size={16} />
            </Link>
          </section>
          <section className="ad-panel ad-management" aria-label="Workspace shortcuts">
            <h2>Workspace shortcuts</h2>
            <Link to="/admin/reports">
              <Icon name="chart" size={17} />
              <span>System reports</span>
              <Icon name="arrowUp" size={15} />
            </Link>
            <Link to="/manager/dashboard">
              <Icon name="bed" size={17} />
              <span>Manager workspace</span>
              <Icon name="arrowUp" size={15} />
            </Link>
            <Link to="/frontdesk/dashboard">
              <Icon name="door" size={17} />
              <span>Front desk workspace</span>
              <Icon name="arrowUp" size={15} />
            </Link>
          </section>
        </aside>
      </div>
      <footer className="ad-footer">
        <span>SkyNest Hotels · Thoughtful hospitality, every day.</span>
        <span>Admin workspace</span>
      </footer>
    </main>
  );
}

const dashboardStyles = `
.ad-dashboard{--ad-ink:#192f33;--ad-muted:#737f80;--ad-line:#e6eae6;--ad-green:#224846;--ad-gold:#b79a61;box-sizing:border-box;background:#f6f7f3;color:var(--ad-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:calc(100vh - 74px);padding:38px clamp(20px,4vw,64px) 24px}
.ad-dashboard *, .ad-dashboard *::before,.ad-dashboard *::after{box-sizing:border-box}
.ad-dashboard svg{flex-shrink:0}
.ad-dashboard a{text-decoration:none}
.ad-dashboard button,.ad-dashboard input{font:inherit}
.ad-dashboard button,.ad-dashboard a,.ad-dashboard input{outline-offset:4px}
.ad-dashboard :focus-visible{outline:2px solid #987b3f}
.ad-dashboard button{cursor:pointer}
.ad-heading,.ad-caption,.ad-metrics,.ad-columns,.ad-footer{max-width:1390px;margin-left:auto;margin-right:auto}
.ad-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px}
.ad-eyebrow{margin:0 0 12px;color:#8d7853;font-size:12px;font-weight:700;letter-spacing:2px}
.ad-heading h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;letter-spacing:-1.1px;font-size:clamp(28px,3vw,40px);line-height:1.2;margin:0}
.ad-description{margin:12px 0 0;color:var(--ad-muted);font-size:13px;line-height:1.7}
.ad-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:var(--ad-green);color:white;white-space:nowrap;border-radius:8px;padding:13px 18px;font-size:14px;font-weight:600;box-shadow:0 4px 10px #22484615;transition:background .15s,transform .15s}
.ad-button:hover{background:#163734;transform:translateY(-1px)}
.ad-caption{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px;color:#637273;font-size:13px}
.ad-caption>span{display:flex;gap:8px;align-items:center}
.ad-preview{font-size:12px;padding:5px 9px;border:1px solid #e2d8c3;border-radius:5px;background:#faf7ef;color:#886f3c}
.ad-preview>span{height:5px;width:5px;border-radius:50%;background:#b79a61}
.ad-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:28px}
.ad-metric{border:1px solid var(--ad-line);background:#fff;border-radius:11px;padding:22px 23px;min-height:153px;box-shadow:0 2px 4px #172c2503}
.ad-metric-top{display:flex;justify-content:space-between;align-items:center;gap:12px;color:#80908c}
.ad-metric-top h2{font-size:13px;font-weight:500;color:#667674;margin:0}
.ad-metric-top svg{color:#879995}
.ad-metric-value{font-size:35px;letter-spacing:-1.3px;line-height:1;font-weight:500;margin:22px 0 13px;font-variant-numeric:tabular-nums}
.ad-metric-note{font-size:12px;color:var(--ad-muted);margin:0;line-height:1.5}
.ad-featured{background:var(--ad-green);border-color:var(--ad-green);color:white}
.ad-featured .ad-metric-top h2,.ad-featured .ad-metric-top svg{color:#ceded6}
.ad-featured .ad-metric-value{margin-top:19px;margin-bottom:12px}
.ad-featured .ad-metric-note{color:#bdcfc7}
.ad-progress{height:3px;background:#ffffff24;border-radius:4px;margin-bottom:11px;overflow:hidden}
.ad-progress span{display:block;height:100%;background:#d4bd88;border-radius:4px}
.ad-columns{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:24px;align-items:start}
.ad-primary-column,.ad-secondary-column{display:grid;gap:20px;min-width:0}
.ad-panel{background:white;border:1px solid var(--ad-line);border-radius:12px;overflow:hidden}
.ad-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:23px 24px 19px}
.ad-panel-heading h2{font-size:15px;letter-spacing:-.3px;font-weight:600;line-height:1.4;margin:0}
.ad-panel-heading p{font-size:13px;color:var(--ad-muted);line-height:1.6;margin:6px 0 0}
.ad-panel-heading>svg{color:#8d9d95}
.ad-text-link{display:inline-flex;align-items:center;gap:6px;color:var(--ad-green);font-size:12px;font-weight:600;white-space:nowrap;background:none;border:0;padding:0}
.ad-text-link:hover{text-decoration:underline}
.ad-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 24px 20px}
.ad-segments{display:flex;gap:3px;background:#f2f4f1;padding:4px;border-radius:7px}
.ad-segments button{display:flex;align-items:center;gap:8px;background:transparent;border:0;border-radius:5px;padding:8px 12px;color:#788480;font-size:13px;font-weight:500;min-height:34px;white-space:nowrap}
.ad-segments button.is-selected{background:white;color:var(--ad-green);box-shadow:0 1px 4px #1e3e3010}
.ad-segments button>span{font-size:11px;padding:2px 5px;border-radius:4px;background:#e4eae4;color:#60716a;min-width:18px;text-align:center}
.ad-search{display:flex;align-items:center;gap:9px;border:1px solid #e5e9e3;border-radius:6px;padding:9px 12px;color:#97a19a;max-width:225px;width:100%;background:#fdfefd}
.ad-search:focus-within{border-color:#91a99d}
.ad-search input{min-width:0;width:100%;border:0;background:transparent;color:var(--ad-ink);font-size:13px;outline:none}
.ad-search input::placeholder{color:#8c9690}
.ad-table-scroll{overflow-x:auto}
.ad-table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
.ad-table thead{background:#f9faf7}
.ad-table th{font-weight:500;font-size:12px;color:#86928b;padding:12px 14px;border-top:1px solid #edf0e9;border-bottom:1px solid #edf0e9}
.ad-table th:first-child,.ad-table td:first-child{padding-left:24px}
.ad-table td:last-child{padding-right:22px}
.ad-table td{padding:17px 14px;border-bottom:1px solid #f0f2ed;font-size:14px}
.ad-table tbody tr:last-child td{border-bottom:0}
.ad-table tbody tr:hover{background:#fafcf8}
.ad-guest{display:flex;align-items:center;gap:11px}
.ad-avatar{width:35px;height:35px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:600;flex-shrink:0;background:#eaf0e9;color:#587557}
.ad-avatar-1{background:#f2eadd;color:#9b8051}.ad-avatar-2{background:#e9eef0;color:#67858b}
.ad-guest strong{display:block;font-size:14px;font-weight:500}
.ad-guest small{display:block;color:#8b9590;font-size:11px;margin-top:5px}
.ad-room-number{font-weight:500;font-size:14px;display:block}
.ad-room-type{color:#8b9590;font-size:11px;display:block;margin-top:5px}
.ad-time{font-size:13px;font-variant-numeric:tabular-nums}
.ad-badge{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:5px 7px;font-size:11px;font-weight:500}
.ad-badge>span{width:4px;height:4px;background:currentColor;border-radius:50%}
.ad-badge-ready{background:#edf4ed;color:#54785a}
.ad-badge-confirmed{background:#eff2f5;color:#637a8c}
.ad-badge-due{background:#fbf3e4;color:#987737}
.ad-row-action{display:flex;align-items:center;justify-content:center;min-width:32px;min-height:32px;border-radius:6px;color:#7b8c82}
.ad-row-action:hover{background:#edf3ed;color:var(--ad-green)}
.ad-table-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--ad-line);padding:15px 24px;color:#8b958f;font-size:11px}
.ad-table-footer>span:last-child{display:flex;align-items:center;gap:5px}
.ad-empty{display:flex;align-items:center;flex-direction:column;text-align:center;padding:35px 20px;color:#77867d;gap:10px}
.ad-empty h3{font-size:14px;margin:0;color:var(--ad-ink)}.ad-empty p{font-size:14px;margin:0}
.ad-quick-actions{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ad-quick-action{display:flex;gap:13px;align-items:center;border:1px solid var(--ad-line);border-radius:10px;padding:19px;background:#fff;color:var(--ad-ink);transition:border-color .15s}
.ad-quick-action:hover{border-color:#a5b7ab}
.ad-action-icon{background:#f0f4ed;border:1px solid #e5ebdf;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;color:#6a8270;flex-shrink:0}
.ad-quick-action h3{font-size:13px;font-weight:600;margin:0}.ad-quick-action p{font-size:11px;color:#849088;margin:6px 0 0;line-height:1.5}
.ad-quick-action>svg{margin-left:auto;color:#86998a}
.ad-check-count{background:#f1f5ec;color:#6b8160;padding:5px 8px;border-radius:5px;font-size:12px;font-weight:500}
.ad-check-items{padding:0 24px 8px}
.ad-check-item{display:flex;align-items:center;gap:11px;padding:10px 0;font-size:13px;color:#66766c;cursor:pointer}
.ad-check-item input{width:16px;height:16px;accent-color:var(--ad-green);cursor:pointer;margin:0;flex-shrink:0}
.ad-check-item.is-complete span{text-decoration:line-through;color:#a0aaa2}
.ad-check-note{font-size:11px;color:#98a29a;padding:0 24px 19px;margin:0}
.ad-room-panel .ad-panel-heading{padding-bottom:7px}
.ad-donut{width:180px;height:180px;margin:10px auto 13px;position:relative}
.ad-donut svg{display:block;width:100%;height:100%}
.ad-donut>div{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.ad-donut strong{font-size:34px;letter-spacing:-1.5px;font-weight:500}
.ad-donut strong span{font-size:18px;font-weight:400;letter-spacing:0;margin-left:2px}
.ad-donut small{font-size:12px;color:#88958b;margin-top:3px}
.ad-room-legend{display:flex;gap:15px;justify-content:center;color:#849087;font-size:11px;margin-bottom:22px}
.ad-room-legend span{display:flex;gap:5px;align-items:center}
.ad-room-legend i{width:6px;height:6px;border-radius:50%}
.ad-occupied-dot{background:#224846}.ad-available-dot{background:#e4ede7}
.ad-room-availability{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--ad-line);padding:17px 23px;background:#fcfdf9}
.ad-room-availability>div{display:flex;align-items:center;gap:10px}
.ad-room-availability strong{font-size:24px;font-weight:500;letter-spacing:-.6px}
.ad-room-availability span{font-size:12px;color:#7d8d7f}
.ad-services .ad-panel-heading{padding-bottom:15px}
.ad-service-preview{margin:0 18px 18px;padding:22px 12px 20px;background:#f5f6ee;border:1px solid #eceedd;border-radius:8px;text-align:center}
.ad-service-illustration{display:flex;margin:0 auto 12px;width:53px;height:53px;align-items:center;justify-content:center;border-radius:50%;background:#ececdb;color:#9b9461}
.ad-service-preview h3{font-family:Georgia,serif;font-weight:400;font-size:17px;color:#555c42;letter-spacing:-.3px;margin:0 0 9px}
.ad-service-preview p{font-size:12px;color:#8c927d;line-height:1.8;margin:0}
.ad-service-link{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--ad-line);padding:16px 23px;font-size:12px;font-weight:500;color:var(--ad-green)}
.ad-service-link:hover{background:#f9fbf6}
.ad-management{padding:20px 23px}
.ad-management h2{font-size:14px;font-weight:600;margin:0 0 10px}
.ad-management a{display:flex;align-items:center;gap:10px;color:#75867a;font-size:13px;padding:11px 0}.ad-management a>svg:last-child{margin-left:auto}
.ad-management a:hover{color:var(--ad-green)}
.ad-footer{display:flex;justify-content:space-between;gap:20px;margin-top:27px;font-size:11px;color:#98a198;line-height:1.6}
@media(min-width:1700px){.ad-dashboard{padding-top:48px}.ad-columns{grid-template-columns:minmax(0,1fr) 330px}}
@media(max-width:1100px){.ad-columns{grid-template-columns:minmax(0,1fr) 265px;gap:18px}.ad-toolbar{align-items:flex-start;flex-wrap:wrap}.ad-search{max-width:none;flex-basis:100%}.ad-metric{padding:19px}.ad-quick-actions{grid-template-columns:1fr}.ad-table th,.ad-table td{padding-left:10px;padding-right:10px}}
@media(max-width:850px){.ad-columns{grid-template-columns:1fr}.ad-secondary-column{grid-template-columns:1fr 1fr}.ad-metrics{grid-template-columns:1fr 1fr}.ad-quick-actions{grid-template-columns:1fr 1fr}.ad-management{grid-column:1/-1}.ad-toolbar{flex-direction:row;align-items:center}.ad-search{flex-basis:auto;max-width:225px}}
@media(max-width:560px){.ad-dashboard{padding:25px 16px 20px}.ad-heading{align-items:flex-start;flex-direction:column;gap:20px;margin-bottom:25px}.ad-heading h1{font-size:30px;max-width:290px}.ad-button{font-size:13px;padding:11px 15px}.ad-caption{align-items:flex-start;flex-wrap:wrap;gap:10px}.ad-metrics{gap:10px;margin-bottom:20px}.ad-metric{padding:15px;min-height:142px}.ad-metric-top h2{font-size:12px}.ad-metric-top svg{width:16px}.ad-metric-value{font-size:30px}.ad-metric-note{font-size:11px}.ad-panel-heading{padding:19px 17px;align-items:flex-start}.ad-panel-heading h2{font-size:14px}.ad-panel-heading p{font-size:12px}.ad-panel-heading .ad-text-link{font-size:0;gap:0;min-width:25px;min-height:25px}.ad-toolbar{padding:0 17px 17px;flex-direction:column;align-items:stretch;gap:12px}.ad-segments{align-self:flex-start}.ad-search{max-width:none}.ad-table{min-width:560px}.ad-table th:first-child,.ad-table td:first-child{padding-left:17px}.ad-table-footer{padding:13px 17px;font-size:8px}.ad-quick-actions,.ad-secondary-column{grid-template-columns:1fr}.ad-quick-action{padding:18px}.ad-quick-action h3{font-size:14px}.ad-check-items{padding:0 17px 8px}.ad-check-note{padding-left:17px;padding-right:17px}.ad-check-item{font-size:13px}.ad-footer{flex-direction:column;gap:4px}.ad-service-preview{padding:25px}.ad-room-availability{padding:19px 24px}}
@media(prefers-reduced-motion:reduce){.ad-dashboard *{transition:none!important}}
.ad-dashboard{color-scheme:light}
.ad-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.ad-team-list{margin:14px 0 0}.ad-team-list>div{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--ad-line);font-size:13px}.ad-team-list dt{color:var(--ad-muted)}.ad-team-list dd{margin:0;font-weight:500}
`;
