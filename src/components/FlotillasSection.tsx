import React, { useState, useMemo } from 'react';
import { Flotilla, Vehiculo, Cliente, EstadoFlotilla } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  Truck,
  Plus,
  Search,
  Pencil,
  X,
  Car,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface FlotillasSectionProps {
  flotillas: Flotilla[];
  vehiculos: Vehiculo[];
  clientes: Cliente[];
  onSaveFlotilla: (flotilla: Flotilla) => void;
  onDeleteFlotilla?: (flotillaId: string) => void;
  onOpenCopiloto?: () => void;
}

export const FlotillasSection: React.FC<FlotillasSectionProps> = ({
  flotillas,
  vehiculos,
  clientes,
  onSaveFlotilla,
  onOpenCopiloto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todas' | 'Activa' | 'Inactiva'>('todas');
  const [expandedFlotillaId, setExpandedFlotillaId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlotilla, setEditingFlotilla] = useState<Flotilla | null>(null);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formEstado, setFormEstado] = useState<EstadoFlotilla>('Activa');
  const [formSelectedVehiculoIds, setFormSelectedVehiculoIds] = useState<string[]>([]);
  const [vehiculoSearchFilter, setVehiculoSearchFilter] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Maps for fast lookups
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

  // Map each vehicle to the fleet ID it currently belongs to (excluding current editing fleet)
  const vehiculoToOtherFlotillaMap = useMemo(() => {
    const map = new Map<string, { flotillaId: string; flotillaNombre: string }>();
    flotillas.forEach((f) => {
      if (editingFlotilla && f.id === editingFlotilla.id) return;
      f.vehiculoIds.forEach((vId) => {
        map.set(vId, { flotillaId: f.id, flotillaNombre: f.nombre });
      });
    });
    return map;
  }, [flotillas, editingFlotilla]);

  // Overall statistics
  const totalFlotillasActivas = useMemo(
    () => flotillas.filter((f) => f.estado === 'Activa').length,
    [flotillas]
  );

  const vehiculosEnFlotillasCount = useMemo(() => {
    const assignedSet = new Set<string>();
    flotillas.forEach((f) => {
      f.vehiculoIds.forEach((vId) => assignedSet.add(vId));
    });
    return assignedSet.size;
  }, [flotillas]);

  const vehiculosDisponiblesCount = useMemo(() => {
    const assignedSet = new Set<string>();
    flotillas.forEach((f) => {
      f.vehiculoIds.forEach((vId) => assignedSet.add(vId));
    });
    return vehiculos.filter((v) => !assignedSet.has(v.id)).length;
  }, [vehiculos, flotillas]);

  const flotillaModalDismiss = useModalDismiss({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setEditingFlotilla(null);
      setFormErrors({});
      setVehiculoSearchFilter('');
    },
    isDirty: () =>
      formNombre.trim() !== (editingFlotilla?.nombre || '') ||
      formEmpresa.trim() !== (editingFlotilla?.empresa || '') ||
      formContacto.trim() !== (editingFlotilla?.contacto || '') ||
      formTelefono.trim() !== (editingFlotilla?.telefono || '') ||
      formCorreo.trim() !== (editingFlotilla?.correo || '') ||
      formNotas.trim() !== (editingFlotilla?.notas || '') ||
      formEstado !== (editingFlotilla?.estado || 'Activa') ||
      JSON.stringify(formSelectedVehiculoIds) !== JSON.stringify(editingFlotilla?.vehiculoIds || []),
    closeOnBackdrop: true,
  });

  const handleOpenAdd = () => {
    setEditingFlotilla(null);
    setFormNombre('');
    setFormEmpresa('');
    setFormContacto('');
    setFormTelefono('');
    setFormCorreo('');
    setFormNotas('');
    setFormEstado('Activa');
    setFormSelectedVehiculoIds([]);
    setVehiculoSearchFilter('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Flotilla) => {
    setEditingFlotilla(f);
    setFormNombre(f.nombre);
    setFormEmpresa(f.empresa);
    setFormContacto(f.contacto);
    setFormTelefono(f.telefono);
    setFormCorreo(f.correo || '');
    setFormNotas(f.notas || '');
    setFormEstado(f.estado);
    setFormSelectedVehiculoIds([...f.vehiculoIds]);
    setVehiculoSearchFilter('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const toggleSelectVehiculo = (vehiculoId: string) => {
    // Check if vehicle belongs to another fleet
    if (vehiculoToOtherFlotillaMap.has(vehiculoId)) {
      return; // Cannot assign
    }

    setFormSelectedVehiculoIds((prev) =>
      prev.includes(vehiculoId)
        ? prev.filter((id) => id !== vehiculoId)
        : [...prev, vehiculoId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre de la flotilla es obligatorio.';
    }
    if (!formEmpresa.trim()) {
      errors.empresa = 'El nombre de la empresa es obligatorio.';
    }
    if (!formContacto.trim()) {
      errors.contacto = 'El contacto principal es obligatorio.';
    }
    if (!formTelefono.trim()) {
      errors.telefono = 'El teléfono de contacto es obligatorio.';
    }

    // Verify no vehicle belongs to another fleet
    for (const vId of formSelectedVehiculoIds) {
      const other = vehiculoToOtherFlotillaMap.get(vId);
      if (other) {
        const v = vehiculoMap.get(vId);
        errors.vehiculos = `El vehículo ${v?.placas || vId} ya pertenece a la flotilla "${other.flotillaNombre}". Un vehículo no puede pertenecer a dos flotillas.`;
        break;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const saved: Flotilla = {
      id: editingFlotilla
        ? editingFlotilla.id
        : `flot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: formNombre.trim(),
      empresa: formEmpresa.trim(),
      contacto: formContacto.trim(),
      telefono: formTelefono.trim(),
      correo: formCorreo.trim() || undefined,
      notas: formNotas.trim() || undefined,
      estado: formEstado,
      vehiculoIds: formSelectedVehiculoIds,
      creadoEn: editingFlotilla ? editingFlotilla.creadoEn : new Date().toISOString(),
    };

    onSaveFlotilla(saved);
    setIsModalOpen(false);
  };

  // Filtered flotillas
  const filteredFlotillas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return flotillas.filter((f) => {
      if (filterEstado !== 'todas' && f.estado !== filterEstado) return false;
      if (!q) return true;

      const nombreMatch = f.nombre.toLowerCase().includes(q);
      const empresaMatch = f.empresa.toLowerCase().includes(q);
      const contactoMatch = f.contacto.toLowerCase().includes(q);
      const telMatch = f.telefono.toLowerCase().includes(q);
      const placasMatch = f.vehiculoIds.some((vId) => {
        const v = vehiculoMap.get(vId);
        return v?.placas.toLowerCase().includes(q) || v?.modelo.toLowerCase().includes(q);
      });

      return nombreMatch || empresaMatch || contactoMatch || telMatch || placasMatch;
    });
  }, [flotillas, searchQuery, filterEstado, vehiculoMap]);

  return (
    <section className="space-y-6">
      {/* Encabezado TUNNO */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1497F2]/10 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight">
                Flotillas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#06345A] border border-[#73C7FF]/40">
                {flotillas.length} {flotillas.length === 1 ? 'flotilla' : 'flotillas'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              Administración de cuentas corporativas, empresas y asignación exclusiva de vehículos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenCopiloto && (
            <button
              type="button"
              onClick={onOpenCopiloto}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg bg-sky-50 hover:bg-sky-100/80 text-[#06345A] border border-[#73C7FF]/50 text-xs md:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir Copiloto de Flotillas"
            >
              <Sparkles className="w-4 h-4 text-[#1497F2]" />
              <span>Ayudarme con IA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva flotilla</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Flotillas activas</span>
            <Building2 className="w-4 h-4 text-[#1497F2]" />
          </div>
          <div className="text-2xl font-bold text-[#06345A]">{totalFlotillasActivas}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            De {flotillas.length} registradas
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Vehículos en flotilla</span>
            <Truck className="w-4 h-4 text-[#1497F2]" />
          </div>
          <div className="text-2xl font-bold text-[#06345A]">{vehiculosEnFlotillasCount}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Asignación empresarial</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Vehículos disponibles</span>
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#06345A]">{vehiculosDisponiblesCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Particulares / sin flotilla
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Total del parque</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-[#06345A]">{vehiculos.length}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Vehículos en el taller</div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, empresa, placas..."
            className="w-full pl-9 pr-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterEstado('todas')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'todas'
                ? 'bg-white text-[#1497F2] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Todas ({flotillas.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('Activa')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'Activa'
                ? 'bg-white text-[#1497F2] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Activas ({totalFlotillasActivas})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('Inactiva')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'Inactiva'
                ? 'bg-white text-[#1497F2] font-semibold shadow-2xs'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Inactivas ({flotillas.length - totalFlotillasActivas})
          </button>
        </div>
      </div>

      {/* Flotillas List */}
      <div className="space-y-4">
        {filteredFlotillas.length > 0 ? (
          filteredFlotillas.map((f) => {
            const isExpanded = expandedFlotillaId === f.id;
            const assignedVehicles = f.vehiculoIds
              .map((id) => vehiculoMap.get(id))
              .filter((v): v is Vehiculo => Boolean(v));

            return (
              <div
                key={f.id}
                className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs hover:border-[#1497F2]/50 transition-all"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-[#06345A]">{f.nombre}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          f.estado === 'Activa'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {f.estado === 'Activa' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{f.estado}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#1497F2] border border-blue-200">
                        <Truck className="w-3 h-3" />
                        <span>
                          {f.vehiculoIds.length}{' '}
                          {f.vehiculoIds.length === 1 ? 'vehículo asignado' : 'vehículos asignados'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-[#6B7280]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-[#06345A]">Empresa:</span>
                        <span className="truncate">{f.empresa}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-[#06345A]">Contacto:</span>
                        <span className="truncate">{f.contacto}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-[#06345A]">Teléfono:</span>
                        <span>{f.telefono}</span>
                      </div>
                      {f.correo && (
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-[#06345A]">Correo:</span>
                          <span className="truncate">{f.correo}</span>
                        </div>
                      )}
                    </div>

                    {f.notas && (
                      <div className="text-xs text-[#6B7280] bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">{f.notas}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(f)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#06345A] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedFlotillaId(isExpanded ? null : f.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#1497F2]/10 hover:bg-[#1497F2]/20 text-[#1497F2] transition-colors cursor-pointer"
                    >
                      <span>Vehículos ({assignedVehicles.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded assigned vehicles */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] bg-slate-50/60 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center justify-between">
                      <span>Vehículos asignados a {f.nombre}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Exclusivos para esta flotilla
                      </span>
                    </h4>

                    {assignedVehicles.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {assignedVehicles.map((v) => {
                          const cli = clienteMap.get(v.clienteId);
                          return (
                            <div
                              key={v.id}
                              className="bg-white border border-[#E5E7EB] rounded-lg p-3 text-xs space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#06345A] flex items-center gap-1.5">
                                  <Car className="w-3.5 h-3.5 text-[#1497F2]" />
                                  <span>{v.marca} {v.modelo}</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {v.placas}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                                <span>Año: {v.año || 'N/D'}</span>
                                <span className="truncate max-w-[120px]" title={cli?.nombre}>
                                  Titular: {cli?.nombre || 'Sin cliente'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-400">
                        No hay vehículos asignados a esta flotilla aún. Haz clic en "Editar" para asignarle vehículos.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-xs text-slate-400">
            {searchQuery
              ? 'No se encontraron flotillas que coincidan con la búsqueda.'
              : 'No hay flotillas registradas actualmente.'}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: ALTA / EDICIÓN DE FLOTILLA */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto no-print"
          onClick={flotillaModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white text-[#06345A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#73C7FF]/20 border border-[#73C7FF]/40 flex items-center justify-center text-[#1497F2]">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">
                  {editingFlotilla ? `Editar flotilla: ${editingFlotilla.nombre}` : 'Nueva flotilla'}
                </h3>
              </div>
              <button
                type="button"
                onClick={flotillaModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formErrors.vehiculos && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formErrors.vehiculos}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre de flotilla <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => {
                      setFormNombre(e.target.value);
                      if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: '' });
                    }}
                    placeholder="Ej. Flotilla Reparto Norte"
                    className={`w-full px-3 py-2 border rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] ${
                      formErrors.nombre ? 'border-red-400 bg-red-50/30' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.nombre && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Empresa o razón social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEmpresa}
                    onChange={(e) => {
                      setFormEmpresa(e.target.value);
                      if (formErrors.empresa) setFormErrors({ ...formErrors, empresa: '' });
                    }}
                    placeholder="Ej. Logística y Distribución S.A."
                    className={`w-full px-3 py-2 border rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] ${
                      formErrors.empresa ? 'border-red-400 bg-red-50/30' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.empresa && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.empresa}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contacto principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formContacto}
                    onChange={(e) => {
                      setFormContacto(e.target.value);
                      if (formErrors.contacto) setFormErrors({ ...formErrors, contacto: '' });
                    }}
                    placeholder="Ej. Ing. Roberto Gómez"
                    className={`w-full px-3 py-2 border rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] ${
                      formErrors.contacto ? 'border-red-400 bg-red-50/30' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.contacto && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.contacto}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de contacto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => {
                      setFormTelefono(e.target.value);
                      if (formErrors.telefono) setFormErrors({ ...formErrors, telefono: '' });
                    }}
                    placeholder="Ej. 555-888-9999"
                    className={`w-full px-3 py-2 border rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] ${
                      formErrors.telefono ? 'border-red-400 bg-red-50/30' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.telefono && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="Ej. flotillas@empresa.com"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estado de la flotilla
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as EstadoFlotilla)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] cursor-pointer"
                  >
                    <option value="Activa">Activa — Operando en taller</option>
                    <option value="Inactiva">Inactiva — Pausada o suspendida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas u observaciones
                </label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Detalles sobre facturación, condiciones de servicio o requerimientos especiales..."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
                />
              </div>

              {/* ASIGNACIÓN DE VEHÍCULOS (CON EXCLUSIVIDAD) */}
              <div className="pt-2 border-t border-[#E5E7EB] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Vehículos asignados ({formSelectedVehiculoIds.length})
                    </label>
                    <p className="text-[11px] text-[#6B7280]">
                      Un vehículo no puede pertenecer a dos flotillas al mismo tiempo.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={vehiculoSearchFilter}
                      onChange={(e) => setVehiculoSearchFilter(e.target.value)}
                      placeholder="Filtrar placas..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-[#E5E7EB] rounded-md"
                    />
                  </div>
                </div>

                {/* Vehicle Selection Box */}
                <div className="border border-[#E5E7EB] rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {vehiculos.length > 0 ? (
                    vehiculos
                      .filter((v) => {
                        if (!vehiculoSearchFilter.trim()) return true;
                        const q = vehiculoSearchFilter.toLowerCase();
                        return (
                          v.placas.toLowerCase().includes(q) ||
                          v.marca.toLowerCase().includes(q) ||
                          v.modelo.toLowerCase().includes(q)
                        );
                      })
                      .map((v) => {
                        const isSelected = formSelectedVehiculoIds.includes(v.id);
                        const otherFleet = vehiculoToOtherFlotillaMap.get(v.id);
                        const isBlockedByOther = Boolean(otherFleet);
                        const cli = clienteMap.get(v.clienteId);

                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              if (!isBlockedByOther) {
                                toggleSelectVehiculo(v.id);
                              }
                            }}
                            className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                              isBlockedByOther
                                ? 'bg-slate-100/80 cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'bg-blue-50/80 hover:bg-blue-100/60 cursor-pointer'
                                : 'hover:bg-white cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isBlockedByOther}
                                onChange={() => toggleSelectVehiculo(v.id)}
                                className="w-4 h-4 text-[#1497F2] rounded cursor-pointer"
                              />
                              <div>
                                <div className="font-bold text-[#06345A] flex items-center gap-1.5">
                                  <span>{v.marca} {v.modelo}</span>
                                  <span className="font-mono text-[11px] font-semibold text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                    {v.placas}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#6B7280]">
                                  {v.año ? `${v.año} · ` : ''}Cliente: {cli?.nombre || 'Particular'}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isBlockedByOther ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>En flotilla "{otherFleet?.flotillaNombre}"</span>
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-bold text-[#1497F2] bg-white px-2 py-0.5 rounded border border-blue-200">
                                  Asignado
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Disponible
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      No hay vehículos registrados en el taller.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={flotillaModalDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1497F2] hover:bg-[#06345A] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
                >
                  Guardar flotilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
