import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { canAccessPath, homeForRole, loginDestination } from '../lib/auth-policy';
import { AuthLayout } from '../components/AuthLayout';
import Account from '../pages/Account';
import { Login } from '../pages/Login';
import { Unauthorized } from '../pages/Unauthorized';
import FrontDeskDashboard from '../pages/frontdesk/FrontDeskDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ReservationsListPage from '../pages/frontdesk/ReservationsListPage';
import NewReservationPage from '../pages/frontdesk/NewReservationPage';
import ReservationDetailPage from '../pages/frontdesk/ReservationDetailPage';
import CheckInOutPage from '../pages/frontdesk/CheckInOutPage';
import PaymentProcessingPage from '../pages/frontdesk/PaymentProcessingPage';
import ServiceRequestsQueuePage from '../pages/frontdesk/ServiceRequestsQueuePage';
import GuestServiceRequestPage from '../pages/frontdesk/GuestServiceRequestPage';
import ServiceCataloguePage from '../pages/frontdesk/ServiceCataloguePage';
import ReportsPage from '../pages/reports/ReportsPage';
import PublicRoomsPage from '../pages/guest/PublicRoomsPage';
import GuestPortalPage from '../pages/guest/GuestPortalPage';
import SystemSettingsPage from '../pages/admin/SystemSettingsPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import ServiceStaffDashboard from '../pages/services/ServiceStaffDashboard';
import AnalyticsPage from '../pages/manager/AnalyticsPage';
import LandingPage from '../pages/LandingPage';

function Loading() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center text-gray-600">
      Verifying your session…
    </div>
  );
}

function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function RoleRoute() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return canAccessPath(user?.role, pathname) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

function PublicRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <Loading />;
  if (isAuthenticated) {
    return <Navigate to={loginDestination(user?.role)} replace />;
  }

  return <Login />;
}

/** Guest portal guard — allows guests, blocks staff redirect loops */
function GuestPortalRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Staff members are redirected to their own home
  if (user?.role && user.role !== 'guest') {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* ── Public / guest-facing routes ── */}
      <Route path="/login" element={<PublicRoute />} />
      <Route path="/guest/login" element={<Navigate to="/login" replace />} />
      <Route path="/rooms" element={<PublicRoomsPage />} />
      <Route path="/" element={<LandingPage />} />

      {/* ── Guest portal (authenticated guests only) ── */}
      <Route element={<GuestPortalRoute />}>
        <Route path="/guest" element={<Navigate to="/guest/dashboard" replace />} />
        <Route path="/guest/dashboard" element={<GuestPortalPage />} />
      </Route>

      {/* ── Staff portal (all roles) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<RoleRoute />}>
            <Route path="/account" element={<Account />} />

            <Route path="/frontdesk" element={<Navigate to="/frontdesk/dashboard" replace />} />
            <Route path="/frontdesk/dashboard" element={<FrontDeskDashboard />} />
            <Route path="/frontdesk/reservations" element={<ReservationsListPage />} />
            <Route path="/frontdesk/reservations/new" element={<NewReservationPage />} />
            <Route path="/frontdesk/reservations/:id" element={<ReservationDetailPage />} />
            <Route path="/frontdesk/check-in-out" element={<CheckInOutPage />} />
            <Route path="/frontdesk/reports" element={<Navigate to="/unauthorized" replace />} />
            <Route path="/frontdesk/payment-processing" element={<PaymentProcessingPage />} />

            {/* Guest Services */}
            <Route path="/frontdesk/service-requests" element={<ServiceRequestsQueuePage />} />
            <Route path="/frontdesk/service-requests/new" element={<GuestServiceRequestPage />} />
            <Route path="/frontdesk/service-catalogue" element={<ServiceCataloguePage />} />

            {/* Admin */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />

            {/* Manager */}
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
            <Route path="/manager/analytics" element={<AnalyticsPage />} />

            <Route path="/services" element={<Navigate to="/services/dashboard" replace />} />
            <Route path="/services/dashboard" element={<ServiceStaffDashboard />} />
            <Route path="/services/requests" element={<ServiceRequestsQueuePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<div className="p-12 text-center">404 — Page Not Found</div>} />
    </Routes>
  );
}
