import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal'; // <--- Importante

const HistoricoVentas = () => {
  const { hasPermission, user } = useAuth(); 

  // --- ESTADOS ---
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoTotal, setCargandoTotal] = useState(false);
  
  // Estados para fecha
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [esHoy, setEsHoy] = useState(true);
  
  // Estados para mensajes
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado para Modal de Confirmación
  const [confirmModal, setConfirmModal] = useState({ 
      isOpen: false, 
      action: null, 
      title: '', 
      message: '', 
      tipo: 'danger' 
  });

  // Función para obtener fecha actual local (YYYY-MM-DD)
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
      // Ajusta la URL si tu prefijo en server.js es diferente, aquí asumo /api/ventas
      const endpoint = esFechaHoy ? '/api/ventas/hoy' : `/api/ventas/fecha/${fecha}`;
      
      const response = await apiCall(endpoint);
      const data = response.data || [];
      
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
      const endpoint = esFechaHoy ? '/api/ventas/total/hoy' : `/api/ventas/total/${fecha}`;
      
      const response = await apiCall(endpoint);
      setTotalVentas(response.data || null);

    } catch (error) {
      console.error('Error cargando totales:', error);
      mostrarMensaje('error', 'Error al calcular totales');
    } finally {
      setCargandoTotal(false);
    }
  };

  // --- LÓGICA DE CANCELACIÓN ---
  
  const solicitarCancelacion = (venta) => {
    // Opcional: Validar si el usuario tiene permiso de cancelar (super admin o quien la vendió)
    // if (user.id !== 1 && venta.ID_Usuario !== user.id) return mostrarMensaje('error', 'Solo supervisores pueden cancelar');

    setConfirmModal({
        isOpen: true,
        title: '¿Cancelar Venta / Devolución?',
        message: `Estás a punto de cancelar la venta de "${venta.Producto_Snapshot || venta.Producto}". \n\nEl sistema devolverá el stock al inventario y restará el dinero de la caja.`,
        tipo: 'danger',
        action: () => ejecutarCancelacion(venta.ID)
    });
  };

  const ejecutarCancelacion = async (idVenta) => {
      try {
          const res = await apiCall(`/api/ventas/${idVenta}`, 'DELETE');
          
          if (res.data.success) {
              mostrarMensaje('success', res.data.message);
              // Recargar datos para ver el cambio de estado y el nuevo total
              cargarVentas(fechaSeleccionada);
              cargarTotales(fechaSeleccionada);
          } else {
              mostrarMensaje('error', res.data.error || 'Error al cancelar');
          }
      } catch (error) {
          mostrarMensaje('error', 'Error de conexión al cancelar');
      } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
  };

  // --- HANDLERS ---

  const manejarCambioFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    cargarVentas(nuevaFecha);
    cargarTotales(nuevaFecha);
  };

  const volverAHoy = () => {
    const hoy = obtenerFechaHoy();
    setFechaSeleccionada(hoy);
    cargarVentas(hoy);
    cargarTotales(hoy);
  };

  // --- FORMATTERS Y CÁLCULOS ---

  const formatearFechaDisplay = (fecha) => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    const dateObj = new Date(year, month - 1, day);
    
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatearFechaHora = (fechaHora) => {
    return new Date(fechaHora).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sumar solo lo que NO está cancelado para mostrar en la tabla
  const calcularTotalTabla = () => {
    return ventas
      .filter(v => v.Estado === 'APROBADA') // Filtrar canceladas
      .reduce((total, venta) => total + Number(venta.Precio || 0), 0);
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
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Encabezado */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-md">Historial de Operaciones</h1>
          <p className="text-blue-100 mt-1">
            {esHoy ? 'Monitor en tiempo real del día' : 'Consulta de registros pasados'}
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors backdrop-blur-sm border border-white/20"
        >
          🖨️ Imprimir Reporte
        </button>
      </div>

      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg shadow-md animate-fade-in ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* CONTROLES DE FECHA */}
      <div className="mb-6 bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Fecha Visualizada
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-blue-900 capitalize">
                {formatearFechaDisplay(fechaSeleccionada)}
              </p>
              {esHoy && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">HOY</span>}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!esHoy && (
              <button
                onClick={volverAHoy}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Volver a Hoy
              </button>
            )}
            <input
                type="date"
                value={fechaSeleccionada}
                onChange={manejarCambioFecha}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
            />
          </div>
      </div>

      {/* KPI TOTALES (Usando datos del backend) */}
      {totalVentas && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-bold uppercase">Ventas Totales</p>
            <p className="text-2xl font-extrabold text-gray-800">${Number(totalVentas.totalVentas || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-bold uppercase">Transacciones</p>
            <p className="text-2xl font-extrabold text-gray-800">{totalVentas.totalRegistros || 0}</p>
          </div>
          {/* Puedes agregar más cards aquí */}
        </div>
      )}

      {/* TABLA DE VENTAS */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📋 Detalle de Movimientos
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{ventas.length}</span>
          </h2>
          {cargando && <span className="text-sm text-blue-600 animate-pulse font-medium">Actualizando...</span>}
        </div>
        
        {cargando && ventas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-right">Vendedor</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventas.length > 0 ? (
                  ventas.map((venta) => {
                    const esCancelada = venta.Estado === 'CANCELADA';
                    
                    return (
                      <tr key={venta.ID} className={`transition-colors ${esCancelada ? 'bg-red-50' : 'hover:bg-blue-50'}`}>
                        {/* HORA */}
                        <td className={`px-4 py-3 whitespace-nowrap font-mono ${esCancelada ? 'text-red-400' : 'text-gray-500'}`}>
                          {formatearFechaHora(venta.Fecha)}
                        </td>

                        {/* ESTADO */}
                        <td className="px-4 py-3 text-center">
                            {esCancelada ? (
                                <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-red-300">
                                    Cancelada
                                </span>
                            ) : (
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-green-200">
                                    Aprobada
                                </span>
                            )}
                        </td>
                        
                        {/* PRODUCTO (Usa Snapshot) */}
                        <td className={`px-4 py-3 font-medium ${esCancelada ? 'text-red-800 line-through decoration-red-400' : 'text-gray-800'}`}>
                          {venta.Producto_Snapshot || venta.NombreProducto || venta.Producto || "Sin Nombre"}
                          {venta.CodigoProducto && <span className="text-xs text-gray-400 block">{venta.CodigoProducto}</span>}
                        </td>
                        
                        {/* CLIENTE (Usa Snapshot) */}
                        <td className={`px-4 py-3 ${esCancelada ? 'text-red-400' : 'text-gray-600'}`}>
                          {venta.Cliente_Snapshot || venta.NombreCliente || 'Público General'}
                        </td>
                        
                        {/* PRECIO */}
                        <td className={`px-4 py-3 whitespace-nowrap text-right font-bold ${esCancelada ? 'text-red-400 line-through' : 'text-green-600'}`}>
                          ${Number(venta.Precio).toFixed(2)}
                        </td>

                        {/* VENDEDOR (Usa Snapshot) */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-gray-400">
                           {venta.Usuario_Snapshot || venta.Vendedor}
                        </td>

                        {/* ACCIONES */}
                        <td className="px-4 py-3 text-center">
                            {!esCancelada ? (
                                <button 
                                    onClick={() => solicitarCancelacion(venta)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-100 p-2 rounded-full transition-all"
                                    title="Cancelar Venta (Devolución al inventario)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : (
                                <span className="text-gray-300 text-xs italic">--</span>
                            )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No hay ventas registradas en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer Total Tabla */}
        {ventas.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-xs text-gray-500">
                * Las ventas canceladas no suman al total
             </div>
             <div className="text-right">
                <p className="text-xl text-gray-800">
                  Total en Caja (Efectivo): <span className="font-bold text-green-600">${calcularTotalTabla().toFixed(2)}</span>
                </p>
             </div>
          </div>
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

export default HistoricoVentas;