import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Clock,
  Phone,
  Mail,
  MapPin,
  Instagram,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import {
  getStylistInfo,
  getPublicServices,
  getPublicPortfolio,
  getAvailableSlots,
  createAppointment,
} from '../../services/publicApi';
import { getThemeByCategory } from '../../utils/themes';

function formatPriceCOP(value) {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getDefaultCoverImage(category) {
  const normalized = (category || 'NAIL_SPA').toUpperCase();
  switch (normalized) {
    case 'BARBERSHOP':
      return 'https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=800';
    case 'HAIR_SALON':
      return 'https://images.pexels.com/photos/3993447/pexels-photo-3993447.jpeg?auto=compress&cs=tinysrgb&w=800';
    default:
      return 'https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
}

export default function DynamicLanding() {
  const { slug } = useParams();

  const [stylistInfo, setStylistInfo] = useState(null);
  const [loadingStylist, setLoadingStylist] = useState(true);
  const [stylistError, setStylistError] = useState(null);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [portfolio, setPortfolio] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const [reservationOpen, setReservationOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const [lightboxImage, setLightboxImage] = useState(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const theme = useMemo(() => {
    if (!stylistInfo) return getThemeByCategory('NAIL_SPA');
    return getThemeByCategory(stylistInfo.category);
  }, [stylistInfo]);

  const primaryColor = stylistInfo?.primaryColor || theme.colors.primary;

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setStylistError(null);
      setLoadingStylist(true);
      try {
        const info = await getStylistInfo(slug);
        if (!info || info.status !== 'ACTIVE') {
          setStylistInfo(null);
          setStylistError('Esta página no está disponible.');
          return;
        }
        setStylistInfo(info);
      } catch (error) {
        console.error('Error fetching public stylist info', error);
        setStylistInfo(null);
        setStylistError(error.message || 'No se pudo cargar la información del estilista');
      } finally {
        setLoadingStylist(false);
      }

      try {
        setLoadingServices(true);
        const svc = await getPublicServices(slug);
        setServices(svc || []);
      } catch (error) {
        console.error('Error fetching public services', error);
        toast.error(error.message || 'No se pudieron cargar los servicios');
      } finally {
        setLoadingServices(false);
      }

      try {
        setLoadingPortfolio(true);
        const pf = await getPublicPortfolio(slug);
        setPortfolio(pf || []);
      } catch (error) {
        console.error('Error fetching public portfolio', error);
        toast.error(error.message || 'No se pudo cargar el portafolio');
      } finally {
        setLoadingPortfolio(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedServiceId || !selectedDate) {
      setSlots([]);
      setSelectedTime('');
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await getAvailableSlots(slug, selectedDate, selectedServiceId);
        setSlots(res?.slots || []);
      } catch (error) {
        console.error('Error fetching available slots', error);
        toast.error(error.message || 'No se pudieron cargar los horarios disponibles');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [slug, selectedServiceId, selectedDate]);

  const handleOpenReservation = (serviceId) => {
    setConfirmation(null);
    setSelectedServiceId(serviceId || null);
    setSelectedDate('');
    setSelectedTime('');
    setSlots([]);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
    setReservationOpen(true);
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    if (!slug) {
      toast.error('No se encontró el estilista');
      return;
    }

    if (!selectedServiceId || !selectedDate || !selectedTime) {
      toast.error('Selecciona servicio, fecha y hora');
      return;
    }

    if (!clientName.trim() || !clientPhone.trim()) {
      toast.error('Nombre y teléfono son obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        notes: clientNotes.trim() || undefined,
      };

      const res = await createAppointment(slug, payload);

      const service = services.find((s) => s.id === Number(selectedServiceId));
      setConfirmation({
        appointmentId: res?.appointmentId,
        serviceName: service?.name || '',
        date: selectedDate,
        time: selectedTime,
      });
      toast.success(res?.message || 'Cita agendada correctamente');
    } catch (error) {
      console.error('Error creating public appointment', error);
      toast.error(error.message || 'No se pudo agendar la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setReservationOpen(false);
    setConfirmation(null);
  };

  // Hero text logic
  const stylistTitle = stylistInfo?.businessName
	? stylistInfo.businessName
	: (stylistInfo?.ownerName || 'Tu estilista de confianza');

  const stylistLocation =
	stylistInfo?.city || stylistInfo?.country
	  ? `${stylistInfo.city || ''}${stylistInfo.city && stylistInfo.country ? ', ' : ''}${
		      stylistInfo.country || ''
	      }`
	  : '';

  const heroBodyText = stylistInfo?.bio?.trim()
	? `${stylistInfo.bio.slice(0, 120)}${
		    stylistInfo.bio.length > 120 ? '…' : ''
	    }`
	: 'Reserva tu cita y vive una experiencia única de belleza y cuidado personal.';

  const coverImageUrl = stylistInfo?.coverImageUrl || getDefaultCoverImage(stylistInfo?.category);

  if (!slug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.colors.background }}
      >
        <p className="text-gray-600 text-center px-4">
          No se encontró la página solicitada.
        </p>
      </div>
    );
  }

  if (loadingStylist) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.colors.background }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: primaryColor }}
        />
      </div>
    );
  }

  if (stylistError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.colors.background }}
      >
        <p className="text-gray-600 text-center px-4">{stylistError}</p>
      </div>
    );
  }

  

  return (
    <div
      className="min-h-screen text-gray-900"
      style={{ background: theme.colors.background }}
    >
      {/* Header / Navbar */}
      <header
        className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b"
        style={{ borderColor: theme.cardStyle.borderColor }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {stylistInfo?.photoUrl ? (
              <img
                src={stylistInfo.photoUrl}
                alt={stylistInfo?.ownerName || stylistTitle}
                className="w-9 h-9 rounded-full object-cover shadow-md border"
                style={{ borderColor: theme.cardStyle.borderColor }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundImage: theme.gradient.hero }}
              >
                <span className="text-white font-semibold text-lg">NS</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base text-gray-900">
                {stylistTitle}
              </span>
              <span
                className="text-xs"
                style={{ color: theme.colors.accent }}
              >
                {stylistInfo?.ownerName || 'Estilista'}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#services"
              className="transition-colors"
              style={{ color: theme.colors.text }}
              onMouseOver={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onFocus={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onMouseOut={(e) => { e.currentTarget.style.color = theme.colors.text; }}
              onBlur={(e) => { e.currentTarget.style.color = theme.colors.text; }}
            >
              Servicios
            </a>
            <a
              href="#portfolio"
              className="transition-colors"
              style={{ color: theme.colors.text }}
              onMouseOver={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onFocus={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onMouseOut={(e) => { e.currentTarget.style.color = theme.colors.text; }}
              onBlur={(e) => { e.currentTarget.style.color = theme.colors.text; }}
            >
              Portafolio
            </a>
            <a
              href="#contact"
              className="transition-colors"
              style={{ color: theme.colors.text }}
              onMouseOver={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onFocus={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
              onMouseOut={(e) => { e.currentTarget.style.color = theme.colors.text; }}
              onBlur={(e) => { e.currentTarget.style.color = theme.colors.text; }}
            >
              Contacto
            </a>
            <button
              type="button"
              onClick={() => handleOpenReservation(null)}
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundImage: theme.gradient.button, color: theme.buttonText.primary }}
           >
              Agendar
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Hero Section */}
        <section className="py-10 sm:py-14 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 space-y-6">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.cardStyle.borderColor,
                color: theme.colors.text,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              Agenda tu cita en línea
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
              {stylistTitle}
              {stylistLocation && (
          <span
            className="block text-transparent bg-clip-text"
            style={{ backgroundImage: theme.gradient.hero }}
          >
            {stylistLocation}
          </span>
        )}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl">
        {heroBodyText}
      </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenReservation(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundImage: theme.gradient.button, color: theme.buttonText.primary }}
              >
                <Calendar className="w-4 h-4" />
                Agendar Cita
              </button>
              <div className="flex flex-col text-xs sm:text-sm text-gray-500">
                <span>Atención personalizada, horarios flexibles</span>
                <span>Reserva en menos de 1 minuto</span>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
              <div
		        className="absolute inset-0 rounded-3xl"
		        style={{ backgroundImage: theme.gradient.hero }}
		      />
              <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-tr from-white/40 to-white/10 backdrop-blur-sm" />
              <div
                className="relative w-full h-full rounded-3xl overflow-hidden border border-white/40 shadow-xl bg-cover bg-center"
                style={{
                  backgroundImage: `url(${coverImageUrl})`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="services" className="py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Servicios</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Elige tu servicio favorito y agenda al instante.
              </p>
            </div>
          </div>

          {loadingServices ? (
            <div className="flex items-center justify-center py-10">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: primaryColor }}
              />
            </div>
          ) : services.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay servicios disponibles.</p>
          ) : (
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="group bg-white/90 transition-all overflow-hidden flex flex-col"
                  style={{
                    borderRadius: theme.cardStyle.borderRadius,
                    borderColor: theme.cardStyle.borderColor,
                    borderWidth: 1,
                    boxShadow: theme.cardStyle.shadow,
                  }}
                >
                  <div
                    className="h-32 relative overflow-hidden"
                    style={{ backgroundImage: theme.gradient.hero, opacity: 0.9 }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,_rgba(244,114,182,0.4),_transparent_60%),_radial-gradient(circle_at_100%_100%,_rgba(167,139,250,0.4),_transparent_55%)]" />
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock
                          className="w-4 h-4"
                          style={{ color: primaryColor }}
                        />
                        <span>{service.durationMinutes} min</span>
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: primaryColor }}
                      >
                        {formatPriceCOP(service.price)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenReservation(service.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                      style={{ backgroundImage: theme.gradient.button, color: theme.buttonText.primary }}
                    >
                      Agendar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Portafolio */}
        <section id="portfolio" className="py-8 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Portafolio</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Un vistazo a algunos de nuestros trabajos recientes.
              </p>
            </div>
          </div>

          {loadingPortfolio ? (
            <div className="flex items-center justify-center py-10">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: primaryColor }}
              />
            </div>
          ) : portfolio.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay fotos en el portafolio.</p>
          ) : (
            <div className="columns-2 md:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
              {portfolio.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="relative w-full overflow-hidden rounded-2xl group focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  onClick={() => setLightboxImage(item.imageUrl)}
                >
                  <div className="relative w-full overflow-hidden rounded-2xl">
                    <img
                      src={item.imageUrl}
                      alt={item.description || item.service?.name || 'Trabajo realizado'}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {(item.description || item.service?.name) && (
                    <div className="absolute bottom-0 inset-x-0 p-2 sm:p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent text-white text-xs sm:text-sm">
                      <p className="font-medium line-clamp-2">
                        {item.description || item.service?.name}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Contacto */}
        <section
          id="contact"
          className="py-8 sm:py-10 border-t mt-8"
          style={{ borderColor: theme.cardStyle.borderColor }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contacto</h2>
              <p className="text-sm sm:text-base text-gray-600">
                ¿Tienes dudas o quieres un servicio personalizado?
                Escríbenos y estaremos encantados de ayudarte.
              </p>

              <div className="space-y-3 text-sm sm:text-base">
                {stylistInfo?.city && (
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin
                      className="w-4 h-4 mt-0.5"
                      style={{ color: primaryColor }}
                    />
                    <span>
                      {stylistInfo.city}
                      {stylistInfo.country ? `, ${stylistInfo.country}` : ''}
                    </span>
                  </div>
                )}
                {stylistInfo?.instagram && (
                  <a
                    href={`https://instagram.com/${stylistInfo.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-gray-700 transition-colors"
                    style={{ color: theme.colors.text }}
                    onMouseOver={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
                    onFocus={(e) => { e.currentTarget.style.color = theme.colors.accent; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = theme.colors.text; }}
                    onBlur={(e) => { e.currentTarget.style.color = theme.colors.text; }}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{stylistInfo.instagram}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Resumen + CTA */}
            <div
              className="bg-white/90 p-4 sm:p-5 flex flex-col justify-between"
              style={{
                borderRadius: theme.cardStyle.borderRadius,
                borderColor: theme.cardStyle.borderColor,
                borderWidth: 1,
                boxShadow: theme.cardStyle.shadow,
              }}
            >
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{ color: primaryColor }}
                  />
                  ¿Lista para tu próxima cita?
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Selecciona un servicio, elige la fecha y el horario disponible
                  que mejor se adapten a ti.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenReservation(null)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundImage: theme.gradient.button, color: theme.buttonText.primary }}
              >
                <Calendar className="w-4 h-4" />
                Agendar ahora
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de reserva */}
      {reservationOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Agendar cita</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmitReservation} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Servicio
                </label>
                <select
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(e.target.value || null)}
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                  style={{ outlineColor: primaryColor }}
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({formatPriceCOP(service.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                    style={{ outlineColor: primaryColor }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayStr}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Hora
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                      style={{ outlineColor: primaryColor }}
                      required
                    >
                      <option value="">
                        {loadingSlots ? 'Cargando horarios...' : 'Selecciona un horario'}
                      </option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {loadingSlots && (
                      <Loader2
                        className="w-4 h-4 animate-spin absolute right-2 top-2.5"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                  style={{ outlineColor: primaryColor }}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                    style={{ outlineColor: primaryColor }}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                    style={{ outlineColor: primaryColor }}
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                  style={{ outlineColor: primaryColor }}
                  rows={3}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Cuéntanos si tienes alguna preferencia especial"
                />
              </div>

              {confirmation && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs sm:text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold">Cita agendada correctamente</p>
                    <p>
                      {confirmation.serviceName} - {confirmation.date} a las {confirmation.time}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={classNames(
                  'w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm sm:text-base font-semibold text-white shadow-md transition-all',
                  submitting ? 'bg-gray-400 cursor-not-allowed' : '',
                )}
                style={
                  submitting
                    ? undefined
                    : { backgroundImage: theme.gradient.button, color: theme.buttonText.primary }
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar cita
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox simple */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="max-w-3xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Portafolio"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
