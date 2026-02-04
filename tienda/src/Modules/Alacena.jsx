import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import HistorialAlacena from './HistorialAlacena';

const Alacena = () => {
  const { notify } = useNotification();
  
  // Tabs: 'INVENTARIO' | 'DESPENSA' | 'HISTORIAL'
  const [activeTab, setActiveTab] = useState('INVENTARIO'); 

  // --- DATOS GENERALES ---
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('');

  // --- ESTADOS TAB INVENTARIO (CRUD) ---
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({ 
      id: null, nombre: '', categoria: '', unidad: 'Pieza', vencimiento: '', stock: 0 
  });
  
  // NUEVO: MODAL PARA AJUSTE RÁPIDO DE STOCK (Entrada/Salida)
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [formAjuste, setFormAjuste] = useState({ 
      id: null, nombre: '', tipo: 'ENTRADA', cantidad: '', motivo: '' 
  });

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, nombre: '' });

  // --- ESTADOS TAB DESPENSA (Salida Masiva) ---
  const [carritoDespensa, setCarritoDespensa] = useState([]);
  const [motivoDespensa, setMotivoDespensa] = useState('');
  const [procesandoDespensa, setProcesandoDespensa] = useState(false);

  // --- CARGA INICIAL ---
  const cargarInventario = async () => {
    setCargando(true);
    try {
      const res = await apiCall('/api/alacena');
      setArticulos(res.data || []);
    } catch (error) { notify('Error cargando alacena', 'error'); }
    finally { setCargando(false); }
  };

  useEffect(() => { 
      if (activeTab === 'INVENTARIO' || activeTab === 'DESPENSA') {
          cargarInventario(); 
      }
  }, [activeTab]);

  // ==========================================
  // LÓGICA DE INVENTARIO (CRUD)
  // ==========================================

  const abrirModal = (articulo = null) => {
      if (articulo) {
          setModoEdicion(true);
          setFormData({
              id: articulo.ID,
              nombre: articulo.Nombre,
              categoria: articulo.Categoria,
              unidad: articulo.Unidad,
              stock: articulo.Stock, // Solo para visualización (se bloquea en edición)
              vencimiento: articulo.Fecha_Vencimiento ? articulo.Fecha_Vencimiento.split('T')[0] : ''
          });
      } else {
          setModoEdicion(false);
          // Reiniciamos stock en 0 al crear nuevo
          setFormData({ id: null, nombre: '', categoria: '', unidad: 'Pieza', vencimiento: '', stock: 0 });
      }
      setModalFormOpen(true);
  };

  const guardarArticulo = async (e) => {
      e.preventDefault();
      try {
          if (modoEdicion) {
              // En edición el stock se ignora en el backend (ver modelo anterior)
              await apiCall(`/api/alacena/articulo/${formData.id}`, 'PUT', formData);
              notify('Información del producto actualizada', 'success');
          } else {
              // En creación, si hay stock, el backend crea el registro de "Inventario Inicial"
              if (formData.stock < 0) return notify('El stock inicial no puede ser negativo', 'warning');
              await apiCall('/api/alacena/articulo', 'POST', formData);
              notify('Producto creado exitosamente', 'success');
          }
          setModalFormOpen(false);
          cargarInventario();
      } catch (error) { notify('Error al guardar datos', 'error'); }
  };

  // --- NUEVA LÓGICA: AJUSTE RÁPIDO (RAYO) ---
  const abrirAjusteStock = (articulo) => {
      setFormAjuste({
          id: articulo.ID,
          nombre: articulo.Nombre,
          tipo: 'ENTRADA', // Por defecto 'ENTRADA' (Compra/Donación)
          cantidad: '',
          motivo: ''
      });
      setModalAjusteOpen(true);
  };

  const guardarAjusteStock = async (e) => {
      e.preventDefault();
      if (!formAjuste.cantidad || formAjuste.cantidad <= 0) return notify('Ingresa una cantidad válida', 'warning');
      if (!formAjuste.motivo.trim()) return notify('Debes escribir un motivo', 'warning');

      try {
          await apiCall('/api/alacena/movimiento', 'POST', {
              idArticulo: formAjuste.id,
              tipo: formAjuste.tipo,
              cantidad: parseInt(formAjuste.cantidad),
              motivo: formAjuste.motivo
          });
          notify('Inventario ajustado correctamente', 'success');
          setModalAjusteOpen(false);
          cargarInventario(); // Refrescamos la tabla para ver el nuevo stock
      } catch (error) { 
          notify(error.response?.data?.error || 'Error al ajustar stock', 'error'); 
      }
  };

  const eliminarArticulo = async () => {
      try {
          await apiCall(`/api/alacena/articulo/${confirmDelete.id}`, 'DELETE');
          notify('Artículo eliminado', 'success');
          setConfirmDelete({ open: false, id: null, nombre: '' });
          cargarInventario();
      } catch (error) { notify('Error al eliminar', 'error'); }
  };

  // ==========================================
  // LÓGICA DE DESPENSA (SALIDA MASIVA)
  // ==========================================

  const agregarADespensa = (articulo) => {
      if (articulo.Stock <= 0) return notify('No hay stock disponible', 'error');
      
      setCarritoDespensa(prev => {
          const existe = prev.find(i => i.id === articulo.ID);
          if (existe) {
              if (existe.cantidad + 1 > articulo.Stock) {
                  notify('Stock insuficiente', 'error');
                  return prev;
              }
              return prev.map(i => i.id === articulo.ID ? { ...i, cantidad: i.cantidad + 1 } : i);
          }
          return [...prev, { id: articulo.ID, nombre: articulo.Nombre, cantidad: 1, max: articulo.Stock }];
      });
  };

  const quitarDeDespensa = (id) => {
      setCarritoDespensa(prev => prev.filter(i => i.id !== id));
  };

  const cambiarCantidadDespensa = (id, delta) => {
      setCarritoDespensa(prev => prev.map(item => {
          if (item.id === id) {
              const nueva = item.cantidad + delta;
              if (nueva < 1) return item;
              if (nueva > item.max) { notify('Máximo stock alcanzado', 'error'); return item; }
              return { ...item, cantidad: nueva };
          }
          return item;
      }));
  };

  const confirmarSalidaDespensa = async () => {
      if (carritoDespensa.length === 0) return notify('Despensa vacía', 'error');
      if (!motivoDespensa.trim()) return notify('Debes escribir un motivo (ej: Familia Gomez)', 'error');
      
      setProcesandoDespensa(true);
      try {
          const res = await apiCall('/api/alacena/despensa', 'POST', {
              items: carritoDespensa,
              motivo: motivoDespensa
          });
          
          if (res.data.success) {
              notify('Despensa entregada con éxito', 'success');
              setCarritoDespensa([]);
              setMotivoDespensa('');
              cargarInventario(); 
          }
      } catch (error) {
          notify(error.response?.data?.error || 'Error al procesar', 'error');
      } finally {
          setProcesandoDespensa(false);
      }
  };

  // ==========================================
  // RENDER Y AYUDAS VISUALES
  // ==========================================

  const listaFiltrada = articulos.filter(a => a.Nombre.toLowerCase().includes(filtro.toLowerCase()));
  
  const checkVencimiento = (fecha) => {
      if (!fecha) return { texto: '--', color: 'text-gray-400' };
      const days = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
      if (days < 0) return { texto: 'VENCIDO', color: 'text-red-600 font-bold bg-red-50 px-2 rounded' };
      if (days < 30) return { texto: `${days} días`, color: 'text-orange-600 font-bold' };
      return { texto: new Date(fecha).toLocaleDateString(), color: 'text-green-600' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-md flex items-center gap-2">
              📦 Alacena Solidaria
          </h1>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex space-x-4 mb-6 border-b border-white/20 overflow-x-auto custom-scrollbar">
          {['INVENTARIO', 'DESPENSA', 'HISTORIAL'].map(tab => (
              <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 whitespace-nowrap 
                  ${activeTab === tab 
                      ? 'border-blue-400 text-blue-300' 
                      : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                  {tab === 'INVENTARIO' ? 'Gestionar Inventario' : tab === 'DESPENSA' ? '📤 Armar Despensa' : '📋 Bitácora'}
              </button>
          ))}
      </div>

      {/* VISTA 1: INVENTARIO (CRUD) */}
      {activeTab === 'INVENTARIO' && (
          <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                  <input 
                    type="text" placeholder="🔍 Buscar producto..." 
                    className="w-full sm:w-1/3 border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                    value={filtro} onChange={e => setFiltro(e.target.value)}
                  />
                  <button 
                    onClick={() => abrirModal()} 
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg text-lg flex items-center justify-center gap-2"
                  >
                      <span>+</span> Nuevo Producto
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold">
                              <tr>
                                  <th className="px-6 py-4">Producto</th>
                                  <th className="px-6 py-4">Categoría</th>
                                  <th className="px-6 py-4 text-center">Vencimiento</th>
                                  <th className="px-6 py-4 text-center">Stock</th>
                                  <th className="px-6 py-4 text-center">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {listaFiltrada.map(art => {
                                  const v = checkVencimiento(art.Fecha_Vencimiento);
                                  return (
                                      <tr key={art.ID} className="hover:bg-blue-50 transition-colors group">
                                          <td className="px-6 py-4 font-bold text-gray-800 text-lg">{art.Nombre}</td>
                                          <td className="px-6 py-4 text-gray-500">{art.Categoria}</td>
                                          <td className="px-6 py-4 text-center text-sm"><span className={v.color}>{v.texto}</span></td>
                                          <td className={`px-6 py-4 text-center font-bold text-xl ${art.Stock < 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                                              {art.Stock}
                                          </td>
                                          <td className="px-6 py-4 text-center flex justify-center gap-2 items-center">
                                              
                                              {/* BOTÓN AJUSTE RÁPIDO */}
                                              <button 
                                                  onClick={() => abrirAjusteStock(art)}
                                                  className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-2 rounded-lg shadow-sm text-sm font-bold flex items-center gap-1 transition-transform hover:scale-105"
                                                  title="Registrar Entrada/Salida Rápida"
                                              >
                                                  ⚡ Ajustar
                                              </button>

                                              <button onClick={() => abrirModal(art)} className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-bold text-sm">Editar</button>
                                              <button onClick={() => setConfirmDelete({ open: true, id: art.ID, nombre: art.Nombre })} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-bold text-sm">✕</button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {listaFiltrada.length === 0 && (
                                  <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No se encontraron productos.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* VISTA 2: ARMAR DESPENSA (CAJA DE SALIDA) */}
      {activeTab === 'DESPENSA' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* IZQUIERDA: BUSCADOR */}
              <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      <input 
                        type="text" placeholder="🔍 Buscar producto para agregar..." 
                        className="w-full border-2 border-red-100 p-4 rounded-xl focus:ring-4 focus:ring-red-200 outline-none text-xl font-medium"
                        value={filtro} onChange={e => setFiltro(e.target.value)}
                        autoFocus
                      />
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-red-50 text-red-800 text-sm uppercase font-bold sticky top-0">
                              <tr>
                                  <th className="px-6 py-4">Producto</th>
                                  <th className="px-6 py-4 text-center">Disponible</th>
                                  <th className="px-6 py-4 text-right">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {listaFiltrada.map(art => (
                                  <tr key={art.ID} className={`hover:bg-red-50 transition-colors ${art.Stock === 0 ? 'opacity-50' : ''}`}>
                                      <td className="px-6 py-4 font-bold text-gray-800 text-lg">{art.Nombre}</td>
                                      <td className="px-6 py-4 text-center font-bold text-gray-600 text-lg">{art.Stock}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => agregarADespensa(art)}
                                            disabled={art.Stock === 0}
                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-5 py-2 rounded-full text-sm font-bold disabled:cursor-not-allowed shadow-sm active:scale-95 transition-transform"
                                          >
                                              {art.Stock === 0 ? 'AGOTADO' : 'AGREGAR +'}
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* DERECHA: CARRITO */}
              <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 flex flex-col h-fit sticky top-6">
                  <h3 className="text-2xl font-bold text-red-800 mb-4 border-b pb-4 flex items-center gap-2">
                      📤 Canasta de Salida
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] mb-4 space-y-2 custom-scrollbar">
                      {carritoDespensa.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                              <span className="text-4xl mb-2">🛒</span>
                              <p className="italic">Canasta vacía.</p>
                          </div>
                      ) : (
                          carritoDespensa.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                      <p className="font-bold text-base text-gray-800 truncate">{item.nombre}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mx-2 bg-white rounded-lg border px-2 py-1">
                                      <button onClick={() => cambiarCantidadDespensa(item.id, -1)} className="text-lg font-bold text-gray-500 hover:text-red-600 px-2">-</button>
                                      <span className="text-lg font-bold w-6 text-center">{item.cantidad}</span>
                                      <button onClick={() => cambiarCantidadDespensa(item.id, 1)} className="text-lg font-bold text-gray-500 hover:text-green-600 px-2">+</button>
                                  </div>
                                  <button onClick={() => quitarDeDespensa(item.id)} className="text-red-400 hover:text-red-600 font-bold p-2 text-xl">×</button>
                              </div>
                          ))
                      )}
                  </div>

                  <div className="mt-auto space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-600 uppercase mb-2">Motivo / Destinatario *</label>
                          <input 
                              type="text" placeholder="Ej: Familia Rodriguez"
                              className="w-full border-2 p-3 rounded-xl focus:ring-4 focus:ring-red-100 outline-none text-lg"
                              value={motivoDespensa} onChange={e => setMotivoDespensa(e.target.value)}
                          />
                      </div>
                      
                      <button 
                          onClick={confirmarSalidaDespensa}
                          disabled={carritoDespensa.length === 0 || procesandoDespensa}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {procesandoDespensa ? 'Procesando...' : 'CONFIRMAR SALIDA'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* VISTA 3: HISTORIAL */}
      {activeTab === 'HISTORIAL' && (
          <div className="animate-fade-in">
              <HistorialAlacena />
          </div>
      )}

      {/* --- MODAL CREAR/EDITAR INFO (DISEÑO ACCESIBLE) --- */}
      {modalFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 animate-fade-in-up border border-gray-100 max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center mb-8 border-b pb-4">
                      <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                          {modoEdicion ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                      </h2>
                      <button onClick={() => setModalFormOpen(false)} className="text-gray-400 hover:text-red-500 text-4xl font-bold transition-colors">&times;</button>
                  </div>

                  <form onSubmit={guardarArticulo} className="space-y-6">
                      
                      {/* NOMBRE */}
                      <div>
                          <label className="block text-xl font-bold text-gray-700 mb-2">Nombre del Producto</label>
                          <input 
                              required type="text" placeholder="Ej: Arroz, Aceite..." 
                              className="w-full border-2 border-gray-300 p-4 rounded-xl text-xl focus:ring-4 focus:ring-indigo-200 outline-none placeholder-gray-300 font-medium"
                              value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} 
                          />
                      </div>

                      {/* GRID DE OPCIONES */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* CATEGORÍA */}
                          <div>
                              <label className="block text-xl font-bold text-gray-700 mb-2">📂 Categoría</label>
                              <select 
                                  className="w-full border-2 border-gray-300 p-4 rounded-xl text-lg bg-white h-[68px]"
                                  value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                              >
                                  <option value="">-- Seleccionar --</option>
                                  <option value="Granos">Granos</option>
                                  <option value="Enlatados">Enlatados</option>
                                  <option value="Aceites">Aceites</option>
                                  <option value="Higiene">Higiene</option>
                                  <option value="Limpieza">Limpieza</option>
                                  <option value="Otros">Otros</option>
                              </select>
                          </div>

                          {/* UNIDAD */}
                          <div>
                              <label className="block text-xl font-bold text-gray-700 mb-2">📏 Unidad</label>
                              <select 
                                  className="w-full border-2 border-gray-300 p-4 rounded-xl text-lg bg-white h-[68px]"
                                  value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})}
                              >
                                  <option value="Pieza">Pieza (Unidad)</option>
                                  <option value="Kg">Kilogramo (Kg)</option>
                                  <option value="Litro">Litro (L)</option>
                                  <option value="Paquete">Paquete / Caja</option>
                              </select>
                          </div>

                          {/* VENCIMIENTO */}
                          <div>
                              <label className="block text-xl font-bold text-gray-700 mb-2">📅 Vencimiento</label>
                              <input 
                                  type="date" 
                                  className="w-full border-2 border-gray-300 p-4 rounded-xl text-lg h-[68px]"
                                  value={formData.vencimiento} onChange={e => setFormData({...formData, vencimiento: e.target.value})} 
                              />
                          </div>

                          {/* STOCK (CONDICIONAL) */}
                          {modoEdicion ? (
                              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex flex-col justify-center items-center text-center">
                                  <span className="text-2xl mb-1">🔒</span>
                                  <p className="text-sm text-yellow-800 font-bold leading-tight">
                                      El stock se gestiona con el botón "⚡ Ajustar" en la tabla.
                                  </p>
                              </div>
                          ) : (
                              <div>
                                  <label className="block text-xl font-bold text-gray-700 mb-2">📦 Stock Inicial</label>
                                  <input 
                                      required type="number" min="0" 
                                      className="w-full border-2 border-gray-300 p-4 rounded-xl text-2xl font-bold text-blue-800 h-[68px]"
                                      value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} 
                                  />
                              </div>
                          )}
                      </div>

                      <div className="mt-8 flex justify-end gap-4 pt-4 border-t border-gray-100">
                          <button type="button" onClick={() => setModalFormOpen(false)} className="px-8 py-4 rounded-xl text-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                          <button type="submit" className="px-10 py-4 rounded-xl text-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg flex items-center gap-2">💾 Guardar Datos</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- MODAL AJUSTE DE STOCK (NUEVO) --- */}
      {modalAjusteOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fade-in-up border-t-8 border-yellow-400">
                  <h2 className="text-3xl font-extrabold text-gray-800 mb-2">⚡ Ajuste Rápido</h2>
                  <p className="text-gray-500 mb-8 font-medium text-lg">
                      Producto: <span className="text-indigo-600 font-bold">{formAjuste.nombre}</span>
                  </p>

                  <form onSubmit={guardarAjusteStock} className="space-y-6">
                      
                      {/* SELECTOR TIPO GIGANTE */}
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                              type="button"
                              onClick={() => setFormAjuste({...formAjuste, tipo: 'ENTRADA'})}
                              className={`p-6 rounded-2xl border-2 font-bold text-xl flex flex-col items-center gap-2 transition-all ${
                                  formAjuste.tipo === 'ENTRADA' 
                                  ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105' 
                                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
                              }`}
                          >
                              <span className="text-4xl">📥</span> ENTRADA
                              <span className="text-xs font-normal">Compra / Donación</span>
                          </button>
                          <button 
                              type="button"
                              onClick={() => setFormAjuste({...formAjuste, tipo: 'SALIDA'})}
                              className={`p-6 rounded-2xl border-2 font-bold text-xl flex flex-col items-center gap-2 transition-all ${
                                  formAjuste.tipo === 'SALIDA' 
                                  ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105' 
                                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
                              }`}
                          >
                              <span className="text-4xl">📤</span> SALIDA
                              <span className="text-xs font-normal">Merma / Ajuste</span>
                          </button>
                      </div>

                      {/* CANTIDAD */}
                      <div>
                          <label className="block text-xl font-bold text-gray-700 mb-2">Cantidad</label>
                          <input 
                              autoFocus
                              required type="number" min="1" 
                              className="w-full border-2 border-gray-300 p-5 rounded-xl text-4xl font-bold text-center text-gray-800 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100" 
                              value={formAjuste.cantidad} 
                              onChange={e => setFormAjuste({...formAjuste, cantidad: e.target.value})} 
                          />
                      </div>

                      {/* MOTIVO */}
                      <div>
                          <label className="block text-xl font-bold text-gray-700 mb-2">Motivo / Razón</label>
                          <input 
                              required type="text" placeholder="Ej: Compra semanal, Error de conteo..." 
                              className="w-full border-2 border-gray-300 p-4 rounded-xl text-xl outline-none focus:border-yellow-400" 
                              value={formAjuste.motivo} 
                              onChange={e => setFormAjuste({...formAjuste, motivo: e.target.value})} 
                          />
                      </div>

                      <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                          <button type="button" onClick={() => setModalAjusteOpen(false)} className="px-6 py-3 rounded-xl text-lg font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                          <button type="submit" className="px-8 py-3 rounded-xl text-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 shadow-lg transform active:scale-95 transition-transform">Confirmar Ajuste</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL ELIMINAR */}
      <ConfirmModal 
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null, nombre: '' })}
          onConfirm={eliminarArticulo}
          title="¿Eliminar Artículo?"
          message={`Estás a punto de eliminar "${confirmDelete.nombre}".`}
          tipo="danger"
      />
    </div>
  );
};

export default Alacena;