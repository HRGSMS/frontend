import type { FC } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RootLayout from '../layouts/Root_layout';

// Public Auth Pages
import Login from '../pages/login';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFound from '../pages/NotFound';

// Core Pages
import Dashboard from '../pages/Dashboard';
import Account from '../pages/Account';

// Front Desk & Reservation Pages
import ReservationsListPage from '../pages/Reservationslistpage';
import NewReservationPage from '../pages/Newreservationpage';
import ReservationDetailPage from '../pages/ReservationDetailPage';
import CheckInOutPage from '../pages/CheckInOutPage';
import PaymentProcessingPage from '../pages/PaymentProcessingPage';
import ServiceRequestsQueuePage from '../pages/ServiceRequestsQueuePage';

// Manager Pages
import RoomInventoryManagementPage from '../pages/RoomInventoryManagementPage';
import ServiceCatalogManagementPage from '../pages/ServiceCatalogManagementPage';
import ReportsPage from '../pages/ReportsPage';

// Admin Pages
import UserManagementPage from '../pages/UserManagementPage';
import AuditLogViewerPage from '../pages/AuditLogViewerPage';

export const AppRouter: FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated Root Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="account" element={<Account />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={['frontdesk', 'manager', 'admin']}>
              <OutletWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="reservations">
            <Route index element={<Navigate replace to="all" />} />
            <Route path="all" element={<ReservationsListPage />} />
            <Route path="new" element={<NewReservationPage />} />
            <Route path="check-in-out" element={<CheckInOutPage />} />
            <Route path=":id" element={<ReservationDetailPage />} />
          </Route>
          <Route path="service-requests" element={<ServiceRequestsQueuePage />} />
          <Route path="billing">
            <Route index element={<PaymentProcessingPage />} />
            <Route path="payment" element={<PaymentProcessingPage />} />
          </Route>
        </Route>

        {/* Manager & Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin', 'frontdesk']}>
              <OutletWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="rooms" element={<RoomInventoryManagementPage />} />
          <Route path="rooms/status" element={<RoomInventoryManagementPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <OutletWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="service-catalog" element={<ServiceCatalogManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:type" element={<ReportsPage />} />
        </Route>

        {/* Admin-only Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <OutletWrapper />
            </ProtectedRoute>
          }
        >
          <Route path="staff" element={<UserManagementPage />} />
          <Route path="audit-log" element={<AuditLogViewerPage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const OutletWrapper: FC = () => <Outlet />;

export default AppRouter;
