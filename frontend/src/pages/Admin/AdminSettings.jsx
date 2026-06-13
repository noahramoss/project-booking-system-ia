import React from 'react';

const AdminSettings = () => {
  return (
    <div className="admin-settings">
      <h2>Configuración del Sistema</h2>
      <p style={{ color: 'var(--text-muted)' }}>Panel de ajustes generales (Próximamente).</p>
      
      <div className="glass" style={{ padding: '2rem', marginTop: '2rem', borderRadius: '12px' }}>
        <h3>Mantenimiento</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Las funciones avanzadas de configuración estarán disponibles en la próxima versión.</p>
        <button className="btn" disabled style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
          Limpiar Caché del Sistema
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
