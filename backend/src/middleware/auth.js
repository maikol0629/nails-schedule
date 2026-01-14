const { supabase } = require('../config/supabase');
const prisma = require('../config/prisma');
const { AccountStatus, UserRole } = require('@prisma/client');

const SEED_SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL || 'admin@tuapp.com';

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

    // 1. Buscar el usuario de aplicación asociado al usuario de Supabase por supabaseAuthId
    let appUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    // 2. Si no existe, intentar vincular por email (por si quedó desincronizado)
    if (!appUser && authUser.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (existingByEmail) {
        appUser = await prisma.user.update({
          where: { email: authUser.email },
          data: { supabaseAuthId: authUser.id },
        });
      }
    }

    // 3. Si sigue sin existir y es el super admin del seed, crearlo en caliente
    if (!appUser && authUser.email && authUser.email.toLowerCase() === SEED_SUPERADMIN_EMAIL.toLowerCase()) {
      appUser = await prisma.user.create({
        data: {
          email: authUser.email,
          supabaseAuthId: authUser.id,
          role: UserRole.SUPER_ADMIN,
          status: AccountStatus.ACTIVE,
        },
      });
    }

    if (!appUser) {
      return res.status(403).json({ message: 'Cuenta inactiva' });
    }

    // Si es SUPER_ADMIN pero no está marcado como ACTIVE, lo reactivamos
    if (appUser.role === UserRole.SUPER_ADMIN && appUser.status !== AccountStatus.ACTIVE) {
      appUser = await prisma.user.update({
        where: { id: appUser.id },
        data: { status: AccountStatus.ACTIVE },
      });
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
