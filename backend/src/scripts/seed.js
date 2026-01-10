/* eslint-disable no-console */

// Script de seed para datos multi-tenant
// Ejecutar con: node src/scripts/seed.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const {
	AccountStatus,
	UserRole,
	BusinessCategory,
	ServiceCategory,
} = require('@prisma/client');

const prisma = require('../config/prisma');
const { supabase } = require('../config/supabase');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL || 'admin@tuapp.com';
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin123!';

const STYLISTS = [
	{
		label: 'Barbería clásica',
		email: process.env.SEED_BARBERSHOP_EMAIL || 'barberia.clasica@tuapp.com',
		password: process.env.SEED_BARBERSHOP_PASSWORD || 'Stylist123!',
		slug: 'barberia-clasica',
		businessName: 'Barbería Clásica',
		ownerName: 'Carlos Barber',
		category: BusinessCategory.BARBERSHOP,
		status: AccountStatus.ACTIVE,
		primaryColor: '#0EA5E9',
	},
	{
		label: 'Salón elegante',
		email: process.env.SEED_HAIR_SALON_EMAIL || 'salon.elegante@tuapp.com',
		password: process.env.SEED_HAIR_SALON_PASSWORD || 'Stylist123!',
		slug: 'salon-elegante',
		businessName: 'Salón Elegante',
		ownerName: 'María Estilo',
		category: BusinessCategory.HAIR_SALON,
		status: AccountStatus.ACTIVE,
		primaryColor: '#EC4899',
	},
	{
		label: 'Nails spa (pendiente aprobación)',
		email: process.env.SEED_NAIL_SPA_EMAIL || 'nails.spa@tuapp.com',
		password: process.env.SEED_NAIL_SPA_PASSWORD || 'Stylist123!',
		slug: 'nails-spa',
		businessName: 'Nails Spa',
		ownerName: 'Laura Nails',
		category: BusinessCategory.NAIL_SPA,
		status: AccountStatus.PENDING_APPROVAL,
		primaryColor: '#A855F7',
	},
];

async function ensureSupabaseUser(email, password, fullName) {
	// Este helper crea el usuario en Supabase si no existe.
	// Si ya existe, intenta iniciar sesión para obtener su id.
	const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: { full_name: fullName },
		},
	});

	if (!signUpError && signUpData?.user) {
		return signUpData.user.id;
	}

	// Si el usuario ya existe, intentamos iniciar sesión para recuperar su id
	const message = (signUpError && signUpError.message ? signUpError.message : '').toLowerCase();
	if (message.includes('already') || message.includes('registered') || message.includes('exists')) {
		const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (signInError || !signInData?.user) {
			console.error('[seed] Supabase user existe pero no se pudo iniciar sesión', signInError);
			throw new Error('No se pudo recuperar el usuario de Supabase');
		}
		return signInData.user.id;
	}

	console.error('[seed] Error creando usuario en Supabase:', signUpError);
	throw new Error('No se pudo crear el usuario en Supabase');
}

async function ensureAppUser({ email, password, role, status, fullName }) {
	// Buscar usuario de aplicación existente por email
	let appUser = await prisma.user.findUnique({ where: { email } });

	if (appUser) {
		// Aseguramos que tenga el rol y estado deseados
		if (appUser.role !== role || appUser.status !== status) {
			appUser = await prisma.user.update({
				where: { email },
				data: { role, status },
			});
		}
		return appUser;
	}

	// Si no existe en Prisma, nos aseguramos de tener el usuario en Supabase
	const supabaseAuthId = await ensureSupabaseUser(email, password, fullName);

	appUser = await prisma.user.create({
		data: {
			email,
			supabaseAuthId,
			role,
			status,
		},
	});

	return appUser;
}

