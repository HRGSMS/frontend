import type { FC, SVGProps } from 'react';
import {
  Archive,
  BarChartSquare02,
  CheckDone01,
  CurrencyDollarCircle,
  Grid03,
  HomeLine,
  LineChartUp03,
  LogOut01,
  MessageChatCircle,
  Package,
  PieChart03,
  Rows01,
  Settings01,
  User01,
  UsersPlus,
} from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: FC<SVGProps<SVGSVGElement>>;
  badge?: number | string;
  items?: NavItem[];
  allowedRoles?: UserRole[];
}

const navItemsSimple: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeLine,
  },
  {
    label: 'Reservations',
    href: '/reservations',
    icon: Rows01,
    allowedRoles: ['frontdesk', 'manager', 'admin'],
    items: [
      { label: 'All Reservations', href: '/reservations/all', icon: Rows01 },
      { label: 'New Reservation', href: '/reservations/new', icon: CheckDone01 },
      { label: 'Check-In / Check-Out', href: '/reservations/check-in-out', icon: Archive },
    ],
  },
  {
    label: 'Room Inventory',
    href: '/rooms',
    icon: Package,
    allowedRoles: ['frontdesk', 'manager', 'admin'],
  },
  {
    label: 'Service Requests',
    href: '/service-requests',
    icon: MessageChatCircle,
    badge: 5,
    allowedRoles: ['frontdesk', 'manager', 'admin'],
  },
  {
    label: 'Service Catalog',
    href: '/service-catalog',
    icon: CurrencyDollarCircle,
    allowedRoles: ['manager', 'admin'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChartSquare02,
    allowedRoles: ['manager', 'admin'],
    items: [
      { label: 'Occupancy', href: '/reports/occupancy', icon: PieChart03 },
      { label: 'Revenue', href: '/reports/revenue', icon: LineChartUp03 },
      { label: 'Billing Summary', href: '/reports/billing-summary', icon: CurrencyDollarCircle },
      { label: 'Service Usage', href: '/reports/service-usage', icon: Grid03 },
    ],
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: UsersPlus,
    allowedRoles: ['admin'],
  },
  {
    label: 'Billing & Invoices',
    href: '/billing',
    icon: CurrencyDollarCircle,
    allowedRoles: ['frontdesk', 'manager', 'admin'],
  },
  {
    label: 'Audit Log',
    href: '/audit-log',
    icon: Archive,
    allowedRoles: ['admin'],
  },
];

const footerItems: NavItem[] = [
  { label: 'Settings', href: '/account', icon: Settings01 },
  { label: 'My Account', href: '/account', icon: User01 },
];

interface SidebarItemProps {
  item: NavItem;
  activeUrl: string;
  nested?: boolean;
}

const SidebarItem: FC<SidebarItemProps> = ({ item, activeUrl, nested = false }) => {
  const Icon = item.icon;
  const isActive = activeUrl === item.href;

  return (
    <Link
      to={item.href}
      target={item.href.startsWith('http') ? '_blank' : undefined}
      rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
        nested ? 'pl-10' : ''
      } ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {item.badge}
        </span>
      )}
    </Link>
  );
};

export const SidebarNavigationSimpleDemo: FC = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const userRole = user?.role || 'guest';

  // Role-based filtering
  const visibleNavItems = navItemsSimple.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(userRole),
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">
        <img
          src="/favicon.svg"
          alt="Sky Nest Hotels logo"
          className="h-8 w-8 shrink-0 object-contain"
        />
        <div>
          <div className="text-cyan-700 text-lg font-bold leading-tight">Sky Nest Hotels</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 pt-0.5">
            {user?.branchName || 'Hotel Management'}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {visibleNavItems.map((item) => (
          <div key={item.label} className="mb-1">
            <SidebarItem item={item} activeUrl={pathname} />
            {item.items && (
              <div className="mt-1 space-y-1">
                {item.items.map((childItem) => (
                  <SidebarItem key={childItem.label} item={childItem} activeUrl={pathname} nested />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-700">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut01 className="size-4 shrink-0" />
          </button>
        </div>

        <div className="space-y-1">
          {footerItems.map((item) => (
            <SidebarItem key={item.label} item={item} activeUrl={pathname} />
          ))}
        </div>
      </div>
    </aside>
  );
};
