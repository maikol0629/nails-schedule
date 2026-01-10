import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { addMinutes, isBefore, isAfter, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import { toast } from 'react-hot-toast';

import {
  createAppointment,
  updateAppointment,
  getAdminAppointments,
  adminConfirmAppointment,
  adminCancelAppointment,
  adminCompleteAppointment,
  adminMarkNoShow,
} from '../services/api';
import AppointmentModal from '../components/AppointmentModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function extractDateParts(dateValue) {
  if (!dateValue) {
    return { year: 1970, month: 0, day: 1 };
  }

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) {
    return { year: 1970, month: 0, day: 1 };
  }

  // Usamos los componentes UTC porque en backend se normaliza la fecha a UTC
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

function extractTimeParts(timeValue) {
  if (!timeValue) return { hours: 0, minutes: 0 };

  // Si viene como Date
  if (timeValue instanceof Date) {
    return {
      hours: timeValue.getHours(),
      minutes: timeValue.getMinutes(),
    };
  }

  if (typeof timeValue === 'string') {
    // Intentar parsear como fecha completa (ISO u otro formato válido)
    const asDate = new Date(timeValue);
    if (!Number.isNaN(asDate.getTime())) {
      return {
        hours: asDate.getHours(),
        minutes: asDate.getMinutes(),
      };
    }

    // Fallback para formato "HH:MM"
    const [h, m] = timeValue.split(':').map((x) => parseInt(x, 10));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      return { hours: h, minutes: m };
    }
  }

  return { hours: 0, minutes: 0 };
}

function mapAppointmentsToEvents(appointments) {
  return appointments.map((a) => {
    const { year, month, day } = extractDateParts(a.date);
		const { hours, minutes } = extractTimeParts(a.time);

    const start = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      0,
      0,
    );

    const end = new Date(start.getTime() + a.duration * 60000);

    const clientName = a.client?.name || 'Sin cliente';
    const serviceName = a.service?.name || 'Sin servicio';

    return {
      id: a.id,
      title: `${clientName} - ${serviceName}`,
      start,
      end,
      resource: a,
    };
  });
}

