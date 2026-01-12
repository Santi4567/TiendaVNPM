const { getDB } = require('../config/database');

const RolModel = {

    // 1. Crear Nuevo Rol
    create: async (nombre) => {
        try {
            const db = getDB();
            const [result] = await db.execute('INSERT INTO roles (Nombre) VALUES (?)', [nombre]);
            return result.insertId;
        } catch (error) { throw error; }
    },

    // 2. Listar todos los Roles
    findAll: async () => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT * FROM roles');
            return rows;
        } catch (error) { throw error; }
    },

    // 3. Listar TODOS los permisos disponibles (Catálogo)
    findAllPermisos: async () => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT * FROM permisos ORDER BY Nombre ASC');
            return rows;
        } catch (error) { throw error; }
    },

    // 4. Obtener permisos actuales de un Rol específico
    getPermissionsByRole: async (rolId) => {
        try {
            const db = getDB();
            const sql = `
                SELECT p.ID, p.Nombre, p.Descripcion
                FROM roles_permisos rp
                JOIN permisos p ON rp.ID_Permiso = p.ID
                WHERE rp.ID_Rol = ?
            `;
            const [rows] = await db.execute(sql, [rolId]);
            return rows;
        } catch (error) { throw error; }
    },

    // 5. ACTUALIZAR PERMISOS DE UN ROL (Transacción)
    updatePermissions: async (rolId, permisoIds) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // A. Borrar permisos anteriores de este rol
            await connection.execute('DELETE FROM roles_permisos WHERE ID_Rol = ?', [rolId]);

            // B. Si hay nuevos permisos, insertarlos
            if (permisoIds && permisoIds.length > 0) {
                const values = permisoIds.map(pId => [rolId, pId]);
                const sql = 'INSERT INTO roles_permisos (ID_Rol, ID_Permiso) VALUES ?';
                await connection.query(sql, [values]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },

    // 6. ESTADÍSTICAS: Cuántos usuarios hay por rol
    getUsersCountByRole: async () => {
        try {
            const db = getDB();
            // Usamos LEFT JOIN para mostrar roles incluso si no tienen usuarios (count 0)
            const sql = `
                SELECT r.Nombre as Rol, COUNT(u.ID) as TotalUsuarios
                FROM roles r
                LEFT JOIN users u ON r.ID = u.ID_Rol
                GROUP BY r.ID, r.Nombre
                ORDER BY TotalUsuarios DESC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    }
};

module.exports = RolModel;