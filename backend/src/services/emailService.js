const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const frontendUrl = process.env.FRONTEND_URL;

if (!resendApiKey) {
  console.warn('[emailService] RESEND_API_KEY no está configurada');
}

if (!frontendUrl) {
  console.warn('[emailService] FRONTEND_URL no está configurada');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildUrl(path) {
  if (!frontendUrl) return '#';
  const base = frontendUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function sendVerificationEmail(email, token, businessName) {
  if (!resend) {
    throw new Error('Servicio de email no configurado: falta RESEND_API_KEY');
  }

  try {
    const verifyUrl = buildUrl(`/verify-email?token=${encodeURIComponent(token)}`);

    const subject = 'Verifica tu correo para activar tu cuenta';
    const html = `
      <p>Hola${businessName ? `, ${businessName}` : ''} 👋</p>
      <p>Gracias por registrarte en tu agenda de citas.</p>
      <p>Por favor, haz clic en el siguiente enlace para verificar tu correo:</p>
      <p><a href="${verifyUrl}">Verificar correo</a></p>
      <p>Si no solicitaste este registro, puedes ignorar este mensaje.</p>
    `;

    await resend.emails.send({
      from: 'noreply@nails-schedule.app',
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error('[emailService] Error enviando email de verificación', error);
    throw new Error('No se pudo enviar el email de verificación');
  }
}

async function sendApprovalEmail(email, businessName, slug) {
  if (!resend) {
    throw new Error('Servicio de email no configurado: falta RESEND_API_KEY');
  }

  try {
    const publicPageUrl = buildUrl(`/s/${encodeURIComponent(slug)}`);

    const subject = 'Tu cuenta ha sido aprobada 🎉';
    const html = `
      <p>Hola${businessName ? `, ${businessName}` : ''} 👋</p>
      <p>Tu cuenta ha sido aprobada y ya puedes empezar a recibir reservas.</p>
      <p>Puedes compartir tu página pública con tus clientes:</p>
      <p><a href="${publicPageUrl}">${publicPageUrl}</a></p>
    `;

    await resend.emails.send({
      from: 'noreply@nails-schedule.app',
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error('[emailService] Error enviando email de aprobación', error);
    throw new Error('No se pudo enviar el email de aprobación');
  }
}

async function sendRejectionEmail(email, businessName, reason) {
  if (!resend) {
    throw new Error('Servicio de email no configurado: falta RESEND_API_KEY');
  }

  try {
    const subject = 'Actualización sobre tu cuenta';
    const html = `
      <p>Hola${businessName ? `, ${businessName}` : ''} 👋</p>
      <p>Después de revisar tu solicitud, por ahora no podemos aprobar tu cuenta.</p>
      ${reason ? `<p>Motivo: ${reason}</p>` : ''}
      <p>Si crees que se trata de un error, responde a este mensaje para que podamos revisarlo nuevamente.</p>
    `;

    await resend.emails.send({
      from: 'noreply@nails-schedule.app',
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error('[emailService] Error enviando email de rechazo', error);
    throw new Error('No se pudo enviar el email de rechazo');
  }
}

module.exports = {
  sendVerificationEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};
