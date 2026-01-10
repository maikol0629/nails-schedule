const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getCurrentTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// GET /api/dashboard/today
// Obtener citas de hoy del usuario, incluyendo cliente y servicio, ordenadas por hora
async function getTodayAppointments(req, res) {
    try {
        const today = getTodayDateOnly();

        const appointments = await prisma.appointment.findMany({
            where: {
                userId: req.userId,
                date: today,
            },
            include: {
                client: true,
                service: true,
            },
            orderBy: [{ time: 'asc' }],
        });

        return res.json(appointments);
    } catch (error) {
        console.error('Error fetching today appointments:', error);
        return res
            .status(500)
            .json({ message: 'Error al obtener las citas de hoy' });
    }
}

// GET /api/dashboard/upcoming
// Próximas 5 citas (fecha >= hoy), incluyendo cliente y servicio
async function getUpcomingAppointments(req, res) {
    try {
        const today = getTodayDateOnly();
        const currentTimeStr = getCurrentTimeString();

        const appointments = await prisma.appointment.findMany({
            where: {
                userId: req.userId,
                OR: [
                    { date: { gt: today } },
                    {
                        date: today,
						time: { gte: currentTimeStr },
                    },
                ],
            },
            include: {
                client: true,
                service: true,
            },
            orderBy: [
                { date: 'asc' },
                { time: 'asc' },
            ],
            take: 5,
        });

        return res.json(appointments);
    } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        return res
            .status(500)
            .json({ message: 'Error al obtener las próximas citas' });
    }
}

// GET /api/dashboard/month-stats
// Estadísticas del mes actual: conteo por estado, total y servicios más solicitados
async function getMonthStats(req, res) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const where = {
            userId: req.userId,
            date: {
                gte: startOfMonth,
                lt: startOfNextMonth,
            },
        };

        // Conteo total de citas del mes
        const totalAppointments = await prisma.appointment.count({ where });

        // Conteo por estado
        const statusGroup = await prisma.appointment.groupBy({
            by: ['status'],
            where,
            _count: { _all: true },
        });

        const statusCounts = {
            PENDING: 0,
            CONFIRMED: 0,
            COMPLETED: 0,
            CANCELLED: 0,
        };

        statusGroup.forEach((item) => {
            statusCounts[item.status] = item._count._all;
        });

        // Servicios más solicitados (por número de citas en el mes)
        // Servicios más solicitados (por número de citas en el mes)
        const serviceGroup = await prisma.appointment.groupBy({
            by: ['serviceId'],
            where,

            _count: {
                serviceId: true,
            },

            orderBy: {
                _count: {
                    serviceId: 'desc',
                },
            },
        });


        const serviceIds = serviceGroup
            .map((item) => item.serviceId)
            .filter((id) => id !== null && id !== undefined);

        let servicesMap = {};
        if (serviceIds.length > 0) {
            const services = await prisma.service.findMany({
                where: {
                    userId: req.userId,
                    id: { in: serviceIds },
                },
            });

            services.forEach((service) => {
                servicesMap[service.id] = service;
            });
        }

        const topServices = serviceGroup.map((item) => ({
            serviceId: item.serviceId,
            count: item._count._all,
            service: servicesMap[item.serviceId] || null,
        }));

        return res.json({
            totalAppointments,
            statusCounts,
            topServices,
        });
    } catch (error) {
        console.error('Error fetching month stats:', error);
        return res
            .status(500)
            .json({ message: 'Error al obtener las estadísticas del mes' });
    }
}

module.exports = {
    getTodayAppointments,
    getUpcomingAppointments,
    getMonthStats,
};
