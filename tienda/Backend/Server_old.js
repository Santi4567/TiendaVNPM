const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root', // Cambia por tu usuario
  password: '', // Cambia por tu contraseña
  database: 'tienda'
};

// Crear conexión a la base de datos
let db;
async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado a MySQL');
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
}

// Endpoint para buscar productos
app.get('/api/productos/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const query = `
      SELECT ID, Producto, Precio_Publico, Unidades, Codigo 
      FROM productos 
      WHERE Producto LIKE ? OR Codigo LIKE ? 
      ORDER BY Producto ASC 
      LIMIT 5
    `;
    
    const searchTerm = `%${q}%`;
    const [rows] = await db.execute(query, [searchTerm, searchTerm]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para finalizar venta
app.post('/api/venta/finalizar', async (req, res) => {
  try {
    const { productos } = req.body;
    
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar' });
    }

    // Preparar los registros para insertar
    const registros = [];
    productos.forEach(producto => {
      for (let i = 0; i < producto.cantidad; i++) {
        registros.push([producto.ID, producto.precio]);
      }
    });

    // Insertar todos los registros
    const query = 'INSERT INTO ventas (ID_Producto, Precio) VALUES ?';
    const [result] = await db.query(query, [registros]);
    
    res.json({ 
      success: true, 
      mensaje: 'Venta registrada correctamente',
      registros_insertados: result.affectedRows 
    });

  } catch (error) {
    console.error('Error finalizando venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para buscar clientes
app.get('/api/clientes/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const query = `
      SELECT ID, Nombre 
      FROM clientes 
      WHERE Nombre LIKE ? 
      ORDER BY Nombre ASC 
      LIMIT 5
    `;
    
    const searchTerm = `%${q}%`;
    const [rows] = await db.execute(query, [searchTerm]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error buscando clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para agregar a cuenta
app.post('/api/cuenta/agregar', async (req, res) => {
  try {
    const { productos, clienteId } = req.body;
    
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar' });
    }

    if (!clienteId) {
      return res.status(400).json({ error: 'Debe seleccionar un cliente' });
    }

    // Preparar los registros para insertar
    const registros = [];
    productos.forEach(producto => {
      for (let i = 0; i < producto.cantidad; i++) {
        registros.push([clienteId, producto.ID, producto.precio, 0]); // Estado = 0 (false)
      }
    });

    // Insertar todos los registros
    const query = 'INSERT INTO cuentas (ID_Cliente, ID_Producto, Precio, Estado) VALUES ?';
    const [result] = await db.query(query, [registros]);
    
    res.json({ 
      success: true, 
      mensaje: 'Productos agregados a cuenta correctamente',
      registros_insertados: result.affectedRows 
    });

  } catch (error) {
    console.error('Error agregando a cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener todas las cuentas con nombres
app.get('/api/cuentas/todas', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.ID,
        c.ID_Cliente,
        c.ID_Producto,
        c.Precio,
        c.Fecha,
        c.Estado,
        cl.Nombre as NombreCliente,
        p.Producto as NombreProducto
      FROM cuentas c
      INNER JOIN clientes cl ON c.ID_Cliente = cl.ID
      INNER JOIN productos p ON c.ID_Producto = p.ID
      ORDER BY c.Fecha DESC, c.ID DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo todas las cuentas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//----------------------------------------------------------------------------------------------------

// Endpoint para obtener cuentas de un cliente específico
app.get('/api/cuentas/cliente/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const query = `
      SELECT 
        c.ID,
        c.ID_Cliente,
        c.ID_Producto,
        c.Precio,
        c.Fecha,
        c.Estado,
        cl.Nombre as NombreCliente,
        p.Producto as NombreProducto
      FROM cuentas c
      INNER JOIN clientes cl ON c.ID_Cliente = cl.ID
      INNER JOIN productos p ON c.ID_Producto = p.ID
      WHERE c.ID_Cliente = ?
      ORDER BY c.Fecha DESC, c.ID DESC
    `;
    
    const [rows] = await db.execute(query, [clienteId]);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo cuentas del cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para saldar deuda de cliente
app.post('/api/cuenta/saldar', async (req, res) => {
  try {
    const { clienteId } = req.body;
    
    if (!clienteId) {
      return res.status(400).json({ error: 'ID de cliente requerido' });
    }

    // Obtener todas las cuentas del cliente
    const selectQuery = `
      SELECT ID_Producto, Precio 
      FROM cuentas 
      WHERE ID_Cliente = ?
    `;
    const [cuentasCliente] = await db.execute(selectQuery, [clienteId]);

    if (cuentasCliente.length === 0) {
      return res.status(400).json({ error: 'No hay cuentas pendientes para este cliente' });
    }

    // Preparar registros para insertar en ventas
    const registrosVenta = cuentasCliente.map(cuenta => [
      cuenta.ID_Producto, 
      cuenta.Precio, 
      clienteId
    ]);

    // Insertar en tabla ventas
    const insertVentaQuery = 'INSERT INTO ventas (ID_Producto, Precio, ID_Cliente) VALUES ?';
    const [resultVenta] = await db.query(insertVentaQuery, [registrosVenta]);

    // Eliminar todas las cuentas del cliente
    const deleteQuery = 'DELETE FROM cuentas WHERE ID_Cliente = ?';
    const [resultDelete] = await db.execute(deleteQuery, [clienteId]);

    res.json({ 
      success: true, 
      mensaje: 'Deuda saldada correctamente',
      registros_venta: resultVenta.affectedRows,
      registros_eliminados: resultDelete.affectedRows
    });

  } catch (error) {
    console.error('Error saldando deuda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Endpoint para obtener todos los clientes
app.get('/api/clientes/todos', async (req, res) => {
  try {
    const query = 'SELECT ID, Nombre FROM clientes ORDER BY Nombre ASC';
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo todos los clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para agregar cliente
app.post('/api/clientes/agregar', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    // Verificar si el cliente ya existe
    const checkQuery = 'SELECT ID FROM clientes WHERE Nombre = ?';
    const [existing] = await db.execute(checkQuery, [nombre.trim()]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese nombre' });
    }

    const query = 'INSERT INTO clientes (Nombre) VALUES (?)';
    const [result] = await db.execute(query, [nombre.trim()]);
    
    res.json({ 
      success: true, 
      mensaje: 'Cliente agregado correctamente',
      clienteId: result.insertId 
    });

  } catch (error) {
    console.error('Error agregando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para editar cliente
app.put('/api/clientes/editar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    // Verificar si el cliente existe
    const checkQuery = 'SELECT ID FROM clientes WHERE ID = ?';
    const [existing] = await db.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar si ya existe otro cliente con el mismo nombre
    const duplicateQuery = 'SELECT ID FROM clientes WHERE Nombre = ? AND ID != ?';
    const [duplicate] = await db.execute(duplicateQuery, [nombre.trim(), id]);
    
    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro cliente con ese nombre' });
    }

    const query = 'UPDATE clientes SET Nombre = ? WHERE ID = ?';
    const [result] = await db.execute(query, [nombre.trim(), id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ 
      success: true, 
      mensaje: 'Cliente actualizado correctamente'
    });

  } catch (error) {
    console.error('Error editando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar cliente
app.delete('/api/clientes/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el cliente tiene cuentas pendientes
    const cuentasQuery = 'SELECT COUNT(*) as total FROM cuentas WHERE ID_Cliente = ?';
    const [cuentas] = await db.execute(cuentasQuery, [id]);
    
    if (cuentas[0].total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene cuentas pendientes' 
      });
    }

    const query = 'DELETE FROM clientes WHERE ID = ?';
    const [result] = await db.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ 
      success: true, 
      mensaje: 'Cliente eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//--------------------------------------------------------------------------------------------------

// Endpoint para obtener todos los productos ---------------------------------------------------------
app.get('/api/productos/todos', async (req, res) => {
  try {
    const query = `
      SELECT ID, Producto, Precio_Proveedor, Unidades, Precio_Unidad, 
             Precio_Publico, Fecha, Codigo 
      FROM productos 
      ORDER BY Producto ASC
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo todos los productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para agregar producto
app.post('/api/productos/agregar', async (req, res) => {
  try {
    const { 
      producto, 
      precio_proveedor, 
      unidades, 
      precio_unidad, 
      precio_publico, 
      codigo 
    } = req.body;
    
    if (!producto || !producto.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }

    if (!precio_publico || precio_publico <= 0) {
      return res.status(400).json({ error: 'El precio público es requerido y debe ser mayor a 0' });
    }

    // Verificar si ya existe un producto con el mismo nombre
    const checkQuery = 'SELECT ID FROM productos WHERE Producto = ?';
    const [existing] = await db.execute(checkQuery, [producto.trim()]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
    }

    // Verificar si ya existe un producto con el mismo código (si se proporciona)
    if (codigo && codigo.trim()) {
      const checkCodigoQuery = 'SELECT ID FROM productos WHERE Codigo = ?';
      const [existingCodigo] = await db.execute(checkCodigoQuery, [codigo.trim()]);
      
      if (existingCodigo.length > 0) {
        return res.status(400).json({ error: 'Ya existe un producto con ese código' });
      }
    }

    const query = `
      INSERT INTO productos 
      (Producto, Precio_Proveedor, Unidades, Precio_Unidad, Precio_Publico, Codigo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      producto.trim(),
      precio_proveedor || null,
      unidades || null,
      precio_unidad || null,
      parseFloat(precio_publico),
      codigo && codigo.trim() ? codigo.trim() : null
    ]);
    
    res.json({ 
      success: true, 
      mensaje: 'Producto agregado correctamente',
      productoId: result.insertId 
    });

  } catch (error) {
    console.error('Error agregando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para editar producto
app.put('/api/productos/editar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      producto, 
      precio_proveedor, 
      unidades, 
      precio_unidad, 
      precio_publico, 
      codigo 
    } = req.body;
    
    if (!producto || !producto.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }

    if (!precio_publico || precio_publico <= 0) {
      return res.status(400).json({ error: 'El precio público es requerido y debe ser mayor a 0' });
    }

    // Verificar si el producto existe
    const checkQuery = 'SELECT ID FROM productos WHERE ID = ?';
    const [existing] = await db.execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe otro producto con el mismo nombre
    const duplicateQuery = 'SELECT ID FROM productos WHERE Producto = ? AND ID != ?';
    const [duplicate] = await db.execute(duplicateQuery, [producto.trim(), id]);
    
    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'Ya existe otro producto con ese nombre' });
    }

    // Verificar si ya existe otro producto con el mismo código (si se proporciona)
    if (codigo && codigo.trim()) {
      const duplicateCodigoQuery = 'SELECT ID FROM productos WHERE Codigo = ? AND ID != ?';
      const [duplicateCodigo] = await db.execute(duplicateCodigoQuery, [codigo.trim(), id]);
      
      if (duplicateCodigo.length > 0) {
        return res.status(400).json({ error: 'Ya existe otro producto con ese código' });
      }
    }

    const query = `
      UPDATE productos 
      SET Producto = ?, Precio_Proveedor = ?, Unidades = ?, 
          Precio_Unidad = ?, Precio_Publico = ?, Codigo = ?
      WHERE ID = ?
    `;
    
    const [result] = await db.execute(query, [
      producto.trim(),
      precio_proveedor || null,
      unidades || null,
      precio_unidad || null,
      parseFloat(precio_publico),
      codigo && codigo.trim() ? codigo.trim() : null,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ 
      success: true, 
      mensaje: 'Producto actualizado correctamente'
    });

  } catch (error) {
    console.error('Error editando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para eliminar producto
app.delete('/api/productos/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el producto tiene ventas asociadas
    const ventasQuery = 'SELECT COUNT(*) as total FROM ventas WHERE ID_Producto = ?';
    const [ventas] = await db.execute(ventasQuery, [id]);
    
    if (ventas[0].total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el producto porque tiene ventas registradas' 
      });
    }

    // Verificar si el producto tiene cuentas asociadas
    const cuentasQuery = 'SELECT COUNT(*) as total FROM cuentas WHERE ID_Producto = ?';
    const [cuentas] = await db.execute(cuentasQuery, [id]);
    
    if (cuentas[0].total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el producto porque está en cuentas pendientes' 
      });
    }

    const query = 'DELETE FROM productos WHERE ID = ?';
    const [result] = await db.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ 
      success: true, 
      mensaje: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//--------------------------------------------------------------------

// Endpoint para obtener ventas por fecha----------------------------------------------------
app.get('/api/ventas/fecha/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    const query = `
      SELECT 
        v.ID,
        v.ID_Producto,
        v.Precio,
        v.ID_Cliente,
        v.Fecha,
        p.Producto as NombreProducto,
        p.Codigo as CodigoProducto,
        cl.Nombre as NombreCliente
      FROM ventas v
      INNER JOIN productos p ON v.ID_Producto = p.ID
      LEFT JOIN clientes cl ON v.ID_Cliente = cl.ID
      WHERE DATE(v.Fecha) = ?
      ORDER BY v.Fecha DESC, v.ID DESC
    `;
    
    const [rows] = await db.execute(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo ventas por fecha:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener ventas del día actual
app.get('/api/ventas/hoy', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.ID,
        v.ID_Producto,
        v.Precio,
        v.ID_Cliente,
        v.Fecha,
        p.Producto as NombreProducto,
        p.Codigo as CodigoProducto,
        cl.Nombre as NombreCliente
      FROM ventas v
      INNER JOIN productos p ON v.ID_Producto = p.ID
      LEFT JOIN clientes cl ON v.ID_Cliente = cl.ID
      WHERE DATE(v.Fecha) = CURDATE()
      ORDER BY v.Fecha DESC, v.ID DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo ventas de hoy:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener total de ventas por fecha (optimizado en backend)
app.get('/api/ventas/total/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    const query = `
      SELECT 
        COUNT(*) as totalRegistros,
        SUM(Precio) as totalVentas,
        COUNT(DISTINCT ID_Producto) as productosVendidos,
        COUNT(DISTINCT ID_Cliente) as clientesAtendidos
      FROM ventas 
      WHERE DATE(Fecha) = ?
    `;
    
    const [rows] = await db.execute(query, [fecha]);
    const resultado = rows[0];
    
    res.json({
      fecha: fecha,
      totalRegistros: parseInt(resultado.totalRegistros) || 0,
      totalVentas: parseFloat(resultado.totalVentas) || 0,
      productosVendidos: parseInt(resultado.productosVendidos) || 0,
      clientesAtendidos: parseInt(resultado.clientesAtendidos) || 0
    });
  } catch (error) {
    console.error('Error obteniendo total de ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener total de ventas del día actual
app.get('/api/ventas/total/hoy', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as totalRegistros,
        SUM(Precio) as totalVentas,
        COUNT(DISTINCT ID_Producto) as productosVendidos,
        COUNT(DISTINCT ID_Cliente) as clientesAtendidos,
        CURDATE() as fecha
      FROM ventas 
      WHERE DATE(Fecha) = CURDATE()
    `;
    
    const [rows] = await db.execute(query);
    const resultado = rows[0];
    
    res.json({
      fecha: resultado.fecha,
      totalRegistros: parseInt(resultado.totalRegistros) || 0,
      totalVentas: parseFloat(resultado.totalVentas) || 0,
      productosVendidos: parseInt(resultado.productosVendidos) || 0,
      clientesAtendidos: parseInt(resultado.clientesAtendidos) || 0
    });
  } catch (error) {
    console.error('Error obteniendo total de ventas de hoy:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para obtener resumen de ventas por rango de fechas
app.get('/api/ventas/resumen/:fechaInicio/:fechaFin', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.params;
    
    const query = `
      SELECT 
        DATE(Fecha) as fecha,
        COUNT(*) as totalRegistros,
        SUM(Precio) as totalVentas,
        COUNT(DISTINCT ID_Producto) as productosVendidos,
        COUNT(DISTINCT ID_Cliente) as clientesAtendidos
      FROM ventas 
      WHERE DATE(Fecha) BETWEEN ? AND ?
      GROUP BY DATE(Fecha)
      ORDER BY fecha DESC
    `;
    
    const [rows] = await db.execute(query, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo resumen de ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;