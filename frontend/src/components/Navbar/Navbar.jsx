import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          🏨 BookingSys
        </Link>

        {/* Botón hamburguesa para móvil */}
        <button className={styles.menuButton} onClick={toggleMenu}>
          {isMenuOpen ? '✖' : '☰'}
        </button>

        {/* Enlaces de navegación */}
        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
          <li>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
          </li>
          <li>
            <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>Mis Reservas</Link>
          </li>
          <li>
            <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
          </li>
          
          <li className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </li>
          <li>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Salir
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
