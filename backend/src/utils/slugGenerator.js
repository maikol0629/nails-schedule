const prisma = require('../config/prisma');

function normalizeText(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .trim();
}

function baseSlugFromBusinessName(businessName) {
  const normalized = normalizeText(businessName);

  return normalized
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(businessName) {
  if (!businessName) {
    throw new Error('businessName es requerido para generar un slug');
  }

  try {
    let slugBase = baseSlugFromBusinessName(businessName);

    if (!slugBase) {
      slugBase = 'negocio';
    }

    let slug = slugBase;
    let suffix = 1;
    const maxAttempts = 1000;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.stylistProfile.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      suffix += 1;
      slug = `${slugBase}-${suffix}`;

      if (suffix > maxAttempts) {
        throw new Error('No se pudo generar un slug único');
      }
    }
  } catch (error) {
    console.error('[slugGenerator] Error generando slug único', error);
    throw new Error('Error al generar el slug del negocio');
  }
}

module.exports = { generateUniqueSlug };
