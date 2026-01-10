export default function LoadingSpinner({ label = 'Cargando...' }) {
	return (
		<div className="flex items-center justify-center gap-2 text-sm text-slate-500">
			<div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
			<span>{label}</span>
		</div>
	);
}
