import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { getRole, roleLabels } from '../lib/auth-policy';

export function RoleDashboard() {
  const { user } = useAuth();
  const role = getRole(user?.role);
  const links =
    role === 'admin'
      ? [
          ['System settings', '/admin/settings'],
          ['Reports', '/admin/reports'],
          ['Hotel operations', '/frontdesk/dashboard'],
        ]
      : role === 'manager'
        ? [
            ['Hotel operations', '/frontdesk/dashboard'],
            ['Revenue reports', '/manager/reports'],
            ['Analytics', '/manager/analytics'],
          ]
        : role === 'service_staff'
          ? [['Service requests', '/services/requests']]
          : [];
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {role ? roleLabels[role] : 'Account'} Dashboard
      </h1>
      <p className="mt-2 text-gray-600">Welcome, {user?.name}.</p>
      {role === 'guest' && (
        <p className="mt-6 text-gray-600">
          For booking details or service requests, please contact the front desk. The guest portal
          is not yet available.
        </p>
      )}
      <nav
        aria-label="Dashboard navigation"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {links.map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border bg-white p-6 font-medium text-blue-800 shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
