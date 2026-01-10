import axios from 'axios';
import { toast } from 'react-hot-toast';
import { supabase } from '../config/supabase';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL no está definido. Configura la URL base del backend en el .env del frontend.');
}

const apiClient = axios.create({
  baseURL: baseURL || '',
  timeout: 30000, // 30 segundos
});

// Interceptor de request: agrega el token de Supabase si existe
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (token) {
        // No sobreescribimos Authorization si ya viene seteado manualmente
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error obteniendo la sesión de Supabase:', error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de response: manejo de errores y toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    const currentPath = window.location.pathname;

    // 401 - No autorizado
    if (status === 401) {
      if (message) {
        toast.error(message);
      } else {
        toast.error('Tu sesión ha expirado. Inicia sesión de nuevo.');
      }

      // Redirigir solo si estamos en zona admin o llamando a endpoints protegidos
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    // 403 - Prohibido
    else if (status === 403) {
      toast.error(message || 'No tienes permisos para realizar esta acción.');
    }
    // 404 - No encontrado
    else if (status === 404) {
      toast.error(message || 'Recurso no encontrado.');
    }
    // 500+ - Error servidor
    else if (status >= 500) {
      toast.error(message || 'Error interno del servidor. Inténtalo de nuevo más tarde.');
    } else if (!status) {
      // Errores de red / timeout
      toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
