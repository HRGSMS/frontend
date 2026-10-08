import type { FC } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
    isActive
      ? 'bg-gray-900 text-white'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;

export const NavBar: FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xs">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Mobile Brand / Quick Title */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-bold text-base text-gray-900 flex items-center gap-2">
            <span className="md:hidden">🏨</span>
            <span className="hidden sm:inline">Sky Nest Hotels</span>
          </Link>

          <nav className="flex items-center gap-1 ml-4">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/reservations/all" className={navLinkClass}>
              Reservations
            </NavLink>
            <NavLink to="/account" className={navLinkClass}>
              Account
            </NavLink>
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-gray-900">{user?.name}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-700">
              {user?.role}
            </span>
          </div>

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
          )}

          <button
            onClick={logout}
            className="text-xs font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
