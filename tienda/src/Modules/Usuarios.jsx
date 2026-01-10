import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api'; // Tu helper de API

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      // Asumimos que tienes un endpoint GET /users que devuelve la lista
      // Si no lo tienes, el endpoint devolverá 404 y caerá en el error.
      const response = await apiCall('/api/users'); 
      
      // Ajusta esto según cómo devuelva los datos tu backend
      // Si devuelve { success: true, data: [...] } usa response.data.data
      // Si devuelve directo el array [...] usa response.data
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  // 2. Lógica de filtrado (Buscador)
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termino = busqueda.toLowerCase();
    // Buscamos por Nombre o por Username
    return (
        usuario.Nombre_Completo?.toLowerCase().includes(termino) ||
        usuario.Usuario?.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        
        {/* Barra de Búsqueda */}
        <div className="relative w-full md:w-1/3">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </span>
            <input
                type="text"
                placeholder="Buscar por nombre o usuario..."
                className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
        </div>
      </div>

      {/* Mensajes de Estado */}
      {loading && <div className="text-center py-10 text-blue-600">Cargando usuarios...</div>}
      {error && <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">{error}</div>}

      {/* Tabla de Resultados */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((user) => (
                  <tr key={user.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.Usuario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.Nombre_Completo || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.ID_Rol === 1 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                            {user.ID_Rol === 1 ? 'Administrador' : 'Vendedor'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                      <button className="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    No se encontraron usuarios que coincidan con "{busqueda}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Usuarios;