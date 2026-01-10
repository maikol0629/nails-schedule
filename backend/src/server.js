require('dotenv').config();

const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const clientsRoutes = require('./routes/clients');
const appointmentsRoutes = require('./routes/appointments');
const dashboardRoutes = require('./routes/dashboard');
const portfolioRoutes = require('./routes/portfolio');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const setupRoutes = require('./routes/setup');

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration: allow public/admin frontends
const corsOptions = {
	origin:
		process.env.NODE_ENV === 'production'
			? process.env.FRONTEND_URL
			: 'http://localhost:5173',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// API routes
// Ruta de configuración inicial (solo para desarrollo / bootstrap)
app.use('/api/setup', setupRoutes);

// Rutas públicas (sin autenticación)
app.use('/api/public', publicRoutes);

// Rutas de autenticación / registro de estilistas
app.use('/api/auth', authRoutes);

// Rutas principales autenticadas y de recursos internos
app.use('/api', routes);
app.use('/api/services', servicesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Rutas de administración del estilista (protección por middleware en adminRoutes)
app.use('/api/admin', adminRoutes);

// Rutas de administración global (SUPER_ADMIN)
app.use('/api/super-admin', superAdminRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
	console.error(err);
	const status = err.status || 500;
	const message = err.message || 'Internal server error';
	res.status(status).json({ message });
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

