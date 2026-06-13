import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import './Admin.css'; // Opcional para estilos específicos

const UsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al obtener usuarios');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/user/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al actualizar el rol');
      }

      // Actualizar el estado local
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Rol actualizado con éxito');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId, userRole) => {
    if (userRole === 'ADMIN') {
      alert('Por motivos de seguridad, no se puede eliminar a un administrador.');
      return;
    }

    if (!window.confirm('¿ATENCIÓN: Estás seguro de que deseas eliminar este usuario? Sus reservas y propiedades asociadas se eliminarán. Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al eliminar el usuario');
      }

      alert('Usuario eliminado con éxito.');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-users-page">
      <h2>Gestión de Usuarios</h2>
      <div className="table-container glass" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Rol Actual</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{user.name}</td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div className="action-cell" style={{ gap: '1.5rem' }}>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="USER">USER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {user.role !== 'ADMIN' && (
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.role)}
                      style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      title="Eliminar usuario permanentemente"
                    >
                      Eliminar
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
