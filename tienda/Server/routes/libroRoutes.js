const express = require('express');
const router = express.Router();
const { verifyToken, requirePermission } = require('../middleware/auth');
const {
    getTodos,
    buscarLibros,
    crearLibro,
    editarLibro,
    eliminarLibro
} = require('../controllers/libroController');

// IMPORTAR LOS VALIDADORES
const { validateCreateLibro, validateUpdateLibro } = require('../validators/libroValidator');


//traer todos los libros
router.get('/todos', 
    verifyToken, 
    requirePermission('view.book'), 
    getTodos);

//Buscar libro
router.get('/buscar', 
    verifyToken, 
    requirePermission('view.book'), 
    buscarLibros);

//agregar un nuevo libro
router.post('/agregar', 
    verifyToken, 
    requirePermission('view.book'), 
    validateCreateLibro,
    crearLibro);

//Editar libro
router.put('/editar/:id', 
    verifyToken, 
    requirePermission('view.book'), 
    validateUpdateLibro,
    editarLibro);

//Eliminar un libro
router.delete('/eliminar/:id', 
    verifyToken, 
    requirePermission('view.book'), 
    eliminarLibro);

module.exports = router;