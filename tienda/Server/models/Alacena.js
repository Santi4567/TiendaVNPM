const { getDB } = require('../config/database');

const AlacenaModel = {
    // Listar todo el inventario
    findAll: async () => {
        try {
            const db = getDB();
            const sql = 'SELECT * FROM alacena_articulos WHERE Activo = 1 ORDER BY Fecha_Vencimiento ASC';
            const [rows] = await db.execute(sql);
            return rows;
        } catch (error) { throw error; }
    },

// Crear nuevo artículo (CON TRANSACCIÓN Y BITÁCORA)
    create: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            // 1. Insertar Artículo
            const sql = `INSERT INTO alacena_articulos (Nombre, Categoria, Unidad, Stock, Fecha_Vencimiento) VALUES (?, ?, ?, ?, ?)`;
            const [res] = await connection.execute(sql, [
                data.nombre, data.categoria, data.unidad, data.stock || 0, data.vencimiento || null
            ]);
            const newId = res.insertId;

            // 2. Si hay stock inicial, registrar en Bitácora
            if (data.stock > 0) {
                await connection.execute(
                    `INSERT INTO alacena_movimientos (ID_Articulo, Tipo, Cantidad, Motivo, ID_Usuario, Usuario_Snapshot) VALUES (?, 'ENTRADA', ?, 'Inventario Inicial (Creación)', ?, ?)`,
                    [newId, data.stock, data.idUsuario, data.usuarioNombre]
                );
            }

            await connection.commit();
            return newId;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },

    // REGISTRAR MOVIMIENTO (Entrada/Salida)
    registrarMovimiento: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            const { idArticulo, tipo, cantidad, motivo, idUsuario, usuarioNombre } = data;

            // 1. Obtener stock actual
            const [art] = await connection.execute('SELECT Stock, Nombre FROM alacena_articulos WHERE ID = ?', [idArticulo]);
            if (art.length === 0) throw new Error('Artículo no encontrado');
            
            const stockActual = art[0].Stock;

            // 2. Calcular nuevo stock
            let nuevoStock = stockActual;
            if (tipo === 'ENTRADA') {
                nuevoStock += parseInt(cantidad);
            } else if (tipo === 'SALIDA') {
                if (stockActual < cantidad) throw new Error(`Stock insuficiente de "${art[0].Nombre}"`);
                nuevoStock -= parseInt(cantidad);
            }

            // 3. Actualizar Stock Maestro
            await connection.execute('UPDATE alacena_articulos SET Stock = ? WHERE ID = ?', [nuevoStock, idArticulo]);

            // 4. Guardar en Historial (Kardex)
            await connection.execute(
                `INSERT INTO alacena_movimientos (ID_Articulo, Tipo, Cantidad, Motivo, ID_Usuario, Usuario_Snapshot) VALUES (?, ?, ?, ?, ?, ?)`,
                [idArticulo, tipo, cantidad, motivo, idUsuario, usuarioNombre]
            );

            await connection.commit();
            return true;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },
    
    // Ver historial de un producto
    getHistorial: async (idArticulo) => {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT * FROM alacena_movimientos WHERE ID_Articulo = ? ORDER BY Fecha DESC', [idArticulo]);
            return rows;
        } catch (error) { throw error; }
    },
// EDITAR ARTÍCULO (SIN TOCAR EL STOCK)
    update: async (id, data) => {
        try {
            const db = getDB();
            // CAMBIO: Quitamos "Stock=?" de aquí. El stock solo se mueve con movimientos.
            const sql = `
                UPDATE alacena_articulos 
                SET Nombre=?, Categoria=?, Unidad=?, Fecha_Vencimiento=? 
                WHERE ID=?
            `;
            const [res] = await db.execute(sql, [
                data.nombre, data.categoria, data.unidad, data.vencimiento || null, id
            ]);
            return res.affectedRows > 0;
        } catch (error) { throw error; }
    },

    // ELIMINAR (Soft Delete)
    delete: async (id) => {
        try {
            const db = getDB();
            // Solo marcamos como inactivo para no perder el historial de movimientos
            const sql = 'UPDATE alacena_articulos SET Activo = 0 WHERE ID = ?';
            const [res] = await db.execute(sql, [id]);
            return res.affectedRows > 0;
        } catch (error) { throw error; }
    },

    // SALIDA MASIVA (ARMAR DESPENSA)
    crearDespensa: async (data) => {
        let connection;
        try {
            connection = getDB();
            await connection.beginTransaction();

            const { items, motivo, idUsuario, usuarioNombre } = data; // items = [{id, cantidad, nombre}, ...]

            for (const item of items) {
                // 1. Verificar Stock Actual
                const [art] = await connection.execute('SELECT Stock, Nombre FROM alacena_articulos WHERE ID = ? FOR UPDATE', [item.id]);
                
                if (art.length === 0) throw new Error(`Artículo ID ${item.id} no encontrado`);
                const actual = art[0];

                if (actual.Stock < item.cantidad) {
                    throw new Error(`Stock insuficiente de "${actual.Nombre}". Tienes ${actual.Stock}, intentas sacar ${item.cantidad}.`);
                }

                // 2. Restar Stock
                await connection.execute('UPDATE alacena_articulos SET Stock = Stock - ? WHERE ID = ?', [item.cantidad, item.id]);

                // 3. Registrar Movimiento
                await connection.execute(
                    `INSERT INTO alacena_movimientos (ID_Articulo, Tipo, Cantidad, Motivo, ID_Usuario, Usuario_Snapshot) 
                     VALUES (?, 'SALIDA', ?, ?, ?, ?)`,
                    [item.id, item.cantidad, motivo, idUsuario, usuarioNombre]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        }
    },
    // KARDEX GLOBAL CON FILTROS
    getGlobalHistory: async (filters) => {
        try {
            const db = getDB();
            const { fechaInicio, fechaFin, tipo, busqueda } = filters;
            
            let sql = `
                SELECT 
                    m.ID, m.Fecha, m.Tipo, m.Cantidad, m.Motivo, 
                    m.Usuario_Snapshot, 
                    a.Nombre as Producto, a.Unidad
                FROM alacena_movimientos m
                JOIN alacena_articulos a ON m.ID_Articulo = a.ID
                WHERE 1=1
            `;
            
            const params = [];

            // Filtro por Fechas (Si vienen)
            if (fechaInicio && fechaFin) {
                sql += ' AND m.Fecha BETWEEN ? AND ?';
                // Agregamos horas para cubrir todo el día final
                params.push(`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`);
            }

            // Filtro por Tipo (ENTRADA/SALIDA)
            if (tipo && tipo !== 'TODOS') {
                sql += ' AND m.Tipo = ?';
                params.push(tipo);
            }

            // Filtro Buscador (Busca en Producto o en Motivo/Beneficiario)
            if (busqueda) {
                sql += ' AND (m.Motivo LIKE ? OR a.Nombre LIKE ?)';
                params.push(`%${busqueda}%`, `%${busqueda}%`);
            }

            sql += ' ORDER BY m.Fecha DESC LIMIT 500'; // Límite de seguridad

            const [rows] = await db.execute(sql, params);
            return rows;
        } catch (error) { throw error; }
    }
};

module.exports = AlacenaModel;