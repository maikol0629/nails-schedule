import { useState } from 'react';
import { supabase } from '../config/supabase';
import apiClient from '../services/apiConfig';

function mapSupabaseError(error) {
  if (!error) return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
  const message = error.message || '';

  if (message.toLowerCase().includes('rate limit')) {
    return 'Has solicitado demasiados códigos en poco tiempo. Espera un momento e inténtalo de nuevo.';
  }
  if (message.toLowerCase().includes('otp') && message.toLowerCase().includes('expired')) {
    return 'El código ha expirado. Solicita uno nuevo.';
  }
  if (message.toLowerCase().includes('otp') && message.toLowerCase().includes('invalid')) {
    return 'El código ingresado no es válido.';
  }

  if (message.toLowerCase().includes('email address is already registered')) {
    return 'Este email ya tiene una cuenta. Si es tuyo, usa el mismo email para acceder.';
  }

  return message || 'Ha ocurrido un error con el servicio de autenticación.';
}

export function useOtpSignup() {
  const [loading, setLoading] = useState(false);

  const requestOtp = async (email) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw new Error(mapSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndPersistProfile = async ({ email, code, profile }) => {
    setLoading(true);
    try {
      // 1. intentar verificar como magiclink
      let { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'magiclink',
      });

      // 2. si falla, intentar como signup
      if (error) {
        const secondTry = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'signup',
        });
        data = secondTry.data;
        error = secondTry.error;
      }

      if (error) throw new Error(mapSupabaseError(error));

      const session = data.session;
      if (!session?.access_token) {
        throw new Error('No se pudo obtener la sesión después de verificar el código.');
      }

      // 3. llamar al backend para crear el perfil (payload PLANO)
      try {
        await apiClient.post(
          '/api/auth/complete-profile',
          {
            email,
            ...profile, // <-- en lugar de { email, profile }
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );
      } catch (err) {
        const backendErrors = err.response?.data?.errors;
        if (Array.isArray(backendErrors) && backendErrors.length > 0) {
          // Asume que cada error tiene { message }
          throw new Error(backendErrors[0].message || 'Error al completar el perfil.');
        }
        throw err;
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    requestOtp,
    verifyOtpAndPersistProfile,
  };
}

export default useOtpSignup;
