import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '../services/api';
import ServiceModal from '../components/ServiceModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const CATEGORY_LABELS = {
  CUT: 'Corte',
  COLOR: 'Color',
  STYLE: 'Peinado',
  TREATMENT: 'Tratamiento',
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const hasServices = useMemo(() => services.length > 0, [services]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openNewServiceModal = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const openEditServiceModal = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  const handleSaveService = async (values) => {
    try {
      if (selectedService) {
        await updateService(selectedService.id, values);
        toast.success('Servicio actualizado correctamente');
      } else {
        await createService(values);
        toast.success('Servicio creado correctamente');
      }

      closeModal();
      await loadServices();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || 'Error al guardar el servicio';
      toast.error(message);
    }
  };

  const handleDeleteService = async (service) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar el servicio "${service.name}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteService(service.id);
      toast.success('Servicio eliminado correctamente');
      await loadServices();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Error al eliminar el servicio';
      toast.error(message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mis servicios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea y gestiona los servicios que ofreces a tus clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewServiceModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Cargando servicios..." />
        </div>
      ) : !hasServices ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-white">
          <p className="text-slate-700 font-medium mb-2">
            Aún no tienes servicios creados
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Crea tu primer servicio para empezar a agendar citas.
          </p>
          <button
            type="button"
            onClick={openNewServiceModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-card p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-base font-semibold text-slate-900 line-clamp-2">
                    {service.name}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-pink-50 text-pink-700 text-xs font-medium px-2 py-0.5">
                    {CATEGORY_LABELS[service.category] || service.category}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-slate-500 line-clamp-3 mb-3">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{service.durationMinutes} min</span>
                  <span className="font-semibold text-slate-900">
                    {Number(service.price).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEditServiceModal(service)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(service)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        isOpen={modalOpen}
        onClose={closeModal}
        service={selectedService}
        onSave={handleSaveService}
      />
    </div>
  );
}

