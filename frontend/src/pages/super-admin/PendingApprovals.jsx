import { useEffect, useState } from 'react';
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { getPendingApprovals, approveStylist, rejectStylist } from '../../services/superAdminApi';

export default function PendingApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPendingApprovals();
      setItems(res?.data || []);
    } catch (err) {
      console.error('Error loading pending approvals', err);
      setError('No se pudieron cargar las solicitudes pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveStylist(userId);
      await loadData();
    } catch (err) {
      console.error('Error approving stylist', err);
    }
  };

  const openRejectModal = (userId) => {
    setRejectingId(userId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      await rejectStylist(rejectingId, rejectReason || undefined);
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      console.error('Error rejecting stylist', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Solicitudes pendientes</h1>
          <p className="text-xs text-slate-500">
            Revisa y aprueba o rechaza nuevos registros de estilistas.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando solicitudes...
        </div>
      )}
      {error && !loading && <p className="text-sm text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/80 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Negocio</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Categoría</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Email</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Teléfono</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Fecha</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/80">
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                  No hay solicitudes pendientes.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {item.stylistProfile?.businessName || 'Sin nombre'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.stylistProfile?.ownerName || 'Propietario desconocido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {item.stylistProfile?.category || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">{item.email}</td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {item.stylistProfile?.phone || item.stylistProfile?.whatsapp || '—'}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-slate-600">
                    {new Date(item.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2 align-middle text-right text-xs">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openRejectModal(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Rechazar solicitud</h2>
              <p className="mt-1 text-xs text-slate-500">
                Indica una razón para rechazar esta solicitud (opcional).
              </p>
            </div>
            <form onSubmit={handleReject} className="space-y-4 px-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Razón</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Información incompleta, actividad sospechosa, etc."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-rose-600"
                >
                  <XCircle className="h-3 w-3" />
                  Confirmar rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
