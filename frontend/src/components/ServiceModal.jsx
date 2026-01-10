import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const CATEGORY_OPTIONS = [
	{ value: 'CUT', label: 'Corte' },
	{ value: 'COLOR', label: 'Color' },
	{ value: 'STYLE', label: 'Peinado' },
	{ value: 'TREATMENT', label: 'Tratamiento' },
];

const schema = yup.object({
	name: yup.string().required('El nombre es obligatorio'),
	description: yup.string().nullable(),
	durationMinutes: yup
		.number()
		.typeError('La duración debe ser un número')
		.integer('La duración debe ser un número entero')
		.min(1, 'La duración debe ser mayor a 0')
		.required('La duración es obligatoria'),
	price: yup
		.number()
		.typeError('El precio debe ser un número')
		.min(0, 'El precio debe ser mayor o igual a 0')
		.required('El precio es obligatorio'),
	category: yup.string().oneOf(CATEGORY_OPTIONS.map((c) => c.value)).required('La categoría es obligatoria'),
});

export default function ServiceModal({ isOpen, onClose, service, onSave }) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: {
			name: '',
			description: '',
			durationMinutes: 60,
			price: 0,
			category: 'CUT',
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: service?.name ?? '',
				description: service?.description ?? '',
				durationMinutes: service?.durationMinutes ?? 60,
				price: service?.price ?? 0,
				category: service?.category ?? 'CUT',
			});
		}
	}, [isOpen, service, reset]);

	if (!isOpen) return null;

	const onSubmit = async (values) => {
		await onSave(values);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
			<div className="w-full max-w-lg bg-white rounded-xl shadow-card p-6 relative">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-slate-900">
						{service ? 'Editar servicio' : 'Nuevo servicio'}
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
							placeholder="Corte básico, Color global, etc."
							{...register('name')}
						/>
						{errors.name && (
							<p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
						<textarea
							rows={3}
							className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
							placeholder="Describe brevemente el servicio..."
							{...register('description')}
						/>
						{errors.description && (
							<p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Duración (min)</label>
							<input
								type="number"
								min={1}
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('durationMinutes')}
							/>
							{errors.durationMinutes && (
								<p className="mt-1 text-xs text-red-600">{errors.durationMinutes.message}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
							<input
								type="number"
								min={0}
								step="0.01"
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('price')}
							/>
							{errors.price && (
								<p className="mt-1 text-xs text-red-600">{errors.price.message}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
							<select
								className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								{...register('category')}
							>
								{CATEGORY_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
							{errors.category && (
								<p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
							)}
						</div>
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
