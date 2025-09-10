const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// Endpoint para buscar productos
router.get('/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const db = getDB();
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

// Endpoint para obtener todos los productos
router.get('/todos', async (req, res) => {
  try {
    const db = getDB();
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
router.post('/agregar', async (req, res) => {
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

    const db = getDB();

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
router.put('/editar/:id', async (req, res) => {
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

    const db = getDB();

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
router.delete('/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
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

module.exports = router;