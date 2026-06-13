import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import './DashboardLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar glass" style={{ backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
        <div className="sidebar-top">
          <h2 className="sidebar-title" style={{ color: '#ef4444' }}>ADMIN</h2>
          <button className="sidebar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✖' : '☰'}
          </button>
        </div>
        
        <nav className={`sidebar-nav ${isMenuOpen ? 'sidebar-nav--open' : ''}`}>
          <Link to="/admin/dashboard" onClick={closeMenu}>Vista Global</Link>
          <Link to="/admin/users" onClick={closeMenu}>Usuarios</Link>
          <Link to="/admin/hotels" onClick={closeMenu}>Hoteles</Link>
          <Link to="/admin/bookings" onClick={closeMenu}>Reservas Globales</Link>
          <Link to="/admin/settings" onClick={closeMenu}>Configuración</Link>
        </nav>
        
        <div className={`sidebar-bottom ${isMenuOpen ? 'sidebar-bottom--open' : ''}`}>
          <button onClick={toggleTheme} className="btn" style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: '#ef4444', padding: '0.5rem 1rem' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Panel de Administración Global</h1>
          <span className="dashboard-badge" style={{ background: '#ef4444' }}>Super Admin</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
