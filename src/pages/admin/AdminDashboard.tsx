import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { FrontDeskIcon as Icon, type IconName } from '../../components/FrontDeskIcon';
import './AdminDashboard.css';

const workspaces: {
  title: string;
  description: string;
  to: string;
  icon: IconName;
  label: string;
}[] = [
  {
    title: 'Reports & insights',
    description: 'Explore revenue, occupancy, and the details behind your hotel’s performance.',
    to: '/admin/reports',
    icon: 'chart',
    label: 'View reports',
  },
  {
    title: 'User management',
    description: 'A dedicated space for your people, their roles, and access to SkyNest.',
    to: '/admin/users',
    icon: 'users',
    label: 'Open user management',
  },
  {
    title: 'System settings',
    description: 'Your property’s foundation. Branches, room inventory, and hotel configuration.',
    to: '/admin/settings',
    icon: 'bed',
    label: 'Open settings',
  },
];
const shortcuts: { title: string; detail: string; to: string; icon: IconName }[] = [
  {
    title: 'New reservation',
    detail: 'Make room for your next guest',
    to: '/frontdesk/reservations/new',
    icon: 'plus',
  },
  {
    title: 'Reservations',
    detail: 'Find a booking and review its details',
    to: '/frontdesk/reservations',
    icon: 'calendar',
  },
  {
    title: 'Check-in & check-out',
    detail: 'Keep arrivals and departures moving',
    to: '/frontdesk/check-in-out',
    icon: 'door',
  },
  {
    title: 'Guest services',
    detail: 'Follow up on guest requests',
    to: '/frontdesk/service-requests',
    icon: 'bell',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Admin';
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Colombo',
  }).format(new Date());

  return (
    <main className="ad-dashboard">
      <div className="ad-container">
        <header className="ad-heading">
          <div>
            <p className="ad-eyebrow">SKYNEST / ADMINISTRATION</p>
            <h1>Welcome back, {firstName}.</h1>
            <p>A clear view. A well-run hotel. It starts here.</p>
          </div>
          <div className="ad-date">
            <Icon name="calendar" size={17} />
            <span>{date}</span>
          </div>
        </header>

        <section className="ad-hero" aria-labelledby="ad-operations-title">
          <div className="ad-hero-copy">
            <span className="ad-tag">
              <span /> YOUR HOTEL, CONNECTED
            </span>
            <h2 id="ad-operations-title">
              Behind every great stay,
              <br />a great team.
            </h2>
            <p>
              Bring the day together. Manage reservations, welcome your guests, and keep every
              detail of hotel life in view.
            </p>
            <Link to="/frontdesk/dashboard" className="ad-primary-link">
              Hotel Operations <Icon name="arrow" size={18} />
            </Link>
            <div className="ad-hero-note">
              <Icon name="bed" size={16} /> Front desk · Reservations · Guest services
            </div>
          </div>
          <div className="ad-architecture" aria-hidden="true">
            <div className="ad-orbit ad-orbit-one" />
            <div className="ad-orbit ad-orbit-two" />
            <div className="ad-building">
              <div className="ad-building-crown">S N</div>
              <div className="ad-building-windows">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
              <div className="ad-building-door" />
            </div>
            <div className="ad-architecture-caption">
              SKYNEST HOTELS<span>Thoughtful hospitality, every day.</span>
            </div>
          </div>
        </section>

        <section className="ad-workspaces" aria-labelledby="ad-workspaces-title">
          <div className="ad-section-heading">
            <h2 id="ad-workspaces-title">Your workspace</h2>
            <span>The essentials, all in one place</span>
          </div>
          <div className="ad-card-grid">
            {workspaces.map((workspace, index) => (
              <Link
                to={workspace.to}
                className={`ad-workspace-card ad-card-${index}`}
                key={workspace.to}
              >
                <div className="ad-card-top">
                  <span className="ad-icon">
                    <Icon name={workspace.icon} size={22} />
                  </span>
                  <span className="ad-card-number">0{index + 1}</span>
                </div>
                <h3>{workspace.title}</h3>
                <p>{workspace.description}</p>
                <span className="ad-card-link">
                  {workspace.label}
                  <Icon name="arrowUp" size={17} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="ad-bottom-grid">
          <section className="ad-shortcuts" aria-labelledby="ad-shortcuts-title">
            <div className="ad-section-heading">
              <h2 id="ad-shortcuts-title">A head start on your day</h2>
              <span>QUICK ACCESS</span>
            </div>
            <div className="ad-shortcut-grid">
              {shortcuts.map((shortcut) => (
                <Link to={shortcut.to} className="ad-shortcut" key={shortcut.to}>
                  <span className="ad-shortcut-icon">
                    <Icon name={shortcut.icon} size={19} />
                  </span>
                  <span>
                    <strong>{shortcut.title}</strong>
                    <small>{shortcut.detail}</small>
                  </span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
            </div>
          </section>
          <section className="ad-account" aria-labelledby="ad-account-title">
            <span className="ad-account-label">
              <Icon name="shield" size={16} /> ADMINISTRATOR ACCESS
            </span>
            <h2 id="ad-account-title">Your account, protected.</h2>
            <p>Manage your password and account security from one place.</p>
            {user?.email && <span className="ad-account-email">{user.email}</span>}
            <Link to="/account">
              Account security
              <Icon name="arrowUp" size={16} />
            </Link>
          </section>
        </div>
        <footer className="ad-footer">
          <span>
            <strong>SkyNest</strong> Hotels
          </span>
          <span>Administration workspace</span>
        </footer>
      </div>
    </main>
  );
}
