const prisma = require('../config/prisma');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');
const { generateUniqueSlug } = require('../utils/slugGenerator');
const { AccountStatus, UserRole, BusinessCategory } = require('@prisma/client');

function parseIntParam(value, defaultValue) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return defaultValue;
  return num;
}

function mapStatus(status) {
  if (!status) return null;
  const upper = String(status).toUpperCase();
  if (Object.prototype.hasOwnProperty.call(AccountStatus, upper)) {
    return upper;
  }
  const error = new Error('Estado inválido');
  error.status = 400;
  throw error;
}

function mapCategory(category) {
  if (!category) return null;
  const upper = String(category).toUpperCase();
  if (Object.prototype.hasOwnProperty.call(BusinessCategory, upper)) {
    return upper;
  }
  const error = new Error('Categoría inválida');
  error.status = 400;
  throw error;
}

// 1. Listar estilistas en estado PENDING_APPROVAL
async function getPendingApprovals(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: UserRole.STYLIST,
        status: AccountStatus.PENDING_APPROVAL,
      },
      include: { stylistProfile: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (error) {
    console.error('[superAdminController] getPendingApprovals error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 2. Aprobar estilista
async function approveStylist(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId) {
      const error = new Error('userId es requerido');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stylistProfile: true },
    });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    if (user.role !== UserRole.STYLIST) {
      const error = new Error('Solo se pueden aprobar usuarios estilistas');
      error.status = 400;
      throw error;
    }

    if (user.status !== AccountStatus.PENDING_APPROVAL) {
      const error = new Error('El usuario no está pendiente de aprobación');
      error.status = 400;
      throw error;
    }

    const profile = user.stylistProfile;
    if (!profile) {
      const error = new Error('Perfil de estilista no encontrado');
      error.status = 400;
      throw error;
    }

    const businessName = profile.businessName || profile.name || user.email;
    const slug = await generateUniqueSlug(businessName);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.ACTIVE,
        },
      });

      await tx.stylistProfile.update({
        where: { userId },
        data: {
          slug,
          approvedBy: req.userId || null,
          approvedAt: now,
        },
      });

      if (user.supabaseAuthId) {
        await tx.businessHours.upsert({
          where: { supabaseUserId: user.supabaseAuthId },
          create: {
            supabaseUserId: user.supabaseAuthId,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
            startTime: '09:00',
            endTime: '18:00',
            slotDuration: 30,
          },
          update: {},
        });
      }

      await tx.auditLog.create({
        data: {
          adminId: req.userId || 'unknown',
          action: 'APPROVE_STYLIST',
          targetUserId: userId,
          metadata: {
            slug,
            previousStatus: user.status,
            newStatus: AccountStatus.ACTIVE,
          },
        },
      });
    });

    try {
      await sendApprovalEmail(user.email, businessName, slug);
    } catch (emailError) {
      console.error('[superAdminController] Error enviando email de aprobación', emailError);
    }

    return res.json({ success: true, slug });
  } catch (error) {
    console.error('[superAdminController] approveStylist error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 3. Rechazar estilista
async function rejectStylist(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};

    if (!userId) {
      const error = new Error('userId es requerido');
      error.status = 400;
      throw error;
    }

    if (!reason) {
      const error = new Error('reason es requerido');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stylistProfile: true },
    });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    const profile = user.stylistProfile;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: AccountStatus.DEACTIVATED },
      });

      await tx.auditLog.create({
        data: {
          adminId: req.userId || 'unknown',
          action: 'REJECT_STYLIST',
          targetUserId: userId,
          metadata: {
            previousStatus: user.status,
            newStatus: AccountStatus.DEACTIVATED,
            reason,
          },
        },
      });
    });

    try {
      await sendRejectionEmail(user.email, profile ? profile.businessName : null, reason);
    } catch (emailError) {
      console.error('[superAdminController] Error enviando email de rechazo', emailError);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[superAdminController] rejectStylist error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 4. Listar todos los estilistas con filtros y paginación
async function getAllStylists(req, res, next) {
  try {
    const { status, category } = req.query;
    const { search } = req.query;
    const page = parseIntParam(req.query.page, 1);
    const pageSize = parseIntParam(req.query.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const statusFilter = mapStatus(status);
    const categoryFilter = mapCategory(category);

    const where = {
      role: UserRole.STYLIST,
    };
		
    if (search) {
      where.stylistProfile = {
        ...(category ? { category } : {}),
        OR: [
          { businessName: { contains: search, mode: 'insensitive' } },
          { ownerName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (categoryFilter) {
      where.stylistProfile = { category: categoryFilter };
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: { stylistProfile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.json({
      data: users,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('[superAdminController] getAllStylists error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 5. Suspender estilista
async function suspendStylist(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId) {
      const error = new Error('userId es requerido');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    if (user.role !== UserRole.STYLIST) {
      const error = new Error('Solo se pueden suspender usuarios estilistas');
      error.status = 400;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.SUSPENDED },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.userId || 'unknown',
        action: 'SUSPEND_STYLIST',
        targetUserId: userId,
        metadata: {
          previousStatus: user.status,
          newStatus: AccountStatus.SUSPENDED,
        },
      },
    });

    return res.json({ success: true, status: updated.status });
  } catch (error) {
    console.error('[superAdminController] suspendStylist error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 6. Activar estilista
async function activateStylist(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId) {
      const error = new Error('userId es requerido');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    if (user.role !== UserRole.STYLIST) {
      const error = new Error('Solo se pueden activar usuarios estilistas');
      error.status = 400;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.ACTIVE },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.userId || 'unknown',
        action: 'ACTIVATE_STYLIST',
        targetUserId: userId,
        metadata: {
          previousStatus: user.status,
          newStatus: AccountStatus.ACTIVE,
        },
      },
    });

    return res.json({ success: true, status: updated.status });
  } catch (error) {
    console.error('[superAdminController] activateStylist error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

// 7. Obtener logs de auditoría con filtros y paginación
async function getAuditLogs(req, res, next) {
  try {
    const { adminId, targetUserId, dateFrom, dateTo } = req.query;
    const page = parseIntParam(req.query.page, 1);
    const pageSize = parseIntParam(req.query.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const where = {};

    if (adminId) {
      where.adminId = adminId;
    }

    if (targetUserId) {
      where.targetUserId = targetUserId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (Number.isNaN(from.getTime())) {
          const error = new Error('dateFrom inválido');
          error.status = 400;
          throw error;
        }
        where.createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (Number.isNaN(to.getTime())) {
          const error = new Error('dateTo inválido');
          error.status = 400;
          throw error;
        }
        where.createdAt.lte = to;
      }
    }

    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.json({
      data: logs,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('[superAdminController] getAuditLogs error', error);
    if (!error.status) error.status = 500;
    return next(error);
  }
}

module.exports = {
  getPendingApprovals,
  approveStylist,
  rejectStylist,
  getAllStylists,
  suspendStylist,
  activateStylist,
  getAuditLogs,
};
