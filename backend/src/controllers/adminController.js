const { PrismaClient } = require('@prisma/client');
const { addMinutes, isBefore, isAfter } = require('date-fns');
const { generateUniqueSlug } = require('../utils/slugGenerator');

const prisma = new PrismaClient();

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

// Valida si una acción sobre una cita es permitida según su estado actual
// y la combinación de fecha/hora/duración.
function validateAppointmentAction(appointment, action) {
	const now = new Date();

	// `appointment.date` viene de Prisma como Date. Construimos un Date completo
	// combinando esa fecha (día/mes/año) con la hora en formato "HH:MM" almacenada en `appointment.time`.
	const baseDate = appointment.date instanceof Date
		? appointment.date
		: new Date(appointment.date);

	let year = baseDate.getFullYear();
	let month = baseDate.getMonth();
	let day = baseDate.getDate();

	// Extraemos hora y minutos desde el string HH:MM (si está disponible).
	let hours = 0;
	let minutes = 0;
	if (typeof appointment.time === 'string') {
		const parts = appointment.time.split(':').map((x) => parseInt(x, 10));
		if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
			[hours, minutes] = parts;
		}
	}

	const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0);
	const durationMinutes = Number.isFinite(appointment.duration)
		? appointment.duration
		: 0;

	const appointmentEndTime = addMinutes(appointmentDateTime, durationMinutes);
	const noShowThreshold = addMinutes(appointmentDateTime, 15);

	// Estados finales que no permiten más cambios
	const terminalStates = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
	if (terminalStates.includes(appointment.status)) {
		return {
			allowed: false,
			message: 'Esta cita ya ha sido finalizada y no puede modificarse',
		};
	}

	switch (action) {
		case 'CONFIRM': {
			if (isAfter(now, appointmentDateTime)) {
				return {
					allowed: false,
					message: 'No puedes confirmar una cita que ya pasó',
				};
			}

			if (appointment.status !== 'PENDING') {
				return {
					allowed: false,
					message: 'Solo las citas pendientes pueden ser confirmadas',
				};
			}

			return { allowed: true };
		}

		case 'COMPLETE': {
			if (isBefore(now, appointmentEndTime)) {
				const endTimeStr = appointmentEndTime.toLocaleTimeString('es-CO', {
					hour: '2-digit',
					minute: '2-digit',
				});
				return {
					allowed: false,
					message: `La cita aún no ha terminado. Podrás marcarla como completada después de las ${endTimeStr}`,
				};
			}

			if (!['CONFIRMED', 'PENDING'].includes(appointment.status)) {
				return {
					allowed: false,
					message: 'Solo las citas confirmadas o pendientes pueden marcarse como completadas',
				};
			}

			return { allowed: true };
		}

		case 'NO_SHOW': {
			if (isBefore(now, noShowThreshold)) {
				const thresholdStr = noShowThreshold.toLocaleTimeString('es-CO', {
					hour: '2-digit',
					minute: '2-digit',
				});
				return {
					allowed: false,
					message: `Debes esperar hasta 15 minutos después de la hora agendada (${thresholdStr})`,
				};
			}

			if (!['CONFIRMED', 'PENDING'].includes(appointment.status)) {
				return {
					allowed: false,
					message: 'Solo las citas confirmadas o pendientes pueden marcarse como no-show',
				};
			}

			return { allowed: true };
		}

		case 'CANCEL': {
			if (['COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
				return {
					allowed: false,
					message: 'No puedes cancelar una cita que ya fue completada o marcada como no-show',
				};
			}

			return { allowed: true };
		}

		default:
			return { allowed: false, message: 'Acción no válida' };
	}
}

