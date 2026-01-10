import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

import {
  getBusinessHours,
  updateBusinessHours,
  getBlockedDays,
  createBlockedDay,
  deleteBlockedDay,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const SLOT_OPTIONS = [15, 30, 45, 60];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [daysActive, setDaysActive] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);

  const [blockedDays, setBlockedDays] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [creatingBlocked, setCreatingBlocked] = useState(false);

  const anyDayActive = useMemo(
    () => DAYS.some((d) => daysActive[d.key]),
    [daysActive],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [hours, days] = await Promise.all([
          getBusinessHours(),
          getBlockedDays(),
        ]);

        setDaysActive({
          monday: !!hours.monday,
          tuesday: !!hours.tuesday,
          wednesday: !!hours.wednesday,
          thursday: !!hours.thursday,
          friday: !!hours.friday,
          saturday: !!hours.saturday,
          sunday: !!hours.sunday,
        });

        if (hours.startTime) setStartTime(hours.startTime);
        if (hours.endTime) setEndTime(hours.endTime);
        if (hours.slotDuration) setSlotDuration(hours.slotDuration);

        setBlockedDays(days || []);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar la configuración de horarios');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleDay = (key) => {
    setDaysActive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyToAllDays = () => {
    setDaysActive({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    });
    toast.success('Horario aplicado a todos los días');
  };

  const handleSaveBusinessHours = async () => {
    try {
      setSaving(true);
      await updateBusinessHours({
        ...daysActive,
        startTime,
        endTime,
        slotDuration,
      });
      toast.success('Horarios de atención guardados');
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        'Error al guardar la configuración de horarios';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const refreshBlockedDays = async () => {
    try {
      setBlockedLoading(true);
      const days = await getBlockedDays();
      setBlockedDays(days || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los días bloqueados');
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleCreateBlockedDay = async (e) => {
    e.preventDefault();
    if (!newBlockedDate) {
      toast.error('Selecciona una fecha');
      return;
    }

    try {
      setCreatingBlocked(true);
      await createBlockedDay({
        date: newBlockedDate,
        reason: newBlockedReason || undefined,
      });
      toast.success('Día bloqueado creado');
      setModalOpen(false);
      setNewBlockedDate('');
      setNewBlockedReason('');
      await refreshBlockedDays();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Error al bloquear el día';
      toast.error(message);
    } finally {
      setCreatingBlocked(false);
    }
  };

  const handleDeleteBlockedDay = async (day) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres desbloquear el día ${format(
        new Date(day.date),
        'PPP',
        { locale: es },
      )}?`,
    );
    if (!confirmed) return;

    try {
      await deleteBlockedDay(day.id);
      toast.success('Día desbloqueado');
      await refreshBlockedDays();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Error al desbloquear el día';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Configuración de horarios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define tus horarios de atención y los días en los que no
            recibirás citas.
          </p>
        </div>
      </div>

      {loading && (
        <div className="mb-3 flex justify-start">
          <LoadingSpinner label="Cargando configuración..." />
        </div>
      )}

      {/* Horarios de atención */}
      <section className="bg-white rounded-xl shadow-card border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Horarios de atención
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Activa los días en los que atiendes y define el horario general
              y la duración de cada cita.
            </p>
          </div>
          <button
            type="button"
            onClick={handleApplyToAllDays}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Aplicar a todos los días
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DAYS.map((day) => (
            <label
              key={day.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/60"
            >
              <div>
                <span className="font-medium text-slate-800">
                  {day.label}
                </span>
                {!daysActive[day.key] && (
                  <span className="ml-2 text-[11px] text-slate-400">
                    Inactivo
                  </span>
                )}
              </div>
              <input
                type="checkbox"
                checked={!!daysActive[day.key]}
                onChange={() => handleToggleDay(day.key)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Hora de inicio
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Hora de fin
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Duración de cada cita (min)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {SLOT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} minutos
                </option>
              ))}
            </select>
          </div>
        </div>

        {!anyDayActive && (
          <p className="mt-2 text-xs text-amber-600">
            Debes tener al menos un día activo para poder recibir citas.
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveBusinessHours}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* Días bloqueados */}
      <section className="bg-white rounded-xl shadow-card border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Días bloqueados
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Usa esta sección para bloquear días completos en los que no
              aceptarás reservas (festivos, vacaciones, etc.).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
          >
            <span className="text-sm">+</span>
            Bloquear día
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-2 px-2 font-medium text-slate-500">
                  Fecha
                </th>
                <th className="text-left py-2 px-2 font-medium text-slate-500">
                  Motivo
                </th>
                <th className="text-right py-2 px-2 font-medium text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {blockedDays.length === 0 && !blockedLoading && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-4 px-2 text-center text-slate-400 text-xs"
                  >
                    No tienes días bloqueados.
                  </td>
                </tr>
              )}

              {blockedLoading && (
                <tr>
                  <td colSpan={3} className="py-3 px-2">
                    <div className="flex justify-start">
                      <LoadingSpinner label="Cargando días bloqueados..." />
                    </div>
                  </td>
                </tr>
              )}

              {blockedDays.map((day) => (
                <tr key={day.id} className="border-b border-slate-100">
                  <td className="py-2 px-2 text-slate-800">
                    {format(new Date(day.date), 'PPP', { locale: es })}
                  </td>
                  <td className="py-2 px-2 text-slate-600">
                    {day.reason || (
                      <span className="text-slate-400">Sin motivo</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteBlockedDay(day)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Bloquear día
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateBlockedDay} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  rows={3}
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Ej: Festivo, vacaciones, mantenimiento..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingBlocked}
                  className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingBlocked ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
