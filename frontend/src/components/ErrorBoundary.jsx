import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, info) {
		// Puedes enviar este error a un servicio externo si lo necesitas
		// eslint-disable-next-line no-console
		console.error('ErrorBoundary caught an error:', error, info);
	}

	render() {
		const { hasError } = this.state;
		const { children } = this.props;

		if (hasError) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
					<div className="max-w-md rounded-2xl border border-rose-100 bg-white px-6 py-5 text-center shadow-sm">
						<div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
							<AlertTriangle className="h-5 w-5" />
						</div>
						<h2 className="text-base font-semibold text-slate-900 mb-1">Ha ocurrido un error</h2>
						<p className="text-sm text-slate-600 mb-3">
							Algo salió mal al mostrar esta pantalla. Intenta recargar la página.
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
						>
							Recargar
						</button>
					</div>
				</div>
			);
		}

		return children;
	}
}
