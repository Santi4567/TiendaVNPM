const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// Endpoint para buscar clientes
router.get('/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json([]);
    }

    const db = getDB();
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

// Endpoint para obtener todos los clientes
router.get('/todos', async (req, res) => {
  try {
    const db = getDB();
    const query = 'SELECT ID, Nombre FROM clientes ORDER BY Nombre ASC';
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo todos los clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para agregar cliente
router.post('/agregar', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    const db = getDB();

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
router.put('/editar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    const db = getDB();

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
router.delete('/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
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

module.exports = router;