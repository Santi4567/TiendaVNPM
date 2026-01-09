const express = require('express');
const router = express.Router();
const { 
    createUser, 
    updateUser, 
    getProfile,
    getAllUsers,        // <--- Nuevo
    getUserById,        // <--- Nuevo
    getUserByUsername,  // <--- Nuevo
    deleteUser          // <--- Nuevo
} = require('../controllers/userController');

const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator');
const { verifyToken, requireAdmin } = require('../middleware/auth'); 

// 1. RUTAS PÚBLICAS O DE USUARIO LOGUEADO
// ----------------------------------------
// Ver mi propio perfil
router.get('/profile', verifyToken, getProfile); 


// 2. RUTAS SOLO PARA ADMINISTRADOR (requireAdmin)
// ----------------------------------------------

// Listar todos
router.get('/', verifyToken, requireAdmin, getAllUsers);

// Buscar por Username (Ej: /api/users/username/juanperez)
router.get('/username/:username', verifyToken, requireAdmin, getUserByUsername);

// Crear usuario
router.post('/', verifyToken, requireAdmin, validateCreateUser, createUser);

// Buscar por ID (Ej: /api/users/5)
// ¡OJO! Esta ruta captura cualquier cosa después de /, por eso va al final
router.get('/:id', verifyToken, requireAdmin, getUserById);

// Modificar usuario
router.put('/:id', verifyToken, requireAdmin, validateUpdateUser, updateUser);

// Eliminar usuario
router.delete('/:id', verifyToken, requireAdmin, deleteUser);

module.exports = router;