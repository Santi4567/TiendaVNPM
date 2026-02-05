import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

const HistorialLibreria = () => {
  const { notify } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.rolId === 1; 

  // --- ESTADOS DE FILTROS ---
  // CAMBIO CLAVE: Iniciamos fechas vacías para que traiga TODO el historial al cargar
  const [filtros, setFiltros] = useState({
      busqueda: '',
      estado: 'TODOS',
      inicio: '', // Antes: new Date()...
      fin: ''     // Antes: new Date()...
  });

  // --- ESTADOS DE DATOS ---
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(false);

  // --- ESTADOS DE MODALES Y ACCIONES ---
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [activeTab, setActiveTab] = useState('LIBROS'); 
  const [detallesCargados, setDetallesCargados] = useState({ libros: [], abonos: [] });
  const [showAbonoInput, setShowAbonoInput] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });

  // --- CARGA DE DATOS ---
  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargar Historial (Tabla)
      const queryParams = new URLSearchParams({
          busqueda: filtros.busqueda,
          estado: filtros.estado,
          // Si las fechas están vacías, el backend ignorará el filtro de tiempo
          inicio: filtros.inicio, 
          fin: filtros.fin
      }).toString();

      const resVentas = await apiCall(`/api/libreria/ventas/historial?${queryParams}`);
      setVentas(resVentas.data || []);

      // 2. Cargar Estadísticas (Solo Admin)
      if (isAdmin) {
          const resStats = await apiCall(`/api/libreria/ventas/stats?inicio=${filtros.inicio}&fin=${filtros.fin}`);
          setStats(resStats.data);
      }

    } catch (error) { console.error(error); notify('Error al actualizar datos', 'error'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleFiltroChange = (e) => {
      setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const aplicarFiltros = (e) => {
      e.preventDefault();
      cargarDatos();
  };

  // --- GESTIÓN DE DETALLES ---
  const abrirGestion = async (venta) => {
      setVentaSeleccionada(venta);
      setModalDetalleOpen(true);
      setActiveTab('LIBROS');
      setShowAbonoInput(false);
      setMontoAbono('');
      setDetallesCargados({ libros: [], abonos: [] }); 
      try {
          const [resLibros, resAbonos] = await Promise.all([
              apiCall(`/api/libreria/ventas/${venta.ID}/detalles`),
              apiCall(`/api/libreria/ventas/${venta.ID}/abonos`)
          ]);
          setDetallesCargados({ libros: resLibros.data || [], abonos: resAbonos.data || [] });
      } catch (error) { notify('Error cargando detalles', 'error'); }
  };

  const enviarAbono = async (e) => {
      e.preventDefault();
      if (!montoAbono || parseFloat(montoAbono) <= 0) return notify('Monto inválido', 'error');
      try {
          const res = await apiCall(`/api/libreria/ventas/${ventaSeleccionada.ID}/abonar`, 'PUT', { monto: montoAbono });
          if (res.data.success) {
              notify(res.data.message, 'success');
              setModalDetalleOpen(false);
              cargarDatos(); 
          } else { notify(res.data.error, 'error'); }
      } catch (error) { notify('Error de conexión', 'error'); }
  };

  const procederCancelacion = async () => {
      try {
          const res = await apiCall(`/api/libreria/ventas/${confirmCancel.id}/cancelar`, 'PUT');
          if (res.data.success) {
              notify('Venta cancelada', 'success');
              setModalDetalleOpen(false);
              setConfirmCancel({ open: false, id: null });
              cargarDatos();
          } else { notify(res.data.error, 'error'); }
      } catch (error) { notify('Error al cancelar', 'error'); }
  };

  const fMoney = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
  const fDate = (d) => new Date(d).toLocaleString('es-ES');

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2 drop-shadow-md">
          📜 Historial de Librería
      </h1>

      {/* --- PANEL DE FILTROS --- */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200 animate-fade-in">
          <form onSubmit={aplicarFiltros} className="flex flex-col lg:flex-row gap-4 items-end">
              
              <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-500 uppercase">Buscar</label>
                  <input 
                      type="text" name="busqueda" placeholder="Cliente, Folio..." 
                      className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filtros.busqueda} onChange={handleFiltroChange}
                  />
              </div>

              <div className="w-full lg:w-48">
                  <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                  <select 
                      name="estado" 
                      className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={filtros.estado} onChange={handleFiltroChange}
                  >
                      <option value="TODOS">Todos</option>
                      <option value="PAGADO">✅ Pagados</option>
                      <option value="PENDIENTE">⏳ Pendientes</option>
                      <option value="CANCELADO">🚫 Cancelados</option>
                  </select>
              </div>

              {/* Filtro de Fechas (SOLO ADMIN) */}
              {isAdmin && (
                  <div className="flex gap-2 w-full lg:w-auto">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
                          <input type="date" name="inicio" className="border p-2 rounded-lg w-full" value={filtros.inicio} onChange={handleFiltroChange} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
                          <input type="date" name="fin" className="border p-2 rounded-lg w-full" value={filtros.fin} onChange={handleFiltroChange} />
                      </div>
                  </div>
              )}

              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md w-full lg:w-auto">
                  {cargando ? '...' : '🔍 Filtrar'}
              </button>
          </form>
      </div>

      {/* --- SECCIÓN ADMIN: KPIs Y GRÁFICAS --- */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
            
            {/* IZQUIERDA: CARDS DE DINERO */}
            <div className="lg:col-span-1 space-y-4">
                {/* INGRESO REAL */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ingreso Real (Caja)</p>
                    <p className="text-3xl font-extrabold text-gray-800">{fMoney(stats.financiero.IngresoReal)}</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">Incluye ventas totales y abonos parciales</p>
                </div>
                
                {/* DEUDA PENDIENTE */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Por Cobrar (Deuda)</p>
                    <p className="text-3xl font-extrabold text-gray-800">{fMoney(stats.financiero.DeudaPendiente)}</p>
                    <p className="text-xs text-orange-600 mt-1 font-medium">Saldo pendiente de apartados activos</p>
                </div>

                {/* TOTAL LIBROS */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Libros Vendidos</p>
                        <p className="text-3xl font-extrabold text-gray-800">{stats.totalLibros}</p>
                    </div>
                    <span className="text-4xl">📚</span>
                </div>
            </div>

            {/* DERECHA: GRÁFICA TOP LIBROS */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                    🏆 Top 5 Libros Más Vendidos
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {filtros.inicio ? 'En el periodo seleccionado' : 'Histórico Global'}
                    </span>
                </h3>
                
                {stats.topLibros.length > 0 ? (
                    <div className="space-y-6">
                        {stats.topLibros.map((libro, idx) => {
                            const maxVal = stats.topLibros[0].Vendidos; 
                            const pct = (libro.Vendidos / maxVal) * 100;
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-gray-700 truncate w-3/4">
                                            {idx + 1}. {libro.Titulo}
                                        </span>
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 rounded">
                                            {libro.Vendidos} u.
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 italic">
                        No hay datos de ventas disponibles.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- TABLA DE RESULTADOS --- */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[600px] mb-8">
          <div className="overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4">Fecha / Folio</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-center">Deuda</th>
                        <th className="px-6 py-4 text-right">Total Venta</th>
                        <th className="px-6 py-4 text-center">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {ventas.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-400 italic">No se encontraron ventas.</td></tr>
                    ) : ventas.map(venta => {
                        const deuda = venta.Total_Venta - venta.Monto_Pagado;
                        return (
                            <tr key={venta.ID} className="hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{fDate(venta.Fecha)}</div>
                                    <div className="text-sm text-rose-600 font-mono">Folio #{venta.ID}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800">{venta.Cliente_Snapshot || 'Público General'}</div>
                                    <div className="text-xs text-gray-500">Vendió: {venta.Usuario_Snapshot}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        venta.Estado === 'PENDIENTE' ? 'bg-orange-100 text-orange-700' : 
                                        venta.Estado === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {venta.Estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {venta.Estado === 'PENDIENTE' ? (
                                        <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded text-xs border border-red-100">
                                            Restan: {fMoney(deuda)}
                                        </span>
                                    ) : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-800">{fMoney(venta.Total_Venta)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => abrirGestion(venta)} className="text-indigo-900 hover:bg-indigo-100 px-3 py-1 rounded font-bold text-xs border border-indigo-200 hover:border-indigo-300 transition-colors">
                                        Gestionar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>

      {/* --- MODAL DETALLE --- */}
      {modalDetalleOpen && ventaSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* HEADER */}
                  <div className="bg-gray-800 px-6 py-4 flex justify-between items-start text-white">
                      <div><h2 className="text-xl font-bold">Venta #{ventaSeleccionada.ID}</h2><p className="text-sm opacity-80">{ventaSeleccionada.Cliente_Snapshot}</p></div>
                      <button onClick={() => setModalDetalleOpen(false)} className="text-white text-2xl">✕</button>
                  </div>
                  
                  {/* CONTENIDO SCROLLABLE */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[200px]">
                      
                      <div className="flex mb-4 border-b border-gray-300">
                          <button onClick={() => setActiveTab('LIBROS')} className={`flex-1 pb-2 font-bold ${activeTab === 'LIBROS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Libros</button>
                          <button onClick={() => setActiveTab('ABONOS')} className={`flex-1 pb-2 font-bold ${activeTab === 'ABONOS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Pagos</button>
                      </div>

                      {activeTab === 'LIBROS' && (
                          <ul className="space-y-2">
                              {detallesCargados.libros.map(item => (
                                  <li key={item.ID} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                      <div><p className="font-bold text-gray-800">{item.Titulo_Snapshot}</p><p className="text-xs text-gray-500">{item.Autor_Snapshot}</p></div>
                                      <div className="text-right"><p className="font-mono font-bold text-gray-700">{fMoney(item.Precio_Final)}</p></div>
                                  </li>
                              ))}
                          </ul>
                      )}
                      {activeTab === 'ABONOS' && (
                          <div className="space-y-3">
                              {detallesCargados.abonos.length === 0 && <p className="text-center text-gray-400 italic text-sm">No hay abonos extra registrados.</p>}
                              {detallesCargados.abonos.map(abono => (
                                  <div key={abono.ID} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-green-500 shadow-sm">
                                      <div><p className="text-green-700 font-bold text-lg">+ {fMoney(abono.Monto)}</p><p className="text-xs text-gray-400">{fDate(abono.Fecha)}</p></div>
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{abono.Usuario_Snapshot}</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Footer Modal */}
                  <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
                      {ventaSeleccionada.Estado === 'PENDIENTE' && showAbonoInput ? (
                          <form onSubmit={enviarAbono} className="flex gap-2">
                              <input type="number" autoFocus className="border p-2 rounded w-full font-bold text-lg" placeholder="Monto..." value={montoAbono} onChange={e => setMontoAbono(e.target.value)} />
                              <button className="bg-green-600 text-white px-4 rounded font-bold hover:bg-green-700">Confirmar</button>
                              <button type="button" onClick={() => setShowAbonoInput(false)} className="text-gray-500 hover:text-gray-700 px-2">Cancelar</button>
                          </form>
                      ) : (
                          <div className="flex gap-2">
                              {ventaSeleccionada.Estado === 'PENDIENTE' && (
                                <button onClick={() => { setActiveTab('ABONOS'); setShowAbonoInput(true); }} className="bg-green-600 text-white flex-1 py-2 rounded font-bold hover:bg-green-700">
                                    💰 Abonar
                                </button>
                              )}
                              {ventaSeleccionada.Estado !== 'CANCELADO' && (
                                <button onClick={() => setConfirmCancel({ open: true, id: ventaSeleccionada.ID })} className="text-red-500 font-bold px-4 hover:bg-red-50 rounded">
                                    Cancelar Venta
                                </button>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <ConfirmModal 
          isOpen={confirmCancel.open} onClose={() => setConfirmCancel({ open: false, id: null })} onConfirm={procederCancelacion}
          title="¿Cancelar Venta?" message="Se restaurará el stock y se cancelará la deuda." tipo="danger"
      />
    </div>
  );
};

export default HistorialLibreria;