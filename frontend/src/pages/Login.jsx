import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const schema = yup.object({
	email: yup
		.string()
		.email('Email inválido')
		.required('El email es obligatorio'),
	password: yup
		.string()
		.min(6, 'La contraseña debe tener al menos 6 caracteres')
		.required('La contraseña es obligatoria'),
});

export default function Login() {
	const { user, loading, login } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && user) {
			navigate('/admin/dashboard', { replace: true });
		}
	}, [loading, user, navigate]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
	});

	const onSubmit = async (values) => {
		try {
			await login(values.email, values.password);
			toast.success('Sesión iniciada correctamente');
			navigate('/admin/dashboard');
		} catch (error) {
			console.error(error);
			toast.error(error.message || 'Error al iniciar sesión');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
			<div className="w-full max-w-md bg-white shadow-card rounded-xl p-8">
				<h1 className="text-2xl font-semibold text-slate-900 mb-2">Bienvenida de nuevo</h1>
				<p className="text-slate-500 mb-6 text-sm">
					Gestiona tus citas, servicios y clientes desde un solo lugar.
				</p>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
						<input
							type="email"
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="tu@email.com"
							{...register('email')}
						/>
						{errors.email && (
							<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
						<input
							type="password"
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="••••••••"
							{...register('password')}
						/>
						{errors.password && (
							<p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
						)}
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
					</button>
				</form>

				<p className="mt-6 text-xs text-slate-500 text-center">
					¿No tienes cuenta?{' '}
					<Link
						to="/admin/register"
						className="text-primary font-medium hover:text-primary-dark"
					>
						Crear cuenta
					</Link>
				</p>
			</div>
		</div>
	);
}
