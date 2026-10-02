import { Routes, Route, Navigate } from 'react-router-dom';

// Front Desk Pages
import FrontDeskDashboard from '../pages/frontdesk/FrontDeskDashboard';
import ReservationsListPage from '../pages/frontdesk/ReservationsListPage';
import NewReservationPage from '../pages/frontdesk/NewReservationPage';
import ReservationDetailPage from '../pages/frontdesk/ReservationDetailPage';
import CheckInOutPage from '../pages/frontdesk/CheckInOutPage';
import PaymentProcessingPage from '../pages/frontdesk/PaymentProcessingPage';
import ServiceRequestsQueuePage from '../pages/frontdesk/ServiceRequestsQueuePage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Front Desk Routes - No authentication required */}
      <Route path="/frontdesk/*" element={<FrontDeskRoutes />} />

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