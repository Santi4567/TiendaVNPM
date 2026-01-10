const { getDB } = require('../config/database');

const CuentaModel = {

    // Ver todas las cuentas (Con nombres de cliente y producto)
    findAll: async () => {
        try {
            const db = getDB();
            const sql = `
                SELECT c.ID, c.Fecha, c.Precio, 
                       cl.Nombre as Cliente, 
                       p.Producto as Producto
                FROM cuentas c
                JOIN clientes cl ON c.ID_Cliente = cl.ID
                JOIN productos p ON c.ID_Producto = p.ID
                ORDER BY c.Fecha DESC
            `;
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

    // Ver cuentas de un solo cliente
    findByClient: async (clienteId) => {
        try {
            const db = getDB();
            const sql = `
                SELECT c.ID, c.Precio, c.Fecha, p.Producto
                FROM cuentas c
                JOIN productos p ON c.ID_Producto = p.ID
                WHERE c.ID_Cliente = ?
            `;
            const [rows] = await db.execute(sql, [clienteId]);
            return rows;
        } catch (error) { throw error; }
    },

    // Agregar deuda (Fiarse)
    add: async (registros) => {
        try {
            const db = getDB();
            // registros es un array de arrays: [[idCliente, idProd, precio, estado], ...]
            const sql = 'INSERT INTO cuentas (ID_Cliente, ID_Producto, Precio, Estado) VALUES ?';
            const [result] = await db.query(sql, [registros]);
            return result.affectedRows;
        } catch (error) { throw error; }
    },

    // SALDAR DEUDA (Transacción Compleja)
    // Mueve de 'cuentas' a 'ventas' llenando el Snapshot y el Usuario responsable
    settle: async (clienteId, usuarioId) => {
        let connection;
        try {
            connection = getDB(); // OJO: Si usas pool, aquí sería getConnection()
            
            // 1. Obtener las deudas pendientes CON el nombre del producto (para el snapshot)
            const [deudas] = await connection.execute(`
                SELECT c.ID_Producto, c.Precio, p.Producto as NombreProducto
                FROM cuentas c
                JOIN productos p ON c.ID_Producto = p.ID
                WHERE c.ID_Cliente = ?
            `, [clienteId]);

            if (deudas.length === 0) return 0;

            // 2. Preparar datos para VENTAS 
            // Estructura Ventas: (ID_Producto, Producto_Snapshot, Precio, ID_Cliente, ID_Usuario)
            const ventasData = deudas.map(d => [
                d.ID_Producto,
                d.NombreProducto, // Snapshot histórico
                d.Precio,
                clienteId,
                usuarioId        // El usuario logueado que está cobrando
            ]);

            // 3. Insertar en Ventas
            const sqlInsert = `
                INSERT INTO ventas 
                (ID_Producto, Producto_Snapshot, Precio, ID_Cliente, ID_Usuario) 
                VALUES ?
            `;
            await connection.query(sqlInsert, [ventasData]);

            // 4. Borrar de Cuentas
            await connection.execute('DELETE FROM cuentas WHERE ID_Cliente = ?', [clienteId]);

            return deudas.length; // Retornamos cuántos items se cobraron
        } catch (error) { throw error; }
    }
};

module.exports = CuentaModel;