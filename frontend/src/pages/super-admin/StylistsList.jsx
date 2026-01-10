import { useEffect, useState } from 'react';
import { Loader2, ExternalLink, PauseCircle, PlayCircle } from 'lucide-react';
import { getStylists, suspendStylist, activateStylist } from '../../services/superAdminApi';

export default function StylistsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStylists({ status, category, search });
      setItems(res?.data || []);
    } catch (err) {
      console.error('Error loading stylists list', err);
      setError('No se pudieron cargar los estilistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.status === 'ACTIVE') {
        await suspendStylist(user.id);
      } else {
        await activateStylist(user.id);
      }
      await loadData();
    } catch (err) {
      console.error('Error updating stylist status', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Estilistas</h1>
          <p className="text-xs text-slate-500">
            Consulta y administra todas las cuentas de estilistas.
          </p>
        </div>
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm border border-slate-100"
        >
          <input
            type="text"
            placeholder="Buscar por nombre o negocio"
            className="h-7 w-40 sm:w-56 border-0 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="h-7 rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="PENDING_APPROVAL">Pendientes</option>
            <option value="SUSPENDED">Suspendidos</option>
            <option value="DEACTIVATED">Desactivados</option>
          </select>
          <select
            className="h-7 rounded-full border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            <option value="BARBERSHOP">Barbería</option>
            <option value="HAIR_SALON">Peluquería</option>
            <option value="NAIL_SPA">Uñas y spa</option>
          </select>
          <button
            type="submit"
            className="ml-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-600"
          >
            Buscar
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando estilistas...
        </div>
      )}
      {error && !loading && <p className="text-sm text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/80 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Negocio</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Dueño</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Categoría</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Creación</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/80">
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                  No se encontraron estilistas.
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {user.stylistProfile?.businessName || 'Sin nombre'}
                      </span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {user.stylistProfile?.ownerName || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {user.stylistProfile?.category || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2 align-middle text-right text-xs">
                    <div className="inline-flex items-center gap-1">
                      {user.stylistProfile?.slug && (
                        <a
                          href={`/${user.stylistProfile.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100"
                      >
                        {user.status === 'ACTIVE' ? (
                          <PauseCircle className="h-4 w-4" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
