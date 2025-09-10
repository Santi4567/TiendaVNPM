const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// Endpoint para finalizar venta
router.post('/finalizar', async (req, res) => {
  try {
    const { productos } = req.body;
    
    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar' });
    }

    const db = getDB();

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

// Endpoint para obtener ventas por fecha
router.get('/fecha/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    const db = getDB();
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
router.get('/hoy', async (req, res) => {
  try {
    const db = getDB();
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
router.get('/total/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    const db = getDB();
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
router.get('/total/hoy', async (req, res) => {
  try {
    const db = getDB();
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
router.get('/resumen/:fechaInicio/:fechaFin', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.params;
    const db = getDB();
    
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

module.exports = router;