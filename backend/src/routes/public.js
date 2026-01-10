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

// 1. GET /api/public/stylist/:slug/info
router.get(
	'/stylist/:slug/info',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
		handleValidation,
	],
	publicController.getStylistInfo,
);

// 1b. GET /api/public/stylist/:slug/profile
router.get(
	'/stylist/:slug/profile',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
		handleValidation,
	],
	publicController.getStylistProfile,
);

// Ruta para obtener perfil completo por slug
router.get(
	'/stylist/:slug',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
		handleValidation,
	],
	publicController.getStylistBySlug,
);

// 2. GET /api/public/stylist/:slug/services
router.get(
	'/stylist/:slug/services',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
		handleValidation,
	],
	publicController.getPublicServices,
);

// 3. GET /api/public/stylist/:slug/portfolio
router.get(
	'/stylist/:slug/portfolio',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
		handleValidation,
	],
	publicController.getPublicPortfolio,
);

// 4. GET /api/public/stylist/:slug/available-slots
router.get(
	'/stylist/:slug/available-slots',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
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

// 5. POST /api/public/stylist/:slug/appointments
router.post(
	'/stylist/:slug/appointments',
	[
		param('slug').isString().notEmpty().withMessage('slug es obligatorio'),
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
