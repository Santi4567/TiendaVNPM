import { useState, useEffect } from 'react';
import Header from './Header';

const GestionClientes = () => {
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
  
  // Estados para mensajes
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar todos los clientes
  const cargarClientes = async () => {
    setCargando(true);
    try {
      const response = await fetch('http://localhost:3001/api/clientes/todos');
      const clientesData = await response.json();
      setClientes(clientesData);
      setClientesFiltrados(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      mostrarMensaje('error', 'Error al cargar los clientes');
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

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  // Función para mostrar mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 3000);
  };

  // Abrir formulario para agregar
  const abrirFormularioAgregar = () => {
    setMostrarFormulario(true);
    setModoEdicion(false);
    setNombreCliente('');
    setClienteEditando(null);
    setClienteSeleccionado(null);
  };

  // Abrir formulario para editar
  const abrirFormularioEditar = (cliente) => {
    setMostrarFormulario(true);
    setModoEdicion(true);
    setNombreCliente(cliente.Nombre);
    setClienteEditando(cliente);
  };

  // Cerrar formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setNombreCliente('');
    setClienteEditando(null);
    setClienteSeleccionado(null);
  };

  // Manejar envío del formulario
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!nombreCliente.trim()) {
      mostrarMensaje('error', 'El nombre del cliente es requerido');
      return;
    }

    try {
      const url = modoEdicion 
        ? `http://localhost:3001/api/clientes/editar/${clienteEditando.ID}`
        : 'http://localhost:3001/api/clientes/agregar';
      
      const method = modoEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombreCliente.trim()
        })
      });

      const resultado = await response.json();

      if (resultado.success) {
        mostrarMensaje('success', resultado.mensaje);
        cerrarFormulario();
        cargarClientes();
      } else {
        mostrarMensaje('error', resultado.error);
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      mostrarMensaje('error', 'Error de conexión al guardar cliente');
    }
  };

  // Eliminar cliente
  const eliminarCliente = async (cliente) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar al cliente "${cliente.Nombre}"?\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`http://localhost:3001/api/clientes/eliminar/${cliente.ID}`, {
        method: 'DELETE'
      });

      const resultado = await response.json();

      if (resultado.success) {
        mostrarMensaje('success', resultado.mensaje);
        setClienteSeleccionado(null);
        cargarClientes();
      } else {
        mostrarMensaje('error', resultado.error);
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      mostrarMensaje('error', 'Error de conexión al eliminar cliente');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {modoEdicion ? 'Actualizar Cliente' : 'Agregar Cliente'}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Buscador y botón agregar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              
              {/* Botón agregar */}
              <button
                onClick={abrirFormularioAgregar}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Agregar Cliente</span>
              </button>
            </div>

            {/* Botones de acción para cliente seleccionado */}
            {clienteSeleccionado && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">Cliente seleccionado:</p>
                    <p className="text-blue-700 text-lg">{clienteSeleccionado.Nombre}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => abrirFormularioEditar(clienteSeleccionado)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center space-x-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => eliminarCliente(clienteSeleccionado)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
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

            {/* Tabla de clientes */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  <table className="w-full  text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                          <tr 
                            key={cliente.ID} 
                            className={`hover:bg-gray-50 cursor-pointer ${
                              clienteSeleccionado?.ID === cliente.ID ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => setClienteSeleccionado(cliente)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {cliente.ID}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {cliente.Nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {clienteSeleccionado?.ID === cliente.ID ? (
                                <span className="text-blue-600 font-medium">✓ Seleccionado</span>
                              ) : (
                                <span className="text-gray-400">Hacer clic para seleccionar</span>
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
    </div>
  );
};

export default GestionClientes;