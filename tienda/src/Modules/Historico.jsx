import { useState, useEffect } from 'react';
import Header from './Header';

const HistoricoVentas = () => {
  // Estados principales
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

  // Función para obtener fecha actual en formato YYYY-MM-DD
  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // Inicializar con fecha actual
  useEffect(() => {
    const hoy = obtenerFechaHoy();
    setFechaSeleccionada(hoy);
    cargarVentasHoy();
    cargarTotalHoy();
  }, []);

  // Función para mostrar mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 3000);
  };

  // Cargar ventas del día actual
  const cargarVentasHoy = async () => {
    setCargando(true);
    try {
      const response = await fetch('http://localhost:3001/api/ventas/hoy');
      const ventasData = await response.json();
      setVentas(ventasData);
      setEsHoy(true);
    } catch (error) {
      console.error('Error cargando ventas de hoy:', error);
      mostrarMensaje('error', 'Error al cargar las ventas de hoy');
    } finally {
      setCargando(false);
    }
  };

  // Cargar total del día actual
  const cargarTotalHoy = async () => {
    setCargandoTotal(true);
    try {
      const response = await fetch('http://localhost:3001/api/ventas/total/hoy');
      const totalData = await response.json();
      setTotalVentas(totalData);
    } catch (error) {
      console.error('Error cargando total de hoy:', error);
      mostrarMensaje('error', 'Error al cargar el total de ventas');
    } finally {
      setCargandoTotal(false);
    }
  };

  // Cargar ventas por fecha específica
  const cargarVentasPorFecha = async (fecha) => {
    setCargando(true);
    try {
      const response = await fetch(`http://localhost:3001/api/ventas/fecha/${fecha}`);
      const ventasData = await response.json();
      setVentas(ventasData);
      
      const hoy = obtenerFechaHoy();
      setEsHoy(fecha === hoy);
    } catch (error) {
      console.error('Error cargando ventas por fecha:', error);
      mostrarMensaje('error', 'Error al cargar las ventas de la fecha seleccionada');
    } finally {
      setCargando(false);
    }
  };

  // Cargar total por fecha específica
  const cargarTotalPorFecha = async (fecha) => {
    setCargandoTotal(true);
    try {
      const response = await fetch(`http://localhost:3001/api/ventas/total/${fecha}`);
      const totalData = await response.json();
      setTotalVentas(totalData);
    } catch (error) {
      console.error('Error cargando total por fecha:', error);
      mostrarMensaje('error', 'Error al cargar el total de la fecha seleccionada');
    } finally {
      setCargandoTotal(false);
    }
  };

  // Manejar cambio de fecha
  const manejarCambioFecha = (fecha) => {
    setFechaSeleccionada(fecha);
    setMostrarCalendario(false);
    cargarVentasPorFecha(fecha);
    cargarTotalPorFecha(fecha);
  };

  // Volver a hoy
  const volverAHoy = () => {
    const hoy = obtenerFechaHoy();
    setFechaSeleccionada(hoy);
    setMostrarCalendario(false);
    cargarVentasHoy();
    cargarTotalHoy();
  };

  // Formatear fecha para mostrar
  const formatearFechaDisplay = (fecha) => {
    const fechaObj = new Date(fecha + 'T00:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha y hora
  const formatearFechaHora = (fechaHora) => {
    return new Date(fechaHora).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calcular total de la tabla (como respaldo si no hay datos del backend)
  const calcularTotalTabla = () => {
    return ventas.reduce((total, venta) => total + parseFloat(venta.Precio || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Ventas</h1>
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

        {/* Selector de fecha */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Fecha actual */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {esHoy ? 'Ventas de Hoy' : 'Ventas del Día Seleccionado'}
              </h2>
              <p className="text-lg text-gray-600 capitalize">
                {formatearFechaDisplay(fechaSeleccionada)}
              </p>
            </div>
            
            {/* Controles */}
            <div className="flex items-center space-x-3">
              {!esHoy && (
                <button
                  onClick={volverAHoy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Hoy</span>
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setMostrarCalendario(!mostrarCalendario)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Seleccionar Fecha</span>
                </button>
                
                {mostrarCalendario && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10">
                    <input
                      type="date"
                      value={fechaSeleccionada}
                      onChange={(e) => manejarCambioFecha(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de ventas */}
        {totalVentas && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Ventas</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {cargandoTotal ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      ) : (
                        `${(totalVentas?.totalVentas || 0).toFixed(2)}`
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Registros</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {cargandoTotal ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                      ) : (
                        totalVentas?.totalRegistros || 0
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Productos</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {cargandoTotal ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                      ) : (
                        totalVentas?.productosVendidos || 0
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clientes</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {cargandoTotal ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                      ) : (
                        totalVentas?.clientesAtendidos || 0
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de ventas con scroll */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalle de Ventas ({ventas.length} registros)
            </h2>
          </div>
          
          {cargando ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando ventas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Contenedor con altura fija y scroll */}
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventas.length > 0 ? (
                      ventas.map((venta, index) => (
                        <tr key={venta.ID} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {venta.ID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={venta.NombreProducto}>
                              {venta.NombreProducto}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {venta.CodigoProducto || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="max-w-xs truncate" title={venta.NombreCliente}>
                              {venta.NombreCliente || 'Venta directa'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                            ${parseFloat(venta.Precio).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatearFechaHora(venta.Fecha)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No hay ventas registradas para esta fecha
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Total en la parte inferior */}
          {ventas.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {ventas.length} registro{ventas.length !== 1 ? 's' : ''} mostrado{ventas.length !== 1 ? 's' : ''}
                  {totalVentas && (
                    <span> • {totalVentas?.productosVendidos || 0} producto{(totalVentas?.productosVendidos || 0) !== 1 ? 's' : ''} únicos • {totalVentas?.clientesAtendidos || 0} cliente{(totalVentas?.clientesAtendidos || 0) !== 1 ? 's' : ''} único{(totalVentas?.clientesAtendidos || 0) !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg text-gray-600 mb-1">
                    Total de esta tabla: <span className="font-semibold text-gray-900">${calcularTotalTabla().toFixed(2)}</span>
                  </p>
                  {totalVentas && totalVentas.totalVentas !== calcularTotalTabla() && (
                    <p className="text-sm text-blue-600">
                      Total completo del día: <span className="font-semibold">${(totalVentas?.totalVentas || 0).toFixed(2)}</span>
                    </p>
                  )}
                  {!totalVentas || totalVentas.totalVentas === calcularTotalTabla() ? (
                    <p className="text-2xl font-bold text-green-600">
                      Total: ${calcularTotalTabla().toFixed(2)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricoVentas;