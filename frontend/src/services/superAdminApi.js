import apiClient from './apiConfig';

const superAdminApi = apiClient;

export function getDashboardSummary() {
  return superAdminApi.get('/api/super-admin/stylists/summary').then((res) => res.data);
}

export function getStylists(params = {}) {
  return superAdminApi.get('/api/super-admin/stylists', { params }).then((res) => res.data);
}

export function getPendingApprovals(params = {}) {
  return superAdminApi
    .get('/api/super-admin/pending-approvals', { params })
    .then((res) => res.data);
}

export function approveStylist(userId) {
  return superAdminApi.post(`/api/super-admin/approve-stylist/${userId}`).then((res) => res.data);
}

export function rejectStylist(userId, reason) {
  return superAdminApi
    .post(`/api/super-admin/reject-stylist/${userId}`, { reason })
    .then((res) => res.data);
}

export function suspendStylist(userId) {
  return superAdminApi
    .patch(`/api/super-admin/suspend-stylist/${userId}`)
    .then((res) => res.data);
}

export function activateStylist(userId) {
  return superAdminApi
    .patch(`/api/super-admin/activate-stylist/${userId}`)
    .then((res) => res.data);
}

export function getAuditLogs(params = {}) {
  return superAdminApi.get('/api/super-admin/audit-logs', { params }).then((res) => res.data);
}

export default superAdminApi;
