const { getDB } = require('../config/database');

const ClienteModel = {
    
    // Obtener todos (alfabéticamente)
    findAll: async () => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT ID, Nombre FROM clientes ORDER BY Nombre ASC');
            return rows;
        } catch (error) { throw error; }
    },

    // Buscador (Autocompletado)
    searchByName: async (termino) => {
        try {
            const db = getDB();
            const [rows] = await db.execute(
                'SELECT ID, Nombre FROM clientes WHERE Nombre LIKE ? ORDER BY Nombre ASC LIMIT 5',
                [`%${termino}%`]
            );
            return rows;
        } catch (error) { throw error; }
    },

    // Buscar por ID
    findById: async (id) => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT ID, Nombre FROM clientes WHERE ID = ?', [id]);
            return rows[0];
        } catch (error) { throw error; }
    },

    // Buscar por Nombre Exacto (Para evitar duplicados)
    findByName: async (nombre) => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT ID FROM clientes WHERE Nombre = ?', [nombre]);
            return rows[0];
        } catch (error) { throw error; }
    },

    // Verificar si tiene cuentas pendientes (Regla de negocio para borrar)
    hasPendingCuentas: async (id) => {
        try {
            const db = getDB();
            const [rows] = await db.execute(
                'SELECT COUNT(*) as total FROM cuentas WHERE ID_Cliente = ?', 
                [id]
            );
            return rows[0].total > 0;
        } catch (error) { throw error; }
    },

    create: async (nombre) => {
        try {
            const db = getDB();
            const [result] = await db.execute(
                'INSERT INTO clientes (Nombre) VALUES (?)', 
                [nombre]
            );
            return result.insertId;
        } catch (error) { throw error; }
    },

    update: async (id, nombre) => {
        try {
            const db = getDB();
            const [result] = await db.execute(
                'UPDATE clientes SET Nombre = ? WHERE ID = ?', 
                [nombre, id]
            );
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },

    delete: async (id) => {
        try {
            const db = getDB();
            const [result] = await db.execute('DELETE FROM clientes WHERE ID = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    }
};

module.exports = ClienteModel;