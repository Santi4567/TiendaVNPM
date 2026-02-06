const { getDB } = require('../config/database');

const ProductoModel = {

    // Obtener todos
    findAll: async () => {
        try {
            const db = getDB();
            const sql = `
                SELECT ID, Producto, Precio_Proveedor, Stock, Precio_Unidad, 
                       Precio_Publico, Codigo, Fecha_Caducidad
                FROM productos 
                ORDER BY Producto ASC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

    // Buscador (Nombre o Código)
    search: async (termino) => {
        try {
            const db = getDB();
            const sql = `
                SELECT ID, Producto, Precio_Publico, Stock, Codigo 
                FROM productos 
                WHERE Producto LIKE ? OR Codigo LIKE ? 
                ORDER BY Producto ASC 
                LIMIT 10
            `;
            const search = `%${termino}%`;
            const [rows] = await db.execute(sql, [search, search]);
            return rows;
        } catch (error) { throw error; }
    },

    //Buscador de un prodcuto por Id
    findById: async (id) => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT * FROM productos WHERE ID = ?', [id]);
            return rows[0];
        } catch (error) { throw error; }
    },

    // Validar duplicados (Nombre o Código) excluyendo el ID actual (para edits)
    checkDuplicate: async (campo, valor, excludeId = null) => {
        try {
            const db = getDB();
            let sql = `SELECT ID FROM productos WHERE ${campo} = ?`;
            const params = [valor];

            if (excludeId) {
                sql += ' AND ID != ?';
                params.push(excludeId);
            }

            const [rows] = await db.execute(sql, params);
            return rows.length > 0;
        } catch (error) { throw error; }
    },

    // Creacion de un producto
    create: async (data) => {
        try {
            const db = getDB();
            const sql = `
                INSERT INTO productos 
                (Producto, Precio_Proveedor, Stock, Stock_Minimo, Precio_Unidad, Precio_Publico, Codigo, Fecha_Caducidad) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [
                data.producto,
                data.precio_proveedor || null,
                data.stock || 0,
                data.stock_minimo || 5, // <--- NUEVO CAMPO (Default 5)
                data.precio_unidad || null,
                data.precio_publico,
                data.codigo || null,
                data.fecha_caducidad || null
            ]);
            return result.insertId;
        } catch (error) { throw error; }
    },

    // Actualizacion de Producto 
    update: async (id, data) => {
        try {
            const db = getDB();
            const sql = `
                UPDATE productos 
                SET Producto = ?, Precio_Proveedor = ?, Stock = ?, Stock_Minimo = ?, 
                    Precio_Unidad = ?, Precio_Publico = ?, Codigo = ?, Fecha_Caducidad = ?,
                    Fecha_Ultimo_Ingreso = NOW() 
                WHERE ID = ?
            `;
            const [result] = await db.execute(sql, [
                data.producto,
                data.precio_proveedor || null,
                data.stock || 0,
                data.stock_minimo || 5, // <--- NUEVO CAMPO
                data.precio_unidad || null,
                data.precio_publico,
                data.codigo || null,
                data.fecha_caducidad || null,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },


    // Actualización rápida de stock
    updateStock: async (id, nuevoStock) => {
        try {
            const db = getDB();
            const sql = 'UPDATE productos SET Stock = ? WHERE ID = ?';
            const [result] = await db.execute(sql, [nuevoStock, id]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },

    // Actualización rápida de fecha de caducidad
    updateExpiry: async (id, nuevaFecha) => {
        try {
            const db = getDB();
            const sql = 'UPDATE productos SET Fecha_Caducidad = ? WHERE ID = ?';
            const [result] = await db.execute(sql, [nuevaFecha, id]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },

    // Verificar dependencias antes de borrar
    hasDependencies: async (id) => {
        try {
            const db = getDB();
            // Verificar Ventas
            const [ventas] = await db.execute('SELECT COUNT(*) as total FROM ventas WHERE ID_Producto = ?', [id]);
            if (ventas[0].total > 0) return 'ventas';

            // Verificar Cuentas (Fiado)
            const [cuentas] = await db.execute('SELECT COUNT(*) as total FROM cuentas WHERE ID_Producto = ?', [id]);
            if (cuentas[0].total > 0) return 'cuentas';

            return null; // No hay dependencias
        } catch (error) { throw error; }
    },

    delete: async (id) => {
        try {
            const db = getDB();
            const [result] = await db.execute('DELETE FROM productos WHERE ID = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) { throw error; }
    },
    
    
    // --- SECCIÓN DE ALERTAS ---

    // 1. Alertas de Stock (Stock actual <= Stock Mínimo)
    getLowStock: async () => {
        try {
            const db = getDB();
            const sql = `
                SELECT * FROM productos 
                WHERE Stock <= Stock_Minimo 
                ORDER BY Stock ASC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

    // 2. Alertas de Caducidad (Vencidos + Próximos 30 días)
    getExpiringSoon: async (dias = 30) => {
        try {
            const db = getDB();
            // DATEDIFF devuelve los días de diferencia. Si es negativo, ya venció.
            const sql = `
                SELECT *, DATEDIFF(Fecha_Caducidad, CURDATE()) as DiasRestantes
                FROM productos 
                WHERE Fecha_Caducidad IS NOT NULL 
                AND Fecha_Caducidad <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
                ORDER BY Fecha_Caducidad ASC
            `;
            const [rows] = await db.execute(sql, [dias]);
            return rows;
        } catch (error) { throw error; }
    }
};

module.exports = ProductoModel;