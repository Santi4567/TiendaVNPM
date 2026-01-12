import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const Clientes = () => {
  const { hasPermission } = useAuth(); // Hook de seguridad

  // Estados para clientes
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  
  // Estados para cuentas
  const [todasLasCuentas, setTodasLasCuentas] = useState([]);
  const [cuentasCliente, setCuentasCliente] = useState([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);

  // Estados para mensajes (Feedback)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Función para mostrar mensajes temporales
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 4000);
  };

  // --- API CALLS ---

  // 1. Buscar clientes (para filtrar)
  const buscarClientes = async (termino) => {
    if (!termino.trim()) {
      setClientesFiltrados([]);
      return;
    }

    setCargandoClientes(true);
    try {
      // Usamos el endpoint de búsqueda de clientes
      const response = await apiCall(`/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
      // apiCall devuelve { status, data }. Si data es array, úsalo directamente.
      setClientesFiltrados(response.data || []);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCargandoClientes(false);
    }
  };

  // 2. Obtener todas las cuentas (Reporte General)
  const obtenerTodasLasCuentas = async () => {
    if (!hasPermission('view.debt')) return;

    setCargandoCuentas(true);
    try {
      const response = await apiCall('/api/cuentas/todas');
      setTodasLasCuentas(response.data || []);
    } catch (error) {
      console.error('Error obteniendo cuentas:', error);
      mostrarMensaje('error', 'Error al cargar el reporte de cuentas');
    } finally {
      setCargandoCuentas(false);
    }
  };

  // 3. Obtener cuentas de un cliente específico
  const obtenerCuentasCliente = async (clienteId) => {
    if (!hasPermission('view.debt')) return;

    setCargandoCuentas(true);
    try {
      const response = await apiCall(`/api/cuentas/cliente/${clienteId}`);
      setCuentasCliente(response.data || []);
    } catch (error) {
      console.error('Error obteniendo cuentas del cliente:', error);
      mostrarMensaje('error', 'Error al cargar las cuentas del cliente');
    } finally {
      setCargandoCuentas(false);
    }
  };

  // 4. Saldar Deuda (Requiere permiso settle.debt)
  const saldarDeuda = async () => {
    if (!clienteSeleccionado) {
      mostrarMensaje('error', 'Debe seleccionar un cliente');
      return;
    }

    // Verificar Permiso
    if (!hasPermission('settle.debt')) {
      mostrarMensaje('error', 'No tienes permiso para cobrar deudas.');
      return;
    }

    const confirmar = window.confirm(
      `¿Saldar la deuda de ${clienteSeleccionado.Nombre}?\n` +
      `Total: $${calcularTotal(cuentasCliente)}\n` +
      `Esta acción moverá los registros a Ventas.`
    );

    if (!confirmar) return;

    try {
      const response = await apiCall('/api/cuentas/saldar', 'POST', {
        clienteId: clienteSeleccionado.ID
      });

      if (response.data.success) {
        mostrarMensaje('success', `Deuda saldada. Registros movidos a ventas: ${response.data.registros_venta}`);
        limpiarSeleccion();
        obtenerTodasLasCuentas(); // Recargar la lista general
      } else {
        mostrarMensaje('error', response.data.error || 'Error al saldar');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión al saldar deuda');
    }
  };

  // 5. Eliminar Registro Individual (Corrección - Requiere update.debt)
  const eliminarRegistro = async (idCuenta, nombreProducto) => {
    if (!hasPermission('update.debt')) return;

    const confirmar = window.confirm(`¿Eliminar el cargo de "${nombreProducto}" de la cuenta?`);
    if (!confirmar) return;

    try {
      const response = await apiCall(`/api/cuentas/eliminar/${idCuenta}`, 'DELETE');

      if (response.data.success) {
        mostrarMensaje('success', 'Cargo eliminado correctamente');
        // Recargar la lista según el contexto (cliente seleccionado o general)
        if (clienteSeleccionado) {
          obtenerCuentasCliente(clienteSeleccionado.ID);
        } else {
          obtenerTodasLasCuentas();
        }
      } else {
        mostrarMensaje('error', response.data.error || 'Error al eliminar cargo');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    }
  };

  // --- EFECTOS ---

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaCliente) buscarClientes(busquedaCliente);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  // Carga inicial
  useEffect(() => {
    obtenerTodasLasCuentas();
  }, []);

  // --- HELPERS ---

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
    obtenerCuentasCliente(cliente.ID);
  };

  const limpiarSeleccion = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
    setCuentasCliente([]);
    obtenerTodasLasCuentas(); // Volver a cargar la lista general
  };

  const calcularTotal = (cuentas) => {
    if (!cuentas) return '0.00';
    return cuentas.reduce((total, cuenta) => total + parseFloat(cuenta.Precio), 0).toFixed(2);
  };

  // Determinar qué lista mostrar
  const cuentasAMostrar = clienteSeleccionado ? cuentasCliente : todasLasCuentas;


  // --- RENDER ---

  // Protección de Vista General
  if (!hasPermission('view.debt')) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">
            No tienes permisos para ver el módulo de Cuentas y Deudas.
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuentas (Fiado)</h1>
        </div>

        {/* Mensajes Flotantes */}
        {mensaje.texto && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* --- BUSCADOR Y PANEL DE CLIENTE --- */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filtrar por Cliente</h2>
          
          {clienteSeleccionado ? (
            // Panel de Cliente Seleccionado
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">Cliente</p>
                  <p className="text-2xl font-bold text-blue-900">{clienteSeleccionado.Nombre}</p>
                  <div className="mt-2 flex items-center gap-2">
                     <span className="text-gray-600">Total Pendiente:</span>
                     <span className={`text-xl font-bold ${parseFloat(calcularTotal(cuentasCliente)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${calcularTotal(cuentasCliente)}
                     </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {/* Botón SALDAR: Solo si hay deuda y permiso */}
                  {parseFloat(calcularTotal(cuentasCliente)) > 0 && hasPermission('settle.debt') && (
                    <button
                      onClick={saldarDeuda}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Saldar Deuda Total
                    </button>
                  )}
                  
                  <button
                    onClick={limpiarSeleccion}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Ver Todos
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Buscador
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el nombre del cliente..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setMostrarResultadosCliente(e.target.value.length > 0);
                }}
                className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Lista desplegable de resultados */}
              {mostrarResultadosCliente && busquedaCliente && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => (
                      <button
                        key={cliente.ID}
                        onClick={() => seleccionarCliente(cliente)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center group"
                      >
                        <span className="font-medium text-gray-900 group-hover:text-blue-700">{cliente.Nombre}</span>
                        <span className="text-xs text-gray-400">ID: {cliente.ID}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      {cargandoClientes ? 'Buscando...' : 'No se encontraron clientes'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- TABLA DE CUENTAS --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {clienteSeleccionado ? `Detalle de Deuda: ${clienteSeleccionado.Nombre}` : 'Reporte General de Deudas'}
            </h2>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {cuentasAMostrar.length} registros
            </span>
          </div>
          
          {cargandoCuentas ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando cuentas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-3 text-left">ID</th>
                    {!clienteSeleccionado && <th className="px-6 py-3 text-left">Cliente</th>}
                    <th className="px-6 py-3 text-left">Producto</th>
                    <th className="px-6 py-3 text-right">Precio</th>
                    <th className="px-6 py-3 text-center">Fecha</th>
                    {/* Columna Acciones solo si tiene permiso de corregir */}
                    {hasPermission('update.debt') && <th className="px-6 py-3 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cuentasAMostrar.length > 0 ? (
                    cuentasAMostrar.map(cuenta => (
                      <tr key={cuenta.ID} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">#{cuenta.ID}</td>
                        {!clienteSeleccionado && (
                            <td className="px-6 py-4 font-medium text-gray-900">{cuenta.NombreCliente || cuenta.Cliente}</td>
                        )}
                        <td className="px-6 py-4 text-gray-800">{cuenta.NombreProducto || cuenta.Producto}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          ${parseFloat(cuenta.Precio).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500">
                          {new Date(cuenta.Fecha).toLocaleDateString('es-ES')}
                        </td>
                        
                        {/* Botón de Eliminar Individual (Corrección) */}
                        {hasPermission('update.debt') && (
                            <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => eliminarRegistro(cuenta.ID, cuenta.NombreProducto || cuenta.Producto)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                                    title="Eliminar registro (Corrección)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={hasPermission('update.debt') ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                        {clienteSeleccionado 
                          ? 'Este cliente está al corriente de sus pagos.' 
                          : 'No hay deudas registradas en el sistema.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Footer con Totales */}
          {cuentasAMostrar.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <div className="text-right">
                <span className="text-gray-600 mr-2">Total Adeudado:</span>
                <span className="text-2xl font-bold text-red-600">${calcularTotal(cuentasAMostrar)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;