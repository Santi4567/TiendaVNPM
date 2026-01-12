import { createContext, useState, useContext, useEffect } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, preguntamos al backend: "¿Sigo logueado?"
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Intentamos obtener el perfil. Si la cookie es válida, responderá con los datos.
        const res = await apiCall('/api/users/profile'); 
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => {
    // Ya no guardamos token, solo el estado del usuario en memoria
    setUser(userData); 
  };

  const logout = async () => {
    try {
      // Avisamos al backend para que destruya la cookie
      await apiCall('/users/logout', 'POST'); 
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const hasPermission = (permisoRequerido) => {
    if (!user) return false;
    if (user.rolId === 1) return true; 
    return user.permisos?.includes(permisoRequerido);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);