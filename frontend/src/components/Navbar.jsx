import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scissors, Users, CalendarDays, Images, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Servicios', path: '/services', icon: Scissors },
  { name: 'Clientes', path: '/clients', icon: Users },
  { name: 'Citas', path: '/appointments', icon: CalendarDays },
  { name: 'Portafolio', path: '/portfolio', icon: Images },
];

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          NS
        </div>
        <span className="text-sm font-semibold text-slate-900">Nails Schedule</span>
      </div>
      <nav className="hidden items-center gap-2 md:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Salir</span>
      </button>
    </header>
  );
}
