import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Agenda online para estilistas y salones
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Crea tu propia página de reservas con un enlace único, gestiona tu agenda
          y ofrece una experiencia moderna a tus clientes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link
            to="/admin/register"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-400 transition"
          >
            Soy estilista, quiero registrarme
          </Link>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800/80 transition"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 mt-4">
          Si ya tienes tu enlace público, accede usando la URL con tu slug
          (ejemplo: <span className="font-mono text-slate-400">/mi-salon</span>).
        </p>
      </div>
    </div>
  );
}
