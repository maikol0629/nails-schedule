const { UserRole } = require('@prisma/client');
const authMiddleware = require('./auth');

async function superAdminAuth(req, res, next) {
  // Primero validamos el token con el middleware de auth existente
  return authMiddleware(req, res, async () => {
    try {
      if (!req.userRole) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      if (req.userRole !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'Acceso restringido a super administradores' });
      }

      return next();
    } catch (error) {
      console.error('[superAdminAuth] Error verificando rol de super admin', error);
      return res.status(500).json({ message: 'Error de autenticación' });
    }
  });
}

module.exports = superAdminAuth;
