const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Helpers de validación
const handleValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	return next();
};

// 1. GET /api/public/stylist/:userId/info
router.get(
	'/stylist/:userId/info',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		handleValidation,
	],
	publicController.getStylistInfo,
);

// 1b. GET /api/public/stylist/:userId/profile
router.get(
	'/stylist/:userId/profile',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		handleValidation,
	],
	publicController.getStylistProfile,
);

// 2. GET /api/public/stylist/:userId/services
router.get(
	'/stylist/:userId/services',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		handleValidation,
	],
	publicController.getPublicServices,
);

// 3. GET /api/public/stylist/:userId/portfolio
router.get(
	'/stylist/:userId/portfolio',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		handleValidation,
	],
	publicController.getPublicPortfolio,
);

// 4. GET /api/public/stylist/:userId/available-slots
router.get(
	'/stylist/:userId/available-slots',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		query('date')
			.isISO8601()
			.withMessage('La fecha es obligatoria y debe tener formato válido'),
		query('serviceId')
			.isString()
			.trim()
			.notEmpty()
			.withMessage('serviceId es obligatorio'),
		handleValidation,
	],
	publicController.getAvailableSlots,
);

// 5. POST /api/public/stylist/:userId/appointments
router.post(
	'/stylist/:userId/appointments',
	[
		param('userId').isString().notEmpty().withMessage('userId es obligatorio'),
		body('clientName')
			.isString()
			.trim()
			.notEmpty()
			.withMessage('El nombre del cliente es obligatorio'),
		body('clientPhone')
			.isString()
			.trim()
			.notEmpty()
			.withMessage('El teléfono del cliente es obligatorio')
			.matches(/^[0-9+()\s-]{6,20}$/)
			.withMessage('El teléfono no tiene un formato válido'),
		body('clientEmail')
			.optional()
			.isEmail()
			.withMessage('El email no tiene un formato válido'),
		body('serviceId')
			.isString()
			.trim()
			.notEmpty()
			.withMessage('serviceId es obligatorio'),
		body('date')
			.isISO8601()
			.withMessage('La fecha es obligatoria y debe tener formato válido'),
		body('time')
			.matches(/^([01]\d|2[0-3]):[0-5]\d$/)
			.withMessage('La hora debe tener formato HH:MM'),
		body('notes')
			.optional()
			.isString()
			.isLength({ max: 500 })
			.withMessage('Las notas no pueden superar 500 caracteres'),
		handleValidation,
	],
	publicController.createPublicAppointment,
);

module.exports = router;
