import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { API_URL } from '../../config/api';

const ManagerHotels = () => {
  const { fetchApi } = useApi();
  const { user, token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    stars: 3,
    imageUrls: ''
  });

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const data = await fetchApi('/hotel');
      const myHotels = (data.hotels || []).filter(h => h.managerEmail === user.email);
      setHotels(myHotels);
    } catch (error) {
      console.error('Error cargando hoteles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const bodyParams = {
        name: formData.name,
        description: formData.description,
        city: formData.city,
        stars: Number(formData.stars)
      };

      if (formData.imageUrls) {
        bodyParams.imageUrls = formData.imageUrls.split(',').map(url => url.trim());
      }

      const response = await fetch(`${API_URL}/hotel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyParams)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el hotel');
      }

      alert('Hotel creado con éxito.');
      setShowForm(false);
      setFormData({ name: '', description: '', city: '', stars: 3, imageUrls: '' });
      loadHotels();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('¿ATENCIÓN: Estás seguro de que deseas eliminar tu hotel y TODAS sus habitaciones y reservas en cascada?')) return;

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

  if (loading) return <p>Cargando tus hoteles...</p>;

  return (
    <div className="manager-hotels">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mis Hoteles</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? 'Cancelar' : 'Añadir Hotel'}
        </button>
      </div>

      {showForm && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <h3>Crear Nuevo Hotel</h3>
          <form onSubmit={handleCreateHotel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Nombre del Hotel</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Ciudad</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Estrellas</label>
                <input required type="number" min="1" max="5" value={formData.stars} onChange={e => setFormData({...formData, stars: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Descripción</label>
              <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>URLs de Imágenes (separadas por comas)</label>
              <input type="text" placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg" value={formData.imageUrls} onChange={e => setFormData({...formData, imageUrls: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
              Guardar Hotel
            </button>
          </form>
        </div>
      )}

      <div className="table-container glass" style={{ padding: '1rem', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Ciudad</th>
              <th style={{ padding: '1rem' }}>Estrellas</th>
              <th style={{ padding: '1rem' }}>Habitaciones</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No has registrado ningún hotel todavía.</td></tr>
            ) : (
              hotels.map(hotel => (
                <tr key={hotel.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{hotel.name}</td>
                  <td style={{ padding: '1rem' }}>{hotel.city}</td>
                  <td style={{ padding: '1rem' }}>{hotel.stars} ⭐</td>
                  <td style={{ padding: '1rem' }}>{hotel._count?.rooms || 0}</td>
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

export default ManagerHotels;
