const express = require('express');
const auth = require('../middleware/auth');
const {
	getAllClients,
	getClientById,
	createClient,
	updateClient,
	deleteClient,
} = require('../controllers/clientsController');
const {
	validateCreateClient,
	validateUpdateClient,
} = require('../middleware/validators/clientValidator');

const router = express.Router();

// Todas las rutas de clientes requieren autenticación
router.use(auth);

// GET /api/clients
router.get('/', getAllClients);

// GET /api/clients/:id
router.get('/:id', getClientById);

// POST /api/clients
router.post('/', validateCreateClient, createClient);

// PUT /api/clients/:id
router.put('/:id', validateUpdateClient, updateClient);

// DELETE /api/clients/:id
router.delete('/:id', deleteClient);

module.exports = router;
