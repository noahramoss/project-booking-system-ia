import StatusBadge from '../StatusBadge/StatusBadge';
import styles from './BookingCard.module.css';

const BookingCard = ({ booking, onStatusChange, userRole }) => {
  const checkIn = new Date(booking.checkIn).toLocaleDateString('es-ES');
  const checkOut = new Date(booking.checkOut).toLocaleDateString('es-ES');
  
  // Para que el frontend entienda si la reserva ya pasó
  const isPast = new Date(booking.checkOut) < new Date();

  return (
    <div className={`${styles.card} ${isPast ? styles.past : ''}`}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{booking.hotelName}</h3>
          <p className={styles.subtitle}>Habitación {booking.roomNumber} ({booking.roomType})</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      
      <div className={styles.body}>
        <div className={styles.dates}>
          <div>
            <span className={styles.label}>Check-in</span>
            <p>{checkIn}</p>
          </div>
          <div>
            <span className={styles.label}>Check-out</span>
            <p>{checkOut}</p>
          </div>
        </div>
        
        <div className={styles.details}>
          <p><strong>Usuario:</strong> {booking.userName}</p>
          <p className={styles.price}>Total: {booking.totalPrice}€</p>
        </div>
      </div>

      <div className={styles.footer}>
        {userRole === 'USER' && booking.status !== 'CANCELLED' && !isPast && (
          <button 
            className="btn-danger"
            onClick={() => onStatusChange(booking.id, 'CANCELLED')}
          >
            Cancelar Reserva
          </button>
        )}

        {(userRole === 'MANAGER' || userRole === 'ADMIN') && booking.status !== 'CANCELLED' && !isPast && (
          <div className={styles.actions}>
            {booking.status === 'PENDING' && (
              <button 
                className="btn-primary"
                onClick={() => onStatusChange(booking.id, 'CONFIRMED')}
              >
                Confirmar
              </button>
            )}
            <button 
              className="btn-danger"
              onClick={() => onStatusChange(booking.id, 'CANCELLED')}
            >
              Cancelar
            </button>
          </div>
        )}
        
        {userRole === 'ADMIN' && (
          <button 
            className="btn-outline"
            style={{ borderColor: 'var(--status-cancelled)', color: 'var(--status-cancelled)', marginTop: '0.5rem', width: '100%' }}
            onClick={() => onStatusChange(booking.id, 'DELETE')}
          >
            Eliminar Definitivamente
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
