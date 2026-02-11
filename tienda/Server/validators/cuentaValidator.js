const { check, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateAgregarCuenta = [
    check('clienteId')
        .exists().withMessage('El cliente es requerido')
        .isInt().withMessage('ID de cliente inválido'),
    
    check('productos')
        .isArray({ min: 1 }).withMessage('Debes enviar al menos un producto'),
    
    check('productos.*.ID')
        .exists().withMessage('El ID del producto es necesario'),
    
    check('productos.*.precio')
        .isFloat({ min: 0 }).withMessage('El precio debe ser válido'),

    validateResult
];

const validateSaldarCuenta = [
    check('clienteId')
        .exists().withMessage('El cliente es requerido')
        .isInt().withMessage('ID de cliente inválido'),
    
    validateResult
];



module.exports = { validateAgregarCuenta, validateSaldarCuenta };