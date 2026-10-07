import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Front Desk Pages
import FrontDeskDashboard from '../pages/frontdesk/FrontDeskDashboard';
import ReservationsListPage from '../pages/frontdesk/ReservationsListPage';
import NewReservationPage from '../pages/frontdesk/NewReservationPage';
import ReservationDetailPage from '../pages/frontdesk/ReservationDetailPage';
import CheckInOutPage from '../pages/frontdesk/CheckInOutPage';
import PaymentProcessingPage from '../pages/frontdesk/PaymentProcessingPage';
import ServiceRequestsQueuePage from '../pages/frontdesk/ServiceRequestsQueuePage';

// Auth Pages
import { Login } from '../pages/Login';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Wrapper (redirects authenticated users away from login)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/frontdesk/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Protected Front Desk Routes */}
      <Route
        path="/frontdesk/*"
        element={
          <ProtectedRoute>
            <FrontDeskRoutes />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to frontdesk dashboard */}
      <Route
        path="/"
        element={<Navigate to="/frontdesk/dashboard" replace />}
      />

      {/* 404 - Catch all unmatched routes */}
      <Route path="*" element={<div className="text-center py-12">404 - Page Not Found</div>} />
    </Routes>
  );
};

// Nested routes for Front Desk area
const FrontDeskRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<FrontDeskDashboard />} />
    <Route path="reservations" element={<ReservationsListPage />} />
    <Route path="reservations/new" element={<NewReservationPage />} />
    <Route path="reservations/:id" element={<ReservationDetailPage />} />
    <Route path="check-in-out" element={<CheckInOutPage />} />
    <Route path="payment-processing" element={<PaymentProcessingPage />} />
    <Route path="service-requests" element={<ServiceRequestsQueuePage />} />
  </Routes>
);