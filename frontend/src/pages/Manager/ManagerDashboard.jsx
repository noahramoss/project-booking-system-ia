import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { fetchApi } = useApi();
  const [stats, setStats] = useState({
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
      // Cargamos hoteles
      const hotelsData = await fetchApi('/hotel');
      const myHotels = (hotelsData.hotels || []).filter(h => h.managerEmail === user.email);
      
      // Cargamos reservas
      const bookingsData = await fetchApi('/booking');
      const myBookings = bookingsData.bookings || []; // La API ya filtra por MANAGER

      let pending = 0, confirmed = 0, cancelled = 0;

      myBookings.forEach(b => {
        if (b.status === 'PENDING') pending++;
        if (b.status === 'CONFIRMED') confirmed++;
        if (b.status === 'CANCELLED') cancelled++;
      });

      setStats({
        hotels: myHotels.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled
      });
    } catch (error) {
      console.error('Error cargando el dashboard de manager:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando tu panel de rendimiento...</p>;

  return (
    <div className="manager-dashboard">
      <h2>Panel de Rendimiento</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Resumen de la actividad en tus propiedades.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Mis Hoteles</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.hotels}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Pendientes</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-pending)' }}>{stats.pendingBookings}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Confirmadas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-confirmed)' }}>{stats.confirmedBookings}</p>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Reservas Canceladas</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--status-cancelled)' }}>{stats.cancelledBookings}</p>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;
