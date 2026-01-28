import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

const HistorialLibreria = () => {
  const { notify } = useNotification();
  
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // --- ESTADOS DEL SUPER MODAL ---
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [activeTab, setActiveTab] = useState('LIBROS'); // 'LIBROS' | 'ABONOS'
  const [detallesCargados, setDetallesCargados] = useState({ libros: [], abonos: [] });
  
  // --- ESTADOS ACCIONES ---
  const [showAbonoInput, setShowAbonoInput] = useState(false); // Sub-sección para abonar
  const [montoAbono, setMontoAbono] = useState('');
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });

  // Carga inicial
  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const res = await apiCall('/api/libreria/ventas/historial');
      setVentas(res.data || []);
    } catch (error) { console.error(error); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarHistorial(); }, []);

  // --- ABRIR MODAL DETALLE ---
  const abrirGestion = async (venta) => {
      setVentaSeleccionada(venta);
      setModalDetalleOpen(true);
      setActiveTab('LIBROS');
      setShowAbonoInput(false);
      setMontoAbono('');
      setDetallesCargados({ libros: [], abonos: [] }); // Limpiar previo

      try {
          // Cargamos todo en paralelo para que sea rápido
          const [resLibros, resAbonos] = await Promise.all([
              apiCall(`/api/libreria/ventas/${venta.ID}/detalles`),
              apiCall(`/api/libreria/ventas/${venta.ID}/abonos`)
          ]);
          setDetallesCargados({
              libros: resLibros.data || [],
              abonos: resAbonos.data || []
          });
      } catch (error) { notify('Error cargando detalles', 'error'); }
  };

  // --- LÓGICA DE ABONO ---
  const enviarAbono = async (e) => {
      e.preventDefault();
      if (!montoAbono || parseFloat(montoAbono) <= 0) return notify('Monto inválido', 'error');

      try {
          const res = await apiCall(`/api/libreria/ventas/${ventaSeleccionada.ID}/abonar`, 'PUT', { monto: montoAbono });
          if (res.data.success) {
              notify(res.data.message, 'success');
              setModalDetalleOpen(false); // Cerramos todo para forzar refresco limpio
              cargarHistorial(); 
          } else {
              notify(res.data.error, 'error');
          }
      } catch (error) { notify('Error de conexión', 'error'); }
  };

  // --- LÓGICA DE CANCELACIÓN ---
  const procederCancelacion = async () => {
      try {
          const res = await apiCall(`/api/libreria/ventas/${confirmCancel.id}/cancelar`, 'PUT');
          if (res.data.success) {
              notify('Venta cancelada exitosamente', 'success');
              setModalDetalleOpen(false);
              setConfirmCancel({ open: false, id: null });
              cargarHistorial();
          } else {
              notify(res.data.error, 'error');
          }
      } catch (error) { notify('Error al cancelar', 'error'); }
  };

  const formatMoney = (n) => `$${parseFloat(n).toFixed(2)}`;
  const formatDate = (d) => new Date(d).toLocaleString('es-ES');

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📜 Historial de Librería
      </h1>

      {/* TABLA PRINCIPAL (LIMPIA) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[700px]">
          <div className="overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4">ID / Fecha</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-center">Deuda</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Gestión</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {cargando ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400">Cargando...</td></tr>
                    ) : ventas.map(venta => {
                        const esPendiente = venta.Estado === 'PENDIENTE';
                        const deuda = venta.Total_Venta - venta.Monto_Pagado;
                        return (
                            <tr key={venta.ID} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">#{venta.ID}</div>
                                    <div className="text-xs text-gray-500">{formatDate(venta.Fecha)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-800">{venta.Cliente_Snapshot || 'Público General'}</div>
                                    <div className="text-xs text-gray-400">{venta.Usuario_Snapshot}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        esPendiente ? 'bg-orange-100 text-orange-700' : 
                                        venta.Estado === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {venta.Estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {esPendiente ? (
                                        <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded text-xs">
                                            -{formatMoney(deuda)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-800">
                                    {formatMoney(venta.Total_Venta)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => abrirGestion(venta)}
                                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Ver / Gestionar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>

      {/* --- SUPER MODAL DE GESTIÓN --- */}
      {modalDetalleOpen && ventaSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
                  
                  {/* HEADER MODAL */}
                  <div className="bg-gray-800 px-6 py-4 flex justify-between items-start text-white">
                      <div>
                          <h2 className="text-xl font-bold">Gestión de Venta #{ventaSeleccionada.ID}</h2>
                          <p className="text-sm text-gray-300 opacity-80">{ventaSeleccionada.Cliente_Snapshot || 'Público General'} • {formatDate(ventaSeleccionada.Fecha)}</p>
                      </div>
                      <button onClick={() => setModalDetalleOpen(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
                  </div>

                  {/* RESUMEN FINANCIERO */}
                  <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Total Venta</p>
                          <p className="text-xl font-bold text-gray-800">{formatMoney(ventaSeleccionada.Total_Venta)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-bold text-gray-500 uppercase">Estado Actual</p>
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                              ventaSeleccionada.Estado === 'PENDIENTE' ? 'bg-orange-200 text-orange-800' : 
                              ventaSeleccionada.Estado === 'CANCELADO' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                          }`}>
                              {ventaSeleccionada.Estado}
                          </span>
                      </div>
                  </div>

                  {/* TABS DE NAVEGACIÓN */}
                  <div className="flex border-b border-gray-200">
                      <button 
                          onClick={() => setActiveTab('LIBROS')}
                          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'LIBROS' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                          📚 Libros ({detallesCargados.libros.length})
                      </button>
                      <button 
                          onClick={() => setActiveTab('ABONOS')}
                          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'ABONOS' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                          💰 Pagos ({detallesCargados.abonos.length})
                      </button>
                  </div>

                  {/* CONTENIDO SCROLLABLE */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[200px]">
                      
                      {activeTab === 'LIBROS' && (
                          <ul className="space-y-2">
                              {detallesCargados.libros.map(item => (
                                  <li key={item.ID} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-gray-800">{item.Titulo_Snapshot}</p>
                                          <p className="text-xs text-gray-500">{item.Autor_Snapshot}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-mono font-bold text-gray-700">{formatMoney(item.Precio_Final)}</p>
                                          {item.Descuento_Aplicado > 0 && <span className="text-[10px] text-red-500">-{item.Descuento_Aplicado}%</span>}
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      )}

                      {activeTab === 'ABONOS' && (
                          <div className="space-y-3">
                              {/* Barra de Progreso */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                      <span>Pagado: <span className="font-bold text-green-600">{formatMoney(ventaSeleccionada.Monto_Pagado)}</span></span>
                                      <span className="text-red-500 font-bold">Resta: {formatMoney(ventaSeleccionada.Total_Venta - ventaSeleccionada.Monto_Pagado)}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(ventaSeleccionada.Monto_Pagado / ventaSeleccionada.Total_Venta) * 100}%` }}></div>
                                  </div>
                              </div>

                              {/* Lista de Pagos */}
                              {detallesCargados.abonos.length === 0 ? (
                                  <p className="text-center text-gray-400 text-sm italic">No hay historial detallado (Pago inicial único).</p>
                              ) : (
                                  detallesCargados.abonos.map(abono => (
                                      <div key={abono.ID} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-green-500 shadow-sm">
                                          <div>
                                              <p className="text-green-700 font-bold text-lg">+ {formatMoney(abono.Monto)}</p>
                                              <p className="text-xs text-gray-400">{formatDate(abono.Fecha)}</p>
                                          </div>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{abono.Usuario_Snapshot}</span>
                                      </div>
                                  ))
                              )}
                          </div>
                      )}
                  </div>

                  {/* FOOTER DE ACCIONES */}
                  <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
                      
                      {/* INPUT DE ABONAR (Condicional) */}
                      {ventaSeleccionada.Estado === 'PENDIENTE' && showAbonoInput && (
                          <form onSubmit={enviarAbono} className="flex gap-2 animate-fade-in-up">
                              <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                  <input 
                                      type="number" step="0.01" autoFocus
                                      max={ventaSeleccionada.Total_Venta - ventaSeleccionada.Monto_Pagado + 0.01}
                                      className="w-full pl-8 pr-3 py-2 border-2 border-green-500 rounded-lg outline-none font-bold text-gray-800"
                                      placeholder="Monto a abonar..."
                                      value={montoAbono} onChange={e => setMontoAbono(e.target.value)}
                                  />
                              </div>
                              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg">
                                  Confirmar
                              </button>
                              <button type="button" onClick={() => setShowAbonoInput(false)} className="text-gray-500 hover:bg-gray-100 px-3 rounded-lg">Cancelar</button>
                          </form>
                      )}

                      {/* BOTONES PRINCIPALES */}
                      {!showAbonoInput && (
                          <div className="flex justify-between gap-3">
                              {ventaSeleccionada.Estado === 'PENDIENTE' ? (
                                  <button 
                                      onClick={() => { setActiveTab('ABONOS'); setShowAbonoInput(true); }}
                                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition-transform active:scale-95"
                                  >
                                      💰 Nuevo Abono
                                  </button>
                              ) : (
                                  <div className="flex-1"></div> // Espaciador
                              )}

                              {ventaSeleccionada.Estado !== 'CANCELADO' && (
                                  <button 
                                      onClick={() => setConfirmCancel({ open: true, id: ventaSeleccionada.ID })}
                                      className="px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                  >
                                      Cancelar Venta
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRMACIÓN DE CANCELACIÓN */}
      <ConfirmModal 
          isOpen={confirmCancel.open}
          onClose={() => setConfirmCancel({ open: false, id: null })}
          onConfirm={procederCancelacion}
          title="¿Cancelar Venta?"
          message="Esta acción restaurará el stock de los libros y marcará la venta como cancelada. El dinero registrado no se elimina del historial."
          tipo="danger"
      />
    </div>
  );
};

export default HistorialLibreria;