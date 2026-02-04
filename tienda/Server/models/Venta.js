const { getDB } = require('../config/database');

const VentaModel = {
/**
     * CREAR VENTA (Con Snapshots)
     */
    create: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            const { productos, idUsuario, idCliente } = data;

            // 1. OBTENER SNAPSHOTS (Nombres actuales)
            // Usuario
            const [userRows] = await connection.execute('SELECT Usuario FROM users WHERE ID = ?', [idUsuario]);
            const usuarioSnapshot = userRows.length > 0 ? userRows[0].Usuario : 'Desconocido';

            // Cliente (Si hay)
            let clienteSnapshot = 'Público General';
            if (idCliente) {
                const [clientRows] = await connection.execute('SELECT Nombre FROM clientes WHERE ID = ?', [idCliente]);
                if (clientRows.length > 0) clienteSnapshot = clientRows[0].Nombre;
            }

            const registrosVenta = [];

            // 2. PROCESAR PRODUCTOS
            for (const item of productos) {
                // Verificar Stock
                const [prodRows] = await connection.execute('SELECT Producto, Stock FROM productos WHERE ID = ?', [item.ID]);
                if (prodRows.length === 0) throw new Error(`Producto ID ${item.ID} no encontrado`);
                
                const prod = prodRows[0];
                const cantidad = item.cantidad || 1;

                if (prod.Stock < cantidad) throw new Error(`Stock insuficiente para ${prod.Producto}`);

                // Restar Stock
                await connection.execute('UPDATE productos SET Stock = Stock - ? WHERE ID = ?', [cantidad, item.ID]);

                // Preparar filas para insertar (Una por unidad)
                for (let i = 0; i < cantidad; i++) {
                    registrosVenta.push([
                        item.ID,
                        prod.Producto,    // Producto_Snapshot
                        item.precio,
                        idCliente || null,
                        idUsuario,
                        clienteSnapshot,  // <--- NUEVO
                        usuarioSnapshot,  // <--- NUEVO
                        'APROBADA'        // <--- NUEVO
                    ]);
                }
            }

            // 3. INSERT MASIVO
            if (registrosVenta.length > 0) {
                const sqlInsert = `
                    INSERT INTO ventas 
                    (ID_Producto, Producto_Snapshot, Precio, ID_Cliente, ID_Usuario, Cliente_Snapshot, Usuario_Snapshot, Estado) 
                    VALUES ?
                `;
                await connection.query(sqlInsert, [registrosVenta]);
            }

            await connection.commit();
            return registrosVenta.length;

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },

    /**
     * CANCELAR VENTA (Soft Delete)
     * Cambia estado a CANCELADA y devuelve el Stock.
     */
    cancelar: async (idVenta) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // 1. Verificar estado actual
            const [ventaRows] = await connection.execute(
                'SELECT ID_Producto, Producto_Snapshot, Estado FROM ventas WHERE ID = ?', 
                [idVenta]
            );

            if (ventaRows.length === 0) throw new Error('Venta no encontrada');
            const venta = ventaRows[0];

            if (venta.Estado === 'CANCELADA') throw new Error('Esta venta ya fue cancelada anteriormente.');

            // 2. Devolver Stock (+1)
            await connection.execute(
                'UPDATE productos SET Stock = Stock + 1 WHERE ID = ?',
                [venta.ID_Producto]
            );

            // 3. Cambiar Estado (NO BORRAR)
            await connection.execute(
                "UPDATE ventas SET Estado = 'CANCELADA' WHERE ID = ?", 
                [idVenta]
            );

            await connection.commit();
            return { success: true, producto: venta.Producto_Snapshot };

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },

    /**
     * OBTENER POR FECHA (Usando Snapshots y mostrando Estado)
     */
    getByDateRange: async (inicio, fin) => {
        try {
            const db = getDB();
            // Ya no hacemos tantos JOINs porque confiamos en los Snapshots
            // Pero mantenemos ID_Producto por si queremos filtrar luego
            const sql = `
                SELECT 
                    ID, Fecha, Precio, Estado,
                    Producto_Snapshot as Producto,
                    Cliente_Snapshot as Cliente,
                    Usuario_Snapshot as Vendedor,
                    ID_Producto
                FROM ventas 
                WHERE DATE(Fecha) BETWEEN ? AND ?
                ORDER BY Fecha DESC
            `;
            const [rows] = await db.execute(sql, [inicio, fin]);
            return rows;
        } catch (error) { throw error; }
    },

    /**
     * KPI TOTALES (Ignorando canceladas)
     */
    getStatsByDate: async (fecha) => {
        try {
            const db = getDB();
            const sql = `
                SELECT 
                    COUNT(*) as totalRegistros,
                    COALESCE(SUM(Precio), 0) as totalVentas,
                    COUNT(DISTINCT ID_Producto) as productosDiferentes,
                    COUNT(DISTINCT ID_Cliente) as clientesAtendidos
                FROM ventas 
                WHERE DATE(Fecha) = ? AND Estado = 'APROBADA'
            `;
            const [rows] = await db.execute(sql, [fecha]);
            return rows[0];
        } catch (error) { throw error; }
    },

    /**
     * REPORTE AVANZADO (Filtros Dinámicos)
     * Permite filtrar por fechas y/o producto específico.
     * MODIFICADO: Solo muestra ventas con Estado = 'APROBADA' para no inflar los totales.
     */
    getReporteAvanzado: async (filtros) => {
        try {
            const db = getDB();
            const { inicio, fin, idProducto } = filtros;

            // CAMBIO CLAVE: En el WHERE forzamos que el Estado sea 'APROBADA'
            let sql = `
                SELECT 
                    v.ID, v.Fecha, v.Precio, 
                    v.Producto_Snapshot as Producto,
                    cl.Nombre as Cliente,
                    u.Usuario as Vendedor
                FROM ventas v
                LEFT JOIN clientes cl ON v.ID_Cliente = cl.ID
                LEFT JOIN users u ON v.ID_Usuario = u.ID
                WHERE v.Estado = 'APROBADA'
            `;
            
            const params = [];

            // 1. Filtro de Fechas (Si vienen ambas)
            if (inicio && fin) {
                sql += ' AND DATE(v.Fecha) BETWEEN ? AND ?';
                params.push(inicio, fin);
            }

            // 2. Filtro de Producto
            if (idProducto) {
                sql += ' AND v.ID_Producto = ?';
                params.push(idProducto);
            }

            sql += ' ORDER BY v.Fecha DESC';

            const [rows] = await db.execute(sql, params);
            return rows;
        } catch (error) { throw error; }
    },
};

module.exports = VentaModel;