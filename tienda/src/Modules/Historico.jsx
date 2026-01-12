import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const HistoricoVentas = () => {
  const { hasPermission } = useAuth(); 

  // --- ESTADOS ---
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoTotal, setCargandoTotal] = useState(false);
  
  // Estados para fecha
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [esHoy, setEsHoy] = useState(true);
  
  // Estados para mensajes
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Función para obtener fecha actual local
  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset(); 
    const fechaLocal = new Date(hoy.getTime() - (offset*60*1000));
    return fechaLocal.toISOString().split('T')[0];
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 3000);
  };

  // --- API CALLS ---

  const cargarVentas = async (fecha) => {
    if (!hasPermission('view.report')) return;

    setCargando(true);
    try {
      const hoy = obtenerFechaHoy();
      const esFechaHoy = fecha === hoy;
      const endpoint = esFechaHoy ? '/ventas/hoy' : `/ventas/fecha/${fecha}`;
      
      const response = await apiCall(endpoint);
      const data = response.data || [];
      
      // DEBUG: Para ver en consola qué propiedades llegan realmente
      console.log("Datos de Ventas recibidos:", data); 
      
      setVentas(data);
      setEsHoy(esFechaHoy);

    } catch (error) {
      console.error('Error cargando ventas:', error);
      mostrarMensaje('error', 'Error al cargar el listado de ventas');
    } finally {
      setCargando(false);
    }
  };

  const cargarTotales = async (fecha) => {
    if (!hasPermission('view.report')) return;

    setCargandoTotal(true);
    try {
      const hoy = obtenerFechaHoy();
      const esFechaHoy = fecha === hoy;
      const endpoint = esFechaHoy ? '/ventas/total/hoy' : `/ventas/total/${fecha}`;
      
      const response = await apiCall(endpoint);
      setTotalVentas(response.data || null);

    } catch (error) {
      console.error('Error cargando totales:', error);
      mostrarMensaje('error', 'Error al calcular totales');
    } finally {
      setCargandoTotal(false);
    }
  };

  // --- HANDLERS ---

  const manejarCambioFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    setMostrarCalendario(false);
    cargarVentas(nuevaFecha);
    cargarTotales(nuevaFecha);
  };

  const volverAHoy = () => {
    const hoy = obtenerFechaHoy();
    setFechaSeleccionada(hoy);
    setMostrarCalendario(false);
    cargarVentas(hoy);
    cargarTotales(hoy);
  };

  // --- FORMATTERS ---

  const formatearFechaDisplay = (fecha) => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    const dateObj = new Date(year, month - 1, day);
    
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearFechaHora = (fechaHora) => {
    return new Date(fechaHora).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calcularTotalTabla = () => {
    return ventas.reduce((total, venta) => total + Number(venta.Precio || 0), 0);
  };

  // Carga inicial
  useEffect(() => {
    const hoy = obtenerFechaHoy();
    setFechaSeleccionada(hoy);
    if (hasPermission('view.report')) {
      cargarVentas(hoy);
      cargarTotales(hoy);
    }
  }, []);

  // --- RENDER ---

  if (!hasPermission('view.report')) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">
            No tienes permisos para ver los reportes históricos.
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
            <p className="text-gray-500 mt-1">
              {esHoy ? 'Resumen de operaciones del día' : 'Consulta de historial'}
            </p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2"
          >
            Imprimir Reporte
          </button>
        </div>

        {mensaje.texto && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* CONTROLES DE FECHA */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Fecha Visualizada
              </h2>
              <p className="text-xl font-bold text-blue-900 capitalize flex items-center gap-2">
                {formatearFechaDisplay(fechaSeleccionada)}
                {esHoy && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">HOY</span>}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {!esHoy && (
                <button
                  onClick={volverAHoy}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver a Hoy
                </button>
              )}
              <div className="relative">
                <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={manejarCambioFecha}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TARJETAS DE TOTALES (KPIs) */}
        {totalVentas && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Tarjeta 1: Dinero */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                  <span className="text-xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Number(totalVentas?.totalVentas || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Items */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                  <span className="text-xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Items Vendidos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalVentas?.totalRegistros || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Productos */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                   <span className="text-xl">🏷️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Prod. Distintos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalVentas?.productosVendidos || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 4: Clientes */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-orange-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full">
                   <span className="text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalVentas?.clientesAtendidos || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLA DE VENTAS */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              Detalle de Movimientos ({ventas.length})
            </h2>
            {cargando && <span className="text-sm text-blue-600 animate-pulse">Actualizando...</span>}
          </div>
          
          {cargando && ventas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Cargando datos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Hora</th>
                      <th className="px-4 py-3 text-left font-bold">Producto</th>
                      <th className="px-4 py-3 text-left font-bold">Cliente</th>
                      <th className="px-4 py-3 text-right font-bold">Precio</th>
                      <th className="px-4 py-3 text-left font-bold text-xs">ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventas.length > 0 ? (
                      ventas.map((venta) => (
                        <tr key={venta.ID} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono">
                            {formatearFechaHora(venta.Fecha)}
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            <div className="max-w-xs truncate" title={venta.NombreProducto || venta.Producto}>
                                {/* AQUI ESTABA EL PROBLEMA: Buscamos todas las posibles variantes */}
                                {venta.Producto_Snapshot || venta.NombreProducto || venta.Producto || "Sin Nombre"}
                            </div>
                            {venta.CodigoProducto && (
                                <span className="text-xs text-gray-400">{venta.CodigoProducto}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {venta.NombreCliente || <span className="text-gray-400 italic">Público General</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-green-700">
                            ${Number(venta.Precio).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                            #{venta.ID}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No hay ventas registradas en este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Footer Total Tabla */}
          {ventas.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="text-xs text-gray-500">
                  * Mostrando últimos {ventas.length} registros
               </div>
               <div className="text-right">
                  <p className="text-xl text-gray-800">
                    Total en Tabla: <span className="font-bold text-green-600">${calcularTotalTabla().toFixed(2)}</span>
                  </p>
                  
                  {totalVentas && Math.abs(Number(totalVentas.totalVentas) - calcularTotalTabla()) > 0.01 && (
                     <p className="text-sm text-blue-600 mt-1">
                        Total completo del día (Backend): <span className="font-semibold">${Number(totalVentas?.totalVentas || 0).toFixed(2)}</span>
                     </p>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricoVentas;