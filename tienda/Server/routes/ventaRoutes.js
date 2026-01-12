const express = require('express');
const router = express.Router();
const { 
    crearVenta, getReporteHoy, getReporteFecha, getTotalesHoy, getTotalesFecha
} = require('../controllers/ventaController');

const { validateVenta, validateFecha } = require('../validators/ventaValidator');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

// 1. REGISTRAR VENTA (Cajeros)
router.post('/finalizar', 
    verifyToken, 
    requirePermission('create.sale'), 
    validateVenta, 
    crearVenta
);

// 2. REPORTES (Administradores / Gerentes)
// Reporte detallado de Hoy
router.get('/hoy', 
    verifyToken, 
    requirePermission('view.report'), 
    getReporteHoy
);

// Reporte detallado de fecha específica
router.get('/fecha/:fecha', 
    verifyToken, 
    requirePermission('view.report'), 
    validateFecha, // Valida que la fecha tenga formato correcto
    getReporteFecha
);

// KPIs (Totales) de Hoy
router.get('/total/hoy', 
    verifyToken, 
    requirePermission('view.report'), 
    getTotalesHoy
);

// KPIs (Totales) de fecha específica
router.get('/total/:fecha', 
    verifyToken, 
    requirePermission('view.report'), 
    validateFecha,
    getTotalesFecha
);

module.exports = router;