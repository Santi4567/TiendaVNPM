const { check, validationResult } = require('express-validator');

// Middleware auxiliar para revisar errores
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateCreateUser = [
    check('Usuario')
        .exists().withMessage('El usuario es requerido')
        .isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),
    
    check('Nombre_Completo')
        .exists().withMessage('El nombre es requerido'),

    check('Passwd')
        .exists().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),

    check('ID_Rol')
        .exists().withMessage('El rol es requerido')
        .isInt().withMessage('El Rol debe ser un número entero'),

    validateResult // Llamamos al revisor de errores al final
];

const validateUpdateUser = [
    // En Update, los campos pueden ser opcionales, pero si vienen, deben ser válidos
    check('Usuario')
        .optional()
        .isLength({ min: 3 }),
    
    check('ID_Rol')
        .optional()
        .isInt(),
        
    validateResult
];

module.exports = { validateCreateUser, validateUpdateUser };