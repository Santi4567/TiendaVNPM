const RolModel = require('../models/Rol.js');

// 1. LISTAR ROLES Y SUS PERMISOS
const getRoles = async (req, res) => {
    try {
        const roles = await RolModel.findAll();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. LISTAR CATÁLOGO DE PERMISOS
const getAllPermisos = async (req, res) => {
    try {
        const permisos = await RolModel.findAllPermisos();
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. CREAR NUEVO ROL
const createRol = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Nombre del rol requerido' });

        const id = await RolModel.create(nombre);
        res.json({ success: true, message: 'Rol creado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. VER PERMISOS DE UN ROL
const getRolPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const permisos = await RolModel.getPermissionsByRole(id);
        res.json(permisos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. MODIFICAR PERMISOS DE UN ROL
const updateRolPermissions = async (req, res) => {
    try {
        const { id } = req.params; // ID del Rol
        const { permisos } = req.body; // Array de IDs [1, 5, 8]

        // PROTECCIÓN: No permitir quitar permisos al Rol ADMIN (ID 1)
        // para evitar que el admin se bloquee a sí mismo.
        if (parseInt(id) === 1) {
            return res.status(400).json({ error: 'No se pueden modificar los permisos del Super Admin manualmente' });
        }

        if (!Array.isArray(permisos)) {
            return res.status(400).json({ error: 'Se requiere un array de IDs de permisos' });
        }

        await RolModel.updatePermissions(id, permisos);
        res.json({ success: true, message: 'Permisos del rol actualizados correctamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar permisos' });
    }
};

// 6. ESTADÍSTICAS DE USUARIOS POR ROL
const getStats = async (req, res) => {
    try {
        const stats = await RolModel.getUsersCountByRole();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRoles,
    getAllPermisos,
    createRol,
    getRolPermissions,
    updateRolPermissions,
    getStats
};