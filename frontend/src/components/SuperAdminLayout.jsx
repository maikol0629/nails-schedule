import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileClock,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Solicitudes', path: '/super-admin/pending-approvals', icon: ShieldCheck },
  { name: 'Estilistas', path: '/super-admin/stylists', icon: Users },
  { name: 'Auditoría', path: '/super-admin/audit-logs', icon: FileClock },
  { name: 'Configuración', path: '/super-admin/settings', icon: Settings },
];

function getPageTitle(pathname) {
  const item = navItems.find((nav) => nav.path === pathname);
  if (item) return item.name;
  return 'Super Admin';
}

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);
  const displayName = user?.email || 'Super Admin';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const renderNavLinks = (onClick) => (
    <nav className="mt-6 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={({ isActive }) =>
              [
                'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 px-4 py-4 backdrop-blur lg:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            SA
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Nails Schedule</span>
            <span className="text-xs text-slate-500">Panel Super Admin</span>
          </div>
        </div>

        {renderNavLinks()}

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  SA
                </div>
                <span className="text-sm font-semibold text-slate-900">Super Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {renderNavLinks(() => setSidebarOpen(false))}

            <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-slate-900">{pageTitle}</h1>
              <p className="text-xs text-slate-500">Panel de administración global.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col text-right text-xs sm:flex">
              <span className="font-medium text-slate-900">{displayName}</span>
              <span className="text-slate-500">Super Admin</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-8">
          <div className="mx-auto max-w-6xl pt-4 sm:pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
