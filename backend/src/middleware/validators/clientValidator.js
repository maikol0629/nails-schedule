const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	return next();
};

const validateCreateClient = [
	body('name').notEmpty().withMessage('El nombre es obligatorio'),
	body('phone').optional().isString().withMessage('El teléfono debe ser texto'),
	body('email')
		.optional()
		.isEmail()
		.withMessage('El email debe tener un formato válido'),
	body('notes').optional().isString().withMessage('Las notas deben ser texto'),
	handleValidation,
];

const validateUpdateClient = [
	body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
	body('phone').optional().isString().withMessage('El teléfono debe ser texto'),
	body('email')
		.optional()
		.isEmail()
		.withMessage('El email debe tener un formato válido'),
	body('notes').optional().isString().withMessage('Las notas deben ser texto'),
	handleValidation,
];

module.exports = {
	validateCreateClient,
	validateUpdateClient,
};
