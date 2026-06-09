import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>; // Opcional: reemplazar con componente Loader
  }

  // Si no hay token, redirigimos al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos y el rol del usuario no está en la lista, redirigimos a home
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // Si todo es correcto, renderizamos las rutas hijas
  return <Outlet />;
};

export default ProtectedRoute;
