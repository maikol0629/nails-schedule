const { body, validationResult } = require('express-validator');

const SERVICE_CATEGORIES = ['CUT', 'COLOR', 'STYLE', 'TREATMENT'];

const handleValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	return next();
};

const validateCreateService = [
	body('name').notEmpty().withMessage('El nombre es obligatorio'),
	body('durationMinutes')
		.isInt({ min: 1 })
		.withMessage('La duración debe ser un número entero mayor a 0'),
	body('price')
		.isFloat({ min: 0 })
		.withMessage('El precio debe ser un número mayor o igual a 0'),
	body('category')
		.isIn(SERVICE_CATEGORIES)
		.withMessage(
			`La categoría debe ser uno de: ${SERVICE_CATEGORIES.join(', ')}`,
		),
	handleValidation,
];

const validateUpdateService = [
	body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
	body('durationMinutes')
		.optional()
		.isInt({ min: 1 })
		.withMessage('La duración debe ser un número entero mayor a 0'),
	body('price')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('El precio debe ser un número mayor o igual a 0'),
	body('category')
		.optional()
		.isIn(SERVICE_CATEGORIES)
		.withMessage(
			`La categoría debe ser uno de: ${SERVICE_CATEGORIES.join(', ')}`,
		),
	handleValidation,
];

module.exports = {
	validateCreateService,
	validateUpdateService,
};
