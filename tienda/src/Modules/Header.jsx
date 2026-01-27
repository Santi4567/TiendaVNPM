import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth(); // Usamos los datos reales
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Definimos TODAS las opciones posibles
  const allNavItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      // Si quieres que todos vean el dashboard, pon 'public: true' o una validación simple
      visible: true 
    },
    { 
      name: 'Caja', 
      path: '/', 
      // Visible si puede crear ventas
      visible: hasPermission('create.sale') 
    },
    { 
      name: 'Clientes', 
      path: '/clientes', // Corregí la ruta
      // Visible si puede ver clientes (usa el permiso exacto de tu BD)
      visible: hasPermission('view.client') 
    },
    {
      name: 'Cuentas', 
      path: '/cuentas', // Corregí la ruta
      // Visible si puede ver clientes (usa el permiso exacto de tu BD)
      visible: hasPermission('view.debt') 
    },
    { 
      name: 'Productos', 
      path: '/productos', 
      visible: hasPermission('view.product') 
    },
    { 
      name: 'Histórico', 
      path: '/historico', 
      visible: hasPermission('view.report') 
    },
    { 
      name: 'Usuarios', 
      path: '/usuarios', 
      // Solo el Admin (rolId 1) o quien tenga permiso de ver roles
      visible: user?.rolId === 1 
    },
    { 
      name: 'Alertas', 
      path: '/alertas', 
      visible: hasPermission('view.product') 
    },
    { 
      name: 'Libros', 
      path: '/libros', 
      visible: hasPermission('view.book') 
    },
  ];

  // 2. Filtramos: Solo dejamos las que tengan visible = true
  const navigationItems = allNavItems.filter(item => item.visible);

  return (
    <header className="bg-white shadow-lg border-b-2 border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo/Título */}
          <div className="flex items-center">
            <NavLink
              to="/"
              className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Tienda VNPM
            </NavLink>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex space-x-4 items-center">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {/* Sección de Usuario y Salir (Desktop) */}
            <div className="ml-4 flex items-center border-l pl-4 border-gray-300">
                <div className="flex flex-col mr-4 text-right">
                    <span className="text-sm font-bold text-gray-800">{user?.nombre || user?.usuario}</span>
                    <span className="text-xs text-gray-500">{user?.rolId === 1 ? 'Administrador' : 'Usuario'}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                    Salir
                </button>
            </div>
          </nav>

          {/* Botón menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil (Desplegable) */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              
              {/* Botón Salir en Móvil */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;