const express = require('express');

const authRoutes = require('./auth');

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// TODO: add services, clients, appointments, and portfolio routes here

module.exports = router;
