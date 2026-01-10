const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Devuelve información básica del usuario autenticado
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ id: req.userId });
});

module.exports = router;
