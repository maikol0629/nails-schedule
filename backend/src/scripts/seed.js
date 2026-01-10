/* eslint-disable no-console */

// Script de seed para datos de prueba
// Ejecutar con: node src/scripts/seed.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { supabase } = require('../config/supabase');

const prisma = new PrismaClient();

const TEST_EMAIL = process.env.SEED_STYLIST_EMAIL || 'stylist.demo@example.com';
const TEST_PASSWORD = process.env.SEED_STYLIST_PASSWORD || 'DemoPass123!';

async function main() {
	console.log('Iniciando seed de datos de prueba...');

	// 1. Estilista de prueba (Supabase Auth + perfil + horarios)
	console.log('\n[1] Creando / obteniendo estilista de prueba en Supabase Auth...');

	// Intentar encontrar usuario existente por email
	// NOTA: Supabase no permite buscar por email desde el cliente anon de forma directa;
	// por simplicidad en este script asumimos que crear múltiples usuarios de prueba
	// no es crítico en desarrollo. Si ya existe, simplemente reutilizamos el más reciente.
	const uniqueSuffix = Date.now();
	const email = TEST_EMAIL.replace('@', `+${uniqueSuffix}@`);

	const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
		email,
		password: TEST_PASSWORD,
		options: {
			data: {
				full_name: 'Estilista Demo',
			},
		},
	});

	if (signUpError || !signUpData?.user) {
		console.error('Error creando usuario de prueba en Supabase:', signUpError);
		throw new Error('No se pudo crear el usuario de prueba en Supabase');
	}

	const userId = signUpData.user.id;
	console.log(`✓ Usuario creado: ${email}`);

	// Guardar como estilista principal en AppSettings
	await prisma.appSettings.upsert({
		where: { id: 1 },
		create: { id: 1, primaryStylistId: userId },
		update: { primaryStylistId: userId },
	});

	// Crear / actualizar StylistProfile
	await prisma.stylistProfile.upsert({
		where: { userId },
		create: {
			userId,
			name: 'Estilista Demo',
			bio: 'Especialista en uñas, color y cuidado capilar. Este es un perfil de prueba para la demo.',
			phone: '+57 300 123 4567',
			email,
			instagram: '@demo.nails',
			address: 'Calle 123 #45-67, Bogotá',
			photoUrl:
				'https://images.pexels.com/photos/3738349/pexels-photo-3738349.jpeg?auto=compress&cs=tinysrgb&w=800',
		},
		update: {},
	});
	console.log('✓ Perfil creado');

	// Crear / actualizar BusinessHours con horario estándar
	await prisma.businessHours.upsert({
		where: { userId },
		create: {
			userId,
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
		},
		update: {
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
		},
	});
	console.log('✓ Horarios configurados');

	// 2. Servicios de ejemplo
	console.log('\n[2] Creando servicios de ejemplo...');

	const servicesData = [
		{
			name: 'Corte de cabello',
			description: 'Corte personalizado según tu estilo y tipo de rostro.',
			durationMinutes: 45,
			price: 40000,
			category: 'CUT',
		},
		{
			name: 'Coloración',
			description: 'Coloración completa o balayage con productos profesionales.',
			durationMinutes: 120,
			price: 120000,
			category: 'COLOR',
		},
		{
			name: 'Peinado',
			description: 'Peinados para eventos especiales, ondas, recogidos y más.',
			durationMinutes: 60,
			price: 60000,
			category: 'STYLE',
		},
		{
			name: 'Tratamiento capilar',
			description: 'Tratamientos hidratantes y reparadores para tu cabello.',
			durationMinutes: 50,
			price: 80000,
			category: 'TREATMENT',
		},
	];

	// El campo "active" no existe en el modelo Service del schema actual;
	// asumimos que todos los servicios creados están disponibles.

	// Elimina servicios previos de este usuario para evitar duplicados en la demo
	await prisma.service.deleteMany({ where: { userId } });

	const createdServices = [];
	for (const svc of servicesData) {
		const created = await prisma.service.create({
			data: {
				userId,
				name: svc.name,
				description: svc.description,
				durationMinutes: svc.durationMinutes,
				price: svc.price,
				category: svc.category,
			},
		});
		createdServices.push(created);
	}
	console.log(`✓ ${createdServices.length} servicios creados`);

	// 3. Imágenes de portafolio de ejemplo
	console.log('\n[3] Creando imágenes de portafolio de ejemplo...');

	const portfolioImages = [
		'https://images.pexels.com/photos/3738346/pexels-photo-3738346.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738345/pexels-photo-3738345.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738355/pexels-photo-3738355.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738348/pexels-photo-3738348.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738373/pexels-photo-3738373.jpeg?auto=compress&cs=tinysrgb&w=800',
	];

	// Limpiar portafolio previo del usuario de prueba
	await prisma.portfolioImage.deleteMany({ where: { userId } });

	for (let i = 0; i < portfolioImages.length; i += 1) {
		const imageUrl = portfolioImages[i];
		await prisma.portfolioImage.create({
			data: {
				userId,
				imageUrl,
				description: `Trabajo de ejemplo #${i + 1}`,
				serviceId: createdServices[i % createdServices.length].id,
			},
		});
	}
	console.log(`✓ ${portfolioImages.length} imágenes de portafolio creadas`);

	// 4. Cita de ejemplo en estado PENDING
	console.log('\n[4] Creando cita de ejemplo...');

	// Limpiar citas y clientes previos de este usuario de prueba
	await prisma.appointment.deleteMany({ where: { userId } });
	await prisma.client.deleteMany({ where: { userId } });

	const client = await prisma.client.create({
		data: {
			userId,
			name: 'Cliente Demo',
			phone: '+57 301 987 6543',
			email: 'cliente.demo@example.com',
			notes: 'Cliente de prueba generado por el script seed.',
		},
	});

	const today = new Date();
	const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const time = new Date();
	time.setHours(15, 0, 0, 0); // 15:00

	const firstService = createdServices[0];
	await prisma.appointment.create({
		data: {
			userId,
			clientId: client.id,
			serviceId: firstService.id,
			date: dateOnly,
			time,
			duration: firstService.durationMinutes,
			status: 'PENDING',
			notes: 'Cita de prueba generada automáticamente.',
		},
	});
	console.log('✓ 1 cita de prueba creada');

	console.log('\nSeed completado exitosamente.');
}

main()
	.catch((err) => {
		console.error('Seed falló con error:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
