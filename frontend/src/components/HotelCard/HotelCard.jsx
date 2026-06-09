import { Link } from 'react-router-dom';
import styles from './HotelCard.module.css';

const HotelCard = ({ hotel, checkIn, checkOut }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{hotel.name}</h3>
        <div className={styles.stars}>
          {'★'.repeat(hotel.stars)}{'☆'.repeat(5 - hotel.stars)}
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.location}>📍 {hotel.city}, {hotel.country}</p>
        <p className={styles.manager}>Gestor: {hotel.managerName}</p>
        {hotel.startingPrice && (
          <p className={styles.price} style={{ fontWeight: 'bold', marginTop: '8px' }}>
            Desde {hotel.startingPrice}€ / noche
          </p>
        )}
      </div>
      <div className={styles.footer}>
        <Link 
          to={`/hotel/${hotel.id}`} 
          state={{ checkIn, checkOut }}
          className="btn-outline"
        >
          Ver Habitaciones
        </Link>
      </div>
    </div>
  );
};

export default HotelCard;
