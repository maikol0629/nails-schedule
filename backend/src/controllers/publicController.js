const { PrismaClient, AccountStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Buffer opcional (en minutos) para reservas de última hora.
// Se puede configurar vía variable de entorno PUBLIC_BOOKING_BUFFER_MINUTES.
// Ejemplo: 120 = 2 horas de anticipación mínima.
const BOOKING_BUFFER_MINUTES = (() => {
	const raw = process.env.PUBLIC_BOOKING_BUFFER_MINUTES;
	const parsed = parseInt(raw || '0', 10);
	return Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
})();

// Helpers compartidos (fechas/horas y solapamientos)
function parseDateOnly(dateStr) {
	if (!dateStr) return null;

	// Esperamos formato "YYYY-MM-DD" desde el frontend público.
	// Parseamos manualmente para evitar ambigüedades de zona horaria.
	const parts = String(dateStr).split('-').map((x) => parseInt(x, 10));
	if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
	const [year, month, day] = parts;

	// Usamos mediodía UTC para que, al convertir entre zonas horarias,
	// nunca se cruce al día anterior/siguiente.
	return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseTimeToMinutes(timeStr) {
	const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
	if (Number.isNaN(h) || Number.isNaN(m)) return null;
	return h * 60 + m;
}

function getMinutesFromTimeField(timeField) {
	// timeField se almacena como string "HH:MM" en la BD
	if (typeof timeField === 'string') {
		return parseTimeToMinutes(timeField);
	}
	// compatibilidad por si hubiera datos antiguos como Date
	if (timeField instanceof Date) {
		const h = timeField.getHours();
		const m = timeField.getMinutes();
		return h * 60 + m;
	}
	return null;
}

// Devuelve true si hay solapamiento entre [startA, endA) y [startB, endB)
function hasOverlap(startA, endA, startB, endB) {
	return startA < endB && endA > startB;
}

function getDayKeyFromDate(date) {
	const days = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
	];
	return days[date.getDay()];
}

async function validateNoOverlapPublic({ userId, date, time, duration }) {
	const dateOnly = parseDateOnly(date);
	if (!dateOnly) {
		throw new Error('Fecha inválida para validación de solapamiento');
	}

	const newStartMinutes = parseTimeToMinutes(time);
	if (newStartMinutes === null) {
		throw new Error('Hora inválida para validación de solapamiento');
	}
	const newEndMinutes = newStartMinutes + duration;

	const sameDayAppointments = await prisma.appointment.findMany({
		where: {
			userId,
			date: dateOnly,
		},
	});

	for (const appt of sameDayAppointments) {
		const status = appt.status;
		// Una cita cancelada no bloquea el horario
		if (status === 'CANCELLED') continue;

		const existingStart = getMinutesFromTimeField(appt.time);
		const existingEnd = existingStart + appt.duration;

		if (hasOverlap(newStartMinutes, newEndMinutes, existingStart, existingEnd)) {
			return false;
		}
	}

	return true;
}

async function computeAvailableSlotsForDate({ userId, date, serviceId }) {
	const dateOnly = parseDateOnly(date);
	if (!dateOnly) {
		throw new Error('Fecha inválida');
	}

	// Buscar servicio para obtener duración
	const service = await prisma.service.findFirst({
		where: {
			id: serviceId,
			userId,
			active: true,
		},
	});

	if (!service) {
		throw new Error('Servicio inválido o inactivo');
	}

	// Horario laboral del estilista (con valores por defecto si no hay configuración)
	const existingBusinessHours = await prisma.businessHours.findFirst({
		where: { userId },
	});

	const businessHours = existingBusinessHours || {
		// Valores por defecto alineados con adminController.getBusinessHours
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

	const dayKey = getDayKeyFromDate(dateOnly);
	if (!businessHours[dayKey]) {
		// Día no laborable
		return [];
	}

	// Verificar día bloqueado: si está bloqueado, no hay disponibilidad
	const blocked = await prisma.blockedDay.findFirst({
		where: {
			userId,
			date: dateOnly,
		},
	});

	if (blocked) {
		return [];
	}

	// Generar slots en base al horario y duración del servicio
	const slotDuration = businessHours.slotDuration || 30;
	const startMinutes = parseTimeToMinutes(businessHours.startTime);
	const endMinutes = parseTimeToMinutes(businessHours.endTime);

	if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
		return [];
	}

	const serviceDuration = service.durationMinutes;
	const candidateSlots = [];
	for (
		let current = startMinutes;
		current + serviceDuration <= endMinutes;
		current += slotDuration
	) {
		candidateSlots.push(current);
	}

	// Citas existentes para ese día
	const appointments = await prisma.appointment.findMany({
		where: {
			userId,
			date: dateOnly,
		},
	});

	// Evitar mostrar slots del pasado (si la fecha es hoy) y respetar buffer opcional
	const now = new Date();
	const isToday =
		dateOnly.getFullYear() === now.getFullYear()
		&& dateOnly.getMonth() === now.getMonth()
		&& dateOnly.getDate() === now.getDate();

	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const minStartMinutesToday = currentMinutes + BOOKING_BUFFER_MINUTES;

	const availableSlots = candidateSlots.filter((slotStart) => {
		const slotEnd = slotStart + serviceDuration;

		// Si la fecha es hoy, no ofrecer horas pasadas ni dentro del buffer
		if (isToday && slotStart < minStartMinutesToday) {
			return false;
		}

		for (const appt of appointments) {
			const status = appt.status;
			if (status === 'CANCELLED') {
				// Una cita cancelada no bloquea el slot
				continue;
			}
			const existingStart = getMinutesFromTimeField(appt.time);
			const existingEnd = existingStart + appt.duration;
			if (hasOverlap(slotStart, slotEnd, existingStart, existingEnd)) {
				return false;
			}
		}
		return true;
	});

	// Convertir a strings "HH:MM"
	return availableSlots.map((minutes) => {
		const h = Math.floor(minutes / 60)
			.toString()
			.padStart(2, '0');
		const m = (minutes % 60).toString().padStart(2, '0');
		return `${h}:${m}`;
	});
}

async function getActiveStylistBySlug(slug) {
	if (!slug) {
		const error = new Error('slug es requerido');
		error.status = 400;
		throw error;
	}

	const profile = await prisma.stylistProfile.findUnique({
		where: { slug },
		include: { user: true },
	});

	if (!profile || !profile.user) {
		const error = new Error('Estilista no encontrado');
		error.status = 404;
		throw error;
	}

	if (profile.user.status !== AccountStatus.ACTIVE) {
		const error = new Error('Estilista no disponible');
		error.status = 404;
		throw error;
	}

	return { profile, user: profile.user };
}

// 1. Información pública del estilista (por slug, datos básicos)
async function getStylistInfo(req, res) {
	const { slug } = req.params;

	try {
		const { profile, user } = await getActiveStylistBySlug(slug);

		return res.json({
			slug: profile.slug,
			businessName: profile.businessName,
			ownerName: profile.ownerName,
			category: profile.category,
			bio: profile.bio,
			city: profile.city,
			country: profile.country,
			primaryColor: profile.primaryColor,
			logoUrl: profile.logoUrl,
			coverImageUrl: profile.coverImageUrl,
			photoUrl: profile.photoUrl,
			instagram: profile.instagram,
			status: user.status,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching public stylist info:', error);
		return res
			.status(error.status || 500)
			.json({ message: error.message || 'Error al obtener la información pública del estilista' });
	}
}

// 1b. Perfil público completo (incluye user) por slug
async function getStylistBySlug(req, res) {
	const { slug } = req.params;

	try {
		const { profile } = await getActiveStylistBySlug(slug);
		return res.json(profile);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching stylist by slug:', error);
		return res
			.status(error.status || 500)
			.json({ message: error.message || 'Error al obtener el perfil del estilista' });
	}
}

// Mantener compatibilidad: getStylistProfile ahora usa slug internamente
async function getStylistProfile(req, res) {
	return getStylistBySlug(req, res);
}

// 2. Servicios públicos
async function getPublicServices(req, res) {
	const { slug } = req.params;

	try {
		const { user } = await getActiveStylistBySlug(slug);
		const userId = user.id;

		const services = await prisma.service.findMany({
			where: {
				userId,
				active: true,
			},
			select: {
				id: true,
				name: true,
				description: true,
				durationMinutes: true,
				price: true,
				category: true,
			},
			orderBy: [{ category: 'asc' }, { price: 'asc' }],
		});

		return res.json(services);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching public services:', error);
		return res
			.status(error.status || 500)
			.json({ message: error.message || 'Error al obtener los servicios públicos' });
	}
}

// 3. Portafolio público
async function getPublicPortfolio(req, res) {
	const { slug } = req.params;

	try {
		const { user } = await getActiveStylistBySlug(slug);
		const userId = user.id;

		const images = await prisma.portfolioImage.findMany({
			where: { userId },
			include: {
				service: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 20,
		});

		return res.json(images);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching public portfolio:', error);
		return res
			.status(error.status || 500)
			.json({ message: error.message || 'Error al obtener el portafolio público' });
	}
}

// 4. Slots disponibles públicos
async function getAvailableSlots(req, res) {
	const { slug } = req.params;
	const { date, serviceId } = req.query;

	if (!date || !serviceId) {
		return res.status(400).json({
			message: 'Los parámetros date y serviceId son obligatorios',
		});
	}

	try {
		const { user } = await getActiveStylistBySlug(slug);
		const userId = user.id;

		const slots = await computeAvailableSlotsForDate({
			userId,
			date,
			serviceId,
		});

		return res.json({ date, serviceId, slots });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error fetching available slots:', error);
		return res
			.status(error.status || 500)
			.json({ message: error.message || 'Error al obtener los horarios disponibles' });
	}
}

// 5. Crear cita pública
async function createPublicAppointment(req, res) {
	const { slug } = req.params;
	const {
		clientName,
		clientPhone,
		clientEmail,
		serviceId,
		date,
		time,
		notes,
	} = req.body;

	try {
		const serviceIdStr = String(serviceId || '').trim();
		if (!serviceIdStr) {
			return res.status(400).json({ message: 'serviceId inválido' });
		}

		// Validar servicio activo
		const service = await prisma.service.findFirst({
			where: {
				id: serviceIdStr,
				// filtraremos por supabaseUserId luego de resolver el estilista
				active: true,
			},
		});

		if (!service) {
			return res
				.status(400)
				.json({ message: 'Servicio inválido o no disponible' });
		}

		// Validar fecha futura
		const startDateTime = new Date(`${date}T${time}:00`);
		if (Number.isNaN(startDateTime.getTime())) {
			return res
				.status(400)
				.json({ message: 'Fecha u hora inválida' });
		}

		const now = new Date();
		if (startDateTime < now) {
			return res
				.status(400)
				.json({ message: 'La cita debe ser en el futuro' });
		}

		// Resolver estilista por slug y obtener userId
		const { user } = await getActiveStylistBySlug(slug);
		const userId = user.id;

		// Verificar que la hora esté en los slots disponibles
		const slots = await computeAvailableSlotsForDate({
			userId,
			date,
			serviceId: serviceIdStr,
		});

		if (!slots.includes(time)) {
			return res
				.status(400)
				.json({ message: 'La hora seleccionada no está disponible' });
		}

		// Encontrar o crear cliente por teléfono
		let client = await prisma.client.findFirst({
			where: {
				userId,
				phone: clientPhone,
			},
		});

		if (client) {
			client = await prisma.client.update({
				where: { id: client.id },
				data: {
					name: clientName,
					email: clientEmail || null,
				},
			});
		} else {
			client = await prisma.client.create({
				data: {
					userId,
					name: clientName,
					phone: clientPhone,
					email: clientEmail || null,
					notes: null,
				},
			});
		}

		// Validar solapamiento como salvaguarda adicional
		const duration = service.durationMinutes;
		const noOverlap = await validateNoOverlapPublic({
			userId,
			date,
			time,
			duration,
		});

		if (!noOverlap) {
			return res.status(400).json({
				message: 'La cita se solapa con otra cita existente',
			});
		}

		// Crear cita
		const dateOnly = parseDateOnly(date);
		const appointment = await prisma.appointment.create({
			data: {
				userId,
				clientId: client.id,
				serviceId: serviceIdStr,
				date: dateOnly,
				time,
				duration,
				status: 'PENDING',
				notes: notes || null,
			},
		});

		// OPCIONAL: aquí se podría disparar una notificación (email/SMS) al estilista.

		return res.status(201).json({
			success: true,
			appointmentId: appointment.id,
			message: 'Cita creada correctamente. Pendiente de confirmación.',
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error creating public appointment:', error);
		return res.status(500).json({ message: 'Error al crear la cita' });
	}
}

module.exports = {
	getStylistInfo,
	getStylistBySlug,
	getStylistProfile,
	getPublicServices,
	getPublicPortfolio,
	getAvailableSlots,
	createPublicAppointment,
};
