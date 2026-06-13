import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { API_URL } from '../../config/api';

const ManagerBookings = () => {
  const { fetchApi } = useApi();
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // El backend ya filtra por el rol de Manager (devuelve reservas de sus hoteles)
      const data = await fetchApi('/booking');
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error cargando reservas de manager:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`¿Estás seguro de que deseas marcar esta reserva como ${newStatus}?`)) return;

    try {
      const response = await fetch(`${API_URL}/booking/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el estado de la reserva');
      }

      alert('Estado de reserva actualizado con éxito.');
      loadBookings();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <p>Cargando reservas de tus hoteles...</p>;

  return (
    <div className="manager-bookings">
      <h2>Gestión de Reservas</h2>
      <p style={{ color: 'var(--text-muted)' }}>Administra las reservas realizadas por clientes en tus hoteles.</p>

      <div className="table-container glass" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Hotel / Habitación</th>
              <th style={{ padding: '1rem' }}>Fechas</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No tienes reservas actualmente.</td></tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{booking.user?.name || 'Usuario Eliminado'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{booking.user?.email || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    {booking.room?.hotel?.name}<br/>
                    <small style={{ color: 'var(--text-muted)' }}>Hab: {booking.room?.number || booking.roomNumber}</small>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    In: {new Date(booking.checkIn).toLocaleDateString()}<br/>
                    Out: {new Date(booking.checkOut).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: booking.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : booking.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: booking.status === 'CONFIRMED' ? 'var(--status-confirmed)' : booking.status === 'CANCELLED' ? 'var(--status-cancelled)' : 'var(--status-pending)'
                    }}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="action-cell">
                    {booking.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--status-confirmed)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                          style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                        style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Cancelar
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerBookings;
