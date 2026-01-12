const { check, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const validateCliente = [
    check('nombre')
        .exists().withMessage('El nombre es requerido')
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .trim()
        .escape() // Limpia HTML malicioso
        .isLength({ min: 2 }).withMessage('El nombre es muy corto'),
    
    validateResult
];

module.exports = { validateCliente };