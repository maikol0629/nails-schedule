import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { step1EmailSchema, step2ProfileSchema, step3OtpSchema } from '../../validation/registrationSchemas.zod';
import { useOtpSignup } from '../../hooks/useOtpSignup';
import { useAuth } from '../../context/AuthContext.jsx';
import { supabase } from '../../config/supabase';
import apiClient from '../../services/apiConfig';

export default function StylistRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [profileDraft, setProfileDraft] = useState(null);
  const { loading: otpLoading, requestOtp, verifyOtpAndPersistProfile } = useOtpSignup();

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm({
    resolver: zodResolver(step1EmailSchema),
    defaultValues: { email: '' },
  });

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch: watchStep2,
    setValue: setValueStep2,
    formState: { errors: errorsStep2 },
  } = useForm({
    resolver: zodResolver(step2ProfileSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      category: 'NAIL_SPA',
      phone: '',
      whatsapp: '',
      sameWhatsappAsPhone: false,
    },
  });

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3 },
  } = useForm({
    resolver: zodResolver(step3OtpSchema),
    defaultValues: { code: '' },
  });

  const sameWhatsappAsPhone = watchStep2('sameWhatsappAsPhone');
  const phoneValue = watchStep2('phone');

  // Mantener sincronizado WhatsApp cuando el checkbox está marcado
  useEffect(() => {
    if (sameWhatsappAsPhone && phoneValue) {
      setValueStep2('whatsapp', phoneValue, { shouldValidate: false, shouldDirty: true });
    }
  }, [sameWhatsappAsPhone, phoneValue, setValueStep2]);

  // Si venimos redirigidos porque el usuario ya está autenticado en Supabase
  // pero no tiene registro en la tabla Users, saltamos directamente al paso 2
  // usando el email de la sesión actual.
  useEffect(() => {
    const resume = searchParams.get('resume');
    if (resume === '1' && user?.email) {
      setEmail(user.email);
      setStep(2);
    }
  }, [searchParams, user]);

  const onSubmitStep1 = async (values) => {
    try {
      // Verificar si el email ya está registrado antes de continuar
      const response = await apiClient.get('/api/auth/check-email', {
        params: { email: values.email },
      });

      const { available } = response.data || {};

      if (available === false) {
        toast.error('Este email ya está registrado. Si es tuyo, inicia sesión en lugar de registrarte.');
        return;
      }

      setEmail(values.email);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo verificar el email. Inténtalo de nuevo.');
    }
  };

  const onSubmitStep2 = async (values) => {
    try {
      const profile = {
        businessName: values.businessName,
        ownerName: values.ownerName,
        category: values.category,
        phone: values.phone,
        whatsapp: values.whatsapp,
      };

      await requestOtp(email);
      setProfileDraft(profile);
      toast.success('Te enviamos un código de acceso a tu correo. Revisa tu bandeja de entrada.');
      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'No se pudo enviar el código de acceso.');
    }
  };

  const onSubmitStep3 = async ({ code }) => {
    if (!profileDraft) {
      toast.error('No se encontró la información de tu perfil. Vuelve a intentarlo.');
      setStep(1);
      return;
    }

    try {
      await verifyOtpAndPersistProfile({ email, code, profile: profileDraft });
      // Cerrar sesión tras completar el registro para que la primera sesión
      // sea siempre un login explícito del usuario.
      await supabase.auth.signOut();

      toast.success('Cuenta creada y verificada correctamente. Ahora puedes iniciar sesión.');
      navigate('/admin/login');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'No se pudo verificar el código.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-slate-50 to-indigo-50 px-4 py-8">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-pink-500 to-indigo-500 text-white p-8 space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">Crea tu agenda de citas</h1>
            <p className="text-sm text-pink-50">
              Administra tus horarios, servicios y clientes desde una plataforma sencilla y pensada para estilistas.
            </p>
            <ul className="text-xs space-y-2 text-pink-50/90">
              <li>• Configura tus servicios y precios</li>
              <li>• Recibe reservas online 24/7</li>
              <li>• Organiza tu día con una agenda visual</li>
            </ul>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Registro para estilistas</h2>
            <p className="text-xs text-slate-500 mb-6">
              Completa tus datos para crear tu cuenta y empezar a recibir reservas.
            </p>

            <form
              onSubmit={
                step === 1
                  ? handleSubmitStep1(onSubmitStep1)
                  : step === 2
                    ? handleSubmitStep2(onSubmitStep2)
                    : handleSubmitStep3(onSubmitStep3)
              }
              className="space-y-4"
            >
              {step === 1 && (
                <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="tu@email.com"
                    {...registerStep1('email')}
                  />
                  {errorsStep1.email && (
                    <p className="mt-1 text-[11px] text-red-600">{errorsStep1.email.message}</p>
                  )}
                </div>

              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del negocio</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu marca o salón"
                        {...registerStep2('businessName')}
                      />
                      {errorsStep2.businessName && (
                        <p className="mt-1 text-[11px] text-red-600">{errorsStep2.businessName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del propietario</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu nombre"
                        {...registerStep2('ownerName')}
                      />
                      {errorsStep2.ownerName && (
                        <p className="mt-1 text-[11px] text-red-600">{errorsStep2.ownerName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        {...registerStep2('category')}
                      >
                    <option value="BARBERSHOP">Barbería</option>
                    <option value="HAIR_SALON">Peluquería</option>
                    <option value="NAIL_SPA">Nails</option>
                  </select>
                      {errorsStep2.category && (
                        <p className="mt-1 text-[11px] text-red-600">{errorsStep2.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu número de contacto"
                        {...registerStep2('phone')}
                      />
                      {errorsStep2.phone && (
                        <p className="mt-1 text-[11px] text-red-600">{errorsStep2.phone.message}</p>
                      )}
                    </div>
                  
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Número donde recibirás reservas y notificaciones"
                      {...registerStep2('whatsapp')}
                      disabled={sameWhatsappAsPhone}
                    />
                    {errorsStep2.whatsapp && (
                      <p className="mt-1 text-[11px] text-red-600">{errorsStep2.whatsapp.message}</p>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                      {...registerStep2('sameWhatsappAsPhone')}
                    />
                    WhatsApp es igual al teléfono
                  </label>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? 'Enviando código...' : 'Enviar código de acceso'}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Al registrarte aceptas nuestros términos de uso y política de privacidad.
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-xs text-slate-500 mb-4 text-left">
                    Te enviamos un código de 6 dígitos a tu correo <span className="font-medium">{email}</span>. Ingrésalo a continuación para completar tu registro.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Código de verificación</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full tracking-[0.3em] text-center rounded-lg border border-slate-200 px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="000000"
                      {...registerStep3('code')}
                    />
                    {errorsStep3.code && (
                      <p className="mt-1 text-[11px] text-red-600">{errorsStep3.code.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? 'Verificando código...' : 'Verificar y continuar'}
                  </button>

                  <p className="mt-4 text-[11px] text-slate-400 text-center">
                    Si no ves el correo en unos minutos, revisa también tu carpeta de spam.
                  </p>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
