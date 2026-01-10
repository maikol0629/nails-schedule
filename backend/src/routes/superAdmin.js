const express = require('express');
const { body, param, validationResult } = require('express-validator');

const superAdminAuth = require('../middleware/superAdminAuth');
const superAdminController = require('../controllers/superAdminController');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

// Obtener solicitudes pendientes de aprobación
router.get(
  '/pending-approvals',
  superAdminAuth,
  superAdminController.getPendingApprovals,
);

// Aprobar estilista
router.post(
  '/approve-stylist/:userId',
  superAdminAuth,
  [param('userId').notEmpty().withMessage('userId es requerido')],
  handleValidation,
  superAdminController.approveStylist,
);

// Rechazar estilista
router.post(
  '/reject-stylist/:userId',
  superAdminAuth,
  [
    param('userId').notEmpty().withMessage('userId es requerido'),
    body('reason').notEmpty().withMessage('reason es requerido'),
  ],
  handleValidation,
  superAdminController.rejectStylist,
);

// Listar estilistas con filtros y paginación
router.get('/stylists', superAdminAuth, superAdminController.getAllStylists);

// Suspender estilista
router.patch(
  '/suspend-stylist/:userId',
  superAdminAuth,
  [param('userId').notEmpty().withMessage('userId es requerido')],
  handleValidation,
  superAdminController.suspendStylist,
);

// Activar estilista
router.patch(
  '/activate-stylist/:userId',
  superAdminAuth,
  [param('userId').notEmpty().withMessage('userId es requerido')],
  handleValidation,
  superAdminController.activateStylist,
);

// Logs de auditoría con filtros y paginación
router.get('/audit-logs', superAdminAuth, superAdminController.getAuditLogs);

module.exports = router;
