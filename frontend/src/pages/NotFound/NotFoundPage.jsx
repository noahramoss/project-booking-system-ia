import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--primary-color)', margin: 0 }}>404</h1>
      <h2 style={{ color: 'var(--secondary-color)', margin: 0 }}>Página no encontrada</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link to="/" className="btn-primary">
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;
