const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { 
    getRoles, 
    getAllPermisos, 
    createRol, 
    getRolPermissions, 
    updateRolPermissions, 
    getStats 
} = require('../controllers/rolController');

// Middleware Global para este router: Todo requiere ser Admin
router.use(verifyToken, requireAdmin);

// Rutas
router.get('/', getRoles);                       // Ver roles
router.post('/', createRol);                     // Crear rol
router.get('/permisos', getAllPermisos);         // Ver todos los permisos disponibles
router.get('/stats', getStats);                  // Ver cuántos usuarios hay por rol

// Rutas específicas por Rol ID
router.get('/:id/permisos', getRolPermissions);  // Ver qué permisos tiene el rol X
router.put('/:id/permisos', updateRolPermissions); // Cambiar permisos del rol X

module.exports = router;