function getServicesForCategory(businessCategory) {
	if (businessCategory === BusinessCategory.BARBERSHOP) {
		return [
			{
				name: 'Corte clásico',
				description: 'Corte de barba y cabello con estilo tradicional.',
				durationMinutes: 45,
				price: 30000,
				category: ServiceCategory.CUT,
			},
			{
				name: 'Afeitado clásico',
				description: 'Afeitado con toalla caliente y acabado profesional.',
				durationMinutes: 30,
				price: 25000,
				category: ServiceCategory.TREATMENT,
			},
			{
				name: 'Corte + barba',
				description: 'Paquete completo de corte y arreglo de barba.',
				durationMinutes: 60,
				price: 50000,
				category: ServiceCategory.STYLE,
			},
		];
	}

	if (businessCategory === BusinessCategory.HAIR_SALON) {
		return [
			{
				name: 'Corte dama',
				description: 'Corte personalizado para dama con asesoría de estilo.',
				durationMinutes: 50,
				price: 60000,
				category: ServiceCategory.CUT,
			},
			{
				name: 'Coloración completa',
				description: 'Coloración completa con productos profesionales.',
				durationMinutes: 120,
				price: 180000,
				category: ServiceCategory.COLOR,
			},
			{
				name: 'Peinado para evento',
				description: 'Peinado para bodas, grados y eventos especiales.',
				durationMinutes: 60,
				price: 90000,
				category: ServiceCategory.STYLE,
			},
			{
				name: 'Tratamiento hidratante',
				description: 'Tratamiento profundo para brillo e hidratación.',
				durationMinutes: 45,
				price: 80000,
				category: ServiceCategory.TREATMENT,
			},
		];
	}

	// NAIL_SPA
	return [
		{
			name: 'Manicure spa',
			description: 'Manicure con exfoliación e hidratación.',
			durationMinutes: 45,
			price: 40000,
			category: ServiceCategory.TREATMENT,
		},
		{
			name: 'Pedicure spa',
			description: 'Pedicure completo con masaje relajante.',
			durationMinutes: 60,
			price: 50000,
			category: ServiceCategory.TREATMENT,
		},
		{
			name: 'Uñas acrílicas',
			description: 'Aplicación de uñas acrílicas personalizadas.',
			durationMinutes: 90,
			price: 90000,
			category: ServiceCategory.STYLE,
		},
		{
			name: 'Retoque gel',
			description: 'Mantenimiento y retoque de uñas en gel.',
			durationMinutes: 60,
			price: 60000,
			category: ServiceCategory.TREATMENT,
		},
	];
}

function getPortfolioImagesForCategory(businessCategory) {
	if (businessCategory === BusinessCategory.BARBERSHOP) {
		return [
			'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=800',
			'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
			'https://images.pexels.com/photos/3992873/pexels-photo-3992873.jpeg?auto=compress&cs=tinysrgb&w=800',
		];
	}

	if (businessCategory === BusinessCategory.HAIR_SALON) {
		return [
			'https://images.pexels.com/photos/3738349/pexels-photo-3738349.jpeg?auto=compress&cs=tinysrgb&w=800',
			'https://images.pexels.com/photos/3738346/pexels-photo-3738346.jpeg?auto=compress&cs=tinysrgb&w=800',
			'https://images.pexels.com/photos/3738345/pexels-photo-3738345.jpeg?auto=compress&cs=tinysrgb&w=800',
		];
	}

	// NAIL_SPA
	return [
		'https://images.pexels.com/photos/3738348/pexels-photo-3738348.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738355/pexels-photo-3738355.jpeg?auto=compress&cs=tinysrgb&w=800',
		'https://images.pexels.com/photos/3738373/pexels-photo-3738373.jpeg?auto=compress&cs=tinysrgb&w=800',
	];
}

async function seedSuperAdmin() {
	console.log('\n[1] Creando / asegurando Super Admin...');
	const appUser = await ensureAppUser({
		email: SUPER_ADMIN_EMAIL,
		password: SUPER_ADMIN_PASSWORD,
		role: UserRole.SUPER_ADMIN,
		status: AccountStatus.ACTIVE,
		fullName: 'Super Admin',
	});
	console.log(`✓ Super Admin listo: ${appUser.email}`);
	return appUser;
}

