import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext.jsx';
import { registerStylist } from '../../services/authApi';

const schema = yup.object({
  email: yup
    .string()
    .email('Email inválido')
    .required('El email es obligatorio'),
  password: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es obligatoria'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Debes confirmar la contraseña'),
  businessName: yup.string().required('El nombre del negocio es obligatorio'),
  ownerName: yup.string().required('El nombre del propietario es obligatorio'),
  category: yup
    .mixed()
    .oneOf(['BARBERSHOP', 'HAIR_SALON', 'NAIL_SPA'], 'Selecciona una categoría válida')
    .required('La categoría es obligatoria'),
  phone: yup.string().required('El teléfono es obligatorio'),
  whatsapp: yup.string().required('El WhatsApp es obligatorio'),
});

export default function StylistRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      ownerName: '',
      category: 'NAIL_SPA',
      phone: '',
      whatsapp: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        email: values.email,
        password: values.password,
        businessName: values.businessName,
        ownerName: values.ownerName,
        category: values.category,
        phone: values.phone,
        whatsapp: values.whatsapp,
      };

      const data = await registerStylist(payload);

      if (data?.userId) {
        localStorage.setItem('pendingStylistUserId', data.userId);
      }

      toast.success(data?.message || 'Registro iniciado, revisa tu email');
      navigate('/admin/verify-email', { state: { userId: data?.userId } });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al registrar estilista');
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="tu@email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tu número de contacto"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Repite tu contraseña"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del negocio</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tu marca o salón"
                  {...register('businessName')}
                />
                {errors.businessName && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.businessName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del propietario</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tu nombre"
                    {...register('ownerName')}
                  />
                  {errors.ownerName && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.ownerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    {...register('category')}
                  >
                    <option value="BARBERSHOP">Barbería</option>
                    <option value="HAIR_SALON">Peluquería</option>
                    <option value="NAIL_SPA">Nails</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Número donde recibirás códigos y reservas"
                  {...register('whatsapp')}
                />
                {errors.whatsapp && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.whatsapp.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 mt-2 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de estilista'}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-2">
                Al registrarte aceptas nuestros términos de uso y política de privacidad.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
