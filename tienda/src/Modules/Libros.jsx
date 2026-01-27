import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal'; // <-Componente de Confirmacio Aceptar/Cancelar de operaciones 

const GestionLibros = () => {
  const { hasPermission } = useAuth(); 
  const { notify } = useNotification();

  // Estados Datos
  const [libros, setLibros] = useState([]);
  const [librosFiltrados, setLibrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados Modal Formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [libroEditando, setLibroEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // Estado Modal Confirmación (NUEVO)
  const [confirmData, setConfirmData] = useState({ isOpen: false, id: null, titulo: '' });

  const [formData, setFormData] = useState({
    titulo: '', autor: '', editorial: '',
    precio: '', stock: 0, codigo: '', descuento: 0
  });

  const cargarLibros = async () => {
    setCargando(true);
    try {
      const response = await apiCall('/api/libreria/libros/todos'); 
      const data = response.data || [];
      setLibros(data);
      setLibrosFiltrados(data);
    } catch (error) { 
        console.error(error);
        notify('Error al cargar libros', 'error');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargarLibros(); }, []);

  useEffect(() => {
    if (!busqueda.trim()) {
      setLibrosFiltrados(libros);
    } else {
      const lower = busqueda.toLowerCase();
      const filtrados = libros.filter(libro =>
        libro.Titulo.toLowerCase().includes(lower) ||
        (libro.Autor && libro.Autor.toLowerCase().includes(lower)) ||
        (libro.Codigo && libro.Codigo.toLowerCase().includes(lower))
      );
      setLibrosFiltrados(filtrados);
    }
  }, [busqueda, libros]);

  // --- LÓGICA FORMULARIO ---
  const abrirModal = (libro = null) => {
    if (libro) {
        setModoEdicion(true);
        setLibroEditando(libro);
        setFormData({
            titulo: libro.Titulo,
            autor: libro.Autor || '',
            editorial: libro.Editorial || '',
            precio: libro.Precio,
            stock: libro.Stock,
            codigo: libro.Codigo || '',
            descuento: libro.Descuento || 0
        });
    } else {
        setModoEdicion(false);
        setLibroEditando(null);
        setFormData({ titulo: '', autor: '', editorial: '', precio: '', stock: 0, codigo: '', descuento: 0 });
    }
    setMostrarFormulario(true);
  };

  const guardarLibro = async (e) => {
      e.preventDefault();
      setGuardando(true);
      try {
          const endpoint = modoEdicion 
            ? `/api/libreria/libros/editar/${libroEditando.ID}`
            : `/api/libreria/libros/agregar`;
          const method = modoEdicion ? 'PUT' : 'POST';
          
          const response = await apiCall(endpoint, method, formData);
          
          if (response.data.success) {
              setMostrarFormulario(false);
              cargarLibros();
              notify(response.data.message || 'Operación exitosa', 'success');
          } else if (response.data.errors) {
              notify(response.data.errors[0].msg, 'error');
          } else {
              notify(response.data.error || 'Error desconocido', 'error');
          }
      } catch (error) {
          notify('Error de conexión', 'error');
      } finally {
          setGuardando(false);
      }
  };

  // --- LÓGICA DE ELIMINACIÓN (SIN ALERT) ---
  
  // 1. Abrir modal
  const solicitarEliminacion = (libro) => {
      setConfirmData({
          isOpen: true,
          id: libro.ID,
          titulo: libro.Titulo
      });
  };

  // 2. Ejecutar acción
  const confirmarEliminacion = async () => {
      if (!confirmData.id) return;
      try {
          const response = await apiCall(`/api/libreria/libros/eliminar/${confirmData.id}`, 'DELETE');
          if(response.data.success) {
              cargarLibros();
              notify('Libro eliminado correctamente', 'success');
          } else {
              notify(response.data.error || 'No se pudo eliminar', 'error');
          }
      } catch (error) { notify('Error al eliminar', 'error'); }
      finally {
          setConfirmData({ isOpen: false, id: null, titulo: '' }); // Cerrar modal
      }
  };

  const calcularPrecioFinal = (precio, descuento) => {
      const p = parseFloat(precio);
      const d = parseFloat(descuento);
      if (!d || d === 0) return p;
      return p - (p * (d / 100));
  };

  if (!hasPermission('view.book')) return <div className="p-8 text-center">Sin acceso</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Libros</h1>
        <button 
            onClick={() => abrirModal()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-md"
        >
            <span>+</span> Nuevo Libro
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="mb-6 relative">
          <input 
            type="text" placeholder="Buscar por título, autor o ISBN..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">🔍</div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                    <tr>
                        <th className="px-6 py-3 font-bold text-gray-600">Título / ISBN</th>
                        <th className="px-6 py-3 font-bold text-gray-600">Info</th>
                        <th className="px-6 py-3 font-bold text-center text-gray-600">Stock</th>
                        <th className="px-6 py-3 font-bold text-right text-gray-600">Precio</th>
                        <th className="px-6 py-3 font-bold text-center text-gray-600">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {cargando ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando...</td></tr>
                    ) : librosFiltrados.map(libro => {
                        const precioFinal = calcularPrecioFinal(libro.Precio, libro.Descuento);
                        const tieneDescuento = libro.Descuento > 0;
                        return (
                            <tr key={libro.ID} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{libro.Titulo}</div>
                                    <div className="text-xs text-gray-500 font-mono">{libro.Codigo || 'S/N'}</div>
                                    {tieneDescuento && (
                                        <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">-{libro.Descuento}%</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-800 text-sm">{libro.Autor || 'N/A'}</div>
                                    <div className="text-xs text-indigo-600">{libro.Editorial}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${libro.Stock > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {libro.Stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {tieneDescuento ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400 line-through">${parseFloat(libro.Precio).toFixed(2)}</span>
                                            <span className="font-bold text-green-600 text-lg">${precioFinal.toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-gray-700">${parseFloat(libro.Precio).toFixed(2)}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center space-x-3">
                                    <button onClick={() => abrirModal(libro)} className="text-blue-600 hover:underline font-medium">Editar</button>
                                    <button onClick={() => solicitarEliminacion(libro)} className="text-red-600 hover:underline font-medium">Borrar</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>

      {/* --- MODAL CONFIRMACIÓN (REUTILIZABLE) --- */}
      <ConfirmModal 
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
        onConfirm={confirmarEliminacion}
        title="¿Eliminar Libro?"
        message={`Estás a punto de borrar "${confirmData.titulo}". Esta acción podría no ser reversible.`}
        tipo="danger"
      />

      {/* --- FORMULARIO FULLSCREEN (CON HEADER Y FOOTER FIJOS) --- */}
      {mostrarFormulario && (
          <div className="fixed inset-0 z-50 bg-white animate-fade-in flex flex-col h-full">
              
              {/* 1. HEADER FIJO (ARRIBA) */}
              <div className="flex-none px-6 py-4 bg-gray-100 border-b border-gray-300 flex justify-between items-center shadow-sm z-10">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                       <button onClick={() => setMostrarFormulario(false)} className="text-gray-500 hover:text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                       </button>
                      {modoEdicion ? 'Editar Libro' : 'Registrar Nuevo Libro'}
                  </h2>
                  <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              
              {/* 2. CUERPO SCROLLABLE (MEDIO) */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                      
                      <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h3>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Título del Libro *</label>
                              <input type="text" required autoFocus className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                  value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} 
                                  placeholder="Ej: El Principito"
                              />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Autor</label>
                                  <input type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                      value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Editorial</label>
                                  <input type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                      value={formData.editorial} onChange={e => setFormData({...formData, editorial: e.target.value})} 
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4 pt-4">
                          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Inventario y Precios</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-green-700 mb-1">Precio ($) *</label>
                                  <input type="number" required step="0.01" className="w-full border-2 border-green-100 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-xl font-bold text-green-800"
                                      value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-blue-700 mb-1">Stock (Obligatorio)</label>
                                  <input type="number" required min="0" className="w-full border-2 border-blue-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-blue-800"
                                      value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} 
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-red-600 mb-1">Descuento (%)</label>
                                  <input type="number" min="0" max="100" className="w-full border-2 border-red-100 p-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-xl font-bold text-red-800"
                                      value={formData.descuento} onChange={e => setFormData({...formData, descuento: e.target.value})} 
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Código de Barras / ISBN</label>
                              <div className="flex">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">|||||||</span>
                                <input type="text" className="w-full border p-3 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                    value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} 
                                    placeholder="Escanea el código aquí"
                                />
                              </div>
                          </div>
                      </div>
                      
                      {/* Espaciador para que el contenido no quede pegado al footer si hay mucho scroll */}
                      <div className="h-10"></div>
                  </div>
              </div>

              {/* 3. FOOTER FIJO (ABAJO) */}
              <div className="flex-none bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                  <button 
                    type="button" 
                    onClick={() => setMostrarFormulario(false)} 
                    className="px-6 py-3 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors text-lg"
                  >
                      Cancelar
                  </button>
                  <button 
                    onClick={guardarLibro} 
                    disabled={guardando}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg disabled:opacity-50 text-lg flex items-center gap-2 transform active:scale-95 transition-all"
                  >
                      {guardando ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Guardando...
                        </>
                      ) : (
                        'GUARDAR LIBRO'
                      )}
                  </button>
              </div>

          </div>
      )}
    </div>
  );
};

export default GestionLibros;