import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import './Admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { fetchApi } = useApi();
  const [stats, setStats] = useState({
    users: 0,
    hotels: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargamos usuarios
      const usersData = await fetchApi('/user');
      // Cargamos hoteles
      const hotelsData = await fetchApi('/hotel');
      // Cargamos reservas
      const bookingsData = await fetchApi('/booking');

      const bookings = bookingsData.bookings || [];
      let pending = 0, confirmed = 0, cancelled = 0;

      bookings.forEach(b => {
        if (b.status === 'PENDING') pending++;
        if (b.status === 'CONFIRMED') confirmed++;
        if (b.status === 'CANCELLED') cancelled++;
      });

      setStats({
        users: usersData.pagination?.totalRecords || (usersData.users ? usersData.users.length : 0),
        hotels: hotelsData.hotels ? hotelsData.hotels.length : 0,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled
      });
    } catch (error) {
      console.error('Error cargando el dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando estadísticas globales...</p>;

  return (
    <div className="admin-dashboard">
      <h2>Panel de Control Global</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Bienvenido, Administrador {user?.name}. Aquí tienes un resumen del sistema.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Usuarios</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.users}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Hoteles Activos</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{stats.hotels}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Confirmadas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-confirmed)' }}>{stats.confirmedBookings}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Pendientes</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-pending)' }}>{stats.pendingBookings}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Canceladas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-cancelled)' }}>{stats.cancelledBookings}</p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
