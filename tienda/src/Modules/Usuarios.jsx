import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const Usuarios = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  
  // Estados de Datos
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisosCatalogo, setPermisosCatalogo] = useState([]);
  const [busquedaUser, setBusquedaUser] = useState('');
  
  // Estados de Modales
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formDataUser, setFormDataUser] = useState({ 
      Usuario: '', Nombre_Completo: '', Passwd: '', ID_Rol: '' 
  });

  const [modalRolOpen, setModalRolOpen] = useState(false);
  const [formDataRol, setFormDataRol] = useState({ Nombre: '' });

  const [modalPermisosOpen, setModalPermisosOpen] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]); 

  // --- CARGAS ---
  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
    cargarCatalogoPermisos();
  }, []);

  const cargarUsuarios = async () => {
    try {
        const res = await apiCall('/api/users');
        const lista = res.data.data ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setUsuarios(lista);
    } catch (error) { console.error(error); }
  };

  const cargarRoles = async () => {
    try {
        const res = await apiCall('/api/roles');
        setRoles(res.data || []);
    } catch (error) { console.error(error); }
  };

  const cargarCatalogoPermisos = async () => {
    try {
        const res = await apiCall('/api/roles/permisos/catalogo');
        setPermisosCatalogo(res.data || []);
    } catch (error) { console.error(error); }
  };

  // --- ACCIONES DE USUARIO ---
  
  // 1. Desactivar (Soft Delete)
  const desactivarUsuario = async (id) => {
      if(!window.confirm('¿Desactivar acceso a este usuario?')) return;
      try {
          await apiCall(`/api/users/${id}`, 'DELETE');
          cargarUsuarios();
      } catch (error) { alert('Error al desactivar'); }
  };

  // 2. Reactivar
  const reactivarUsuario = async (id) => {
      if(!window.confirm('¿Reactivar acceso a este usuario?')) return;
      try {
          await apiCall(`/api/users/${id}/reactivar`, 'PUT');
          cargarUsuarios();
      } catch (error) { alert('Error al reactivar'); }
  };

  // 3. Eliminar Definitivamente (Hard Delete)
  const eliminarDefinitivo = async (id) => {
      if(!window.confirm('⚠️ ¿ELIMINAR DEFINITIVAMENTE?\nEsta acción borrará al usuario de la base de datos y no se puede deshacer.')) return;
      try {
          const res = await apiCall(`/api/users/${id}/force`, 'DELETE');
          if (res.data.error) {
              alert(res.data.error || 'No se pudo eliminar (probablemente tiene ventas asociadas).');
          } else {
              cargarUsuarios();
          }
      } catch (error) { 
        alert('Error: Es probable que este usuario tenga historial de ventas.'); 
      }
  };

  // --- GESTIÓN FORMULARIOS (Igual que antes) ---
  const abrirModalUsuario = (user = null) => {
    if (user) {
        setUsuarioEditando(user);
        setFormDataUser({ 
            Usuario: user.Usuario, 
            Nombre_Completo: user.Nombre_Completo, 
            Passwd: '', 
            ID_Rol: user.ID_Rol 
        });
    } else {
        setUsuarioEditando(null);
        setFormDataUser({ Usuario: '', Nombre_Completo: '', Passwd: '', ID_Rol: '' });
    }
    setModalUsuarioOpen(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
        if (usuarioEditando) {
            await apiCall(`/api/users/${usuarioEditando.ID}`, 'PUT', formDataUser);
        } else {
            await apiCall('/api/users', 'POST', formDataUser);
        }
        setModalUsuarioOpen(false);
        cargarUsuarios();
        cargarRoles(); 
    } catch (error) { alert('Error al guardar'); }
  };

  // --- GESTIÓN ROLES ---
  const guardarRol = async (e) => {
      e.preventDefault();
      try {
          await apiCall('/api/roles', 'POST', formDataRol);
          setModalRolOpen(false);
          setFormDataRol({ Nombre: '' });
          cargarRoles();
      } catch (error) { alert('Error al crear rol'); }
  };

  const eliminarRol = async (rol) => {
      if (rol.TotalUsuarios > 0) return alert('No puedes eliminar un rol con usuarios activos.');
      if(!window.confirm(`¿Eliminar rol "${rol.Rol}"?`)) return;
      try {
          await apiCall(`/api/roles/${rol.ID}`, 'DELETE');
          cargarRoles();
      } catch (error) { alert('Error al eliminar rol'); }
  };

  const abrirConfigPermisos = async (rol) => {
      // PROTECCIÓN EXTRA FRONTEND: Admin no se edita
      if (rol.ID === 1) return; 

      setRolSeleccionado(rol);
      const res = await apiCall(`/api/roles/${rol.ID}/permisos`);
      const permisosActuales = res.data || [];
      setPermisosSeleccionados(permisosActuales.map(p => p.ID));
      setModalPermisosOpen(true);
  };

  const togglePermiso = (id) => {
      setPermisosSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const guardarPermisos = async () => {
      try {
          await apiCall(`/api/roles/${rolSeleccionado.ID}/permisos`, 'PUT', { permisosIds: permisosSeleccionados });
          setModalPermisosOpen(false);
          alert('Permisos actualizados');
      } catch (error) { alert('Error guardando permisos'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Administración del Sistema</h1>

      {/* TABS */}
      <div className="flex space-x-4 mb-6 border-b">
        <button onClick={() => setActiveTab('usuarios')} className={`pb-2 px-4 font-medium border-b-2 transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Usuarios</button>
        <button onClick={() => setActiveTab('roles')} className={`pb-2 px-4 font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}>Roles y Permisos</button>
      </div>

      {/* VISTA USUARIOS */}
      {activeTab === 'usuarios' && (
          <div>
              <div className="flex justify-between mb-4">
                  <input 
                    type="text" placeholder="Buscar usuario..." 
                    className="border p-2 rounded w-1/3"
                    value={busquedaUser} onChange={e => setBusquedaUser(e.target.value)}
                  />
                  <button onClick={() => abrirModalUsuario()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                      + Nuevo Usuario
                  </button>
              </div>

              <div className="bg-white rounded shadow overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-3">Usuario</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Rol</th>
                              <th className="p-3 text-center">Estado</th>
                              <th className="p-3 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody>
                          {usuarios.filter(u => u.Usuario?.toLowerCase().includes(busquedaUser.toLowerCase())).map(u => (
                              <tr key={u.ID} className={`border-t hover:bg-gray-50 ${!u.Activo ? 'bg-red-50' : ''}`}>
                                  <td className="p-3 font-medium">{u.Usuario}</td>
                                  <td className="p-3">{u.Nombre_Completo}</td>
                                  <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{u.Rol || 'Sin Rol'}</span></td>
                                  <td className="p-3 text-center">
                                      {u.Activo ? 
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">ACTIVO</span> : 
                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">INACTIVO</span>
                                      }
                                  </td>
                                  <td className="p-3 text-right">
                                      {u.Activo === 1 ? (
                                        // ACCIONES SI ESTÁ ACTIVO
                                        <div className="space-x-2">
                                            <button onClick={() => abrirModalUsuario(u)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                                            <button onClick={() => desactivarUsuario(u.ID)} className="text-orange-500 hover:text-orange-700 font-medium">Desactivar</button>
                                        </div>
                                      ) : (
                                        // ACCIONES SI ESTÁ INACTIVO
                                        <div className="space-x-3">
                                            <button onClick={() => reactivarUsuario(u.ID)} className="text-green-600 hover:text-green-800 font-bold text-sm">
                                                Reactivar
                                            </button>
                                            <button onClick={() => eliminarDefinitivo(u.ID)} className="text-red-600 hover:text-red-900 font-bold text-sm bg-red-100 px-2 py-1 rounded">
                                                Eliminar Definitivamente
                                            </button>
                                        </div>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* VISTA ROLES */}
      {activeTab === 'roles' && (
          <div className="animate-fade-in">
              <div className="flex justify-end mb-4">
                  <button onClick={() => setModalRolOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium">
                      + Nuevo Rol
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map(rol => (
                      <div key={rol.ID} className="bg-white p-4 rounded shadow border border-gray-200 relative">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-800">
                                      {rol.Rol} 
                                      {rol.ID === 1 && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">SUPER ADMIN</span>}
                                  </h3>
                                  <p className="text-sm text-gray-500">{rol.TotalUsuarios} usuarios asignados</p>
                              </div>
                              {rol.ID !== 1 && (
                                  <button onClick={() => eliminarRol(rol)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                              )}
                          </div>
                          
                          {/* PROTECCIÓN: Si es Admin (ID 1), no mostramos el botón */}
                          {rol.ID !== 1 ? (
                              <button 
                                onClick={() => abrirConfigPermisos(rol)}
                                className="mt-4 w-full py-2 bg-purple-50 text-purple-700 font-medium rounded hover:bg-purple-100 transition-colors"
                              >
                                  ⚙️ Configurar Permisos
                              </button>
                          ) : (
                              <div className="mt-4 w-full py-2 bg-gray-100 text-gray-400 font-medium rounded text-center text-sm italic cursor-not-allowed">
                                  Permisos Totales (Protegido)
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* MODALES (Usuario, Rol, Permisos) --- MANTIENEN EL CÓDIGO ANTERIOR --- */}
      {/* ... Solo asegúrate de incluir el modal de usuario con el fix del parseInt(ID_Rol) ... */}
      {modalUsuarioOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                  <h2 className="text-xl font-bold mb-4">{usuarioEditando ? 'Editar' : 'Nuevo'} Usuario</h2>
                  <form onSubmit={guardarUsuario} className="space-y-4">
                      {/* Inputs... */}
                      <input type="text" placeholder="Usuario" required className="w-full border p-2 rounded" value={formDataUser.Usuario} onChange={e => setFormDataUser({...formDataUser, Usuario: e.target.value})} />
                      <input type="text" placeholder="Nombre" required className="w-full border p-2 rounded" value={formDataUser.Nombre_Completo} onChange={e => setFormDataUser({...formDataUser, Nombre_Completo: e.target.value})} />
                      <input type="password" placeholder={usuarioEditando ? "Dejar en blanco para mantener" : "Contraseña"} required={!usuarioEditando} className="w-full border p-2 rounded" value={formDataUser.Passwd} onChange={e => setFormDataUser({...formDataUser, Passwd: e.target.value})} />
                      
                      <select className="w-full border p-2 rounded" required value={formDataUser.ID_Rol} onChange={e => setFormDataUser({...formDataUser, ID_Rol: parseInt(e.target.value)})}>
                          <option value="">Seleccione Rol</option>
                          {roles.map(r => <option key={r.ID} value={r.ID}>{r.Rol}</option>)}
                      </select>

                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setModalUsuarioOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* ... Modales Rol y Permisos iguales ... */}
      
      {/* MODAL CREAR ROL */}
      {modalRolOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-80 shadow-xl">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Nuevo Rol</h2>
                  <form onSubmit={guardarRol}>
                      <input 
                        type="text" placeholder="Nombre del Rol (ej: Gerente)" required 
                        className="w-full border border-gray-300 p-2 rounded mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={formDataRol.Nombre}
                        onChange={e => setFormDataRol({ Nombre: e.target.value })}
                      />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setModalRolOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium">Crear</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL PERMISOS */}
      {modalPermisosOpen && rolSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Configurar Permisos</h2>
                    <p className="text-gray-500">Rol: <span className="font-bold text-purple-600">{rolSeleccionado.Rol}</span></p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permisosCatalogo.map(permiso => (
                              <label key={permiso.ID} className={`flex items-start p-3 rounded border cursor-pointer transition-all ${
                                  permisosSeleccionados.includes(permiso.ID) ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}>
                                  <input 
                                    type="checkbox" 
                                    className="mt-1 mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    checked={permisosSeleccionados.includes(permiso.ID)}
                                    onChange={() => togglePermiso(permiso.ID)}
                                  />
                                  <div>
                                      <span className="block font-bold text-gray-800 text-sm">{permiso.Nombre}</span>
                                      <span className="text-xs text-gray-500">{permiso.Descripcion}</span>
                                  </div>
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3 pt-4 border-t">
                      <button onClick={() => setModalPermisosOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cerrar</button>
                      <button onClick={guardarPermisos} className="px-6 py-2 bg-purple-600 text-white rounded font-bold shadow hover:bg-purple-700">
                          Guardar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Usuarios;