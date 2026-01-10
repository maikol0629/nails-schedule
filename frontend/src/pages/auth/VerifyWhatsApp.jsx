import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { verifyWhatsAppCode } from '../../services/authApi';

const schema = yup.object({
  code: yup
    .string()
    .required('El código es obligatorio')
    .matches(/^[0-9]{6}$/, 'El código debe tener 6 dígitos numéricos'),
});

export default function VerifyWhatsApp() {
  const location = useLocation();
  const userId = useMemo(() => {
    const fromState = location.state?.userId;
    const fromStorage = localStorage.getItem('pendingStylistUserId');
    return fromState || fromStorage || null;
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }) => {
    if (!userId) {
      toast.error('No se encontró el usuario asociado al registro');
      return;
    }

    try {
      await verifyWhatsAppCode({ userId, code });
      toast.success('Tu solicitud está en revisión, te notificaremos por email');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'No se pudo verificar el código');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-card rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifica tu WhatsApp</h1>
        <p className="text-sm text-slate-500 mb-4">
          Te hemos enviado un código de 6 dígitos a tu número de WhatsApp. Ingrésalo para completar el registro.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Código de verificación</label>
            <input
              type="text"
              maxLength={6}
              className="w-full tracking-[0.3em] text-center rounded-lg border border-slate-200 px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="000000"
              {...register('code')}
            />
            {errors.code && (
              <p className="mt-1 text-[11px] text-red-600">{errors.code.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500">
          Si no recibiste el código, espera unos minutos y revisa tu conexión a internet.
        </p>
      </div>
    </div>
  );
}
