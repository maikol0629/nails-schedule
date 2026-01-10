const { PrismaClient } = require('@prisma/client');
const { supabase } = require('../config/supabase');

const prisma = new PrismaClient();

async function resolveExistingStylistId() {
  // Intenta obtener el estilista principal desde AppSettings
  const settings = await prisma.appSettings.findFirst();
  if (settings?.primaryStylistId) {
    return { userId: settings.primaryStylistId, source: 'settings' };
  }

  // Si no hay settings, intenta inferir desde los datos existentes
  const fromService = await prisma.service.findFirst({ select: { userId: true } });
  if (fromService?.userId) {
    return { userId: fromService.userId, source: 'service' };
  }

  const fromAppointment = await prisma.appointment.findFirst({ select: { userId: true } });
  if (fromAppointment?.userId) {
    return { userId: fromAppointment.userId, source: 'appointment' };
  }

  const fromClient = await prisma.client.findFirst({ select: { userId: true } });
  if (fromClient?.userId) {
    return { userId: fromClient.userId, source: 'client' };
  }

  const fromPortfolio = await prisma.portfolioImage.findFirst({ select: { userId: true } });
  if (fromPortfolio?.userId) {
    return { userId: fromPortfolio.userId, source: 'portfolio' };
  }

  return null;
}

// GET /api/setup/stylist-id
// - Si ya existe un estilista configurado o inferible, retorna su userId.
// - Si no existe, crea un usuario dummy en Supabase y lo guarda en AppSettings.
async function getStylistId(req, res) {
  try {
    // 1. Intentar resolver estilista existente
    const existing = await resolveExistingStylistId();
    if (existing?.userId) {
      await prisma.appSettings.upsert({
        where: { id: 1 },
        create: { id: 1, primaryStylistId: existing.userId },
        update: { primaryStylistId: existing.userId },
      });

      return res.json({ userId: existing.userId, created: false, source: existing.source });
    }

    // 2. No hay estilista; crear uno dummy sólo para desarrollo
    const email = `stylist.${Date.now()}@example.dev`;
    const password = Math.random().toString(36).slice(2) + 'Aa1!';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data?.user) {
      // eslint-disable-next-line no-console
      console.error('Error creating dummy stylist in Supabase:', error);
      return res.status(500).json({ message: 'No se pudo crear el estilista dummy' });
    }

    const userId = data.user.id;

    await prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, primaryStylistId: userId },
      update: { primaryStylistId: userId },
    });

    return res.status(201).json({ userId, created: true, email, source: 'dummy' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getStylistId setup endpoint:', error);
    return res.status(500).json({ message: 'Error al obtener el estilista principal' });
  }
}

// POST /api/setup/init
// Body: { email, password, name }
// Crea un usuario en Supabase Auth y lo guarda como estilista principal.
async function initStylist(req, res) {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email y password son obligatorios' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    });

    if (error || !data?.user) {
      // eslint-disable-next-line no-console
      console.error('Error creating stylist in Supabase via init:', error);
      return res.status(500).json({ message: 'No se pudo crear el usuario en Supabase' });
    }

    const userId = data.user.id;

    await prisma.appSettings.upsert({
      where: { id: 1 },
      create: { id: 1, primaryStylistId: userId },
      update: { primaryStylistId: userId },
    });

    return res.status(201).json({ userId, email, name: name || null });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in initStylist setup endpoint:', error);
    return res.status(500).json({ message: 'Error al inicializar el estilista' });
  }
}

module.exports = {
  getStylistId,
  initStylist,
};
