/**
 * Convierte una hora en formato "HH:MM" a minutos desde 00:00.
 * @param {string} timeStr - Hora en formato "HH:MM".
 * @returns {number|null} Minutos desde 00:00 o null si es inválido.
 */
function timeStringToMinutes(timeStr) {
	if (typeof timeStr !== 'string') return null;
	const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
	if (Number.isNaN(h) || Number.isNaN(m)) return null;
	if (h < 0 || h > 23 || m < 0 || m > 59) return null;
	return h * 60 + m;
}

/**
 * Convierte minutos desde 00:00 a formato "HH:MM".
 * @param {number} minutes - Minutos desde 00:00.
 * @returns {string} Hora en formato "HH:MM".
 */
function minutesToTimeString(minutes) {
	const total = Math.max(0, Math.floor(minutes));
	const h = Math.floor(total / 60)
		.toString()
		.padStart(2, '0');
	const m = (total % 60).toString().padStart(2, '0');
	return `${h}:${m}`;
}

/**
 * Devuelve true si hay solapamiento entre dos rangos [startA, endA) y [startB, endB).
 * @param {number} startA - Inicio del rango A en minutos.
 * @param {number} endA - Fin del rango A en minutos.
 * @param {number} startB - Inicio del rango B en minutos.
 * @param {number} endB - Fin del rango B en minutos.
 * @returns {boolean}
 */
function rangesOverlap(startA, endA, startB, endB) {
	return startA < endB && endA > startB;
}

/**
 * Normaliza una fecha a cadena "YYYY-MM-DD".
 * @param {Date|string} date - Objeto Date o cadena parseable por Date.
 * @returns {string|null}
 */
function normalizeDate(date) {
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return null;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * Genera una lista de horarios entre una hora de inicio y fin.
 *
 * @param {string} startTime - Hora de inicio en formato "HH:MM".
 * @param {string} endTime - Hora de fin en formato "HH:MM".
 * @param {number} slotDuration - Duración de cada slot en minutos (> 0).
 * @returns {string[]} Array de horarios en formato "HH:MM".
 */
function generateTimeSlots(startTime, endTime, slotDuration) {
	const startMinutes = timeStringToMinutes(startTime);
	const endMinutes = timeStringToMinutes(endTime);
	const duration = parseInt(slotDuration, 10);

	if (startMinutes === null || endMinutes === null) return [];
	if (Number.isNaN(duration) || duration <= 0) return [];
	if (endMinutes <= startMinutes) return [];

	const slots = [];
	for (let current = startMinutes; current < endMinutes; current += duration) {
		slots.push(minutesToTimeString(current));
	}
	return slots;
}

/**
 * Verifica si un slot está disponible considerando citas existentes y la duración del servicio.
 *
 * Asume que cada cita existente tiene la forma:
 * { time: "HH:MM", duration: number, status?: string }
 *
 * Las citas con status === 'CANCELLED' no bloquean horarios.
 *
 * @param {string} slot - Hora del slot en formato "HH:MM".
 * @param {{ time: string, duration: number, status?: string }[]} existingAppointments - Citas existentes.
 * @param {number} serviceDuration - Duración del servicio en minutos (> 0).
 * @returns {boolean} true si el slot está libre, false en caso contrario.
 */
function isSlotAvailable(slot, existingAppointments, serviceDuration) {
	const startMinutes = timeStringToMinutes(slot);
	const duration = parseInt(serviceDuration, 10);
	if (startMinutes === null) return false;
	if (Number.isNaN(duration) || duration <= 0) return false;

	const endMinutes = startMinutes + duration;

	for (const appt of existingAppointments || []) {
		if (!appt) continue;
		if (appt.status === 'CANCELLED') continue;

		const apptStart = timeStringToMinutes(appt.time);
		const apptDuration = parseInt(appt.duration, 10);
		if (apptStart === null || Number.isNaN(apptDuration) || apptDuration <= 0) {
			// Si la cita es inválida, la ignoramos para no romper el cálculo.
			// En un flujo real esto debería haberse validado antes.
			continue;
		}
		const apptEnd = apptStart + apptDuration;

		if (rangesOverlap(startMinutes, endMinutes, apptStart, apptEnd)) {
			return false;
		}
	}

	return true;
}

/**
 * Filtra slots que ya han pasado respecto a una hora actual.
 *
 * @param {string[]} slots - Array de horarios en formato "HH:MM".
 * @param {Date|string} currentTime - Momento actual (se usa solo la hora/minuto).
 * @returns {string[]} Slots que ocurren después de currentTime.
 */
function filterPastSlots(slots, currentTime) {
	if (!Array.isArray(slots) || slots.length === 0) return [];

	const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
	if (Number.isNaN(now.getTime())) return slots;

	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	return slots.filter((slot) => {
		const slotMinutes = timeStringToMinutes(slot);
		if (slotMinutes === null) return false;
		return slotMinutes > currentMinutes;
	});
}

/**
 * Verifica si un día de la semana está activo según una configuración de businessHours.
 *
 * @param {number} dayOfWeek - Día de la semana (0 = domingo, 6 = sábado).
 * @param {Record<string, any>} businessHours - Objeto con flags booleanos: monday..sunday.
 * @returns {boolean} true si el día está activo.
 */
function isDayActive(dayOfWeek, businessHours) {
	if (!businessHours) return false;
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	if (dayOfWeek < 0 || dayOfWeek > 6) return false;
	const key = days[dayOfWeek];
	return Boolean(businessHours[key]);
}

/**
 * Verifica si una fecha está bloqueada según una lista de días bloqueados.
 *
 * Cada elemento de blockedDays puede ser:
 * - Un objeto Date.
 * - Una cadena de fecha parseable por Date.
 * - Un objeto con propiedad `date` (Date o string).
 *
 * @param {Date|string} date - Fecha a comprobar.
 * @param {Array<Date|string|{date: Date|string}>} blockedDays - Lista de días bloqueados.
 * @returns {boolean} true si la fecha está bloqueada.
 */
function isDateBlocked(date, blockedDays) {
	const target = normalizeDate(date);
	if (!target) return false;

	for (const item of blockedDays || []) {
		if (!item) continue;
		const value = item instanceof Date || typeof item === 'string' ? item : item.date;
		const normalized = normalizeDate(value);
		if (!normalized) continue;
		if (normalized === target) return true;
	}

	return false;
}

module.exports = {
	generateTimeSlots,
	isSlotAvailable,
	filterPastSlots,
	isDayActive,
	isDateBlocked,
	// Helpers exportados opcionalmente para tests más finos
	// (no son parte estricta de la API pública pero facilitan el testing).
	_timeStringToMinutes: timeStringToMinutes,
	_minutesToTimeString: minutesToTimeString,
	_normalizeDate: normalizeDate,
	_rangesOverlap: rangesOverlap,
};