async function seedStylist(stylist, superAdminUser) {
	console.log(`\n[2] Creando / asegurando estilista: ${stylist.label}...`);

	const appUser = await ensureAppUser({
		email: stylist.email,
		password: stylist.password,
		role: UserRole.STYLIST,
		status: stylist.status,
		fullName: stylist.ownerName,
	});

	// Crear / actualizar StylistProfile
	const profileData = {
		businessName: stylist.businessName,
		ownerName: stylist.ownerName,
		category: stylist.category,
		slug: stylist.slug,
		name: stylist.businessName,
		bio: `Perfil de ejemplo para ${stylist.businessName}.`,
		phone: '+57 300 000 0000',
		whatsapp: '+57 300 000 0000',
		email: stylist.email,
		emailVerified: stylist.status !== AccountStatus.PENDING_VERIFICATION,
		whatsappVerified: stylist.status === AccountStatus.ACTIVE,
		emailVerifiedAt: stylist.status !== AccountStatus.PENDING_VERIFICATION ? new Date() : null,
		whatsappVerifiedAt: stylist.status === AccountStatus.ACTIVE ? new Date() : null,
		approvedBy: stylist.status === AccountStatus.ACTIVE ? superAdminUser.id : null,
		approvedAt: stylist.status === AccountStatus.ACTIVE ? new Date() : null,
		primaryColor: stylist.primaryColor,
		city: 'Bogotá',
		country: 'Colombia',
		instagram: '@' + stylist.slug.replace('-', '.'),
		address: 'Calle 123 #45-67',
		photoUrl:
			'https://images.pexels.com/photos/3738349/pexels-photo-3738349.jpeg?auto=compress&cs=tinysrgb&w=800',
	};

	await prisma.stylistProfile.upsert({
		where: { userId: appUser.id },
		update: profileData,
		create: {
			userId: appUser.id,
			...profileData,
		},
	});

	console.log('  ✓ Perfil de estilista configurado');

	// Solo sembramos servicios, horarios y portafolio para estilistas activos
	if (stylist.status !== AccountStatus.ACTIVE) {
		console.log('  (Estado no es ACTIVE, se omiten servicios/horarios/portafolio)');
		return { appUser, createdServices: [], supabaseUserId: appUser.supabaseAuthId };
	}

	const supabaseUserId = appUser.supabaseAuthId;

	// BusinessHours estándar
	await prisma.businessHours.upsert({
		where: { supabaseUserId },
		update: {
			monday: true,
			tuesday: true,
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: stylist.category === BusinessCategory.BARBERSHOP || stylist.category === BusinessCategory.NAIL_SPA,
			sunday: false,
			startTime: '09:00',
			endTime: '18:00',
			slotDuration: 30,
		},
		create: {
			supabaseUserId,
			monday: true,
			tuesday: true,
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: stylist.category === BusinessCategory.BARBERSHOP || stylist.category === BusinessCategory.NAIL_SPA,
			sunday: false,
			startTime: '09:00',
			endTime: '18:00',
			slotDuration: 30,
		},
	});
	console.log('  ✓ Horarios configurados');

	// Servicios de ejemplo según categoría
	await prisma.service.deleteMany({ where: { supabaseUserId } });
	const servicesData = getServicesForCategory(stylist.category);
	const createdServices = [];
	for (const svc of servicesData) {
		const created = await prisma.service.create({
			data: {
				supabaseUserId,
				name: svc.name,
				description: svc.description,
				durationMinutes: svc.durationMinutes,
				price: svc.price,
				category: svc.category,
				active: true,
			},
		});
		createdServices.push(created);
	}
	console.log(`  ✓ ${createdServices.length} servicios creados`);

	// Portafolio de ejemplo
	await prisma.portfolioImage.deleteMany({ where: { supabaseUserId } });
	const portfolioImages = getPortfolioImagesForCategory(stylist.category);
	for (let i = 0; i < portfolioImages.length; i += 1) {
		const imageUrl = portfolioImages[i];
		await prisma.portfolioImage.create({
			data: {
				supabaseUserId,
				imageUrl,
				description: `Trabajo de ejemplo #${i + 1} - ${stylist.businessName}`,
				serviceId: createdServices[i % createdServices.length].id,
			},
		});
	}
	console.log(`  ✓ ${portfolioImages.length} imágenes de portafolio creadas`);

	return { appUser, createdServices, supabaseUserId };
}

async function main() {
	console.log('Iniciando seed multi-tenant...');

	// 1. Super Admin
	const superAdminUser = await seedSuperAdmin();

	// 2. Estilistas de ejemplo
	const seededStylists = [];
	for (const stylist of STYLISTS) {
		// eslint-disable-next-line no-await-in-loop
		const result = await seedStylist(stylist, superAdminUser);
		seededStylists.push({ stylist, result });
	}

	// 3. Resumen final
	console.log('\n=========================================');
	console.log('Seed multi-tenant completado correctamente');
	console.log('=========================================\n');

	console.log('Super Admin:');
	console.log(`- Email: ${SUPER_ADMIN_EMAIL}`);
	console.log(`- Password: ${SUPER_ADMIN_PASSWORD}`);
	console.log(`- URL panel Super Admin: ${FRONTEND_URL}/super-admin/login`);

	console.log('\nEstilistas de ejemplo:');
	seededStylists.forEach(({ stylist }) => {
		console.log(`\n[${stylist.label}]`);
		console.log(`- Email: ${stylist.email}`);
		console.log(`- Password: ${stylist.password}`);
		console.log(`- Estado: ${stylist.status}`);
		console.log(`- Categoría: ${stylist.category}`);
		console.log(`- Landing pública: ${FRONTEND_URL}/${stylist.slug}`);
	});
}

main()
	.catch((err) => {
		console.error('Seed falló con error:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
