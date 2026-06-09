import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const { fetchApi, loading } = useApi();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '' // Opcional al actualizar
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = { name: formData.name, email: formData.email };
      if (formData.password) {
        payload.password = formData.password;
      }

      const data = await fetchApi('/user/me', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      setUser(data.user);
      setMessage('Perfil actualizado correctamente');
      setFormData({ ...formData, password: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y eliminará todos tus hoteles y reservas.')) {
      return;
    }

    try {
      await fetchApi('/user/me', { method: 'DELETE' });
      alert('Cuenta eliminada. Lamentamos que te vayas.');
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mi Perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleUpdate} className={styles.form}>
          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nombre</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Nueva Contraseña (Opcional)</label>
            <input 
              type="password" 
              id="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Deja en blanco para mantener la actual"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar Perfil'}
            </button>
          </div>
        </form>

        {user.role !== 'ADMIN' && (
          <div className={styles.dangerZone}>
            <h3>Zona de Peligro</h3>
            <p>Al eliminar tu cuenta, perderás acceso a todas tus reservas y datos.</p>
            <button className="btn-danger" onClick={handleDelete} disabled={loading}>
              Eliminar Cuenta Definitivamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
