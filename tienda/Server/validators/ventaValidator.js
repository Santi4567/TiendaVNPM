const { check, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateVenta = [
    check('productos')
        .isArray({ min: 1 }).withMessage('La lista de productos no puede estar vacía'),
    
    check('productos.*.ID')
        .exists().isInt().withMessage('ID de producto inválido'),
    
    check('productos.*.precio')
        .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),

    check('productos.*.cantidad')
        .optional()
        .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),

    check('idCliente')
        .optional({ checkFalsy: true })
        .isInt().withMessage('ID de cliente inválido'),

    validateResult
];

const validateFecha = [
    // Valida formato YYYY-MM-DD para reportes
    check('fecha').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Formato de fecha inválido (YYYY-MM-DD)'),
    validateResult
];

module.exports = { validateVenta, validateFecha };