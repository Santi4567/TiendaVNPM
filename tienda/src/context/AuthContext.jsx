import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Definimos la función con useCallback para poder exportarla y reusarla
  const checkSession = useCallback(async () => {
    try {
      // TRUCO ANTI-CACHÉ: Agregamos ?t=Date.now() para obligar al navegador 
      // a hacer una petición fresca y no usar la memoria caché del admin anterior.
      const timestamp = new Date().getTime();
      const res = await apiCall(`/api/users/profile?_t=${timestamp}`); 
      
      if (res.data.success) {
        setUser(res.data.data); // Aquí deben venir los permisos completos
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Al cargar la app
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Modificamos login para que acepte datos o fuerce recarga
  const login = async (userData = null) => {
    if (userData) {
        setUser(userData);
    } else {
        // Si no pasamos datos, forzamos una petición al servidor para traer permisos frescos
        await checkSession(); 
    }
  };

const logout = async () => {
    try {
      // 1. Avisar al backend (destruir cookie)
      await apiCall('/users/logout', 'POST'); 
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    } finally {
      // 2. LIMPIEZA TOTAL DEL NAVEGADOR
      // Esto asegura que el próximo usuario encuentre la caja vacía
      localStorage.removeItem('caja_carrito');
      localStorage.removeItem('caja_cliente');
      
      // 3. Limpiar estado de usuario
      setUser(null);
    }
  };

  const hasPermission = (permisoRequerido) => {
    if (!user) return false;
    if (user.rolId === 1) return true; 
    return user.permisos?.includes(permisoRequerido);
  };

  return (
    // Exportamos checkSession como 'refreshProfile' para usarlo en el Login
    <AuthContext.Provider value={{ user, login, logout, hasPermission, loading, refreshProfile: checkSession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);