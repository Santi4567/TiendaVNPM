import { useState, useEffect, useMemo } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const ReporteVentas = () => {
  const { notify } = useNotification();

  // --- ESTADOS ---
  const [filtros, setFiltros] = useState({
    rango: 'HOY', 
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    idProducto: 'TODOS'
  });

  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarProductos();
    ejecutarReporte(); 
    // eslint-disable-next-line
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await apiCall('/api/productos/todos');
      setProductosCatalogo(res.data || []);
    } catch (error) { console.error(error); }
  };

  // --- LÓGICA DE FILTROS ---
  const cambiarRango = (tipo) => {
    const hoy = new Date();
    let inicio = '';
    let fin = hoy.toISOString().split('T')[0];

    switch (tipo) {
      case 'HOY': inicio = fin; break;
      case 'SEMANA':
        const primerDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        inicio = primerDia.toISOString().split('T')[0];
        fin = new Date().toISOString().split('T')[0];
        break;
      case 'MES':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        fin = new Date().toISOString().split('T')[0];
        break;
      case 'TODO': inicio = null; fin = null; break;
      default: inicio = filtros.fechaInicio; fin = filtros.fechaFin;
    }
    setFiltros(prev => ({ ...prev, rango: tipo, fechaInicio: inicio || prev.fechaInicio, fechaFin: fin || prev.fechaFin }));
    if (tipo !== 'PERSONALIZADO') ejecutarReporte(inicio, fin, tipo === 'TODO', filtros.idProducto);
  };

  const ejecutarReporte = async (ini, fin, todo, prod) => {
    setCargando(true);
    try {
      const payload = {
        fechaInicio: ini !== undefined ? ini : filtros.fechaInicio,
        fechaFin: fin !== undefined ? fin : filtros.fechaFin,
        todoElTiempo: todo !== undefined ? todo : filtros.rango === 'TODO',
        idProducto: prod !== undefined ? prod : filtros.idProducto
      };
      const res = await apiCall('/api/ventas/reporte-avanzado', 'POST', payload);
      setVentas(res.data.data || []);
      if (res.data.data && res.data.data.length === 0) notify('No se encontraron ventas', 'info');
    } catch (error) { notify('Error generando reporte', 'error'); } finally { setCargando(false); }
  };

  // --- PROCESAMIENTO DE DATOS ---
  const datos = useMemo(() => {
    const totalVenta = ventas.reduce((acc, v) => acc + parseFloat(v.Precio), 0);
    const totalTickets = ventas.length;
    
    // Agrupar por FECHA
    const porFecha = {};
    ventas.forEach(v => {
        const fechaRaw = v.Fecha.split('T')[0];
        porFecha[fechaRaw] = (porFecha[fechaRaw] || 0) + parseFloat(v.Precio);
    });
    const fechasOrdenadas = Object.keys(porFecha).sort();
    const valoresFecha = fechasOrdenadas.map(f => porFecha[f]);
    const maxVentaDia = Math.max(...valoresFecha, 100); // Mínimo 100 para que la gráfica no se rompa si es 0

    // Agrupar por PRODUCTO (Top 5)
    let top5 = [];
    if (filtros.idProducto === 'TODOS') {
        const porProducto = {};
        ventas.forEach(v => {
            porProducto[v.Producto] = (porProducto[v.Producto] || 0) + 1;
        });
        top5 = Object.entries(porProducto)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5);
    }

    return { totalVenta, totalTickets, fechasOrdenadas, porFecha, maxVentaDia, top5 };
  }, [ventas, filtros.idProducto]);

  // Formatters
  const fMoney = (val) => `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Sin decimales en gráfica
  const fMoneyFull = (val) => `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const fDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}`; };

  // --- CONFIGURACIÓN GRÁFICA ---
  const chartHeight = 250; 
  const paddingTop = 40; 
  const paddingX = 60; // Más espacio a la izquierda para los precios del eje Y
  const pointDistance = 100;

  // 1. Coordenadas Puntos
  const puntosGrafica = datos.fechasOrdenadas.map((fecha, index) => {
      const x = paddingX + (index * pointDistance);
      const valor = datos.porFecha[fecha];
      const ratio = valor / datos.maxVentaDia;
      const y = paddingTop + (chartHeight - (ratio * chartHeight));
      return { x, y, fecha, valor };
  });

  // 2. Línea SVG
  const polylinePoints = puntosGrafica.map(p => `${p.x},${p.y}`).join(' ');
  const svgTotalWidth = Math.max(datos.fechasOrdenadas.length * pointDistance + paddingX * 2, 1000);

  // 3. EJE Y (Precios) - Generamos 5 niveles
  const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const valor = datos.maxVentaDia * pct;
      const y = paddingTop + (chartHeight - (pct * chartHeight));
      return { valor, y };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">📊 Reportes de Venta</h1>

      {/* --- PANEL DE FILTROS (Igual) --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Periodo de Análisis</label>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1 overflow-x-auto custom-scrollbar">
              {['HOY', 'SEMANA', 'MES', 'TODO'].map(r => (
                <button key={r} onClick={() => cambiarRango(r)} className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${filtros.rango === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{r}</button>
              ))}
              <button onClick={() => setFiltros({ ...filtros, rango: 'PERSONALIZADO' })} className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${filtros.rango === 'PERSONALIZADO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Personalizado</button>
            </div>
          </div>
          {filtros.rango === 'PERSONALIZADO' && (
            <div className="flex gap-2 animate-fade-in w-full lg:w-auto">
              <div><label className="block text-xs font-bold text-gray-500">Desde</label><input type="date" className="border p-2 rounded-lg w-full" value={filtros.fechaInicio} onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-gray-500">Hasta</label><input type="date" className="border p-2 rounded-lg w-full" value={filtros.fechaFin} onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })} /></div>
            </div>
          )}
          <div className="w-full lg:w-64">
            <label className="block text-sm font-bold text-gray-700 mb-2">Filtrar Producto</label>
            <select className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" value={filtros.idProducto} onChange={e => setFiltros({ ...filtros, idProducto: e.target.value })}>
              <option value="TODOS">-- Todos los Productos --</option>
              {productosCatalogo.map(p => (<option key={p.ID} value={p.ID}>{p.Producto}</option>))}
            </select>
          </div>
          <button onClick={() => ejecutarReporte()} className="w-full lg:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all">{cargando ? '...' : '🔍 Filtrar'}</button>
        </div>
      </div>

      {/* --- RESUMEN (KPIs) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 flex justify-between items-center">
          <div><p className="text-gray-500 text-xs font-bold uppercase">Ingreso Total</p><p className="text-4xl font-extrabold text-gray-800">{fMoneyFull(datos.totalVenta)}</p></div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">💰</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex justify-between items-center">
          <div><p className="text-gray-500 text-xs font-bold uppercase">Unidades Vendidas</p><p className="text-4xl font-extrabold text-gray-800">{datos.totalTickets}</p></div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">📦</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* --- GRÁFICA CORREGIDA --- */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden ${filtros.idProducto === 'TODOS' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="p-6 pb-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    📈 Tendencia de Ventas <span className="text-xs font-normal text-gray-400">(Scroll horizontal si es necesario →)</span>
                </h3>
            </div>
            
            {datos.fechasOrdenadas.length > 0 ? (
                <div className="w-full overflow-x-auto custom-scrollbar relative" style={{ height: chartHeight + 100 }}>
                    
                    {/* SVG Fondo (Líneas y Ejes) */}
                    <svg width={svgTotalWidth} height={chartHeight + 100} className="absolute top-0 left-0 pointer-events-none">
                        
                        {/* 1. LÍNEAS DE GRILLA HORIZONTAL (Eje Y) */}
                        {yAxisTicks.map((tick, i) => (
                            <g key={i}>
                                {/* Línea gris tenue a lo largo de toda la gráfica */}
                                <line 
                                    x1={paddingX} y1={tick.y} 
                                    x2="100%" y2={tick.y} 
                                    stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" 
                                />
                                {/* Etiqueta de Precio (Eje Y) */}
                                <text 
                                    x={paddingX - 10} y={tick.y + 4} 
                                    textAnchor="end" 
                                    className="text-[10px] fill-gray-400 font-medium"
                                >
                                    {fMoney(tick.valor)}
                                </text>
                            </g>
                        ))}

                        {/* 2. LÍNEA BASE (Eje X) */}
                        <line x1={paddingX} y1={chartHeight + paddingTop} x2="100%" y2={chartHeight + paddingTop} stroke="#e5e7eb" strokeWidth="2" />
                        
                        {/* 3. LÍNEA CONECTORA DE DATOS */}
                        <polyline 
                            points={polylinePoints}
                            fill="none"
                            stroke="#3b82f6" 
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                        />
                    </svg>

                    {/* CAPA HTML (Puntos interactivos y Fechas Eje X) */}
                    <div className="relative h-full" style={{ width: svgTotalWidth }}>
                        {puntosGrafica.map((p) => (
                            <div key={p.fecha}>
                                {/* PUNTO INTERACTIVO */}
                                <div 
                                    className="absolute group cursor-pointer flex justify-center items-center"
                                    style={{ left: p.x - 20, top: p.y - 20, width: 40, height: 40 }}
                                >
                                    {/* El círculo visual */}
                                    <div className="w-4 h-4 bg-white rounded-full border-[3px] border-blue-600 shadow-sm group-hover:scale-125 group-hover:bg-blue-600 transition-all z-20"></div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 bg-gray-800 text-white text-xs font-bold py-1 px-3 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                        {fMoneyFull(p.valor)}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                </div>

                                {/* ETIQUETA FECHA (EJE X) - AHORA FIJA ABAJO */}
                                <div 
                                    className="absolute text-center"
                                    style={{ 
                                        left: p.x - 30, // Centrado respecto al punto
                                        top: chartHeight + paddingTop + 12, // POSICIÓN FIJA BAJO LA LÍNEA GRIS
                                        width: 60 
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                        {fDate(p.fecha)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 italic">Sin datos en este rango.</div>
            )}
        </div>

        {/* --- GRÁFICA 2: TOP 5 (Sin cambios) --- */}
        {filtros.idProducto === 'TODOS' && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-gray-800 mb-6">🏆 Top 5 Productos</h3>
                {datos.top5.length > 0 ? (
                    <div className="space-y-5 w-full">
                        {datos.top5.map((item, idx) => {
                            const maxVal = datos.top5[0].cantidad;
                            const porcentaje = (item.cantidad / maxVal) * 100;
                            return (
                                <div key={item.nombre}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-bold text-gray-700 truncate w-2/3" title={item.nombre}>{idx + 1}. {item.nombre}</span>
                                        <span className="font-bold text-blue-600">{item.cantidad} u.</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-400 italic text-center py-10">No hay suficientes datos.</div>
                )}
            </div>
        )}
      </div>

      {/* --- TABLA (Sin cambios) --- */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">📋 Detalle de Ventas (Aprobadas)</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{ventas.length} registros</span>
        </div>
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3">Fecha y Hora</th><th className="px-6 py-3">Producto</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3 text-right">Monto</th><th className="px-6 py-3 text-right">Vendedor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {ventas.map((v) => (
                        <tr key={v.ID} className="hover:bg-blue-50 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap text-gray-500">{new Date(v.Fecha).toLocaleString()}</td>
                            <td className="px-6 py-3 font-medium text-gray-800">{v.Producto}</td>
                            <td className="px-6 py-3 text-gray-600">{v.Cliente || 'Mostrador'}</td>
                            <td className="px-6 py-3 text-right font-bold text-green-600">{fMoneyFull(v.Precio)}</td>
                            <td className="px-6 py-3 text-right text-gray-400 text-xs">{v.Vendedor}</td>
                        </tr>
                    ))}
                    {ventas.length === 0 && (<tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No hay datos en este rango.</td></tr>)}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ReporteVentas;