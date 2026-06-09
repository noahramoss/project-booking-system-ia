import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import loginStyles from '../Login/LoginPage.module.css'; // Reutilizamos estilos del login

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en el registro');
      }

      // El backend no devuelve token al registrar, así que redirigimos al login
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loginStyles.container}>
      <div className={loginStyles.card}>
        <h1 className={loginStyles.title}>Registrarse</h1>
        <form onSubmit={handleSubmit} className={loginStyles.form}>
          {error && <div className={loginStyles.error}>{error}</div>}
          
          <div className={loginStyles.inputGroup}>
            <label htmlFor="name">Nombre</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={loginStyles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className={loginStyles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Mín. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo especial.
            </small>
          </div>

          <div className={loginStyles.inputGroup}>
            <label htmlFor="role">Rol</label>
            <select id="role" value={formData.role} onChange={handleChange}>
              <option value="USER">Usuario (Cliente)</option>
              <option value="MANAGER">Gestor de Hoteles</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Crear Cuenta'}
          </button>
        </form>
        
        <p className={loginStyles.footer}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
