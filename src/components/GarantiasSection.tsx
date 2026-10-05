import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Eye,
  Printer,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Car,
  User,
  Calendar,
  Wrench,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  Garantia,
  EstadoGarantia,
  OrdenTrabajo,
  Cliente,
  Vehiculo,
  ConfiguracionTaller,
  SesionUsuario,
} from '../types';
import { IotLogo } from './IotLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface GarantiasSectionProps {
  garantias: Garantia[];
  ordenes: OrdenTrabajo[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  configuracion: ConfiguracionTaller;
  currentUser?: SesionUsuario;
  onSaveGarantia: (garantia: Garantia) => void;
  onUpdateGarantia: (garantia: Garantia) => void;
  onAplicarGarantia: (
    garantiaId: string,
    motivoRegreso: string,
    observaciones: string,
    fecha: string
  ) => void;
  onCancelarGarantia: (garantiaId: string, motivo: string) => void;
  onAddObservacionMecanico: (garantiaId: string, texto: string) => void;
  initialOrdenParaGarantia?: OrdenTrabajo | null;
  onClearInitialOrden?: () => void;
}

type TabFilter = 'todas' | 'Vigentes' | 'Vencidas' | 'Aplicadas' | 'Canceladas';

// Helper to calculate effective state without mutating original record
export function getEstadoGarantiaEfectivo(g: Garantia, hoyStr?: string): EstadoGarantia {
  if (g.estado === 'Aplicada' || g.estado === 'Cancelada') {
    return g.estado;
  }
  const today = hoyStr || new Date().toISOString().slice(0, 10);
  if (g.fechaVencimiento < today) {
    return 'Vencida';
  }
  return 'Vigente';
}

