import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { API_URL } from '../../config/api';

const AdminBookings = () => {
  const { fetchApi } = useApi();
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await fetchApi('/booking');
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error cargando reservas globales:', error);
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

      alert('Estado de reserva actualizado con éxito (Acción de Administrador)');
      loadBookings(); // Recargar la lista
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <p>Cargando todas las reservas del sistema...</p>;

  return (
    <div className="admin-bookings">
      <h2>Reservas Globales</h2>
      <p style={{ color: 'var(--text-muted)' }}>Como administrador, tienes el poder de anular o confirmar cualquier reserva del sistema.</p>

      <div className="table-container glass" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>ID Reserva</th>
              <th style={{ padding: '1rem' }}>Usuario</th>
              <th style={{ padding: '1rem' }}>Hotel</th>
              <th style={{ padding: '1rem' }}>Mánager</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Acciones Override</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No hay reservas en el sistema.</td></tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{booking.id.substring(0,8)}...</td>
                  <td style={{ padding: '1rem' }}>{booking.user?.name || 'Desconocido'}</td>
                  <td style={{ padding: '1rem' }}>{booking.room?.hotel?.name || 'Hotel Eliminado'}</td>
                  <td style={{ padding: '1rem' }}>{booking.room?.hotel?.manager?.name || 'Sin Manager'}</td>
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
                    {booking.status !== 'CONFIRMED' && (
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                        style={{ padding: '0.4rem 0.8rem', background: 'var(--status-confirmed)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Confirmar
                      </button>
                    )}
                    {booking.status !== 'CANCELLED' && (
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

export default AdminBookings;
