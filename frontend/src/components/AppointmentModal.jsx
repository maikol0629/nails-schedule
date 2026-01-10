import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';

import { getClients, getServices } from '../services/api';

const STATUS_OPTIONS = [
	{ value: 'PENDING', label: 'Pendiente' },
	{ value: 'CONFIRMED', label: 'Confirmada' },
	{ value: 'COMPLETED', label: 'Completada' },
	{ value: 'CANCELLED', label: 'Cancelada' },
];

const schema = yup.object({
	clientId: yup
		.number()
		.typeError('Selecciona un cliente')
		.required('El cliente es obligatorio'),
	serviceId: yup
		.number()
		.typeError('Selecciona un servicio')
		.required('El servicio es obligatorio'),
	date: yup
		.string()
		.required('La fecha es obligatoria'),
	time: yup
		.string()
		.matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida')
		.required('La hora es obligatoria'),
	duration: yup
		.number()
		.typeError('La duración debe ser un número')
		.integer('La duración debe ser un número entero')
		.min(1, 'La duración debe ser mayor a 0')
		.required('La duración es obligatoria'),
	status: yup
		.string()
		.oneOf(STATUS_OPTIONS.map((s) => s.value))
		.required('El estado es obligatorio'),
	notes: yup.string().nullable(),
});

export default function AppointmentModal({
	isOpen,
	onClose,
	appointment,
	onSave,
	selectedDate,
}) {
	const [clients, setClients] = useState([]);
	const [services, setServices] = useState([]);
	const [loadingOptions, setLoadingOptions] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		control,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			clientId: '',
			serviceId: '',
			date: '',
			time: '',
			duration: 60,
			status: 'PENDING',
			notes: '',
		},
	});

	const watchedServiceId = useWatch({ control, name: 'serviceId' });

	useEffect(() => {
		if (!isOpen) return;

		const loadOptions = async () => {
			try {
				setLoadingOptions(true);
				const [clientsData, servicesData] = await Promise.all([
					getClients(),
					getServices(),
				]);
				setClients(clientsData);
				setServices(servicesData);
			} catch (error) {
				console.error(error);
				toast.error('Error al cargar clientes o servicios');
			} finally {
				setLoadingOptions(false);
			}
		};

		loadOptions();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		if (appointment) {
			const dateObj = new Date(appointment.date);
			const timeObj = new Date(appointment.time);

			const dateStr = dateObj.toISOString().slice(0, 10);
			const timeStr = `${timeObj.getHours().toString().padStart(2, '0')}:${timeObj
				.getMinutes()
				.toString()
				.padStart(2, '0')}`;

			reset({
				clientId: appointment.clientId,
				serviceId: appointment.serviceId,
				date: dateStr,
				time: timeStr,
				duration: appointment.duration,
				status: appointment.status,
				notes: appointment.notes || '',
			});
		} else if (selectedDate) {
			const d = selectedDate;
			const dateStr = d.toISOString().slice(0, 10);
			const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d
				.getMinutes()
				.toString()
				.padStart(2, '0')}`;

			reset({
				clientId: '',
				serviceId: '',
				date: dateStr,
				time: timeStr,
				duration: 60,
				status: 'PENDING',
				notes: '',
			});
		} else {
			reset({
				clientId: '',
				serviceId: '',
				date: '',
				time: '',
				duration: 60,
				status: 'PENDING',
				notes: '',
			});
		}
	}, [isOpen, appointment, selectedDate, reset]);

	useEffect(() => {
		if (!isOpen) return;
		if (!watchedServiceId) return;

		const service = services.find(
			(s) => s.id === Number(watchedServiceId),
		);
		if (service) {
			setValue('duration', service.durationMinutes);
		}
	}, [watchedServiceId, services, setValue, isOpen]);

	if (!isOpen) return null;

	const onSubmit = async (values) => {
		const payload = {
			clientId: Number(values.clientId),
			serviceId: Number(values.serviceId),
			date: values.date,
			time: values.time,
			status: values.status,
			notes: values.notes || null,
			duration: values.duration,
		};

		await onSave(payload);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
			<div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-card p-6 relative">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-slate-900">
						{appointment ? 'Editar cita' : 'Nueva cita'}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 text-sm"
					>
						Cerrar
					</button>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Cliente
							</label>
							<select
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								disabled={loadingOptions}
								{...register('clientId')}
							>
								<option value="">Selecciona un cliente</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{client.name}
									</option>
								))}
							</select>
							{errors.clientId && (
								<p className="mt-1 text-xs text-red-600">
									{errors.clientId.message}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Servicio
							</label>
							<select
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								disabled={loadingOptions}
								{...register('serviceId')}
							>
								<option value="">Selecciona un servicio</option>
								{services.map((service) => (
									<option key={service.id} value={service.id}>
										{service.name}
									</option>
								))}
							</select>
							{errors.serviceId && (
								<p className="mt-1 text-xs text-red-600">
									{errors.serviceId.message}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Fecha
							</label>
							<input
								type="date"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('date')}
							/>
							{errors.date && (
								<p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Hora
							</label>
							<input
								type="time"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('time')}
							/>
							{errors.time && (
								<p className="mt-1 text-xs text-red-600">{errors.time.message}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Duración (min)
							</label>
							<input
								type="number"
								min={1}
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('duration')}
							/>
							{errors.duration && (
								<p className="mt-1 text-xs text-red-600">
									{errors.duration.message}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Estado
							</label>
							<select
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('status')}
							>
								{STATUS_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
							{errors.status && (
								<p className="mt-1 text-xs text-red-600">
									{errors.status.message}
								</p>
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Notas
						</label>
						<textarea
							rows={3}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
							placeholder="Notas adicionales sobre la cita..."
							{...register('notes')}
						/>
						{errors.notes && (
							<p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Guardando...' : 'Guardar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
