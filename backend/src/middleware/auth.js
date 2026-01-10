const { supabase } = require('../config/supabase');
const prisma = require('../config/prisma');
const { AccountStatus, UserRole } = require('@prisma/client');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    const authUser = data?.user;

    if (error || !authUser) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Buscar el usuario de aplicación asociado al usuario de Supabase
    const appUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!appUser) {
      return res.status(403).json({ message: 'Cuenta inactiva' });
    }

    // Validar que la cuenta esté activa
    if (appUser.status !== AccountStatus.ACTIVE) {
      return res.status(403).json({ message: 'Cuenta inactiva' });
    }

    // Exponer datos útiles en la request
    req.supabaseUser = authUser;
    req.supabaseAuthId = authUser.id;
    req.appUser = appUser;
    req.userId = appUser.id;
    req.userRole = appUser.role;
    req.userStatus = appUser.status;

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.userRole !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

// Mantener compatibilidad con el uso anterior (export por defecto como función)
authMiddleware.requireRole = requireRole;

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
