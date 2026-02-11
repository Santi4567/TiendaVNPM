const { check, validationResult } = require('express-validator');

const validateLogin = [
    // 1. Reglas de Validación
    check('Usuario')
        .exists().withMessage('El usuario es obligatorio')
        .notEmpty().withMessage('El usuario no puede estar vacío')
        .trim() // Quita espacios en blanco al inicio y final
        .escape(), // Convierte caracteres especiales HTML (seguridad extra XSS)

    check('Passwd')
        .exists().withMessage('La contraseña es obligatoria')
        .notEmpty().withMessage('La contraseña no puede estar vacía'),

    // 2. Middleware que ejecuta las reglas
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'DATOS_INVALIDOS',
                message: 'Datos de entrada incorrectos',
                details: errors.array()
            });
        }
        next(); // Si todo está bien, pasa al Controlador
    }
];

module.exports = { validateLogin };