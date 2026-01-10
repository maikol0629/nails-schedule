import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { getRegistrationStatus } from '../../services/authApi';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = useMemo(() => {
    const fromState = location.state?.userId;
    const fromStorage = localStorage.getItem('pendingStylistUserId');
    return fromState || fromStorage || null;
  }, [location.state]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('No se encontró información de registro. Vuelve a intentarlo.');
      return;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const data = await getRegistrationStatus(userId);
        if (!isMounted) return;
        setStatus(data);
        setLoading(false);

        if (data.emailVerified) {
          toast.success('Email verificado');
          navigate('/admin/verify-whatsapp', { state: { userId } });
        }
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError(err.message || 'No se pudo obtener el estado de registro');
        setLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId, navigate]);

  const handleResend = () => {
    toast('Si no ves el email, revisa tu carpeta de spam.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-card rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifica tu correo</h1>
        <p className="text-sm text-slate-500 mb-4">
          Te hemos enviado un enlace de verificación al correo que registraste.
        </p>

        {loading && <p className="text-xs text-slate-400">Comprobando estado de verificación...</p>}

        {error && !loading && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}

        {status && !loading && !status.emailVerified && (
          <p className="text-xs text-slate-500 mb-4">
            Esta pantalla se actualizará automáticamente cuando confirmes tu email.
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Reenviar email
        </button>
      </div>
    </div>
  );
}
