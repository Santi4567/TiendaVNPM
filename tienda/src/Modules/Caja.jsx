import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const Caja = () => {
  const { hasPermission } = useAuth();

  // Estados principales
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

  // Estados de mensajes (Feedback)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 4000);
  };

  // --- BUSCADOR DE PRODUCTOS ---
  const buscarProductos = async (termino) => {
    if (!hasPermission('view.product')) return; // Seguridad visual
    
    if (!termino.trim()) {
      setProductosFiltrados([]);
      return;
    }

    setCargando(true);
    try {
      const response = await apiCall(`/api/productos/buscar?q=${encodeURIComponent(termino)}`);
      setProductosFiltrados(response.data || []);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  const buscarPorCodigoExacto = async (codigo) => {
    if (!hasPermission('view.product')) return;

    setCargando(true);
    try {
      const response = await apiCall(`/api/productos/buscar?q=${encodeURIComponent(codigo)}`);
      const productos = response.data || [];
      
      // Buscar coincidencia exacta
      const productoExacto = productos.find(p => 
        p.Codigo && p.Codigo.toString() === codigo.toString()
      );
      
      if (productoExacto) {
        agregarProducto(productoExacto);
        setBusqueda('');
      } else {
        setProductosFiltrados(productos);
        setMostrarResultados(true);
      }
    } catch (error) {
      console.error('Error por código:', error);
    } finally {
      setCargando(false);
    }
  };

  // --- BUSCADOR DE CLIENTES ---
  const buscarClientes = async (termino) => {
    // Si no tiene permiso de ver clientes, no hace la petición
    if (!hasPermission('view.client')) return;

    if (!termino.trim()) {
      setClientesFiltrados([]);
      return;
    }

    setCargandoClientes(true);
    try {
      const response = await apiCall(`/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
      setClientesFiltrados(response.data || []);
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClientesFiltrados([]);
    } finally {
      setCargandoClientes(false);
    }
  };

  // --- LÓGICA DEL ESCÁNER ---
  const manejarCambioBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    const ahora = Date.now();
    if (!tiempoInicio) setTiempoInicio(ahora);
    
    const tiempoTranscurrido = ahora - (tiempoInicio || ahora);
    // Lógica simple: si escribe muy rápido, es un escáner
    const velocidadTipeo = valor.length / (tiempoTranscurrido + 1) * 1000; 
    
    if (velocidadTipeo > 10 && valor.length > 5) { 
      setEsEscaneo(true);
    } else if (valor.length <= 3) { 
      setEsEscaneo(false);
      setTiempoInicio(ahora);
    }
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Si no es escaneo, mostramos resultados visuales
    if (!esEscaneo) {
      setMostrarResultados(valor.length > 0);
    }
  };

  const manejarKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (esEscaneo || busqueda.length > 8) {
        buscarPorCodigoExacto(busqueda);
        setMostrarResultados(false);
      } else if (productosFiltrados.length === 1) {
        agregarProducto(productosFiltrados[0]);
      } else if (productosFiltrados.length > 1) {
        // Si hay varios y da Enter, agregamos el primero de la lista (opcional)
        agregarProducto(productosFiltrados[0]);
      }
      
      setEsEscaneo(false);
      setTiempoInicio(null);
    }
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setEsEscaneo(false);
      setTiempoInicio(null);
    }, 1000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [busqueda]);

  useEffect(() => {
    if (!esEscaneo && busqueda) {
      const timer = setTimeout(() => buscarProductos(busqueda), 300);
      return () => clearTimeout(timer);
    }
  }, [busqueda, esEscaneo]);

  useEffect(() => {
    const timer = setTimeout(() => buscarClientes(busquedaCliente), 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  // --- GESTIÓN DEL CARRITO ---
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
        precio: producto.Precio_Publico // Aseguramos usar el precio público
      }]);
    }
    
    setBusqueda('');
    setMostrarResultados(false);
    // Mantener el foco en el input para seguir escaneando
    if(inputRef.current) inputRef.current.focus();
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

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
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
    setMensaje({ tipo: '', texto: '' });
  };

  // --- TRANSACCIONES ---

  // 1. Finalizar Venta (Contado)
  const finalizarVenta = async () => {
    if (productosSeleccionados.length === 0) {
      mostrarMensaje('error', 'No hay productos seleccionados');
      return;
    }
    
    if (!hasPermission('create.sale')) {
      mostrarMensaje('error', 'No tienes permiso para registrar ventas.');
      return;
    }
    
    try {
      const response = await apiCall('/api/ventas/finalizar', 'POST', {
        productos: productosSeleccionados,
        // Opcional: si quisieras registrar quién compró aunque pague de contado
        idCliente: clienteSeleccionado?.ID || null 
      });

      if (response.data.success) {
        mostrarMensaje('success', `Venta exitosa. Total: $${calcularTotal()}`);
        setProductosSeleccionados([]);
        // No limpiamos el cliente por si quiere hacer otra compra seguida, o sí, depende del flujo
        // setClienteSeleccionado(null); 
      } else {
        mostrarMensaje('error', response.data.error || 'Error al procesar venta');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', 'Error de conexión');
    }
  };

  // 2. Agregar a Cuenta (Fiado)
  const agregarACuenta = async () => {
    if (productosSeleccionados.length === 0) {
        mostrarMensaje('error', 'Carrito vacío');
      return;
    }

    if (!clienteSeleccionado) {
        mostrarMensaje('error', 'Debe seleccionar un cliente para fiar');
      return;
    }

    if (!hasPermission('add.debt')) {
        mostrarMensaje('error', 'No tienes permiso para fiar productos (Agregar deuda).');
        return;
    }
    
    try {
      const response = await apiCall('/api/cuentas/agregar', 'POST', {
        productos: productosSeleccionados,
        clienteId: clienteSeleccionado.ID
      });

      if (response.data.success) {
        mostrarMensaje('success', `Fiado a ${clienteSeleccionado.Nombre}. Total: $${calcularTotal()}`);
        setProductosSeleccionados([]);
        setClienteSeleccionado(null);
      } else {
        mostrarMensaje('error', response.data.error || 'Error al agregar a cuenta');
      }
    } catch (error) {
        mostrarMensaje('error', 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Punto de Venta (Caja)</h1>
          {/* Indicador de permisos (Opcional) */}
          {!hasPermission('create.sale') && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Modo Solo Lectura</span>
          )}
        </div>

        {/* Mensajes Flotantes */}
        {mensaje.texto && (
          <div className={`mb-4 p-4 rounded-lg shadow-sm ${
            mensaje.tipo === 'success' 
              ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
              : 'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
            <p className="font-medium">{mensaje.texto}</p>
          </div>
        )}

        {/* --- BUSCADOR DE PRODUCTOS --- */}
        <div className="mb-8 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar producto, código o escanear..."
              value={busqueda}
              onChange={manejarCambioBusqueda}
              onKeyPress={manejarKeyPress}
              disabled={!hasPermission('view.product')} // Deshabilitar si no puede ver productos
              className="w-full px-4 py-4 pl-12 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {esEscaneo ? (
                <svg className="h-6 w-6 text-green-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m0 0h4.01" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">ESCANEANDO</span>
              </div>
            )}
          </div>

          {/* Resultados de búsqueda (Dropdown) */}
          {mostrarResultados && busqueda && !esEscaneo && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-auto">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => (
                  <button
                    key={producto.ID}
                    onClick={() => agregarProducto(producto)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 focus:outline-none transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{producto.Producto}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                             <span>Código: {producto.Codigo || 'N/A'}</span>
                             <span>•</span>
                             <span>Stock: {producto.Stock || 0}</span>
                        </div>
                      </div>
                      <p className="font-bold text-lg text-green-600">${producto.Precio_Publico}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  {cargando ? 'Buscando...' : 'No se encontraron productos'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- SELECCIÓN DE CLIENTE --- */}
        {hasPermission('view.client') && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Cliente (Opcional / Fiado)</h2>
            
            {clienteSeleccionado ? (
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-blue-900">{clienteSeleccionado.Nombre}</p>
                            <p className="text-xs text-blue-600">ID: {clienteSeleccionado.ID}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setClienteSeleccionado(null);
                            setBusquedaCliente('');
                        }}
                        className="text-red-500 hover:text-red-700 font-medium text-sm hover:underline"
                    >
                        Quitar
                    </button>
                </div>
            ) : (
                <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre..."
                    value={busquedaCliente}
                    onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarResultadosCliente(e.target.value.length > 0);
                    }}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Resultados Clientes */}
                {mostrarResultadosCliente && busquedaCliente && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map(cliente => (
                        <button
                            key={cliente.ID}
                            onClick={() => seleccionarCliente(cliente)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 text-gray-800"
                        >
                            {cliente.Nombre}
                        </button>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                            No encontrado
                        </div>
                    )}
                    </div>
                )}
                </div>
            )}
            </div>
        )}

        {/* --- TABLA DE PRODUCTOS (CARRITO) --- */}
        <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Carrito de Compras</h2>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{productosSeleccionados.length} items</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">Producto</th>
                  <th className="px-6 py-3 text-left">Precio</th>
                  <th className="px-6 py-3 text-center">Cantidad</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosSeleccionados.length > 0 ? (
                  productosSeleccionados.map(producto => (
                    <tr key={producto.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{producto.Producto}</p>
                        <p className="text-xs text-gray-500">{producto.Codigo}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ${producto.precio}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => actualizarCantidad(producto.ID, producto.cantidad - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{producto.cantidad}</span>
                          <button
                            onClick={() => actualizarCantidad(producto.ID, producto.cantidad + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${(producto.precio * producto.cantidad).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => eliminarProducto(producto.ID)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                          title="Quitar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                      Escanea un producto o búscalo para comenzar la venta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Total */}
          {productosSeleccionados.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center gap-4">
              <span className="text-gray-600 text-lg">Total a Pagar:</span>
              <span className="text-3xl font-bold text-green-600">${calcularTotal()}</span>
            </div>
          )}
        </div>

        {/* --- BOTONERA DE ACCIÓN --- */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={cancelarVenta}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm"
          >
            Cancelar (F4)
          </button>
          
          {/* Botón FIAR: Requiere Cliente + Permiso add.debt */}
          {hasPermission('add.debt') && (
            <button
                onClick={agregarACuenta}
                disabled={!clienteSeleccionado || productosSeleccionados.length === 0}
                className={`px-6 py-3 rounded-lg font-medium text-white shadow-md flex items-center justify-center gap-2 ${
                    !clienteSeleccionado || productosSeleccionados.length === 0
                    ? 'bg-orange-300 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Fiar / A Cuenta
            </button>
          )}

          {/* Botón COBRAR: Requiere create.sale */}
          {hasPermission('create.sale') && (
            <button
                onClick={finalizarVenta}
                disabled={productosSeleccionados.length === 0}
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 ${
                    productosSeleccionados.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                COBRAR
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Caja;