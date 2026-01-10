const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/services
async function getAllServices(req, res) {
	try {
		const services = await prisma.service.findMany({
			where: { userId: req.userId },
			orderBy: { createdAt: 'desc' },
		});

		return res.json(services);
	} catch (error) {
		console.error('Error fetching services:', error);
		return res.status(500).json({ message: 'Error al obtener los servicios' });
	}
}

// GET /api/services/:id
async function getServiceById(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de servicio inválido' });
	}

	try {
		const service = await prisma.service.findFirst({
			where: { id, userId: req.userId },
		});

		if (!service) {
			return res.status(404).json({ message: 'Servicio no encontrado' });
		}

		return res.json(service);
	} catch (error) {
		console.error('Error fetching service by id:', error);
		return res.status(500).json({ message: 'Error al obtener el servicio' });
	}
}

// POST /api/services
async function createService(req, res) {
	const { name, description, durationMinutes, price, category } = req.body;

	try {
		const service = await prisma.service.create({
			data: {
				userId: req.userId,
				name,
				description: description || null,
				durationMinutes,
				price,
				category,
			},
		});

		return res.status(201).json(service);
	} catch (error) {
		console.error('Error creating service:', error);
		return res.status(500).json({ message: 'Error al crear el servicio' });
	}
}

// PUT /api/services/:id
async function updateService(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de servicio inválido' });
	}

	const { name, description, durationMinutes, price, category } = req.body;

	try {
		const existing = await prisma.service.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Servicio no encontrado' });
		}

		const service = await prisma.service.update({
			where: { id },
			data: {
				name: name ?? existing.name,
				description: description !== undefined ? description : existing.description,
				durationMinutes: durationMinutes ?? existing.durationMinutes,
				price: price ?? existing.price,
				category: category ?? existing.category,
			},
		});

		return res.json(service);
	} catch (error) {
		console.error('Error updating service:', error);
		return res.status(500).json({ message: 'Error al actualizar el servicio' });
	}
}

// DELETE /api/services/:id
async function deleteService(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de servicio inválido' });
	}

	try {
		const existing = await prisma.service.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Servicio no encontrado' });
		}

		const relatedAppointments = await prisma.appointment.findFirst({
			where: {
				serviceId: id,
				userId: req.userId,
			},
		});

		if (relatedAppointments) {
			return res.status(400).json({
				message: 'No se puede eliminar el servicio porque tiene citas asociadas',
			});
		}

		await prisma.service.delete({ where: { id } });

		return res.status(204).send();
	} catch (error) {
		console.error('Error deleting service:', error);
		return res.status(500).json({ message: 'Error al eliminar el servicio' });
	}
}

module.exports = {
	getAllServices,
	getServiceById,
	createService,
	updateService,
	deleteService,
};
