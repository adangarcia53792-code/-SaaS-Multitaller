import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cliente, Vehiculo, Cotizacion, OrdenTrabajo, ServicioCatalogo, ConfiguracionTaller, Factura, Refaccion } from '../types';
import { TunnoLogo } from './TunnoLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { AnalisisCotizacionModal } from './AnalisisCotizacionModal';
import { ContextualHelp } from './ContextualHelp';
import {
  Search,
  Plus,
  Pencil,
  X,
  Printer,
  CheckCircle,
  XCircle,
  MoreVertical,
  AlertTriangle,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
  Receipt,
  Sparkles,
  Eye,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface CotizacionesSectionProps {
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  configuracion?: ConfiguracionTaller;
  facturas?: Factura[];
  refacciones?: Refaccion[];
  onSaveCotizacion: (cot: Cotizacion) => void;
  onUpdateEstado: (id: string, nuevoEstado: 'Aprobada' | 'Rechazada') => void;
  onLinkCotizacionToOrden: (cotizacionId: string, ordenId: string) => void;
  onCreateOrdenFromCotizacion: (cot: Cotizacion) => void;
  onNavigateToOrden?: (ordenId: string) => void;
  onNavigateToFacturacion?: (cotizacionId?: string) => void;
  onOpenCrearCotizacionIA?: () => void;
  onOpenCopiloto?: () => void;
}

type EstadoFilter = 'todas' | 'Por autorizar' | 'Aprobada' | 'Rechazada';

export const CotizacionesSection: React.FC<CotizacionesSectionProps> = ({
  cotizaciones,
  ordenes,
  clientes,
  vehiculos,
  servicios,
  configuracion,
  facturas = [],
  refacciones = [],
  onSaveCotizacion,
  onUpdateEstado,
  onLinkCotizacionToOrden,
  onCreateOrdenFromCotizacion,
  onNavigateToOrden,
  onNavigateToFacturacion,
  onOpenCrearCotizacionIA,
  onOpenCopiloto,
}) => {
  const [filter, setFilter] = useState<EstadoFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para la ventana/panel de Revisión con IA
  const [analizandoCotizacion, setAnalizandoCotizacion] = useState<Cotizacion | null>(null);

  // Floating dropdown menu state per row (Portal)
  const [activeMenu, setActiveMenu] = useState<{
    cotizacion: Cotizacion;
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close floating menu on Escape key, window resize, or outside scroll
  useEffect(() => {
    if (!activeMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setActiveMenu(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeMenu]);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, cot: Cotizacion) => {
    e.stopPropagation();
    if (activeMenu?.cotizacion.id === cot.id) {
      setActiveMenu(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 210;
    const estimatedHeight = cot.estado === 'Por autorizar' ? 145 : cot.estado === 'Aprobada' ? 150 : 100;

    // Prefer aligning right edge of menu to right edge of button
    let left = rect.right - menuWidth;
    if (left < 10) {
      left = 10;
    }
    if (left + menuWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - menuWidth - 10);
    }

    let top = rect.bottom + 6;
    if (top + estimatedHeight > window.innerHeight - 10 && rect.top - estimatedHeight > 10) {
      top = rect.top - estimatedHeight - 6;
    }

    setActiveMenu({
      cotizacion: cot,
      top,
      left,
    });
  };

  // Modal: Add / Edit (3 pasos)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [formClientId, setFormClientId] = useState('');
  const [formVehiculoId, setFormVehiculoId] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formRefacciones, setFormRefacciones] = useState<string>('0');
  const [formManoObra, setFormManoObra] = useState<string>('0');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal: View / Print
  const [printingCotizacion, setPrintingCotizacion] = useState<Cotizacion | null>(null);

  // Modal: Confirm status change
  const [statusConfirm, setStatusConfirm] = useState<{
    cotizacion: Cotizacion;
    action: 'Aprobada' | 'Rechazada';
  } | null>(null);

  // Modal: Crear o vincular orden
  const [linkingCotizacion, setLinkingCotizacion] = useState<Cotizacion | null>(null);
  const [selectedExistingOrdenId, setSelectedExistingOrdenId] = useState<string>('');
  const [isLinkingProcessing, setIsLinkingProcessing] = useState(false);

  // Modal: Ver orden vinculada
  const [viewingLinkedOrden, setViewingLinkedOrden] = useState<OrdenTrabajo | null>(null);

  const initialCotizacionValuesRef = useRef({
    clientId: '',
    vehiculoId: '',
    descripcion: '',
    refacciones: '0',
    manoObra: '0',
  });

  const cotizacionFormDismiss = useModalDismiss({
    isOpen: isFormModalOpen,
    onClose: () => {
      setIsFormModalOpen(false);
      setEditingCotizacion(null);
      setFormStep(1);
      setFormErrors({});
    },
    isDirty: () => {
      const init = initialCotizacionValuesRef.current;
      return (
        formClientId !== init.clientId ||
        formVehiculoId !== init.vehiculoId ||
        formDescripcion.trim() !== init.descripcion.trim() ||
        formRefacciones !== init.refacciones ||
        formManoObra !== init.manoObra
      );
    },
    closeOnBackdrop: true,
  });

  const printingModalDismiss = useModalDismiss({
    isOpen: Boolean(printingCotizacion),
    onClose: () => setPrintingCotizacion(null),
    closeOnBackdrop: true,
  });

  const statusConfirmDismiss = useModalDismiss({
    isOpen: Boolean(statusConfirm),
    onClose: () => setStatusConfirm(null),
    closeOnBackdrop: true,
  });

  const linkingModalDismiss = useModalDismiss({
    isOpen: Boolean(linkingCotizacion),
    onClose: () => setLinkingCotizacion(null),
    closeOnBackdrop: true,
  });

  const viewingLinkedOrdenDismiss = useModalDismiss({
    isOpen: Boolean(viewingLinkedOrden),
    onClose: () => setViewingLinkedOrden(null),
    closeOnBackdrop: true,
  });

  // Lookup maps
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

  const ordenMap = useMemo(() => {
    const map = new Map<string, OrdenTrabajo>();
    ordenes.forEach((o) => map.set(o.id, o));
    return map;
  }, [ordenes]);

  const facturaPorCotizacionMap = useMemo(() => {
    const map = new Map<string, Factura>();
    facturas.forEach((f) => {
      if (f.estado !== 'Cancelada') {
        map.set(f.cotizacionId, f);
      }
    });
    return map;
  }, [facturas]);

  // Available vehicles for client in form
  const availableVehicles = useMemo(() => {
    if (!formClientId) return [];
    return vehiculos.filter((v) => v.clienteId === formClientId);
  }, [vehiculos, formClientId]);

  // Cent calculation helper to prevent floating-point decimal errors
  const parseToCents = (valStr: string): number => {
    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  const calculatedTotal = useMemo(() => {
    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    return (refCents + moCents) / 100;
  }, [formRefacciones, formManoObra]);

  // Check if modifying an approved quotation
  const isModifyingApproved = useMemo(() => {
    if (!editingCotizacion || editingCotizacion.estado !== 'Aprobada') return false;
    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    const origRefCents = Math.round(editingCotizacion.importeRefacciones * 100);
    const origMoCents = Math.round(editingCotizacion.importeManoObra * 100);

    const descChanged = formDescripcion.trim() !== editingCotizacion.descripcion.trim();
    const amountsChanged = refCents !== origRefCents || moCents !== origMoCents;
    const clientVehChanged =
      formClientId !== editingCotizacion.clienteId || formVehiculoId !== editingCotizacion.vehiculoId;

    return descChanged || amountsChanged || clientVehChanged;
  }, [editingCotizacion, formDescripcion, formRefacciones, formManoObra, formClientId, formVehiculoId]);

  // Available orders for linking to linkingCotizacion (same vehicle, not delivered, no linked quote yet)
  const availableOrdersForLinking = useMemo(() => {
    if (!linkingCotizacion) return [];
    return ordenes.filter(
      (o) =>
        o.vehiculoId === linkingCotizacion.vehiculoId &&
        !o.entregado &&
        (!o.cotizacionId || o.cotizacionId === linkingCotizacion.id)
    );
  }, [linkingCotizacion, ordenes]);

  // Only active services from catalog
  const activeCatalogServices = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setEditingCotizacion(null);
    setFormStep(1);
    const defClient = clientes[0]?.id || '';
    setFormClientId(defClient);
    const clientVehs = vehiculos.filter((v) => v.clienteId === defClient);
    const defVeh = clientVehs[0]?.id || '';
    setFormVehiculoId(defVeh);
    setSelectedCatalogId('');
    setFormDescripcion('');
    setFormRefacciones('0');
    setFormManoObra('0');
    setFormErrors({});
    initialCotizacionValuesRef.current = {
      clientId: defClient,
      vehiculoId: defVeh,
      descripcion: '',
      refacciones: '0',
      manoObra: '0',
    };
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cot: Cotizacion) => {
    setEditingCotizacion(cot);
    setFormStep(1);
    setFormClientId(cot.clienteId);
    setFormVehiculoId(cot.vehiculoId);
    setSelectedCatalogId('');
    setFormDescripcion(cot.descripcion);
    setFormRefacciones(cot.importeRefacciones.toString());
    setFormManoObra(cot.importeManoObra.toString());
    setFormErrors({});
    setActiveMenu(null);
    initialCotizacionValuesRef.current = {
      clientId: cot.clienteId,
      vehiculoId: cot.vehiculoId,
      descripcion: cot.descripcion,
      refacciones: cot.importeRefacciones.toString(),
      manoObra: cot.importeManoObra.toString(),
    };
    setIsFormModalOpen(true);
  };

  const handleStep1Next = (e: React.MouseEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formClientId) errors.clienteId = 'Debe seleccionar un cliente registrado.';
    if (!formVehiculoId) errors.vehiculoId = 'Debe seleccionar un vehículo.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormStep(2);
  };

  const handleStep2Next = (e: React.MouseEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formDescripcion.trim()) errors.descripcion = 'La descripción del trabajo es obligatoria.';
    const refNum = parseFloat(formRefacciones);
    if (isNaN(refNum) || refNum < 0) {
      errors.refacciones = 'El importe no puede ser negativo.';
    }
    const moNum = parseFloat(formManoObra);
    if (isNaN(moNum) || moNum < 0) {
      errors.manoObra = 'El importe no puede ser negativo.';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormStep(3);
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFormStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : 1));
  };

  const handleSelectCatalogService = (servId: string) => {
    setSelectedCatalogId(servId);
    if (!servId) return;
    const found = servicios.find((s) => s.id === servId);
    if (!found) return;

    const hasExistingData =
      formDescripcion.trim().length > 0 ||
      (parseFloat(formRefacciones) || 0) > 0 ||
      (parseFloat(formManoObra) || 0) > 0;

    if (hasExistingData) {
      const confirmReplace = window.confirm(
        'Ya escribiste datos en la cotización. ¿Deseas sustituirlos con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogId('');
        return;
      }
    }

    setFormDescripcion(
      found.nombre + (found.descripcion ? ': ' + found.descripcion : '')
    );
    setFormRefacciones(found.importeRefacciones.toString());
    setFormManoObra(found.importeManoObra.toString());
    if (formErrors.descripcion) setFormErrors((prev) => ({ ...prev, descripcion: '' }));
    if (formErrors.refacciones) setFormErrors((prev) => ({ ...prev, refacciones: '' }));
    if (formErrors.manoObra) setFormErrors((prev) => ({ ...prev, manoObra: '' }));
  };

  const handleClientChange = (newClientId: string) => {
    setFormClientId(newClientId);
    const clientVehs = vehiculos.filter((v) => v.clienteId === newClientId);
    setFormVehiculoId(clientVehs[0]?.id || '');
    if (formErrors.clienteId) setFormErrors((prev) => ({ ...prev, clienteId: '' }));
  };

  // Form submission
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formClientId) errors.clienteId = 'Debe seleccionar un cliente registrado.';
    if (!formVehiculoId) errors.vehiculoId = 'Debe seleccionar un vehículo.';
    if (!formDescripcion.trim()) errors.descripcion = 'La descripción del trabajo es obligatoria.';

    const refNum = parseFloat(formRefacciones);
    if (isNaN(refNum) || refNum < 0) {
      errors.refacciones = 'El importe no puede ser negativo.';
    }

    const moNum = parseFloat(formManoObra);
    if (isNaN(moNum) || moNum < 0) {
      errors.manoObra = 'El importe no puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    const totalVal = (refCents + moCents) / 100;

    let folio = '';
    let nuevoEstado: 'Por autorizar' | 'Aprobada' | 'Rechazada' = 'Por autorizar';
    let autorizacionActual = editingCotizacion?.autorizacion;
    let historial = editingCotizacion?.historialAutorizaciones || [];

    if (editingCotizacion) {
      folio = editingCotizacion.folio;
      if (editingCotizacion.estado === 'Aprobada' && isModifyingApproved) {
        // If approved and modified, retain old authorization in history and require re-authorization
        if (autorizacionActual) {
          historial = [autorizacionActual, ...historial];
        }
        autorizacionActual = undefined;
        nuevoEstado = 'Por autorizar';
      } else {
        nuevoEstado = editingCotizacion.estado;
      }
    } else {
      const count = cotizaciones.length + 1;
      folio = `COT-${String(count).padStart(3, '0')}`;
      nuevoEstado = 'Por autorizar';
    }

    const savedCot: Cotizacion = {
      id: editingCotizacion
        ? editingCotizacion.id
        : `cot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio,
      clienteId: formClientId,
      vehiculoId: formVehiculoId,
      ordenId: editingCotizacion?.ordenId,
      descripcion: formDescripcion.trim(),
      importeRefacciones: refCents / 100,
      importeManoObra: moCents / 100,
      total: totalVal,
      estado: nuevoEstado,
      autorizacion: autorizacionActual,
      historialAutorizaciones: historial,
      creadoEn: editingCotizacion ? editingCotizacion.creadoEn : new Date().toISOString(),
    };

    onSaveCotizacion(savedCot);
    setIsFormModalOpen(false);
  };

  // Status confirm
  const handleConfirmStatus = () => {
    if (!statusConfirm) return;
    const { cotizacion, action } = statusConfirm;
    onUpdateEstado(cotizacion.id, action);
    setStatusConfirm(null);
    setActiveMenu(null);
  };

  // Open "Crear o vincular orden" modal
  const handleOpenLinkingModal = (cot: Cotizacion) => {
    setLinkingCotizacion(cot);
    const existing = ordenes.filter(
      (o) => o.vehiculoId === cot.vehiculoId && !o.entregado && (!o.cotizacionId || o.cotizacionId === cot.id)
    );
    setSelectedExistingOrdenId(existing[0]?.id || '');
    setIsLinkingProcessing(false);
    setActiveMenu(null);
  };

  // Link existing order
  const handleConfirmLinkExisting = () => {
    if (!linkingCotizacion || !selectedExistingOrdenId || isLinkingProcessing) return;
    setIsLinkingProcessing(true);
    onLinkCotizacionToOrden(linkingCotizacion.id, selectedExistingOrdenId);
    setLinkingCotizacion(null);
    setIsLinkingProcessing(false);
  };

  // Create new order from quote
  const handleConfirmCreateNewOrder = () => {
    if (!linkingCotizacion || isLinkingProcessing) return;
    setIsLinkingProcessing(true);
    onCreateOrdenFromCotizacion(linkingCotizacion);
    setLinkingCotizacion(null);
    setIsLinkingProcessing(false);
  };

  // Aplicar únicamente la descripción sugerida por la IA (conservando importes y partidas)
  const handleApplyDescripcion = (cotizacionId: string, nuevaDescripcion: string) => {
    const cot = cotizaciones.find((c) => c.id === cotizacionId);
    if (!cot) return;
    onSaveCotizacion({
      ...cot,
      descripcion: nuevaDescripcion,
    });
  };

  // Filter & Search
  const filteredCotizaciones = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return cotizaciones.filter((cot) => {
      if (filter !== 'todas' && cot.estado !== filter) {
        return false;
      }
      if (q) {
        const folioMatch = cot.folio.toLowerCase().includes(q);
        const client = clienteMap.get(cot.clienteId);
        const veh = vehiculoMap.get(cot.vehiculoId);
        const clientMatch = client?.nombre.toLowerCase().includes(q);
        const plateMatch = veh?.placas.toLowerCase().includes(q);
        return Boolean(folioMatch || clientMatch || plateMatch);
      }
      return true;
    });
  }, [cotizaciones, filter, searchQuery, clienteMap, vehiculoMap]);

  return (
    <section className="space-y-6">
      {/* Encabezado TUNNO para Cotizaciones */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1497F2]/10 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight">
              Cotizaciones
            </h2>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              Presupuestos y autorizaciones de servicios y refacciones.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenCopiloto && (
            <button
              type="button"
              onClick={onOpenCopiloto}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg bg-sky-50 hover:bg-sky-100/80 text-[#06345A] border border-[#73C7FF]/50 text-xs md:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir Copiloto de Cotizaciones"
            >
              <Sparkles className="w-4 h-4 text-[#1497F2]" />
              <span>Ayudarme con IA</span>
            </button>
          )}

          {onOpenCrearCotizacionIA && (
            <button
              type="button"
              onClick={onOpenCrearCotizacionIA}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg bg-gradient-to-r from-[#06345A] to-[#1497F2] hover:opacity-95 text-white text-xs md:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              title="Crear cotización guiada por IA en 3 propuestas"
            >
              <Sparkles className="w-4 h-4 text-[#73C7FF]" />
              <span>Crear con IA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cotización</span>
          </button>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por folio, cliente o placas..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] placeholder-slate-400 focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'todas'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilter('Por autorizar')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Por autorizar'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Por autorizar
          </button>
          <button
            type="button"
            onClick={() => setFilter('Aprobada')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Aprobada'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setFilter('Rechazada')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Rechazada'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Rechazadas
          </button>
        </div>
      </div>

      {/* Table & Mobile View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5">Folio</th>
                <th className="py-3.5 px-5">Cliente y vehículo</th>
                <th className="py-3.5 px-5">Trabajo solicitado</th>
                <th className="py-3.5 px-5">Total en MXN</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCotizaciones.length > 0 ? (
                filteredCotizaciones.map((cot) => {
                  const client = clienteMap.get(cot.clienteId);
                  const veh = vehiculoMap.get(cot.vehiculoId);
                  const linkedOrden = cot.ordenId
                    ? ordenMap.get(cot.ordenId)
                    : ordenes.find((o) => o.cotizacionId === cot.id);
                  const facturaVinculada = facturaPorCotizacionMap.get(cot.id);

                  return (
                    <tr key={cot.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Folio */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded text-xs border border-purple-200">
                            {cot.folio}
                          </span>
                        </div>
                        {linkedOrden && (
                          <div className="text-[11px] text-amber-700 font-mono mt-1 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-amber-600" />
                            <span>{linkedOrden.folio}</span>
                          </div>
                        )}
                      </td>

                      {/* Cliente y vehículo */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#06345A]">
                          {client ? client.nombre : 'Cliente no encontrado'}
                        </div>
                        <div className="text-xs text-[#6B7280] mt-0.5">
                          {veh ? (
                            <span>
                              {veh.marca} {veh.modelo}{' '}
                              <strong className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px] border border-[#E5E7EB]">
                                {veh.placas}
                              </strong>
                            </span>
                          ) : (
                            'Vehículo no registrado'
                          )}
                        </div>
                      </td>

                      {/* Trabajo solicitado */}
                      <td className="py-3.5 px-5 text-[#06345A] max-w-xs">
                        <span className="line-clamp-2">{cot.descripcion}</span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-semibold text-[#06345A]">
                        ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {cot.estado === 'Por autorizar' && (
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Por autorizar
                          </span>
                        )}
                        {cot.estado === 'Aprobada' && (
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aprobada
                          </span>
                        )}
                        {cot.estado === 'Rechazada' && (
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Rechazada
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Botón visible Ver detalle / imprimir */}
                          <button
                            type="button"
                            onClick={() => setPrintingCotizacion(cot)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-[#06345A] bg-sky-50 hover:bg-sky-100 border border-[#73C7FF]/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={`Ver detalle formal de ${cot.folio}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1497F2]" />
                            <span>Ver</span>
                          </button>

                          {/* Menú de tres puntos (desplegable sobre los demás elementos) */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, cot)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              activeMenu?.cotizacion.id === cot.id
                                ? 'bg-slate-200 text-slate-900'
                                : 'text-[#6B7280] hover:text-[#06345A] hover:bg-slate-100'
                            }`}
                            title="Más opciones"
                            aria-label={`Más opciones para ${cot.folio}`}
                            aria-haspopup="menu"
                            aria-expanded={activeMenu?.cotizacion.id === cot.id}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron cotizaciones que coincidan con la búsqueda.'
                      : filter !== 'todas'
                      ? `No hay cotizaciones con estado "${filter}".`
                      : 'No hay cotizaciones registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Block View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredCotizaciones.length > 0 ? (
            filteredCotizaciones.map((cot) => {
              const client = clienteMap.get(cot.clienteId);
              const veh = vehiculoMap.get(cot.vehiculoId);
              const linkedOrden = cot.ordenId
                ? ordenMap.get(cot.ordenId)
                : ordenes.find((o) => o.cotizacionId === cot.id);
              const facturaVinculada = facturaPorCotizacionMap.get(cot.id);

              return (
                <div key={cot.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-200">
                          {cot.folio}
                        </span>
                        {cot.estado === 'Por autorizar' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Por autorizar
                          </span>
                        )}
                        {cot.estado === 'Aprobada' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aprobada
                          </span>
                        )}
                        {cot.estado === 'Rechazada' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Rechazada
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-[#06345A] text-sm">{client?.nombre || 'Cliente no encontrado'}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo no registrado'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cot.descripcion}</p>
                      <p className="text-sm font-bold text-[#06345A] mt-1.5">
                        ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                      </p>
                      {linkedOrden && (
                        <p className="text-xs text-amber-700 font-mono flex items-center gap-1 mt-1">
                          <LinkIcon className="w-3 h-3 text-amber-600" />
                          <span>Orden vinculada: {linkedOrden.folio}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {/* Botón Revisar con IA */}
                      <button
                        type="button"
                        onClick={() => setAnalizandoCotizacion(cot)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-xs"
                        title={`Revisar cotización ${cot.folio} con IA`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Revisar con IA</span>
                      </button>

                      {cot.estado === 'Aprobada' && (
                        <button
                          type="button"
                          onClick={() => onNavigateToFacturacion?.(cot.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs ${
                            facturaVinculada
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#1497F2] hover:bg-[#06345A] text-white'
                          }`}
                          title={
                            facturaVinculada
                              ? `Factura emitida ${facturaVinculada.folio}. Clic para ver comprobante.`
                              : `Generar comprobante administrativo para ${cot.folio}`
                          }
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{facturaVinculada ? `Factura ${facturaVinculada.folio}` : 'Generar factura'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cot)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[40px] text-xs font-semibold text-[#06345A] bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Botón trigger para menú de tres puntos móvil (Portal) */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleMenu(e, cot)}
                        className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${
                          activeMenu?.cotizacion.id === cot.id
                            ? 'bg-slate-200 text-slate-900'
                            : 'text-[#6B7280] hover:text-[#06345A] hover:bg-slate-100'
                        }`}
                        title="Más opciones"
                        aria-label={`Más opciones para ${cot.folio}`}
                        aria-haspopup="menu"
                        aria-expanded={activeMenu?.cotizacion.id === cot.id}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              {searchQuery
                ? 'No se encontraron cotizaciones que coincidan con la búsqueda.'
                : filter !== 'todas'
                ? `No hay cotizaciones con estado "${filter}".`
                : 'No hay cotizaciones registradas.'}
            </div>
          )}
        </div>
      </div>

      {/* PORTAL: MENÚ FLOTANTE DE OPCIONES (RENDERIZADO DIRECTAMENTE EN BODY) */}
      {activeMenu && typeof document !== 'undefined' && createPortal(
        <>
          {/* Overlay invisible para cerrar al hacer clic fuera */}
          <div
            className="fixed inset-0 z-[9990] bg-transparent cursor-default"
            onClick={() => setActiveMenu(null)}
            aria-hidden="true"
          />

          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${activeMenu.top}px`,
              left: `${activeMenu.left}px`,
            }}
            className="z-[9999] w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
          >
            {(() => {
              const cot = activeMenu.cotizacion;
              const linkedOrden = cot.ordenId
                ? ordenMap.get(cot.ordenId)
                : ordenes.find((o) => o.cotizacionId === cot.id);
              const facturaVinculada = facturaPorCotizacionMap.get(cot.id);

              return (
                <>
                  {/* Opción destacada Revisar con IA */}
                  <div className="py-1 bg-purple-50/50">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAnalizandoCotizacion(cot);
                        setActiveMenu(null);
                      }}
                      className="w-full px-3.5 py-2 text-purple-700 hover:bg-purple-100/60 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Revisar con IA</span>
                    </button>
                  </div>

                  {/* Acciones principales: Ver/imprimir y Editar */}
                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setPrintingCotizacion(cot);
                        setActiveMenu(null);
                      }}
                      className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Ver / imprimir</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleOpenEdit(cot);
                        setActiveMenu(null);
                      }}
                      className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                      <span>Editar cotización</span>
                    </button>
                  </div>

                  {/* Si la cotización está "Por autorizar": opciones Aprobar y Rechazar */}
                  {cot.estado === 'Por autorizar' && (
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        data-tour="cotizaciones-aprobar-btn"
                        onClick={() => {
                          setStatusConfirm({ cotizacion: cot, action: 'Aprobada' });
                          setActiveMenu(null);
                        }}
                        className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold">Aprobar</span>
                        </div>
                        <ContextualHelp tema="aprobar-cotizacion" />
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setStatusConfirm({ cotizacion: cot, action: 'Rechazada' });
                          setActiveMenu(null);
                        }}
                        className="w-full px-3.5 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}

                  {/* Si la cotización está "Aprobada": orden y facturación */}
                  {cot.estado === 'Aprobada' && (
                    <div className="py-1">
                      {linkedOrden ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setViewingLinkedOrden(linkedOrden);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3.5 py-2 text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                          <span>Ver orden ({linkedOrden.folio})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            handleOpenLinkingModal(cot);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3.5 py-2 text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LinkIcon className="w-4 h-4 text-purple-600" />
                          <span>Crear o vincular orden</span>
                        </button>
                      )}

                      {onNavigateToFacturacion && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onNavigateToFacturacion(cot.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3.5 py-2 text-[#1497F2] hover:bg-sky-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-4 h-4 text-[#1497F2]" />
                          <span>{facturaVinculada ? `Ver factura (${facturaVinculada.folio})` : 'Generar factura'}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Si la cotización está "Rechazada": opción para aprobar/reactivar */}
                  {cot.estado === 'Rechazada' && (
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setStatusConfirm({ cotizacion: cot, action: 'Aprobada' });
                          setActiveMenu(null);
                        }}
                        className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Aprobar cotización</span>
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* MODAL: CREAR O VINCULAR ORDEN (ETAPA 7) */}
      {linkingCotizacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={linkingModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Vincular con orden de trabajo
                </h3>
                <p className="text-xs text-slate-500">
                  Cotización {linkingCotizacion.folio} ({vehiculoMap.get(linkingCotizacion.vehiculoId)?.placas})
                </p>
              </div>
              <button
                type="button"
                onClick={linkingModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <p className="text-slate-600 text-xs sm:text-sm">
                Esta cotización está aprobada. Puedes asociarla a una orden existente de este mismo vehículo o generar una orden nueva directamente.
              </p>

              {/* Opción 1: Vincular a orden existente */}
              <div className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Opción A: Vincular a orden existente
                </h4>

                {availableOrdersForLinking.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={selectedExistingOrdenId}
                      onChange={(e) => setSelectedExistingOrdenId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
                    >
                      {availableOrdersForLinking.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          {ord.folio} — {ord.servicio} ({ord.estado})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedExistingOrdenId || isLinkingProcessing}
                      onClick={handleConfirmLinkExisting}
                      className="w-full px-4 py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Vincular a la orden seleccionada
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No hay órdenes abiertas ni disponibles para este vehículo. Puedes crear una nueva abajo.
                  </p>
                )}
              </div>

              {/* Opción 2: Crear nueva orden */}
              <div className="p-4 border border-[#E5E7EB] rounded-lg space-y-3 bg-slate-50/50">
                <h4 className="font-semibold text-[#06345A] text-xs uppercase tracking-wider">
                  Opción B: Crear nueva orden de trabajo
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Crea una nueva orden con el cliente, vehículo y trabajo de la cotización, asignándole folio único y estado "Pendiente".
                </p>
                <button
                  type="button"
                  disabled={isLinkingProcessing}
                  onClick={handleConfirmCreateNewOrder}
                  className="w-full px-4 py-2.5 min-h-[42px] border border-[#1497F2] text-[#1497F2] hover:bg-rose-50 disabled:opacity-50 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Crear nueva orden y vincular
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={linkingModalDismiss.handleClose}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE DE ORDEN VINCULADA */}
      {viewingLinkedOrden && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={viewingLinkedOrdenDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Orden vinculada: {viewingLinkedOrden.folio}
                </h3>
                <span className="text-xs text-purple-700 font-semibold">
                  Estado: {viewingLinkedOrden.estado}
                </span>
              </div>
              <button
                type="button"
                onClick={viewingLinkedOrdenDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-700 bg-slate-50 p-4 rounded-lg border border-[#E5E7EB]">
              <p>
                <span className="text-slate-400 font-medium">Trabajo:</span> {viewingLinkedOrden.servicio}
              </p>
              {viewingLinkedOrden.kilometraje && (
                <p>
                  <span className="text-slate-400 font-medium">Kilometraje:</span> {viewingLinkedOrden.kilometraje}
                </p>
              )}
              {viewingLinkedOrden.entregado && (
                <p className="text-emerald-700 font-semibold">
                  Vehículo entregado: {viewingLinkedOrden.fechaHoraEntrega}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={viewingLinkedOrdenDismiss.handleClose}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
              {onNavigateToOrden && (
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingLinkedOrden.id;
                    setViewingLinkedOrden(null);
                    onNavigateToOrden(id);
                  }}
                  className="px-4 py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Ir a la sección Órdenes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORMULARIO AGREGAR / EDITAR */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={cotizacionFormDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCotizacion ? `Editar cotización (${editingCotizacion.folio})` : 'Nueva cotización'}
                </h3>
                {editingCotizacion && (
                  <p className="text-xs text-slate-500">Folio asignado: {editingCotizacion.folio}</p>
                )}
              </div>
              <button
                type="button"
                onClick={cotizacionFormDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INDICADOR DE PASOS (1. DATOS PRINCIPALES, 2. SERVICIO Y COSTOS, 3. REVISIÓN Y CONFIRMACIÓN) */}
            <div className="px-6 pt-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className={formStep === 1 ? 'text-[#1497F2] font-bold' : formStep > 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  1. Datos principales
                </span>
                <span className="text-slate-300">→</span>
                <span className={formStep === 2 ? 'text-[#1497F2] font-bold' : formStep > 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  2. Servicio y costos
                </span>
                <span className="text-slate-300">→</span>
                <span className={formStep === 3 ? 'text-[#1497F2] font-bold' : 'text-slate-400'}>
                  3. Revisión
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1497F2] h-full transition-all duration-300 ease-out"
                  style={{ width: formStep === 1 ? '33.3%' : formStep === 2 ? '66.6%' : '100%' }}
                />
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {isModifyingApproved && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> Esta cotización se encuentra aprobada. Si modificas los datos o importes,
                    necesitará autorización nuevamente y cambiará su estado a <strong>"Por autorizar"</strong> al guardar.
                  </span>
                </div>
              )}

              {/* ============================================================== */}
              {/* PASO 1: DATOS PRINCIPALES (CLIENTE Y VEHÍCULO)                 */}
              {/* ============================================================== */}
              {formStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Cliente */}
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

                  {/* Vehículo */}
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

                  {/* Botones Paso 1 */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={cotizacionFormDismiss.handleClose}
                      className="px-4 py-2.5 min-h-[42px] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleStep1Next}
                      disabled={clientes.length === 0 || availableVehicles.length === 0}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Siguiente: Servicio y costos</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PASO 2: SERVICIO Y COSTOS                                      */}
              {/* ============================================================== */}
              {formStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Apartado desplegable opcional: Servicio del catálogo */}
                  <details className="group pt-1" open={Boolean(selectedCatalogId)}>
                    <summary className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium flex items-center justify-between py-1 select-none">
                      <span>Datos opcionales (autocompletar con catálogo de servicios)</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="pt-2">
                      <select
                        value={selectedCatalogId}
                        onChange={(e) => handleSelectCatalogService(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
                      >
                        <option value="">Seleccionar del catálogo o capturar abajo...</option>
                        {activeCatalogServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (${s.total.toFixed(2)} MXN)
                          </option>
                        ))}
                      </select>
                    </div>
                  </details>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descripción del trabajo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formDescripcion}
                      onChange={(e) => {
                        setFormDescripcion(e.target.value);
                        if (formErrors.descripcion) setFormErrors((prev) => ({ ...prev, descripcion: '' }));
                      }}
                      placeholder="Detalle de trabajos y refacciones solicitados..."
                      className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] placeholder-slate-400 focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                        formErrors.descripcion ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {formErrors.descripcion && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.descripcion}</p>
                    )}
                  </div>

                  {/* Desglose de importes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Importe de refacciones ($ MXN)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formRefacciones}
                        onChange={(e) => {
                          setFormRefacciones(e.target.value);
                          if (formErrors.refacciones) setFormErrors((prev) => ({ ...prev, refacciones: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                          formErrors.refacciones ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                        }`}
                      />
                      {formErrors.refacciones && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.refacciones}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Importe de mano de obra ($ MXN)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formManoObra}
                        onChange={(e) => {
                          setFormManoObra(e.target.value);
                          if (formErrors.manoObra) setFormErrors((prev) => ({ ...prev, manoObra: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                          formErrors.manoObra ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                        }`}
                      />
                      {formErrors.manoObra && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.manoObra}</p>
                      )}
                    </div>
                  </div>

                  {/* Total display */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-[#E5E7EB] flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">Total calculado:</span>
                    <span className="text-lg font-bold text-[#1497F2]">
                      ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>

                  {/* Botones Paso 2 */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Next}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Siguiente: Revisar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PASO 3: REVISIÓN Y CONFIRMACIÓN                                */}
              {/* ============================================================== */}
              {formStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {(() => {
                    const client = clientes.find((c) => c.id === formClientId);
                    const veh = vehiculos.find((v) => v.id === formVehiculoId);
                    return (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="font-semibold text-[#06345A] uppercase tracking-wider text-[11px]">
                            Resumen de la propuesta
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Por autorizar
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400 font-medium block">Cliente:</span>
                            <span className="font-semibold text-[#06345A] text-sm">{client?.nombre || 'No asignado'}</span>
                            <span className="text-slate-500 block text-[11px]">{client?.telefono}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Vehículo:</span>
                            <span className="font-semibold text-[#06345A] text-sm">
                              {veh ? `${veh.marca} ${veh.modelo}` : 'No asignado'}
                            </span>
                            <span className="font-mono text-slate-500 block text-[11px]">{veh?.placas}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium block">Trabajo solicitado:</span>
                          <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 whitespace-pre-line">
                            {formDescripcion || 'Sin descripción'}
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Refacciones:</span>
                            <span className="font-mono">${parseFloat(formRefacciones || '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Mano de obra:</span>
                            <span className="font-mono">${parseFloat(formManoObra || '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-[#06345A] pt-1.5 border-t border-slate-100">
                            <span>Total estimado:</span>
                            <span className="text-[#1497F2] font-mono">${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Botones Paso 3 */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Modificar datos</span>
                    </button>
                    <button
                      type="submit"
                      disabled={clientes.length === 0 || availableVehicles.length === 0}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar y guardar</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR CAMBIO DE ESTADO (APROBAR / RECHAZAR) */}
      {statusConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print"
          onClick={statusConfirmDismiss.handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-confirm-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              {statusConfirm.action === 'Aprobada' ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 id="status-confirm-modal-title" className="text-lg font-bold text-slate-900 leading-tight">
                  ¿{statusConfirm.action === 'Aprobada' ? 'Aprobar' : 'Rechazar'} cotización?
                </h3>
                <p className="text-xs font-mono text-purple-700 font-semibold mt-0.5">
                  {statusConfirm.cotizacion.folio}
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-2">
              <p>
                ¿Deseas marcar la cotización{' '}
                <strong className="text-slate-900 font-semibold">{statusConfirm.cotizacion.folio}</strong> como{' '}
                <strong className={statusConfirm.action === 'Aprobada' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {statusConfirm.action}
                </strong>
                ?
              </p>
              {statusConfirm.action === 'Aprobada' && (
                <p className="text-xs text-slate-500 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5">
                  Al confirmarla, la cotización quedará aprobada y podrás generar inmediatamente su factura en la columna Acciones o vincular una orden de trabajo.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={statusConfirmDismiss.handleClose}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                className={`px-4 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                  statusConfirm.action === 'Aprobada'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {statusConfirm.action === 'Aprobada' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VISTA DE IMPRESIÓN (VER / IMPRIMIR) */}
      {printingCotizacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
          onClick={printingModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 print-area">
            <div className="no-print bg-white border-b border-[#E5E7EB] text-[#06345A] px-6 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Vista previa de cotización</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnalizandoCotizacion(printingCotizacion)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Revisar cotización con Inteligencia Artificial"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Revisar con IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={printingModalDismiss.handleClose}
                  className="p-1.5 text-slate-400 hover:text-[#06345A] rounded transition-colors cursor-pointer"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-10 bg-white text-slate-800 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <div className="mb-2.5">
                    <TunnoLogo variant="positive" format="horizontal" size="sm" />
                  </div>
                  <h1 className="text-xl font-bold font-heading text-[#06345A] tracking-tight">
                    {configuracion?.nombre || 'TUNNO'}
                  </h1>
                  {configuracion?.telefono && (
                    <p className="text-xs text-slate-500">Tel: {configuracion.telefono}</p>
                  )}
                  {configuracion?.direccion && (
                    <p className="text-xs text-slate-500">{configuracion.direccion}</p>
                  )}
                  <p className="text-xs uppercase tracking-widest text-[#1497F2] font-heading font-semibold mt-1">
                    Documento de cotización
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Folio de cotización</div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {printingCotizacion.folio}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha:{' '}
                    {new Date(printingCotizacion.creadoEn).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                        printingCotizacion.estado === 'Aprobada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : printingCotizacion.estado === 'Rechazada'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Estado: {printingCotizacion.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Datos del cliente
                  </h4>
                  {(() => {
                    const c = clienteMap.get(printingCotizacion.clienteId);
                    return c ? (
                      <div className="space-y-0.5 text-slate-800">
                        <p className="font-semibold text-slate-900">{c.nombre}</p>
                        <p className="text-xs text-slate-600">Tel: {c.telefono}</p>
                        {c.correo && <p className="text-xs text-slate-600">{c.correo}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Cliente no encontrado</p>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Datos del vehículo
                  </h4>
                  {(() => {
                    const v = vehiculoMap.get(printingCotizacion.vehiculoId);
                    return v ? (
                      <div className="space-y-0.5 text-slate-800">
                        <p className="font-semibold text-slate-900">
                          {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''}
                        </p>
                        <p className="text-xs text-slate-600">
                          Placas:{' '}
                          <strong className="font-mono bg-white px-1.5 py-0.5 border rounded">
                            {v.placas}
                          </strong>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Vehículo no encontrado</p>
                    );
                  })()}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Descripción del trabajo solicitado
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {printingCotizacion.descripcion}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Desglose de costos
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <div className="flex justify-between py-2.5 px-4 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-600">Importe de refacciones</span>
                    <span className="font-semibold text-slate-800">
                      ${printingCotizacion.importeRefacciones.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 px-4 bg-white border-b border-slate-200">
                    <span className="text-slate-600">Importe de mano de obra</span>
                    <span className="font-semibold text-slate-800">
                      ${printingCotizacion.importeManoObra.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                  <div className="flex justify-between py-3.5 px-4 bg-purple-50/50">
                    <span className="font-bold text-slate-900 text-base">Total estimado</span>
                    <span className="font-bold text-xl text-purple-700">
                      ${printingCotizacion.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </div>
              </div>

              {/* Autorización info if exists */}
              {printingCotizacion.autorizacion && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold">Autorización registrada:</span>
                  <p>Autorizado por: <strong>{printingCotizacion.autorizacion.autorizadoPor}</strong> el {printingCotizacion.autorizacion.fechaHora}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <p>Este documento es una estimación de servicios expedida por {configuracion?.nombre || 'TUNNO'}.</p>
                <p className="text-[10px] font-heading font-semibold text-[#06345A] tracking-wider">
                  Organiza · Controla · Haz crecer
                </p>
              </div>
            </div>

            <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end gap-3">
              <button
                type="button"
                onClick={printingModalDismiss.handleClose}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors min-h-[38px] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir cotización</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / PANEL DE REVISIÓN CON IA */}
      {analizandoCotizacion && (
        <AnalisisCotizacionModal
          cotizacion={analizandoCotizacion}
          cliente={clienteMap.get(analizandoCotizacion.clienteId)}
          vehiculo={vehiculoMap.get(analizandoCotizacion.vehiculoId)}
          servicios={servicios}
          refacciones={refacciones}
          configuracion={configuracion}
          onClose={() => setAnalizandoCotizacion(null)}
          onApplyDescripcion={handleApplyDescripcion}
        />
      )}
    </section>
  );
};
