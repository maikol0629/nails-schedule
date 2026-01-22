import { z } from 'zod';

export const step1EmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El email es obligatorio')
    .email('Email inválido'),
});

export const step2ProfileSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, 'El nombre del negocio es obligatorio'),
  ownerName: z
    .string()
    .trim()
    .min(1, 'El nombre del propietario es obligatorio'),
  category: z
    .enum(['BARBERSHOP', 'HAIR_SALON', 'NAIL_SPA'], {
      errorMap: () => ({ message: 'Selecciona una categoría válida' }),
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio'),
  whatsapp: z
    .string()
    .trim()
    .min(1, 'El WhatsApp es obligatorio'),
  sameWhatsappAsPhone: z.boolean().optional(),
});

export const step3OtpSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^[0-9]{6}$/, 'El código debe tener 6 dígitos numéricos'),
});

export function mapZodError(err) {
  if (!err || !err.issues || !err.issues.length) return 'Ha ocurrido un error de validación.';
  const first = err.issues[0];
  return first.message || 'Ha ocurrido un error de validación.';
}
