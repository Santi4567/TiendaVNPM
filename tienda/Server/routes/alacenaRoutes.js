const express = require('express');
const router = express.Router();
const {
    getInventario,
    crearArticulo,
    moverInventario,
    getKardex,
    editarArticulo,
    eliminarArticulo,
    procesarDespensa,
    getHistorialGlobal
} = require('../controllers/alacenaController');
const { verifyToken, requirePermission } = require('../middleware/auth'); 

//Traer toda la informacion
router.get('/', 
    verifyToken,
    requirePermission('view.cupboard'), 
    getInventario
);

// Insertar un nuevo articulo
router.post('/articulo', 
    verifyToken, 
    requirePermission('view.cupboard'), 
    crearArticulo);

//Entradas y salidas del almacen
router.post('/movimiento', 
    verifyToken,
    requirePermission('view.cupboard'), 
     moverInventario); 

//Historial de entradas y salidad
router.get('/:id/historial', 
    verifyToken, 
    requirePermission('view.cupboard'), 
    getKardex);

// Editar un producto
router.put('/articulo/:id', 
    verifyToken, 
    requirePermission('view.cupboard'), 
    editarArticulo);

//Eliminar un producto
router.delete('/articulo/:id', 
    verifyToken,
    requirePermission('view.cupboard'), 
    eliminarArticulo);

//Caja o salida masiva de productos 
router.post('/despensa', 
    verifyToken, 
    requirePermission('view.cupboard'), 
    procesarDespensa); 

//Traer el historial de todo de la tabla alacena movimineto
router.get('/kardex', 
    verifyToken, 
    requirePermission('view.cupboard'), 
    getHistorialGlobal);


module.exports = router;