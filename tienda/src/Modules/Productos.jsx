import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // <--- 1. Importar Hook
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal'; // <--- 2. Importar Modal

const GestionProductos = () => {
  const { hasPermission } = useAuth();
  const { notify } = useNotification(); // <--- 3. Usar Hook

  // Estados principales
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para búsqueda
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    producto: '',
    precio_proveedor: '',
    stock: '',         
    stock_minimo: 5,   
    precio_publico: '',
    codigo: '',
    fecha_caducidad: '' 
  });
  
  // Estados para selección
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estado para el Modal de Confirmación
  const [confirmModal, setConfirmModal] = useState({ 
      isOpen: false, 
      action: null, 
      title: '', 
      message: '', 
      tipo: 'danger' 
  });

  // Cargar todos los productos
  const cargarProductos = async () => {
    if (!hasPermission('view.product')) return;

    setCargando(true);
    try {
      const response = await apiCall('/api/productos/todos');
      const data = response.data; 
      
      setProductos(data);
      setProductosFiltrados(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      notify('Error al cargar los productos', 'error');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar productos
  useEffect(() => {
    if (!busqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto =>
        producto.Producto.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.Codigo && producto.Codigo.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  // Cargar al montar
  useEffect(() => {
    cargarProductos();
  }, []);

  const limpiarFormulario = () => {
    setFormData({
      producto: '',
      precio_proveedor: '',
      stock: '',
      stock_minimo: 5,
      precio_publico: '',
      codigo: '',
      fecha_caducidad: ''
    });
  };

  const abrirFormularioAgregar = () => {
    setMostrarFormulario(true);
    setModoEdicion(false);
    limpiarFormulario();
    setProductoEditando(null);
    setProductoSeleccionado(null);
  };

  const abrirFormularioEditar = (producto) => {
    setMostrarFormulario(true);
    setModoEdicion(true);
    setFormData({
      producto: producto.Producto,
      precio_proveedor: producto.Precio_Proveedor || '',
      stock: producto.Stock || 0,
      stock_minimo: producto.Stock_Minimo || 5,
      precio_publico: producto.Precio_Publico || '',
      codigo: producto.Codigo || '',
      fecha_caducidad: producto.Fecha_Caducidad ? producto.Fecha_Caducidad.split('T')[0] : ''
    });
    setProductoEditando(producto);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    limpiarFormulario();
    setProductoEditando(null);
    setProductoSeleccionado(null);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!formData.producto.trim()) {
      notify('El nombre del producto es requerido', 'error');
      return;
    }
    if (!formData.precio_publico || parseFloat(formData.precio_publico) <= 0) {
      notify('El precio público es requerido', 'error');
      return;
    }

    try {
      const endpoint = modoEdicion 
        ? `/api/productos/editar/${productoEditando.ID}`
        : `/api/productos/agregar`;
      
      const method = modoEdicion ? 'PUT' : 'POST';

      const payload = {
        producto: formData.producto.trim(),
        precio_proveedor: formData.precio_proveedor ? parseFloat(formData.precio_proveedor) : null,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        stock_minimo: formData.stock_minimo ? parseInt(formData.stock_minimo) : 5,
        precio_publico: parseFloat(formData.precio_publico),
        codigo: formData.codigo.trim() || null,
        fecha_caducidad: formData.fecha_caducidad || null
      };

      const response = await apiCall(endpoint, method, payload);

      if (response.data.success) {
        notify(response.data.mensaje, 'success');
        cerrarFormulario();
        cargarProductos();
      } else {
        notify(response.data.error || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error guardando:', error);
      notify('Error de conexión al guardar producto', 'error');
    }
  };

  // --- ELIMINAR CON MODAL ---
  const solicitarEliminar = (producto) => {
    setConfirmModal({
        isOpen: true,
        title: '¿Eliminar Producto?',
        message: `¿Estás seguro de eliminar "${producto.Producto}"? Esta acción no se puede deshacer.`,
        tipo: 'danger',
        action: () => ejecutarEliminar(producto.ID)
    });
  };

  const ejecutarEliminar = async (id) => {
    try {
      const response = await apiCall(`/api/productos/eliminar/${id}`, 'DELETE');

      if (response.data.success) {
        notify(response.data.mensaje, 'success');
        setProductoSeleccionado(null);
        cargarProductos();
      } else {
        notify(response.data.error, 'error');
      }
    } catch (error) {
      notify('Error de conexión al eliminar', 'error');
    } finally {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const formatearFecha = (fecha) => {
    if(!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // ---------------- RENDER ----------------
  
  if (!hasPermission('view.product')) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">
            No tienes permisos para ver el catálogo de productos.
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
        </div>

        {/* --- FORMULARIO (Agregar/Editar) --- */}
        {mostrarFormulario ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            
            <form onSubmit={manejarEnvio} className="space-y-4">
              {/* Nombre y Código */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    name="producto"
                    value={formData.producto}
                    onChange={manejarCambio}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={manejarCambio}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Proveedor</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_proveedor"
                    value={formData.precio_proveedor}
                    onChange={manejarCambio}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-bold text-blue-800">Precio Público *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_publico"
                    value={formData.precio_publico}
                    onChange={manejarCambio}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                 {/* Fecha Caducidad */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caducidad</label>
                  <input
                    type="date"
                    name="fecha_caducidad"
                    value={formData.fecha_caducidad}
                    onChange={manejarCambio}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Inventario */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Actual</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={manejarCambio}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={manejarCambio}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
                <button type="button" onClick={cerrarFormulario} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* --- BARRA SUPERIOR (Buscador y Agregar) --- */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
              </div>
              
              {/* Botón AGREGAR */}
              {hasPermission('add.product') && (
                <button
                  onClick={abrirFormularioAgregar}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2 shadow-sm"
                >
                  <span>+ Nuevo Producto</span>
                </button>
              )}
            </div>

            {/* --- PANEL DE ACCIONES (Editar/Eliminar) --- */}
            {productoSeleccionado && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in-down">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-medium text-blue-900">Seleccionado:</p>
                    <p className="text-blue-700 text-xl font-bold">{productoSeleccionado.Producto}</p>
                    <p className="text-sm text-blue-600">Stock: {productoSeleccionado.Stock}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    {/* Botón EDITAR */}
                    {hasPermission('update.product') && (
                        <button
                        onClick={() => abrirFormularioEditar(productoSeleccionado)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium flex items-center gap-2"
                        >
                        Editar
                        </button>
                    )}

                    {/* Botón ELIMINAR (Con Modal) */}
                    {hasPermission('delete.product') && (
                        <button
                        onClick={() => solicitarEliminar(productoSeleccionado)} // <--- Acción con Modal
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium flex items-center gap-2"
                        >
                        Eliminar
                        </button>
                    )}

                    <button
                      onClick={() => setProductoSeleccionado(null)}
                      className="text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- TABLA DE PRODUCTOS (CON SCROLL) --- */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {cargando ? (
                <div className="p-10 text-center text-blue-500">Cargando catálogo...</div>
              ) : (
                // Scroll container: max-h-[600px] y overflow-auto (X y Y)
                <div className="max-h-[600px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    {/* Header sticky para que no se pierda al hacer scroll */}
                    <thead className="bg-gray-100 text-gray-600 uppercase font-bold text-xs sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3 text-right">P. Público</th>
                        <th className="px-4 py-3 text-center">Stock</th>
                        <th className="px-4 py-3">Caducidad</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productosFiltrados.length > 0 ? (
                        productosFiltrados.map(prod => (
                          <tr 
                            key={prod.ID} 
                            onClick={() => setProductoSeleccionado(prod)}
                            className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                              productoSeleccionado?.ID === prod.ID ? 'bg-blue-100' : 'bg-white'
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{prod.Producto}</td>
                            <td className="px-4 py-3 text-gray-500">{prod.Codigo || '-'}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">
                                ${parseFloat(prod.Precio_Publico).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {/* Alerta visual de stock bajo */}
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    prod.Stock <= (prod.Stock_Minimo || 5) 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                    {prod.Stock}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                                {formatearFecha(prod.Fecha_Caducidad)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {productoSeleccionado?.ID === prod.ID ? (
                                    <span className="text-blue-600">●</span>
                                ) : (
                                    <span className="text-gray-300">○</span>
                                )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No se encontraron productos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
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

export default GestionProductos;