function parseDateOnly(dateStr) {
	if (!dateStr) return null;

	// Esperamos formato "YYYY-MM-DD" para filtros/estadísticas.
	const parts = String(dateStr).split('-').map((x) => parseInt(x, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
	const [year, month, day] = parts;

	// Usamos mediodía UTC para mantener coherencia con el almacenamiento de fechas.
	return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Perfil del estilista autenticado
async function getProfile(req, res) {
	try {
		const profile = await prisma.stylistProfile.findUnique({
			where: { userId: req.userId },
		});

		if (profile) {
			return res.json(profile);
		}

		// Si no existe perfil aún, devolvemos un objeto base para inicializar en el frontend.
		return res.json({
			userId: req.userId,
			name: 'Stylist',
			bio: null,
			phone: null,
			email: null,
			instagram: null,
			address: null,
			photoUrl: null,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching stylist profile (admin):', error);
		return res.status(500).json({ message: 'Error al obtener el perfil del estilista' });
	}
}

async function updateProfile(req, res) {
	const {
		name,
		bio,
		phone,
		email,
		instagram,
		address,
		photoUrl,
		city,
		country,
	} = req.body || {};

	try {
		const safeName = (typeof name === 'string' && name.trim()) || 'Stylist';
		const slug = await generateUniqueSlug(safeName);

		const profile = await prisma.stylistProfile.upsert({
			where: { userId: req.userId },
			create: {
				userId: req.userId,
				businessName: safeName,
				ownerName: safeName,
				category: 'NAIL_SPA',
				slug,
				name: safeName,
				bio: bio || null,
				phone: phone || null,
				email: email || null,
				instagram: instagram || null,
				address: address || null,
				photoUrl: photoUrl || null,
				city: city || null,
				country: country || 'Colombia',
			},
			update: {
				// Usamos nullish coalescing para permitir enviar null explícito si se desea borrar un campo.
				name: name ?? undefined,
				bio: bio ?? undefined,
				phone: phone ?? undefined,
				email: email ?? undefined,
				instagram: instagram ?? undefined,
				address: address ?? undefined,
				photoUrl: photoUrl ?? undefined,
				city: city ?? undefined,
				country: country ?? undefined,
			},
		});

		return res.json(profile);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error updating stylist profile (admin):', error);
		return res.status(500).json({ message: 'Error al guardar el perfil del estilista' });
	}
}

// 1. Obtener citas del estilista autenticado
async function getAppointments(req, res) {
	const { status, date } = req.query;

	try {
		const where = { userId: req.userId };

		if (status) {
			if (!APPOINTMENT_STATUSES.includes(status)) {
				return res.status(400).json({ message: 'Estado de cita inválido' });
			}
			where.status = status;
		}

		if (date) {
			const parsedDate = parseDateOnly(date);
			if (!parsedDate) {
				return res.status(400).json({ message: 'Fecha inválida' });
			}
			where.date = parsedDate;
		}

		const appointments = await prisma.appointment.findMany({
			where,
			include: {
				client: true,
				service: true,
			},
			orderBy: [
				{ date: 'asc' },
				{ time: 'asc' },
			],
		});

		return res.json(appointments);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching admin appointments:', error);
		return res.status(500).json({ message: 'Error al obtener las citas' });
	}
}

async function updateAppointmentStatus(req, res, targetStatus, options = {}) {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({ message: 'ID de cita inválido' });
	}

	try {
		const appointment = await prisma.appointment.findFirst({
			where: { id, userId: req.userId },
		});

		if (!appointment) {
			return res.status(404).json({ message: 'Cita no encontrada' });
		}

		if (options.onlyFromStatus && appointment.status !== options.onlyFromStatus) {
			return res.status(400).json({
				message: `Solo se pueden cambiar a ${targetStatus} las citas en estado ${options.onlyFromStatus}`,
			});
		}

		// Validación adicional basada en fecha/hora/estado.
		const validation = validateAppointmentAction(appointment, options.action || targetStatus);
		if (!validation.allowed) {
			return res.status(400).json({
				message: validation.message,
				canPerformAction: false,
			});
		}

		const updated = await prisma.appointment.update({
			where: { id },
			data: { status: targetStatus },
		});

		return res.json(updated);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(`Error updating appointment status to ${targetStatus}:`, error);
		return res.status(500).json({ message: 'Error al actualizar el estado de la cita' });
	}
}

// 2. Confirmar cita (PENDING -> CONFIRMED)
async function confirmAppointment(req, res) {
	return updateAppointmentStatus(req, res, 'CONFIRMED', {
		onlyFromStatus: 'PENDING',
		action: 'CONFIRM',
	});
}

// 3. Cancelar cita
async function cancelAppointment(req, res) {
	return updateAppointmentStatus(req, res, 'CANCELLED', { action: 'CANCEL' });
}

// 4. Completar cita
async function completeAppointment(req, res) {
	return updateAppointmentStatus(req, res, 'COMPLETED', { action: 'COMPLETE' });
}

// 5. Marcar no show
async function markNoShow(req, res) {
	return updateAppointmentStatus(req, res, 'NO_SHOW', { action: 'NO_SHOW' });
}

// 6. Obtener configuración de horarios
async function getBusinessHours(req, res) {
	try {
		const config = await prisma.businessHours.findFirst({
			where: { userId: req.userId },
		});

		if (config) {
			return res.json(config);
		}

		// Valores por defecto si no existe configuración
		const defaults = {
			userId: req.userId,
			monday: true,
			tuesday: true,
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: true,
			sunday: false,
			startTime: '09:00',
			endTime: '18:00',
			slotDuration: 30,
		};

		return res.json(defaults);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching business hours:', error);
		return res
			.status(500)
			.json({ message: 'Error al obtener la configuración de horarios' });
	}
}

// 7. Crear o actualizar configuración de horarios
async function updateBusinessHours(req, res) {
	const {
		monday,
		tuesday,
		wednesday,
		thursday,
		friday,
		saturday,
		sunday,
		startTime,
		endTime,
		slotDuration,
	} = req.body;

	// Validaciones básicas
	const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
	if (!startTime || !timeRegex.test(startTime) || !endTime || !timeRegex.test(endTime)) {
		return res.status(400).json({ message: 'startTime y endTime deben tener formato HH:MM' });
	}

	const slot = parseInt(slotDuration, 10);
	if (Number.isNaN(slot) || slot <= 0) {
		return res.status(400).json({ message: 'slotDuration debe ser un número positivo' });
	}

	try {
		const existing = await prisma.businessHours.findFirst({
			where: { userId: req.userId },
		});

		const data = {
			monday: Boolean(monday),
			tuesday: Boolean(tuesday),
			wednesday: Boolean(wednesday),
			thursday: Boolean(thursday),
			friday: Boolean(friday),
			saturday: Boolean(saturday),
			sunday: Boolean(sunday),
			startTime,
			endTime,
			slotDuration: slot,
		};

		let result;
		if (existing) {
			result = await prisma.businessHours.update({
				where: { id: existing.id },
				data,
			});
		} else {
			result = await prisma.businessHours.create({
				data: {
					userId: req.userId,
					...data,
				},
			});
		}

		return res.json(result);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error updating business hours:', error);
		return res
			.status(500)
			.json({ message: 'Error al guardar la configuración de horarios' });
	}
}

// 8. Obtener días bloqueados
async function getBlockedDays(req, res) {
	try {
		const days = await prisma.blockedDay.findMany({
			where: { userId: req.userId },
			orderBy: { date: 'asc' },
		});

		return res.json(days);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching blocked days:', error);
		return res.status(500).json({ message: 'Error al obtener los días bloqueados' });
	}
}

// 9. Crear día bloqueado
async function createBlockedDay(req, res) {
	const { date, reason } = req.body;

	if (!date) {
		return res.status(400).json({ message: 'El campo date es obligatorio' });
	}

	const dateOnly = parseDateOnly(date);
	if (!dateOnly) {
		return res.status(400).json({ message: 'Fecha inválida' });
	}

	try {
		const existing = await prisma.blockedDay.findFirst({
			where: {
				userId: req.userId,
				date: dateOnly,
			},
		});

		if (existing) {
			return res
				.status(400)
				.json({ message: 'Ese día ya está bloqueado' });
		}

		const blocked = await prisma.blockedDay.create({
			data: {
				userId: req.userId,
				date: dateOnly,
				reason: reason || null,
			},
		});

		return res.status(201).json(blocked);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error creating blocked day:', error);
		return res.status(500).json({ message: 'Error al bloquear el día' });
	}
}

// 10. Eliminar día bloqueado
async function deleteBlockedDay(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID inválido' });
	}

	try {
		const existing = await prisma.blockedDay.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Día bloqueado no encontrado' });
		}

		await prisma.blockedDay.delete({ where: { id } });

		return res.status(204).send();
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error deleting blocked day:', error);
		return res.status(500).json({ message: 'Error al desbloquear el día' });
	}
}

module.exports = {
	getProfile,
	updateProfile,
	getAppointments,
	confirmAppointment,
	cancelAppointment,
	completeAppointment,
	markNoShow,
	getBusinessHours,
	updateBusinessHours,
	getBlockedDays,
	createBlockedDay,
	deleteBlockedDay,
};
