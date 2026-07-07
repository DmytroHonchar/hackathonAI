import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProviderProvider } from './context/ProviderContext';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import Concierge from './pages/Concierge';
import Browse from './pages/Browse';
import ProviderDetail from './pages/ProviderDetail';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ProviderDashboard from './pages/ProviderDashboard';

function WithNav() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProviderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<WithNav />}>
              <Route path="/app" element={<Concierge />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/provider/:id" element={<ProviderDetail />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/provider" element={<ProviderDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProviderProvider>
    </AuthProvider>
  );
}
