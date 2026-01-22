import { useNavigate } from 'react-router-dom';

export default function AccountInactive() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-card rounded-xl p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Tu cuenta está pendiente de activación</h1>
        <p className="text-sm text-slate-600 mb-4">
          Hemos recibido tu registro correctamente. Un super administrador revisará tu información y
          activará tu cuenta. Te avisaremos cuando esté lista para usar.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Mientras tanto, puedes volver al menú principal para conocer más sobre la plataforma o
          cerrar esta ventana.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium py-2.5 hover:bg-primary-dark transition-colors"
        >
          Ir al menú principal
        </button>
      </div>
    </div>
  );
}
