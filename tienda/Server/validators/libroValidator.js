const { check, validationResult } = require('express-validator');

// Helper para procesar los resultados (Si ya tienes uno global, usa ese)
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Retornamos 400 Bad Request con la lista de errores
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateCreateLibro = [
    check('titulo')
        .exists().withMessage('El título es requerido')
        .notEmpty().withMessage('El título no puede estar vacío')
        .trim(),
    
    check('precio')
        .exists().withMessage('El precio es requerido')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
    
    check('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    
    check('descuento')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('El descuento debe ser un porcentaje entre 0 y 100'),
    
    check('codigo')
        .optional()
        .trim(),

    // Ejecutar validación
    (req, res, next) => validateResult(req, res, next)
];

const validateUpdateLibro = [
    check('titulo')
        .optional()
        .notEmpty().withMessage('El título no puede estar vacío')
        .trim(),
    
    check('precio')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
    
    check('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    
    check('descuento')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('El descuento debe ser un porcentaje entre 0 y 100'),

    (req, res, next) => validateResult(req, res, next)
];

module.exports = { validateCreateLibro, validateUpdateLibro };