import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import './DashboardLayout.css';

const ManagerLayout = () => {
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
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-top">
          <h2 className="sidebar-title" style={{ color: 'var(--primary-color)' }}>Manager Panel</h2>
          <button className="sidebar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✖' : '☰'}
          </button>
        </div>
        
        <nav className={`sidebar-nav ${isMenuOpen ? 'sidebar-nav--open' : ''}`}>
          <Link to="/manager/dashboard" onClick={closeMenu}>Dashboard</Link>
          <Link to="/manager/hotels" onClick={closeMenu}>Mis Hoteles</Link>
          <Link to="/manager/bookings" onClick={closeMenu}>Gestión de Reservas</Link>
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
          <h1>Bienvenido, {user?.name}</h1>
          <span className="dashboard-badge" style={{ background: 'var(--primary-color)' }}>Manager</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
