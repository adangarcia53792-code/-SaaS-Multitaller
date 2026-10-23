import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Cliente, Vehiculo, Cita, ServicioCatalogo } from '../types';
import {
  Search,
  Plus,
  Pencil,
  X,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
  Ban,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { SectionHeader } from './SectionHeader';
import { EmptyState } from './EmptyState';

interface CitasSectionProps {
  citas: Cita[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  onSaveCita: (cita: Cita) => void;
  onCancelCita: (citaId: string) => void;
  onOpenCopiloto?: () => void;
}

export type CitaFilter = 'hoy' | 'proximas' | 'anteriores' | 'canceladas';

export const CitasSection: React.FC<CitasSectionProps> = ({
  citas,
  clientes,
  vehiculos,
  servicios,
  onSaveCita,
  onCancelCita,
  onOpenCopiloto,
}) => {
  const [filter, setFilter] = useState<CitaFilter>('hoy');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form State
  const [formClientId, setFormClientId] = useState('');
  const [formVehiculoId, setFormVehiculoId] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [formServicio, setFormServicio] = useState('');
  const [formFecha, setFormFecha] = useState('');
  const [formHora, setFormHora] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cancel Confirmation State
  const [citaToCancel, setCitaToCancel] = useState<Cita | null>(null);

  // Baseline form values reference to detect unsaved changes accurately
  const initialFormValuesRef = useRef({
    clientId: '',
    vehiculoId: '',
    catalogId: '',
    servicio: '',
    fecha: '',
    hora: '',
  });

  // Mappings for lookup
  const clienteMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach((c) => map.set(c.id, c));
    return map;
  }, [clientes]);

  const vehiculoMap = useMemo(() => {
    const map = new Map<string, Vehiculo>();
    vehiculos.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehiculos]);

  // Selected client for form contact info
  const selectedClient = clienteMap.get(formClientId);

  // Vehicles available for the selected client in the form
  const availableVehicles = useMemo(() => {
    if (!formClientId) return [];
    return vehiculos.filter((v) => v.clienteId === formClientId);
  }, [vehiculos, formClientId]);

  // Only active services from catalog
  const activeCatalogServices = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Open modal for new appointment
  const handleOpenAdd = () => {
    setEditingCita(null);
    const defaultClient = clientes[0]?.id || '';
    setFormClientId(defaultClient);
    const defaultVehs = vehiculos.filter((v) => v.clienteId === defaultClient);
    const defaultVeh = defaultVehs[0]?.id || '';
    setFormVehiculoId(defaultVeh);
    setSelectedCatalogId('');
    setFormServicio('');
    setFormFecha('');
    setFormHora('');
    setFormErrors({});
    initialFormValuesRef.current = {
      clientId: defaultClient,
      vehiculoId: defaultVeh,
      catalogId: '',
      servicio: '',
      fecha: '',
      hora: '',
    };
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (cita: Cita) => {
    setEditingCita(cita);
    setFormClientId(cita.clienteId);
    setFormVehiculoId(cita.vehiculoId);
    setSelectedCatalogId('');
    setFormServicio(cita.servicio);
    setFormFecha(cita.fecha);
    setFormHora(cita.hora);
    setFormErrors({});
    initialFormValuesRef.current = {
      clientId: cita.clienteId,
      vehiculoId: cita.vehiculoId,
      catalogId: '',
      servicio: cita.servicio,
      fecha: cita.fecha,
      hora: cita.hora,
    };
    setIsModalOpen(true);
  };

  // Modal dismiss handlers
  const citaFormDismiss = useModalDismiss({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setFormErrors({});
    },
    isDirty: () => {
      const init = initialFormValuesRef.current;
      return (
        formClientId !== init.clientId ||
        formVehiculoId !== init.vehiculoId ||
        selectedCatalogId !== init.catalogId ||
        formServicio.trim() !== init.servicio.trim() ||
        formFecha !== init.fecha ||
        formHora !== init.hora
      );
    },
    closeOnBackdrop: true,
  });

  const cancelConfirmDismiss = useModalDismiss({
    isOpen: Boolean(citaToCancel),
    onClose: () => setCitaToCancel(null),
    closeOnBackdrop: true,
  });

  const handleSelectCatalogService = (servId: string) => {
    setSelectedCatalogId(servId);
    if (!servId) return;
    const found = servicios.find((s) => s.id === servId);
    if (!found) return;

    if (formServicio.trim() && formServicio.trim() !== found.nombre) {
      const confirmReplace = window.confirm(
        'Ya escribiste un servicio solicitado. ¿Deseas sustituirlo con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogId('');
        return;
      }
    }

    setFormServicio(found.nombre);
    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
  };

  // When form client changes, auto-select their first vehicle
  const handleClientChange = (newClientId: string) => {
    setFormClientId(newClientId);
    const clientVehs = vehiculos.filter((v) => v.clienteId === newClientId);
    setFormVehiculoId(clientVehs[0]?.id || '');
    if (formErrors.clienteId) setFormErrors((prev) => ({ ...prev, clienteId: '' }));
  };

  // Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formClientId) {
      errors.clienteId = 'Debe seleccionar un cliente registrado.';
    }
    if (!formVehiculoId) {
      errors.vehiculoId = 'Debe seleccionar un vehículo.';
    }
    if (!formServicio.trim()) {
      errors.servicio = 'El servicio solicitado es obligatorio.';
    }
    if (!formFecha) {
      errors.fecha = 'La fecha de la cita es obligatoria.';
    }
    if (!formHora) {
      errors.hora = 'La hora de la cita es obligatoria.';
    }

    if (formFecha && formHora) {
      const scheduledDateTime = new Date(`${formFecha}T${formHora}`);
      const isDateChanged = !editingCita || editingCita.fecha !== formFecha || editingCita.hora !== formHora;

      // New appointment or rescheduled appointment must be in the future
      if (isDateChanged && scheduledDateTime.getTime() <= Date.now()) {
        errors.fecha = 'La fecha y hora de la cita deben ser futuras.';
      }

      // Check duplicate appointment for the same vehicle at the same date and time
      const hasConflict = citas.some((c) => {
        if (editingCita && c.id === editingCita.id) return false;
        return (
          c.estado === 'Programada' &&
          c.vehiculoId === formVehiculoId &&
          c.fecha === formFecha &&
          c.hora === formHora
        );
      });

      if (hasConflict) {
        errors.hora = 'Este vehículo ya tiene una cita programada para esa fecha y hora.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const savedCita: Cita = {
      id: editingCita ? editingCita.id : `cita-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: formClientId,
      vehiculoId: formVehiculoId,
      servicio: formServicio.trim(),
      fecha: formFecha,
      hora: formHora,
      estado: editingCita ? editingCita.estado : 'Programada',
      creadoEn: editingCita ? editingCita.creadoEn : new Date().toISOString(),
    };

    onSaveCita(savedCita);
    setIsModalOpen(false);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Counts for each tab
  const citasCounts = useMemo(() => {
    let hoy = 0;
    let proximas = 0;
    let anteriores = 0;
    let canceladas = 0;

    citas.forEach((c) => {
      if (c.estado === 'Cancelada') {
        canceladas++;
      } else if (c.fecha === todayStr) {
        hoy++;
      } else if (c.fecha > todayStr) {
        proximas++;
      } else {
        anteriores++;
      }
    });

    return { hoy, proximas, anteriores, canceladas };
  }, [citas, todayStr]);

  // Filter & Search Logic
  const filteredCitas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return citas
      .filter((cita) => {
        // Tab separation: hoy, proximas, anteriores, canceladas
        if (filter === 'canceladas') {
          if (cita.estado !== 'Cancelada') return false;
        } else if (cita.estado === 'Cancelada') {
          return false;
        } else if (filter === 'hoy') {
          if (cita.fecha !== todayStr) return false;
        } else if (filter === 'proximas') {
          if (cita.fecha <= todayStr) return false;
        } else if (filter === 'anteriores') {
          if (cita.fecha >= todayStr) return false;
        }

        // Date filter
        if (filterDate && cita.fecha !== filterDate) {
          return false;
        }

        // Search filter
        if (q) {
          const client = clienteMap.get(cita.clienteId);
          const veh = vehiculoMap.get(cita.vehiculoId);
          const clientMatch = client?.nombre.toLowerCase().includes(q);
          const plateMatch = veh?.placas.toLowerCase().includes(q);
          const serviceMatch = cita.servicio.toLowerCase().includes(q);
          return Boolean(clientMatch || plateMatch || serviceMatch);
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.fecha}T${a.hora}`).getTime();
        const timeB = new Date(`${b.fecha}T${b.hora}`).getTime();
        if (filter === 'hoy' || filter === 'proximas') {
          return timeA - timeB; // Nearest first
        }
        return timeB - timeA; // Most recent first
      });
  }, [citas, filter, searchQuery, filterDate, todayStr, clienteMap, vehiculoMap]);

  const isAnyFilterActive = Boolean(searchQuery.trim() || filterDate);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
  };

  const handleConfirmarCita = (cita: Cita) => {
    onSaveCita({
      ...cita,
      estado: 'Confirmada',
    });
  };

  return (
    <section className="space-y-5">
      {/* Encabezado uniforme TUNNO */}
      <SectionHeader
        icon={<CalendarIcon className="w-5 h-5 text-[#1497F2]" />}
        title="Citas"
        description="Agenda y programa las citas de servicio del taller."
        primaryAction={{
          label: 'Agendar cita',
          icon: <Plus className="w-4 h-4" />,
          onClick: handleOpenAdd,
        }}
        secondaryActions={
          onOpenCopiloto
            ? [
                {
                  label: 'Ayudarme con IA',
                  icon: <Sparkles className="w-4 h-4 text-[#1497F2]" />,
                  variant: 'ai',
                  onClick: onOpenCopiloto,
                },
              ]
            : undefined
        }
      />

      {/* Barra uniforme de búsqueda y filtros */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Pestañas de estado (Hoy, Próximas, Anteriores, Canceladas) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('hoy')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'hoy'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <span>Hoy</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === 'hoy' ? 'bg-sky-100 text-[#1497F2]' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {citasCounts.hoy}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('proximas')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'proximas'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <span>Próximas</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === 'proximas' ? 'bg-sky-100 text-[#1497F2]' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {citasCounts.proximas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('anteriores')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'anteriores'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <span>Anteriores</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === 'anteriores' ? 'bg-sky-100 text-[#1497F2]' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {citasCounts.anteriores}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('canceladas')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === 'canceladas'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <span>Canceladas</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filter === 'canceladas' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {citasCounts.canceladas}
              </span>
            </button>
          </div>

          {/* Buscador + Selector de fecha + Limpiar filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, placas o servicio..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs sm:text-sm text-[#06345A] placeholder-slate-400 focus:outline-none focus:border-[#1497F2] focus:bg-white transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#06345A] focus:outline-none focus:border-[#1497F2] focus:bg-white transition-all"
                title="Filtrar por fecha específica"
              />
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                title="Limpiar filtros activos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong className="text-[#06345A] font-semibold">{filteredCitas.length}</strong>{' '}
            {filteredCitas.length === 1 ? 'cita' : 'citas'}{' '}
            {filter === 'hoy'
              ? 'programadas para hoy'
              : filter === 'proximas'
              ? 'próximas'
              : filter === 'anteriores'
              ? 'anteriores'
              : 'canceladas'}
          </span>
          {filterDate && (
            <span className="text-[11px] text-slate-500">
              Fecha seleccionada: <strong className="text-[#06345A]">{filterDate}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Citas Table & Mobile View */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {filteredCitas.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F4F6F8] border-b border-[#E5E7EB] text-[#6B7280] font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-5">Hora y fecha</th>
                    <th className="py-3 px-5">Cliente</th>
                    <th className="py-3 px-5">Vehículo</th>
                    <th className="py-3 px-5">Servicio</th>
                    <th className="py-3 px-5">Estado</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredCitas.map((cita) => {
                    const client = clienteMap.get(cita.clienteId);
                    const veh = vehiculoMap.get(cita.vehiculoId);
                    const isMenuOpen = openMenuId === cita.id;

                    return (
                      <tr key={cita.id} className="hover:bg-[#F4F6F8]/80 transition-colors">
                        {/* Hora y fecha */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-[#1497F2] font-mono font-bold text-xs border border-sky-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{cita.hora}</span>
                          </div>
                          <div className="text-xs text-[#6B7280] flex items-center gap-1 mt-1">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            <span>{cita.fecha}</span>
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#06345A]">
                            {client ? client.nombre : 'Cliente no encontrado'}
                          </div>
                          {client?.telefono && (
                            <div className="text-xs text-[#6B7280] mt-0.5">{client.telefono}</div>
                          )}
                        </td>

                        {/* Vehículo */}
                        <td className="py-3.5 px-5">
                          {veh ? (
                            <div>
                              <div className="font-medium text-[#06345A] text-xs sm:text-sm">
                                {veh.marca} {veh.modelo}
                              </div>
                              <span className="inline-block font-mono text-[#06345A] bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-[#E5E7EB] mt-0.5">
                                {veh.placas}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No registrado</span>
                          )}
                        </td>

                        {/* Servicio solicitado */}
                        <td className="py-3.5 px-5 text-[#374151] max-w-xs">
                          <span className="line-clamp-2 font-medium">{cita.servicio}</span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          {cita.estado === 'Confirmada' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmada
                            </span>
                          ) : cita.estado === 'Programada' ? (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Programada
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelada
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Acción rápida: Confirmar */}
                            {cita.estado === 'Programada' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmarCita(cita)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                title="Confirmar cita con el cliente"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirmar</span>
                              </button>
                            )}

                            {/* Acción rápida: Reprogramar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cita)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#06345A] bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer"
                              title="Reprogramar fecha y hora"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#1497F2]" />
                              <span>Reprogramar</span>
                            </button>

                            {/* Menú de opciones secundarias (Cancelar) */}
                            {cita.estado !== 'Cancelada' && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(isMenuOpen ? null : cita.id)}
                                  className="p-1.5 text-slate-400 hover:text-[#06345A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                  title="Más opciones"
                                  aria-label="Más opciones"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setOpenMenuId(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setCitaToCancel(cita);
                                        }}
                                        className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Cancelar cita</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Bloques legibles sin scroll horizontal */}
            <div className="md:hidden divide-y divide-[#E5E7EB]">
              {filteredCitas.map((cita) => {
                const client = clienteMap.get(cita.clienteId);
                const veh = vehiculoMap.get(cita.vehiculoId);
                const isMenuOpen = openMenuId === cita.id;

                return (
                  <div key={cita.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-[#1497F2] font-mono font-bold text-xs border border-sky-200">
                            <Clock className="w-3 h-3" />
                            {cita.hora}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {cita.fecha}
                          </span>
                          {cita.estado === 'Confirmada' ? (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Confirmada
                            </span>
                          ) : cita.estado === 'Programada' ? (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Programada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelada
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-[#06345A] text-sm">{client?.nombre || 'Cliente'}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo sin asignar'}
                        </p>
                        <p className="text-xs text-[#374151] mt-1 font-medium">{cita.servicio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {cita.estado === 'Programada' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmarCita(cita)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cita)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#06345A] bg-white border border-[#E5E7EB] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#1497F2]" />
                        <span>Reprogramar</span>
                      </button>

                      {cita.estado !== 'Cancelada' && (
                        <button
                          type="button"
                          onClick={() => setCitaToCancel(cita)}
                          className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Cancelar cita"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<CalendarIcon className="w-6 h-6 text-slate-400" />}
            title={
              isAnyFilterActive
                ? 'No se encontraron citas con los filtros aplicados'
                : filter === 'hoy'
                ? 'No hay citas programadas para hoy'
                : filter === 'proximas'
                ? 'No hay citas próximas registradas'
                : filter === 'anteriores'
                ? 'No hay citas anteriores'
                : 'No hay citas canceladas'
            }
            description={
              isAnyFilterActive
                ? 'Intenta cambiar los términos de búsqueda o restablecer la fecha.'
                : 'Puedes agendar una nueva cita con el cliente para registrar el servicio.'
            }
            action={
              isAnyFilterActive
                ? {
                    label: 'Limpiar filtros',
                    icon: <RotateCcw className="w-3.5 h-3.5" />,
                    onClick: handleClearFilters,
                  }
                : {
                    label: 'Agendar cita',
                    icon: <Plus className="w-3.5 h-3.5" />,
                    onClick: handleOpenAdd,
                  }
            }
          />
        )}
      </div>

      {/* MODAL: AGENDAR / EDITAR CITA */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={citaFormDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#06345A]">
                {editingCita ? 'Editar cita' : 'Agendar cita'}
              </h3>
              <button
                type="button"
                onClick={citaFormDismiss.handleClose}
                className="text-slate-400 hover:text-[#06345A] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Selección de Cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cliente registrado <span className="text-red-500">*</span>
                </label>
                {clientes.length > 0 ? (
                  <select
                    autoFocus
                    value={formClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
                  >
                    <option value="" disabled>Seleccione un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No hay clientes registrados en el sistema.
                  </p>
                )}
                {formErrors.clienteId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.clienteId}</p>
                )}
              </div>

              {/* Información de contacto del cliente (Solo lectura) */}
              {selectedClient && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-700 block">Información de contacto:</span>
                  <p>
                    <span className="text-slate-400">Teléfono:</span>{' '}
                    <strong className="text-slate-800">{selectedClient.telefono}</strong>
                  </p>
                  {selectedClient.correo && (
                    <p>
                      <span className="text-slate-400">Correo:</span>{' '}
                      <strong className="text-slate-800">{selectedClient.correo}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Selección de Vehículo */}
              <div>
                <label className="block text-xs font-semibold text-[#06345A] mb-1.5">
                  Vehículo del cliente <span className="text-[#1497F2]">*</span>
                </label>
                {availableVehicles.length > 0 ? (
                  <select
                    value={formVehiculoId}
                    onChange={(e) => {
                      setFormVehiculoId(e.target.value);
                      if (formErrors.vehiculoId) setFormErrors((prev) => ({ ...prev, vehiculoId: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
                  >
                    <option value="" disabled>Seleccione un vehículo</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} — Placas: {v.placas}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Este cliente no tiene vehículos registrados aún.
                  </p>
                )}
                {formErrors.vehiculoId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.vehiculoId}</p>
                )}
              </div>

              {/* Apartado desplegable opcional: Servicio del catálogo */}
              <details className="group pt-1" open={Boolean(selectedCatalogId)}>
                <summary className="text-xs text-[#6B7280] hover:text-[#06345A] cursor-pointer font-medium flex items-center justify-between py-1 select-none">
                  <span>Datos opcionales (seleccionar del catálogo de servicios)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-2">
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => handleSelectCatalogService(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
                  >
                    <option value="">Seleccionar del catálogo o redactar abajo...</option>
                    {activeCatalogServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} (${s.total.toFixed(2)} MXN)
                      </option>
                    ))}
                  </select>
                </div>
              </details>

              {/* Servicio solicitado */}
              <div>
                <label className="block text-xs font-semibold text-[#06345A] mb-1.5">
                  Servicio solicitado <span className="text-[#1497F2]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formServicio}
                  onChange={(e) => {
                    setFormServicio(e.target.value);
                    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
                  }}
                  placeholder="Ej. Afinación mayor, cambio de aceite y filtro"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] placeholder-slate-400 focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                    formErrors.servicio ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                  }`}
                />
                {formErrors.servicio && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.servicio}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#06345A] mb-1.5">
                    Fecha <span className="text-[#1497F2]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => {
                      setFormFecha(e.target.value);
                      if (formErrors.fecha) setFormErrors((prev) => ({ ...prev, fecha: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                      formErrors.fecha ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.fecha && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#06345A] mb-1.5">
                    Hora <span className="text-[#1497F2]">*</span>
                  </label>
                  <input
                    type="time"
                    value={formHora}
                    onChange={(e) => {
                      setFormHora(e.target.value);
                      if (formErrors.hora) setFormErrors((prev) => ({ ...prev, hora: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                      formErrors.hora ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.hora && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.hora}</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={citaFormDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#06345A] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2.5 bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA CANCELAR CITA */}
      {citaToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={cancelConfirmDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#06345A]">¿Cancelar esta cita?</h3>
            </div>
            <p className="text-sm text-[#6B7280]">
              La cita programada para el <strong>{citaToCancel.fecha}</strong> a las{' '}
              <strong>{citaToCancel.hora}</strong> pasará al estado "Cancelada". Se conservará el registro en el sistema.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelConfirmDismiss.handleClose}
                className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#06345A] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelCita(citaToCancel.id);
                  setCitaToCancel(null);
                }}
                className="px-4 py-2.5 bg-[#06345A] hover:bg-rose-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
              >
                Sí, cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
