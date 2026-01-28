const express = require('express');
const router = express.Router();
const { crearVenta,
        getHistorial,
        getDetallesVenta,
        abonarVenta,
        getAbonosVenta,
        cancelarVenta 

} = require('../controllers/ventaLibroController');
const { verifyToken } = require('../middleware/auth');

router.post('/checkout', verifyToken, crearVenta);

//abonos 
router.get('/historial', verifyToken, getHistorial); // GET historial

router.get('/:id/detalles', verifyToken, getDetallesVenta); // GET detalles

router.put('/:id/abonar', verifyToken, abonarVenta); // PUT abono

//Traer los abonos de un venta
router.get('/:id/abonos', verifyToken, getAbonosVenta);

//cancelar una venta
router.put('/:id/cancelar', verifyToken, cancelarVenta); // <--- Nueva ruta

module.exports = router;