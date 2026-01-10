const { body, query, validationResult } = require('express-validator');

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const handleValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	return next();
};

const validateCreateAppointment = [
	body('clientId')
		.isInt({ min: 1 })
		.withMessage('clientId es obligatorio y debe ser un entero'),
	body('serviceId')
		.isInt({ min: 1 })
		.withMessage('serviceId es obligatorio y debe ser un entero'),
	body('date')
		.isISO8601()
		.withMessage('La fecha debe tener formato YYYY-MM-DD'),
	body('time')
		.matches(/^([01]\d|2[0-3]):[0-5]\d$/)
		.withMessage('La hora debe tener formato HH:mm'),
	body('notes').optional().isString().withMessage('Las notas deben ser texto'),
	handleValidation,
];

const validateUpdateAppointment = [
	body('clientId')
		.optional()
		.isInt({ min: 1 })
		.withMessage('clientId debe ser un entero'),
	body('serviceId')
		.optional()
		.isInt({ min: 1 })
		.withMessage('serviceId debe ser un entero'),
	body('date')
		.optional()
		.isISO8601()
		.withMessage('La fecha debe tener formato YYYY-MM-DD'),
	body('time')
		.optional()
		.matches(/^([01]\d|2[0-3]):[0-5]\d$/)
		.withMessage('La hora debe tener formato HH:mm'),
	body('status')
		.optional()
		.isIn(APPOINTMENT_STATUSES)
		.withMessage(
			`El estado debe ser uno de: ${APPOINTMENT_STATUSES.join(', ')}`,
		),
	body('notes').optional().isString().withMessage('Las notas deben ser texto'),
	handleValidation,
];

const validateRangeQuery = [
	query('start')
		.isISO8601()
		.withMessage('start debe tener formato YYYY-MM-DD'),
	query('end')
		.isISO8601()
		.withMessage('end debe tener formato YYYY-MM-DD'),
	handleValidation,
];

module.exports = {
	validateCreateAppointment,
	validateUpdateAppointment,
	validateRangeQuery,
};
