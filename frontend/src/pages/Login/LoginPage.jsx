import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import { validateEmail, validateRequiredPassword, validateForm } from '../../utils/validators';
import styles from './LoginPage.module.css';

const rules = { email: validateEmail, password: validateRequiredPassword };

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Valida un campo al salir de él (feedback temprano).
  const handleBlur = (field, value) =>
    setFieldErrors((prev) => ({ ...prev, [field]: rules[field](value) }));

  // Limpia el error de un campo mientras el usuario lo corrige.
  const clearError = (field) =>
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { errors, isValid } = validateForm({ email, password }, rules);
    setFieldErrors(errors);
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en el login');
      }

      login(data.user, data.token);

      // Redirección basada en rol
      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              className={fieldErrors.email ? styles.invalid : undefined}
              onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
              onBlur={(e) => handleBlur('email', e.target.value)}
            />
            {fieldErrors.email && <small className={styles.fieldError}>{fieldErrors.email}</small>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              className={fieldErrors.password ? styles.invalid : undefined}
              onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
              onBlur={(e) => handleBlur('password', e.target.value)}
            />
            {fieldErrors.password && <small className={styles.fieldError}>{fieldErrors.password}</small>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
