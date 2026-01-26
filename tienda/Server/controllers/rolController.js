const RolModel = require('../models/Rol');

// LISTAR ROLES (Con conteo de usuarios para saber si se puede borrar)
const getRoles = async (req, res) => {
    try {
        const roles = await RolModel.getUsersCountByRole(); // Ya tenías este método en tu modelo anterior
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREAR ROL
const createRol = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
        
        const id = await RolModel.create(nombre);
        res.json({ success: true, id, message: 'Rol creado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ELIMINAR ROL (Con Cláusula de Seguridad)
const deleteRol = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. CLAUSULA: No se puede borrar si tiene usuarios
        const tieneUsuarios = await RolModel.hasUsers(id);
        if (tieneUsuarios) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el rol porque hay usuarios asignados a él.' 
            });
        }

        // 2. Procerde a eliminar
        await RolModel.delete(id);
        res.json({ success: true, message: 'Rol eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// OBTENER CATÁLOGO DE PERMISOS
const getAllPermisos = async (req, res) => {
    try {
        const permisos = await RolModel.findAllPermisos();
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// OBTENER PERMISOS DE UN ROL
const getRolPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const permisos = await RolModel.getPermissionsByRole(id);
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR PERMISOS DE UN ROL
const updateRolPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const { permisosIds } = req.body; // Array de IDs [1, 2, 5]

        await RolModel.updatePermissions(id, permisosIds);
        res.json({ success: true, message: 'Permisos actualizados' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    getRoles, 
    createRol, 
    deleteRol, 
    getAllPermisos, 
    getRolPermisos, 
    updateRolPermisos 
};