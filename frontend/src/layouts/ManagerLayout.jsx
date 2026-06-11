import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="glass" style={{ width: '250px', padding: '2rem', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', color: 'var(--accent-color)' }}>Manager Panel</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <Link to="/manager/dashboard">Dashboard</Link>
          <Link to="/manager/hotels">Mis Hoteles</Link>
          <Link to="/manager/bookings">Gestión de Reservas</Link>
        </nav>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={toggleTheme} className="btn" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--error-color)' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem', background: 'var(--bg-primary)' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <h1>Bienvenido, {user?.name}</h1>
          <span style={{ padding: '0.5rem 1rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '20px' }}>Manager</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
