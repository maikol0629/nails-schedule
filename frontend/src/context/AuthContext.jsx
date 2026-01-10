import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

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

				setUser(session?.user ?? null);
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

	const login = async (email, password) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			throw error;
		}

		setUser(data.user ?? null);
		return data;
	};

	const signup = async (email, password) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			throw error;
		}

		// Dependiendo de la configuración de Supabase, puede requerir verificación de email
		setUser(data.user ?? null);
		return data;
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
		login,
		signup,
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
