import { useState, useEffect } from 'react';
import Header from './Header';

const GestionProductos = () => {
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
    unidades: '',
    precio_unidad: '',
    precio_publico: '',
    codigo: ''
  });
  
  // Estados para selección
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados para mensajes
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar todos los productos
  const cargarProductos = async () => {
    setCargando(true);
    try {
      const response = await fetch('http://localhost:3001/api/productos/todos');
      const productosData = await response.json();
      setProductos(productosData);
      setProductosFiltrados(productosData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      mostrarMensaje('error', 'Error al cargar los productos');
    } finally {
      setCargando(false);
    }
  };

  // Filtrar productos por búsqueda
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

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  // Función para mostrar mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 4000);
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFormData({
      producto: '',
      precio_proveedor: '',
      unidades: '',
      precio_unidad: '',
      precio_publico: '',
      codigo: ''
    });
  };

  // Abrir formulario para agregar
  const abrirFormularioAgregar = () => {
    setMostrarFormulario(true);
    setModoEdicion(false);
    limpiarFormulario();
    setProductoEditando(null);
    setProductoSeleccionado(null);
  };

  // Abrir formulario para editar
  const abrirFormularioEditar = (producto) => {
    setMostrarFormulario(true);
    setModoEdicion(true);
    setFormData({
      producto: producto.Producto,
      precio_proveedor: producto.Precio_Proveedor || '',
      unidades: producto.Unidades || '',
      precio_unidad: producto.Precio_Unidad || '',
      precio_publico: producto.Precio_Publico || '',
      codigo: producto.Codigo || ''
    });
    setProductoEditando(producto);
  };

  // Cerrar formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    limpiarFormulario();
    setProductoEditando(null);
    setProductoSeleccionado(null);
  };

  // Manejar cambios en el formulario
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!formData.producto.trim()) {
      mostrarMensaje('error', 'El nombre del producto es requerido');
      return;
    }

    if (!formData.precio_publico || parseFloat(formData.precio_publico) <= 0) {
      mostrarMensaje('error', 'El precio público es requerido y debe ser mayor a 0');
      return;
    }

    try {
      const url = modoEdicion 
        ? `http://localhost:3001/api/productos/editar/${productoEditando.ID}`
        : 'http://localhost:3001/api/productos/agregar';
      
      const method = modoEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producto: formData.producto.trim(),
          precio_proveedor: formData.precio_proveedor ? parseFloat(formData.precio_proveedor) : null,
          unidades: formData.unidades ? parseInt(formData.unidades) : null,
          precio_unidad: formData.precio_unidad ? parseFloat(formData.precio_unidad) : null,
          precio_publico: parseFloat(formData.precio_publico),
          codigo: formData.codigo.trim() || null
        })
      });

      const resultado = await response.json();

      if (resultado.success) {
        mostrarMensaje('success', resultado.mensaje);
        cerrarFormulario();
        cargarProductos();
      } else {
        mostrarMensaje('error', resultado.error);
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      mostrarMensaje('error', 'Error de conexión al guardar producto');
    }
  };

  // Eliminar producto
  const eliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar el producto "${producto.Producto}"?\n` +
      `Código: ${producto.Codigo || 'Sin código'}\n` +
      `Precio: $${producto.Precio_Publico}\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`http://localhost:3001/api/productos/eliminar/${producto.ID}`, {
        method: 'DELETE'
      });

      const resultado = await response.json();

      if (resultado.success) {
        mostrarMensaje('success', resultado.mensaje);
        setProductoSeleccionado(null);
        cargarProductos();
      } else {
        mostrarMensaje('error', resultado.error);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      mostrarMensaje('error', 'Error de conexión al eliminar producto');
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
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

        {/* Formulario */}
        {mostrarFormulario ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            
            <form onSubmit={manejarEnvio} className="space-y-4">
              {/* Primera fila - Producto y Código */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="producto" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    id="producto"
                    name="producto"
                    value={formData.producto}
                    onChange={manejarCambio}
                    placeholder="Ingrese el nombre del producto"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    id="codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={manejarCambio}
                    placeholder="Código del producto (opcional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Segunda fila - Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="precio_proveedor" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Proveedor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_proveedor"
                    name="precio_proveedor"
                    value={formData.precio_proveedor}
                    onChange={manejarCambio}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="precio_unidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio por Unidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_unidad"
                    name="precio_unidad"
                    value={formData.precio_unidad}
                    onChange={manejarCambio}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="precio_publico" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Público *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_publico"
                    name="precio_publico"
                    value={formData.precio_publico}
                    onChange={manejarCambio}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Tercera fila - Unidades */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="unidades" className="block text-sm font-medium text-gray-700 mb-2">
                    Unidades
                  </label>
                  <input
                    type="number"
                    id="unidades"
                    name="unidades"
                    value={formData.unidades}
                    onChange={manejarCambio}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {modoEdicion ? 'Actualizar Producto' : 'Agregar Producto'}
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Buscador y botón agregar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Botón agregar */}
              <button
                onClick={abrirFormularioAgregar}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Agregar Producto</span>
              </button>
            </div>

            {/* Botones de acción para producto seleccionado */}
            {productoSeleccionado && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">Producto seleccionado:</p>
                    <p className="text-blue-700 text-lg">{productoSeleccionado.Producto}</p>
                    <p className="text-blue-600">
                      Código: {productoSeleccionado.Codigo || 'Sin código'} | 
                      Precio: <span className="font-bold">${productoSeleccionado.Precio_Publico}</span>
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => abrirFormularioEditar(productoSeleccionado)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center space-x-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => eliminarProducto(productoSeleccionado)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                    <button
                      onClick={() => setProductoSeleccionado(null)}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de productos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Lista de Productos ({productosFiltrados.length})
                </h2>
              </div>
              
              {cargando ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando productos...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Proveedor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Unidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Público</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productosFiltrados.length > 0 ? (
                        productosFiltrados.map(producto => (
                          <tr 
                            key={producto.ID} 
                            className={`hover:bg-gray-50 cursor-pointer ${
                              productoSeleccionado?.ID === producto.ID ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => setProductoSeleccionado(producto)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {producto.ID}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              <div className="max-w-xs truncate">
                                {producto.Producto}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {producto.Codigo || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {producto.Precio_Proveedor ? `${parseFloat(producto.Precio_Proveedor).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {producto.Unidades || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {producto.Precio_Unidad ? `${parseFloat(producto.Precio_Unidad).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                              ${parseFloat(producto.Precio_Publico).toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatearFecha(producto.Fecha)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {productoSeleccionado?.ID === producto.ID ? (
                                <span className="text-blue-600 font-medium">✓ Seleccionado</span>
                              ) : (
                                <span className="text-gray-400">Seleccionar</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                            {busqueda ? 'No se encontraron productos con ese término' : 'No hay productos registrados'}
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
    </div>
  );
};

export default GestionProductos;