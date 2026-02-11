const { getDB } = require('../config/database');

const LibroModel = {
    // Listar todos
    findAll: async () => {
        try {
            const db = getDB();
            const sql = 'SELECT * FROM libros WHERE Activo = 1 ORDER BY Titulo ASC';
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

    // Buscar
    search: async (termino) => {
        try {
            const db = getDB();
            const sql = `
                SELECT * FROM libros 
                WHERE Activo = 1 
                AND (Titulo LIKE ? OR Autor LIKE ? OR Codigo LIKE ?)
                LIMIT 20
            `;
            const param = `%${termino}%`;
            const [rows] = await db.execute(sql, [param, param, param]);
            return rows;
        } catch (error) { throw error; }
    },

    // Crear (Con Descuento)
    create: async (data) => {
        try {
            const db = getDB();
            const sql = `
                INSERT INTO libros (Titulo, Autor, Editorial, Precio, Stock, Codigo, Descuento)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [
                data.titulo, data.autor, data.editorial, 
                data.precio, data.stock, data.codigo, 
                data.descuento || 0 // Si no envían nada, es 0
            ]);
            return result.insertId;
        } catch (error) { throw error; }
    },

    // Editar (Con Descuento)
    update: async (id, data) => {
        try {
            const db = getDB();
            const sql = `
                UPDATE libros 
                SET Titulo=?, Autor=?, Editorial=?, Precio=?, Stock=?, Codigo=?, Descuento=?
                WHERE ID=?
            `;
            const [result] = await db.execute(sql, [
                data.titulo, data.autor, data.editorial, 
                data.precio, data.stock, data.codigo, 
                data.descuento || 0,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },

    // Eliminar
    delete: async (id) => {
        try {
            const db = getDB();
            const sql = 'UPDATE libros SET Activo = 0 WHERE ID = ?';
            const [result] = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    }
};

module.exports = LibroModel;