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
const { verifyToken } = require('../middleware/auth');

//POST Crear un venta
router.post('/checkout', verifyToken, crearVenta);

// GET historial 
router.get('/historial', verifyToken, getHistorial); 

// GET detalles
router.get('/:id/detalles', verifyToken, getDetallesVenta); 

// PUT abono
router.put('/:id/abonar', verifyToken, abonarVenta); 

//Traer los abonos de un venta
router.get('/:id/abonos', verifyToken, getAbonosVenta);

//cancelar una venta
router.put('/:id/cancelar', verifyToken, cancelarVenta); //

//stadisticas de venta seccion Libros
router.get('/stats', verifyToken, getEstadisticas);//

module.exports = router;