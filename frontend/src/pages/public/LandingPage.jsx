import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Clock,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

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

const stylistIdEnv = import.meta.env.VITE_STYLIST_ID;

function LandingPage() {
  const userId = stylistIdEnv;

  const [stylist, setStylist] = useState(null);
  const [loadingStylist, setLoadingStylist] = useState(false);
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

  useEffect(() => {
    if (!userId) return;

    const fetchStylist = async () => {
      setStylistError(null);
      try {
        setLoadingStylist(true);
        const res = await api.get(`/api/public/stylist/${userId}/profile`);
        const data = res.data || null;
        if (!data || (!data.name && !data.bio && !data.phone && !data.email && !data.instagram && !data.address && !data.photoUrl)) {
          setStylist(null);
          setStylistError('Este estilista aún no ha configurado su perfil');
        } else {
          setStylist(data);
        }
      } catch (error) {
        console.error('Error fetching stylist profile', error);
        setStylist(null);
        setStylistError('No se pudo cargar la información del estilista');
        toast.error('No se pudo cargar la información del estilista');
      } finally {
        setLoadingStylist(false);
      }
    };

    fetchStylist();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await api.get(`/api/public/stylist/${userId}/services`);
        setServices(res.data || []);
      } catch (error) {
        console.error('Error fetching services', error);
        toast.error('No se pudieron cargar los servicios');
      } finally {
        setLoadingServices(false);
      }
    };

    const fetchPortfolio = async () => {
      try {
        setLoadingPortfolio(true);
        const res = await api.get(`/api/public/stylist/${userId}/portfolio`);
        setPortfolio(res.data || []);
      } catch (error) {
        console.error('Error fetching portfolio', error);
        toast.error('No se pudo cargar el portafolio');
      } finally {
        setLoadingPortfolio(false);
      }
    };

    fetchServices();
    fetchPortfolio();
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedServiceId || !selectedDate) {
      setSlots([]);
      setSelectedTime('');
      return;
    }

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await api.get(`/api/public/stylist/${userId}/available-slots`, {
          params: { date: selectedDate, serviceId: selectedServiceId },
        });
        setSlots(res.data?.slots || []);
      } catch (error) {
        console.error('Error fetching available slots', error);
        toast.error('No se pudieron cargar los horarios disponibles');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [userId, selectedServiceId, selectedDate]);

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
    if (!userId) {
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

      const res = await api.post(`/api/public/stylist/${userId}/appointments`, payload);

      const service = services.find((s) => s.id === Number(selectedServiceId));
      setConfirmation({
        appointmentId: res.data?.appointmentId,
        serviceName: service?.name || '',
        date: selectedDate,
        time: selectedTime,
      });
      toast.success('Cita agendada correctamente');
    } catch (error) {
      console.error('Error creating public appointment', error);
      const message = error?.response?.data?.message || 'No se pudo agendar la cita';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setReservationOpen(false);
    setConfirmation(null);
  };

  const stylistName = stylist?.name || 'Tu estilista de confianza';
  const stylistBio =
    stylist?.bio || 'Especialista en uñas y belleza, cuidando cada detalle de tu estilo.';

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <p className="text-gray-600 text-center px-4">
          No se encontró el estilista. Revisa la configuración de VITE_STYLIST_ID.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 text-gray-900">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-lg">NS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base text-gray-900">
                {stylistName}
              </span>
              <span className="text-xs text-pink-500">Nails & Beauty</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#services" className="hover:text-pink-500 transition-colors">
              Servicios
            </a>
            <a href="#portfolio" className="hover:text-pink-500 transition-colors">
              Portafolio
            </a>
            <a href="#contact" className="hover:text-pink-500 transition-colors">
              Contacto
            </a>
            <button
              type="button"
              onClick={() => handleOpenReservation(null)}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
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
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600 border border-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              Agenda tu cita en línea
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
              Uñas perfectas,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                estilo impecable
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-xl">
              {stylistError
                ? stylistError
                : stylistBio}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenReservation(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
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
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-pink-400 via-purple-400 to-pink-600 shadow-2xl" />
              <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-tr from-white/40 to-white/10 backdrop-blur-sm" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/40 shadow-xl bg-[url('https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
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
              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay servicios disponibles.</p>
          ) : (
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="group rounded-2xl bg-white/90 border border-pink-50 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
                >
                  <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100 relative overflow-hidden">
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
                        <Clock className="w-4 h-4 text-pink-500" />
                        <span>{service.durationMinutes} min</span>
                      </div>
                      <span className="font-semibold text-pink-600">
                        {formatPriceCOP(service.price)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenReservation(service.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-pink-600 hover:shadow-md transition-all"
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
              <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
            </div>
          ) : portfolio.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay fotos en el portafolio.</p>
          ) : (
            <div className="columns-2 md:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
              {portfolio.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setLightboxImage(item)}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.description || item?.service?.name || 'Trabajo de uñas'}
                    className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 text-left">
                    {item.service?.name && (
                      <span className="text-[11px] sm:text-xs font-semibold text-white">
                        {item.service.name}
                      </span>
                    )}
                    {item.description && (
                      <span className="text-[10px] sm:text-[11px] text-gray-100 line-clamp-2">
                        {item.description}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Contacto */}
        <section id="contact" className="py-8 sm:py-10">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contacto</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                ¿Tienes dudas o deseas una asesoría personalizada? Escríbenos o llámanos.
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                {stylist?.phone && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <a
                      href={`https://wa.me/${stylist.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-700 hover:text-pink-500 transition-colors"
                    >
                      {stylist.phone}
                    </a>
                  </div>
                )}

                {stylist?.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <a
                      href={`mailto:${stylist.email}`}
                      className="text-gray-700 hover:text-pink-500 transition-colors break-all"
                    >
                      {stylist.email}
                    </a>
                  </div>
                )}

                {stylist?.address && (
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">{stylist.address}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2">
                {stylist?.instagram && (
                  <a
                    href={`https://instagram.com/${stylist.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 hover:bg-pink-100 transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-pink-100 bg-white/80 shadow-sm min-h-[220px]">
              {stylist?.address ? (
                <iframe
                  title="Mapa de ubicación"
                  src={
                    stylist.mapUrl ||
                    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.999999!2d-74.08175!3d4.60971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMzUiTiA3NMKwMDQnNTQuMyJX!5e0!3m2!1ses!2sco!4v1700000000000'
                  }
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6 text-xs sm:text-sm text-gray-500">
                  La ubicación del salón se mostrará aquí cuando esté disponible.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Reserva */}
      {reservationOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {confirmation ? 'Cita agendada' : 'Agendar cita'}
                </h3>
                {!confirmation && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    Completa los pasos para reservar tu espacio.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {confirmation ? (
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    ¡Cita agendada exitosamente!
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-xs">
                    Hemos recibido tu solicitud. Te confirmaremos pronto por WhatsApp o por el
                    medio de contacto que nos dejaste.
                  </p>
                  <div className="w-full max-w-xs mt-2 rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3 text-left text-xs sm:text-sm text-gray-800 space-y-1">
                    {confirmation.serviceName && (
                      <p>
                        <span className="font-medium">Servicio:</span> {confirmation.serviceName}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Fecha:</span> {confirmation.date}
                    </p>
                    <p>
                      <span className="font-medium">Hora:</span> {confirmation.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-pink-500 px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-pink-600 hover:shadow-md transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmitReservation}>
                  {/* Paso 1: Servicio */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                      Paso 1
                    </h4>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">Selecciona un servicio</span>
                      <span className="text-[11px] text-gray-400">
                        {services.length > 0 ? `${services.length} disponibles` : 'Sin servicios' }
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setSelectedServiceId(service.id)}
                          className={classNames(
                            'border rounded-2xl px-3 py-2 text-left text-xs sm:text-sm transition-all',
                            selectedServiceId === service.id
                              ? 'border-pink-500 bg-pink-50 shadow-sm'
                              : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/60',
                          )}
                        >
                          <div className="font-medium text-gray-900 line-clamp-1">{service.name}</div>
                          <div className="mt-0.5 flex justify-between items-center text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-pink-500" />
                              {service.durationMinutes} min
                            </span>
                            <span className="font-semibold text-pink-600">
                              {formatPriceCOP(service.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paso 2: Fecha */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                      Paso 2
                    </h4>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Selecciona una fecha
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      disabled={!selectedServiceId}
                    />
                    {!selectedServiceId && (
                      <p className="text-[11px] text-gray-400">
                        Primero elige un servicio para ver las fechas disponibles.
                      </p>
                    )}
                  </div>

                  {/* Paso 3: Hora */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                      Paso 3
                    </h4>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Selecciona un horario
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                        Cargando horarios disponibles...
                      </div>
                    ) : !selectedServiceId || !selectedDate ? (
                      <p className="text-xs text-gray-400">
                        Selecciona servicio y fecha para ver los horarios disponibles.
                      </p>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No hay horarios disponibles para la fecha seleccionada. Prueba con otro día.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={classNames(
                              'px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all',
                              selectedTime === slot
                                ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-pink-50 hover:border-pink-300',
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Paso 4: Datos del cliente */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                      Paso 4
                    </h4>
                    <p className="text-[11px] text-gray-500 mb-1">
                      Cuéntanos quién eres para confirmar tu reserva.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <label className="block font-medium text-gray-900">Nombre completo</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-medium text-gray-900">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Tu número de contacto"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-medium text-gray-900">Email (opcional)</label>
                        <input
                          type="email"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="tucorreo@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block font-medium text-gray-900">
                          Notas adicionales (opcional)
                        </label>
                        <textarea
                          className="w-full min-h-[70px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm shadow-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                          value={clientNotes}
                          onChange={(e) => setClientNotes(e.target.value)}
                          placeholder="Ej: color preferido, diseño, alergias, etc."
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-400 max-w-xs">
                      Al confirmar tu reserva, aceptas ser contactado por el estilista para validar tu
                      cita.
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={classNames(
                        'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-all',
                        submitting
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-md',
                      )}
                    >
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirmar reserva
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Portafolio */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.description || lightboxImage?.service?.name || 'Trabajo de uñas'}
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
            <div className="mt-3 text-center text-xs sm:text-sm text-gray-100 max-w-xl">
              {lightboxImage.service?.name && (
                <p className="font-semibold">{lightboxImage.service.name}</p>
              )}
              {lightboxImage.description && <p className="mt-1 text-gray-200">{lightboxImage.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white/90 px-5 py-1.5 text-xs sm:text-sm font-medium text-gray-800 shadow-sm hover:bg-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
