import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Instagram as InstagramIcon,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getProfile, updateProfile } from '../../services/adminApi.js';
import { uploadImage } from '../../utils/supabaseStorage.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const data = await getProfile();
        if (!isMounted || !data) return;

        setName(data.name || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setInstagram(data.instagram || '');
        setAddress(data.address || '');
        setPhotoUrl(data.photoUrl || '');
        setCity(data.city || '');
        setCountry(data.country || '');
        // Guardar slug real del perfil si existe para usarlo en la vista pública
        setSlug(data.slug || '');
        setBusinessName(data.businessName || '');
        setOwnerName(data.ownerName || '');
      } catch (error) {
        console.error('Error cargando perfil:', error);
        toast.error('No se pudo cargar tu perfil.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedBio = bio.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      newErrors.name = 'El nombre completo es obligatorio.';
    }

    if (trimmedBio.length > 500) {
      newErrors.bio = 'La biografía no puede superar 500 caracteres.';
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'El email no tiene un formato válido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Revisa los errores del formulario.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        instagram: instagram.trim() || null,
        address: address.trim() || null,
        photoUrl: photoUrl || null,
        city: city.trim() || null,
        country: country.trim() || null,
      };

      const saved = await updateProfile(payload);

      setName(saved.name || '');
      setBio(saved.bio || '');
      setPhone(saved.phone || '');
      setEmail(saved.email || '');
      setInstagram(saved.instagram || '');
      setAddress(saved.address || '');
      setPhotoUrl(saved.photoUrl || '');
      setCity(saved.city || '');
      setCountry(saved.country || '');
      setSlug(saved.slug || slug || '');

      toast.success('Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      const message = error?.response?.data?.message || 'No se pudo guardar el perfil.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      toast.error('No se encontró el usuario autenticado.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, user.id);
      setPhotoUrl(url || '');
      toast.success('Foto de perfil actualizada.');
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      toast.error('No se pudo subir la foto de perfil.');
    } finally {
      setUploadingPhoto(false);
      // limpiar input para permitir seleccionar el mismo archivo de nuevo
      event.target.value = '';
    }
  };

  const handlePreviewClick = () => {
    // Usar el slug real si está disponible; si no, derivarlo del nombre como fallback
    const fallback = name.trim().toLowerCase().replace(/\s+/g, '-');
    const path = slug || fallback;
    window.open(`/${path}`, '_blank', 'noopener,noreferrer');
  };

  const displayName = name.trim() || user?.user_metadata?.full_name || user?.email || 'Tu nombre';
  const instagramDisplay = instagram?.trim() || '';

  const bioLength = bio.length;

  const previewTitle = businessName || ownerName || displayName;
  const previewLocation = city || country
	? `${city || ''}${city && country ? ', ' : ''}${country || ''}`
	: '';
  const previewHeroBodyText = bio.trim()
	? `${bio.slice(0, 120)}${bio.length > 120 ? '…' : ''}`
	: 'Reserva tu cita y vive una experiencia única de belleza y cuidado personal.';

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Perfil público</h1>
          <p className="mt-1 text-sm text-slate-600">
            Configura cómo se verá tu perfil en la página pública de reservas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Vista previa</span>
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={saving || loading}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition',
              (saving || loading) && 'opacity-60 cursor-not-allowed',
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            <span>{saving ? 'Guardando…' : 'Guardar cambios'}</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Cargando perfil…</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Formulario */}
          <form
            id="profile-form"
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-slate-500">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-slate-900">Foto de perfil</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoFileChange}
                  />
                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    disabled={uploadingPhoto}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50',
                      uploadingPhoto && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    <span>{uploadingPhoto ? 'Subiendo…' : 'Subir desde tu equipo'}</span>
                  </button>
                </div>
                <label className="mt-2 block text-xs text-slate-500">
                  O pega la URL de una imagen pública:
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://…"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-800">
                  Nombre completo
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={classNames(
                      'mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                      errors.name
                        ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-200 text-slate-900 placeholder-slate-400',
                    )}
                    placeholder="Ej: María López - Nail Artist"
                  />
                </label>
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-800" htmlFor="bio">
                    Biografía
                  </label>
                  <span
                    className={classNames(
                      'text-xs',
                      bioLength > 500 ? 'text-rose-600' : 'text-slate-400',
                    )}
                  >
                    {bioLength}/500
                  </span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={classNames(
                    'mt-1 block w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                    errors.bio
                      ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 text-slate-900 placeholder-slate-400',
                  )}
                  placeholder="Cuenta brevemente quién eres, tu estilo y qué te hace diferente."
                />
                {errors.bio && (
                  <p className="mt-1 text-xs text-rose-600">{errors.bio}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800">
                  Teléfono
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <Phone className="mr-2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      placeholder="Ej: +57 300 123 4567"
                    />
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800">
                  Email
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <Mail className="mr-2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      placeholder="tuemail@ejemplo.com"
                    />
                  </div>
                </label>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800">
                  Instagram
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <InstagramIcon className="mr-2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      placeholder="Ej: @maria.nails"
                    />
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800">
                  Dirección
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <MapPin className="mr-2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                      placeholder="Ubicación del salón o punto de atención"
                    />
                  </div>
                </label>
              </div>

          <div>
            <label className="block text-sm font-medium text-slate-800">
              Ciudad
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                placeholder="Ej: Medellín"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800">
              País
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                placeholder="Ej: Colombia"
              />
            </label>
          </div>
            </div>
          </form>

          {/* Preview */}
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-pink-50 via-white to-purple-50 p-6 shadow-sm">
            <header className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">Vista previa pública</p>
              <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                Modo lectura
              </span>
            </header>

            <div className="flex items-start gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-pink-200 bg-white/80 shadow-sm flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-pink-500">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-base font-semibold text-slate-900">{previewTitle}</h2>
                {previewLocation && (
				<p className="text-xs font-medium text-pink-500 flex items-center gap-1">
				  <MapPin className="h-3 w-3" />
				  <span>{previewLocation}</span>
				</p>
			  )}
                <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                  {previewHeroBodyText}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
              {phone.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-100">
                  <Phone className="h-3 w-3 text-pink-500" />
                  <span>{phone.trim()}</span>
                </div>
              )}
              {email.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-100">
                  <Mail className="h-3 w-3 text-pink-500" />
                  <span>{email.trim()}</span>
                </div>
              )}
              {instagramDisplay && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-100">
                  <InstagramIcon className="h-3 w-3 text-pink-500" />
                  <span>{instagramDisplay}</span>
                </div>
              )}
              {address.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-100">
                  <MapPin className="h-3 w-3 text-pink-500" />
                  <span>{address.trim()}</span>
                </div>
              )}
            </div>

            <footer className="mt-2 border-t border-pink-100 pt-3 text-[11px] text-slate-500">
              Así es como los clientes verán tu encabezado en la landing pública.
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
