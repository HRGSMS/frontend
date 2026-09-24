import React from 'react';
import ArrivalsWidget from '../widgets/Arrivalswidget ';
import DeparturesWidget from '../widgets/Departureswidget ';
import RoomStatusWidget from '../widgets/RoomStatusWidget';

// TODO: replace with useAuth() once AuthContext exists (Phase 0).
// This page will eventually live behind <ProtectedRoute allowedRoles={['frontdesk']} /> at /frontdesk.
// TODO: subscribe to `roomAvailabilityChanged` via useSocket() once SocketContext exists,
// so RoomStatusWidget updates live instead of on page load only.

const FrontDeskDashboard = () => {
  const handleCheckIn = (id) => {
    console.log('check in', id);
  };

  const handleCheckOut = (id) => {
    console.log('check out', id);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Front Desk Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ArrivalsWidget canCheckIn onCheckIn={handleCheckIn} />
        <DeparturesWidget canCheckOut onCheckOut={handleCheckOut} />
        <div className="lg:col-span-2">
          <RoomStatusWidget />
        </div>
      </div>
    </div>
  );
};

export default FrontDeskDashboard;
