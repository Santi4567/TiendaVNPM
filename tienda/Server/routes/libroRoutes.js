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
    getTodos);

//Buscar libro
router.get('/buscar', 
    verifyToken, 
    buscarLibros);

//agregar un nuevo libro
router.post('/agregar', 
    validateCreateLibro,
    verifyToken, 
    crearLibro);

//Editar libro
router.put('/editar/:id', 
    verifyToken, 
    validateUpdateLibro,
    editarLibro);

//Eliminar un libro
router.delete('/eliminar/:id', 
    verifyToken, 
    eliminarLibro);

module.exports = router;