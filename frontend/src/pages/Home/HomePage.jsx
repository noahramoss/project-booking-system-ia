import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import HotelCard from '../../components/HotelCard/HotelCard';
import Loader from '../../components/Loader/Loader';
import styles from './HomePage.module.css';

const HomePage = () => {
  const { user } = useAuth();
  const { fetchApi, loading } = useApi();
  const navigate = useNavigate();
  
  // States compartidos
  const [hotels, setHotels] = useState([]);

  // States para USER (Búsqueda Avanzada)
  const [filters, setFilters] = useState({ 
    hotelName: '', 
    city: '', 
    checkIn: '', 
    checkOut: '', 
    capacity: '', 
    minPrice: '', 
    maxPrice: '', 
    sortBy: 'stars', 
    sortOrder: 'desc' 
  });
  
  useEffect(() => {
    loadUserHotels();
  }, []);

  const loadUserHotels = async () => {
    try {
      const query = new URLSearchParams();
      if (filters.hotelName) query.append('name', filters.hotelName);
      if (filters.city) query.append('city', filters.city);
      if (filters.checkIn) query.append('checkIn', filters.checkIn);
      if (filters.checkOut) query.append('checkOut', filters.checkOut);
      if (filters.capacity) query.append('capacity', filters.capacity);
      if (filters.minPrice) query.append('minPrice', filters.minPrice);
      if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);
      query.append('sortBy', filters.sortBy);
      query.append('sortOrder', filters.sortOrder);
      
      const data = await fetchApi(`/hotel?${query.toString()}`);
      setHotels(data.hotels || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadUserHotels();
  };

  if (loading) return <Loader />;

  return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Encuentra tu próximo hotel</h1>
          <p>Filtra por fechas, precio y capacidad para encontrar las mejores opciones</p>
        </div>

        <form className={styles.searchForm} onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Destino o nombre..." 
            value={filters.hotelName}
            onChange={(e) => setFilters({...filters, hotelName: e.target.value})}
          />
          <input 
            type="date" 
            placeholder="Check In" 
            value={filters.checkIn}
            onChange={(e) => setFilters({...filters, checkIn: e.target.value})}
          />
          <input 
            type="date" 
            placeholder="Check Out" 
            value={filters.checkOut}
            onChange={(e) => setFilters({...filters, checkOut: e.target.value})}
          />
          <input 
            type="number" 
            placeholder="Personas" 
            min="1"
            value={filters.capacity}
            onChange={(e) => setFilters({...filters, capacity: e.target.value})}
            style={{ width: '100px' }}
          />
          <input 
            type="number" 
            placeholder="Precio Min" 
            min="0"
            value={filters.minPrice}
            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            style={{ width: '110px' }}
          />
          <input 
            type="number" 
            placeholder="Precio Max" 
            min="0"
            value={filters.maxPrice}
            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            style={{ width: '110px' }}
          />
          <select 
            value={`${filters.sortBy}-${filters.sortOrder}`} 
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters({...filters, sortBy, sortOrder});
            }}
          >
            <option value="stars-desc">Mejor valorados</option>
            <option value="price-asc">Precio (menor a mayor)</option>
            <option value="price-desc">Precio (mayor a menor)</option>
          </select>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>

        <div className={styles.grid}>
          {hotels.length === 0 ? (
            <p>No se encontraron hoteles con esos criterios.</p>
          ) : (
            hotels.map(hotel => (
              <HotelCard 
                key={hotel.id} 
                hotel={hotel} 
                checkIn={filters.checkIn}
                checkOut={filters.checkOut}
              />
            ))
          )}
        </div>
      </div>
  );
};

export default HomePage;
