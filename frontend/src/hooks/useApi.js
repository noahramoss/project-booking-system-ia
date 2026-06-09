import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export const useApi = () => {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Si el token expiró, cerramos sesión automáticamente
        }
        throw new Error(data.message || data.error || 'Error en la petición');
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [token, logout]);

  return { fetchApi, loading, error };
};
