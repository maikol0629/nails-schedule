const express = require('express');
const { body, param, validationResult } = require('express-validator');

const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

// Completar perfil de estilista después de OTP (passwordless)
router.post(
  '/complete-profile',
  authMiddleware,
  [
    body('businessName').notEmpty().withMessage('businessName es requerido'),
    body('ownerName').notEmpty().withMessage('ownerName es requerido'),
    body('category').notEmpty().withMessage('category es requerido'),
    body('phone').notEmpty().withMessage('phone es requerido'),
    body('whatsapp').notEmpty().withMessage('whatsapp es requerido'),
  ],
  handleValidation,
  authController.completeStylistProfile,
);

// Verificar disponibilidad de email de forma pública (sin autenticación)
router.get('/check-email', authController.checkEmailAvailability);

// Devuelve información básica del usuario autenticado (incluye rol y estado de cuenta)
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    id: req.userId,
    role: req.userRole,
    status: req.userStatus,
    email: req.appUser ? req.appUser.email : null,
  });
});

module.exports = router;
