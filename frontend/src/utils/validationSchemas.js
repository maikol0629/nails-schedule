import * as Yup from 'yup';

// Enum de categorías de servicio, alineado con el backend (ServiceCategory)
export const SERVICE_CATEGORIES = ['CUT', 'COLOR', 'STYLE', 'TREATMENT'];

// Helper para fecha mínima (hoy)
function todayAtMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const bookingSchema = Yup.object().shape({
  clientName: Yup.string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .required('El nombre es obligatorio'),
  clientPhone: Yup.string()
    .trim()
    .matches(/^[0-9]{10}$/, 'El teléfono debe tener 10 dígitos (formato colombiano)')
    .required('El teléfono es obligatorio'),
  clientEmail: Yup.string()
    .trim()
    .email('El email no tiene un formato válido')
    .nullable()
    .optional(),
  serviceId: Yup.number()
    .typeError('El servicio es obligatorio')
    .positive('El servicio es obligatorio')
    .required('El servicio es obligatorio'),
  date: Yup.date()
    .typeError('La fecha no es válida')
    .min(todayAtMidnight(), 'La fecha debe ser hoy o futura')
    .required('La fecha es obligatoria'),
  time: Yup.string()
    .trim()
    .required('La hora es obligatoria'),
});

export const serviceSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .max(100, 'El nombre no puede superar 100 caracteres')
    .required('El nombre es obligatorio'),
  description: Yup.string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .nullable()
    .optional(),
  duration: Yup.number()
    .typeError('La duración debe ser un número')
    .positive('La duración debe ser un número positivo')
    .required('La duración es obligatoria'),
  price: Yup.number()
    .typeError('El precio debe ser un número')
    .positive('El precio debe ser un número positivo')
    .required('El precio es obligatorio'),
  category: Yup.string()
    .oneOf(SERVICE_CATEGORIES, 'La categoría seleccionada no es válida')
    .required('La categoría es obligatoria'),
});

export const profileSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .max(100, 'El nombre no puede superar 100 caracteres')
    .required('El nombre es obligatorio'),
  bio: Yup.string()
    .trim()
    .max(500, 'La biografía no puede superar 500 caracteres')
    .nullable()
    .optional(),
  phone: Yup.string()
    .trim()
    .matches(/^[0-9+()\s-]{6,20}$/, 'El teléfono no tiene un formato válido')
    .nullable()
    .optional(),
  email: Yup.string()
    .trim()
    .email('El email no tiene un formato válido')
    .nullable()
    .optional(),
});

export default {
  bookingSchema,
  serviceSchema,
  profileSchema,
  SERVICE_CATEGORIES,
};
