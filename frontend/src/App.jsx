import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ManagerLayout from './layouts/ManagerLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import HomePage from './pages/Home/HomePage';
import BookingsPage from './pages/Bookings/BookingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import HotelDetailPage from './pages/HotelDetail/HotelDetailPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Admin Pages
import UsersPage from './pages/Admin/UsersPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminHotels from './pages/Admin/AdminHotels';
import AdminBookings from './pages/Admin/AdminBookings';
import AdminSettings from './pages/Admin/AdminSettings';

// Manager Pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ManagerHotels from './pages/Manager/ManagerHotels';
import ManagerBookings from './pages/Manager/ManagerBookings';

import './App.css';

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas Protegidas envueltas en MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hotel/:id" element={<HotelDetailPage />} />
        </Route>

        {/* Rutas exclusivas para ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Redirección por defecto */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Rutas exclusivas para MANAGER */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="hotels" element={<ManagerHotels />} />
          <Route path="bookings" element={<ManagerBookings />} />
        </Route>
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
