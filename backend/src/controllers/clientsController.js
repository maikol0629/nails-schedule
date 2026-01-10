const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/clients
async function getAllClients(req, res) {
	try {
		const clients = await prisma.client.findMany({
			where: { userId: req.userId },
			orderBy: { createdAt: 'desc' },
		});

		return res.json(clients);
	} catch (error) {
		console.error('Error fetching clients:', error);
		return res.status(500).json({ message: 'Error al obtener los clientes' });
	}
}

// GET /api/clients/:id
async function getClientById(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de cliente inválido' });
	}

	try {
		const client = await prisma.client.findFirst({
			where: { id, userId: req.userId },
			include: {
				appointments: true,
			},
		});

		if (!client) {
			return res.status(404).json({ message: 'Cliente no encontrado' });
		}

		return res.json(client);
	} catch (error) {
		console.error('Error fetching client by id:', error);
		return res.status(500).json({ message: 'Error al obtener el cliente' });
	}
}

// POST /api/clients
async function createClient(req, res) {
	const { name, phone, email, notes } = req.body;

	try {
		const client = await prisma.client.create({
			data: {
				userId: req.userId,
				name,
				phone: phone || null,
				email: email || null,
				notes: notes || null,
			},
		});

		return res.status(201).json(client);
	} catch (error) {
		console.error('Error creating client:', error);
		return res.status(500).json({ message: 'Error al crear el cliente' });
	}
}

// PUT /api/clients/:id
async function updateClient(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de cliente inválido' });
	}

	const { name, phone, email, notes } = req.body;

	try {
		const existing = await prisma.client.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Cliente no encontrado' });
		}

		const client = await prisma.client.update({
			where: { id },
			data: {
				name: name ?? existing.name,
				phone: phone !== undefined ? phone : existing.phone,
				email: email !== undefined ? email : existing.email,
				notes: notes !== undefined ? notes : existing.notes,
			},
		});

		return res.json(client);
	} catch (error) {
		console.error('Error updating client:', error);
		return res.status(500).json({ message: 'Error al actualizar el cliente' });
	}
}

// DELETE /api/clients/:id
async function deleteClient(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de cliente inválido' });
	}

	try {
		const existing = await prisma.client.findFirst({
			where: { id, userId: req.userId },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Cliente no encontrado' });
		}

		// Verificar citas futuras (por fecha >= hoy)
		const today = new Date();
		const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

		const futureAppointment = await prisma.appointment.findFirst({
			where: {
				clientId: id,
				userId: req.userId,
				date: {
					gte: todayDateOnly,
				},
			},
		});

		if (futureAppointment) {
			return res.status(400).json({
				message: 'No se puede eliminar el cliente porque tiene citas futuras',
			});
		}

		await prisma.client.delete({ where: { id } });

		return res.status(204).send();
	} catch (error) {
		console.error('Error deleting client:', error);
		return res.status(500).json({ message: 'Error al eliminar el cliente' });
	}
}

module.exports = {
	getAllClients,
	getClientById,
	createClient,
	updateClient,
	deleteClient,
};
