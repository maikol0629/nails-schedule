import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, CheckCircle2, Layers, Loader2 } from 'lucide-react';
import { getDashboardSummary, getPendingApprovals } from '../../services/superAdminApi';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [latestRequests, setLatestRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, pendingRes] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getPendingApprovals({ page: 1, pageSize: 5 }).catch(() => null),
        ]);

        setSummary(summaryRes || null);
        setLatestRequests(pendingRes?.data || []);
      } catch (err) {
        console.error('Error loading super admin dashboard', err);
        setError('No se pudo cargar el dashboard de super admin');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const cards = [
    {
      label: 'Activos',
      value: summary?.totalActive ?? '—',
      icon: Users,
      description: 'Estilistas con cuenta activa',
    },
    {
      label: 'Pendientes aprobación',
      value: summary?.totalPendingApproval ?? '—',
      icon: Clock,
      description: 'En cola para revisión',
    },
    {
      label: 'Nuevos (7 días)',
      value: summary?.newLast7Days ?? '—',
      icon: CheckCircle2,
      description: 'Altas recientes',
    },
    {
      label: 'Categorías activas',
      value: summary?.byCategory?.length ?? '—',
      icon: Layers,
      description: 'Tipos de negocio',
    },
  ];

  const monthlyData = summary?.registrationsByMonth || [];

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando datos del panel...
        </div>
      )}
      {error && !loading && <p className="text-sm text-rose-600">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-slate-500">{card.description}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Registros de estilistas por mes
              </h2>
              <p className="text-xs text-slate-500">Últimos 12 meses</p>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <p className="text-xs text-slate-500">Sin datos suficientes aún.</p>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} registros`, 'Altas']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Últimas solicitudes</h2>
          </div>
          {latestRequests.length === 0 ? (
            <p className="text-xs text-slate-500">No hay solicitudes pendientes.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {latestRequests.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">
                      {item.stylistProfile?.businessName || 'Negocio sin nombre'}
                    </p>
                    <span className="text-[11px] rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.email} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
