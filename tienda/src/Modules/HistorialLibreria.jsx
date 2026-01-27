import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const HistorialLibreria = () => {
  const { notify } = useNotification();
  
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [detalleVisible, setDetalleVisible] = useState(null); // ID de venta expandida
  const [detallesData, setDetallesData] = useState({}); // Cache de detalles cargados
  
  // Modal Abono
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [ventaParaAbonar, setVentaParaAbonar] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const res = await apiCall('/api/libreria/ventas/historial');
      setVentas(res.data || []);
    } catch (error) { console.error(error); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargarHistorial(); }, []);

  // Cargar detalles bajo demanda (lazy load al expandir)
  const toggleDetalle = async (idVenta) => {
      if (detalleVisible === idVenta) {
          setDetalleVisible(null);
          return;
      }
      setDetalleVisible(idVenta);
      
      if (!detallesData[idVenta]) {
          try {
              const res = await apiCall(`/api/libreria/ventas/${idVenta}/detalles`);
              setDetallesData(prev => ({ ...prev, [idVenta]: res.data }));
          } catch (error) { notify('Error cargando detalles', 'error'); }
      }
  };

  const abrirModalAbono = (venta) => {
      setVentaParaAbonar(venta);
      setMontoAbono('');
      setModalAbonoOpen(true);
  };

  const enviarAbono = async (e) => {
      e.preventDefault();
      if (!montoAbono || parseFloat(montoAbono) <= 0) return notify('Monto inválido', 'error');
      
      try {
          const res = await apiCall(`/api/libreria/ventas/${ventaParaAbonar.ID}/abonar`, 'PUT', {
              monto: montoAbono
          });
          
          if (res.data.success) {
              notify(res.data.message, 'success');
              setModalAbonoOpen(false);
              cargarHistorial(); // Recargar para ver nuevos saldos
          } else {
              notify('Error al abonar', 'error');
          }
      } catch (error) { notify('Error de conexión', 'error'); }
  };

  // Helpers de formato
  const formatMoney = (n) => `$${parseFloat(n).toFixed(2)}`;
  const formatDate = (d) => new Date(d).toLocaleString('es-ES');

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📜 Historial de Librería
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold">
                  <tr>
                      <th className="px-6 py-4">ID / Fecha</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                      <th className="px-6 py-4 text-center">Progreso Pago</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {cargando ? (
                      <tr><td colSpan="6" className="p-8 text-center text-gray-400">Cargando...</td></tr>
                  ) : ventas.map(venta => {
                      const porcentaje = Math.min(100, (venta.Monto_Pagado / venta.Total_Venta) * 100);
                      const esPendiente = venta.Estado === 'PENDIENTE';

                      return (
                          <>
                              <tr key={venta.ID} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-gray-900">#{venta.ID}</div>
                                      <div className="text-xs text-gray-500">{formatDate(venta.Fecha)}</div>
                                      <div className="text-xs text-indigo-500 mt-1">Vendedor: {venta.Usuario_Snapshot}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-800">{venta.Cliente_Snapshot || 'Público General'}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          esPendiente ? 'bg-orange-100 text-orange-700' : 
                                          venta.Estado === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                      }`}>
                                          {venta.Estado}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex justify-between text-xs font-bold text-gray-600">
                                              <span>{formatMoney(venta.Monto_Pagado)}</span>
                                              <span>{parseInt(porcentaje)}%</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                                              <div 
                                                  className={`h-2.5 rounded-full ${esPendiente ? 'bg-orange-500' : 'bg-green-500'}`} 
                                                  style={{ width: `${porcentaje}%` }}
                                              ></div>
                                          </div>
                                          {esPendiente && (
                                              <div className="text-xs text-red-500 text-right font-bold">
                                                  Resta: {formatMoney(venta.Total_Venta - venta.Monto_Pagado)}
                                              </div>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                                      {formatMoney(venta.Total_Venta)}
                                  </td>
                                  <td className="px-6 py-4 text-center space-x-2">
                                      <button 
                                          onClick={() => toggleDetalle(venta.ID)}
                                          className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                                      >
                                          {detalleVisible === venta.ID ? 'Ocultar' : 'Ver Libros'}
                                      </button>
                                      
                                      {esPendiente && (
                                          <button 
                                              onClick={() => abrirModalAbono(venta)}
                                              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-700 shadow-sm transition-transform active:scale-95"
                                          >
                                              Abonar $
                                          </button>
                                      )}
                                  </td>
                              </tr>
                              
                              {/* DETALLE EXPANDIBLE (ACORDEÓN) */}
                              {detalleVisible === venta.ID && (
                                  <tr className="bg-indigo-50/30">
                                      <td colSpan="6" className="px-6 py-4 border-t border-b border-indigo-100">
                                          <div className="pl-4 border-l-4 border-indigo-300">
                                              <h4 className="text-sm font-bold text-indigo-800 mb-2">Libros en esta venta:</h4>
                                              {!detallesData[venta.ID] ? (
                                                  <div className="text-sm text-gray-500">Cargando detalles...</div>
                                              ) : (
                                                  <ul className="space-y-2">
                                                      {detallesData[venta.ID].map(d => (
                                                          <li key={d.ID} className="text-sm flex justify-between items-center bg-white p-2 rounded shadow-sm border border-indigo-50">
                                                              <div>
                                                                  <span className="font-bold text-gray-700">{d.Titulo_Snapshot}</span>
                                                                  <span className="text-gray-500 text-xs ml-2">({d.Autor_Snapshot})</span>
                                                              </div>
                                                              <div className="text-gray-800 font-mono">
                                                                  {formatMoney(d.Precio_Final)}
                                                              </div>
                                                          </li>
                                                      ))}
                                                  </ul>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              )}
                          </>
                      );
                  })}
              </tbody>
          </table>
      </div>

      {/* MODAL DE ABONAR */}
      {modalAbonoOpen && ventaParaAbonar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                  <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-white font-bold text-lg">Registrar Abono</h3>
                      <button onClick={() => setModalAbonoOpen(false)} className="text-white hover:text-green-100">✕</button>
                  </div>
                  
                  <form onSubmit={enviarAbono} className="p-6">
                      <div className="mb-4 text-center">
                          <p className="text-gray-500 text-sm">Cliente</p>
                          <p className="font-bold text-gray-800">{ventaParaAbonar.Cliente_Snapshot}</p>
                          <p className="text-xs text-gray-400">Venta #{ventaParaAbonar.ID}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                          <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Total Venta:</span>
                              <span className="font-bold text-gray-800">{formatMoney(ventaParaAbonar.Total_Venta)}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Ya Pagado:</span>
                              <span className="font-bold text-green-600">{formatMoney(ventaParaAbonar.Monto_Pagado)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                              <span className="text-sm font-bold text-red-500">Restante:</span>
                              <span className="font-bold text-red-600 text-lg">
                                  {formatMoney(ventaParaAbonar.Total_Venta - ventaParaAbonar.Monto_Pagado)}
                              </span>
                          </div>
                      </div>

                      <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Monto a Abonar</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                              <input 
                                  type="number" 
                                  step="0.01"
                                  min="0.01"
                                  max={ventaParaAbonar.Total_Venta - ventaParaAbonar.Monto_Pagado}
                                  className="w-full pl-8 pr-3 py-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xl font-bold text-gray-800"
                                  value={montoAbono}
                                  onChange={e => setMontoAbono(e.target.value)}
                                  autoFocus
                              />
                          </div>
                      </div>

                      <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transform active:scale-95 transition-all">
                          Confirmar Abono
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default HistorialLibreria;