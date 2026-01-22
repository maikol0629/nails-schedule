const prisma = require('../config/prisma');
const { supabase } = require('../config/supabase');
const { generateUniqueSlug } = require('../utils/slugGenerator');
const {
  AccountStatus,
  BusinessCategory,
} = require('@prisma/client');

function validateRequiredFields(body, fields) {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    const error = new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function mapCategory(category) {
  if (!category) return null;
  const upper = String(category).toUpperCase();
  if (Object.prototype.hasOwnProperty.call(BusinessCategory, upper)) {
    return upper;
  }
  const error = new Error('Categoría de negocio inválida');
  error.status = 400;
  throw error;
}

async function completeStylistProfile(req, res, next) {
  try {
    const supabaseAuthId = req.supabaseAuthId;
    const supabaseUser = req.supabaseUser;

    if (!supabaseAuthId || !supabaseUser) {
      const error = new Error('No se pudo identificar al usuario autenticado');
      error.status = 401;
      throw error;
    }

    const { businessName, ownerName, category, phone, whatsapp } = req.body || {};

    validateRequiredFields(req.body || {}, ['businessName', 'ownerName', 'category', 'phone', 'whatsapp']);

    const categoryValue = mapCategory(category);

    const email = supabaseUser.email;
    if (!email) {
      const error = new Error('El usuario autenticado no tiene un email asociado');
      error.status = 400;
      throw error;
    }

    let user = await prisma.user.findUnique({
      where: { supabaseAuthId },
      include: { stylistProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          supabaseAuthId,
          role: 'STYLIST',
          status: AccountStatus.PENDING_APPROVAL,
          isVerifiedAt: new Date(),
        },
        include: { stylistProfile: true },
      });
    } else if (user.email !== email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email },
        include: { stylistProfile: true },
      });
    }

    const existingProfile = user.stylistProfile;
    let slug = existingProfile ? existingProfile.slug : null;
    if (!slug) {
      slug = await generateUniqueSlug(businessName);
    }

    const profileData = {
        businessName,
        ownerName,
        category: categoryValue,
        slug,
        // `name` se usará como "nombre completo" visible en el panel,
        // por lo que lo alineamos con el nombre del estilista.
        name: ownerName || businessName,
        phone,
        whatsapp,
        email,
      };

    const profile = await prisma.stylistProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    return res.json({
      userId: user.id,
      profile,
    });
  } catch (error) {
    console.error('[authController] completeStylistProfile error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

// GET /api/auth/check-email?email=...
// Verifica si un email ya está registrado en la tabla User.
async function checkEmailAvailability(req, res, next) {
  try {
    const rawEmail = req.query.email;

    if (!rawEmail) {
      return res.status(400).json({ message: 'email es requerido' });
    }

    const email = String(rawEmail).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({ available: true });
    }

    return res.json({
      available: false,
      status: user.status,
      role: user.role,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  } catch (error) {
    console.error('[authController] checkEmailAvailability error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

module.exports = {
  completeStylistProfile,
  checkEmailAvailability,
};
