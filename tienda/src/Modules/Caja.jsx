import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import ConfirmModal from '../components/ConfirmModal'; // <--- 1. IMPORTAR MODAL

const Caja = () => {
  const { hasPermission } = useAuth();

  // --- 1. ESTADOS CON CARGA INICIAL (Lazy Init) ---
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    try {
      const guardado = localStorage.getItem('caja_carrito');
      return guardado ? JSON.parse(guardado) : [];
    } catch (e) { return []; }
  });

  const [clienteSeleccionado, setClienteSeleccionado] = useState(() => {
    try {
      const guardado = localStorage.getItem('caja_cliente');
      return guardado ? JSON.parse(guardado) : null;
    } catch (e) { return null; }
  });

  // Estados normales
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [esEscaneo, setEsEscaneo] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // --- ESTADO PARA EL MODAL DE CONFIRMACIÓN ---
  const [confirmModal, setConfirmModal] = useState({ 
      isOpen: false, 
      action: null, 
      title: '', 
      message: '', 
      tipo: 'info' // info, success, warning, danger
  });

  // --- 2. EFECTOS DE GUARDADO Y LIMPIEZA ---

  useEffect(() => {
    localStorage.setItem('caja_carrito', JSON.stringify(productosSeleccionados));
  }, [productosSeleccionados]);

  useEffect(() => {
    localStorage.setItem('caja_cliente', JSON.stringify(clienteSeleccionado));
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
        console.warn("Limpiando token inseguro del almacenamiento local...");
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken'); 
    }
  }, []);

  const limpiarStorage = () => {
    localStorage.removeItem('caja_carrito');
    localStorage.removeItem('caja_cliente');
    setProductosSeleccionados([]); 
    setClienteSeleccionado(null);
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 4000);
  };

  // --- LÓGICA DE BUSCADOR Y ESCÁNER ---
  
  const buscarProductos = async (termino) => {
    if (!hasPermission('view.product')) return; 
    if (!termino.trim()) {
      setProductosFiltrados([]);
      return;
    }
    setCargando(true);
    try {
      const response = await apiCall(`/api/productos/buscar?q=${encodeURIComponent(termino)}`);
      setProductosFiltrados(response.data || []);
    } catch (error) {
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
      const productoExacto = productos.find(p => p.Codigo && p.Codigo.toString() === codigo.toString());
      
      if (productoExacto) {
        if (productoExacto.Stock <= 0) {
            mostrarMensaje('error', `AGOTADO: "${productoExacto.Producto}" tiene stock 0.`);
        } else {
            agregarProducto(productoExacto);
            setBusqueda('');
        }
      } else {
        setProductosFiltrados(productos);
        setMostrarResultados(true);
      }
    } catch (error) { console.error(error); } 
    finally { setCargando(false); }
  };

  const buscarClientes = async (termino) => {
    if (!hasPermission('view.client')) return;
    if (!termino.trim()) {
      setClientesFiltrados([]);
      return;
    }
    setCargandoClientes(true);
    try {
      const response = await apiCall(`/api/clientes/buscar?q=${encodeURIComponent(termino)}`);
      setClientesFiltrados(response.data || []);
    } catch (error) { setClientesFiltrados([]); } 
    finally { setCargandoClientes(false); }
  };

  const manejarCambioBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    const ahora = Date.now();
    if (!tiempoInicio) setTiempoInicio(ahora);
    const tiempoTranscurrido = ahora - (tiempoInicio || ahora);
    const velocidadTipeo = valor.length / (tiempoTranscurrido + 1) * 1000; 
    
    if (velocidadTipeo > 10 && valor.length > 5) { 
      setEsEscaneo(true);
    } else if (valor.length <= 3) { 
      setEsEscaneo(false);
      setTiempoInicio(ahora);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!esEscaneo) setMostrarResultados(valor.length > 0);
  };

  const manejarKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (esEscaneo || busqueda.length > 8) {
        buscarPorCodigoExacto(busqueda);
        setMostrarResultados(false);
      } else if (productosFiltrados.length === 1) {
        if (productosFiltrados[0].Stock > 0) {
            agregarProducto(productosFiltrados[0]);
        } else {
            mostrarMensaje('error', 'Producto Agotado');
        }
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

  const agregarProducto = (producto) => {
    if (producto.Stock <= 0) return;
    const productoExistente = productosSeleccionados.find(p => p.ID === producto.ID);
    if (productoExistente) {
      setProductosSeleccionados(productosSeleccionados.map(p =>
        p.ID === producto.ID ? { ...p, cantidad: p.cantidad + 1 } : p
      ));
    } else {
      setProductosSeleccionados([...productosSeleccionados, { ...producto, cantidad: 1, precio: producto.Precio_Publico }]);
    }
    setBusqueda('');
    setMostrarResultados(false);
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

  // --- NUEVAS FUNCIONES CON MODAL ---

  // 1. CANCELAR VENTA
  const solicitarCancelacion = () => {
    if (productosSeleccionados.length === 0) return;
    
    setConfirmModal({
        isOpen: true,
        title: 'Cancelar Venta',
        message: '¿Estás seguro de vaciar el carrito? Se perderá el progreso actual.',
        tipo: 'danger',
        action: ejecutarCancelacion
    });
  };

  const ejecutarCancelacion = () => {
    limpiarStorage();
    setBusqueda('');
    setMostrarResultados(false);
    setBusquedaCliente('');
    setMostrarResultadosCliente(false);
    setEsEscaneo(false);
    setTiempoInicio(null);
    setMensaje({ tipo: '', texto: '' });
    setConfirmModal(prev => ({...prev, isOpen: false}));
  };

  // 2. COBRAR (FINALIZAR)
  const solicitarCobro = () => {
    if (productosSeleccionados.length === 0) return mostrarMensaje('error', 'No hay productos seleccionados');
    if (!hasPermission('create.sale')) return mostrarMensaje('error', 'Sin permisos para vender.');

    setConfirmModal({
        isOpen: true,
        title: 'Confirmar Cobro',
        message: `Total a cobrar: $${calcularTotal()}\n\n¿Deseas procesar la venta?`,
        tipo: 'success',
        action: ejecutarCobro
    });
  };

  const ejecutarCobro = async () => {
    setConfirmModal(prev => ({...prev, isOpen: false})); // Cerrar modal
    try {
      const response = await apiCall('/api/ventas/finalizar', 'POST', {
        productos: productosSeleccionados,
        idCliente: clienteSeleccionado?.ID || null 
      });

      if (response.data.success) {
        mostrarMensaje('success', `Venta exitosa. Total: $${calcularTotal()}`);
        limpiarStorage();
      } else {
        mostrarMensaje('error', response.data.error || 'Error al procesar venta');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    }
  };

  // 3. FIAR (CUENTA)
  const solicitarFiado = () => {
    if (productosSeleccionados.length === 0) return mostrarMensaje('error', 'Carrito vacío');
    if (!clienteSeleccionado) return mostrarMensaje('error', 'Seleccione un cliente para fiar');
    if (!hasPermission('add.debt')) return mostrarMensaje('error', 'Sin permisos para fiar.');

    setConfirmModal({
        isOpen: true,
        title: 'Confirmar Crédito / Fiado',
        message: `Se agregará un cargo de $${calcularTotal()} a la cuenta de:\n\n👤 ${clienteSeleccionado.Nombre}\n\n¿Estás seguro?`,
        tipo: 'warning',
        action: ejecutarFiado
    });
  };

  const ejecutarFiado = async () => {
    setConfirmModal(prev => ({...prev, isOpen: false})); // Cerrar modal
    try {
      const response = await apiCall('/cuentas/agregar', 'POST', {
        productos: productosSeleccionados,
        clienteId: clienteSeleccionado.ID
      });

      if (response.data.success) {
        mostrarMensaje('success', `Fiado correctamente a ${clienteSeleccionado.Nombre}`);
        limpiarStorage();
      } else {
        mostrarMensaje('error', response.data.error || 'Error al fiar');
      }
    } catch (error) {
        mostrarMensaje('error', 'Error de conexión');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Punto de Venta (Caja)</h1>
          {!hasPermission('create.sale') && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Modo Solo Lectura</span>
          )}
        </div>

        {mensaje.texto && (
          <div className={`mb-4 p-4 rounded-lg shadow-sm ${
            mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
            <p className="font-medium">{mensaje.texto}</p>
          </div>
        )}

        {/* BUSCADOR DE PRODUCTOS */}
        <div className="mb-8 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar producto, código o escanear..."
              value={busqueda}
              onChange={manejarCambioBusqueda}
              onKeyPress={manejarKeyPress}
              disabled={!hasPermission('view.product')} 
              className="w-full px-4 py-4 pl-12 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          {/* DROPDOWN DE RESULTADOS */}
          {mostrarResultados && busqueda && !esEscaneo && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-auto">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => {
                  const sinStock = producto.Stock <= 0;
                  return (
                    <button
                      key={producto.ID}
                      onClick={() => !sinStock && agregarProducto(producto)}
                      disabled={sinStock}
                      className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-0 focus:outline-none transition-colors group 
                        ${sinStock 
                            ? 'bg-red-50 cursor-not-allowed opacity-75' 
                            : 'hover:bg-blue-50 cursor-pointer'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${sinStock ? 'text-red-800' : 'text-gray-900'}`}>
                            {producto.Producto}
                            {sinStock && <span className="ml-2 text-xs font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">AGOTADO</span>}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-500">
                               <span>Código: {producto.Codigo || 'N/A'}</span>
                               <span>•</span>
                               <span className={sinStock ? 'text-red-600 font-bold' : ''}>
                                   Stock: {producto.Stock || 0}
                               </span>
                          </div>
                        </div>
                        <p className={`font-bold text-lg ${sinStock ? 'text-gray-400' : 'text-green-600'}`}>
                            ${producto.Precio_Publico}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  {cargando ? 'Buscando...' : 'No se encontraron productos'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CLIENTE */}
        {hasPermission('view.client') && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Cliente (Opcional / Fiado)</h2>
            {clienteSeleccionado ? (
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md border border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                             <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                            <p className="font-bold text-blue-900">{clienteSeleccionado.Nombre}</p>
                            <p className="text-xs text-blue-600">ID: {clienteSeleccionado.ID}</p>
                        </div>
                    </div>
                    <button onClick={() => { setClienteSeleccionado(null); setBusquedaCliente(''); }} className="text-red-500 hover:text-red-700 font-medium text-sm hover:underline">Quitar</button>
                </div>
            ) : (
                <div className="relative">
                    <input type="text" placeholder="Buscar cliente..." value={busquedaCliente} onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarResultadosCliente(e.target.value.length > 0); }} className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500" />
                    {mostrarResultadosCliente && busquedaCliente && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {clientesFiltrados.length > 0 ? (
                            clientesFiltrados.map(cliente => (
                            <button key={cliente.ID} onClick={() => seleccionarCliente(cliente)} className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 text-gray-800">
                                {cliente.Nombre}
                            </button>
                            ))
                        ) : <div className="px-4 py-2 text-gray-500 text-sm">No encontrado</div>}
                        </div>
                    )}
                </div>
            )}
            </div>
        )}

        {/* TABLA CARRITO */}
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
                      <td className="px-6 py-4 text-gray-600">${producto.precio}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => actualizarCantidad(producto.ID, producto.cantidad - 1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300">-</button>
                          <span className="w-8 text-center font-medium">{producto.cantidad}</span>
                          <button onClick={() => actualizarCantidad(producto.ID, producto.cantidad + 1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300">+</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">${(producto.precio * producto.cantidad).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => eliminarProducto(producto.ID)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Escanea un producto o búscalo para comenzar la venta.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {productosSeleccionados.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center gap-4">
              <span className="text-gray-600 text-lg">Total a Pagar:</span>
              <span className="text-3xl font-bold text-green-600">${calcularTotal()}</span>
            </div>
          )}
        </div>

        {/* BOTONERA ACTUALIZADA */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button 
              onClick={solicitarCancelacion} // AHORA USA SOLICITAR CANCELACIÓN (MODAL)
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm"
          >
              Cancelar (F4)
          </button>
          
          {hasPermission('add.debt') && (
            <button 
                onClick={solicitarFiado} // AHORA USA SOLICITAR FIADO (MODAL)
                disabled={!clienteSeleccionado || productosSeleccionados.length === 0} 
                className={`px-6 py-3 rounded-lg font-medium text-white shadow-md flex items-center justify-center gap-2 ${!clienteSeleccionado || productosSeleccionados.length === 0 ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
                Fiar / A Cuenta
            </button>
          )}
          
          {hasPermission('create.sale') && (
            <button 
                onClick={solicitarCobro} // AHORA USA SOLICITAR COBRO (MODAL)
                disabled={productosSeleccionados.length === 0} 
                className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 ${productosSeleccionados.length === 0 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                COBRAR
            </button>
          )}
        </div>

        {/* MODAL UNIVERSAL PARA CONFIRMACIONES */}
        <ConfirmModal 
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
            onConfirm={confirmModal.action}
            title={confirmModal.title}
            message={confirmModal.message}
            tipo={confirmModal.tipo}
        />

      </div>
    </div>
  );
};

export default Caja;