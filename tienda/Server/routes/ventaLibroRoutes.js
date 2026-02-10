const express = require('express');
const router = express.Router();
const { crearVenta,
        getHistorial,
        getEstadisticas,
        getDetallesVenta,
        abonarVenta,
        getAbonosVenta,
        cancelarVenta 

} = require('../controllers/ventaLibroController');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

//POST Crear un venta
router.post('/checkout', 
    verifyToken,
    requirePermission('create.sale'),  
    crearVenta);

// GET historial 
router.get('/historial', 
    verifyToken,
    requirePermission('view.book'),  
    getHistorial); 

// GET detalles
router.get('/:id/detalles', 
    verifyToken, 
    requirePermission('view.book'), 
    getDetallesVenta); 

// PUT abono
router.put('/:id/abonar', 
    verifyToken,
    requirePermission('view.book'),  
    abonarVenta); 

//Traer los abonos de un venta
router.get('/:id/abonos', 
    verifyToken,
    requirePermission('view.book'), 
    getAbonosVenta);

//cancelar una venta
router.put('/:id/cancelar', 
    verifyToken,
    requirePermission('view.book'),  
    cancelarVenta); //

//stadisticas de venta seccion Libros
router.get('/stats', 
    verifyToken,
    requirePermission('view.book'),  
    getEstadisticas);//

module.exports = router;