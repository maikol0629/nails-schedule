const express = require('express');
const auth = require('../middleware/auth');
const {
	getAllServices,
	getServiceById,
	createService,
	updateService,
	deleteService,
} = require('../controllers/servicesController');
const {
	validateCreateService,
	validateUpdateService,
} = require('../middleware/validators/serviceValidator');

const router = express.Router();

// Todas las rutas de servicios requieren autenticación
router.use(auth);

// GET /api/services
router.get('/', getAllServices);

// GET /api/services/:id
router.get('/:id', getServiceById);

// POST /api/services
router.post('/', validateCreateService, createService);

// PUT /api/services/:id
router.put('/:id', validateUpdateService, updateService);

// DELETE /api/services/:id
router.delete('/:id', deleteService);

module.exports = router;
