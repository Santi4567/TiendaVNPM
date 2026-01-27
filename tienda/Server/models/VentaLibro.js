const { getDB } = require('../config/database');

const VentaLibroModel = {
    create: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            const { items, idUsuario, usuarioNombre, idCliente, clienteNombre, total, pagado } = data;

            // 1. INSERTAR CABECERA
            const [resCabecera] = await connection.execute(`
                INSERT INTO ventas_libreria 
                (ID_Usuario, Usuario_Snapshot, ID_Cliente, Cliente_Snapshot, Total_Venta, Monto_Pagado)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [idUsuario, usuarioNombre, idCliente, clienteNombre, total, pagado]
            );
            
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
    // Listar Ventas con Filtros
    findAll: async (filtros = {}) => {
        try {
            const db = getDB();
            let sql = `
                SELECT * FROM ventas_libreria 
                ORDER BY Fecha DESC
                LIMIT 100
            `;
            // Aquí puedes agregar WHERE dinámicos si necesitas filtrar por fecha o cliente
            const [rows] = await db.execute(sql);
            return rows;
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

    // Agregar Abono
    addAbono: async (idVenta, monto) => {
        try {
            const db = getDB();
            // 1. Actualizar Monto Pagado
            await db.execute(
                'UPDATE ventas_libreria SET Monto_Pagado = Monto_Pagado + ? WHERE ID = ?', 
                [monto, idVenta]
            );
            
            // 2. Verificar si ya se liquidó para cambiar estado
            // (Hacemos un SELECT para ver el nuevo saldo)
            const [rows] = await db.execute('SELECT Total_Venta, Monto_Pagado FROM ventas_libreria WHERE ID = ?', [idVenta]);
            const venta = rows[0];
            
            if (venta.Monto_Pagado >= (venta.Total_Venta - 0.01)) {
                await db.execute("UPDATE ventas_libreria SET Estado = 'PAGADO' WHERE ID = ?", [idVenta]);
                return { liquidado: true };
            }
            return { liquidado: false };

        } catch (error) { throw error; }
    }
};

module.exports = VentaLibroModel;