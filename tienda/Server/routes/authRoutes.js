/**
 * RUTAS DE AUTENTICACIÓN
 * - POST /register: Registro de nuevos usuarios
 * - POST /login: Inicio de sesión
 * - Conecta las rutas HTTP con los controladores
 * - Define los endpoints públicos de autenticación
 * - Ubicacion routes/authRoutes.js
 */

const express = require('express');
const router = express.Router();

// Importamos Controlador y Validador
const { login } = require('../controllers/loginController');
const { validateLogin } = require('../validators/authValidator');

// Ruta: POST /api/auth/login
// Flujo: 1. Valida datos -> 2. Ejecuta Login
router.post('/login', validateLogin, login);

module.exports = router;