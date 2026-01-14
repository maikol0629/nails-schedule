import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../services/apiConfig';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requiredRole }) {
	const { user, loading, logout } = useAuth();
	const location = useLocation();
	const [checking, setChecking] = useState(true);
	const [appUser, setAppUser] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		let cancelled = false;

		async function fetchMe() {
			if (!user) {
				setChecking(false);
				return;
			}

			try {
				const response = await apiClient.get('/api/auth/me');
				if (!cancelled) {
					setAppUser(response.data);
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error('Error fetching /api/auth/me', err);
				if (!cancelled) {
					setError('No se pudo validar tu sesión');
				}
			} finally {
				if (!cancelled) {
					setChecking(false);
				}
			}
		}

		fetchMe();

		return () => {
			cancelled = true;
		};
	}, [user]);

	const isSuperAdminPath = location.pathname.startsWith('/super-admin');
	const loginPath = isSuperAdminPath ? '/super-admin/login' : '/admin/login';

	if (loading || checking) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="text-slate-500">Cargando...</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to={loginPath} replace />;
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="text-slate-600 text-center text-sm">
					{error}
				</div>
			</div>
		);
	}

	if (!appUser) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="text-slate-500">Cargando...</div>
			</div>
		);
	}

	if (appUser.status && appUser.status !== 'ACTIVE') {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
				<div className="text-slate-600 text-center text-sm">Cuenta inactiva</div>
				<button
					type="button"
					onClick={async () => {
						try {
							await logout();
							window.location.href = isSuperAdminPath ? '/super-admin/login' : '/admin/login';
						} catch (e) {
							// eslint-disable-next-line no-console
							console.error('Error cerrando sesión:', e);
						}
					}}
					className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
				>
					Cerrar sesión
				</button>
			</div>
		);
	}

	if (requiredRole && appUser.role !== requiredRole) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="text-slate-600 text-center text-sm">
					No tienes permisos para acceder a esta sección.
				</div>
			</div>
		);
	}

	return children;
}
