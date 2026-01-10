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

    /**
     * ALERTA 1: Productos con Stock Bajo
     * Busca productos donde el Stock actual sea menor o igual al Stock Mínimo definido
     */
    getLowStockAlerts: async () => {
        try {
            const db = getDB();
            const sql = `
                SELECT ID, Producto, Stock, Stock_Minimo, Precio_Proveedor
                FROM productos 
                WHERE Stock <= Stock_Minimo
                ORDER BY Stock ASC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

    /**
     * ALERTA 2: Productos Próximos a Caducar
     * Busca productos que caduquen en los próximos 30 días (ajustable)
     */
    getExpiringAlerts: async (dias = 30) => {
        try {
            const db = getDB();
            const sql = `
                SELECT ID, Producto, Stock, Fecha_Caducidad, DATEDIFF(Fecha_Caducidad, NOW()) as Dias_Restantes
                FROM productos 
                WHERE Fecha_Caducidad IS NOT NULL 
                  AND Fecha_Caducidad BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
                ORDER BY Fecha_Caducidad ASC
            `;
            const [rows] = await db.execute(sql, [dias]);
            return rows;
        } catch (error) { throw error; }
    }
};

module.exports = ProductoModel;