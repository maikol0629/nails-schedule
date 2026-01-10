const express = require('express');
const auth = require('../middleware/auth');
const {
	getTodayAppointments,
	getUpcomingAppointments,
	getMonthStats,
} = require('../controllers/dashboardController');

const router = express.Router();

// Todas las rutas de dashboard requieren autenticación
router.use(auth);

// GET /api/dashboard/today
router.get('/today', getTodayAppointments);

// GET /api/dashboard/upcoming
router.get('/upcoming', getUpcomingAppointments);

// GET /api/dashboard/month-stats
router.get('/month-stats', getMonthStats);

module.exports = router;
