import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { ImagePlus, Trash2, X, Loader2, ZoomIn, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import {
  getPortfolioImages,
  createPortfolioImage,
  deletePortfolioImage,
  getServices,
} from '../services/api';
import { uploadImage, deleteImage as deleteFromStorage } from '../utils/supabaseStorage';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function PortfolioPage() {
  const { user } = useAuth();

  const [images, setImages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [lightboxImage, setLightboxImage] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [portfolio, servicesList] = await Promise.all([
          getPortfolioImages(),
          getServices(),
        ]);

        if (!isMounted) return;

        setImages(portfolio || []);
        setServices(servicesList || []);
      } catch (e) {
        console.error('Error cargando portafolio:', e);
        if (isMounted) {
          setError('Error al cargar el portafolio');
        }
        toast.error('Error al cargar el portafolio');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setDescription('');
    setSelectedServiceId('');
    setIsUploadModalOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploadModalOpen(true);
    // limpiar el input para permitir volver a seleccionar el mismo archivo si se cancela
    event.target.value = '';
  };

  const handleSaveImage = async () => {
    if (!selectedFile || !user?.id) return;

    setIsSaving(true);
    try {
      const publicUrl = await uploadImage(selectedFile, user.id);

      const payload = {
        imageUrl: publicUrl,
        description: description.trim() || null,
        serviceId: selectedServiceId ? Number(selectedServiceId) : null,
      };

      const saved = await createPortfolioImage(payload);
      setImages((prev) => [saved, ...prev]);
      resetUploadState();
    } catch (e) {
      console.error('Error guardando imagen de portafolio:', e);
      setError('Error al subir la imagen. Intenta de nuevo.');
      toast.error('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteImage = async (image) => {
    if (!image) return;

    const confirmed = window.confirm('¿Eliminar esta imagen del portafolio?');
    if (!confirmed) return;

    try {
      await deletePortfolioImage(image.id);
      await deleteFromStorage(image.imageUrl);
      setImages((prev) => prev.filter((item) => item.id !== image.id));
    } catch (e) {
      console.error('Error eliminando imagen de portafolio:', e);
      setError('Error al eliminar la imagen.');
      toast.error('Error al eliminar la imagen.');
    }
  };

  const getServiceName = (serviceId, imageService) => {
    if (imageService?.name) return imageService.name;
    const s = services.find((service) => service.id === serviceId);
    return s?.name || null;
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
          <p className="mt-1 text-sm text-slate-600">
            Galería visual de tus mejores trabajos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <ImagePlus className="h-4 w-4" />
            <span>+ Subir Imagen</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Galería */}
      <section>
        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner label="Cargando galería…" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no has subido imágenes. Empieza creando tu portafolio visual.
          </p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="mb-4 break-inside-avoid rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative overflow-hidden rounded-t-2xl">
                  <button
                    type="button"
                    onClick={() => setLightboxImage(image)}
                    className="group block w-full overflow-hidden"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.description || 'Imagen de portafolio'}
                      className="max-h-80 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                        <ZoomIn className="h-3 w-3" />
                        Ver grande
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image)}
                    className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-black/60 p-1.5 text-white shadow-sm transition hover:bg-black/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 p-4">
                  {image.description && (
                    <p className="text-sm text-slate-900">{image.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    {getServiceName(image.serviceId, image.service) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                        <Tag className="h-3 w-3" />
                        {getServiceName(image.serviceId, image.service)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Sin servicio asociado</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal de subida */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Nueva imagen de portafolio</h2>
              <button
                type="button"
                onClick={resetUploadState}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,_1.2fr)_minmax(0,_1fr)]">
              <div>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Previsualización de la imagen"
                    className="h-64 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                    Previsualización de la imagen
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej: Manicura francesa con diseño minimalista."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Servicio relacionado (opcional)
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Sin servicio asociado</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-400">
                  La imagen se subirá a tu almacenamiento privado en Supabase y será accesible mediante una URL pública.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={resetUploadState}
                className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isSaving || !selectedFile}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white shadow-sm transition',
                  isSaving || !selectedFile
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700',
                )}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSaving ? 'Subiendo…' : 'Guardar imagen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-slate-950/90 p-2 shadow-2xl">
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.description || 'Imagen de portafolio'}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
            {(lightboxImage.description
              || getServiceName(lightboxImage.serviceId, lightboxImage.service)) && (
              <div className="mt-2 flex items-center justify-between gap-3 px-2">
                {lightboxImage.description && (
                  <p className="text-sm text-slate-100">
                    {lightboxImage.description}
                  </p>
                )}
                {getServiceName(lightboxImage.serviceId, lightboxImage.service) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                    <Tag className="h-3 w-3" />
                    {getServiceName(lightboxImage.serviceId, lightboxImage.service)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
