import { useState, useEffect } from 'react';
import Header from './Header';
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3001';

const Clientes = () => {
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

  // Función para buscar clientes
  const buscarClientes = async (termino) => {
    if (!termino.trim()) {
      setClientesFiltrados([]);
      return;
    }

    setCargandoClientes(true);
    try {
      const response = await fetch(`${API_URL}/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
      const clientes = await response.json();
      setClientesFiltrados(clientes);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCargandoClientes(false);
    }
  };

  // Función para obtener todas las cuentas
  const obtenerTodasLasCuentas = async () => {
    setCargandoCuentas(true);
    try {
      const response = await fetch(`${API_URL}/api/cuentas/todas`);
      const cuentas = await response.json();
      setTodasLasCuentas(cuentas);
    } catch (error) {
      console.error('Error obteniendo cuentas:', error);
      setTodasLasCuentas([]);
    } finally {
      setCargandoCuentas(false);
    }
  };

  // Función para obtener cuentas de un cliente específico
  const obtenerCuentasCliente = async (clienteId) => {
    setCargandoCuentas(true);
    try {
      const response = await fetch(`${API_URL}/api/cuentas/cliente/${clienteId}`);
      const cuentas = await response.json();
      setCuentasCliente(cuentas);
    } catch (error) {
      console.error('Error obteniendo cuentas del cliente:', error);
      setCuentasCliente([]);
    } finally {
      setCargandoCuentas(false);
    }
  };

  // Efecto para buscar clientes con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientes(busquedaCliente);
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  // Cargar todas las cuentas al montar el componente
  useEffect(() => {
    obtenerTodasLasCuentas();
  }, []);

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
  };

  // Función para saldar deuda
  const saldarDeuda = async () => {
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente');
      return;
    }

    if (cuentasCliente.length === 0) {
      alert('Este cliente no tiene cuentas pendientes');
      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de saldar la deuda de ${clienteSeleccionado.Nombre}?\n` +
      `Total a saldar: ${calcularTotal(cuentasCliente)}\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/api/cuenta/saldar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.ID
        })
      });

      const resultado = await response.json();

      if (resultado.success) {
        alert(
          `Deuda saldada correctamente.\n` +
          `Cliente: ${clienteSeleccionado.Nombre}\n` +
          `Total pagado: ${calcularTotal(cuentasCliente)}\n` +
          `Registros agregados a ventas: ${resultado.registros_venta}`
        );
        
        // Limpiar selección y recargar datos
        limpiarSeleccion();
        obtenerTodasLasCuentas();
      } else {
        alert('Error al saldar deuda: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error saldando deuda:', error);
      alert('Error de conexión al saldar deuda');
    }
  };

  // Calcular total de precios desde el frontend
  const calcularTotal = (cuentas) => {
    return cuentas.reduce((total, cuenta) => total + parseFloat(cuenta.Precio), 0).toFixed(2);
  };

  const cuentasAMostrar = clienteSeleccionado ? cuentasCliente : todasLasCuentas;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuentas</h1>
        </div>

        {/* Buscador de Clientes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buscar Cliente</h2>
          
          {/* Cliente seleccionado */}
          {clienteSeleccionado && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-green-900">Cliente seleccionado:</p>
                  <p className="text-green-700 text-lg">{clienteSeleccionado.Nombre}</p>
                  <p className="text-green-600 font-bold">
                    Total adeudado: ${calcularTotal(cuentasCliente)}
                  </p>
                  {parseFloat(calcularTotal(cuentasCliente)) === 0 && (
                    <p className="text-green-800 font-bold text-sm mt-1 bg-green-200 px-2 py-1 rounded inline-block">
                      ✓ TODO PAGADO
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  {parseFloat(calcularTotal(cuentasCliente)) > 0 && (
                    <button
                      onClick={saldarDeuda}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Saldar Deuda
                    </button>
                  )}
                  <button
                    onClick={limpiarSeleccion}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Ver Todos
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!clienteSeleccionado && (
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setMostrarResultadosCliente(e.target.value.length > 0);
                }}
                className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {cargandoClientes && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Resultados búsqueda clientes */}
              {mostrarResultadosCliente && busquedaCliente && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => (
                      <button
                        key={cliente.ID}
                        onClick={() => seleccionarCliente(cliente)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 focus:outline-none focus:bg-blue-50"
                      >
                        <p className="font-medium text-gray-900">{cliente.Nombre}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      {cargandoClientes ? 'Buscando clientes...' : 'No se encontraron clientes'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabla de Cuentas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {clienteSeleccionado ? `Cuentas de ${clienteSeleccionado.Nombre}` : 'Todas las Cuentas'}
            </h2>
          </div>
          
          {cargandoCuentas ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando cuentas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 ">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cuentasAMostrar.length > 0 ? (
                    cuentasAMostrar.map(cuenta => (
                      <tr key={cuenta.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cuenta.ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cuenta.NombreCliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cuenta.NombreProducto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ${parseFloat(cuenta.Precio).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(cuenta.Fecha).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cuenta.Estado 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cuenta.Estado ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        {clienteSeleccionado 
                          ? 'Este cliente no tiene cuentas pendientes' 
                          : 'No hay cuentas registradas'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Total */}
          {cuentasAMostrar.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-end">
                <p className="text-xl font-bold text-gray-900">
                  Total: <span className="text-green-600">${calcularTotal(cuentasAMostrar)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;