const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const frontendUrl = process.env.FRONTEND_URL;
const emailFrom = process.env.EMAIL_FROM;

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
      from: emailFrom,
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
      from: emailFrom,
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
  sendApprovalEmail,
  sendRejectionEmail,
};
