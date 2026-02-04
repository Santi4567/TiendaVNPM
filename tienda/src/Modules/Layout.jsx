import { Outlet } from 'react-router-dom';
import Header from './Header'; // Asegúrate de importar tu nuevo Header

const Layout = () => {
  return (
    <div className="min-h-screen ">
      {/* El Header ya contiene toda la lógica de navegación y logout */}
      <Header />

      {/* Contenido principal de las páginas */}
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;