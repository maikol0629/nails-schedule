import apiClient from './apiConfig';

const publicApi = apiClient;

function extractErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage && typeof apiMessage === 'string') return apiMessage;
  return fallbackMessage;
}

export async function getStylistInfo(slug) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${slug}/info`);
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

export async function getPublicServices(slug) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${slug}/services`);
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

export async function getPublicPortfolio(slug) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${slug}/portfolio`);
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

export async function getAvailableSlots(slug, date, serviceId) {
  try {
    const response = await publicApi.get(`/api/public/stylist/${slug}/available-slots`, {
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

export async function createAppointment(slug, appointmentData) {
  try {
    const response = await publicApi.post(
		`/api/public/stylist/${slug}/appointments`,
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
