const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

function parseDateOnly(dateStr) {
	if (!dateStr) return null;

	// Esperamos formato "YYYY-MM-DD" desde el frontend admin.
	const parts = String(dateStr).split('-').map((x) => parseInt(x, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
	const [year, month, day] = parts;

	// Mediodía UTC para evitar cambios de día por zona horaria.
	return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseTimeToMinutes(timeStr) {
	const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
	if (Number.isNaN(h) || Number.isNaN(m)) return null;
	return h * 60 + m;
}

function getMinutesFromTimeField(timeField) {
	// timeField es un objeto Date que representa solo la hora
	const h = timeField.getHours();
	const m = timeField.getMinutes();
	return h * 60 + m;
}

// Devuelve true si hay solapamiento entre [startA, endA) y [startB, endB)
function hasOverlap(startA, endA, startB, endB) {
	return startA < endB && endA > startB;
}

async function validateNoOverlap({ userId, date, time, duration, excludeAppointmentId }) {
	const dateOnly = parseDateOnly(date);
	if (!dateOnly) {
		throw new Error('Fecha inválida para validación de solapamiento');
	}

	const newStartMinutes = parseTimeToMinutes(time);
	if (newStartMinutes === null) {
		throw new Error('Hora inválida para validación de solapamiento');
	}
	const newEndMinutes = newStartMinutes + duration;

	const where = {
		userId,
		date: dateOnly,
	};

	if (excludeAppointmentId) {
		where.id = { not: excludeAppointmentId };
	}

	const sameDayAppointments = await prisma.appointment.findMany({
		where,
	});

	for (const appt of sameDayAppointments) {
		const existingStart = getMinutesFromTimeField(appt.time);
		const existingEnd = existingStart + appt.duration;

		if (hasOverlap(newStartMinutes, newEndMinutes, existingStart, existingEnd)) {
			return false;
		}
	}

	return true;
}

// GET /api/appointments
async function getAllAppointments(req, res) {
	const { date, status } = req.query;

	try {
		const where = { userId: req.userId };

		if (date) {
			const parsedDate = parseDateOnly(date);
			if (!parsedDate) {
				return res.status(400).json({ message: 'Fecha inválida' });
			}
			where.date = parsedDate;
		}

		if (status && APPOINTMENT_STATUSES.includes(status)) {
			where.status = status;
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
		console.error('Error fetching appointments:', error);
		return res.status(500).json({ message: 'Error al obtener las citas' });
	}
}

// GET /api/appointments/:id
async function getAppointmentById(req, res) {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({ message: 'ID de cita inválido' });
	}

	try {
		const appointment = await prisma.appointment.findFirst({
			where: { id, userId: req.userId },
			include: {
				client: true,
				service: true,
			},
		});

		if (!appointment) {
			return res.status(404).json({ message: 'Cita no encontrada' });
		}

		return res.json(appointment);
	} catch (error) {
		console.error('Error fetching appointment by id:', error);
		return res.status(500).json({ message: 'Error al obtener la cita' });
	}
}

// POST /api/appointments
async function createAppointment(req, res) {
	const { clientId, serviceId, date, time, notes } = req.body;

	try {
		const [client, service] = await Promise.all([
			prisma.client.findFirst({ where: { id: clientId, userId: req.userId } }),
			prisma.service.findFirst({ where: { id: serviceId, userId: req.userId } }),
		]);

		if (!client) {
			return res.status(400).json({ message: 'Cliente inválido' });
		}

		if (!service) {
			return res.status(400).json({ message: 'Servicio inválido' });
		}

		// Validar que la fecha/hora sean futuras
		const startDateTime = new Date(`${date}T${time}:00`);
		if (Number.isNaN(startDateTime.getTime())) {
			return res.status(400).json({ message: 'Fecha u hora inválida' });
		}

		const now = new Date();
		if (startDateTime < now) {
			return res.status(400).json({ message: 'La cita debe ser en el futuro' });
		}

		const duration = service.durationMinutes;

		const noOverlap = await validateNoOverlap({
			userId: req.userId,
			date,
			time,
			duration,
		});

		if (!noOverlap) {
			return res.status(400).json({
				message: 'La cita se solapa con otra cita existente',
			});
		}

		const dateOnly = parseDateOnly(date);
		const [hours, minutes] = time.split(':').map((x) => parseInt(x, 10));
		const timeDate = new Date(1970, 0, 1, hours, minutes, 0, 0);

		const appointment = await prisma.appointment.create({
			data: {
				userId: req.userId,
				clientId,
				serviceId,
				date: dateOnly,
				time: timeDate,
				duration,
				status: 'PENDING',
				notes: notes || null,
			},
			include: {
				client: true,
				service: true,
			},
		});

		return res.status(201).json(appointment);
	} catch (error) {
		console.error('Error creating appointment:', error);
		return res.status(500).json({ message: 'Error al crear la cita' });
	}
}

// PUT /api/appointments/:id
async function updateAppointment(req, res) {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({ message: 'ID de cita inválido' });
	}

	const { clientId, serviceId, date, time, status, notes } = req.body;

	try {
		const existing = await prisma.appointment.findFirst({
			where: { id, userId: req.userId },
			include: {
				service: true,
			},
		});

		if (!existing) {
			return res.status(404).json({ message: 'Cita no encontrada' });
		}

		let newClientId = existing.clientId;
		let newServiceId = existing.serviceId;
		let newDate = existing.date;
		let newTime = existing.time;
		let newStatus = existing.status;
		let newNotes = existing.notes;

		if (clientId !== undefined) {
			const client = await prisma.client.findFirst({
				where: { id: clientId, userId: req.userId },
			});
			if (!client) {
				return res.status(400).json({ message: 'Cliente inválido' });
			}
			newClientId = clientId;
		}

		let service = existing.service;
		if (serviceId !== undefined) {
			const foundService = await prisma.service.findFirst({
				where: { id: serviceId, userId: req.userId },
			});
			if (!foundService) {
				return res.status(400).json({ message: 'Servicio inválido' });
			}
			newServiceId = serviceId;
			service = foundService;
		}

		if (date !== undefined) {
			const parsed = parseDateOnly(date);
			if (!parsed) {
				return res.status(400).json({ message: 'Fecha inválida' });
			}
			newDate = parsed;
		}

		let timeStr = null;
		if (time !== undefined) {
			const minutes = parseTimeToMinutes(time);
			if (minutes === null) {
				return res.status(400).json({ message: 'Hora inválida' });
			}
			timeStr = time;
			const [hours, mins] = time.split(':').map((x) => parseInt(x, 10));
			newTime = new Date(1970, 0, 1, hours, mins, 0, 0);
		} else {
			const hours = existing.time.getHours();
			const mins = existing.time.getMinutes();
			timeStr = `${hours.toString().padStart(2, '0')}:${mins
				.toString()
				.padStart(2, '0')}`;
		}

		if (status !== undefined) {
			if (!APPOINTMENT_STATUSES.includes(status)) {
				return res.status(400).json({ message: 'Estado de cita inválido' });
			}
			newStatus = status;
		}

		if (notes !== undefined) {
			newNotes = notes;
		}

		const today = new Date();
		const combined = new Date(
			newDate.getFullYear(),
			newDate.getMonth(),
			newDate.getDate(),
			newTime.getHours(),
			newTime.getMinutes(),
			0,
			0,
		);

		if (combined < today) {
			return res.status(400).json({ message: 'La cita debe ser en el futuro' });
		}

		const duration = service.durationMinutes;

		const noOverlap = await validateNoOverlap({
			userId: req.userId,
			date: newDate.toISOString(),
			time: timeStr,
			duration,
			excludeAppointmentId: id,
		});

		if (!noOverlap) {
			return res.status(400).json({
				message: 'La cita se solapa con otra cita existente',
			});
		}

		const updated = await prisma.appointment.update({
			where: { id },
			data: {
				clientId: newClientId,
				serviceId: newServiceId,
				date: newDate,
				time: newTime,
				duration,
				status: newStatus,
				notes: newNotes,
			},
			include: {
				client: true,
				service: true,
			},
		});

		return res.json(updated);
	} catch (error) {
		console.error('Error updating appointment:', error);
		return res.status(500).json({ message: 'Error al actualizar la cita' });
	}
}

// DELETE /api/appointments/:id
async function deleteAppointment(req, res) {
	const { id } = req.params;

	if (!id) {
		return res.status(400).json({ message: 'ID de cita inválido' });
	}

	try {
		const existing = await prisma.appointment.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Cita no encontrada' });
		}

		await prisma.appointment.delete({ where: { id } });

		return res.status(204).send();
	} catch (error) {
		console.error('Error deleting appointment:', error);
		return res.status(500).json({ message: 'Error al eliminar la cita' });
	}
}

// GET /api/appointments/range?start=YYYY-MM-DD&end=YYYY-MM-DD
async function getAppointmentsByDateRange(req, res) {
	const { start, end } = req.query;

	if (!start || !end) {
		return res
			.status(400)
			.json({ message: 'Los parámetros start y end son obligatorios' });
	}

	const startDate = parseDateOnly(start);
	const endDate = parseDateOnly(end);

	if (!startDate || !endDate) {
		return res.status(400).json({ message: 'Rango de fechas inválido' });
	}

	try {
		const appointments = await prisma.appointment.findMany({
			where: {
				userId: req.userId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
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
		console.error('Error fetching appointments by range:', error);
		return res
			.status(500)
			.json({ message: 'Error al obtener las citas del rango' });
	}
}

module.exports = {
	getAllAppointments,
	getAppointmentById,
	createAppointment,
	updateAppointment,
	deleteAppointment,
	getAppointmentsByDateRange,
};
