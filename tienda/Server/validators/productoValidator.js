const { check, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateProducto = [
    check('producto')
        .exists().withMessage('El nombre es requerido')
        .notEmpty().withMessage('No puede estar vacío')
        .trim().escape()
        .isLength({ min: 3 }).withMessage('Mínimo 3 caracteres'),

    check('precio_publico')
        .exists().withMessage('El precio público es requerido')
        .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),

    check('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),

    check('stock_minimo')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número positivo'),
        
    check('codigo')
        .optional({ checkFalsy: true }) // Permite enviar null o string vacío
        .trim().escape(),



    validateResult
];

module.exports = { validateProducto };