const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/portfolio
// Obtener todas las imágenes de portafolio del usuario autenticado
async function getAllImages(req, res) {
	try {
		const images = await prisma.portfolioImage.findMany({
			where: {
				userId: req.userId,
			},
			include: {
				service: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return res.json(images);
	} catch (error) {
		console.error('Error fetching portfolio images:', error);
		return res
			.status(500)
			.json({ message: 'Error al obtener las imágenes del portafolio' });
	}
}

// POST /api/portfolio
// Crear registro de imagen con URL ya subida a Supabase Storage
async function uploadImage(req, res) {
	const { imageUrl, serviceId, description } = req.body;

	if (!imageUrl || typeof imageUrl !== 'string') {
		return res.status(400).json({ message: 'imageUrl es obligatorio' });
	}

	try {
		let relatedServiceId = null;
		if (serviceId !== undefined && serviceId !== null) {
			const parsedId = Number(serviceId);
			if (Number.isNaN(parsedId)) {
				return res
					.status(400)
					.json({ message: 'serviceId debe ser un número válido' });
			}

			const service = await prisma.service.findFirst({
				where: {
					id: parsedId,
					userId: req.userId,
				},
			});

			if (!service) {
				return res.status(400).json({ message: 'Servicio inválido' });
			}

			relatedServiceId = parsedId;
		}

		const image = await prisma.portfolioImage.create({
			data: {
				userId: req.userId,
				serviceId: relatedServiceId,
				imageUrl,
				description: description || null,
			},
			include: {
				service: true,
			},
		});

		return res.status(201).json(image);
	} catch (error) {
		console.error('Error uploading portfolio image:', error);
		return res
			.status(500)
			.json({ message: 'Error al registrar la imagen del portafolio' });
	}
}

// DELETE /api/portfolio/:id
// Eliminar registro de imagen (y opcionalmente archivo en Supabase Storage)
async function deleteImage(req, res) {
	const id = parseInt(req.params.id, 10);

	if (Number.isNaN(id)) {
		return res.status(400).json({ message: 'ID de imagen inválido' });
	}

	try {
		const existing = await prisma.portfolioImage.findFirst({
			where: {
				id,
				userId: req.userId,
			},
		});

		if (!existing) {
			return res.status(404).json({ message: 'Imagen no encontrada' });
	}

		// TODO: opcionalmente eliminar de Supabase Storage usando imageUrl
		// Mantener lógica de almacenamiento en el frontend por ahora.

		await prisma.portfolioImage.delete({ where: { id } });

		return res.status(204).send();
	} catch (error) {
		console.error('Error deleting portfolio image:', error);
		return res
			.status(500)
			.json({ message: 'Error al eliminar la imagen del portafolio' });
	}
}

module.exports = {
	getAllImages,
	uploadImage,
	deleteImage,
};
