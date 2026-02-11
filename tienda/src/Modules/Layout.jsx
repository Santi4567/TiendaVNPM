import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.rolId === 1;

  // --- LÓGICA DE VISIBILIDAD (SEGÚN TU LISTA) ---
  const canViewCaja = hasPermission('create.sale');
  
  const canViewClientes = hasPermission('view.client');
  const canViewCuentas = hasPermission('view.debt');
  const showGroupClientes = canViewClientes || canViewCuentas;

  const canViewProductos = hasPermission('view.product');
  const canViewAlertas = hasPermission('view.alerts');
  const canViewAlmacen = hasPermission('view.cupboard');
  const showGroupInventario = canViewProductos || canViewAlertas || canViewAlmacen;

  const canViewLibros = hasPermission('view.book'); // Aplica para todo el grupo librería
  
  const canViewHistorico = hasPermission('view.report');
  const canViewReporte = isAdmin; // Solo Admin
  const canViewUsuarios = isAdmin; // Solo Admin
  const showGroupAdmin = canViewHistorico || canViewReporte || canViewUsuarios;


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      
      {/* --- HEADER --- */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            
            {/* LOGO */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex flex-col leading-tight">
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                  Gestion VNPM
                </span>
              </Link>
            </div>

            {/* --- MENÚ DE ESCRITORIO (AGRUPADO) --- */}
            <div className="hidden xl:flex items-center space-x-1">
              
              {/* 1. CAJA (Solo si tiene create.sale) */}
              {canViewCaja && (
                <NavItem to="/caja" active={isActive('/caja')} icon="🛒">Caja</NavItem>
              )}
              
              {/* 2. CLIENTES & CREDITOS */}
              {showGroupClientes && (
                <NavDropdown title="Clientes" icon="👥">
                   {canViewClientes && <DropdownItem to="/clientes">Clientes</DropdownItem>}
                   {canViewCuentas && <DropdownItem to="/cuentas">Cuentas</DropdownItem>}
                </NavDropdown>
              )}

              {/* 3. INVENTARIO */}
              {showGroupInventario && (
                <NavDropdown title="Inventario" icon="📦">
                  {canViewProductos && <DropdownItem to="/productos">Productos</DropdownItem>}
                  {canViewAlertas && <DropdownItem to="/alertas">Alertas</DropdownItem>}
                  {canViewAlmacen && <DropdownItem to="/almacen">Almacén</DropdownItem>}
                </NavDropdown>
              )}

              {/* 4. LIBRERÍA (Todo con view.book) */}
              {canViewLibros && (
                <NavDropdown title="Librería" icon="📚">
                  <DropdownItem to="/libreriacaja">Caja Libros</DropdownItem>
                  <DropdownItem to="/libros">Catálogo Libros</DropdownItem>
                  <DropdownItem to="/libreriahistorico">Libros Histórico</DropdownItem>
                </NavDropdown>
              )}

              {/* 5. ADMINISTRACIÓN */}
              {showGroupAdmin && (
                <NavDropdown title="Admin" icon="📊">
                  {canViewReporte && <DropdownItem to="/reporte">Reporte Ventas</DropdownItem>}
                  {canViewHistorico && <DropdownItem to="/historico">Histórico General</DropdownItem>}
                  {canViewUsuarios && <DropdownItem to="/usuarios">Usuarios</DropdownItem>}
                </NavDropdown>
              )}

            </div>

            {/* PERFIL Y LOGOUT */}
            <div className="hidden xl:flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{user?.nombre || user?.usuario}</p>
                <p className="text-xs text-gray-500 uppercase">{user?.rolId === 1 ? 'Administrador' : 'Usuario'}</p>
              </div>
              <button 
                onClick={logout}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Salir
              </button>
            </div>

            {/* BOTÓN MENÚ MÓVIL */}
            <div className="flex items-center xl:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 hover:text-blue-600 p-2">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* --- MENÚ MÓVIL (Respeta los mismos permisos) --- */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 z-50 animate-fade-in-down max-h-[80vh] overflow-y-auto">
            <div className="px-4 pt-4 pb-6 space-y-2">
              
              {canViewCaja && <MobileLink to="/caja" onClick={() => setMobileMenuOpen(false)}>Caja</MobileLink>}
              
              {(canViewClientes || canViewCuentas) && <div className="border-t my-2"></div>}
              {canViewClientes && <MobileLink to="/clientes" onClick={() => setMobileMenuOpen(false)}>Clientes</MobileLink>}
              {canViewCuentas && <MobileLink to="/cuentas" onClick={() => setMobileMenuOpen(false)}>Cuentas</MobileLink>}
              
              {canViewLibros && (
                <>
                  <div className="border-t my-2"></div>
                  <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Librería</p>
                  <MobileLink to="/libreriacaja" onClick={() => setMobileMenuOpen(false)}>Caja Libros</MobileLink>
                  <MobileLink to="/libros" onClick={() => setMobileMenuOpen(false)}>Libros</MobileLink>
                  <MobileLink to="/libreriahistorico" onClick={() => setMobileMenuOpen(false)}>Libros Histórico</MobileLink>
                </>
              )}
              
              {showGroupInventario && (
                <>
                  <div className="border-t my-2"></div>
                  <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Inventario</p>
                  {canViewProductos && <MobileLink to="/productos" onClick={() => setMobileMenuOpen(false)}>Productos</MobileLink>}
                  {canViewAlertas && <MobileLink to="/alertas" onClick={() => setMobileMenuOpen(false)}>Alertas</MobileLink>}
                  {canViewAlmacen && <MobileLink to="/almacen" onClick={() => setMobileMenuOpen(false)}>Almacén</MobileLink>}
                </>
              )}

              {showGroupAdmin && (
                <>
                  <div className="border-t my-2"></div>
                  <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Admin</p>
                  {canViewReporte && <MobileLink to="/reporte" onClick={() => setMobileMenuOpen(false)}>Reporte</MobileLink>}
                  {canViewHistorico && <MobileLink to="/historico" onClick={() => setMobileMenuOpen(false)}>Histórico</MobileLink>}
                  {canViewUsuarios && <MobileLink to="/usuarios" onClick={() => setMobileMenuOpen(false)}>Usuarios</MobileLink>}
                </>
              )}
              
              <div className="border-t my-2 pt-2">
                <button onClick={logout} className="w-full text-left px-3 py-3 text-red-600 font-bold bg-red-50 rounded-lg">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const NavItem = ({ to, active, icon, children }) => (
  <Link 
    to={to} 
    className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
      active 
      ? 'bg-blue-100 text-blue-700 shadow-sm' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <span className="mr-2">{icon}</span>
    {children}
  </Link>
);

const NavDropdown = ({ title, icon, children }) => {
    return (
        <div className="relative group px-2">
            <button className="flex items-center px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
                <span className="mr-2">{icon}</span>
                {title}
                <svg className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="py-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

const DropdownItem = ({ to, children }) => (
    <Link to={to} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
        {children}
    </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="block px-3 py-3 rounded-lg text-base font-bold text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
  >
    {children}
  </Link>
);

export default Layout;