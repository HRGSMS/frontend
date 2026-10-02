import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Login from './pages/login';
import NotFound from './pages/NotFound';
import RootLayout from './layouts/Root_layout';
import ReservationsListPage from './pages/Reservationslistpage';
import NewReservationPage from './pages/Newreservationpage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate replace to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="account" element={<Account />} />

            <Route path="reservations">
              <Route index element={<Navigate replace to="all" />} />
              <Route path="all" element={<ReservationsListPage />} />
              <Route path="new" element={<NewReservationPage onCreateBooking={() => {}} />} />
            </Route>
          </Route>

          <Route path="login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
