import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Si no hay token, redirige al usuario a la página de inicio de sesión
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  return children; // Si hay token, renderiza el componente hijo (la ruta protegida)
};

export default PrivateRoute;