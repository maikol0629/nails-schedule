import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { toast } from 'react-hot-toast';
import {
  getDashboardTodayAppointments,
  getDashboardUpcomingAppointments,
  getDashboardMonthStats,
  getClients,
  updateAppointment,
  getAdminAppointments,
  adminConfirmAppointment,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function formatTime(timeString) {
  if (!timeString) return '';
  const d = new Date(timeString);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function statusBadgeClasses(status) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-amber-100';
    case 'CONFIRMED':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-rose-100 line-through';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-100';
  }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [monthStats, setMonthStats] = useState({
    totalAppointments: 0,
    statusCounts: {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    },
    topServices: [],
  });
  const [clientsCount, setClientsCount] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [latestAppointments, setLatestAppointments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [today, upcoming, stats, clients, adminAppointments] = await Promise.all([
          getDashboardTodayAppointments(),
          getDashboardUpcomingAppointments(),
          getDashboardMonthStats(),
          getClients(),
          getAdminAppointments(),
        ]);

        if (!isMounted) return;

        setTodayAppointments(today || []);
        setUpcomingAppointments(upcoming || []);
        setMonthStats({
          totalAppointments: stats?.totalAppointments || 0,
          statusCounts: {
            PENDING: stats?.statusCounts?.PENDING || 0,
            CONFIRMED: stats?.statusCounts?.CONFIRMED || 0,
            COMPLETED: stats?.statusCounts?.COMPLETED || 0,
            CANCELLED: stats?.statusCounts?.CANCELLED || 0,
          },
          topServices: stats?.topServices || [],
        });
        setClientsCount(Array.isArray(clients) ? clients.length : 0);

        const allAppointments = Array.isArray(adminAppointments) ? adminAppointments : [];
        const withDateTime = allAppointments.map((a) => {
          const dateObj = new Date(a.date);
          const timeObj = new Date(a.time);
          const fullDate = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            timeObj.getHours(),
            timeObj.getMinutes(),
          );
          return { ...a, __fullDate: fullDate.getTime() };
        });

        withDateTime.sort((a, b) => b.__fullDate - a.__fullDate);
        setLatestAppointments(withDateTime.slice(0, 5));
      } catch (e) {
        console.error('Error loading dashboard:', e);
        if (isMounted) {
          setError('Error al cargar el dashboard');
        }
        toast.error('Error al cargar el dashboard');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextAppointment = useMemo(
    () => (upcomingAppointments && upcomingAppointments.length > 0
      ? upcomingAppointments[0]
      : null),
    [upcomingAppointments],
  );

  const pendingToConfirm = useMemo(
    () => monthStats.statusCounts?.PENDING || 0,
    [monthStats.statusCounts],
  );

  const topServicesData = useMemo(
    () => (monthStats.topServices || [])
      .slice(0, 5)
      .map((item) => ({
        name:
          item.service?.name
          || (item.serviceId != null
            ? `Servicio ${item.serviceId}`
            : 'Sin servicio'),
        count: item.count,
      })),
    [monthStats.topServices],
  );

  const reloadDashboardCore = async () => {
    const [today, upcoming, stats] = await Promise.all([
      getDashboardTodayAppointments(),
      getDashboardUpcomingAppointments(),
      getDashboardMonthStats(),
    ]);
    setTodayAppointments(today || []);
    setUpcomingAppointments(upcoming || []);
    setMonthStats({
      totalAppointments: stats?.totalAppointments || 0,
      statusCounts: {
        PENDING: stats?.statusCounts?.PENDING || 0,
        CONFIRMED: stats?.statusCounts?.CONFIRMED || 0,
        COMPLETED: stats?.statusCounts?.COMPLETED || 0,
        CANCELLED: stats?.statusCounts?.CANCELLED || 0,
      },
      topServices: stats?.topServices || [],
    });
  };

  const handleMarkCompleted = async (appointment) => {
    if (!appointment || appointment.status === 'COMPLETED') return;
    setUpdatingId(appointment.id);
    try {
      await updateAppointment(appointment.id, { status: 'COMPLETED' });
      await reloadDashboardCore();
    } catch (e) {
      console.error('Error al marcar cita como completada:', e);
      toast.error('No se pudo marcar la cita como completada');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmAppointment = async (appointment) => {
    if (!appointment || appointment.status !== 'PENDING') return;
    setUpdatingId(appointment.id);
    try {
      await adminConfirmAppointment(appointment.id);
      toast.success('Cita confirmada correctamente');
      await reloadDashboardCore();
    } catch (e) {
      console.error('Error al confirmar cita:', e);
      toast.error('No se pudo confirmar la cita');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Resumen general de tu agenda y rendimiento del mes.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <BarChart3 className="h-4 w-4" />
          <span>Vista general</span>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Cards superiores */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Citas de hoy
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loading ? '—' : todayAppointments.length}
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 p-2 text-indigo-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Citas programadas para la fecha de hoy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/appointments?status=PENDING')}
          className="group rounded-2xl border border-amber-100 bg-amber-50/80 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Citas pendientes de confirmar
              </p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">
                {loading ? '—' : pendingToConfirm}
              </p>
            </div>
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-800/80 flex items-center gap-1">
            Revisa y confirma rápidamente las nuevas reservas.
          </p>
        </button>

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Citas del mes
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loading ? '—' : monthStats.totalAppointments}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total de citas registradas en el mes actual.
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Próxima cita
              </p>
              {loading ? (
                <p className="mt-2 text-sm text-slate-500">—</p>
              ) : nextAppointment ? (
                <div className="mt-2 text-sm text-slate-900">
                  <p className="font-medium">
                    {formatDate(nextAppointment.date)}
                    {' '}
                    <span className="text-slate-500">·</span>
                    {' '}
                    {formatTime(nextAppointment.time)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {nextAppointment.client?.name || 'Sin cliente'}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No hay próximas citas.</p>
              )}
            </div>
            <div className="rounded-full bg-sky-50 p-2 text-sky-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Basado en tus próximas 5 citas programadas.
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Clientes totales
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {loading ? '—' : clientsCount}
              </p>
            </div>
            <div className="rounded-full bg-fuchsia-50 p-2 text-fuchsia-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Número total de clientes en tu base de datos.
          </p>
        </div>
      </section>

      {/* Citas de hoy y próximas citas */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Citas de hoy */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Citas de Hoy</h2>
              <p className="mt-1 text-xs text-slate-500">
                Gestiona rápidamente las citas del día en curso.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Cargando citas de hoy…" />
          ) : todayAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No tienes citas programadas para hoy.
            </p>
          ) : (
            <ul className="space-y-3">
              {todayAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {formatTime(appointment.time)}
                        {' '}
                        ·
                        {' '}
                        {appointment.client?.name || 'Sin cliente'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {appointment.service?.name || 'Sin servicio'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClasses(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status === 'PENDING' && 'Pendiente'}
                      {appointment.status === 'CONFIRMED' && 'Confirmada'}
                      {appointment.status === 'COMPLETED' && 'Completada'}
                      {appointment.status === 'CANCELLED' && 'Cancelada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {appointment.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmAppointment(appointment)}
                        disabled={updatingId === appointment.id}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {updatingId === appointment.id ? 'Guardando…' : 'Confirmar'}
                        </span>
                      </button>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(appointment)}
                        disabled={updatingId === appointment.id}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {updatingId === appointment.id
                            ? 'Guardando…'
                            : 'Marcar como completada'}
                        </span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximas citas */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Próximas Citas</h2>
              <p className="mt-1 text-xs text-slate-500">
                Vista rápida de las siguientes 5 citas.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Cargando próximas citas…" />
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay próximas citas programadas.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {upcomingAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">
                      {formatDate(appointment.date)}
                      {' '}
                      ·
                      {' '}
                      {formatTime(appointment.time)}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">
                      {appointment.client?.name || 'Sin cliente'}
                      {' '}
                      ·
                      {' '}
                      {appointment.service?.name || 'Sin servicio'}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Últimas reservas */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Últimas reservas
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Las 5 citas más recientes creadas en tu agenda.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Cargando últimas reservas…" />
        ) : latestAppointments.length === 0 ? (
          <p className="text-sm text-slate-500">No hay reservas recientes.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {latestAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">
                    {formatDate(appointment.date)}
                    {' '}
                    ·
                    {' '}
                    {formatTime(appointment.time)}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">
                    {appointment.client?.name || 'Sin cliente'}
                    {' '}
                    ·
                    {' '}
                    {appointment.service?.name || 'Sin servicio'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusBadgeClasses(
                      appointment.status,
                    )}`}
                  >
                    {appointment.status === 'PENDING' && 'Pendiente'}
                    {appointment.status === 'CONFIRMED' && 'Confirmada'}
                    {appointment.status === 'COMPLETED' && 'Completada'}
                    {appointment.status === 'CANCELLED' && 'Cancelada'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/appointments')}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Ver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Servicios más solicitados */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Servicios Más Solicitados
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Top 5 servicios por número de citas en el mes actual.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Cargando estadísticas del mes…" />
        ) : topServicesData.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay datos suficientes para mostrar esta gráfica.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
