const express = require('express');

const setupController = require('../controllers/setupController');

const router = express.Router();

// GET /api/setup/stylist-id
router.get('/stylist-id', setupController.getStylistId);

// POST /api/setup/init
router.post('/init', setupController.initStylist);

module.exports = router;
