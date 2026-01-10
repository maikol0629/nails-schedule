import apiClient from './apiConfig';

const publicApi = apiClient;

function extractErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage && typeof apiMessage === 'string') return apiMessage;
  return fallbackMessage;
}

export async function getStylistInfo(stylistId) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${stylistId}/info`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public stylist info:', error);
    const message = extractErrorMessage(
      error,
      'No se pudo cargar la información del estilista.',
    );
    throw new Error(message);
  }
}

export async function getPublicServices(stylistId) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${stylistId}/services`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public services:', error);
    const message = extractErrorMessage(
      error,
      'No se pudieron cargar los servicios públicos.',
    );
    throw new Error(message);
  }
}

export async function getPublicPortfolio(stylistId) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${stylistId}/portfolio`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    const message = extractErrorMessage(
      error,
      'No se pudo cargar el portafolio público.',
    );
    throw new Error(message);
  }
}

export async function getAvailableSlots(stylistId, date, serviceId) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${stylistId}/available-slots`, {
      params: { date, serviceId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available public slots:', error);
    const message = extractErrorMessage(
      error,
      'No se pudieron obtener los horarios disponibles.',
    );
    throw new Error(message);
  }
}

export async function createAppointment(stylistId, appointmentData) {
  try {
    const response = await publicApi.post(
      `/api/public/stylist/${stylistId}/appointments`,
      appointmentData,
    );
    return response.data;
  } catch (error) {
    console.error('Error creating public appointment:', error);
    const message = extractErrorMessage(
      error,
      'No se pudo crear la cita. Inténtalo de nuevo.',
    );
    throw new Error(message);
  }
}

export default publicApi;
