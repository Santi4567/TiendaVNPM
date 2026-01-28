import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

// 1. IMPORTAMOS EL COMPONENTE DE HISTORIAL
import HistorialAlacena from './HistorialAlacena';

const Alacena = () => {
  const { notify } = useNotification();
  
  // Tabs: Agregamos 'HISTORIAL' a las opciones
  const [activeTab, setActiveTab] = useState('INVENTARIO'); // 'INVENTARIO' | 'DESPENSA' | 'HISTORIAL'

  // Datos Generales
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('');

  // --- ESTADOS TAB INVENTARIO ---
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', categoria: '', unidad: 'Pieza', vencimiento: '' });
  
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, nombre: '' });

  // --- ESTADOS TAB DESPENSA (Salida Masiva) ---
  const [carritoDespensa, setCarritoDespensa] = useState([]);
  const [motivoDespensa, setMotivoDespensa] = useState('');
  const [procesandoDespensa, setProcesandoDespensa] = useState(false);

  // Carga inicial (Solo si estamos en INVENTARIO o DESPENSA para ahorrar recursos)
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
              vencimiento: articulo.Fecha_Vencimiento ? articulo.Fecha_Vencimiento.split('T')[0] : ''
          });
      } else {
          setModoEdicion(false);
          setFormData({ id: null, nombre: '', categoria: '', unidad: 'Pieza', vencimiento: '' });
      }
      setModalFormOpen(true);
  };

  const guardarArticulo = async (e) => {
      e.preventDefault();
      try {
          if (modoEdicion) {
              await apiCall(`/api/alacena/articulo/${formData.id}`, 'PUT', formData);
              notify('Artículo actualizado', 'success');
          } else {
              await apiCall('/api/alacena/articulo', 'POST', formData);
              notify('Artículo creado', 'success');
          }
          setModalFormOpen(false);
          cargarInventario();
      } catch (error) { notify('Error al guardar', 'error'); }
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
              cargarInventario(); // Recargar stocks
          }
      } catch (error) {
          notify(error.response?.data?.error || 'Error al procesar', 'error');
      } finally {
          setProcesandoDespensa(false);
      }
  };

  // ==========================================
  // RENDER
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">📦 Alacena Solidaria</h1>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button 
              onClick={() => setActiveTab('INVENTARIO')}
              className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'INVENTARIO' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Gestionar Inventario
          </button>
          <button 
              onClick={() => setActiveTab('DESPENSA')}
              className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'DESPENSA' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              📤 Armar Despensa (Salida)
          </button>
          
          {/* 2. NUEVO BOTÓN PARA EL HISTORIAL */}
          <button 
              onClick={() => setActiveTab('HISTORIAL')}
              className={`pb-3 px-6 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'HISTORIAL' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              📋 Bitácora / Historial
          </button>
      </div>

      {/* VISTA 1: INVENTARIO (CRUD) */}
      {activeTab === 'INVENTARIO' && (
          <div className="animate-fade-in">
              <div className="flex justify-between mb-4">
                  <input 
                    type="text" placeholder="Buscar producto..." 
                    className="w-1/3 border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filtro} onChange={e => setFiltro(e.target.value)}
                  />
                  <button onClick={() => abrirModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow">
                      + Nuevo Producto
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                  <tr key={art.ID} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 font-bold text-gray-800">{art.Nombre}</td>
                                      <td className="px-6 py-4 text-sm text-gray-500">{art.Categoria}</td>
                                      <td className="px-6 py-4 text-center text-sm"><span className={v.color}>{v.texto}</span></td>
                                      <td className={`px-6 py-4 text-center font-bold ${art.Stock < 5 ? 'text-red-500' : 'text-indigo-600'}`}>{art.Stock}</td>
                                      <td className="px-6 py-4 text-center space-x-3">
                                          <button onClick={() => abrirModal(art)} className="text-blue-600 hover:underline text-sm font-bold">Editar</button>
                                          <button 
                                            onClick={() => setConfirmDelete({ open: true, id: art.ID, nombre: art.Nombre })}
                                            className="text-red-500 hover:underline text-sm font-bold"
                                          >
                                              Eliminar
                                          </button>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
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
                        className="w-full border-2 border-red-100 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-lg"
                        value={filtro} onChange={e => setFiltro(e.target.value)}
                        autoFocus
                      />
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-red-50 text-red-800 text-xs uppercase font-bold sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Producto</th>
                                  <th className="px-6 py-3 text-center">Disponible</th>
                                  <th className="px-6 py-3 text-right">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {listaFiltrada.map(art => (
                                  <tr key={art.ID} className={`hover:bg-red-50 transition-colors ${art.Stock === 0 ? 'opacity-50' : ''}`}>
                                      <td className="px-6 py-3 font-medium text-gray-800">{art.Nombre}</td>
                                      <td className="px-6 py-3 text-center font-bold text-gray-600">{art.Stock}</td>
                                      <td className="px-6 py-3 text-right">
                                          <button 
                                            onClick={() => agregarADespensa(art)}
                                            disabled={art.Stock === 0}
                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1 rounded-full text-xs font-bold disabled:cursor-not-allowed"
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
                  <h3 className="text-xl font-bold text-red-800 mb-4 border-b pb-2 flex items-center gap-2">
                      📤 Canasta de Salida
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2">
                      {carritoDespensa.length === 0 ? (
                          <p className="text-gray-400 text-center italic py-10">Canasta vacía.<br/>Agrega productos de la izquierda.</p>
                      ) : (
                          carritoDespensa.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                                  <div className="flex-1">
                                      <p className="font-bold text-sm text-gray-800 truncate">{item.nombre}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mx-2">
                                      <button onClick={() => cambiarCantidadDespensa(item.id, -1)} className="w-6 h-6 bg-white rounded shadow text-xs font-bold">-</button>
                                      <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                      <button onClick={() => cambiarCantidadDespensa(item.id, 1)} className="w-6 h-6 bg-white rounded shadow text-xs font-bold">+</button>
                                  </div>
                                  <button onClick={() => quitarDeDespensa(item.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                              </div>
                          ))
                      )}
                  </div>

                  <div className="mt-auto space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Destinatario *</label>
                          <input 
                              type="text" placeholder="Ej: Familia Rodriguez"
                              className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                              value={motivoDespensa} onChange={e => setMotivoDespensa(e.target.value)}
                          />
                      </div>
                      
                      <button 
                          onClick={confirmarSalidaDespensa}
                          disabled={carritoDespensa.length === 0 || procesandoDespensa}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {procesandoDespensa ? 'Procesando...' : 'CONFIRMAR SALIDA'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. VISTA 3: HISTORIAL (RENDERIZAMOS EL COMPONENTE IMPORTADO) */}
      {activeTab === 'HISTORIAL' && (
          <div className="animate-fade-in">
              <HistorialAlacena />
          </div>
      )}

      {/* --- MODAL CREAR/EDITAR --- */}
      {modalFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                  <h2 className="text-xl font-bold mb-4">{modoEdicion ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
                  <form onSubmit={guardarArticulo}>
                      <div className="space-y-4">
                          <input required type="text" placeholder="Nombre" className="w-full border p-2 rounded" 
                              value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <select className="border p-2 rounded" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                                  <option value="">Categoría...</option>
                                  <option value="Granos">Granos</option>
                                  <option value="Enlatados">Enlatados</option>
                                  <option value="Aceites">Aceites</option>
                                  <option value="Higiene">Higiene</option>
                                  <option value="Otros">Otros</option>
                              </select>
                              <select className="border p-2 rounded" value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})}>
                                  <option value="Pieza">Pieza</option>
                                  <option value="Kg">Kg</option>
                                  <option value="Litro">Litro</option>
                                  <option value="Paquete">Paquete</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500">Vencimiento</label>
                              <input type="date" className="w-full border p-2 rounded" 
                                  value={formData.vencimiento} onChange={e => setFormData({...formData, vencimiento: e.target.value})} />
                          </div>
                      </div>
                      <div className="mt-6 flex justify-end gap-2">
                          <button type="button" onClick={() => setModalFormOpen(false)} className="text-gray-500 px-4 py-2">Cancelar</button>
                          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-bold">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- CONFIRM DELETE --- */}
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