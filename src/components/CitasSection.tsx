import React, { useState, useMemo } from 'react';
import { Cliente, Vehiculo, Cita, ServicioCatalogo } from '../types';
import { Search, Plus, Pencil, X, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';

interface CitasSectionProps {
  citas: Cita[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  onSaveCita: (cita: Cita) => void;
  onCancelCita: (citaId: string) => void;
}

type CitaFilter = 'proximas' | 'todas' | 'canceladas';

export const CitasSection: React.FC<CitasSectionProps> = ({
  citas,
  clientes,
  vehiculos,
  servicios,
  onSaveCita,
  onCancelCita,
}) => {
  const [filter, setFilter] = useState<CitaFilter>('proximas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);

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
    setFormVehiculoId(defaultVehs[0]?.id || '');
    setSelectedCatalogId('');
    setFormServicio('');
    setFormFecha('');
    setFormHora('');
    setFormErrors({});
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
    setIsModalOpen(true);
  };

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

  // Filter & Search Logic
  const filteredCitas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return citas
      .filter((cita) => {
        // Filter by tab
        if (filter === 'canceladas') {
          if (cita.estado !== 'Cancelada') return false;
        } else if (filter === 'proximas') {
          if (cita.estado !== 'Programada') return false;
          const citaDate = new Date(`${cita.fecha}T${cita.hora}`);
          if (isNaN(citaDate.getTime()) || citaDate.getTime() < now.getTime()) {
            return false;
          }
        }

        // Filter by search
        if (q) {
          const client = clienteMap.get(cita.clienteId);
          const veh = vehiculoMap.get(cita.vehiculoId);
          const clientMatch = client?.nombre.toLowerCase().includes(q);
          const plateMatch = veh?.placas.toLowerCase().includes(q);
          return Boolean(clientMatch || plateMatch);
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.fecha}T${a.hora}`).getTime();
        const timeB = new Date(`${b.fecha}T${b.hora}`).getTime();
        if (filter === 'proximas') {
          return timeA - timeB; // Nearest first
        }
        return timeB - timeA; // Most recent first for 'todas' and 'canceladas'
      });
  }, [citas, filter, searchQuery, clienteMap, vehiculoMap]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Citas
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Gestión y seguimiento de citas programadas en el taller.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar cita</span>
        </button>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o placas..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilter('proximas')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'proximas'
                ? 'bg-[#0d5c58] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Próximas
          </button>
          <button
            type="button"
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'todas'
                ? 'bg-[#0d5c58] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilter('canceladas')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'canceladas'
                ? 'bg-[#0d5c58] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Canceladas
          </button>
        </div>
      </div>

      {/* Citas Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3.5 px-5">Fecha y hora</th>
                <th className="py-3.5 px-5">Cliente y vehículo</th>
                <th className="py-3.5 px-5">Servicio solicitado</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCitas.length > 0 ? (
                filteredCitas.map((cita) => {
                  const client = clienteMap.get(cita.clienteId);
                  const veh = vehiculoMap.get(cita.vehiculoId);

                  return (
                    <tr key={cita.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fecha y hora */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          <span>{cita.fecha}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cita.hora}</span>
                        </div>
                      </td>

                      {/* Cliente y vehículo */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900">
                          {client ? client.nombre : 'Cliente no encontrado'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {veh ? (
                            <span>
                              {veh.marca} {veh.modelo}{' '}
                              <strong className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">
                                {veh.placas}
                              </strong>
                            </span>
                          ) : (
                            'Vehículo no registrado'
                          )}
                        </div>
                      </td>

                      {/* Servicio solicitado */}
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs">
                        <span className="line-clamp-2">{cita.servicio}</span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {cita.estado === 'Programada' ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-[#0d5c58] border border-teal-200">
                              Programada
                            </span>
                            <button
                              type="button"
                              onClick={() => setCitaToCancel(cita)}
                              title="Cancelar cita"
                              className="text-xs text-rose-600 hover:text-rose-800 underline underline-offset-2 ml-1"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cita)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0d5c58] bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron citas que coincidan con la búsqueda.'
                      : filter === 'proximas'
                      ? 'No hay citas próximas programadas.'
                      : filter === 'canceladas'
                      ? 'No hay citas canceladas.'
                      : 'No hay citas registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AGENDAR / EDITAR CITA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCita ? 'Editar cita' : 'Agendar cita'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                    value={formClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vehículo del cliente <span className="text-red-500">*</span>
                </label>
                {availableVehicles.length > 0 ? (
                  <select
                    value={formVehiculoId}
                    onChange={(e) => {
                      setFormVehiculoId(e.target.value);
                      if (formErrors.vehiculoId) setFormErrors((prev) => ({ ...prev, vehiculoId: '' }));
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
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

              {/* Selector opcional: Servicio del catálogo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogService(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                >
                  <option value="">Seleccionar del catálogo o escribir abajo...</option>
                  {activeCatalogServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (${s.total.toFixed(2)} MXN)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes seleccionar un servicio activo para autocompletar la descripción o redactarla manualmente.
                </p>
              </div>

              {/* Servicio solicitado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Servicio solicitado <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formServicio}
                  onChange={(e) => {
                    setFormServicio(e.target.value);
                    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
                  }}
                  placeholder="Ej. Afinación mayor, cambio de aceite y filtro"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                    formErrors.servicio ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {formErrors.servicio && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.servicio}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => {
                      setFormFecha(e.target.value);
                      if (formErrors.fecha) setFormErrors((prev) => ({ ...prev, fecha: '' }));
                    }}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.fecha ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.fecha && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formHora}
                    onChange={(e) => {
                      setFormHora(e.target.value);
                      if (formErrors.hora) setFormErrors((prev) => ({ ...prev, hora: '' }));
                    }}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.hora ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.hora && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.hora}</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2 bg-[#0d5c58] hover:bg-[#0a4845] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Cancelar esta cita?</h3>
            </div>
            <p className="text-sm text-slate-600">
              La cita programada para el <strong>{citaToCancel.fecha}</strong> a las{' '}
              <strong>{citaToCancel.hora}</strong> pasará al estado "Cancelada". Se conservará el registro en el sistema.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCitaToCancel(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelCita(citaToCancel.id);
                  setCitaToCancel(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
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
