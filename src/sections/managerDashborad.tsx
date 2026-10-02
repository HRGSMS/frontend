import type { FC } from 'react';
import OccupancyWidget from '../widgets/Occupancywidget';
import RevenueWidget from '../widgets/Revenuewidget';
import PendingServiceRequestsWidget from '../widgets/Pendingservicerequestswidget';
import OutstandingBalancesWidget from '../widgets/Outstandingbalanceswidget';

// TODO: replace with useAuth() once AuthContext exists (Phase 0).
// This page will eventually live behind <ProtectedRoute allowedRoles={['manager']} /> at /manager.

const ManagerDashboard: FC = () => {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Manager Dashboard</h1>
      <div className="grid grid-cols-5 gap-10 md:grid-cols-2 lg:grid-cols-2 ">
        <OccupancyWidget />
        <RevenueWidget />
        <PendingServiceRequestsWidget />
        <OutstandingBalancesWidget />
      </div>
    </div>
  );
};

export default ManagerDashboard;
