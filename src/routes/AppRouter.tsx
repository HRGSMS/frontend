import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

// Staff pages
import  FrontDeskDashboard  from '../pages/frontdesk/FrontDeskDashboard';
import  ReservationsListPage  from '../pages/frontdesk/ReservationsListPage';
import  NewReservationPage  from '../pages/frontdesk/NewReservationPage';
import  ReservationDetailPage  from '../pages/frontdesk/ReservationDetailPage';
import  CheckInOutPage  from '../pages/frontdesk/CheckInOutPage';
import  PaymentProcessingPage  from '../pages/frontdesk/PaymentProcessingPage';
import  ServiceRequestsQueuePage  from '../pages/frontdesk/ServiceRequestsQueuePage';

// import  ManagerDashboard  from '../pages/manager/ManagerDashboard';
// import  ReportsPage  from '../pages/manager/ReportsPage';
// import  ServiceCatalogManagementPage  from '../pages/manager/ServiceCatalogManagementPage';
// import  RoomInventoryManagementPage  from '../pages/manager/RoomInventoryManagementPage';
// import  UserManagementPage  from '../pages/manager/UserManagementPage';
// import  AuditLogViewerPage  from '../pages/manager/AuditLogViewerPage';

// Auth pages
import  LoginPage  from '../pages/auth/LoginPage';

export const AppRouter = () => {
  const { user } = AuthContext();

  return (
    <Routes>
      {/* Auth routes - accessible to all */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/frontdesk/*"
        element={
          <ProtectedRoute allowedRoles={['FrontDesk', 'ServiceStaff']}>
            <FrontDeskRoutes />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/manager/*"
        element={
          <ProtectedRoute allowedRoles={['Manager', 'Admin']}>
            <ManagerRoutes />
          </ProtectedRoute>
        }
      /> */}

      {/* Redirect root to dashboard based on role */}
      <Route
        path="/"
        element={
          user?.role === 'FrontDesk' || user?.role === 'ServiceStaff'
            ? <Navigate to="/frontdesk/dashboard" replace />
            : <Navigate to="/manager/dashboard" replace />
        }
      />

      {/* 404 */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};

const FrontDeskRoutes = () => (
  <Routes>
    <Route path="/dashboard" element={<FrontDeskDashboard />} />
    <Route path="/reservations" element={<ReservationsListPage />} />
    <Route path="/reservations/new" element={<NewReservationPage />} />
    <Route path="/reservations/:id" element={<ReservationDetailPage />} />
    <Route path="/check-in-out" element={<CheckInOutPage />} />
    <Route path="/payment-processing" element={<PaymentProcessingPage />} />
    <Route path="/service-requests" element={<ServiceRequestsQueuePage />} />
  </Routes>
);

// const ManagerRoutes = () => (
//   <Routes>
//     <Route path="/dashboard" element={<ManagerDashboard />} />
//     <Route path="/reports" element={<ReportsPage />} />
//     <Route path="/services" element={<ServiceCatalogManagementPage />} />
//     <Route path="/rooms" element={<RoomInventoryManagementPage />} />
//     <Route path="/users" element={<UserManagementPage />} />
//     <Route path="/audit-logs" element={<AuditLogViewerPage />} />
//   </Routes>
// );