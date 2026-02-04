import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const HistorialAlacena = () => {
  const { notify } = useNotification();

  // Estados de Datos
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Filtros (Valores por defecto: Hoy y hace 30 días)
  const [filtros, setFiltros] = useState({
      fechaInicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Hace 30 días
      fechaFin: new Date().toISOString().split('T')[0], // Hoy
      tipo: 'TODOS',
      busqueda: ''
  });

  // Cargar Datos
  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      // Construimos la URL con query params
      const params = new URLSearchParams(filtros).toString();
      const res = await apiCall(`/api/alacena/kardex?${params}`);
      setMovimientos(res.data || []);
    } catch (error) { notify('Error consultando historial', 'error'); }
    finally { setCargando(false); }
  };

  // Cargar al inicio y cuando cambian filtros clave (opcional, o usar botón buscar)
  useEffect(() => {
      cargarMovimientos();
      // eslint-disable-next-line
  }, []); // Carga inicial

  const handleFilterChange = (e) => {
      setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  // Formateadores
  const formatDate = (d) => new Date(d).toLocaleString('es-ES');

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          📋 Bitácora de Alacena
      </h1>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
          
          <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 mb-1">Buscar (Producto o Beneficiario)</label>
              <input 
                  type="text" 
                  name="busqueda"
                  placeholder="Ej: Arroz, Familia Pérez..."
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filtros.busqueda}
                  onChange={handleFilterChange}
                  onKeyDown={(e) => e.key === 'Enter' && cargarMovimientos()}
              />
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Tipo Movimiento</label>
              <select 
                  name="tipo"
                  className="border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={filtros.tipo}
                  onChange={handleFilterChange}
              >
                  <option value="TODOS">Todos</option>
                  <option value="ENTRADA">Entradas (Donaciones)</option>
                  <option value="SALIDA">Salidas (Despensas)</option>
              </select>
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Desde</label>
              <input 
                  type="date" 
                  name="fechaInicio"
                  className="border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filtros.fechaInicio}
                  onChange={handleFilterChange}
              />
          </div>

          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Hasta</label>
              <input 
                  type="date" 
                  name="fechaFin"
                  className="border p-2 rounded outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filtros.fechaFin}
                  onChange={handleFilterChange}
              />
          </div>

          <button 
              onClick={cargarMovimientos}
              className="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 shadow-md transition-transform active:scale-95"
          >
              Filtrar
          </button>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold sticky top-0">
                      <tr>
                          <th className="px-6 py-4">Fecha / Hora</th>
                          <th className="px-6 py-4 text-center">Tipo</th>
                          <th className="px-6 py-4">Producto</th>
                          <th className="px-6 py-4 text-center">Cantidad</th>
                          <th className="px-6 py-4">Beneficiario / Motivo</th>
                          <th className="px-6 py-4 text-right">Registró</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {cargando ? (
                          <tr><td colSpan="6" className="p-10 text-center text-gray-400">Consultando bitácora...</td></tr>
                      ) : movimientos.length === 0 ? (
                          <tr><td colSpan="6" className="p-10 text-center text-gray-500 italic">No se encontraron movimientos en este periodo.</td></tr>
                      ) : movimientos.map(mov => (
                          <tr key={mov.ID} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                  {formatDate(mov.Fecha)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      mov.Tipo === 'ENTRADA' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                      {mov.Tipo === 'ENTRADA' ? '📥 ENTRADA' : '📤 SALIDA'}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800">{mov.Producto}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <span className="font-bold text-gray-700 text-lg">{mov.Cantidad}</span>
                                  <span className="text-xs text-gray-500 ml-1">{mov.Unidad}</span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-800">{mov.Motivo}</div>
                              </td>
                              <td className="px-6 py-4 text-right text-xs text-gray-500">
                                  {mov.Usuario_Snapshot}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default HistorialAlacena;