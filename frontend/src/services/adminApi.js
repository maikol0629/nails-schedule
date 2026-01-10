import apiClient from './apiConfig';

const adminApi = apiClient;

// 1. Obtener citas (con filtros opcionales)
export function getAppointments(filters = {}) {
  return adminApi
    .get('/api/admin/appointments', { params: filters })
    .then((res) => res.data);
}

// 2. Confirmar cita
export function confirmAppointment(id) {
  return adminApi
    .patch(`/api/admin/appointments/${id}/confirm`)
    .then((res) => res.data);
}

// 3. Cancelar cita
export function cancelAppointment(id) {
  return adminApi
    .patch(`/api/admin/appointments/${id}/cancel`)
    .then((res) => res.data);
}

// 4. Completar cita
export function completeAppointment(id) {
  return adminApi
    .patch(`/api/admin/appointments/${id}/complete`)
    .then((res) => res.data);
}

// 5. Marcar no show
export function markNoShow(id) {
  return adminApi
    .patch(`/api/admin/appointments/${id}/no-show`)
    .then((res) => res.data);
}

// 6. Horarios de atención
export function getBusinessHours() {
  return adminApi.get('/api/admin/business-hours').then((res) => res.data);
}

export function updateBusinessHours(data) {
  return adminApi.put('/api/admin/business-hours', data).then((res) => res.data);
}

// 7. Días bloqueados
export function getBlockedDays() {
  return adminApi.get('/api/admin/blocked-days').then((res) => res.data);
}

export function createBlockedDay(data) {
  return adminApi.post('/api/admin/blocked-days', data).then((res) => res.data);
}

export function deleteBlockedDay(id) {
  return adminApi.delete(`/api/admin/blocked-days/${id}`).then((res) => res.data);
}

// 8. Perfil del estilista (admin)
export function getProfile() {
  return adminApi.get('/api/admin/profile').then((res) => res.data);
}

export function updateProfile(data) {
  return adminApi.put('/api/admin/profile', data).then((res) => res.data);
}

export default adminApi;
