import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { verifyEmailToken } from '../../services/authApi';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function VerifyEmailToken() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        await verifyEmailToken(token);
        setStatus('success');
        setMessage('Email verificado correctamente. Te hemos enviado un código por WhatsApp.');
        toast.success('Email verificado');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage(error.message || 'No se pudo verificar el email.');
      }
    };

    if (token) {
      run();
    } else {
      setStatus('error');
      setMessage('Token de verificación inválido');
    }
  }, [token]);

  const handleContinue = () => {
    const userId = localStorage.getItem('pendingStylistUserId');
    if (userId) {
      navigate('/verify-whatsapp', { state: { userId } });
    } else {
      navigate('/verify-whatsapp');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-card rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Verificando email...</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-xs text-slate-500">Estamos confirmando tu correo electrónico.</p>
          </div>
        )}

        {status !== 'loading' && (
          <>
            <p className="text-sm text-slate-600 mb-4">{message}</p>
            {status === 'success' && (
              <button
                type="button"
                onClick={handleContinue}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark transition-colors"
              >
                Continuar con verificación de WhatsApp
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
