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
	const [authErrorCode, setAuthErrorCode] = useState(null);

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
				if (!cancelled) {
					const status = err?.response?.status;
					const code = err?.response?.data?.code;
					// Para 401/403, no logeamos en consola para evitar ruido: solo
					// manejamos los códigos esperados.
					if (status === 403 && code) {
						setAuthErrorCode(code);
					} else if (status === 401) {
						// Sesión inválida/expirada: delegamos al flujo de login sin error global.
						setError(null);
					} else {
						// eslint-disable-next-line no-console
						console.error('Error fetching /api/auth/me', err);
						setError('No se pudo validar tu sesión');
					}
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

	// Usuario autenticado en Supabase pero sin registro en la tabla Users:
	// lo redirigimos al flujo de registro para que complete sus datos.
	if (authErrorCode === 'USER_NOT_REGISTERED') {
		const target = isSuperAdminPath ? '/super-admin/login' : '/admin/register?resume=1';
		return <Navigate to={target} replace />;
	}

	// Usuario con registro en Users pero con estado distinto de ACTIVE:
	// lo llevamos a una página informativa de cuenta inactiva.
	if (authErrorCode === 'ACCOUNT_INACTIVE') {
		return <Navigate to="/account-inactive" replace />;
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
		return <Navigate to="/account-inactive" replace />;
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
