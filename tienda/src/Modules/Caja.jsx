import { useState, useEffect, useRef } from 'react';
import Header from './Header';
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3001';

const Caja = () => {
  const [busqueda, setBusqueda] = useState('');
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para clientes
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Estados para el escáner
  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [esEscaneo, setEsEscaneo] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Función para buscar productos en la base de datos
  const buscarProductos = async (termino) => {
    if (!termino.trim()) {
      setProductosFiltrados([]);
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/productos/buscar?q=${encodeURIComponent(termino)}`);
      const productos = await response.json();
      setProductosFiltrados(productos);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  // Función para buscar y agregar producto por código exacto (escáner)
  const buscarPorCodigoExacto = async (codigo) => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/productos/buscar?q=${encodeURIComponent(codigo)}`);
      const productos = await response.json();
      
      // Buscar producto con código exacto
      const productoExacto = productos.find(p => 
        p.Codigo && p.Codigo.toString() === codigo.toString()
      );
      
      if (productoExacto) {
        agregarProducto(productoExacto);
        setBusqueda('');
      } else {
        // Si no encuentra código exacto, mostrar resultados normales
        setProductosFiltrados(productos);
        setMostrarResultados(true);
      }
    } catch (error) {
      console.error('Error buscando producto por código:', error);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  // Función para buscar clientes
  const buscarClientes = async (termino) => {
    if (!termino.trim()) {
      setClientesFiltrados([]);
      return;
    }

    setCargandoClientes(true);
    try {
      const response = await fetch(`${API_URL}/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
      const clientes = await response.json();
      setClientesFiltrados(clientes);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCargandoClientes(false);
    }
  };

  // Manejar cambios en el input de búsqueda
  const manejarCambioBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    // Detectar si es un escaneo (entrada rápida)
    const ahora = Date.now();
    
    if (!tiempoInicio) {
      setTiempoInicio(ahora);
    }
    
    // Si hay muchos caracteres en poco tiempo, probablemente es un escaneo
    const tiempoTranscurrido = ahora - (tiempoInicio || ahora);
    const velocidadTipeo = valor.length / (tiempoTranscurrido + 1) * 1000; // caracteres por segundo
    
    if (velocidadTipeo > 10 && valor.length > 5) { // Más de 10 caracteres por segundo y más de 5 caracteres
      setEsEscaneo(true);
    } else if (valor.length <= 3) { // Reset si es una búsqueda corta
      setEsEscaneo(false);
      setTiempoInicio(ahora);
    }
    
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Solo mostrar resultados si no parece ser un escaneo
    if (!esEscaneo) {
      setMostrarResultados(valor.length > 0);
    }
  };

  // Manejar Enter en el input
  const manejarKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (esEscaneo || busqueda.length > 8) { // Si es escaneo o código largo
        buscarPorCodigoExacto(busqueda);
        setMostrarResultados(false);
      } else if (productosFiltrados.length === 1) {
        // Si hay un solo resultado, agregarlo
        agregarProducto(productosFiltrados[0]);
      } else if (productosFiltrados.length > 1) {
        // Si hay múltiples resultados, seleccionar el primero
        agregarProducto(productosFiltrados[0]);
      }
      
      // Reset estados de escaneo
      setEsEscaneo(false);
      setTiempoInicio(null);
    }
  };

  // Reset de detección de escaneo después de un tiempo de inactividad
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setEsEscaneo(false);
      setTiempoInicio(null);
    }, 1000); // 1 segundo de inactividad

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [busqueda]);

  // Efecto para buscar cuando cambie el término de búsqueda (solo para tipeo manual)
  useEffect(() => {
    if (!esEscaneo) {
      const timer = setTimeout(() => {
        buscarProductos(busqueda);
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timer);
    }
  }, [busqueda, esEscaneo]);

  // Efecto para buscar clientes
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientes(busquedaCliente);
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const agregarProducto = (producto) => {
    const productoExistente = productosSeleccionados.find(p => p.ID === producto.ID);
    
    if (productoExistente) {
      setProductosSeleccionados(productosSeleccionados.map(p =>
        p.ID === producto.ID 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ));
    } else {
      setProductosSeleccionados([...productosSeleccionados, { 
        ...producto, 
        cantidad: 1,
        precio: producto.Precio_Publico 
      }]);
    }
    
    setBusqueda('');
    setMostrarResultados(false);
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
  };

  const eliminarProducto = (id) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.ID !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(id);
      return;
    }
    
    setProductosSeleccionados(productosSeleccionados.map(p =>
      p.ID === id ? { ...p, cantidad: nuevaCantidad } : p
    ));
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, producto) => 
      total + (producto.precio * producto.cantidad), 0
    ).toFixed(2);
  };

  const finalizarVenta = async () => {
    if (productosSeleccionados.length === 0) {
      alert('No hay productos seleccionados');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/ventas/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: productosSeleccionados
        })
      });

      const resultado = await response.json();

      if (resultado.success) {
        alert(`Venta finalizada correctamente. Total: ${calcularTotal()}\nRegistros insertados: ${resultado.registros_insertados}`);
        setProductosSeleccionados([]);
      } else {
        alert('Error al finalizar la venta: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error finalizando venta:', error);
      alert('Error de conexión al finalizar la venta');
    }
  };

  const cancelarVenta = () => {
    setProductosSeleccionados([]);
    setBusqueda('');
    setMostrarResultados(false);
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
    setEsEscaneo(false);
    setTiempoInicio(null);
  };

  const agregarACuenta = async () => {
    if (productosSeleccionados.length === 0) {
      alert('No hay productos seleccionados');
      return;
    }

    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/cuentas/agregar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: productosSeleccionados,
          clienteId: clienteSeleccionado.ID
        })
      });

      const resultado = await response.json();

      if (resultado.success) {
        alert(`Productos agregados a cuenta correctamente.\nCliente: ${clienteSeleccionado.Nombre}\nTotal: ${calcularTotal()}\nRegistros insertados: ${resultado.registros_insertados}`);
        setProductosSeleccionados([]);
        setClienteSeleccionado(null);
      } else {
        alert('Error al agregar a cuenta: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error agregando a cuenta:', error);
      alert('Error de conexión al agregar a cuenta');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Venta de Productos</h1>
        </div>

        {/* Buscador */}
        <div className="mb-8 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por producto, código o escanear código de barras..."
              value={busqueda}
              onChange={manejarCambioBusqueda}
              onKeyPress={manejarKeyPress}
              className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              {esEscaneo ? (
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m0 0h4.01" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            {cargando && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
            {esEscaneo && (
              <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Escaneando...</span>
              </div>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {mostrarResultados && busqueda && !esEscaneo && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => (
                  <button
                    key={producto.ID}
                    onClick={() => agregarProducto(producto)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 focus:outline-none focus:bg-blue-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{producto.Producto}</p>
                        <p className="text-sm text-gray-500">Código: {producto.Codigo || 'N/A'}</p>
                        <p className="text-sm text-gray-500">Stock: {producto.Unidades || 0} unidades</p>
                      </div>
                      <p className="font-bold text-green-600">${producto.Precio_Publico}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500">
                  {cargando ? 'Buscando...' : 'No se encontraron productos'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buscador de Clientes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Cliente (opcional para cuenta)</h2>
          
          {/* Cliente seleccionado */}
          {clienteSeleccionado && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-green-900">Cliente seleccionado:</p>
                  <p className="text-green-700">{clienteSeleccionado.Nombre}</p>
                </div>
                <button
                  onClick={() => {
                    setClienteSeleccionado(null);
                    setBusquedaCliente('');
                  }}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
          
          {!clienteSeleccionado && (
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setMostrarResultadosCliente(e.target.value.length > 0);
                }}
                className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {cargandoClientes && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Resultados búsqueda clientes */}
              {mostrarResultadosCliente && busquedaCliente && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map(cliente => (
                      <button
                        key={cliente.ID}
                        onClick={() => seleccionarCliente(cliente)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 focus:outline-none focus:bg-blue-50"
                      >
                        <p className="font-medium text-gray-900">{cliente.Nombre}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      {cargandoClientes ? 'Buscando clientes...' : 'No se encontraron clientes'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabla de productos seleccionados */}
        <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Productos Seleccionados</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosSeleccionados.length > 0 ? (
                  productosSeleccionados.map(producto => (
                    <tr key={producto.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{producto.Producto}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.Codigo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${producto.precio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => actualizarCantidad(producto.ID, producto.cantidad - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            -
                          </button>
                          <span className="mx-3 text-sm font-medium">{producto.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(producto.ID, producto.cantidad + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${(producto.precio * producto.cantidad).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => eliminarProducto(producto.ID)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay productos seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {productosSeleccionados.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-end">
                <p className="text-xl font-bold text-gray-900">
                  Total: <span className="text-green-600">${calcularTotal()}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={cancelarVenta}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Cancelar
          </button>
          {clienteSeleccionado && (
            <button
              onClick={agregarACuenta}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              A Cuenta
            </button>
          )}
          <button
            onClick={finalizarVenta}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Caja;