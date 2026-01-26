import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';

const Alertas = () => {
  const { hasPermission } = useAuth();
  
  // Tabs y Datos
  const [activeTab, setActiveTab] = useState('stock');
  const [data, setData] = useState([]);
  const [dataFiltrada, setDataFiltrada] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  // --- ESTADOS PARA MODALES ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState('stock'); // 'stock' o 'fecha'
  const [prodSeleccionado, setProdSeleccionado] = useState(null);
  
  // Valores de edición
  const [nuevoValor, setNuevoValor] = useState(''); // Sirve para stock o fecha
  const [guardando, setGuardando] = useState(false);
  
  const inputRef = useRef(null);

  // Cargar datos
  const cargarDatos = async () => {
    if (!hasPermission('view.product')) return;
    
    setCargando(true);
    try {
      const endpoint = activeTab === 'stock' 
        ? '/api/productos/alertas/stock' 
        : '/api/productos/alertas/caducidad';
        
      const response = await apiCall(endpoint);
      const resultados = response.data || [];
      setData(resultados);
      setDataFiltrada(resultados);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setBusqueda('');
    cargarDatos();
  }, [activeTab]);

  useEffect(() => {
    if (!busqueda.trim()) {
      setDataFiltrada(data);
    } else {
      const lower = busqueda.toLowerCase();
      const filtrados = data.filter(item => 
        item.Producto.toLowerCase().includes(lower) || 
        (item.Codigo && item.Codigo.toLowerCase().includes(lower))
      );
      setDataFiltrada(filtrados);
    }
  }, [busqueda, data]);

  // --- LÓGICA DE MODALES INTELIGENTES ---

  const abrirModal = (producto) => {
    setProdSeleccionado(producto);
    setModalAbierto(true);
    
    // Configuramos el modal según la pestaña activa
    if (activeTab === 'stock') {
        setTipoModal('stock');
        setNuevoValor(producto.Stock);
    } else {
        setTipoModal('fecha');
        // Extraer solo YYYY-MM-DD para el input date
        const fechaSimple = producto.Fecha_Caducidad 
            ? new Date(producto.Fecha_Caducidad).toISOString().split('T')[0] 
            : '';
        setNuevoValor(fechaSimple);
    }

    setTimeout(() => {
        if(inputRef.current) {
            inputRef.current.focus();
            if (activeTab === 'stock') inputRef.current.select();
        }
    }, 100);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProdSeleccionado(null);
    setNuevoValor('');
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    if (!prodSeleccionado) return;

    setGuardando(true);
    try {
        let endpoint, payload, dataActualizada;

        if (tipoModal === 'stock') {
            endpoint = `/api/productos/${prodSeleccionado.ID}/stock`;
            payload = { nuevoStock: nuevoValor };
            // Actualización optimista local
            dataActualizada = data.map(p => 
                p.ID === prodSeleccionado.ID ? { ...p, Stock: parseInt(nuevoValor) } : p
            );
        } else {
            endpoint = `/api/productos/${prodSeleccionado.ID}/caducidad`;
            payload = { nuevaFecha: nuevoValor };
            // Recalculamos días restantes localmente para feedback inmediato
            const diffTime = new Date(nuevoValor) - new Date();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            dataActualizada = data.map(p => 
                p.ID === prodSeleccionado.ID ? { 
                    ...p, 
                    Fecha_Caducidad: nuevoValor,
                    DiasRestantes: diasRestantes 
                } : p
            );
        }

        const response = await apiCall(endpoint, 'PATCH', payload);

        if (response.data.success) {
            setData(dataActualizada);
            // Actualizar también la lista filtrada
            setDataFiltrada(prev => {
                if (tipoModal === 'stock') {
                     return prev.map(p => p.ID === prodSeleccionado.ID ? { ...p, Stock: parseInt(nuevoValor) } : p);
                } else {
                     // Lógica simple para actualizar fecha en filtrados
                     const diffTime = new Date(nuevoValor) - new Date();
                     const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     return prev.map(p => p.ID === prodSeleccionado.ID ? { ...p, Fecha_Caducidad: nuevoValor, DiasRestantes: dias } : p);
                }
            });
            cerrarModal();
        } else {
            alert('Error al actualizar');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    } finally {
        setGuardando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    // Ajuste de zona horaria simple para visualización
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
  };

  if (!hasPermission('view.product')) return <div>Sin permisos</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Centro de Alertas</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'stock' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'
            }`}
          >
            ⚠️ Stock Bajo
          </button>
          <button
            onClick={() => setActiveTab('caducidad')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'caducidad' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'
            }`}
          >
            📅 Próximos a Vencer
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 sticky top-0 shadow-sm z-10">
                        <tr>
                            <th className="px-6 py-3 font-bold">Producto</th>
                            <th className="px-6 py-3 font-bold hidden sm:table-cell">Código</th>
                            {activeTab === 'stock' ? (
                                <>
                                    {/* COLUMNA RE-INSERTADA */}
                                    <th className="px-6 py-3 text-center font-bold">Mínimo</th>
                                    <th className="px-6 py-3 text-center font-bold">Actual</th>
                                    <th className="px-6 py-3 text-center font-bold">Estado</th>
                                    <th className="px-6 py-3 text-center font-bold">Acción</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-3 text-center font-bold">Caducidad</th>
                                    <th className="px-6 py-3 text-center font-bold">Días</th>
                                    <th className="px-6 py-3 text-center font-bold">Estado</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {cargando ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Cargando...</td></tr>
                        ) : dataFiltrada.map((item) => (
                            <tr 
                                key={item.ID} 
                                onClick={() => abrirModal(item)}
                                className="hover:bg-blue-50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{item.Producto}</div>
                                    <div className="text-xs text-gray-500 sm:hidden">{item.Codigo}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{item.Codigo || '-'}</td>
                                
                                {activeTab === 'stock' ? (
                                    <>
                                        {/* STOCK MÍNIMO VISIBLE */}
                                        <td className="px-6 py-4 text-center text-gray-500 font-mono">
                                            {item.Stock_Minimo}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-red-600">
                                            {item.Stock}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.Stock === 0 
                                                ? <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">AGOTADO</span>
                                                : <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">BAJO</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                                SURTIR
                                            </span>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 text-center">{formatearFecha(item.Fecha_Caducidad)}</td>
                                        <td className="px-6 py-4 text-center font-bold">
                                            {item.DiasRestantes}
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            {item.DiasRestantes <= 0 
                                                ? <span className="text-red-600 font-bold border border-red-200 bg-red-50 px-2 py-1 rounded">RETIRAR</span> 
                                                : <span className="text-orange-600 font-bold border border-orange-200 bg-orange-50 px-2 py-1 rounded">OFERTAR</span>
                                            }
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MODAL UNIFICADO (Dinámico) --- */}
        {modalAbierto && prodSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                    <div className={`${tipoModal === 'stock' ? 'bg-blue-600' : 'bg-orange-600'} px-6 py-4 flex justify-between items-center`}>
                        <h3 className="text-white font-bold text-lg truncate pr-4">
                            {tipoModal === 'stock' ? 'Actualizar Stock' : 'Corregir Caducidad'}
                        </h3>
                        <button onClick={cerrarModal} className="text-white hover:text-gray-200">
                            ✕
                        </button>
                    </div>
                    
                    <form onSubmit={guardarCambios} className="p-6">
                        <div className="mb-4 text-center">
                            <p className="text-gray-500 text-sm mb-1">Producto</p>
                            <p className="font-bold text-gray-800 text-lg">{prodSeleccionado.Producto}</p>
                        </div>

                        {tipoModal === 'stock' ? (
                            // --- CONTENIDO MODAL STOCK ---
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-6 border border-gray-200">
                                <div className="text-center w-1/2 border-r border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase">Mínimo / Actual</p>
                                    <p className="text-sm text-gray-500">{prodSeleccionado.Stock_Minimo} / <span className="font-bold text-gray-800 text-xl">{prodSeleccionado.Stock}</span></p>
                                </div>
                                <div className="text-center w-1/2 pl-2">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Nuevo Total</p>
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        min="0"
                                        className="w-full text-center text-2xl font-bold text-blue-600 border-b-2 border-blue-400 focus:outline-none bg-transparent"
                                        value={nuevoValor}
                                        onChange={(e) => setNuevoValor(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            // --- CONTENIDO MODAL FECHA ---
                            <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-200">
                                <label className="block text-xs font-bold text-orange-800 uppercase mb-2 text-center">
                                    Nueva Fecha de Vencimiento
                                </label>
                                <input
                                    ref={inputRef}
                                    type="date"
                                    className="w-full text-center text-xl p-2 border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={nuevoValor}
                                    onChange={(e) => setNuevoValor(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-center text-orange-600 mt-2">
                                    Actual: {formatearFecha(prodSeleccionado.Fecha_Caducidad)}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={cerrarModal}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className={`flex-1 py-3 text-white rounded-lg font-bold shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 ${
                                    tipoModal === 'stock' 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                            >
                                {guardando ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Alertas;