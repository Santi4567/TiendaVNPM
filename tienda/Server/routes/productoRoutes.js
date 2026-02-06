const express = require('express');
const router = express.Router();
const { 
    getProductos, 
    searchProductos, 
    createProducto, 
    updateProducto, 
    deleteProducto,
    getAlertasCaducidad,
    getAlertasStock,
    actualizarStockRapido,
    actualizarCaducidadRapida
} = require('../controllers/productoController');

const { validateProducto } = require('../validators/productoValidator');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

// 1. VER (view.product)
router.get('/todos', verifyToken, requirePermission('view.product'), getProductos);
router.get('/buscar', verifyToken, requirePermission('view.product'), searchProductos);

// 2. AGREGAR (add.product)
router.post('/agregar', 
    verifyToken, 
    requirePermission('add.product'), 
    validateProducto, 
    createProducto
);

// 3. EDITAR (update.product)
router.put('/editar/:id', 
    verifyToken, 
    requirePermission('update.product'), 
    validateProducto, 
    updateProducto
);

// 4. ELIMINAR (delete.product)
router.delete('/eliminar/:id', 
    verifyToken, 
    requirePermission('delete.product'), 
    deleteProducto
);


// ALERTAS (Dashboard)
router.get('/alertas/stock', 
    verifyToken, 
    requirePermission('view.alerts'), 
    getAlertasStock
);

router.get('/alertas/caducidad', 
    verifyToken, 
    requirePermission('view.alerts'), 
    getAlertasCaducidad
);

router.patch('/:id/stock', 
    verifyToken, 
    requirePermission('update.product'),
    actualizarStockRapido);

router.patch('/:id/caducidad', 
    verifyToken,
    requirePermission('update.product'), 
    actualizarCaducidadRapida);

module.exports = router;