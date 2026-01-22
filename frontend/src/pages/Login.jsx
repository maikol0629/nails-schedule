import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../config/supabase';
import apiClient from '../services/apiConfig';

export default function Login() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');

	useEffect(() => {
		if (!loading && user) {
			navigate('/admin/dashboard', { replace: true });
		}
	}, [loading, user, navigate]);

	const [sendingCode, setSendingCode] = useState(false);
	const [verifyingCode, setVerifyingCode] = useState(false);

	const requestOtp = async (event) => {
		event.preventDefault();
		setSendingCode(true);
		try {
			if (!email) {
				throw new Error('El email es obligatorio');
			}
			setEmail(email);
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: { shouldCreateUser: false },
			});
			if (error) throw error;
			toast.success('Te enviamos un código de acceso a tu correo. Revisa tu bandeja de entrada.');
			setStep(2);
		} catch (error) {
			console.error(error);
			toast.error(error.message || 'No se pudo enviar el código de acceso.');
		} finally {
			setSendingCode(false);
		}
	};

	const verifyOtp = async (event) => {
		event.preventDefault();
		setVerifyingCode(true);
		try {
			if (!code) {
				throw new Error('El código es obligatorio');
			}
			const { data, error } = await supabase.auth.verifyOtp({
				email,
				token: code,
				type: 'magiclink',
			});
			if (error) throw error;

			// Validar estado de cuenta en backend
			try {
				await apiClient.get('/api/auth/me');
				toast.success('Sesión iniciada correctamente');
				navigate('/admin/dashboard');
			} catch (err) {
				const status = err?.response?.status;
				const backendCode = err?.response?.data?.code;
				if (status === 401 || status === 403) {
					await supabase.auth.signOut();
					if (backendCode === 'ACCOUNT_INACTIVE') {
						navigate('/account-inactive');
						return;
					}
					throw new Error('Tu cuenta aún no está activa. Revisa tu correo o espera la aprobación.');
				}
				throw err;
			}
		} catch (error) {
			console.error(error);
			toast.error(error.message || 'No se pudo verificar el código.');
		} finally {
			setVerifyingCode(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
			<div className="w-full max-w-md bg-white shadow-card rounded-xl p-8">
				<h1 className="text-2xl font-semibold text-slate-900 mb-2">Bienvenida de nuevo</h1>
				<p className="text-slate-500 mb-6 text-sm">
					Gestiona tus citas, servicios y clientes desde un solo lugar.
				</p>

				{step === 1 && (
					<form onSubmit={requestOtp} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
							<input
								type="email"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								placeholder="tu@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						<button
							type="submit"
							disabled={sendingCode}
							className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{sendingCode ? 'Enviando código...' : 'Enviar código de acceso'}
						</button>
					</form>
				)}

				{step === 2 && (
					<form onSubmit={verifyOtp} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">
								Código enviado a {email}
							</label>
							<input
								type="text"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent tracking-[0.3em] text-center"
								placeholder="Ingresa tu código"
								value={code}
								onChange={(e) => setCode(e.target.value)}
							/>
						</div>

						<button
							type="submit"
							disabled={verifyingCode}
							className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{verifyingCode ? 'Verificando código...' : 'Iniciar sesión'}
						</button>
					</form>
				)}

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
