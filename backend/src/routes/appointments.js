const express = require('express');
const auth = require('../middleware/auth');
const {
	getAllAppointments,
	getAppointmentById,
	createAppointment,
	updateAppointment,
	deleteAppointment,
	getAppointmentsByDateRange,
} = require('../controllers/appointmentsController');
const {
	validateCreateAppointment,
	validateUpdateAppointment,
	validateRangeQuery,
} = require('../middleware/validators/appointmentValidator');

const router = express.Router();

// Todas las rutas de citas requieren autenticación
router.use(auth);

// GET /api/appointments
router.get('/', getAllAppointments);

// GET /api/appointments/range
router.get('/range', validateRangeQuery, getAppointmentsByDateRange);

// GET /api/appointments/:id
router.get('/:id', getAppointmentById);

// POST /api/appointments
router.post('/', validateCreateAppointment, createAppointment);

// PUT /api/appointments/:id
router.put('/:id', validateUpdateAppointment, updateAppointment);

// DELETE /api/appointments/:id
router.delete('/:id', deleteAppointment);

module.exports = router;
