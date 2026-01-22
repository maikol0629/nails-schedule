import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import apiClient from '../services/apiConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const initAuth = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (!isMounted) return;

				if (!session?.user) {
					setUser(null);
					setLoading(false);
					return;
				}

				// Validar que la cuenta asociada a la sesión esté ACTIVA
				try {
					await apiClient.get('/api/auth/me');
					if (!isMounted) return;
					setUser(session.user);
				} catch (error) {
					const status = error?.response?.status;
					if (status === 401 || status === 403) {
						await supabase.auth.signOut();
					}
					if (!isMounted) return;
					setUser(null);
				}

				setLoading(false);
			} catch (error) {
				console.error('Error initializing auth:', error);
				if (isMounted) {
					setUser(null);
					setLoading(false);
				}
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!isMounted) return;
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const loginWithPassword = async (email, password) => {
		// 1. Iniciar sesión en Supabase
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			throw error;
		}

		// 2. Validar inmediatamente contra el backend que la cuenta esté ACTIVA
		try {
			const response = await apiClient.get('/api/auth/me');
			// Devolvemos los datos del backend (incluye rol, status, email)
			return response.data;
		} catch (err) {
			const status = err?.response?.status;
			if (status === 401 || status === 403) {
				await supabase.auth.signOut();
				setUser(null);
				throw new Error(
					'Tu cuenta aún no está activa. Revisa tu correo o espera la aprobación.',
				);
			}
			throw err;
		}
	};

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			throw error;
		}
		setUser(null);
	};

	const value = {
		user,
		loading,
		loginWithPassword,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}
