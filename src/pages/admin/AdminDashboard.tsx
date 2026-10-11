import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">System administrator console & operations</p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-full border border-indigo-200">
          Signed in as {user?.email}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/frontdesk/dashboard"
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow"
        >
          <h2 className="font-semibold text-gray-900 text-lg">Hotel Operations</h2>
          <p className="mt-2 text-sm text-gray-600">
            Front desk operations, reservations, check-ins and payments.
          </p>
        </Link>
        <Link
          to="/admin/users"
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow"
        >
          <h2 className="font-semibold text-gray-900 text-lg">User Management</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage hotel staff, credentials, and role permissions.
          </p>
        </Link>
        <Link
          to="/admin/settings"
          className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow"
        >
          <h2 className="font-semibold text-gray-900 text-lg">System Settings</h2>
          <p className="mt-2 text-sm text-gray-600">
            Branch configuration, room inventories, and global parameters.
          </p>
        </Link>
      </div>
    </main>
  );
}
