import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { API_URL } from '../../config/api';

const AdminHotels = () => {
  const { fetchApi } = useApi();
  const { token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const data = await fetchApi('/hotel');
      setHotels(data.hotels || []);
    } catch (error) {
      console.error('Error cargando hoteles globales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('¿ATENCIÓN: Estás seguro de que deseas eliminar este hotel y TODAS sus habitaciones y reservas en cascada? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/hotel/${hotelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el hotel');
      }

      alert('Hotel eliminado con éxito.');
      loadHotels();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <p>Cargando lista de hoteles...</p>;

  return (
    <div className="admin-hotels">
      <h2>Lista de Hoteles Globales</h2>
      <p style={{ color: 'var(--text-muted)' }}>Vista administrativa de todas las propiedades del sistema.</p>

      <div className="table-container glass" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>ID Hotel</th>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Ciudad</th>
              <th style={{ padding: '1rem' }}>Estrellas</th>
              <th style={{ padding: '1rem' }}>Mánager (Dueño)</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No hay hoteles registrados en el sistema.</td></tr>
            ) : (
              hotels.map(hotel => (
                <tr key={hotel.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hotel.id.substring(0,8)}...</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{hotel.name}</td>
                  <td style={{ padding: '1rem' }}>{hotel.city}</td>
                  <td style={{ padding: '1rem' }}>{hotel.stars} ⭐</td>
                  <td style={{ padding: '1rem' }}>{hotel.managerEmail || 'Sin Asignar'}</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleDeleteHotel(hotel.id)}
                      style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Eliminar
                    </button>
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

export default AdminHotels;
