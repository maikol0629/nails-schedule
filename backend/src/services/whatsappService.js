const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // formato: whatsapp:+123456789

let twilioClient = null;

if (!accountSid || !authToken) {
  console.warn('[whatsappService] TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no están configurados');
} else {
  try {
    if (!accountSid.startsWith('AC')) {
      console.error(
        '[whatsappService] TWILIO_ACCOUNT_SID debe ser el Account SID de Twilio (comienza con "AC"), se deshabilita WhatsApp',
      );
    } else {
      twilioClient = twilio(accountSid, authToken);
    }
  } catch (error) {
    console.error('[whatsappService] Error inicializando cliente de Twilio, se deshabilita WhatsApp:', error.message);
    twilioClient = null;
  }
}

if (!whatsappFrom) {
  console.warn('[whatsappService] TWILIO_WHATSAPP_FROM no está configurado');
}

function generateVerificationCode() {
  // Código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

async function sendWhatsAppCode(phoneNumber, code) {
  if (!twilioClient) {
    throw new Error('Servicio de WhatsApp no configurado: faltan credenciales de Twilio');
  }

  if (!whatsappFrom) {
    throw new Error('Servicio de WhatsApp no configurado: falta TWILIO_WHATSAPP_NUMBER');
  }

  if (!phoneNumber) {
    throw new Error('Número de teléfono destinatario requerido');
  }

  try {
    const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;

    const body = `Tu código de verificación es: ${code}`;

    await twilioClient.messages.create({
      from: whatsappFrom,
      to,
      body,
    });
  } catch (error) {
    console.error('[whatsappService] Error enviando código de WhatsApp', error);
    throw new Error('No se pudo enviar el código de verificación por WhatsApp');
  }
}

module.exports = {
  generateVerificationCode,
  sendWhatsAppCode,
};
