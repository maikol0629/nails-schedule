import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
	name: yup.string().required('El nombre es obligatorio'),
	phone: yup.string().nullable(),
	email: yup
		.string()
		.nullable()
		.test('email-optional', 'El email debe tener un formato válido', (value) => {
			if (!value) return true;
			return /.+@.+\..+/.test(value);
		}),
	notes: yup.string().nullable(),
});

export default function ClientModal({ isOpen, onClose, client, onSave }) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			notes: '',
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: client?.name ?? '',
				phone: client?.phone ?? '',
				email: client?.email ?? '',
				notes: client?.notes ?? '',
			});
		}
	}, [isOpen, client, reset]);

	if (!isOpen) return null;

	const onSubmit = async (values) => {
		await onSave(values);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
			<div className="w-full max-w-lg bg-white rounded-xl shadow-card p-6 relative">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-slate-900">
						{client ? 'Editar cliente' : 'Nuevo cliente'}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 text-sm"
					>
						Cerrar
					</button>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
						<input
							type="text"
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="Nombre completo del cliente"
							{...register('name')}
						/>
						{errors.name && (
							<p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
							<input
								type="text"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								placeholder="Ej: +34 600 000 000"
								{...register('phone')}
							/>
							{errors.phone && (
								<p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
							<input
								type="email"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								placeholder="cliente@email.com"
								{...register('email')}
							/>
							{errors.email && (
								<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
							)}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
						<textarea
							rows={3}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
							placeholder="Preferencias, observaciones, alergias, etc."
							{...register('notes')}
						/>
						{errors.notes && (
							<p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Guardando...' : 'Guardar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
