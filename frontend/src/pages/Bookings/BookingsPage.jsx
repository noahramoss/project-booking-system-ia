import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import BookingCard from '../../components/BookingCard/BookingCard';
import Loader from '../../components/Loader/Loader';
import styles from './BookingsPage.module.css';

const BookingsPage = () => {
  const { user } = useAuth();
  const { fetchApi, loading } = useApi();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, CANCELLED, PAST

  const loadBookings = async () => {
    try {
      const data = await fetchApi('/booking');
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'DELETE') {
      if (!window.confirm('¿Seguro que quieres eliminar esta reserva?')) return;
      try {
        await fetchApi(`/booking/${id}`, { method: 'DELETE' });
        loadBookings();
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    try {
      await fetchApi(`/booking/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtrado en el cliente
  const filteredBookings = bookings.filter(b => {
    const isPast = new Date(b.checkOut) < new Date();
    
    if (filter === 'PAST') return isPast;
    if (isPast && filter !== 'ALL' && filter !== 'CANCELLED') return false; // Las pasadas solo se ven en ALL, PAST o CANCELLED
    
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  if (loading && bookings.length === 0) return <Loader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Reservas</h1>
        <p>
          {user.role === 'USER' 
            ? 'Revisa y gestiona tus próximas estancias' 
            : 'Administra las reservas de tus hoteles'}
        </p>
      </div>

      <div className={styles.filters}>
        <button 
          className={filter === 'ALL' ? styles.activeFilter : ''} 
          onClick={() => setFilter('ALL')}
        >Todas</button>
        <button 
          className={filter === 'PENDING' ? styles.activeFilter : ''} 
          onClick={() => setFilter('PENDING')}
        >Pendientes</button>
        <button 
          className={filter === 'CONFIRMED' ? styles.activeFilter : ''} 
          onClick={() => setFilter('CONFIRMED')}
        >Confirmadas</button>
        <button 
          className={filter === 'CANCELLED' ? styles.activeFilter : ''} 
          onClick={() => setFilter('CANCELLED')}
        >Canceladas</button>
        <button 
          className={filter === 'PAST' ? styles.activeFilter : ''} 
          onClick={() => setFilter('PAST')}
        >Historial Pasado</button>
      </div>

      <div className={styles.grid}>
        {filteredBookings.length === 0 ? (
          <p className={styles.empty}>No hay reservas que coincidan con este filtro.</p>
        ) : (
          filteredBookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onStatusChange={handleStatusChange} 
              userRole={user.role} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
