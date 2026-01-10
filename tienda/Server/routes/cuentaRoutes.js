const express = require('express');
const router = express.Router();
const { 
    getCuentas, getCuentasCliente, addCuenta, settleCuenta 
} = require('../controllers/cuentaController');
const { validateAgregarCuenta, validateSaldarCuenta } = require('../validators/cuentaValidator');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

// 1. VER LISTADOS (view.debt)
// Ver todo el reporte de deudores
router.get('/todas', verifyToken, requirePermission('view.debt'), getCuentas);
// Ver detalle de un cliente específico
router.get('/cliente/:clienteId', verifyToken, requirePermission('view.debt'), getCuentasCliente);

// 2. FIAR / AGREGAR (add.debt)
router.post('/agregar', 
    verifyToken, 
    requirePermission('add.debt'), 
    validateAgregarCuenta, 
    addCuenta
);

// 3. COBRAR / SALDAR (settle.debt)
router.post('/saldar', 
    verifyToken, 
    requirePermission('settle.debt'), 
    validateSaldarCuenta, 
    settleCuenta
);

module.exports = router;