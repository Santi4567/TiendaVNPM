import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // <--- 1. Importar Hook
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal'; // <--- 2. Importar Modal

const GestionClientes = () => {
  const { hasPermission } = useAuth(); 
  const { notify } = useNotification(); // <--- 3. Usar Hook

  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');
  
  // Estados para selección
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estado para el Modal de Confirmación
  const [confirmModal, setConfirmModal] = useState({ 
      isOpen: false, 
      action: null, 
      title: '', 
      message: '', 
      tipo: 'danger' 
  });

  // 1. Cargar todos los clientes
  const cargarClientes = async () => {
    if (!hasPermission('view.client')) return;

    setCargando(true);
    try {
      const response = await apiCall('/api/clientes/todos');
      const data = response.data || [];
      setClientes(data);
      setClientesFiltrados(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      notify('Error al cargar los clientes', 'error');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar clientes por búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setClientesFiltrados(clientes);
    } else {
      const filtrados = clientes.filter(cliente =>
        cliente.Nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setClientesFiltrados(filtrados);
    }
  }, [busqueda, clientes]);

  // Cargar al montar
  useEffect(() => {
    cargarClientes();
  }, []);

  // Acciones del formulario
  const abrirFormularioAgregar = () => {
    setMostrarFormulario(true);
    setModoEdicion(false);
    setNombreCliente('');
    setClienteEditando(null);
    setClienteSeleccionado(null);
  };

  const abrirFormularioEditar = (cliente) => {
    setMostrarFormulario(true);
    setModoEdicion(true);
    setNombreCliente(cliente.Nombre);
    setClienteEditando(cliente);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setNombreCliente('');
    setClienteEditando(null);
    setClienteSeleccionado(null);
  };

  // 2. Manejar envío (Crear / Editar)
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!nombreCliente.trim()) {
      notify('El nombre del cliente es requerido', 'error');
      return;
    }

    try {
      const endpoint = modoEdicion 
        ? `/api/clientes/editar/${clienteEditando.ID}`
        : `/api/clientes/agregar`;
      
      const method = modoEdicion ? 'PUT' : 'POST';

      const response = await apiCall(endpoint, method, {
        nombre: nombreCliente.trim()
      });

      if (response.data.success) {
        notify(response.data.mensaje, 'success');
        cerrarFormulario();
        cargarClientes();
      } else {
        notify(response.data.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      notify('Error de conexión al guardar cliente', 'error');
    }
  };

  // 3. Eliminar cliente (CON MODAL)
  const solicitarEliminar = (cliente) => {
    setConfirmModal({
        isOpen: true,
        title: '¿Eliminar Cliente?',
        message: `¿Estás seguro de eliminar a "${cliente.Nombre}"? Esta acción no se puede deshacer.`,
        tipo: 'danger',
        action: () => ejecutarEliminar(cliente.ID)
    });
  };

  const ejecutarEliminar = async (id) => {
    try {
      const response = await apiCall(`/api/clientes/eliminar/${id}`, 'DELETE');

      if (response.data.success) {
        notify(response.data.mensaje, 'success');
        setClienteSeleccionado(null);
        cargarClientes();
      } else {
        notify(response.data.error || 'Error al eliminar', 'error');
      }
    } catch (error) {
      console.error('Error eliminando:', error);
      notify('Error de conexión al eliminar', 'error');
    } finally {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // --- RENDER ---
  
  if (!hasPermission('view.client')) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">
            No tienes permisos para gestionar la cartera de clientes.
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        </div>

        {/* FORMULARIO */}
        {mostrarFormulario ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modoEdicion ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
            </h2>
            
            <form onSubmit={manejarEnvio}>
              <div className="mb-4">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Ingrese el nombre del cliente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* BARRA SUPERIOR: Buscador y Agregar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              
              {/* Botón AGREGAR */}
              {hasPermission('add.client') && (
                <button
                  onClick={abrirFormularioAgregar}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Agregar Cliente</span>
                </button>
              )}
            </div>

            {/* PANEL DE ACCIONES: Editar/Eliminar */}
            {clienteSeleccionado && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in-down">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">Cliente seleccionado:</p>
                    <p className="text-blue-700 text-lg font-bold">{clienteSeleccionado.Nombre}</p>
                  </div>
                  <div className="flex space-x-3">
                    
                    {/* Botón EDITAR */}
                    {hasPermission('update.client') && (
                        <button
                        onClick={() => abrirFormularioEditar(clienteSeleccionado)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium flex items-center space-x-1"
                        >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                        </button>
                    )}

                    {/* Botón ELIMINAR (Con Modal) */}
                    {hasPermission('delete.client') && (
                        <button
                        onClick={() => solicitarEliminar(clienteSeleccionado)} // <--- CAMBIADO
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-1"
                        >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                        </button>
                    )}

                    <button
                      onClick={() => setClienteSeleccionado(null)}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA DE CLIENTES */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Lista de Clientes ({clientesFiltrados.length})
                </h2>
              </div>
              
              {cargando ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando clientes...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                          <tr 
                            key={cliente.ID} 
                            className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                              clienteSeleccionado?.ID === cliente.ID ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => setClienteSeleccionado(cliente)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{cliente.ID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {cliente.Nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {clienteSeleccionado?.ID === cliente.ID ? (
                                <span className="text-blue-600 font-bold">● Seleccionado</span>
                              ) : (
                                <span className="text-gray-300">○</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                            {busqueda ? 'No se encontraron clientes con ese nombre' : 'No hay clientes registrados'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* COMPONENTE MODAL DE CONFIRMACIÓN */}
      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.action}
          title={confirmModal.title}
          message={confirmModal.message}
          tipo={confirmModal.tipo}
      />
    </div>
  );
};

export default GestionClientes;