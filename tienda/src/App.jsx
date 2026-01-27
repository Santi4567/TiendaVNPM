import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './PrivateRoute';
import Layout from './Modules/Layout';
import Login from './Modules/Login';

// Componentes
import Cuentas from './Modules/Clientes.jsx';
import Caja from './Modules/Caja.jsx';
import Clientes from './Modules/CRUDClientes.jsx';
import Productos from './Modules/Productos.jsx';
import Historico from './Modules/Historico.jsx';
import Dashboard from './Modules/Dashboard.jsx'; 
import Usuarios from './Modules/Usuarios.jsx'; 
import Alertas from './Modules/Alertas.jsx'; 

//Libreria
import Libros from './Modules/Libros.jsx'; 
import CajaLibros from './Modules/CajaLibreria.jsx'; 
import HistorialLibros from './Modules/HistorialLibreria.jsx'; 

//Cuadro de notificaciones 
import { NotificationProvider } from './context/NotificationContext';

import './App.css';

// Componente de seguridad exclusiva para Admin
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Si user es null (aún no carga) o no es rol 1, fuera.
  // Nota: PrivateRoute ya valida que exista 'user', así que aquí solo validamos el rol.
  if (user?.rolId !== 1) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Ruta Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas Protegidas (Requieren Login) */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              
              {/* Rutas Generales (Accesibles según lógica interna o permisos base) */}
              <Route path="/" element={<Caja />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rutas con Permisos Específicos */}
              <Route 
                path="/clientes" 
                element={
                  <PrivateRoute permiso="view.client">
                    <Clientes />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/cuentas" 
                element={
                  <PrivateRoute permiso="view.debt">
                    <Cuentas />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/productos" 
                element={
                  <PrivateRoute permiso="view.product">
                    <Productos />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/historico" 
                element={
                  <PrivateRoute permiso="view.report">
                    <Historico />
                  </PrivateRoute>
                } 
              />

              {/* --- RUTA EXCLUSIVA DE ADMIN --- */}
              <Route 
                path="/usuarios" 
                element={
                  <AdminRoute>
                    <Usuarios />  {/* <--- Componente real conectado a la API */}
                  </AdminRoute>
                } 
              />

              <Route 
                path="/alertas" 
                element={
                  <PrivateRoute permiso="view.product">
                    <Alertas />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/libros" 
                element={
                  <PrivateRoute permiso="view.book">
                    <Libros />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/libreriacaja" 
                element={
                  <PrivateRoute permiso="view.book">
                    <CajaLibros />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/libreriahistorico" 
                element={
                  <PrivateRoute permiso="view.book">
                    <HistorialLibros />
                  </PrivateRoute>
                } 
              />

            </Route>
            
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;