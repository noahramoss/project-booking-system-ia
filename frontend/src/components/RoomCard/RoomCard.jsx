import styles from './RoomCard.module.css';

const RoomCard = ({ room, onReserve, userRole }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Habitación {room.number}</h3>
        <span className={styles.typeBadge}>{room.type}</span>
      </div>
      
      <div className={styles.body}>
        {room.hotelName && <p className={styles.hotelName}>🏨 {room.hotelName}</p>}
        <p className={styles.info}>👥 Capacidad: {room.capacity} personas</p>
        <p className={styles.price}>
          <span className={styles.amount}>{room.price}€</span> / noche
        </p>
      </div>

      {userRole === 'USER' && (
        <div className={styles.footer}>
          <button className="btn-primary" onClick={() => onReserve(room)}>
            Reservar
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomCard;
