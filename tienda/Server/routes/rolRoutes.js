const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { verifyToken } = require('../middleware/auth'); // Tu middleware de seguridad

// Base URL: /api/roles

router.get('/', verifyToken, rolController.getRoles); // Listar roles
router.post('/', verifyToken, rolController.createRol); // Crear rol
router.delete('/:id', verifyToken, rolController.deleteRol); // Eliminar rol

// Gestión de Permisos
router.get('/permisos/catalogo', verifyToken, rolController.getAllPermisos); // Todos los permisos posibles
router.get('/:id/permisos', verifyToken, rolController.getRolPermisos); // Permisos de un rol
router.put('/:id/permisos', verifyToken, rolController.updateRolPermisos); // Guardar permisos

module.exports = router;