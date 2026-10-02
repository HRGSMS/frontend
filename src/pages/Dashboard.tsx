import React from 'react';
import ManagerDashboard from '../sections/managerDashborad';
import FrontDeskDashboard from '../sections/Frontdeskdashboard';

const Dashboard: React.FC = () => {
  // const { user } = useAuth();
  const user = { role: 'frontDesk' };
  // const user.role = 'manager';

  return (
    <div className="px-10 py-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-5">
      {user.role === 'manager' && <ManagerDashboard />}
      {user.role === 'frontDesk' && <FrontDeskDashboard />}
    </div>
  );
};

export default Dashboard;