// Calculate days remaining or days expired
export function getDiasRestantes(fechaVencimiento: string, hoyStr?: string): number {
  const today = new Date(hoyStr || new Date().toISOString().slice(0, 10));
  const venc = new Date(fechaVencimiento);
  const diffTime = venc.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const GarantiasSection: React.FC<GarantiasSectionProps> = ({
  garantias,
  ordenes,
  clientes,
  vehiculos,
  configuracion,
  currentUser,
  onSaveGarantia,
  onAplicarGarantia,
  onCancelarGarantia,
  onAddObservacionMecanico,
  initialOrdenParaGarantia,
  onClearInitialOrden,
}) => {
  const isMecanico = currentUser?.rol === 'Mecánico';
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<TabFilter>('todas');

  // Detail Modal / View sheet state
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMotivo, setApplyMotivo] = useState('');
  const [applyObs, setApplyObs] = useState('');
  const [applyFecha, setApplyFecha] = useState(todayStr);
  const [applyConfirmed, setApplyConfirmed] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplyingProcessing, setIsApplyingProcessing] = useState(false);

  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Add Garantia Modal state (manual creation from available delivered orders)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createOrdenId, setCreateOrdenId] = useState('');
  const [createTrabajo, setCreateTrabajo] = useState('');
  const [createFechaInicio, setCreateFechaInicio] = useState(todayStr);
  const [createDuracionDias, setCreateDuracionDias] = useState('90');
  const [createCondiciones, setCreateCondiciones] = useState(
    'Cubre mano de obra y refacciones instaladas por defectos de manufactura o ensamble bajo condiciones normales de uso. No aplica en negligencia, choque o manipulación por terceros.'
  );
  const [createError, setCreateError] = useState<string | null>(null);

  // Auto-open modal when an order is requested from outside (e.g. OrdenesSection)
  useEffect(() => {
    if (initialOrdenParaGarantia) {
      setCreateOrdenId(initialOrdenParaGarantia.id);
      setCreateTrabajo(initialOrdenParaGarantia.diagnostico || initialOrdenParaGarantia.servicio);
      if (initialOrdenParaGarantia.fechaHoraEntrega) {
        const match = initialOrdenParaGarantia.fechaHoraEntrega.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          setCreateFechaInicio(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          setCreateFechaInicio(todayStr);
        }
      } else {
        setCreateFechaInicio(todayStr);
      }
      setCreateDuracionDias('90');
      setCreateError(null);
      setIsCreateModalOpen(true);
      onClearInitialOrden?.();
    }
  }, [initialOrdenParaGarantia, onClearInitialOrden, todayStr]);

  // Observation input in details
  const [obsInput, setObsInput] = useState('');

  // Collapsible sections in detail modal
  const [openCondicionesAccordion, setOpenCondicionesAccordion] = useState(true);
  const [openObservacionesAccordion, setOpenObservacionesAccordion] = useState(true);

  const detailModalDismiss = useModalDismiss({
    isOpen: Boolean(selectedGarantia) && !isApplyModalOpen && !isCancelModalOpen,
    onClose: () => {
      setSelectedGarantia(null);
      setObsInput('');
    },
    closeOnBackdrop: true,
  });

  const applyModalDismiss = useModalDismiss({
    isOpen: isApplyModalOpen && Boolean(selectedGarantia),
    onClose: () => {
      setIsApplyModalOpen(false);
      setApplyMotivo('');
      setApplyObs('');
      setApplyConfirmed(false);
      setApplyError(null);
    },
    isDirty: Boolean(applyMotivo.trim() || applyObs.trim()),
    dirtyMessage: '¿Deseas descartar el trámite de aplicación de garantía?',
    closeOnBackdrop: true,
  });

  const cancelModalDismiss = useModalDismiss({
    isOpen: isCancelModalOpen && Boolean(selectedGarantia),
    onClose: () => {
      setIsCancelModalOpen(false);
      setCancelMotivo('');
      setCancelError(null);
    },
    isDirty: Boolean(cancelMotivo.trim()),
    dirtyMessage: '¿Deseas descartar la cancelación de la garantía?',
    closeOnBackdrop: true,
  });

  const createModalDismiss = useModalDismiss({
    isOpen: isCreateModalOpen,
    onClose: () => {
      setIsCreateModalOpen(false);
      setCreateError(null);
    },
    isDirty: Boolean(createTrabajo.trim()),
    dirtyMessage: '¿Deseas descartar la creación de la póliza de garantía?',
    closeOnBackdrop: true,
  });

  // Delivered orders without active warranty
  const ordenesEntregadas = useMemo(() => {
    return ordenes.filter((o) => {
      // Must be delivered
      if (!o.entregado) return false;

      // Cannot have an active (Vigente / Aplicada) warranty already
      const hasActive = garantias.some(
        (g) =>
          g.ordenId === o.id &&
          (g.estado === 'Vigente' ||
            g.estado === 'Aplicada' ||
            getEstadoGarantiaEfectivo(g, todayStr) === 'Vigente')
      );
      return !hasActive;
    });
  }, [ordenes, garantias, todayStr]);

  // Mechanic filtering: mechanic can only see warranties linked to their assigned orders
  const garantiasPermitidas = useMemo(() => {
    if (!isMecanico) return garantias;
    return garantias.filter(
      (g) =>
        g.mecanicoId === currentUser?.usuarioId ||
        g.mecanicoId === currentUser?.empleadoId ||
        g.mecanicoNombre === currentUser?.nombre
    );
  }, [garantias, isMecanico, currentUser]);

  // Filtered & Sorted list
  const filteredGarantias = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return garantiasPermitidas
      .filter((g) => {
        const efectivo = getEstadoGarantiaEfectivo(g, todayStr);

        // Tab filter
        if (filterTab === 'Vigentes' && efectivo !== 'Vigente') return false;
        if (filterTab === 'Vencidas' && efectivo !== 'Vencida') return false;
        if (filterTab === 'Aplicadas' && g.estado !== 'Aplicada') return false;
        if (filterTab === 'Canceladas' && g.estado !== 'Cancelada') return false;

        // Search query: folio, cliente, placas, orden
        if (q) {
          const matchFolio = g.folio.toLowerCase().includes(q);
          const matchCliente = g.clienteNombre.toLowerCase().includes(q);
          const matchPlacas = g.vehiculoPlacas.toLowerCase().includes(q);
          const matchOrden = g.ordenFolio.toLowerCase().includes(q);
          const matchTrabajo = g.trabajoCubierto.toLowerCase().includes(q);
          return matchFolio || matchCliente || matchPlacas || matchOrden || matchTrabajo;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenar primero las garantías próximas a vencer (Vigentes ordenadas por fechaVencimiento ascendente)
        const estadoA = getEstadoGarantiaEfectivo(a, todayStr);
        const estadoB = getEstadoGarantiaEfectivo(b, todayStr);

        if (estadoA === 'Vigente' && estadoB !== 'Vigente') return -1;
        if (estadoB === 'Vigente' && estadoA !== 'Vigente') return 1;

        // Si ambas son vigentes o del mismo tipo, ordenar por fechaVencimiento más cercana
        return a.fechaVencimiento.localeCompare(b.fechaVencimiento);
      });
  }, [garantiasPermitidas, searchQuery, filterTab, todayStr]);

  // Handler: Open manual creation modal
  const handleOpenCreateModal = () => {
    setCreateError(null);
    if (ordenesEntregadas.length === 0) {
      setCreateError('No hay órdenes entregadas disponibles para registrar una nueva póliza de garantía.');
    }
    const firstOrd = ordenesEntregadas[0];
    if (firstOrd) {
      setCreateOrdenId(firstOrd.id);
      setCreateTrabajo(firstOrd.diagnostico || firstOrd.servicio);
      // Pre-fill date of delivery or today
      if (firstOrd.fechaHoraEntrega) {
        // parse date format
        const match = firstOrd.fechaHoraEntrega.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          setCreateFechaInicio(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          setCreateFechaInicio(todayStr);
        }
      } else {
        setCreateFechaInicio(todayStr);
      }
    } else {
      setCreateOrdenId('');
      setCreateTrabajo('');
      setCreateFechaInicio(todayStr);
    }
    setCreateDuracionDias('90');
    setIsCreateModalOpen(true);
  };

  // Change selected order in creation modal
  const handleSelectCreateOrder = (ordId: string) => {
    setCreateOrdenId(ordId);
    setCreateError(null);
    const ord = ordenes.find((o) => o.id === ordId);
    if (ord) {
      setCreateTrabajo(ord.diagnostico || ord.servicio);
      if (ord.fechaHoraEntrega) {
        const match = ord.fechaHoraEntrega.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          setCreateFechaInicio(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          setCreateFechaInicio(todayStr);
        }
      } else {
        setCreateFechaInicio(todayStr);
      }
    }
  };

  // Calculate expiration date helper
  const calculatedExpiration = useMemo(() => {
    const days = parseInt(createDuracionDias, 10);
    if (isNaN(days) || days <= 0 || !createFechaInicio) return '';
    try {
      const d = new Date(createFechaInicio);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }, [createFechaInicio, createDuracionDias]);

  // Submit Create Garantia
  const handleSaveCreateGarantia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrdenId) {
      setCreateError('Selecciona una orden de trabajo entregada.');
      return;
    }

    const ord = ordenes.find((o) => o.id === createOrdenId);
    if (!ord) {
      setCreateError('La orden seleccionada no es válida.');
      return;
    }

    // Check duplicate active
    const exists = garantias.some(
      (g) =>
        g.ordenId === ord.id &&
        (g.estado === 'Vigente' ||
          g.estado === 'Aplicada' ||
          getEstadoGarantiaEfectivo(g, todayStr) === 'Vigente')
    );
    if (exists) {
      setCreateError('Esta orden ya cuenta con una garantía activa registrada.');
      return;
    }

    if (!createTrabajo.trim()) {
      setCreateError('Especifica el trabajo cubierto por la póliza.');
      return;
    }

    const days = parseInt(createDuracionDias, 10);
    if (isNaN(days) || days <= 0) {
      setCreateError('La duración en días debe ser un entero positivo.');
      return;
    }

    if (!calculatedExpiration) {
      setCreateError('La fecha de vencimiento calculada no es válida.');
      return;
    }

    const cli = clientes.find((c) => c.id === ord.clienteId);
    const veh = vehiculos.find((v) => v.id === ord.vehiculoId);

    const count = garantias.length + 1;
    const folio = `GAR-${String(count).padStart(3, '0')}`;

    const newGarantia: Garantia = {
      id: `gar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio,
      ordenId: ord.id,
      ordenFolio: ord.folio,
      clienteId: ord.clienteId,
      clienteNombre: cli?.nombre || 'Cliente sin registrar',
      clienteTelefono: cli?.telefono,
      vehiculoId: ord.vehiculoId,
      vehiculoDescripcion: veh ? `${veh.marca} ${veh.modelo}` : 'Vehículo',
      vehiculoPlacas: veh?.placas || 'S/P',
      mecanicoId: ord.mecanicoId,
      mecanicoNombre: ord.mecanicoNombre,
      trabajoCubierto: createTrabajo.trim(),
      fechaInicio: createFechaInicio,
      duracionDias: days,
      fechaVencimiento: calculatedExpiration,
      condiciones: createCondiciones.trim() || 'Garantía estándar del taller.',
      estado: 'Vigente',
      creadoEn: new Date().toISOString(),
    };

    onSaveGarantia(newGarantia);
    setIsCreateModalOpen(false);
    setSelectedGarantia(newGarantia);
  };

  // Submit Apply Garantia
  const handleConfirmAplicar = () => {
    if (!selectedGarantia || isApplyingProcessing) return;

    if (!applyMotivo.trim()) {
      setApplyError('Debes registrar el motivo del reingreso por garantía.');
      return;
    }

    if (!applyConfirmed) {
      setApplyError('Debes marcar la casilla de confirmación para proceder con la orden.');
      return;
    }

    setIsApplyingProcessing(true);
    onAplicarGarantia(
      selectedGarantia.id,
      applyMotivo.trim(),
      applyObs.trim(),
      applyFecha || todayStr
    );

    setIsApplyingProcessing(false);
    setIsApplyModalOpen(false);
    setSelectedGarantia(null);
  };

  // Submit Cancel Garantia
  const handleConfirmCancelar = () => {
    if (!selectedGarantia) return;

    if (!cancelMotivo.trim()) {
      setCancelError('Especifica el motivo de la cancelación.');
      return;
    }

    onCancelarGarantia(selectedGarantia.id, cancelMotivo.trim());
    setIsCancelModalOpen(false);
    setSelectedGarantia(null);
  };

  // Submit add mechanic observation
  const handleAddObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGarantia || !obsInput.trim()) return;

    onAddObservacionMecanico(selectedGarantia.id, obsInput.trim());
    setObsInput('');

    // Keep selected updated
    const updated = {
      ...selectedGarantia,
      observacionesMecanico: [
        ...(selectedGarantia.observacionesMecanico || []),
        {
          id: `obs-${Date.now()}`,
          mecanicoNombre: currentUser?.nombre || 'Técnico',
          texto: obsInput.trim(),
          fechaHora: new Date().toLocaleString('es-MX'),
        },
      ],
    };
    setSelectedGarantia(updated);
  };

  // Handle print clean sheet
  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Garantías */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Garantías de servicio
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Registro, consulta y aplicación de pólizas de garantía para trabajos entregados.
            </p>
          </div>
        </div>

        {!isMecanico && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar garantía</span>
          </button>
        )}
      </div>

      {/* Security & Scope disclaimer */}
      <div className="p-3.5 bg-slate-50 border border-[#DDE4E8] rounded-xl text-xs text-[#5F6B73] flex items-start gap-2.5 no-print">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Aviso de demostración:</strong> El registro de garantías es una función administrativa
          para seguimiento interno del taller. La cobertura real depende de las políticas físicas y diagnósticos técnicos en bahía.
        </p>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por folio, cliente, placas u orden..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white border border-[#DDE4E8] rounded-lg text-xs font-medium">
          {(['todas', 'Vigentes', 'Vencidas', 'Aplicadas', 'Canceladas'] as TabFilter[]).map((tab) => {
            const count = garantiasPermitidas.filter((g) => {
              if (tab === 'todas') return true;
              const ef = getEstadoGarantiaEfectivo(g, todayStr);
              if (tab === 'Vigentes') return ef === 'Vigente';
              if (tab === 'Vencidas') return ef === 'Vencida';
              if (tab === 'Aplicadas') return g.estado === 'Aplicada';
              if (tab === 'Canceladas') return g.estado === 'Cancelada';
              return false;
            }).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filterTab === tab
                    ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                    : 'text-[#5F6B73] hover:text-[#231F20] hover:bg-slate-50'
                }`}
              >
                <span>{tab === 'todas' ? 'Todas' : tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table & Mobile View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Cliente y vehículo</th>
                <th className="py-3 px-4">Orden relacionada</th>
                <th className="py-3 px-4">Trabajo cubierto</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGarantias.length > 0 ? (
                filteredGarantias.map((g) => {
                  const estadoEfectivo = getEstadoGarantiaEfectivo(g, todayStr);
                  const dias = getDiasRestantes(g.fechaVencimiento, todayStr);

                  return (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Folio */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {g.folio}
                        </span>
                      </td>

                      {/* Cliente y vehículo */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#231F20]">{g.clienteNombre}</div>
                        <div className="text-[11px] text-[#5F6B73] flex items-center gap-1.5 mt-0.5">
                          <Car className="w-3 h-3 text-slate-400" />
                          <span>{g.vehiculoDescripcion}</span>
                          <strong className="font-mono text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                            {g.vehiculoPlacas}
                          </strong>
                        </div>
                      </td>

                      {/* Orden original */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {g.ordenFolio}
                        </span>
                        {g.mecanicoNombre && (
                          <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                            <Wrench className="w-2.5 h-2.5" />
                            <span>{g.mecanicoNombre}</span>
                          </div>
                        )}
                      </td>

                      {/* Trabajo cubierto */}
                      <td className="py-3 px-4 max-w-xs text-slate-700">
                        <span className="line-clamp-2">{g.trabajoCubierto}</span>
                      </td>

                      {/* Fecha de vencimiento */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{g.fechaVencimiento}</span>
                        </div>
                        {estadoEfectivo === 'Vigente' && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            {dias === 0 ? 'Vence hoy' : `${dias} días restantes`}
                          </span>
                        )}
                        {estadoEfectivo === 'Vencida' && (
                          <span className="text-[10px] text-rose-500 block mt-0.5">
                            Venció hace {Math.abs(dias)} días
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                            estadoEfectivo === 'Vigente'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : estadoEfectivo === 'Vencida'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : estadoEfectivo === 'Aplicada'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {estadoEfectivo === 'Vigente' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {estadoEfectivo === 'Vencida' && <Clock className="w-3 h-3 text-slate-500" />}
                          {estadoEfectivo === 'Aplicada' && <RotateCcw className="w-3 h-3 text-blue-600" />}
                          {estadoEfectivo === 'Cancelada' && <XCircle className="w-3 h-3 text-rose-600" />}
                          <span>{estadoEfectivo}</span>
                        </span>
                      </td>

                      {/* Botón Ver */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGarantia(g);
                            setObsInput('');
                            setOpenCondicionesAccordion(true);
                            setOpenObservacionesAccordion(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      {searchQuery
                        ? 'No se encontraron garantías que coincidan con la búsqueda.'
                        : 'No hay garantías registradas en este apartado.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredGarantias.length > 0 ? (
            filteredGarantias.map((g) => {
              const estadoEfectivo = getEstadoGarantiaEfectivo(g, todayStr);
              const dias = getDiasRestantes(g.fechaVencimiento, todayStr);

              return (
                <div key={g.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                          {g.folio}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${
                            estadoEfectivo === 'Vigente'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : estadoEfectivo === 'Vencida'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : estadoEfectivo === 'Aplicada'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {estadoEfectivo}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#231F20] text-sm">{g.clienteNombre}</h4>
                      <p className="text-xs text-[#5F6B73] mt-0.5">
                        {g.vehiculoDescripcion} ({g.vehiculoPlacas})
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.trabajoCubierto}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Orden: <strong className="font-mono text-slate-700">{g.ordenFolio}</strong> • Vence: {g.fechaVencimiento}
                        {estadoEfectivo === 'Vigente' && (
                          <span className="text-emerald-700 font-medium ml-1">
                            ({dias === 0 ? 'Vence hoy' : `${dias}d`})
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGarantia(g);
                        setObsInput('');
                        setOpenCondicionesAccordion(true);
                        setOpenObservacionesAccordion(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600 text-sm">
                {searchQuery
                  ? 'No se encontraron garantías que coincidan con la búsqueda.'
                  : 'No hay garantías registradas en este apartado.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DETALLE Y FICHA DE GARANTÍA (VISTA E IMPRESIÓN LIMPIA) */}
      {/* ========================================================================= */}
      {selectedGarantia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in fade-in"
          onClick={detailModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Hidden on Print) */}
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">
                  Póliza de garantía {selectedGarantia.folio}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSheet}
                  className="px-3.5 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Imprimir póliza de garantía"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir ficha</span>
                </button>
                <button
                  type="button"
                  onClick={detailModalDismiss.handleClose}
                  className="p-1 rounded-md text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clean Sheet Body (Optimized for Screen & Print) */}
            <div className="p-6 md:p-8 space-y-6 text-xs text-slate-800 font-sans print:p-0">
              {/* Workshop Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="mb-2">
                    <IotLogo size="sm" variant="dark" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {configuracion.nombre || 'IOT Technologies'}
                  </h1>
                  {configuracion.direccion && (
                    <p className="text-xs text-slate-500 mt-0.5">{configuracion.direccion}</p>
                  )}
                  {configuracion.telefono && (
                    <p className="text-xs text-slate-500">Tel: {configuracion.telefono}</p>
                  )}
                </div>

                <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Póliza de garantía
                  </span>
                  <span className="font-mono text-lg font-black text-amber-800 block">
                    {selectedGarantia.folio}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Emitida: {selectedGarantia.creadoEn ? selectedGarantia.creadoEn.slice(0, 10) : selectedGarantia.fechaInicio}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              {(() => {
                const ef = getEstadoGarantiaEfectivo(selectedGarantia, todayStr);
                return (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      ef === 'Vigente'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : ef === 'Vencida'
                        ? 'bg-slate-100 border-slate-200 text-slate-800'
                        : ef === 'Aplicada'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {ef === 'Vigente' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {ef === 'Vencida' && <Clock className="w-4 h-4 text-slate-500" />}
                      {ef === 'Aplicada' && <RotateCcw className="w-4 h-4 text-blue-600" />}
                      {ef === 'Cancelada' && <XCircle className="w-4 h-4 text-rose-600" />}
                      <span className="font-bold">Estado actual: {ef}</span>
                    </div>

                    <span className="text-[11px] text-slate-600">
                      {ef === 'Vigente' && `Vigente hasta el ${selectedGarantia.fechaVencimiento}`}
                      {ef === 'Vencida' && `Expiró el ${selectedGarantia.fechaVencimiento}`}
                      {ef === 'Aplicada' && selectedGarantia.aplicacion && `Reingreso registrado: ${selectedGarantia.aplicacion.fecha}`}
                      {ef === 'Cancelada' && selectedGarantia.cancelacion && `Cancelada el: ${selectedGarantia.cancelacion.fechaCancelacion}`}
                    </span>
                  </div>
                );
              })()}

              {/* Client, Vehicle, and Order Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Titular y vehículo
                  </div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedGarantia.clienteNombre}</span>
                  </div>
                  {selectedGarantia.clienteTelefono && (
                    <div className="text-slate-500 text-[11px]">
                      Teléfono: {selectedGarantia.clienteTelefono}
                    </div>
                  )}
                  <div className="text-slate-700 flex items-center gap-1.5 pt-1 text-xs">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedGarantia.vehiculoDescripcion}</span>
                    <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                      {selectedGarantia.vehiculoPlacas}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Referencia y vigencia
                  </div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Orden de origen: <strong className="font-mono text-amber-800">{selectedGarantia.ordenFolio}</strong></span>
                  </div>
                  {selectedGarantia.mecanicoNombre && (
                    <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      <span>Técnico responsable: {selectedGarantia.mecanicoNombre}</span>
                    </div>
                  )}
                  <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
                    <div>Inicio: <strong>{selectedGarantia.fechaInicio}</strong> ({selectedGarantia.duracionDias} días)</div>
                    <div>Vencimiento: <strong>{selectedGarantia.fechaVencimiento}</strong></div>
                  </div>
                </div>
              </div>

              {/* Trabajo Cubierto */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[11px] block">
                  Trabajo cubierto por la garantía
                </span>
                <div className="p-3.5 bg-white border border-[#DDE4E8] rounded-xl leading-relaxed text-[#231F20] font-medium">
                  {selectedGarantia.trabajoCubierto}
                </div>
              </div>

              {/* Apartado desplegable: Condiciones o alcance */}
              <div className="border border-[#DDE4E8] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCondicionesAccordion(!openCondicionesAccordion)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-semibold text-slate-800 text-xs transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Condiciones y alcance de cobertura</span>
                  </div>
                  {openCondicionesAccordion ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {openCondicionesAccordion && (
                  <div className="p-4 bg-white border-t border-slate-200 text-slate-600 text-xs leading-relaxed space-y-2">
                    <p>{selectedGarantia.condiciones}</p>
                  </div>
                )}
              </div>

              {/* Si está aplicada: detalles de reingreso */}
              {selectedGarantia.estado === 'Aplicada' && selectedGarantia.aplicacion && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span>Garantía aplicada — Orden generada: {selectedGarantia.aplicacion.nuevaOrdenFolio}</span>
                  </div>
                  <div className="text-blue-800 leading-relaxed">
                    <strong>Motivo del regreso:</strong> {selectedGarantia.aplicacion.motivoRegreso}
                  </div>
                  {selectedGarantia.aplicacion.observaciones && (
                    <div className="text-blue-700 text-[11px]">
                      <strong>Observaciones:</strong> {selectedGarantia.aplicacion.observaciones}
                    </div>
                  )}
                  <div className="text-[10px] text-blue-600">
                    Fecha de trámite: {selectedGarantia.aplicacion.fecha}
                  </div>
                </div>
              )}

              {/* Si está cancelada: detalle */}
              {selectedGarantia.estado === 'Cancelada' && selectedGarantia.cancelacion && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Póliza cancelada</span>
                  </div>
                  <p><strong>Motivo:</strong> {selectedGarantia.cancelacion.motivo}</p>
                  <p className="text-[10px] text-rose-700">
                    Fecha de cancelación: {selectedGarantia.cancelacion.fechaCancelacion}
                  </p>
                </div>
              )}

              {/* Apartado desplegable: Observaciones del personal técnico / mecánico */}
              <div className="border border-slate-200 rounded-xl overflow-hidden no-print">
                <button
                  type="button"
                  onClick={() => setOpenObservacionesAccordion(!openObservacionesAccordion)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left font-semibold text-slate-800 text-xs transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>Notas y observaciones técnicas</span>
                    {selectedGarantia.observacionesMecanico && selectedGarantia.observacionesMecanico.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                        {selectedGarantia.observacionesMecanico.length}
                      </span>
                    )}
                  </div>
                  {openObservacionesAccordion ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {openObservacionesAccordion && (
                  <div className="p-4 bg-white border-t border-[#DDE4E8] space-y-3">
                    {selectedGarantia.observacionesMecanico && selectedGarantia.observacionesMecanico.length > 0 ? (
                      <div className="space-y-2">
                        {selectedGarantia.observacionesMecanico.map((obs) => (
                          <div
                            key={obs.id}
                            className="p-2.5 bg-slate-50 rounded-lg border border-[#DDE4E8] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-bold text-[#231F20]">{obs.mecanicoNombre}</span>
                              <span>{obs.fechaHora}</span>
                            </div>
                            <p className="text-[#5F6B73]">{obs.texto}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No hay observaciones técnicas registradas aún.
                      </p>
                    )}

                    {/* Input form for adding observation */}
                    <form onSubmit={handleAddObs} className="flex gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        value={obsInput}
                        onChange={(e) => setObsInput(e.target.value)}
                        placeholder="Escribir nota u observación técnica sobre la garantía..."
                        className="flex-1 px-3 py-1.5 border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                      />
                      <button
                        type="submit"
                        disabled={!obsInput.trim()}
                        className="px-3.5 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Añadir</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Obligatory Disclaimer for Document & Print */}
              <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200 text-center text-[11px] text-slate-500 italic">
                “Documento de demostración. La cobertura definitiva depende de las políticas del taller.”
              </div>
            </div>

            {/* Modal Actions Footer (Hidden on Print) */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                {/* Solicitar aplicación button: only if effective status is Vigente */}
                {getEstadoGarantiaEfectivo(selectedGarantia, todayStr) === 'Vigente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setApplyMotivo('');
                      setApplyObs('');
                      setApplyFecha(todayStr);
                      setApplyConfirmed(false);
                      setApplyError(null);
                      setIsApplyModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Solicitar aplicación</span>
                  </button>
                )}

                {/* Cancelar garantía button: only for Admin / Recepción and if Vigente */}
                {!isMecanico && getEstadoGarantiaEfectivo(selectedGarantia, todayStr) === 'Vigente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelMotivo('');
                      setCancelError(null);
                      setIsCancelModalOpen(true);
                    }}
                    className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar póliza
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={detailModalDismiss.handleClose}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SOLICITAR APLICACIÓN DE GARANTÍA */}
      {/* ========================================================================= */}
      {isApplyModalOpen && selectedGarantia && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in fade-in"
          onClick={applyModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8 border border-[#DDE4E8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#231F20]">
                  Aplicar garantía {selectedGarantia.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={applyModalDismiss.handleClose}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                <p className="font-bold">Generación de orden de trabajo de garantía</p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Al confirmar se creará automáticamente una nueva orden en estado <strong>Pendiente</strong> con folio nuevo, vinculada al cliente <strong>{selectedGarantia.clienteNombre}</strong> y vehículo <strong>{selectedGarantia.vehiculoPlacas}</strong>. No se copiarán importes ni se descontará inventario.
                </p>
              </div>

              {applyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  {applyError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo del regreso / Falla reportada <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={applyMotivo}
                  onChange={(e) => {
                    setApplyMotivo(e.target.value);
                    if (applyError) setApplyError(null);
                  }}
                  placeholder="Ej. El cliente reporta ruido persistente en horquilla derecha..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={applyObs}
                  onChange={(e) => setApplyObs(e.target.value)}
                  placeholder="Detalles sobre las condiciones de recepción o revisión preliminar..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha de ingreso por garantía <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={applyFecha}
                  onChange={(e) => setApplyFecha(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyConfirmed}
                    onChange={(e) => {
                      setApplyConfirmed(e.target.checked);
                      if (applyError) setApplyError(null);
                    }}
                    className="w-4 h-4 text-[#1D7EAE] rounded mt-0.5"
                  />
                  <span className="text-slate-700 font-medium">
                    Confirmo la aplicación de esta garantía y la creación de la nueva orden de servicio de reingreso.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={applyModalDismiss.handleClose}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isApplyingProcessing || !applyConfirmed}
                  onClick={handleConfirmAplicar}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isApplyingProcessing ? 'Generando orden...' : 'Confirmar y generar orden'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCELAR GARANTÍA */}
      {/* ========================================================================= */}
      {isCancelModalOpen && selectedGarantia && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in fade-in"
          onClick={cancelModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden my-8 border border-[#DDE4E8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#231F20]">Cancelar garantía</h3>
              </div>
              <button
                type="button"
                onClick={cancelModalDismiss.handleClose}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Vas a cancelar la póliza <strong>{selectedGarantia.folio}</strong> del cliente{' '}
                <strong>{selectedGarantia.clienteNombre}</strong>.
              </p>

              {cancelError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 font-medium">
                  {cancelError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo de la cancelación <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelMotivo}
                  onChange={(e) => {
                    setCancelMotivo(e.target.value);
                    if (cancelError) setCancelError(null);
                  }}
                  placeholder="Ej. Pérdida total del vehículo, solicitud del cliente, violación de condiciones..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cancelModalDismiss.handleClose}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelar}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NUEVA GARANTÍA */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8 border border-[#DDE4E8]">
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">Registrar póliza de garantía</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreateGarantia} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  {createError}
                </div>
              )}

              {/* Orden entregada selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Orden de trabajo entregada relacionada <span className="text-red-500">*</span>
                </label>
                {ordenesEntregadas.length > 0 ? (
                  <select
                    value={createOrdenId}
                    onChange={(e) => handleSelectCreateOrder(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  >
                    {ordenesEntregadas.map((ord) => {
                      const cli = clientes.find((c) => c.id === ord.clienteId);
                      const veh = vehiculos.find((v) => v.id === ord.vehiculoId);
                      return (
                        <option key={ord.id} value={ord.id}>
                          {ord.folio} — {cli?.nombre || 'Cliente'} — {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo'}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    No hay órdenes entregadas pendientes de póliza de garantía. Entrega un vehículo primero en Órdenes de trabajo.
                  </div>
                )}
              </div>

              {/* Trabajo cubierto */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trabajo cubierto por la garantía <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={createTrabajo}
                  onChange={(e) => setCreateTrabajo(e.target.value)}
                  placeholder="Detalle del servicio, partes reparadas o refacciones amparadas..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Se almacena una copia estática para que cambios posteriores en la orden no modifiquen la cobertura de esta garantía.
                </p>
              </div>

              {/* Vigencia: Fecha inicio y duración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha de inicio de garantía <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createFechaInicio}
                    onChange={(e) => setCreateFechaInicio(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duración de la garantía <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createDuracionDias}
                    onChange={(e) => setCreateDuracionDias(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  >
                    <option value="30">30 días (1 mes)</option>
                    <option value="60">60 días (2 meses)</option>
                    <option value="90">90 días (3 meses estándar)</option>
                    <option value="180">180 días (6 meses)</option>
                    <option value="365">365 días (1 año)</option>
                  </select>
                </div>
              </div>

              {/* Calculated Expiration preview */}
              {calculatedExpiration && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
                  <span>Fecha de vencimiento calculada:</span>
                  <strong className="font-mono text-sm">{calculatedExpiration}</strong>
                </div>
              )}

              {/* Condiciones */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Condiciones o alcance de cobertura
                </label>
                <textarea
                  rows={3}
                  value={createCondiciones}
                  onChange={(e) => setCreateCondiciones(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ordenesEntregadas.length === 0}
                  className="px-5 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Emitir póliza de garantía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
