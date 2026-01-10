import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '../services/api';
import ClientModal from '../components/ClientModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(term));
  }, [clients, search]);

  const hasClients = useMemo(() => filteredClients.length > 0, [filteredClients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openNewClientModal = () => {
    setSelectedClient(null);
    setModalOpen(true);
  };

  const openEditClientModal = (client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedClient(null);
  };

  const handleSaveClient = async (values) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, values);
        toast.success('Cliente actualizado correctamente');
      } else {
        await createClient(values);
        toast.success('Cliente creado correctamente');
      }

      closeModal();
      await loadClients();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || 'Error al guardar el cliente';
      toast.error(message);
    }
  };

  const handleDeleteClient = async (client) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar al cliente "${client.name}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteClient(client.id);
      toast.success('Cliente eliminado correctamente');
      await loadClients();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message || 'Error al eliminar el cliente';
      toast.error(message);
    }
  };

  const handleRowClick = (client) => {
    // Opcional: abrir panel lateral o navegación a detalle/historial
    console.log('Cliente seleccionado para historial (pendiente):', client);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona tu cartera de clientes y su información de contacto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre"
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={openNewClientModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Cargando clientes..." />
        </div>
      ) : !hasClients ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-white">
          <p className="text-slate-700 font-medium mb-2">
            Aún no tienes clientes registrados
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Añade tus clientes para llevar un mejor control de sus citas.
          </p>
          <button
            type="button"
            onClick={openNewClientModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-primary-dark shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar cliente
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-card">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleRowClick(client)}
                >
                  <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {client.phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {client.email || '-'}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditClientModal(client)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 mr-2"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(client)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientModal
        isOpen={modalOpen}
        onClose={closeModal}
        client={selectedClient}
        onSave={handleSaveClient}
      />
    </div>
  );
}

