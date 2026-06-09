import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import HomePage from './pages/Home/HomePage';
import BookingsPage from './pages/Bookings/BookingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import HotelDetailPage from './pages/HotelDetail/HotelDetailPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

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
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