const eventPropGetter = (event) => {
  const status = event.resource?.status || 'PENDING';
  return {
    className: `rbc-event-status-${status}`,
  };
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No se presentó',
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];
function AppointmentDetailModal({ appointment, onClose, onAction }) {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!appointment) return null;

  // Construimos un Date completo a partir de la fecha (Date/ISO) y la hora HH:MM.
  const baseDate = appointment.date instanceof Date
    ? appointment.date
    : new Date(appointment.date);
  const { hours, minutes } = extractTimeParts(appointment.time);
  const appointmentDateTime = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0,
  );
  const appointmentEndTime = addMinutes(appointmentDateTime, appointment.duration || 0);
  const noShowThreshold = addMinutes(appointmentDateTime, 15);

  const now = new Date();
  const terminalStates = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
  const isTerminal = terminalStates.includes(appointment.status);

  const availability = {
    canConfirm:
      !isTerminal &&
      appointment.status === 'PENDING' &&
      isBefore(now, appointmentDateTime),
    canComplete:
      !isTerminal &&
      ['CONFIRMED', 'PENDING'].includes(appointment.status) &&
      isAfter(now, appointmentEndTime),
    canMarkNoShow:
      !isTerminal &&
      ['CONFIRMED', 'PENDING'].includes(appointment.status) &&
      isAfter(now, noShowThreshold),
    canCancel: !['COMPLETED', 'NO_SHOW'].includes(appointment.status),
    messages: {
      confirm: isBefore(now, appointmentDateTime)
        ? 'Confirmar cita'
        : 'La cita ya pasó',
      complete: isAfter(now, appointmentEndTime)
        ? 'Marcar como completada'
        : `Disponible después de las ${appointmentEndTime.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
      noShow: isAfter(now, noShowThreshold)
        ? 'Cliente no se presentó'
        : `Disponible después de las ${noShowThreshold.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
      cancel: 'Cancelar cita',
    },
    timeUntilEnd: isBefore(now, appointmentEndTime)
      ? formatDistanceToNow(appointmentEndTime, { addSuffix: true, locale: es })
      : null,
    timeUntilNoShow: isBefore(now, noShowThreshold)
      ? formatDistanceToNow(noShowThreshold, { addSuffix: true, locale: es })
      : null,
  };

  const { year, month, day } = extractDateParts(appointment.date);
  const dateStr = format(new Date(year, month, day), 'PPP', { locale: es });
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;

  const handleClick = async (type) => {
    try {
      setLoadingAction(true);
      await onAction(type);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-card p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Detalle de cita</h2>
            <p className="text-xs text-slate-500 mt-1">Gestiona el estado de las citas reservadas por tus clientas.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Estado:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold rbc-event-status-${appointment.status}`}
            >
              {STATUS_LABELS[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Cita
              </h3>
              <p className="text-slate-900">{dateStr}</p>
              <p className="text-slate-700">{timeStr}</p>
              <p className="text-slate-500 mt-1">Duración: {appointment.duration} minutos</p>
              {appointment.notes && (
                <p className="mt-2 text-slate-600">
                  <span className="font-medium">Notas: </span>
                  {appointment.notes}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Cliente
              </h3>
              <p className="text-slate-900">{appointment.client?.name || 'Sin cliente'}</p>
              {appointment.client?.phone && (
                <p className="text-slate-700">Tel: {appointment.client.phone}</p>
              )}
              {appointment.client?.email && (
                <p className="text-slate-500 text-xs">{appointment.client.email}</p>
              )}

              <h3 className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Servicio
              </h3>
              <p className="text-slate-900">{appointment.service?.name || 'Sin servicio'}</p>
            </div>
          </div>
        </div>

        {availability.timeUntilEnd && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            ⏰ La cita termina {availability.timeUntilEnd}
          </div>
        )}

        {availability.timeUntilNoShow && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⏰ Podrás marcar "No se presentó" {availability.timeUntilNoShow}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {appointment.status === 'PENDING' && (
            <ActionButton
              label={availability.messages.confirm}
              onClick={() => handleClick('confirm')}
              disabled={!availability.canConfirm || loadingAction}
              variant="primary"
              tooltip={!availability.canConfirm ? availability.messages.confirm : null}
            />
          )}

          {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
            <>
              <ActionButton
                label={availability.messages.complete}
                onClick={() => handleClick('complete')}
                disabled={!availability.canComplete || loadingAction}
                variant="success"
                tooltip={!availability.canComplete ? availability.messages.complete : null}
              />

              <ActionButton
                label={availability.messages.noShow}
                onClick={() => handleClick('no-show')}
                disabled={!availability.canMarkNoShow || loadingAction}
                variant="warning"
                tooltip={!availability.canMarkNoShow ? availability.messages.noShow : null}
              />
            </>
          )}

          {availability.canCancel && (
            <ActionButton
              label={availability.messages.cancel}
              onClick={() => handleClick('cancel')}
              disabled={loadingAction}
              variant="danger"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, variant, tooltip }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-500',
    warning: 'bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500',
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-3 py-1.5 text-xs rounded-lg text-white font-medium transition ${variants[variant]}`}
      >
        {label}
      </button>
      {disabled && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0);

  const loadAppointmentsForMonth = useCallback(async (baseDate, { silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);

      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);

      const data = await getAdminAppointments();

      const monthAppointments = data.filter((a) => {
        const d = new Date(a.date);
        return d >= start && d <= end;
      });

      setAppointments(monthAppointments);

      const newPendingCount = monthAppointments.filter((a) => a.status === 'PENDING').length;
      if (pendingCountRef.current && newPendingCount > pendingCountRef.current) {
        toast.success('Tienes nuevas citas pendientes');
      }
      pendingCountRef.current = newPendingCount;
      setPendingCount(newPendingCount);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las citas');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointmentsForMonth(currentDate);
  }, [currentDate, loadAppointmentsForMonth]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAppointmentsForMonth(currentDate, { silent: true });
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate, loadAppointmentsForMonth]);

  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedAppointment(null);
    setSelectedSlotDate(slotInfo.start);
    setModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedSlotDate(null);
    setSelectedAppointment(event.resource);
    setDetailModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setSelectedSlotDate(null);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSaveAppointment = async (values) => {
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, values);
        toast.success('Cita actualizada correctamente');
      } else {
        await createAppointment(values);
        toast.success('Cita creada correctamente');
      }

      handleCloseModal();
      await loadAppointmentsForMonth(currentDate);
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Error al guardar la cita';
      toast.error(message);
    }
  };

  const handleDeleteAppointment = async (event) => {
    // Eliminación directa deshabilitada en modo admin
    return event;
  };

  const handleAdminAction = async (action) => {
    if (!selectedAppointment) return;

    try {
      if (action === 'confirm') {
        await adminConfirmAppointment(selectedAppointment.id);
        toast.success('Cita confirmada correctamente');
      } else if (action === 'cancel') {
        await adminCancelAppointment(selectedAppointment.id);
        toast.success('Cita cancelada correctamente');
      } else if (action === 'complete') {
        await adminCompleteAppointment(selectedAppointment.id);
        toast.success('Cita completada correctamente');
      } else if (action === 'no-show') {
        await adminMarkNoShow(selectedAppointment.id);
        toast.success('Cita marcada como no presentada');
      } else {
        return;
      }

      await loadAppointmentsForMonth(currentDate);
      setDetailModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error(error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Error al realizar la acción';
      toast.error(errorMessage);
    }
  };

  const components = useMemo(
    () => ({
      event: (props) => (
        <div className="flex flex-col text-[11px] leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold truncate">{props.event.resource?.client?.name || 'Sin cliente'}</span>
            {props.event.resource?.status && (
              <span className="shrink-0 rounded-full px-1 py-0.5 text-[9px] font-semibold bg-white/80 text-slate-700">
                {STATUS_LABELS[props.event.resource.status] || props.event.resource.status}
              </span>
            )}
          </div>
          {props.event?.resource?.client?.phone && (
            <div className="truncate text-[10px] text-slate-700">
              {props.event.resource.client.phone}
            </div>
          )}
          {props.event?.resource?.service && (
            <div className="truncate text-[10px] text-slate-600">
              {props.event.resource.service.name}
            </div>
          )}
        </div>
      ),
    }),
    [],
  );

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'ALL') return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const events = useMemo(
    () => mapAppointmentsToEvents(filteredAppointments),
    [filteredAppointments],
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Calendario de citas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualiza y gestiona las citas creadas por tus clientas.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">Pendientes</span>
            <span
              className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full text-xs font-semibold px-2 ${
                pendingCount > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {pendingCount}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mb-3 flex justify-start">
          <LoadingSpinner label="Cargando citas..." />
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        style={{ height: '75vh' }}
        culture="es"
        views={['month', 'week', 'day', 'agenda']}
        defaultView="week"
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        onView={(nextView) => setView(nextView)}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        components={components}
        popup
      />

      <AppointmentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        selectedDate={selectedSlotDate}
      />

      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={handleCloseDetailModal}
        onAction={handleAdminAction}
        isOpen={detailModalOpen}
      />
    </div>
  );
}

