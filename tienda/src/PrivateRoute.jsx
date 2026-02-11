import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children, permiso }) => {
  const { user, hasPermission } = useAuth();

  // 1. Si no hay usuario logueado -> Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. (Opcional) Si la ruta requiere un permiso específico (ej: 'view.report')
  if (permiso && !hasPermission(permiso)) {
    return <div className="p-10 text-center text-red-600">No tienes permisos para ver esta sección.</div>;
  }

  return children;
};

export default PrivateRoute;