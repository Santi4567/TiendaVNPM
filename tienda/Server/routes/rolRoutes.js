const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');
const { verifyToken, requireAdmin } = require('../middleware/auth'); 

// =======================
// =       Roles         =
// =======================
// Solo Admins
// Listar roles
router.get('/', 
    verifyToken,
    requireAdmin,
    rolController.getRoles); 

// Crear rol
router.post('/',
    verifyToken,
    requireAdmin,
    rolController.createRol); 

// Eliminar rol
router.delete('/:id',
    verifyToken,
    requireAdmin,
    rolController.deleteRol); 
//===========================
//=  Gestión de Permisos    =
//===========================
//Solo Admins

// Todos los permisos posibles
router.get('/permisos/catalogo', 
    verifyToken,
    requireAdmin,
    rolController.getAllPermisos); 

// Permisos de un rol
router.get('/:id/permisos', 
    verifyToken,
    requireAdmin, 
    rolController.getRolPermisos); 

// Guardar permisos
router.put('/:id/permisos', 
    verifyToken,
    requireAdmin, 
    rolController.updateRolPermisos); 

module.exports = router;