import apiClient from './apiConfig';

function extractErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage && typeof apiMessage === 'string') return apiMessage;
  return fallbackMessage;
}

export async function registerStylist(payload) {
  try {
    const response = await apiClient.post('/api/auth/register-stylist', payload);
    return response.data;
  } catch (error) {
    console.error('Error registering stylist:', error);
    const message = extractErrorMessage(error, 'No se pudo completar el registro. Inténtalo de nuevo.');
    throw new Error(message);
  }
}

export async function getRegistrationStatus(userId) {
  try {
    const response = await apiClient.get(`/api/auth/registration-status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching registration status:', error);
    const message = extractErrorMessage(error, 'No se pudo obtener el estado de registro.');
    throw new Error(message);
  }
}

export async function verifyWhatsAppCode({ userId, code }) {
  try {
    const response = await apiClient.post('/api/auth/verify-whatsapp', { userId, code });
    return response.data;
  } catch (error) {
    console.error('Error verifying WhatsApp code:', error);
    const message = extractErrorMessage(error, 'No se pudo verificar el código de WhatsApp.');
    throw new Error(message);
  }
}

export async function verifyEmailToken(token) {
  try {
    const response = await apiClient.get(`/api/auth/verify-email/${token}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying email token:', error);
    const message = extractErrorMessage(error, 'No se pudo verificar el email.');
    throw new Error(message);
  }
}

export default {
  registerStylist,
  getRegistrationStatus,
  verifyWhatsAppCode,
  verifyEmailToken,
};
