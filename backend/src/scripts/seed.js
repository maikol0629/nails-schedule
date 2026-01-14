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

const { supabaseAdmin } = require('../config/supabaseAdmin');

async function ensureSupabaseUser({ email, password, fullName }) {
	try {
		// 1. Listar usuarios filtrando por email
		const { data: listData, error: listError } = 
			await supabaseAdmin.auth.admin.listUsers();

		if (listError) {
			console.error('[seed][auth] Error listando usuarios:', listError);
			throw new Error(`Error al listar usuarios: ${listError.message}`);
		}

		// Buscar el usuario con el email específico
		const existingUser = listData?.users?.find(u => u.email === email);

		if (existingUser) {
			// Si el usuario existe pero el email no está confirmado, lo marcamos como confirmado
			if (!existingUser.email_confirmed_at) {
				try {
					const { data: updated } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
						email_confirm: true,
						user_metadata: {
							...(existingUser.user_metadata || {}),
							full_name: fullName,
							seeded: true,
						},
					});
					console.log(`  ✓ Usuario existente confirmado en Supabase: ${email}`);
					return updated.user.id;
				} catch (updateError) {
					console.error('[seed][auth] Error confirmando usuario existente:', updateError);
					return existingUser.id;
				}
			}

			console.log(`  ✓ Usuario ya existe en Supabase: ${email}`);
			return existingUser.id;
		}

		// 2. Crear usuario si no existe
		console.log(`  → Creando nuevo usuario en Supabase: ${email}`);
		const { data: created, error: createError } =
			await supabaseAdmin.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				user_metadata: {
					full_name: fullName,
					seeded: true,
				},
			});

		if (createError || !created?.user) {
			console.error('[seed][auth] Error creando usuario:', createError);
			throw new Error(`No se pudo crear usuario en Supabase Auth: ${createError?.message}`);
		}

		console.log(`  ✓ Usuario creado en Supabase: ${email}`);
		return created.user.id;
	} catch (error) {
		console.error('[seed][auth] Error en ensureSupabaseUser:', error);
		throw error;
	}
}

async function ensureAppUser({ email, password, role, status, fullName }) {
	try {
		const supabaseAuthId = await ensureSupabaseUser({
			email,
			password,
			fullName,
		});

		// 1. Buscar por supabaseAuthId (fuente de verdad)
		const userByAuthId = await prisma.user.findUnique({
			where: { supabaseAuthId },
		});

		if (userByAuthId) {
			console.log(`  ✓ Usuario encontrado por authId, actualizando...`);
			return prisma.user.update({
				where: { supabaseAuthId },
				data: {
					email,
					role,
					status
				},
			});
		}

		// 2. Buscar por email (posible registro viejo / inconsistente)
		const userByEmail = await prisma.user.findUnique({
			where: { email },
		});

		if (userByEmail) {
			console.log(`  ✓ Usuario encontrado por email, vinculando authId...`);
			return prisma.user.update({
				where: { email },
				data: {
					supabaseAuthId,
					role,
					status
				},
			});
		}

		// 3. Crear usuario nuevo
		console.log(`  → Creando nuevo usuario en BD: ${email}`);
		return prisma.user.create({
			data: {
				email,
				supabaseAuthId,
				role,
				status
			},
		});
	} catch (error) {
		console.error('[seed][ensureAppUser] Error:', error);
		throw error;
	}
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
	try {
		const appUser = await ensureAppUser({
			email: SUPER_ADMIN_EMAIL,
			password: SUPER_ADMIN_PASSWORD,
			role: UserRole.SUPER_ADMIN,
			status: AccountStatus.ACTIVE,
			fullName: 'Super Admin',
		});
		console.log(`✓ Super Admin listo: ${appUser.email} (ID: ${appUser.id})`);
		return appUser;
	} catch (error) {
		console.error('Error creando Super Admin:', error);
		throw error;
	}
}

async function seedStylist(stylist, superAdminUser) {
	console.log(`\n[2] Creando / asegurando estilista: ${stylist.label}...`);

	try {
		const appUser = await ensureAppUser({
			email: stylist.email,
			password: stylist.password,
			role: UserRole.STYLIST,
			status: stylist.status,
			fullName: stylist.ownerName,
		});

		console.log(`  ✓ Usuario app creado/actualizado: ${appUser.email} (ID: ${appUser.id})`);

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
			return { appUser, createdServices: [], supabaseAuthId: appUser.supabaseAuthId };
		}

		const userId = appUser.id;

		// BusinessHours estándar
		await prisma.businessHours.upsert({
			where: { userId },
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
				userId,
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
		await prisma.service.deleteMany({ where: { userId } });
		const servicesData = getServicesForCategory(stylist.category);
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
					active: true,
				},
			});
			createdServices.push(created);
		}
		console.log(`  ✓ ${createdServices.length} servicios creados`);

		// Portafolio de ejemplo
		await prisma.portfolioImage.deleteMany({ where: { userId } });
		const portfolioImages = getPortfolioImagesForCategory(stylist.category);
		for (let i = 0; i < portfolioImages.length; i += 1) {
			const imageUrl = portfolioImages[i];
			await prisma.portfolioImage.create({
				data: {
					userId,
					imageUrl,
					description: `Trabajo de ejemplo #${i + 1} - ${stylist.businessName}`,
					serviceId: createdServices[i % createdServices.length].id,
				},
			});
		}
		console.log(`  ✓ ${portfolioImages.length} imágenes de portafolio creadas`);

		return { appUser, createdServices, supabaseAuthId: appUser.supabaseAuthId };
	} catch (error) {
		console.error(`Error creando estilista ${stylist.label}:`, error);
		throw error;
	}
}

async function main() {
	console.log('Iniciando seed multi-tenant...');
	console.log('=========================================\n');

	try {
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
		seededStylists.forEach(({ stylist, result }) => {
			console.log(`\n[${stylist.label}]`);
			console.log(`- Email: ${stylist.email}`);
			console.log(`- Password: ${stylist.password}`);
			console.log(`- Estado: ${stylist.status}`);
			console.log(`- Categoría: ${stylist.category}`);
			console.log(`- User ID: ${result.appUser.id}`);
			console.log(`- Supabase Auth ID: ${result.supabaseUserId}`);
			console.log(`- Landing pública: ${FRONTEND_URL}/${stylist.slug}`);
		});

		console.log('\n✓ Todos los usuarios fueron creados exitosamente');
	} catch (error) {
		console.error('\n❌ Error durante el seed:', error);
		throw error;
	}
}

main()
	.catch((err) => {
		console.error('\n❌ Seed falló con error:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});