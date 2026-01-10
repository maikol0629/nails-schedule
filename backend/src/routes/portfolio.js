const express = require('express');
const auth = require('../middleware/auth');
const {
	getAllImages,
	uploadImage,
	deleteImage,
} = require('../controllers/portfolioController');

const router = express.Router();

// Todas las rutas de portafolio requieren autenticación
router.use(auth);

// GET /api/portfolio
router.get('/', getAllImages);

// POST /api/portfolio
router.post('/', uploadImage);

// DELETE /api/portfolio/:id
router.delete('/:id', deleteImage);

module.exports = router;
