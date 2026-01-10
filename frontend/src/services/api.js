import apiClient from './apiConfig';

export function getServices() {
  return apiClient.get('/api/services').then((res) => res.data);
}

export function getServiceById(id) {
  return apiClient.get(`/api/services/${id}`).then((res) => res.data);
}

export function createService(data) {
  return apiClient.post('/api/services', data).then((res) => res.data);
}

export function updateService(id, data) {
  return apiClient.put(`/api/services/${id}`, data).then((res) => res.data);
}

export function deleteService(id) {
  return apiClient.delete(`/api/services/${id}`).then((res) => res.data);
}

// Clients
export function getClients() {
  return apiClient.get('/api/clients').then((res) => res.data);
}

export function getClientById(id) {
  return apiClient.get(`/api/clients/${id}`).then((res) => res.data);
}

export function createClient(data) {
  return apiClient.post('/api/clients', data).then((res) => res.data);
}

export function updateClient(id, data) {
  return apiClient.put(`/api/clients/${id}`, data).then((res) => res.data);
}

export function deleteClient(id) {
  return apiClient.delete(`/api/clients/${id}`).then((res) => res.data);
}

// Appointments
export function getAppointments(params = {}) {
  return apiClient.get('/api/appointments', { params }).then((res) => res.data);
}

export function getAppointmentsByRange(startDate, endDate) {
  return api
    .get('/api/appointments/range', {
      params: { start: startDate, end: endDate },
    })
    .then((res) => res.data);
}

export function createAppointment(data) {
  return apiClient.post('/api/appointments', data).then((res) => res.data);
}

export function updateAppointment(id, data) {
  return apiClient.put(`/api/appointments/${id}`, data).then((res) => res.data);
}

export function deleteAppointment(id) {
  return apiClient.delete(`/api/appointments/${id}`).then((res) => res.data);
}

// Admin - Appointments management
export function getAdminAppointments(params = {}) {
  return apiClient.get('/api/admin/appointments', { params }).then((res) => res.data);
}

export function adminConfirmAppointment(id) {
  return apiClient.patch(`/api/admin/appointments/${id}/confirm`).then((res) => res.data);
}

export function adminCancelAppointment(id) {
  return apiClient.patch(`/api/admin/appointments/${id}/cancel`).then((res) => res.data);
}

export function adminCompleteAppointment(id) {
  return apiClient.patch(`/api/admin/appointments/${id}/complete`).then((res) => res.data);
}

export function adminMarkNoShow(id) {
  return apiClient.patch(`/api/admin/appointments/${id}/no-show`).then((res) => res.data);
}

// Admin - Business hours
export function getBusinessHours() {
  return apiClient.get('/api/admin/business-hours').then((res) => res.data);
}

export function updateBusinessHours(data) {
  return apiClient.put('/api/admin/business-hours', data).then((res) => res.data);
}

// Admin - Blocked days
export function getBlockedDays() {
  return apiClient.get('/api/admin/blocked-days').then((res) => res.data);
}

export function createBlockedDay(data) {
  return apiClient.post('/api/admin/blocked-days', data).then((res) => res.data);
}

export function deleteBlockedDay(id) {
  return apiClient.delete(`/api/admin/blocked-days/${id}`).then((res) => res.data);
}

// Dashboard
export function getDashboardTodayAppointments() {
  return apiClient.get('/api/dashboard/today').then((res) => res.data);
}

export function getDashboardUpcomingAppointments() {
  return apiClient.get('/api/dashboard/upcoming').then((res) => res.data);
}

export function getDashboardMonthStats() {
  return apiClient.get('/api/dashboard/month-stats').then((res) => res.data);
}

// Portfolio
export function getPortfolioImages() {
  return apiClient.get('/api/portfolio').then((res) => res.data);
}

export function createPortfolioImage(data) {
  return apiClient.post('/api/portfolio', data).then((res) => res.data);
}

export function deletePortfolioImage(id) {
  return apiClient.delete(`/api/portfolio/${id}`).then((res) => res.data);
}

export default apiClient;
