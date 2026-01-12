const { getDB } = require('../config/database');

const VentaModel = {

    /**
     * CREAR VENTA (Transacción Compleja)
     * 1. Verifica stock actual.
     * 2. Descuenta stock.
     * 3. Guarda la venta con Snapshot y Usuario.
     */
    create: async (data) => {
        let connection;
        try {
            connection = getDB(); // Obtenemos la conexión
            await connection.beginTransaction(); // INICIO DE TRANSACCIÓN

            const { productos, idUsuario, idCliente } = data;
            const registrosVenta = [];

            // Procesamos cada producto solicitado
            for (const item of productos) {
                // A. Buscar datos actuales del producto (Para Snapshot y Stock)
                const [prodRows] = await connection.execute(
                    'SELECT Producto, Stock FROM productos WHERE ID = ?', 
                    [item.ID]
                );
                
                if (prodRows.length === 0) {
                    throw new Error(`Producto ID ${item.ID} no encontrado`);
                }

                const productoActual = prodRows[0];
                const cantidad = item.cantidad || 1;

                // B. Verificar Stock (Opcional: Si quieres permitir ventas negativas, comenta esto)
                if (productoActual.Stock < cantidad) {
                     throw new Error(`Stock insuficiente para ${productoActual.Producto}. Stock actual: ${productoActual.Stock}`);
                }

                // C. Descontar Stock
                await connection.execute(
                    'UPDATE productos SET Stock = Stock - ? WHERE ID = ?',
                    [cantidad, item.ID]
                );

                // D. Preparar filas para la tabla ventas (Una fila por unidad, según tu lógica actual)
                // Estructura: ID_Producto, Producto_Snapshot, Precio, ID_Cliente, ID_Usuario
                for (let i = 0; i < cantidad; i++) {
                    registrosVenta.push([
                        item.ID,
                        productoActual.Producto, // <--- SNAPSHOT (Nombre en este momento)
                        item.precio,             // Precio pactado
                        idCliente || null,
                        idUsuario                // Cajero responsable
                    ]);
                }
            }

            // E. Insertar Ventas Masivamente
            if (registrosVenta.length > 0) {
                const sqlInsert = `
                    INSERT INTO ventas 
                    (ID_Producto, Producto_Snapshot, Precio, ID_Cliente, ID_Usuario) 
                    VALUES ?
                `;
                await connection.query(sqlInsert, [registrosVenta]);
            }

            await connection.commit(); // CONFIRMAR CAMBIOS
            return registrosVenta.length; // Retornamos total de items vendidos

        } catch (error) {
            if (connection) await connection.rollback(); // DESHACER CAMBIOS SI HAY ERROR
            throw error;
        }
    },

    /**
     * Reporte por Rango de Fechas (Detallado)
     */
    getByDateRange: async (inicio, fin) => {
        try {
            const db = getDB();
            // Usamos Producto_Snapshot para mostrar el nombre histórico
            const sql = `
                SELECT 
                    v.ID, v.Fecha, v.Precio, 
                    v.Producto_Snapshot as Producto,
                    cl.Nombre as Cliente,
                    u.Usuario as Vendedor
                FROM ventas v
                LEFT JOIN clientes cl ON v.ID_Cliente = cl.ID
                LEFT JOIN users u ON v.ID_Usuario = u.ID
                WHERE DATE(v.Fecha) BETWEEN ? AND ?
                ORDER BY v.Fecha DESC
            `;
            const [rows] = await db.execute(sql, [inicio, fin]);
            return rows;
        } catch (error) { throw error; }
    },

    /**
     * Estadísticas (KPIs) por fecha específica
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
                WHERE DATE(Fecha) = ?
            `;
            const [rows] = await db.execute(sql, [fecha]);
            return rows[0];
        } catch (error) { throw error; }
    }
};

module.exports = VentaModel;