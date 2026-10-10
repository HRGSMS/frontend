import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { canAccessPath, homeForRole, loginDestination } from '../lib/auth-policy';
import { AuthLayout } from '../components/AuthLayout';
import { RoleDashboard } from '../pages/RoleDashboard';
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
import ReportsPage from '../pages/frontdesk/ReportsPage';

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
  if (isAuthenticated) return <Navigate to={loginDestination(user?.role)} replace />;
  return <Login />;
}
function Home() {
  const { isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) return <Loading />;
  return <Navigate to={isAuthenticated ? homeForRole(user?.role) : '/login'} replace />;
}
function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-4 text-gray-600">This module is not yet implemented.</p>
    </main>
  );
}
export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route path="/" element={<Home />} />
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
            <Route path="/frontdesk/reports" element={<ReportsPage />} />
            <Route path="/frontdesk/payment-processing" element={<PaymentProcessingPage />} />
            <Route path="/frontdesk/service-requests" element={<ServiceRequestsQueuePage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Placeholder title="User Management" />} />
            <Route path="/admin/settings" element={<Placeholder title="System Settings" />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
            <Route path="/manager/analytics" element={<Placeholder title="Analytics" />} />
            <Route path="/manager/staff" element={<Placeholder title="Staff Management" />} />
            <Route path="/services" element={<Navigate to="/services/dashboard" replace />} />
            <Route path="/services/dashboard" element={<RoleDashboard />} />
            <Route path="/services/requests" element={<ServiceRequestsQueuePage />} />
            <Route path="/guest" element={<Navigate to="/guest/dashboard" replace />} />
            <Route path="/guest/dashboard" element={<RoleDashboard />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<div className="p-12 text-center">404 — Page Not Found</div>} />
    </Routes>
  );
}
