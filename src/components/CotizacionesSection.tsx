import React, { useState, useMemo } from 'react';
import { Cliente, Vehiculo, Cotizacion, OrdenTrabajo, ServicioCatalogo, ConfiguracionTaller } from '../types';
import { IotLogo } from './IotLogo';
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
} from 'lucide-react';

interface CotizacionesSectionProps {
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  configuracion?: ConfiguracionTaller;
  onSaveCotizacion: (cot: Cotizacion) => void;
  onUpdateEstado: (id: string, nuevoEstado: 'Aprobada' | 'Rechazada') => void;
  onLinkCotizacionToOrden: (cotizacionId: string, ordenId: string) => void;
  onCreateOrdenFromCotizacion: (cot: Cotizacion) => void;
  onNavigateToOrden?: (ordenId: string) => void;
}

type EstadoFilter = 'todas' | 'Por autorizar' | 'Aprobada' | 'Rechazada';

export const CotizacionesSection: React.FC<CotizacionesSectionProps> = ({
  cotizaciones,
  ordenes,
  clientes,
  vehiculos,
  servicios,
  configuracion,
  onSaveCotizacion,
  onUpdateEstado,
  onLinkCotizacionToOrden,
  onCreateOrdenFromCotizacion,
  onNavigateToOrden,
}) => {
  const [filter, setFilter] = useState<EstadoFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown menu state per row
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal: Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);

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
    const defClient = clientes[0]?.id || '';
    setFormClientId(defClient);
    const clientVehs = vehiculos.filter((v) => v.clienteId === defClient);
    setFormVehiculoId(clientVehs[0]?.id || '');
    setSelectedCatalogId('');
    setFormDescripcion('');
    setFormRefacciones('0');
    setFormManoObra('0');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cot: Cotizacion) => {
    setEditingCotizacion(cot);
    setFormClientId(cot.clienteId);
    setFormVehiculoId(cot.vehiculoId);
    setSelectedCatalogId('');
    setFormDescripcion(cot.descripcion);
    setFormRefacciones(cot.importeRefacciones.toString());
    setFormManoObra(cot.importeManoObra.toString());
    setFormErrors({});
    setOpenMenuId(null);
    setIsFormModalOpen(true);
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
    onUpdateEstado(statusConfirm.cotizacion.id, statusConfirm.action);
    setStatusConfirm(null);
  };

  // Open "Crear o vincular orden" modal
  const handleOpenLinkingModal = (cot: Cotizacion) => {
    setLinkingCotizacion(cot);
    const existing = ordenes.filter(
      (o) => o.vehiculoId === cot.vehiculoId && !o.entregado && (!o.cotizacionId || o.cotizacionId === cot.id)
    );
    setSelectedExistingOrdenId(existing[0]?.id || '');
    setIsLinkingProcessing(false);
    setOpenMenuId(null);
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
      {/* Encabezado IOT Technologies para Cotizaciones */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Cotizaciones
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Presupuestos y autorizaciones de servicios y refacciones.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]"
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-[#DDE4E8] bg-white p-1 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'todas'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilter('Por autorizar')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Por autorizar'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Por autorizar
          </button>
          <button
            type="button"
            onClick={() => setFilter('Aprobada')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Aprobada'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setFilter('Rechazada')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Rechazada'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
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
                  const isMenuOpen = openMenuId === cot.id;
                  const linkedOrden = cot.ordenId
                    ? ordenMap.get(cot.ordenId)
                    : ordenes.find((o) => o.cotizacionId === cot.id);

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
                        <div className="font-medium text-[#231F20]">
                          {client ? client.nombre : 'Cliente no encontrado'}
                        </div>
                        <div className="text-xs text-[#5F6B73] mt-0.5">
                          {veh ? (
                            <span>
                              {veh.marca} {veh.modelo}{' '}
                              <strong className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px] border border-[#DDE4E8]">
                                {veh.placas}
                              </strong>
                            </span>
                          ) : (
                            'Vehículo no registrado'
                          )}
                        </div>
                      </td>

                      {/* Trabajo solicitado */}
                      <td className="py-3.5 px-5 text-[#231F20] max-w-xs">
                        <span className="line-clamp-2">{cot.descripcion}</span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-semibold text-[#231F20]">
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
                      <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cot)}
                            className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] text-xs font-medium text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer shadow-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {/* Más opciones dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : cot.id)}
                              className="p-2 text-[#5F6B73] hover:text-[#231F20] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                  {/* For approved quotes: Crear o vincular orden / Ver orden */}
                                  {cot.estado === 'Aprobada' && (
                                    <>
                                      {linkedOrden ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setViewingLinkedOrden(linkedOrden);
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full px-3 py-2 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          <span>Ver orden</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenLinkingModal(cot)}
                                          className="w-full px-3 py-2 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                        >
                                          <LinkIcon className="w-4 h-4" />
                                          <span>Crear o vincular orden</span>
                                        </button>
                                      )}
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrintingCotizacion(cot);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span>Ver / imprimir</span>
                                  </button>

                                  {cot.estado !== 'Aprobada' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusConfirm({ cotizacion: cot, action: 'Aprobada' });
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                                      <span>Aprobar</span>
                                    </button>
                                  )}

                                  {cot.estado !== 'Rechazada' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusConfirm({ cotizacion: cot, action: 'Rechazada' });
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4 text-rose-600" />
                                      <span>Rechazar</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
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
              const isMenuOpen = openMenuId === cot.id;
              const linkedOrden = cot.ordenId
                ? ordenMap.get(cot.ordenId)
                : ordenes.find((o) => o.cotizacionId === cot.id);

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
                      <p className="font-medium text-[#231F20] text-sm">{client?.nombre || 'Cliente no encontrado'}</p>
                      <p className="text-xs text-[#5F6B73] mt-0.5">
                        {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo no registrado'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cot.descripcion}</p>
                      <p className="text-sm font-bold text-[#231F20] mt-1.5">
                        ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                      </p>
                      {linkedOrden && (
                        <p className="text-xs text-amber-700 font-mono flex items-center gap-1 mt-1">
                          <LinkIcon className="w-3 h-3 text-amber-600" />
                          <span>Orden vinculada: {linkedOrden.folio}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cot)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] text-xs font-semibold text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : cot.id)}
                          className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2 text-[#5F6B73] hover:text-[#231F20] rounded-lg"
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
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                              {cot.estado === 'Aprobada' && (
                                <>
                                  {linkedOrden ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingLinkedOrden(linkedOrden);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2.5 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <span>Ver orden</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenLinkingModal(cot)}
                                      className="w-full px-3 py-2.5 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                      <span>Crear o vincular orden</span>
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setPrintingCotizacion(cot);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Ver / imprimir</span>
                              </button>

                              {cot.estado !== 'Aprobada' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusConfirm({ cotizacion: cot, action: 'Aprobada' });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span>Aprobar</span>
                                </button>
                              )}

                              {cot.estado !== 'Rechazada' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusConfirm({ cotizacion: cot, action: 'Rechazada' });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                  <span>Rechazar</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
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

      {/* MODAL: CREAR O VINCULAR ORDEN (ETAPA 7) */}
      {linkingCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
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
                onClick={() => setLinkingCotizacion(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                      className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
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
                      className="w-full px-4 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer"
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
              <div className="p-4 border border-[#DDE4E8] rounded-lg space-y-3 bg-slate-50/50">
                <h4 className="font-semibold text-[#231F20] text-xs uppercase tracking-wider">
                  Opción B: Crear nueva orden de trabajo
                </h4>
                <p className="text-xs text-[#5F6B73]">
                  Crea una nueva orden con el cliente, vehículo y trabajo de la cotización, asignándole folio único y estado "Pendiente".
                </p>
                <button
                  type="button"
                  disabled={isLinkingProcessing}
                  onClick={handleConfirmCreateNewOrder}
                  className="w-full px-4 py-2.5 min-h-[42px] border border-[#1D7EAE] text-[#1D7EAE] hover:bg-rose-50 disabled:opacity-50 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Crear nueva orden y vincular
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLinkingCotizacion(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
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
                onClick={() => setViewingLinkedOrden(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-700 bg-slate-50 p-4 rounded-lg border border-[#DDE4E8]">
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
                onClick={() => setViewingLinkedOrden(null)}
                className="px-4 py-2 border border-[#DDE4E8] rounded-lg text-xs font-medium text-[#5F6B73] hover:bg-slate-50 cursor-pointer"
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
                  className="px-4 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
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
                onClick={() => {
                  const dirty =
                    formClientId !== (editingCotizacion?.clienteId || clientes[0]?.id || '') ||
                    formVehiculoId !== (editingCotizacion?.vehiculoId || '') ||
                    formDescripcion.trim() !== (editingCotizacion?.descripcion || '') ||
                    formRefacciones !== (editingCotizacion?.importeRefacciones?.toString() || '0') ||
                    formManoObra !== (editingCotizacion?.importeManoObra?.toString() || '0');
                  if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                    return;
                  }
                  setIsFormModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
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
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
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
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
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
                <summary className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium flex items-center justify-between py-1 select-none">
                  <span>Datos opcionales (autocompletar con catálogo de servicios)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-2">
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => handleSelectCatalogService(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
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
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.descripcion ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
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
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                      formErrors.refacciones ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
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
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                      formErrors.manoObra ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                    }`}
                  />
                  {formErrors.manoObra && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.manoObra}</p>
                  )}
                </div>
              </div>

              {/* Total display */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-[#DDE4E8] flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm">Total calculado:</span>
                <span className="text-lg font-bold text-[#1D7EAE]">
                  ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </span>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE4E8]">
                <button
                  type="button"
                  onClick={() => {
                    const dirty =
                      formClientId !== (editingCotizacion?.clienteId || clientes[0]?.id || '') ||
                      formVehiculoId !== (editingCotizacion?.vehiculoId || '') ||
                      formDescripcion.trim() !== (editingCotizacion?.descripcion || '') ||
                      formRefacciones !== (editingCotizacion?.importeRefacciones?.toString() || '0') ||
                      formManoObra !== (editingCotizacion?.importeManoObra?.toString() || '0');
                    if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                      return;
                    }
                    setIsFormModalOpen(false);
                  }}
                  className="px-4 py-2.5 min-h-[42px] border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#5F6B73] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR CAMBIO DE ESTADO (APROBAR / RECHAZAR) */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              {statusConfirm.action === 'Aprobada' ? (
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2 bg-rose-50 text-rose-600 rounded-full">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900">
                ¿{statusConfirm.action === 'Aprobada' ? 'Aprobar' : 'Rechazar'} cotización?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Deseas marcar la cotización <strong>{statusConfirm.cotizacion.folio}</strong> como{' '}
              <strong className={statusConfirm.action === 'Aprobada' ? 'text-emerald-700' : 'text-rose-700'}>
                {statusConfirm.action}
              </strong>
              ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg shadow-xs transition-colors ${
                  statusConfirm.action === 'Aprobada'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VISTA DE IMPRESIÓN (VER / IMPRIMIR) */}
      {printingCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 print-area">
            <div className="no-print bg-white border-b border-[#DDE4E8] text-[#231F20] px-6 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Vista previa de cotización</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingCotizacion(null)}
                  className="p-1.5 text-slate-400 hover:text-[#231F20] rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-10 bg-white text-slate-800 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <div className="mb-2.5">
                    <IotLogo size="sm" variant="dark" />
                  </div>
                  <h1 className="text-xl font-bold text-[#231F20] tracking-tight">
                    {configuracion?.nombre || 'IOT Technologies'}
                  </h1>
                  {configuracion?.telefono && (
                    <p className="text-xs text-slate-500">Tel: {configuracion.telefono}</p>
                  )}
                  {configuracion?.direccion && (
                    <p className="text-xs text-slate-500">{configuracion.direccion}</p>
                  )}
                  <p className="text-xs uppercase tracking-widest text-[#1D7EAE] font-bold mt-1">
                    Documento de demostración
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

              <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                Este documento es una estimación de servicios expedida por {configuracion?.nombre || 'IOT Technologies'} con fines de demostración.
              </div>
            </div>

            <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPrintingCotizacion(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors min-h-[38px] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir cotización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
