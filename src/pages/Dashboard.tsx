import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from '../sections/managerDashborad';
import FrontDeskDashboard from '../sections/Frontdeskdashboard';
import { Link } from 'react-router-dom';

export const Dashboard: FC = () => {
  const { user } = useAuth();

  const role = user?.role || 'frontdesk';

  if (role === 'manager' || role === 'admin') {
    return (
      <div className="space-y-6">
        <ManagerDashboard />
      </div>
    );
  }

  if (role === 'frontdesk') {
    return (
      <div className="space-y-6">
        <FrontDeskDashboard />
      </div>
    );
  }

  // Guest Dashboard
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your guest account is ready. Manage your contact details and account security from your
          profile.
        </p>
        <Link
          to="/account"
          className="mt-5 inline-flex text-sm font-semibold text-cyan-700 hover:underline"
        >
          Open account settings
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
