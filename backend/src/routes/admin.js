const express = require('express');
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Todas las rutas de admin requieren autenticación
router.use(auth);

// 1. GET /api/admin/appointments
router.get('/appointments', adminController.getAppointments);

// 2. PATCH /api/admin/appointments/:id/confirm
router.patch('/appointments/:id/confirm', adminController.confirmAppointment);

// 3. PATCH /api/admin/appointments/:id/cancel
router.patch('/appointments/:id/cancel', adminController.cancelAppointment);

// 4. PATCH /api/admin/appointments/:id/complete
router.patch('/appointments/:id/complete', adminController.completeAppointment);

// 5. PATCH /api/admin/appointments/:id/no-show
router.patch('/appointments/:id/no-show', adminController.markNoShow);

// 6. GET /api/admin/business-hours
router.get('/business-hours', adminController.getBusinessHours);

// 7. PUT /api/admin/business-hours
router.put('/business-hours', adminController.updateBusinessHours);

// 8. GET /api/admin/blocked-days
router.get('/blocked-days', adminController.getBlockedDays);

// 9. POST /api/admin/blocked-days
router.post('/blocked-days', adminController.createBlockedDay);

// 10. DELETE /api/admin/blocked-days/:id
router.delete('/blocked-days/:id', adminController.deleteBlockedDay);
// Perfil del estilista autenticado
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);

module.exports = router;
