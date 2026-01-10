import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Sparkles,
} from 'lucide-react';

function Section({ id, children, className = '' }) {
  return (
    <section
      id={id}
      className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
      {eyebrow && (
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-pink-500 mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      {subtitle && <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>}
    </div>
  );
}

function PrimaryButton({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-white bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/30 transition-colors"
    >
      {children}
    </a>
  );
}

function SecondaryButton({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-100 transition-colors"
    >
      {children}
    </a>
  );
}

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-5 sm:p-6 shadow-sm border border-pink-50 flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ title, points }) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{title}</h3>
      <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-pink-500 shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-50 text-pink-500 font-semibold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const benefits = [
    {
      icon: Calendar,
      title: 'Llena tu agenda sin caos',
      description:
        'Tus clientes reservan online 24/7 y tú controlas horarios, servicios y disponibilidad desde un solo lugar.',
    },
    {
      icon: Users,
      title: 'Haz que vuelvan siempre',
      description:
        'Construye una base de clientes organizada, con historial de citas y datos listos para tus campañas.',
    },
    {
      icon: Clock,
      title: 'Menos ausencias, más ingresos',
      description:
        'Configura recordatorios automáticos y reduce las citas perdidas por olvidos o malentendidos de horario.',
    },
  ];

  const features = [
    {
      title: 'Gestión de citas y horarios',
      points: [
        'Agenda visual pensada para estilistas y salones de belleza.',
        'Configuración de horarios, días bloqueados y duración de servicios.',
        'Visualización clara de tu día, semana y próximos turnos.',
      ],
    },
    {
      title: 'Clientes y servicios en orden',
      points: [
        'Ficha de cliente con datos de contacto y notas importantes.',
        'Catálogo de servicios con precios, duración y categorías.',
        'Historial de visitas para saber qué funcionó mejor en cada persona.',
      ],
    },
    {
      title: 'Landing pública lista para compartir',
      points: [
        'Página pública personalizada para tu salón o marca personal.',
        'Tus clientes eligen servicio, fecha y hora desde el celular.',
        'Ideal para compartir en Instagram, WhatsApp y Google Business.',
      ],
    },
  ];

  const steps = [
    {
      title: 'Crea tu cuenta en minutos',
      description:
        'Regístrate, confirma tu correo y completa los datos básicos de tu salón o marca personal.',
    },
    {
      title: 'Configura servicios y horarios',
      description:
        'Define qué ofreces, precios, duración y los horarios en los que quieres recibir reservas.',
    },
    {
      title: 'Comparte tu enlace y recibe reservas',
      description:
        'Comparte tu landing con tus clientes y deja que ellos mismos reserven el horario que mejor les quede.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-pink-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-lg">NS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base text-gray-900">
                Nails Schedule
              </span>
              <span className="text-[11px] text-pink-500">Agenda para belleza y estilismo</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-gray-600">
            <a href="#beneficios" className="hover:text-pink-500 transition-colors">
              Beneficios
            </a>
            <a href="#caracteristicas" className="hover:text-pink-500 transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="hover:text-pink-500 transition-colors">
              Cómo funciona
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/admin/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-gray-700 hover:text-pink-500"
            >
              Iniciar sesión
            </a>
            <PrimaryButton href="/admin/register">
              <span className="mr-1.5">Probar gratis</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Section className="pt-10 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-[11px] font-medium text-pink-600 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Agenda online pensada para belleza
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Deja el cuaderno atrás.
              <br />
              <span className="text-pink-500">Llena tu agenda desde tu celular.</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-xl">
              Nails Schedule es un software de agendamiento creado para estilistas, manicuristas y salones
              de belleza que quieren organizar su agenda, reducir ausencias y dar una mejor experiencia a sus
              clientes.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <PrimaryButton href="/admin/register">
                <span className="mr-1.5">Crear cuenta gratis</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
              <SecondaryButton href="#demo">Ver demo en 2 minutos</SecondaryButton>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-500 mb-4">
              Sin tarjeta de crédito · Pensado para profesionales independientes y salones pequeños
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-500" />
                <span>Ideal para uñas, cabello, cejas y pestañas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-500" />
                <span>Configura tu agenda en menos de 15 minutos</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 bg-gradient-to-tr from-pink-200/60 via-white to-purple-200/70 rounded-3xl blur-2xl opacity-60" />
            <div className="relative rounded-3xl bg-white/80 border border-pink-100 shadow-xl p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-pink-500 uppercase tracking-wide mb-1">
                    Vista diaria
                  </p>
                  <p className="text-sm font-semibold text-gray-900">Agenda de hoy</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>100% online</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-pink-50">
                  <div>
                    <p className="text-xs font-medium text-gray-900">9:00 a. m. · Manicure spa</p>
                    <p className="text-[11px] text-gray-500">Laura Gómez · Cliente frecuente</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-white text-pink-500 border border-pink-100">
                    Confirmada
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white">
                  <div>
                    <p className="text-xs font-medium text-gray-900">11:00 a. m. · Corte + blower</p>
                    <p className="text-[11px] text-gray-500">Carlos Ruiz · Nuevo cliente</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-600 border border-yellow-100">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white">
                  <div>
                    <p className="text-xs font-medium text-gray-900">3:30 p. m. · Uñas acrílicas</p>
                    <p className="text-[11px] text-gray-500">Mariana López · Instagram</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-green-50 text-green-600 border border-green-100">
                    Pagada
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                <div className="rounded-2xl bg-white border border-gray-100 p-2 flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-500">Citas hoy</span>
                  <span className="text-base font-semibold text-gray-900">8</span>
                </div>
                <div className="rounded-2xl bg-white border border-gray-100 p-2 flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-500">Tasa asistencia</span>
                  <span className="text-base font-semibold text-emerald-600">96%</span>
                </div>
                <div className="rounded-2xl bg-white border border-gray-100 p-2 flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-500">Ingresos estimados</span>
                  <span className="text-base font-semibold text-gray-900">$480K</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-500" />
                  <span>Funciona perfecto en celular y tablet</span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Configura una vez, agenda siempre</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Beneficios */}
      <Section id="beneficios" className="pt-4">
        <SectionTitle
          eyebrow="Beneficios principales"
          title="Hecho para estilistas, manicuristas y salones de belleza"
          subtitle="Olvídate de las agendas en papel, mensajes perdidos en WhatsApp y dobles reservas."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <BenefitCard key={benefit.title} {...benefit} />
          ))}
        </div>
      </Section>

      {/* Características */}
      <Section id="caracteristicas" className="pt-0">
        <SectionTitle
          eyebrow="Características del sistema"
          title="Todo lo que necesitas para manejar tu agenda como un negocio"
          subtitle="Desde la primera reserva hasta el seguimiento de tus mejores clientes, todo en un solo lugar."
        />

        <div className="grid gap-5 md:grid-cols-3" id="demo">
          {features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} points={feature.points} />
          ))}
        </div>
      </Section>

      {/* Cómo funciona */}
      <Section id="como-funciona" className="pt-0">
        <SectionTitle
          eyebrow="En 3 pasos"
          title="Ponte en modo agenda online sin complicarte"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Step
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              number={index + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </Section>

      {/* CTA final */}
      <Section className="pt-0 pb-20">
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              ¿Lista para dejar el cuaderno y pasarte a la agenda online?
            </h2>
            <p className="text-xs sm:text-sm text-pink-100 max-w-xl">
              Crea tu cuenta hoy, configura tus servicios y horarios, y empieza a recibir reservas
              mientras te enfocas en lo que más te gusta: hacer que tus clientes se vean y se sientan increíbles.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <PrimaryButton href="/admin/register">
              <span className="mr-1.5">Crear cuenta gratis</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/admin/login';
              }}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-pink-50/90 bg-white/10 hover:bg-white/15 border border-pink-200/40 transition-colors"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-pink-100/70 bg-white/70 backdrop-blur text-[11px] text-gray-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            ©
            {' '}
            {new Date().getFullYear()}
            {' '}
            Nails Schedule. Pensado para profesionales de la belleza.
          </p>
          <p className="text-[10px]">
            Hecho para estilistas, manicuristas, barberos, peluquerías y salones de belleza en Latinoamérica.
          </p>
        </div>
      </footer>
    </div>
  );
}

