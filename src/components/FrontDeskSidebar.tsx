import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { FrontDeskIcon as Icon } from './FrontDeskIcon';
import '../pages/frontdesk/FrontDeskDashboard.css';

const navClassName = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-current' : undefined);

export function FrontDeskSidebar() {
  const { user } = useAuth();

  return (
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
        {user?.role === 'admin' && (
          <NavLink to="/admin/dashboard" className={navClassName}>
            <Icon name="shield" size={17} />
            Admin dashboard
          </NavLink>
        )}
        <NavLink to="/frontdesk/dashboard" end className={navClassName}>
          <Icon name="chart" size={17} />
          Overview
        </NavLink>
        <NavLink to="/frontdesk/reservations" className={navClassName}>
          <Icon name="calendar" size={17} />
          Reservations
        </NavLink>
        <NavLink to="/frontdesk/check-in-out" className={navClassName}>
          <Icon name="door" size={17} />
          Check-in & out
        </NavLink>
        <NavLink to="/frontdesk/service-requests" className={navClassName}>
          <Icon name="bell" size={17} />
          Guest services
        </NavLink>
        <NavLink to="/frontdesk/service-catalogue" className={navClassName}>
          <Icon name="bed" size={17} />
          Service Catalogue
        </NavLink>
      </nav>
      <div className="fd-sidebar-bottom">
        <Link to="/frontdesk/reservations/new" className="fd-button">
          <Icon name="plus" size={16} />
          New booking
        </Link>
        <NavLink
          to="/account"
          className={({ isActive }) => `fd-sidebar-account${isActive ? ' is-current' : ''}`}
        >
          <Icon name="shield" size={16} />
          Account security
        </NavLink>
      </div>
    </aside>
  );
}
