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

// Registro de estilista
router.post(
  '/register-stylist',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('businessName').notEmpty().withMessage('businessName es requerido'),
    body('ownerName').notEmpty().withMessage('ownerName es requerido'),
    body('category').notEmpty().withMessage('category es requerido'),
    body('phone').optional().isString(),
    body('whatsapp').optional().isString(),
  ],
  handleValidation,
  authController.registerStylist,
);

// Verificación de email
router.get('/verify-email/:token', authController.verifyEmail);

// Verificación de WhatsApp
router.post(
  '/verify-whatsapp',
  [
    body('userId').notEmpty().withMessage('userId es requerido'),
    body('code')
      .notEmpty()
      .withMessage('code es requerido')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código debe tener 6 dígitos')
      .isNumeric()
      .withMessage('El código debe ser numérico'),
  ],
  handleValidation,
  authController.verifyWhatsApp,
);

// Estado de registro
router.get(
  '/registration-status/:userId',
  [param('userId').notEmpty().withMessage('userId es requerido')],
  handleValidation,
  authController.getRegistrationStatus,
);

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
