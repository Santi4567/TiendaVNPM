// Query SQL correspondientes para cad accion 

const { getDB } = require('../config/database'); // <--- CORREGIDO

const UsuarioModel = {
    
    /**
     * Busca un usuario por su nombre de usuario (Login)
     */
    findByUsername: async (username) => {
        try {
            const db = getDB(); // Obtenemos la conexión activa
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE Usuario = ?', 
                [username]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Busca un usuario por su ID
     */
    findById: async (id) => {
        try {
            const db = getDB();
            // JOIN para traer el nombre del Rol
            const sql = `
                SELECT u.ID, u.Usuario, u.Nombre_Completo, u.ID_Rol, u.Activo, r.Nombre as RolNombre
                FROM users u
                JOIN roles r ON u.ID_Rol = r.ID
                WHERE u.ID = ?
            `;
            const [rows] = await db.execute(sql, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crea un nuevo usuario
     */
    create: async (userData) => {
        try {
            const db = getDB();
            const { usuario, nombreCompleto, passwd, idRol } = userData;
            
            const [result] = await db.execute(
                `INSERT INTO users (Usuario, Nombre_Completo, Passwd, ID_Rol, Activo) 
                 VALUES (?, ?, ?, ?, 1)`,
                [usuario, nombreCompleto, passwd, idRol]
            );
            
            return result.insertId; 
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verifica si existe (útil para validaciones)
     */
    exists: async (username) => {
        try {
            const db = getDB();
            const [rows] = await db.execute(
                'SELECT ID FROM users WHERE Usuario = ?', 
                [username]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar datos de un usuario
     * IMPORTANTE: La contraseña se maneja aparte o se debe hashear antes de enviar aquí
     */
    update: async (id, userData) => {
        try {
            const db = getDB();
            const { usuario, nombreCompleto, idRol, activo } = userData;
            
            // Query dinámica: Actualizamos todo menos la contraseña (por seguridad)
            const [result] = await db.execute(
                `UPDATE users 
                 SET Usuario = ?, Nombre_Completo = ?, ID_Rol = ?, Activo = ?
                 WHERE ID = ?`,
                [usuario, nombreCompleto, idRol, activo, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualizar SOLO la contraseña (para cuando el usuario la cambia)
     */
    updatePassword: async (id, hashedPassword) => {
        try {
            const db = getDB();
            const [result] = await db.execute(
                'UPDATE users SET Passwd = ? WHERE ID = ?',
                [hashedPassword, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Agrega esta función a tu objeto UsuarioModel existente
    /**
     * Obtiene el perfil completo del usuario con sus permisos
     */
    getProfile: async (id) => {
        try {
            const db = getDB();
            
            // 1. Obtener datos básicos del usuario y su rol
            // Usamos LEFT JOIN por si acaso el rol fue borrado (aunque no debería pasar)
            const [userRows] = await db.execute(`
                SELECT u.ID, u.Usuario, u.Nombre_Completo, u.ID_Rol, r.Nombre as Rol
                FROM users u
                LEFT JOIN roles r ON u.ID_Rol = r.ID
                WHERE u.ID = ?
            `, [id]);

            if (userRows.length === 0) return null;
            
            const user = userRows[0];

            // 2. Si es ADMIN (ID 1), le damos "permiso total" visualmente
            // O buscamos sus permisos reales en la tabla
            let permisos = [];
            
            if (user.ID_Rol) {
                const [permisosRows] = await db.execute(`
                    SELECT p.Nombre, p.Descripcion
                    FROM roles_permisos rp
                    JOIN permisos p ON rp.ID_Permiso = p.ID
                    WHERE rp.ID_Rol = ?
                `, [user.ID_Rol]);
                
                // Convertimos el array de objetos a un array simple de strings para facilitar el frontend
                // Ej: ['crear_venta', 'ver_reportes']
                permisos = permisosRows.map(p => p.Nombre);
            }

            // 3. Retornamos el objeto combinado
            return {
                id: user.ID,
                usuario: user.Usuario,
                nombre: user.Nombre_Completo,
                rol: user.Rol,
                rolId: user.ID_Rol,
                permisos: permisos // Array de strings
            };

        } catch (error) {
            throw error;
        }
    },
    /**
     * Trae TODOS los usuarios con sus roles
     */
    findAll: async () => {
        try {
            const db = getDB();
            const sql = `
                SELECT u.ID, u.Usuario, u.Nombre_Completo, u.ID_Rol, u.Activo, u.Fecha_Creacion, r.Nombre as Rol
                FROM users u
                JOIN roles r ON u.ID_Rol = r.ID
                ORDER BY u.ID DESC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Eliminado Lógico (Soft Delete)
     * No borramos el registro para no romper las ventas asociadas, solo lo desactivamos.
     */
    delete: async (id) => {
        try {
            const db = getDB();
            const [result] = await db.execute(
                'UPDATE users SET Activo = 0 WHERE ID = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },
    /**
     * Obtiene la lista de nombres de permisos de un usuario
     * Retorna un array de strings: ['view.client', 'add.client']
     */
    getPermissions: async (userId) => {
        try {
            const db = getDB();
            const sql = `
                SELECT p.Nombre
                FROM roles_permisos rp
                JOIN users u ON u.ID_Rol = rp.ID_Rol
                JOIN permisos p ON rp.ID_Permiso = p.ID
                WHERE u.ID = ?
            `;
            const [rows] = await db.execute(sql, [userId]);
            
            // Transformamos [{Nombre: 'view.client'}, ...] a ['view.client', ...]
            return rows.map(row => row.Nombre);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = UsuarioModel;