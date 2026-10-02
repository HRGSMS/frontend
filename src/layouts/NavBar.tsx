import type { FC } from 'react';
import { NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
  }`;

const NavBar: FC = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
        {/* Brand */}
        <NavLink to="/dashboard" className="font-semibold text-lg text-gray-900 dark:text-white">
          SKY Nest Hotels
        </NavLink>

        {/* Primary nav links - TODO: gate by role once AuthContext is wired in */}
        <ul className="list-none flex items-center gap-1">
          <li>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/account" className={navLinkClass}>
              Account
            </NavLink>
          </li>
        </ul>

        {/* User menu placeholder - TODO: replace with avatar/dropdown + logout */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Guest User</span>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
