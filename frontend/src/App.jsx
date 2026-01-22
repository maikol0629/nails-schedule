import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import StylistLogin from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import ProfilePage from './pages/admin/ProfilePage.jsx';
import LandingPage from './pages/public/LandingPage.jsx';
import DynamicLanding from './pages/public/DynamicLanding.jsx';
import SuperAdminLogin from './pages/super-admin/Login.jsx';
import SuperAdminDashboard from './pages/super-admin/Dashboard.jsx';
import PendingApprovals from './pages/super-admin/PendingApprovals.jsx';
import StylistsList from './pages/super-admin/StylistsList.jsx';
import AuditLogs from './pages/super-admin/AuditLogs.jsx';
import StylistRegister from './pages/auth/StylistRegister.jsx';
import AccountInactive from './pages/auth/AccountInactive.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <ErrorBoundary>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/:slug" element={<DynamicLanding />} />
            <Route path="/account-inactive" element={<AccountInactive />} />

            {/* Auth estilistas */}
            <Route path="/admin/register" element={<StylistRegister />} />
            {/* Flujo actual de login puede seguir usando la pantalla existente */}
            <Route path="/admin/login" element={<StylistLogin />} />
            <Route path="/admin" element={<StylistLogin />} />

            {/* Auth super admin */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />

            {/* Super admin (requiere role SUPER_ADMIN) */}
            <Route
              path="/super-admin/dashboard"
              element={(
                <ProtectedRoute requiredRole="SUPER_ADMIN">
                  <SuperAdminLayout>
                    <SuperAdminDashboard />
                  </SuperAdminLayout>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/super-admin/pending-approvals"
              element={(
                <ProtectedRoute requiredRole="SUPER_ADMIN">
                  <SuperAdminLayout>
                    <PendingApprovals />
                  </SuperAdminLayout>
                </ProtectedRoute>
              )}
            />
            <Route
              path="/super-admin/stylists"
              element={(
                <ProtectedRoute requiredRole="SUPER_ADMIN">
                  <SuperAdminLayout>
                    <StylistsList />
                  </SuperAdminLayout>
                </ProtectedRoute>
              )}
            />
        <Route
          path="/super-admin/audit-logs"
          element={(
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <SuperAdminLayout>
                <AuditLogs />
              </SuperAdminLayout>
            </ProtectedRoute>
          )}
        />

        {/* Rutas admin protegidas */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/services"
          element={
            <ProtectedRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/portfolio"
          element={
            <ProtectedRoute>
              <Layout>
                <PortfolioPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

