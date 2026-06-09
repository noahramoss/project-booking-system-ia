import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import RoomCard from '../../components/RoomCard/RoomCard';
import Loader from '../../components/Loader/Loader';
import styles from './HotelDetailPage.module.css';

const HotelDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const searchState = location.state || {};
  
  const { user } = useAuth();
  const { fetchApi, loading } = useApi();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, roomId: null });
  const [bookingDates, setBookingDates] = useState({ 
    checkIn: searchState.checkIn || '', 
    checkOut: searchState.checkOut || '' 
  });
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadHotelAndRooms();
  }, [id]);

  const loadHotelAndRooms = async () => {
    try {
      const hotelData = await fetchApi(`/hotel/${id}`);
      setHotel(hotelData);

      let roomQuery = `/room?hotelId=${id}`;
      if (searchState.checkIn && searchState.checkOut) {
        roomQuery += `&checkIn=${searchState.checkIn}&checkOut=${searchState.checkOut}`;
      }

      const roomsData = await fetchApi(roomQuery);
      setRooms(roomsData.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReserveClick = (room) => {
    setBookingError('');
    setBookingDates({ 
      checkIn: searchState.checkIn || '', 
      checkOut: searchState.checkOut || '' 
    });
    setBookingModal({ isOpen: true, roomId: room.id });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    try {
      // Formatear fechas a ISO 8601 (el backend exige este formato)
      const checkInISO = new Date(bookingDates.checkIn).toISOString();
      const checkOutISO = new Date(bookingDates.checkOut).toISOString();

      await fetchApi('/booking', {
        method: 'POST',
        body: JSON.stringify({
          roomId: bookingModal.roomId,
          checkIn: checkInISO,
          checkOut: checkOutISO
        })
      });

      alert('Reserva creada con éxito!');
      setBookingModal({ isOpen: false, roomId: null });
      navigate('/bookings');
    } catch (err) {
      setBookingError(err.message);
    }
  };

  if (loading && !hotel) return <Loader />;
  if (!hotel) return <div className={styles.error}>Hotel no encontrado</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{hotel.name}</h1>
          <div className={styles.stars}>
            {'★'.repeat(hotel.stars)}{'☆'.repeat(5 - hotel.stars)}
          </div>
          <p className={styles.location}>📍 {hotel.city}, {hotel.country}</p>
        </div>
      </div>

      <div className={styles.description}>
        <h2>Sobre el hotel</h2>
        <p>{hotel.description || 'Sin descripción disponible.'}</p>
      </div>

      <div className={styles.roomsSection}>
        <h2>Habitaciones Disponibles</h2>
        <div className={styles.grid}>
          {rooms.length === 0 ? (
            <p>No hay habitaciones disponibles en este momento.</p>
          ) : (
            rooms.map(room => (
              <RoomCard 
                key={room.id} 
                room={room} 
                userRole={user.role} 
                onReserve={handleReserveClick} 
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de Reserva */}
      {bookingModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Nueva Reserva</h3>
            <p>Selecciona las fechas para tu estancia.</p>
            
            <form onSubmit={submitBooking} className={styles.form}>
              {bookingError && <div className={styles.errorMsg}>{bookingError}</div>}
              
              <div className={styles.inputGroup}>
                <label>Check-in</label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDates.checkIn}
                  onChange={e => setBookingDates({...bookingDates, checkIn: e.target.value})}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Check-out</label>
                <input 
                  type="date" 
                  required 
                  min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                  value={bookingDates.checkOut}
                  onChange={e => setBookingDates({...bookingDates, checkOut: e.target.value})}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className="btn-outline" onClick={() => setBookingModal({ isOpen: false, roomId: null })}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetailPage;
