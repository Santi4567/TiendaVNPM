const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// Endpoint para agregar a cuenta
router.post('/agregar', async (req, res) => {
  try {
    const { productos, clienteId } = req.body;
    
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar' });
    }

    if (!clienteId) {
      return res.status(400).json({ error: 'Debe seleccionar un cliente' });
    }

    const db = getDB();

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
router.get('/todas', async (req, res) => {
  try {
    const db = getDB();
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

// Endpoint para obtener cuentas de un cliente específico
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const db = getDB();
    
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
router.post('/saldar', async (req, res) => {
  try {
    const { clienteId } = req.body;
    
    if (!clienteId) {
      return res.status(400).json({ error: 'ID de cliente requerido' });
    }

    const db = getDB();

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

module.exports = router;