const express = require('express');
const router = express.Router();
const { 
    getClients, searchClients, createClient, updateClient, deleteClient 
} = require('../controllers/clienteController');
const { validateCliente } = require('../validators/clienteValidator');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

// 1. VER CLIENTES (view.client)
router.get('/todos', verifyToken, requirePermission('view.client'), getClients);
router.get('/buscar', verifyToken, requirePermission('view.client'), searchClients);

// 2. AGREGAR CLIENTES (add.client)
router.post('/agregar', 
    verifyToken, 
    requirePermission('add.client'), 
    validateCliente, 
    createClient
);

// 3. EDITAR CLIENTES (update.client)
router.put('/editar/:id', 
    verifyToken, 
    requirePermission('update.client'), 
    validateCliente, 
    updateClient
);

// 4. ELIMINAR CLIENTES (delete.client)
router.delete('/eliminar/:id', 
    verifyToken, 
    requirePermission('delete.client'), 
    deleteClient
);

module.exports = router;