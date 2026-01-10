import { useEffect, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { getAuditLogs } from '../../services/superAdminApi';

function exportToCsv(rows) {
  if (!rows || rows.length === 0) return;
  const header = ['Fecha', 'Admin', 'Acción', 'Usuario objetivo', 'Metadata'];
  const csvRows = [header.join(',')];

  rows.forEach((log) => {
    const row = [
      new Date(log.createdAt).toISOString(),
      log.admin?.email || '',
      log.action || '',
      log.targetUser?.email || '',
      JSON.stringify(log.metadata || {}),
    ];
    csvRows.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'audit-logs.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('');
  const [adminId, setAdminId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...(action ? { action } : {}),
        ...(adminId ? { adminId } : {}),
        ...(targetUserId ? { targetUserId } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      };
      const res = await getAuditLogs(params);
      setItems(res?.data || []);
    } catch (err) {
      console.error('Error loading audit logs', err);
      setError('No se pudieron cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleExport = () => {
    exportToCsv(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Auditoría</h1>
          <p className="text-xs text-slate-500">
            Revisa las acciones realizadas por super admins.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
        >
          <Download className="h-3 w-3" />
          Exportar CSV
        </button>
      </div>

      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-2 rounded-xl bg-white/80 p-3 shadow-sm border border-slate-100 text-xs"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Acción</label>
          <input
            type="text"
            className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="approve, suspend..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Admin ID</label>
          <input
            type="text"
            className="h-8 w-28 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Usuario ID</label>
          <input
            type="text"
            className="h-8 w-28 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Desde</label>
          <input
            type="date"
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-600">Hasta</label>
          <input
            type="date"
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:border-emerald-500 focus:ring-emerald-500"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="ml-auto inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600"
        >
          Aplicar filtros
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando logs...
        </div>
      )}
      {error && !loading && <p className="text-sm text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/80 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Fecha</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Admin</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Acción</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Usuario</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/80">
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {new Date(log.createdAt).toLocaleString('es-ES')}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-700">
                    {log.admin?.email || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-700">{log.action}</td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-700">
                    {log.targetUser?.email || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-[11px] text-slate-600 max-w-xs">
                    <pre className="whitespace-pre-wrap break-words text-[10px] bg-slate-50 rounded px-2 py-1">
                      {JSON.stringify(log.metadata || {}, null, 2)}
                    </pre>
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
