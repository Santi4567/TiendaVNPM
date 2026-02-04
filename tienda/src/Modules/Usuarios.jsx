import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Si usas permisos aquí, agrégalo
import { apiCall } from '../utils/api';
import { useNotification } from '../context/NotificationContext'; // <--- 1. Hook Notificaciones
import ConfirmModal from '../components/ConfirmModal'; // <--- 2. Componente Modal

const Usuarios = () => {
    const { user } = useAuth();
  const { notify } = useNotification(); // <--- 3. Usar Hook
  const [activeTab, setActiveTab] = useState('usuarios');
  
  // Estados de Datos
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisosCatalogo, setPermisosCatalogo] = useState([]);
  const [busquedaUser, setBusquedaUser] = useState('');
  
  // Estados de Modales Formularios
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formDataUser, setFormDataUser] = useState({ 
      Usuario: '', Nombre_Completo: '', Passwd: '', ID_Rol: '' 
  });

  const [modalRolOpen, setModalRolOpen] = useState(false);
  const [formDataRol, setFormDataRol] = useState({ nombre: '' }); // Nota: 'nombre' en minúscula

  const [modalPermisosOpen, setModalPermisosOpen] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]); 

  // Estado para Modal de Confirmación (Acciones Peligrosas)
  const [confirmModal, setConfirmModal] = useState({ 
      isOpen: false, 
      action: null, 
      title: '', 
      message: '', 
      tipo: 'danger' 
  });

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
    } catch (error) { notify('Error cargando usuarios', 'error'); }
  };

  const cargarRoles = async () => {
    try {
        const res = await apiCall('/api/roles');
        setRoles(res.data || []);
    } catch (error) { notify('Error cargando roles', 'error'); }
  };

  const cargarCatalogoPermisos = async () => {
    try {
        const res = await apiCall('/api/roles/permisos/catalogo');
        setPermisosCatalogo(res.data || []);
    } catch (error) { notify('Error cargando permisos', 'error'); }
  };

  // --- ACCIONES DE USUARIO (CON MODAL) ---
  
  // 1. Desactivar (Soft Delete)
  const solicitarDesactivarUsuario = (usuario) => {
      setConfirmModal({
          isOpen: true,
          title: '¿Desactivar Usuario?',
          message: `¿Estás seguro de desactivar el acceso a "${usuario.Usuario}"?`,
          tipo: 'danger',
          action: () => ejecutarDesactivarUsuario(usuario.ID)
      });
  };

  const ejecutarDesactivarUsuario = async (id) => {
      try {
          await apiCall(`/api/users/${id}`, 'DELETE');
          notify('Usuario desactivado correctamente', 'success');
          cargarUsuarios();
      } catch (error) { notify('Error al desactivar usuario', 'error'); }
      finally { setConfirmModal(prev => ({ ...prev, isOpen: false })); }
  };

  // 2. Reactivar
  const solicitarReactivarUsuario = (usuario) => {
      setConfirmModal({
          isOpen: true,
          title: '¿Reactivar Usuario?',
          message: `¿Deseas reactivar el acceso para "${usuario.Usuario}"?`,
          tipo: 'success', // Verde porque es positivo
          action: () => ejecutarReactivarUsuario(usuario.ID)
      });
  };

  const ejecutarReactivarUsuario = async (id) => {
      try {
          await apiCall(`/api/users/${id}/reactivar`, 'PUT');
          notify('Usuario reactivado exitosamente', 'success');
          cargarUsuarios();
      } catch (error) { notify('Error al reactivar usuario', 'error'); }
      finally { setConfirmModal(prev => ({ ...prev, isOpen: false })); }
  };

  // 3. Eliminar Definitivamente (Hard Delete)
  const solicitarEliminarDefinitivo = (usuario) => {
      setConfirmModal({
          isOpen: true,
          title: '⚠️ ¿ELIMINAR DEFINITIVAMENTE?',
          message: `Estás a punto de borrar FÍSICAMENTE a "${usuario.Usuario}". Esta acción NO se puede deshacer y borrará su historial.`,
          tipo: 'danger',
          action: () => ejecutarEliminarDefinitivo(usuario.ID)
      });
  };

  const ejecutarEliminarDefinitivo = async (id) => {
      try {
          const res = await apiCall(`/api/users/${id}/force`, 'DELETE');
          if (res.data.error) {
              notify(res.data.error, 'error');
          } else {
              notify('Usuario eliminado permanentemente', 'success');
              cargarUsuarios();
          }
      } catch (error) { 
        notify('Error: Probablemente el usuario tiene ventas asociadas.', 'error'); 
      } finally { setConfirmModal(prev => ({ ...prev, isOpen: false })); }
  };

  // --- GESTIÓN FORMULARIOS ---
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
    
    // Validación Frontend Rápida (Opcional pero recomendada)
    if (!usuarioEditando && formDataUser.Passwd.length < 5) {
        return notify('La contraseña es muy corta (mínimo 5 caracteres).', 'warning');
    }

    try {
        let response;
        if (usuarioEditando) {
            response = await apiCall(`/api/users/${usuarioEditando.ID}`, 'PUT', formDataUser);
        } else {
            response = await apiCall('/api/users', 'POST', formDataUser);
        }

        // VERIFICACIÓN ESTRICTA DE LA RESPUESTA
        if (response.data && response.data.success) {
            // ÉXITO
            notify(response.data.message || 'Operación exitosa', 'success');
            setModalUsuarioOpen(false); // Solo cerramos si todo salió bien
            setFormDataUser({ Usuario: '', Nombre_Completo: '', Passwd: '', ID_Rol: '' }); // Limpiar
            cargarUsuarios();
            cargarRoles(); 
        } else {
            // ERROR LÓGICO DEL BACKEND (Ej: "Usuario ya existe")
            // No cerramos el modal, mostramos el error
            const errorMsg = response.data.message || response.data.error || 'Error desconocido del servidor';
            notify(errorMsg, 'error');
        }

    } catch (error) { 
        // ERROR DE RED O STATUS 400/500 QUE LANZA EXCEPCIÓN
        console.error(error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error de conexión al guardar';
        notify(errorMsg, 'error');
    }
  };

  // --- GESTIÓN ROLES ---
  const guardarRol = async (e) => {
      e.preventDefault();
      try {
          await apiCall('/api/roles', 'POST', formDataRol);
          setModalRolOpen(false);
          setFormDataRol({ nombre: '' });
          cargarRoles();
          notify('Rol creado correctamente', 'success');
      } catch (error) { notify('Error al crear rol', 'error'); }
  };

  const solicitarEliminarRol = (rol) => {
      if (rol.TotalUsuarios > 0) return notify(`No puedes eliminar "${rol.Rol}" porque tiene usuarios asignados.`, 'error');
      
      setConfirmModal({
          isOpen: true,
          title: '¿Eliminar Rol?',
          message: `¿Estás seguro de eliminar el rol "${rol.Rol}"?`,
          tipo: 'danger',
          action: () => ejecutarEliminarRol(rol.ID)
      });
  };

  const ejecutarEliminarRol = async (id) => {
      try {
          await apiCall(`/api/roles/${id}`, 'DELETE');
          cargarRoles();
          notify('Rol eliminado correctamente', 'success');
      } catch (error) { notify('Error al eliminar rol', 'error'); }
      finally { setConfirmModal(prev => ({ ...prev, isOpen: false })); }
  };

  // --- GESTIÓN PERMISOS ---
  const abrirConfigPermisos = async (rol) => {
      if (rol.ID === 1) return notify('El rol de Super Admin no se puede editar', 'info');

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
          notify('Permisos actualizados correctamente', 'success');
      } catch (error) { notify('Error guardando permisos', 'error'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Administración del Sistema</h1>

      {/* TABS */}
      <div className="flex space-x-4 mb-6 border-b">
        <button onClick={() => setActiveTab('usuarios')} className={`pb-2 px-4 font-medium border-b-4 transition-colors ${activeTab === 'usuarios' ? 'border-blue-300 text-blue-300' : 'border-transparent text-white'}`}>Usuarios</button>
        <button onClick={() => setActiveTab('roles')} className={`pb-2 px-4 font-medium border-b-4 transition-colors ${activeTab === 'roles' ? 'border-blue-300 text-blue-300' : 'border-transparent text-white'}`}>Roles y Permisos</button>
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
                                    {/* --- REGLA: No mostrar acciones destructivas para el Super Admin (ID 1) --- */}
                                    {u.ID === 1 ? (
                                        <span className="text-xs text-gray-400 italic">Protegido</span>
                                    ) : (
                                        <>
                                            {/* Si está ACTIVO */}
                                            {u.Activo === 1 ? (
                                            <div className="space-x-2">
                                                <button onClick={() => abrirModalUsuario(u)} className="...">Editar</button>
                                                
                                                {/* --- REGLA: No mostrar botón "Desactivar" si es el mismo usuario logueado --- */}
                                                {u.ID !== user.id && (
                                                    <button onClick={() => solicitarDesactivarUsuario(u)} className="...">Desactivar</button>
                                                )}
                                            </div>
                                            ) : (
                                            // Si está INACTIVO
                                            <div className="space-x-3">
                                                <button onClick={() => solicitarReactivarUsuario(u)} className="...">Reactivar</button>
                                                
                                                {/* --- REGLA: Eliminar Definitivo tampoco para uno mismo (por si acaso) --- */}
                                                {u.ID !== user.id && (
                                                    <button onClick={() => solicitarEliminarDefinitivo(u)} className="...">Eliminar Definitivamente</button>
                                                )}
                                            </div>
                                            )}
                                        </>
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
                                  /* ELIMINAR ROL CON MODAL */
                                  <button onClick={() => solicitarEliminarRol(rol)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
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

{/* MODAL USUARIO */}
      {modalUsuarioOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              {/* CAMBIO DE TAMAÑO AQUÍ: w-full max-w-lg */}
              <div className="bg-white p-8 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in-up border border-gray-100">
                  
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h2 className="text-2xl font-bold text-gray-800">
                          {usuarioEditando ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}
                      </h2>
                      <button onClick={() => setModalUsuarioOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">✕</button>
                  </div>

                  <form onSubmit={guardarUsuario} className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Usuario (Login)</label>
                          <input 
                              type="text" 
                              placeholder="Ej: jpererez" 
                              required 
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={formDataUser.Usuario} 
                              onChange={e => setFormDataUser({...formDataUser, Usuario: e.target.value})} 
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                          <input 
                              type="text" 
                              placeholder="Ej: Juan Pérez" 
                              required 
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={formDataUser.Nombre_Completo} 
                              onChange={e => setFormDataUser({...formDataUser, Nombre_Completo: e.target.value})} 
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                              {usuarioEditando ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                          </label>
                          <input 
                              type="password" 
                              placeholder={usuarioEditando ? "Dejar en blanco para no cambiar" : "Mínimo 5 caracteres"} 
                              required={!usuarioEditando} 
                              minLength={usuarioEditando ? 0 : 5} // Validación HTML extra
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={formDataUser.Passwd} 
                              onChange={e => setFormDataUser({...formDataUser, Passwd: e.target.value})} 
                          />
                          <p className="text-xs text-gray-400 mt-1">Debe contener al menos 5 caracteres.</p>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Rol Asignado</label>
                          <select 
                              className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                              required 
                              value={formDataUser.ID_Rol} 
                              onChange={e => setFormDataUser({...formDataUser, ID_Rol: parseInt(e.target.value)})}
                          >
                              <option value="">-- Seleccione un Rol --</option>
                              {roles.map(r => <option key={r.ID} value={r.ID}>{r.Rol}</option>)}
                          </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                          <button 
                              type="button" 
                              onClick={() => setModalUsuarioOpen(false)} 
                              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                          >
                              {usuarioEditando ? 'Actualizar Datos' : 'Crear Usuario'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      {/* MODAL CREAR ROL */}
      {modalRolOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-80 shadow-xl animate-fade-in-up">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Nuevo Rol</h2>
                  <form onSubmit={guardarRol}>
                      <input 
                        type="text" placeholder="Nombre del Rol (ej: Gerente)" required 
                        className="w-full border border-gray-300 p-2 rounded mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={formDataRol.nombre} // Asegúrate que sea 'nombre' en minúscula
                        onChange={e => setFormDataRol({ nombre: e.target.value })}
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
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
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

export default Usuarios;