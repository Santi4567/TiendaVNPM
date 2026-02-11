import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal';

const CajaLibreria = () => {
  const { hasPermission } = useAuth();
  const { notify } = useNotification();

  // --- PERSISTENCIA ---
  const [carrito, setCarrito] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lib_carrito')) || []; } catch { return []; }
  });
  const [cliente, setCliente] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lib_cliente')) || null; } catch { return null; }
  });

  // --- ESTADOS UI ---
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesResultados, setClientesResultados] = useState([]);
  const [procesando, setProcesando] = useState(false);
  
  // --- NUEVO: ESTADOS DE PAGO ---
  const [modoVenta, setModoVenta] = useState('DIRECTA'); // 'DIRECTA' | 'APARTADO'
  const [abonoInicial, setAbonoInicial] = useState('');

  // Modal Confirmación
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Persistencia
  useEffect(() => { localStorage.setItem('lib_carrito', JSON.stringify(carrito)); }, [carrito]);
  useEffect(() => { localStorage.setItem('lib_cliente', JSON.stringify(cliente)); }, [cliente]);

  // --- BUSCADORES (Misma lógica) ---
  const buscarLibros = async (termino) => {
      if (!termino.trim()) { setResultados([]); return; }
      try {
          const res = await apiCall(`/api/libreria/libros/buscar?q=${encodeURIComponent(termino)}`);
          setResultados(res.data || []);
      } catch (error) { console.error(error); }
  };

  const buscarClientes = async (termino) => {
      if (!termino.trim()) { setClientesResultados([]); return; }
      try {
          const res = await apiCall(`/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
          setClientesResultados(res.data || []);
      } catch (error) { console.error(error); }
  };

  const onInputLibro = (e) => {
      const val = e.target.value;
      setBusqueda(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => buscarLibros(val), 300);
  };

  const onInputCliente = (e) => {
      const val = e.target.value;
      setBusquedaCliente(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => buscarClientes(val), 300);
  };

  // --- GESTIÓN CARRITO ---
  const agregarLibro = (libro) => {
      if (libro.Stock <= 0) return notify(`"${libro.Titulo}" está agotado`, 'error');
      
      const itemExistente = carrito.find(i => i.ID === libro.ID);
      if (itemExistente && itemExistente.cantidad + 1 > libro.Stock) return notify('No hay más stock', 'error');

      if (itemExistente) {
          setCarrito(prev => prev.map(i => i.ID === libro.ID ? { ...i, cantidad: i.cantidad + 1 } : i));
      } else {
          setCarrito([...carrito, { ...libro, cantidad: 1 }]);
      }
      setBusqueda('');
      setResultados([]);
      inputRef.current?.focus();
  };

  const cambiarCantidad = (id, delta) => {
      setCarrito(prev => prev.map(item => {
          if (item.ID === id) {
              const nueva = item.cantidad + delta;
              if (nueva < 1) return item;
              if (nueva > item.Stock) { notify('Stock insuficiente', 'error'); return item; }
              return { ...item, cantidad: nueva };
          }
          return item;
      }));
  };

  const quitarItem = (id) => setCarrito(prev => prev.filter(i => i.ID !== id));

  // --- CÁLCULOS ---
  const calcularTotal = () => {
      return carrito.reduce((acc, item) => {
          const precioFinal = item.Precio * (1 - (item.Descuento || 0) / 100);
          return acc + (precioFinal * item.cantidad);
      }, 0);
  };

  const calcularRestante = () => {
      const total = calcularTotal();
      const abono = parseFloat(abonoInicial) || 0;
      return Math.max(0, total - abono);
  };

  // --- ACCIONES ---
  const solicitarCancelar = () => {
      if (carrito.length === 0) return;
      setConfirmModal({
          isOpen: true,
          title: '¿Cancelar Transacción?',
          message: 'Se perderá el carrito actual.',
          action: () => {
              setCarrito([]);
              setCliente(null);
              setAbonoInicial('');
              setModoVenta('DIRECTA');
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              notify('Transacción cancelada', 'info');
          }
      });
  };

  const procesarTransaccion = async () => {
      const total = calcularTotal();
      
      if (carrito.length === 0) return notify('Carrito vacío', 'error');

      // VALIDACIONES ESPECÍFICAS
      if (modoVenta === 'APARTADO') {
          if (!cliente) return notify('Para apartar DEBES seleccionar un Cliente', 'error');
          if (!abonoInicial || parseFloat(abonoInicial) <= 0) return notify('Ingresa un monto de abono válido', 'error');
          if (parseFloat(abonoInicial) >= total) return notify('Si paga el total, usa Venta Directa', 'info');
      }

      setProcesando(true);
      
      try {
          // Si es Directa, el pago inicial es el total. Si es Apartado, es lo que escribieron.
          const pagoReal = modoVenta === 'DIRECTA' ? total : parseFloat(abonoInicial);

          const res = await apiCall('/api/libreria/ventas/checkout', 'POST', {
              productos: carrito,
              cliente: cliente,
              total: total,
              pagoInicial: pagoReal // <--- Enviamos el abono al backend
          });

          if (res.data.success) {
              notify(modoVenta === 'DIRECTA' ? '¡Venta exitosa!' : '¡Libros apartados correctamente!', 'success');
              setCarrito([]);
              setCliente(null);
              setAbonoInicial('');
              setModoVenta('DIRECTA');
          } else {
              notify(res.data.error || 'Error al procesar', 'error');
          }
      } catch (error) {
          notify('Error de conexión', 'error');
      } finally {
          setProcesando(false);
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">📚 Caja Librería</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: Buscador y Tabla (Igual que antes) */}
          <div className="lg:col-span-2 space-y-6">
              {/* BUSCADOR */}
              <div className="relative z-20">
                  <input 
                      ref={inputRef}
                      type="text" 
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all"
                      placeholder="Buscar libro..."
                      value={busqueda}
                      onChange={onInputLibro}
                      autoFocus
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                  {/* RESULTADOS */}
                  {resultados.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto animate-fade-in-up">
                          {resultados.map(libro => (
                              <div key={libro.ID} onClick={() => agregarLibro(libro)} className={`p-4 border-b flex justify-between items-center cursor-pointer transition-colors ${libro.Stock > 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 opacity-60 cursor-not-allowed'}`}>
                                  <div>
                                      <h4 className="font-bold text-gray-800">{libro.Titulo}</h4>
                                      <p className="text-sm text-gray-500 italic">{libro.Autor}</p>
                                      {libro.Descuento > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold mt-1 inline-block">-{libro.Descuento}% OFF</span>}
                                  </div>
                                  <div className="text-right">
                                      <div className="text-xl font-bold text-indigo-600">${(libro.Precio * (1 - (libro.Descuento || 0)/100)).toFixed(2)}</div>
                                      <div className="text-xs text-gray-500">Stock: {libro.Stock}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* TABLA CARRITO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                              <tr>
                                  <th className="px-6 py-3 font-bold">Libro</th>
                                  <th className="px-4 py-3 text-center">Cant.</th>
                                  <th className="px-6 py-3 text-right">Subtotal</th>
                                  <th className="px-4 py-3 text-center"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {carrito.length === 0 ? (
                                  <tr><td colSpan="4" className="py-20 text-center text-gray-400 italic">Carrito vacío</td></tr>
                              ) : carrito.map(item => {
                                  const precioFinal = item.Precio * (1 - (item.Descuento || 0)/100);
                                  return (
                                      <tr key={item.ID} className="hover:bg-gray-50">
                                          <td className="px-6 py-4">
                                              <div className="font-bold text-gray-800">{item.Titulo}</div>
                                              {item.Descuento > 0 && <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">-{item.Descuento}%</span>}
                                          </td>
                                          <td className="px-4 py-4 text-center">
                                              <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg p-1 w-fit mx-auto">
                                                  <button onClick={() => cambiarCantidad(item.ID, -1)} className="w-6 h-6 flex justify-center items-center bg-white rounded font-bold hover:text-indigo-600">-</button>
                                                  <span className="w-8 font-bold text-sm">{item.cantidad}</span>
                                                  <button onClick={() => cambiarCantidad(item.ID, 1)} className="w-6 h-6 flex justify-center items-center bg-white rounded font-bold hover:text-indigo-600">+</button>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 text-right font-bold text-gray-800">${(precioFinal * item.cantidad).toFixed(2)}</td>
                                          <td className="px-4 py-4 text-center">
                                              <button onClick={() => quitarItem(item.ID)} className="text-gray-400 hover:text-red-500">✕</button>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          {/* COLUMNA DERECHA (1/3): Panel de Cobro */}
          <div className="space-y-6">
              
              {/* 1. SELECCIÓN DE MODO DE PAGO (CARDS) */}
              <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setModoVenta('DIRECTA')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${
                        modoVenta === 'DIRECTA' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200'
                    }`}
                  >
                      <div className="text-2xl mb-1">💵</div>
                      <div className="font-bold text-sm">Venta Directa</div>
                  </div>
                  <div 
                    onClick={() => setModoVenta('APARTADO')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${
                        modoVenta === 'APARTADO' 
                        ? 'border-orange-500 bg-orange-50 text-orange-800' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-orange-200'
                    }`}
                  >
                      <div className="text-2xl mb-1">📅</div>
                      <div className="font-bold text-sm">Abonos / Apartado</div>
                  </div>
              </div>

              {/* 2. CLIENTE (Obligatorio para Apartado) */}
              <div className={`bg-white rounded-xl shadow-sm border p-5 ${modoVenta === 'APARTADO' && !cliente ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-700 text-sm uppercase">Cliente {modoVenta === 'APARTADO' && <span className="text-red-500">*</span>}</h3>
                  </div>
                  
                  {cliente ? (
                      <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                          <div>
                              <p className="font-bold text-gray-800">{cliente.Nombre}</p>
                              <p className="text-xs text-gray-500">ID: {cliente.ID}</p>
                          </div>
                          <button onClick={() => { setCliente(null); setBusquedaCliente(''); }} className="text-red-500 font-bold px-2">✕</button>
                      </div>
                  ) : (
                      <div className="relative">
                          <input type="text" placeholder="Buscar cliente..." className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={busquedaCliente} onChange={onInputCliente} />
                          {clientesResultados.length > 0 && (
                              <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                  {clientesResultados.map(c => (
                                      <div key={c.ID} onClick={() => { setCliente(c); setBusquedaCliente(''); setClientesResultados([]); }} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                          {c.Nombre}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
                  {modoVenta === 'APARTADO' && !cliente && (
                      <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">⚠ Requerido para apartar</p>
                  )}
              </div>

              {/* 3. TOTALES Y CAJÓN DE ABONO */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
                  
                  {/* Cajón de Abono (Solo visible en APARTADO) */}
                  {modoVenta === 'APARTADO' && (
                      <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in">
                          <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Abono Inicial</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-800 font-bold">$</span>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full pl-8 pr-3 py-2 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-xl font-bold text-orange-900"
                                placeholder="0.00"
                                value={abonoInicial}
                                onChange={e => setAbonoInicial(e.target.value)}
                              />
                          </div>
                      </div>
                  )}

                  <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-500">
                          <span>Subtotal</span>
                          <span>${calcularTotal().toFixed(2)}</span>
                      </div>
                      
                      {modoVenta === 'APARTADO' && (
                          <>
                            <div className="flex justify-between text-orange-600 font-medium">
                                <span>Abono</span>
                                <span>- ${parseFloat(abonoInicial || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-300 my-2"></div>
                            <div className="flex justify-between text-gray-500">
                                <span>Resta por pagar</span>
                                <span className="font-bold text-gray-700">${calcularRestante().toFixed(2)}</span>
                            </div>
                          </>
                      )}

                      <div className="flex justify-between text-2xl font-bold text-indigo-900 border-t pt-4 mt-4">
                          <span>Total</span>
                          <span>${calcularTotal().toFixed(2)}</span>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <button 
                          onClick={procesarTransaccion}
                          disabled={procesando || carrito.length === 0}
                          className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2
                            ${modoVenta === 'DIRECTA' 
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                            }`}
                      >
                          {procesando ? 'Procesando...' : modoVenta === 'DIRECTA' ? 'COBRAR TOTAL (F2)' : 'APARTAR LIBROS'}
                      </button>
                      
                      <button 
                          onClick={solicitarCancelar}
                          disabled={carrito.length === 0}
                          className="w-full py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                          Cancelar Transacción
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.action}
          title={confirmModal.title}
          message={confirmModal.message}
          tipo="danger"
      />
    </div>
  );
};

export default CajaLibreria;