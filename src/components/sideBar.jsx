import {
  Archive,
  BarChartSquare02,
  CheckDone01,
  CurrencyDollarCircle,
  Grid03,
  HomeLine,
  LineChartUp03,
  MessageChatCircle,
  NotificationBox,
  Package,
  PieChart03,
  Rows01,
  Settings01,
  User01,
  Users01,
  UsersPlus,
} from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';

const navItemsSimple = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeLine,
    items: [
      { label: 'Overview', href: '/dashboard/overview', icon: Grid03 },
      { label: 'Analytics', href: '/dashboard/analytics', icon: LineChartUp03 },
      {
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: NotificationBox,
        badge: 3,
      },
    ],
  },
  {
    label: 'Reservations',
    href: '/reservations',
    icon: Rows01,
    items: [
      { label: 'All Reservations', href: '/reservations/all', icon: Rows01 },
      { label: 'New Reservation', href: '/reservations/new', icon: CheckDone01 },
      { label: 'Check-In / Check-Out', href: '/reservations/check-in-out', icon: Archive },
    ],
  },
  {
    label: 'Rooms',
    href: '/rooms',
    icon: Package,
    items: [
      { label: 'Room Status', href: '/rooms/status', icon: Grid03 },
      { label: 'Room Types', href: '/rooms/types', icon: Archive },
    ],
  },
  {
    label: 'Guests',
    href: '/guests',
    icon: Users01,
    items: [
      { label: 'Guest Directory', href: '/guests/directory', icon: Users01 },
      { label: 'Guest Lookup', href: '/guests/lookup', icon: User01 },
    ],
  },
  {
    label: 'Service Requests',
    href: '/service-requests',
    icon: MessageChatCircle,
    badge: 5,
  },
  {
    label: 'Housekeeping',
    href: '/housekeeping',
    icon: CheckDone01,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChartSquare02,
    items: [
      { label: 'Occupancy', href: '/reports/occupancy', icon: PieChart03 },
      { label: 'Revenue', href: '/reports/revenue', icon: LineChartUp03 },
    ],
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: UsersPlus,
  },
  {
    label: 'Billing & Invoices',
    href: '/billing',
    icon: CurrencyDollarCircle,
  },
];

const footerItems = [
  { label: 'Settings', href: '/settings', icon: Settings01 },
  { label: 'Support', href: '/support', icon: MessageChatCircle },
  { label: 'My Account', href: '/account', icon: User01 },
];

const SidebarItem = ({ item, activeUrl, nested = false }) => {
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

export const SidebarNavigationSimpleDemo = () => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden h-screen w-64 shrink-0 sticky top-0 border-r border-gray-200 bg-white md:flex md:flex-col">
      <div className="flex items-center gap-5 border-b border-gray-200 px-6 py-4">
        <img
          src="/favicon.svg"
          alt="Sky Nest Hotels logo"
          className="h-8 w-8 shrink-0 object-contain"
        />
        <div>
          <div className="text-lg font-bold leading-tight text-gray-900">Sky Nest Hotels</div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 py-2">
            Executive management
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navItemsSimple.map((item) => (
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
      <div className="border-t border-gray-200 px-3 py-2">
        {footerItems.map((item) => (
          <SidebarItem key={item.label} item={item} activeUrl={pathname} />
        ))}
      </div>
    </aside>
  );
};
