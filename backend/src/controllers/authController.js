const crypto = require('crypto');

const prisma = require('../config/prisma');
const { supabase } = require('../config/supabase');
const { sendVerificationEmail } = require('../services/emailService');
const { generateVerificationCode, sendWhatsAppCode } = require('../services/whatsappService');
const { generateUniqueSlug } = require('../utils/slugGenerator');
const {
  AccountStatus,
  VerificationTokenType,
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

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function registerStylist(req, res, next) {
  try {
    const { email, password, businessName, ownerName, category, phone, whatsapp } = req.body || {};

    validateRequiredFields(req.body || {}, ['email', 'password', 'businessName', 'ownerName', 'category']);

    const categoryValue = mapCategory(category);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Ya existe un usuario con este email');
      error.status = 400;
      throw error;
    }

    const { data, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (supabaseError) {
      const error = new Error(`No se pudo crear el usuario en Supabase: ${supabaseError.message}`);
      error.status = 400;
      throw error;
    }

    const supabaseUser = data && data.user;
    if (!supabaseUser || !supabaseUser.id) {
      const error = new Error('Respuesta inválida de Supabase al crear el usuario');
      error.status = 500;
      throw error;
    }

    const supabaseAuthId = supabaseUser.id;

    const slug = await generateUniqueSlug(businessName);

    const user = await prisma.user.create({
      data: {
        email,
        supabaseAuthId,
        role: 'STYLIST',
        status: AccountStatus.PENDING_VERIFICATION,
        stylistProfile: {
          create: {
            businessName,
            ownerName,
            category: categoryValue,
            slug,
            name: ownerName,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email,
          },
        },
      },
      include: {
        stylistProfile: true,
      },
    });

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    try {
      await sendVerificationEmail(email, token, businessName);
    } catch (emailError) {
      console.error('[authController] Error enviando email de verificación', emailError);
    }

    return res.status(201).json({ userId: user.id, message: 'Revisa tu email para verificar tu cuenta' });
  } catch (error) {
    console.error('[authController] registerStylist error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      const error = new Error('Token de verificación requerido');
      error.status = 400;
      throw error;
    }

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord || tokenRecord.type !== VerificationTokenType.EMAIL_VERIFICATION) {
      const error = new Error('Token de verificación inválido');
      error.status = 400;
      throw error;
    }

    if (tokenRecord.usedAt) {
      const error = new Error('Este token ya fue utilizado');
      error.status = 400;
      throw error;
    }

    if (tokenRecord.expiresAt <= new Date()) {
      const error = new Error('El token de verificación ha expirado');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      include: { stylistProfile: true },
    });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          status: AccountStatus.EMAIL_VERIFIED,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.stylistProfile.update({
        where: { userId: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
    ]);

    const profile = user.stylistProfile;
    if (!profile || !profile.whatsapp) {
      return res.json({
        message: 'Email verificado correctamente. No hay número de WhatsApp configurado.',
      });
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: code,
        type: VerificationTokenType.WHATSAPP_VERIFICATION,
        expiresAt,
      },
    });

    try {
      await sendWhatsAppCode(profile.whatsapp, code);
    } catch (waError) {
      console.error('[authController] Error enviando código de WhatsApp', waError);
    }

    return res.json({ message: 'Email verificado. Revisa tu WhatsApp para el código de verificación' });
  } catch (error) {
    console.error('[authController] verifyEmail error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

async function verifyWhatsApp(req, res, next) {
  try {
    const { userId, code } = req.body || {};

    validateRequiredFields(req.body || {}, ['userId', 'code']);

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        userId,
        token: String(code),
        type: VerificationTokenType.WHATSAPP_VERIFICATION,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      const error = new Error('Código de verificación inválido o expirado');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.PENDING_APPROVAL,
        },
      }),
      prisma.stylistProfile.update({
        where: { userId },
        data: {
          whatsappVerified: true,
          whatsappVerifiedAt: new Date(),
        },
      }),
    ]);

    return res.json({ message: 'Tu solicitud está en revisión' });
  } catch (error) {
    console.error('[authController] verifyWhatsApp error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

async function getRegistrationStatus(req, res, next) {
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

    const profile = user.stylistProfile;

    return res.json({
      status: user.status,
      emailVerified: profile ? profile.emailVerified : false,
      whatsappVerified: profile ? profile.whatsappVerified : false,
    });
  } catch (error) {
    console.error('[authController] getRegistrationStatus error', error);
    if (!error.status) {
      error.status = 500;
    }
    return next(error);
  }
}

module.exports = {
  registerStylist,
  verifyEmail,
  verifyWhatsApp,
  getRegistrationStatus,
};
