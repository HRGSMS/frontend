import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { useSocket } from '../../context/socket-state';

const FrontDeskDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const [todaysArrivals, setTodaysArrivals] = useState<any[]>([]);
  const [todaysDepartures, setTodaysDepartures] = useState<any[]>([]);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch data from APIs
    // For now, we'll use mock data
    const loadDashboardData = () => {
      setLoading(true);

      // Mock data
      setTodaysArrivals([
        { id: 1, guestName: 'John Smith', roomNumber: '101', checkInTime: '14:00' },
        { id: 2, guestName: 'Jane Doe', roomNumber: '105', checkInTime: '15:30' },
      ]);

      setTodaysDepartures([
        { id: 1, guestName: 'Bob Johnson', roomNumber: '201', checkOutTime: '11:00' },
        { id: 2, guestName: 'Alice Brown', roomNumber: '205', checkOutTime: '10:00' },
      ]);

      setOccupancyRate(75);
      setLoading(false);
    };

    loadDashboardData();

    const onOccupancy = (data: { occupancyRate: number }) => setOccupancyRate(data.occupancyRate);
    const onArrival = (data: { arrival: unknown }) =>
      setTodaysArrivals((prev) => [...prev, data.arrival]);
    const onDeparture = (data: { departure: unknown }) =>
      setTodaysDepartures((prev) => [...prev, data.departure]);
    socket?.on('occupancy-updated', onOccupancy);
    socket?.on('new-arrival', onArrival);
    socket?.on('new-departure', onDeparture);

    return () => {
      socket?.off('occupancy-updated', onOccupancy);
      socket?.off('new-arrival', onArrival);
      socket?.off('new-departure', onDeparture);
    };
  }, [user, socket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const navItems = [
    {
      title: 'Reservations',
      description: 'View and manage all reservations',
      icon: '📋',
      path: '/frontdesk/reservations',
    },
    {
      title: 'New Reservation',
      description: 'Create a new booking',
      icon: '➕',
      path: '/frontdesk/reservations/new',
    },
    {
      title: 'Check In / Out',
      description: 'Process guest check-ins and check-outs',
      icon: '🔑',
      path: '/frontdesk/check-in-out',
    },
    {
      title: 'Payment Processing',
      description: 'Handle payments and billing',
      icon: '💳',
      path: '/frontdesk/payment-processing',
    },
    {
      title: 'Service Requests',
      description: 'Manage guest service requests',
      icon: '🛎️',
      path: '/frontdesk/service-requests',
    },
    ...(isAdmin
      ? [
          {
            title: 'Admin Panel',
            description: 'User management & system settings',
            icon: '⚙️',
            path: '/admin/users',
          },
          {
            title: 'Reports',
            description: 'System-wide reports & analytics',
            icon: '📊',
            path: '/admin/reports',
          },
        ]
      : isManager
        ? [
            {
              title: 'Manager Reports',
              description: 'Revenue & occupancy reports',
              icon: '📈',
              path: '/manager/reports',
            },
            {
              title: 'Staff Management',
              description: 'Manage front desk staff',
              icon: '👥',
              path: '/manager/staff',
            },
          ]
        : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Front Desk Dashboard</h1>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex items-center">
                <span className="mr-4 text-sm text-gray-600">
                  Welcome, {user?.name?.split(' ')[0]}!
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {user?.role?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Navigation Cards */}
          <section className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Navigation</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 hover:border-indigo-200"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Stats Overview */}
          <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Arrivals</h3>
              <p className="text-2xl font-bold text-indigo-600">{todaysArrivals.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Departures</h3>
              <p className="text-2xl font-bold text-indigo-600">{todaysDepartures.length}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Rate</h3>
              <p className="text-2xl font-bold text-indigo-600">{occupancyRate}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Rooms</h3>
              <p className="text-2xl font-bold text-indigo-600">25</p>
            </div>
          </div>

          {/* Today's Arrivals & Departures */}
          <div className="grid gap-8">
            <div className="lg:w-1/2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Arrivals</h2>
                  {todaysArrivals.length > 0 ? (
                    <div className="space-y-4">
                      {todaysArrivals.map((arrival: any) => (
                        <div
                          key={arrival.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{arrival.guestName}</p>
                            <p className="text-sm text-gray-500">Room {arrival.roomNumber}</p>
                          </div>
                          <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                            {arrival.checkInTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No arrivals scheduled for today
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Departures</h2>
                  {todaysDepartures.length > 0 ? (
                    <div className="space-y-4">
                      {todaysDepartures.map((departure: any) => (
                        <div
                          key={departure.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{departure.guestName}</p>
                            <p className="text-sm text-gray-500">Room {departure.roomNumber}</p>
                          </div>
                          <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            {departure.checkOutTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No departures scheduled for today
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FrontDeskDashboard;
