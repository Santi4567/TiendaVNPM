const { getDB } = require('../config/database');

const VentaLibroModel = {
    //1.Crear un venta
    create: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // Desestructuramos el estado que viene del controlador
            const { items, idUsuario, usuarioNombre, idCliente, clienteNombre, total, pagado, estado } = data;

            // 1. INSERTAR CABECERA
            // OJO AQUÍ: Agregamos 'Estado' en las columnas y el '?' correspondiente
            const sqlCabecera = `
                INSERT INTO ventas_libreria 
                (ID_Usuario, Usuario_Snapshot, ID_Cliente, Cliente_Snapshot, Total_Venta, Monto_Pagado, Estado)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [resCabecera] = await connection.execute(sqlCabecera, [
                idUsuario, 
                usuarioNombre, 
                idCliente, 
                clienteNombre, 
                total, 
                pagado, 
                estado // <--- AQUÍ ESTABA EL PROBLEMA, si esto faltaba, la BD ponía PAGADO por defecto
            ]);
            
            const ventaId = resCabecera.insertId;

            // 2. PROCESAR ITEMS
            for (const item of items) {
                // A. Verificar Stock y Datos Originales (Seguridad)
                const [libroRows] = await connection.execute(
                    'SELECT Stock, Titulo, Autor, Precio, Descuento FROM libros WHERE ID = ?', 
                    [item.ID]
                );
                
                if (libroRows.length === 0) throw new Error(`Libro ID ${item.ID} no encontrado`);
                const libroDB = libroRows[0];
                
                if (libroDB.Stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para "${libroDB.Titulo}". Disponibles: ${libroDB.Stock}`);
                }

                // B. Descontar Stock Global
                await connection.execute('UPDATE libros SET Stock = Stock - ? WHERE ID = ?', [item.cantidad, item.ID]);

                // C. CALCULAR PRECIO FINAL UNITARIO
                // Usamos los datos de la BD, no los del frontend, para evitar hackeos de precio
                const precioBase = parseFloat(libroDB.Precio);
                const descuento = parseInt(libroDB.Descuento || 0);
                const precioFinal = precioBase - (precioBase * (descuento / 100));

                // D. INSERTAR CADA EJEMPLAR INDIVIDUALMENTE
                for (let i = 0; i < item.cantidad; i++) {
                    await connection.execute(`
                        INSERT INTO detalle_ventas_libreria
                        (ID_Venta, ID_Libro, Titulo_Snapshot, Autor_Snapshot, Precio_Unitario, Descuento_Aplicado, Precio_Final)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            ventaId, 
                            item.ID, 
                            libroDB.Titulo, 
                            libroDB.Autor,
                            precioBase,
                            descuento,
                            precioFinal
                        ]
                    );
                }
            }

            await connection.commit();
            return ventaId;

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },
   // 2. HISTORIAL CON FILTROS AVANZADOS
    findAll: async (filtros = {}) => {
        try {
            const db = getDB();
            const { inicio, fin, estado, busqueda } = filtros;

            let sql = `
                SELECT * FROM ventas_libreria 
                WHERE 1=1
            `;
            const params = [];

            // Filtro Fechas
            if (inicio && fin) {
                sql += ' AND DATE(Fecha) BETWEEN ? AND ?';
                params.push(inicio, fin);
            }

            // Filtro Estado
            if (estado && estado !== 'TODOS') {
                sql += ' AND Estado = ?';
                params.push(estado);
            }

            // Filtro Búsqueda
            if (busqueda) {
                sql += ' AND (Cliente_Snapshot LIKE ? OR Usuario_Snapshot LIKE ? OR ID = ?)';
                params.push(`%${busqueda}%`, `%${busqueda}%`, busqueda);
            }

            sql += ' ORDER BY Fecha DESC LIMIT 500';

            const [rows] = await db.execute(sql, params);
            return rows;
        } catch (error) { throw error; }
    },

    // 3. ESTADÍSTICAS Y GRÁFICAS (KPIs)
    getStats: async (inicio, fin) => {
        try {
            const db = getDB();
            let params = [];
            let whereClause = "WHERE v.Estado != 'CANCELADO'"; // Ignoramos canceladas

            if (inicio && fin) {
                whereClause += ' AND DATE(v.Fecha) BETWEEN ? AND ?';
                params.push(inicio, fin);
            }

            // A. KPI FINANCIEROS
            // IngresoReal = Suma de todo lo que han pagado (sea de ventas liquidadas o abonos de pendientes)
            // Deuda = Lo que falta por pagar solo de las pendientes
            const sqlKpi = `
                SELECT 
                    COALESCE(SUM(v.Monto_Pagado), 0) as IngresoReal,
                    COALESCE(SUM(CASE WHEN v.Estado = 'PENDIENTE' THEN (v.Total_Venta - v.Monto_Pagado) ELSE 0 END), 0) as DeudaPendiente,
                    COUNT(DISTINCT v.ID) as TotalTickets
                FROM ventas_libreria v
                ${whereClause}
            `;
            const [rowsKpi] = await db.execute(sqlKpi, params);

            // B. TOP 5 LIBROS MÁS VENDIDOS
            // Como guardas 1 fila por cada libro unitario en 'detalle_ventas_libreria', hacemos un COUNT
            const sqlTop = `
                SELECT 
                    d.Titulo_Snapshot as Titulo, 
                    COUNT(d.ID) as Vendidos
                FROM detalle_ventas_libreria d
                JOIN ventas_libreria v ON d.ID_Venta = v.ID
                ${whereClause}
                GROUP BY d.Titulo_Snapshot
                ORDER BY Vendidos DESC
                LIMIT 5
            `;
            // Necesitamos duplicar params porque es una nueva consulta con los mismos filtros
            const [rowsTop] = await db.execute(sqlTop, params);

            // C. TOTAL LIBROS VENDIDOS
            const sqlCount = `
                SELECT COUNT(d.ID) as TotalLibros
                FROM detalle_ventas_libreria d
                JOIN ventas_libreria v ON d.ID_Venta = v.ID
                ${whereClause}
            `;
            const [rowsCount] = await db.execute(sqlCount, params);

            return {
                financiero: rowsKpi[0],
                topLibros: rowsTop,
                totalLibros: rowsCount[0].TotalLibros || 0
            };

        } catch (error) { throw error; }
    },

    // Obtener Detalle de una Venta (Libros comprados)
    getDetalle: async (idVenta) => {
        try {
            const db = getDB();
            const sql = 'SELECT * FROM detalle_ventas_libreria WHERE ID_Venta = ?';
            const [rows] = await db.execute(sql, [idVenta]);
            return rows;
        } catch (error) { throw error; }
    },

    // Obtener historial de abonos de una venta
    getAbonos: async (idVenta) => {
        try {
            const db = getDB();
            const sql = 'SELECT * FROM abonos_libreria WHERE ID_Venta = ? ORDER BY Fecha DESC';
            const [rows] = await db.execute(sql, [idVenta]);
            return rows;
        } catch (error) { throw error; }
    },

    // Agregar Abono con Validación y Registro Histórico
    addAbono: async (idVenta, monto, idUsuario, usuarioNombre) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // 1. VALIDACIÓN ESTRICTA: Obtener datos actuales de la venta
            const [ventaRows] = await connection.execute(
                'SELECT Total_Venta, Monto_Pagado, Estado FROM ventas_libreria WHERE ID = ? FOR UPDATE', 
                [idVenta]
            );

            if (ventaRows.length === 0) throw new Error('Venta no encontrada');
            const venta = ventaRows[0];

            if (venta.Estado === 'PAGADO') throw new Error('Esta venta ya está liquidada');

            // Calculamos cuánto falta
            const restante = parseFloat(venta.Total_Venta) - parseFloat(venta.Monto_Pagado);
            
            // Validamos que el abono no supere el restante (con margen de error 0.01)
            if (parseFloat(monto) > (restante + 0.01)) {
                throw new Error(`El abono ($${monto}) excede la deuda restante ($${restante.toFixed(2)})`);
            }

            // 2. REGISTRAR EN TABLA HISTÓRICA DE ABONOS
            await connection.execute(`
                INSERT INTO abonos_libreria (ID_Venta, Monto, ID_Usuario, Usuario_Snapshot)
                VALUES (?, ?, ?, ?)`,
                [idVenta, monto, idUsuario, usuarioNombre]
            );

            // 3. ACTUALIZAR VENTA PRINCIPAL
            const nuevoPagado = parseFloat(venta.Monto_Pagado) + parseFloat(monto);
            let nuevoEstado = 'PENDIENTE';
            
            // Si ya cubrió el total, cambiamos a PAGADO
            if (nuevoPagado >= (parseFloat(venta.Total_Venta) - 0.01)) {
                nuevoEstado = 'PAGADO';
            }

            await connection.execute(
                'UPDATE ventas_libreria SET Monto_Pagado = ?, Estado = ? WHERE ID = ?',
                [nuevoPagado, nuevoEstado, idVenta]
            );

            await connection.commit();
            return { liquidado: nuevoEstado === 'PAGADO', nuevoSaldo: nuevoPagado };

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },
    // CANCELAR VENTA Y RESTAURAR STOCK
    cancel: async (idVenta, idUsuario, usuarioNombre) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // 1. Verificar estado actual
            const [rows] = await connection.execute('SELECT Estado FROM ventas_libreria WHERE ID = ? FOR UPDATE', [idVenta]);
            if (rows.length === 0) throw new Error('Venta no encontrada');
            if (rows[0].Estado === 'CANCELADO') throw new Error('La venta ya está cancelada');

            // 2. Obtener los libros vendidos para devolver stock
            const [detalles] = await connection.execute('SELECT ID_Libro FROM detalle_ventas_libreria WHERE ID_Venta = ?', [idVenta]);

            // 3. Restaurar Stock (1 por 1 ya que el detalle está desglosado)
            for (const item of detalles) {
                await connection.execute('UPDATE libros SET Stock = Stock + 1 WHERE ID = ?', [item.ID_Libro]);
            }

            // 4. Marcar venta como Cancelada
            // Opcional: Podrías guardar quién canceló en una nota o log, aquí solo cambiamos estado
            await connection.execute("UPDATE ventas_libreria SET Estado = 'CANCELADO' WHERE ID = ?", [idVenta]);

            await connection.commit();
            return true;

        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    }
};

module.exports = VentaLibroModel;