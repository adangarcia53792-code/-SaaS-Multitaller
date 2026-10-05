import React, { useState, useMemo, useEffect } from 'react';
import {
  Cliente,
  Vehiculo,
  OrdenTrabajo,
  Cotizacion,
  EstadoOrden,
  AutorizacionRegistro,
  ServicioCatalogo,
  Refaccion,
  RefaccionUtilizadaOrden,
  ConfiguracionTaller,
  Empleado,
  Usuario,
  SesionUsuario,
  generarCodigoConsulta,
} from '../types';
import {
  Search,
  Plus,
  Pencil,
  X,
  Printer,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  CheckCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  Link as LinkIcon,
  ShieldCheck,
  Play,
  Check,
  Package,
  RotateCcw,
  Wrench,
  ClipboardList,
  KeyRound,
  Copy,
  RotateCw,
} from 'lucide-react';
import { IotLogo } from './IotLogo';

interface OrdenesSectionProps {
  ordenes: OrdenTrabajo[];
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  refacciones: Refaccion[];
  configuracion?: ConfiguracionTaller;
  onSaveOrden: (orden: OrdenTrabajo) => void;
  onSaveCotizacion: (cot: Cotizacion) => void;
  onLinkOrdenAndCotizacion: (ordenId: string, cotizacionId: string) => void;
  onCreateCotizacionForOrden: (ordenId: string, desc: string, ref: number, mo: number) => Cotizacion;
  onUseRefaccionInOrden: (ordenId: string, refaccionId: string, cantidad: number) => void;
  onReturnRefaccionFromOrden: (
    ordenId: string,
    refaccionUtilizadaId: string,
    cantidadDevolver: number,
    motivo?: string
  ) => void;
  currentUser?: SesionUsuario;
  usuarios?: Usuario[];
  empleados?: Empleado[];
  onRegistrarGarantia?: (orden: OrdenTrabajo) => void;
}

type EstadoFilter = 'todas' | EstadoOrden;

export const OrdenesSection: React.FC<OrdenesSectionProps> = ({
  ordenes,
  cotizaciones,
  clientes,
  vehiculos,
  servicios,
  refacciones,
  configuracion,
  onSaveOrden,
  onSaveCotizacion,
  onLinkOrdenAndCotizacion,
  onCreateCotizacionForOrden,
  onUseRefaccionInOrden,
  onReturnRefaccionFromOrden,
  currentUser,
  usuarios = [],
  empleados = [],
  onRegistrarGarantia,
}) => {
  const [filter, setFilter] = useState<EstadoFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown menu state per row
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal: Add / Edit (traditional form)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenTrabajo | null>(null);

  // Modal: Continuar Workflow (ETAPA 7)
  const [continuarOrden, setContinuarOrden] = useState<OrdenTrabajo | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Step 1 helper state: Prepara o vincula cotización
  const [step1SubTab, setStep1SubTab] = useState<'crear' | 'vincular'>('crear');
  const [step1SelectedCatalogId, setStep1SelectedCatalogId] = useState('');
  const [newCotDesc, setNewCotDesc] = useState('');
  const [newCotRef, setNewCotRef] = useState('0');
  const [newCotMo, setNewCotMo] = useState('0');
  const [selectedExistingCotId, setSelectedExistingCotId] = useState('');
  const [step1CotError, setStep1CotError] = useState('');

  // Step 2 & Autorización state
  const [authNombre, setAuthNombre] = useState('');
  const [authFechaHora, setAuthFechaHora] = useState('');
  const [authError, setAuthError] = useState('');

  // Step 3: Editar cotización rechazada state
  const [editingRejectedCot, setEditingRejectedCot] = useState<Cotizacion | null>(null);
  const [rejDesc, setRejDesc] = useState('');
  const [rejRef, setRejRef] = useState('0');
  const [rejMo, setRejMo] = useState('0');

  // Step 5: En proceso -> marcar trabajo terminado y registrar revisión final
  const [step5TrabajoTerminado, setStep5TrabajoTerminado] = useState(true);
  const [step5RevisionFinal, setStep5RevisionFinal] = useState(true);
  const [step5Error, setStep5Error] = useState('');

  // Step 6: Terminado -> registrar la entrega del vehículo al cliente
  const [step6Entregado, setStep6Entregado] = useState(true);
  const [step6Error, setStep6Error] = useState('');

  // Form main fields (for traditional Add/Edit modal)
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formVehiculoId, setFormVehiculoId] = useState('');
  const [formServicio, setFormServicio] = useState('');
  const [formEstado, setFormEstado] = useState<EstadoOrden>('Por autorizar');

  // Accordion toggle states in Add/Edit modal
  const [openRecepcion, setOpenRecepcion] = useState(false);
  const [openTrabajo, setOpenTrabajo] = useState(false);
  const [openRevision, setOpenRevision] = useState(false);

  // Secondary fields
  const [formKm, setFormKm] = useState('');
  const [formDaños, setFormDaños] = useState('');
  const [formFechaEntregaPrometida, setFormFechaEntregaPrometida] = useState('');
  const [formDiagnostico, setFormDiagnostico] = useState('');
  const [formObsMecanico, setFormObsMecanico] = useState('');
  const [formMensajePublico, setFormMensajePublico] = useState('');
  const [formTrabajoTerminado, setFormTrabajoTerminado] = useState(false);
  const [formRevisionFinal, setFormRevisionFinal] = useState(false);
  const [formEntregado, setFormEntregado] = useState(false);
  const [formFechaHoraEntrega, setFormFechaHoraEntrega] = useState<string | undefined>(undefined);
  const [formMecanicoId, setFormMecanicoId] = useState('');
  const [formMecanicoNombre, setFormMecanicoNombre] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal para consultar datos del código de seguimiento
  const [datosConsultaModal, setDatosConsultaModal] = useState<OrdenTrabajo | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const isMecanico = currentUser?.rol === 'Mecánico';
  const isRecepcion = currentUser?.rol === 'Recepción';

  const availableMecanicos = useMemo(() => {
    const list: { id: string; nombre: string }[] = [];
    usuarios
      .filter((u) => u.rol === 'Mecánico' && u.activo)
      .forEach((u) => {
        list.push({ id: u.id, nombre: u.nombre });
      });
    empleados
      .filter((e) => e.activo && (e.puesto.toLowerCase().includes('mecánic') || e.puesto.toLowerCase().includes('taller')))
      .forEach((e) => {
        if (!list.some((m) => m.nombre === e.nombre)) {
          list.push({ id: e.id, nombre: e.nombre });
        }
      });
    return list;
  }, [usuarios, empleados]);

  // View / Print modal state
  const [printingOrden, setPrintingOrden] = useState<OrdenTrabajo | null>(null);

  // Double-click protection
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  // Refacciones utilizadas state (ETAPA 9)
  const [isRefaccionesAccordionOpen, setIsRefaccionesAccordionOpen] = useState(false);
  const [selectedRefaccionId, setSelectedRefaccionId] = useState('');
  const [selectedRefaccionCantidad, setSelectedRefaccionCantidad] = useState('1');
  const [refaccionError, setRefaccionError] = useState('');
  const [returningItemId, setReturningItemId] = useState<string | null>(null);
  const [returningCantidad, setReturningCantidad] = useState('1');
  const [returningError, setReturningError] = useState('');
  const [openRefaccionesInEdit, setOpenRefaccionesInEdit] = useState(false);

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

  const cotizacionMap = useMemo(() => {
    const map = new Map<string, Cotizacion>();
    cotizaciones.forEach((c) => map.set(c.id, c));
    return map;
  }, [cotizaciones]);

  const refaccionMap = useMemo(() => {
    const map = new Map<string, Refaccion>();
    refacciones.forEach((r) => map.set(r.id, r));
    return map;
  }, [refacciones]);

  const availableVehicles = useMemo(() => {
    if (!formClientId) return [];
    return vehiculos.filter((v) => v.clienteId === formClientId);
  }, [vehiculos, formClientId]);

  const activeCatalogServices = useMemo(
    () => servicios.filter((s) => s.activo),
    [servicios]
  );

  // Current active linked quote for Continuar workflow
  const activeLinkedCotizacion = useMemo(() => {
    if (!continuarOrden) return undefined;
    if (continuarOrden.cotizacionId) {
      return cotizacionMap.get(continuarOrden.cotizacionId);
    }
    // Alternatively look if any quote points to this order
    return cotizaciones.find((c) => c.ordenId === continuarOrden.id);
  }, [continuarOrden, cotizaciones, cotizacionMap]);

  // Unlinked quotations for the vehicle of continuarOrden
  const availableUnlinkedCotizaciones = useMemo(() => {
    if (!continuarOrden) return [];
    return cotizaciones.filter(
      (c) =>
        c.vehiculoId === continuarOrden.vehiculoId &&
        (!c.ordenId || c.ordenId === continuarOrden.id)
    );
  }, [continuarOrden, cotizaciones]);

  // Strict 7-step sequence for Continuar workflow (ETAPA 7)
  type WorkflowStep =
    | 'sin-cotizacion' // 1. Sin cotización: preparar una cotización o vincular una existente del mismo vehículo.
    | 'cotizacion-pendiente' // 2. Cotización pendiente: revisar el presupuesto y registrar la autorización.
    | 'cotizacion-rechazada' // 3. Cotización rechazada: revisar y corregir el presupuesto; no iniciar el trabajo.
    | 'autorizada' // 4. Autorizada: iniciar el trabajo y cambiar el estado a “En proceso”.
    | 'en-proceso' // 5. En proceso: marcar el trabajo como terminado y registrar la revisión final.
    | 'terminado' // 6. Terminado: registrar la entrega del vehículo al cliente.
    | 'entregado'; // 7. Entregado: mostrar únicamente un mensaje de confirmación de servicio completado.

  const currentWorkflowStep = useMemo<WorkflowStep>(() => {
    if (!continuarOrden) return 'sin-cotizacion';

    // 7. Entregado: mostrar únicamente un mensaje de confirmación de servicio completado.
    if (continuarOrden.entregado) {
      return 'entregado';
    }

    // 6. Terminado: registrar la entrega del vehículo al cliente.
    if (continuarOrden.estado === 'Terminado') {
      return 'terminado';
    }

    // 5. En proceso: marcar el trabajo como terminado y registrar la revisión final.
    if (continuarOrden.estado === 'En proceso') {
      return 'en-proceso';
    }

    // For orders before "En proceso":
    // 1. Sin cotización: preparar una cotización o vincular una existente del mismo vehículo.
    if (!activeLinkedCotizacion) {
      return 'sin-cotizacion';
    }

    // 2. Cotización pendiente: revisar el presupuesto y registrar la autorización.
    if (activeLinkedCotizacion.estado === 'Por autorizar') {
      return 'cotizacion-pendiente';
    }

    // 3. Cotización rechazada: revisar y corregir el presupuesto; no iniciar el trabajo.
    if (activeLinkedCotizacion.estado === 'Rechazada') {
      return 'cotizacion-rechazada';
    }

    // 4. Autorizada: iniciar el trabajo y cambiar el estado a “En proceso”.
    if (activeLinkedCotizacion.estado === 'Aprobada') {
      const auth = activeLinkedCotizacion.autorizacion;
      const requiresAuth =
        !auth ||
        auth.trabajoAutorizado !== activeLinkedCotizacion.descripcion ||
        Math.abs(auth.totalAutorizado - activeLinkedCotizacion.total) > 0.01;

      if (requiresAuth) {
        return 'cotizacion-pendiente';
      }
      return 'autorizada';
    }

    return 'sin-cotizacion';
  }, [continuarOrden, activeLinkedCotizacion]);

  // Handler: Open Continuar Workflow
  const handleOpenContinuar = (orden: OrdenTrabajo) => {
    setContinuarOrden(orden);
    setIsAccordionOpen(false);
    setIsRefaccionesAccordionOpen(false);
    setSelectedRefaccionId('');
    setSelectedRefaccionCantidad('1');
    setRefaccionError('');
    setReturningItemId(null);
    setReturningCantidad('1');
    setReturningError('');
    setStep1CotError('');
    setAuthError('');
    setStep5Error('');
    setStep6Error('');
    setEditingRejectedCot(null);

    // Prep step 1 defaults
    setStep1SubTab('crear');
    setStep1SelectedCatalogId('');
    setNewCotDesc(orden.servicio);
    setNewCotRef('0');
    setNewCotMo('0');
    setSelectedExistingCotId(
      cotizaciones.find(
        (c) => c.vehiculoId === orden.vehiculoId && (!c.ordenId || c.ordenId === orden.id)
      )?.id || ''
    );

    // Prep authorization defaults
    const now = new Date();
    setAuthNombre(clienteMap.get(orden.clienteId)?.nombre || '');
    setAuthFechaHora(
      `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    );

    // Prep step 5 & 6 defaults
    setStep5TrabajoTerminado(true);
    setStep5RevisionFinal(true);
    setStep6Entregado(true);

    setIsActionProcessing(false);
  };

  // Handler: Catalog selection in Continuar Step 1
  const handleSelectCatalogInStep1 = (servId: string) => {
    setStep1SelectedCatalogId(servId);
    if (!servId) return;
    const found = activeCatalogServices.find((s) => s.id === servId);
    if (!found) return;

    const hasData =
      newCotDesc.trim().length > 0 ||
      (parseFloat(newCotRef) || 0) > 0 ||
      (parseFloat(newCotMo) || 0) > 0;

    if (hasData) {
      const confirmReplace = window.confirm(
        'Ya escribiste datos en la cotización. ¿Deseas sustituirlos con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setStep1SelectedCatalogId('');
        return;
      }
    }

    setNewCotDesc(found.nombre + (found.descripcion ? ': ' + found.descripcion : ''));
    setNewCotRef(found.importeRefacciones.toString());
    setNewCotMo(found.importeManoObra.toString());
    setStep1CotError('');
  };

  // Handler: Open Add
  const handleOpenAdd = () => {
    setEditingOrden(null);
    setSelectedCatalogId('');
    const defClient = clientes[0]?.id || '';
    setFormClientId(defClient);
    const clientVehs = vehiculos.filter((v) => v.clienteId === defClient);
    setFormVehiculoId(clientVehs[0]?.id || '');
    setFormServicio('');
    setFormEstado('Por autorizar');
    setFormKm('');
    setFormDaños('');
    setFormFechaEntregaPrometida('');
    setFormDiagnostico('');
    setFormObsMecanico('');
    setFormTrabajoTerminado(false);
    setFormRevisionFinal(false);
    setFormEntregado(false);
    setFormFechaHoraEntrega(undefined);
    setFormMecanicoId('');
    setFormMecanicoNombre('');

    setOpenRecepcion(true);
    setOpenTrabajo(false);
    setOpenRevision(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handler: Open Edit
  const handleOpenEdit = (orden: OrdenTrabajo) => {
    setEditingOrden(orden);
    setSelectedCatalogId('');
    setFormClientId(orden.clienteId);
    setFormVehiculoId(orden.vehiculoId);
    setFormServicio(orden.servicio);
    setFormEstado(orden.estado);
    setFormKm(orden.kilometraje || '');
    setFormDaños(orden.dañosVisibles || '');
    setFormFechaEntregaPrometida(orden.fechaEntregaPrometida || '');
    setFormDiagnostico(orden.diagnostico || '');
    setFormObsMecanico(orden.observacionesMecanico || orden.observaciones || '');
    setFormTrabajoTerminado(Boolean(orden.trabajoTerminado));
    setFormRevisionFinal(Boolean(orden.revisionFinal));
    setFormEntregado(Boolean(orden.entregado));
    setFormFechaHoraEntrega(orden.fechaHoraEntrega);
    setFormMecanicoId(orden.mecanicoId || '');
    setFormMecanicoNombre(orden.mecanicoNombre || '');

    setOpenRecepcion(Boolean(orden.kilometraje || orden.dañosVisibles));
    setOpenTrabajo(Boolean(orden.diagnostico || orden.observacionesMecanico || orden.observaciones));
    setOpenRevision(Boolean(orden.trabajoTerminado || orden.revisionFinal || orden.entregado));
    setOpenRefaccionesInEdit(false);
    setSelectedRefaccionId('');
    setSelectedRefaccionCantidad('1');
    setRefaccionError('');
    setReturningItemId(null);
    setReturningCantidad('1');
    setReturningError('');

    setFormErrors({});
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

  // Handler: Catalog selection in Add/Edit modal
  const handleSelectCatalogInModal = (servId: string) => {
    setSelectedCatalogId(servId);
    if (!servId) return;
    const found = activeCatalogServices.find((s) => s.id === servId);
    if (!found) return;

    if (formServicio.trim() && formServicio.trim() !== found.nombre) {
      const confirmReplace = window.confirm(
        'Ya escribiste una descripción del trabajo. ¿Deseas sustituirla con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogId('');
        return;
      }
    }

    setFormServicio(found.nombre + (found.descripcion ? ': ' + found.descripcion : ''));
    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
  };

  const handleClientChange = (newClientId: string) => {
    setFormClientId(newClientId);
    const clientVehs = vehiculos.filter((v) => v.clienteId === newClientId);
    setFormVehiculoId(clientVehs[0]?.id || '');
    if (formErrors.clienteId) setFormErrors((prev) => ({ ...prev, clienteId: '' }));
  };

  // Save Add/Edit modal form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formClientId) errors.clienteId = 'Debe seleccionar un cliente registrado.';
    if (!formVehiculoId) errors.vehiculoId = 'Debe seleccionar un vehículo.';
    if (!formServicio.trim()) errors.servicio = 'La descripción del trabajo es obligatoria.';

    if (formEntregado) {
      if (formEstado !== 'Terminado') {
        errors.estado = 'Para entregar el vehículo, el estado debe ser "Terminado".';
      }
      if (!formTrabajoTerminado || !formRevisionFinal) {
        errors.entrega = 'Para confirmar la entrega, exige marcar "Trabajo terminado" y "Revisión final realizada".';
      }
    }

    if (editingOrden && editingOrden.entregado) {
      if (formEntregado && formEstado !== 'Terminado') {
        errors.estado = 'No es posible cambiar el estado de una orden entregada. Debe desmarcar primero la entrega.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let finalFechaHoraEntrega = formFechaHoraEntrega;
    if (formEntregado) {
      if (!finalFechaHoraEntrega) {
        const now = new Date();
        finalFechaHoraEntrega = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }
    } else {
      finalFechaHoraEntrega = undefined;
    }

    let folio = '';
    if (editingOrden) {
      folio = editingOrden.folio;
    } else {
      const count = ordenes.length + 1;
      folio = `ORD-${String(count).padStart(3, '0')}`;
    }

    const savedOrden: OrdenTrabajo = {
      id: editingOrden
        ? editingOrden.id
        : `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio,
      clienteId: isMecanico && editingOrden ? editingOrden.clienteId : formClientId,
      vehiculoId: isMecanico && editingOrden ? editingOrden.vehiculoId : formVehiculoId,
      cotizacionId: editingOrden?.cotizacionId,
      servicio: isMecanico && editingOrden ? editingOrden.servicio : formServicio.trim(),
      estado: formEstado,
      kilometraje: formKm.trim() || undefined,
      dañosVisibles: formDaños.trim() || undefined,
      fechaEntregaPrometida: formFechaEntregaPrometida || undefined,
      diagnostico: isRecepcion && editingOrden ? editingOrden.diagnostico : (formDiagnostico.trim() || undefined),
      observacionesMecanico: isRecepcion && editingOrden ? editingOrden.observacionesMecanico : (formObsMecanico.trim() || undefined),
      trabajoTerminado: isRecepcion && editingOrden ? editingOrden.trabajoTerminado : formTrabajoTerminado,
      revisionFinal: isRecepcion && editingOrden ? editingOrden.revisionFinal : formRevisionFinal,
      entregado: formEntregado,
      fechaHoraEntrega: finalFechaHoraEntrega,
      refaccionesUtilizadas: editingOrden?.refaccionesUtilizadas,
      mecanicoId: isMecanico && editingOrden ? editingOrden.mecanicoId : (formMecanicoId || undefined),
      mecanicoNombre: isMecanico && editingOrden ? editingOrden.mecanicoNombre : (formMecanicoNombre || undefined),
      creadoEn: editingOrden ? editingOrden.creadoEn : new Date().toISOString(),
    };

    onSaveOrden(savedOrden);
    setIsFormModalOpen(false);
  };

  // ==========================================
  // CONTINUAR WORKFLOW ACTIONS (ETAPA 7)
  // ==========================================

  // Step 1: Create or Link Quote
  const handleStep1CreateNewQuote = () => {
    if (!continuarOrden || isActionProcessing) return;
    if (!newCotDesc.trim()) {
      setStep1CotError('La descripción del trabajo es requerida.');
      return;
    }
    const ref = parseFloat(newCotRef) || 0;
    const mo = parseFloat(newCotMo) || 0;
    if (ref < 0 || mo < 0) {
      setStep1CotError('Los importes no pueden ser negativos.');
      return;
    }

    setIsActionProcessing(true);
    const createdCot = onCreateCotizacionForOrden(
      continuarOrden.id,
      newCotDesc.trim(),
      ref,
      mo
    );

    // Update local continuarOrden with linked cotizacionId
    setContinuarOrden({
      ...continuarOrden,
      cotizacionId: createdCot.id,
    });
    setIsActionProcessing(false);
  };

  const handleStep1LinkExistingQuote = () => {
    if (!continuarOrden || !selectedExistingCotId || isActionProcessing) return;
    setIsActionProcessing(true);
    onLinkOrdenAndCotizacion(continuarOrden.id, selectedExistingCotId);
    setContinuarOrden({
      ...continuarOrden,
      cotizacionId: selectedExistingCotId,
    });
    setIsActionProcessing(false);
  };

  // Step 2: Register Authorization
  const handleStep2RegisterAuthorization = () => {
    if (!continuarOrden || !activeLinkedCotizacion || isActionProcessing) return;
    if (!authNombre.trim()) {
      setAuthError('El nombre de quien autoriza es obligatorio.');
      return;
    }

    setIsActionProcessing(true);
    const authReg: AutorizacionRegistro = {
      autorizadoPor: authNombre.trim(),
      fechaHora: authFechaHora || new Date().toLocaleString('es-MX'),
      trabajoAutorizado: activeLinkedCotizacion.descripcion,
      totalAutorizado: activeLinkedCotizacion.total,
    };

    const updatedCot: Cotizacion = {
      ...activeLinkedCotizacion,
      estado: 'Aprobada',
      autorizacion: authReg,
      historialAutorizaciones: activeLinkedCotizacion.autorizacion
        ? [activeLinkedCotizacion.autorizacion, ...(activeLinkedCotizacion.historialAutorizaciones || [])]
        : activeLinkedCotizacion.historialAutorizaciones,
    };
    onSaveCotizacion(updatedCot);

    // Advance order to Pendiente if it was Por autorizar
    const updatedOrd: OrdenTrabajo = {
      ...continuarOrden,
      estado: continuarOrden.estado === 'Por autorizar' ? 'Pendiente' : continuarOrden.estado,
    };
    onSaveOrden(updatedOrd);
    setContinuarOrden(updatedOrd);

    setAuthError('');
    setIsActionProcessing(false);
  };

  // Step 3: Save corrected rejected quote
  const handleStep3SaveCorrectedQuote = () => {
    if (!editingRejectedCot || !continuarOrden || isActionProcessing) return;
    if (!rejDesc.trim()) return;
    const ref = parseFloat(rejRef) || 0;
    const mo = parseFloat(rejMo) || 0;
    if (ref < 0 || mo < 0) return;

    setIsActionProcessing(true);
    const updatedCot: Cotizacion = {
      ...editingRejectedCot,
      descripcion: rejDesc.trim(),
      importeRefacciones: ref,
      importeManoObra: mo,
      total: ref + mo,
      estado: 'Por autorizar',
    };
    onSaveCotizacion(updatedCot);
    setEditingRejectedCot(null);
    setIsActionProcessing(false);
  };

  // Step 4: Iniciar trabajo
  const handleStep4IniciarTrabajo = () => {
    if (!continuarOrden || isActionProcessing) return;
    setIsActionProcessing(true);
    const updatedOrd: OrdenTrabajo = {
      ...continuarOrden,
      estado: 'En proceso',
    };
    onSaveOrden(updatedOrd);
    setContinuarOrden(updatedOrd);
    setIsActionProcessing(false);
  };

  // Step 5: En proceso -> marcar el trabajo como terminado y registrar la revisión final
  const handleStep5MarcarTerminadoYRevision = () => {
    if (!continuarOrden || isActionProcessing) return;
    if (!step5TrabajoTerminado || !step5RevisionFinal) {
      setStep5Error('Debes marcar el trabajo como terminado y confirmar la realización de la revisión final.');
      return;
    }
    setIsActionProcessing(true);
    const updatedOrd: OrdenTrabajo = {
      ...continuarOrden,
      estado: 'Terminado',
      trabajoTerminado: true,
      revisionFinal: true,
    };
    onSaveOrden(updatedOrd);
    setContinuarOrden(updatedOrd);
    setStep5Error('');
    setIsActionProcessing(false);
  };

  // Step 6: Terminado -> registrar la entrega del vehículo al cliente
  const handleStep6RegistrarEntrega = () => {
    if (!continuarOrden || isActionProcessing) return;
    if (!step6Entregado) {
      setStep6Error('Debes marcar la casilla para confirmar la entrega del vehículo al cliente.');
      return;
    }
    setIsActionProcessing(true);
    const now = new Date();
    const formattedFechaHora = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const updatedOrd: OrdenTrabajo = {
      ...continuarOrden,
      estado: 'Terminado',
      trabajoTerminado: true,
      revisionFinal: true,
      entregado: true,
      fechaHoraEntrega: formattedFechaHora,
    };

    onSaveOrden(updatedOrd);
    setContinuarOrden(updatedOrd);
    setStep6Error('');
    setIsActionProcessing(false);
  };

  // Handler: Confirmar uso de refacción en la orden (ETAPA 9)
  const handleConfirmUseRefaccion = (orden: OrdenTrabajo) => {
    if (!orden || isActionProcessing) return;
    if (isRecepcion) {
      setRefaccionError('Recepción no tiene autorización para registrar refacciones utilizadas.');
      return;
    }
    if (!selectedRefaccionId) {
      setRefaccionError('Seleccione una refacción del catálogo.');
      return;
    }

    const qty = parseInt(selectedRefaccionCantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      setRefaccionError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    const targetRef = refaccionMap.get(selectedRefaccionId);
    if (!targetRef) {
      setRefaccionError('Refacción no encontrada.');
      return;
    }

    if (qty > targetRef.existencias) {
      setRefaccionError(
        `Existencias insuficientes. Disponibles en inventario: ${targetRef.existencias} piezas.`
      );
      return;
    }

    setIsActionProcessing(true);
    onUseRefaccionInOrden(orden.id, selectedRefaccionId, qty);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newUsedItem: RefaccionUtilizadaOrden = {
      id: `ru-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId: selectedRefaccionId,
      cantidad: qty,
      devueltas: 0,
      fechaHora: formattedDate,
    };

    const updatedRefacciones = [...(orden.refaccionesUtilizadas || []), newUsedItem];
    if (continuarOrden && continuarOrden.id === orden.id) {
      setContinuarOrden({
        ...continuarOrden,
        refaccionesUtilizadas: updatedRefacciones,
      });
    }
    if (editingOrden && editingOrden.id === orden.id) {
      setEditingOrden({
        ...editingOrden,
        refaccionesUtilizadas: updatedRefacciones,
      });
    }

    setSelectedRefaccionId('');
    setSelectedRefaccionCantidad('1');
    setRefaccionError('');
    setIsActionProcessing(false);
  };

  // Handler: Confirmar devolución de refacción desde la orden (ETAPA 9)
  const handleConfirmReturnRefaccion = (orden: OrdenTrabajo, item: RefaccionUtilizadaOrden) => {
    if (!orden || isActionProcessing) return;
    if (isRecepcion) {
      setReturningError('Recepción no tiene autorización para devolver refacciones.');
      return;
    }
    const qty = parseInt(returningCantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      setReturningError('La cantidad a devolver debe ser un número entero mayor a 0.');
      return;
    }

    const maxReturnable = item.cantidad - (item.devueltas || 0);
    if (qty > maxReturnable) {
      setReturningError(
        `La cantidad a devolver no puede superar la cantidad pendiente (${maxReturnable} pzs).`
      );
      return;
    }

    setIsActionProcessing(true);
    onReturnRefaccionFromOrden(orden.id, item.id, qty);

    const updatedRefacciones = (orden.refaccionesUtilizadas || []).map((u) =>
      u.id === item.id ? { ...u, devueltas: (u.devueltas || 0) + qty } : u
    );

    if (continuarOrden && continuarOrden.id === orden.id) {
      setContinuarOrden({
        ...continuarOrden,
        refaccionesUtilizadas: updatedRefacciones,
      });
    }
    if (editingOrden && editingOrden.id === orden.id) {
      setEditingOrden({
        ...editingOrden,
        refaccionesUtilizadas: updatedRefacciones,
      });
    }

    setReturningItemId(null);
    setReturningCantidad('1');
    setReturningError('');
    setIsActionProcessing(false);
  };

  const assignedOrdenes = useMemo(() => {
    if (!isMecanico) return ordenes;
    return ordenes.filter(
      (ord) =>
        ord.mecanicoId === currentUser?.usuarioId ||
        ord.mecanicoId === currentUser?.empleadoId ||
        ord.mecanicoNombre === currentUser?.nombre
    );
  }, [ordenes, isMecanico, currentUser]);

  // Filter & Search
  const filteredOrdenes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return assignedOrdenes.filter((ord) => {
      if (filter !== 'todas' && ord.estado !== filter) {
        return false;
      }
      if (q) {
        const folioMatch = ord.folio.toLowerCase().includes(q);
        const client = clienteMap.get(ord.clienteId);
        const veh = vehiculoMap.get(ord.vehiculoId);
        const clientMatch = client?.nombre.toLowerCase().includes(q);
        const plateMatch = veh?.placas.toLowerCase().includes(q);
        return Boolean(folioMatch || clientMatch || plateMatch);
      }
      return true;
    });
  }, [assignedOrdenes, filter, searchQuery, clienteMap, vehiculoMap]);

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Órdenes */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                {isMecanico ? 'Órdenes asignadas' : 'Órdenes de trabajo'}
              </h2>
              {isMecanico && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Mecánico
                </span>
              )}
              {isRecepcion && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  Recepción
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              {isMecanico
                ? `Órdenes asignadas a ${currentUser?.nombre}. Registra diagnóstico, observaciones, refacciones y finaliza trabajos.`
                : 'Control de recepción, diagnóstico, progreso y entrega de vehículos.'}
            </p>
          </div>
        </div>
        {!isMecanico && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva orden</span>
            </button>
          </div>
        )}
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
            onClick={() => setFilter('Pendiente')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Pendiente'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Pendiente
          </button>
          <button
            type="button"
            onClick={() => setFilter('En proceso')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'En proceso'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            En proceso
          </button>
          <button
            type="button"
            onClick={() => setFilter('Terminado')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Terminado'
                ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Terminado
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
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrdenes.length > 0 ? (
                filteredOrdenes.map((ord) => {
                  const client = clienteMap.get(ord.clienteId);
                  const veh = vehiculoMap.get(ord.vehiculoId);
                  const isMenuOpen = openMenuId === ord.id;
                  const linkedCot = ord.cotizacionId ? cotizacionMap.get(ord.cotizacionId) : undefined;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Folio */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded text-xs border border-amber-200">
                          {ord.folio}
                        </span>
                        {linkedCot && (
                          <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-amber-600" />
                            <span>{linkedCot.folio}</span>
                          </div>
                        )}
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

                      {/* Trabajo solicitado y Mecánico */}
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs">
                        <span className="line-clamp-2">{ord.servicio}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {ord.kilometraje && (
                            <span className="text-[11px] text-slate-400">
                              Km: {ord.kilometraje}
                            </span>
                          )}
                          {ord.mecanicoNombre ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              <Wrench className="w-3 h-3 text-amber-600" />
                              <span>{ord.mecanicoNombre}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Sin mecánico asignado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {ord.estado === 'Por autorizar' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Por autorizar
                            </span>
                          )}
                          {ord.estado === 'Pendiente' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              Pendiente
                            </span>
                          )}
                          {ord.estado === 'En proceso' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              En proceso
                            </span>
                          )}
                          {ord.estado === 'Terminado' && (
                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Terminado
                            </span>
                          )}

                          {ord.entregado && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Entregado</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acciones: Botón principal CONTINUAR o REGISTRAR TRABAJO */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2">
                          {isMecanico ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ord)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] text-xs font-semibold text-white bg-[#1D7EAE] hover:bg-[#0032A0] rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Registrar trabajo</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenContinuar(ord)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] text-xs font-semibold text-white bg-[#1D7EAE] hover:bg-[#0032A0] rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <span>Continuar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : ord.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenEdit(ord);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Pencil className="w-4 h-4 text-slate-500" />
                                    <span>Editar orden</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrintingOrden(ord);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span>Ver / imprimir</span>
                                  </button>

                                  {ord.entregado && !isMecanico && onRegistrarGarantia && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onRegistrarGarantia(ord);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-[#1D7EAE] hover:bg-rose-50 flex items-center gap-2 font-medium"
                                    >
                                      <ShieldCheck className="w-4 h-4 text-[#1D7EAE]" />
                                      <span>Registrar garantía</span>
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
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron órdenes que coincidan con la búsqueda.'
                      : filter !== 'todas'
                      ? `No hay órdenes con estado "${filter}".`
                      : 'No hay órdenes de trabajo registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredOrdenes.length > 0 ? (
            filteredOrdenes.map((ord) => {
              const client = clienteMap.get(ord.clienteId);
              const veh = vehiculoMap.get(ord.vehiculoId);
              const isMenuOpen = openMenuId === ord.id;
              const linkedCot = ord.cotizacionId ? cotizacionMap.get(ord.cotizacionId) : undefined;

              return (
                <div key={ord.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                          {ord.folio}
                        </span>
                        {ord.estado === 'Por autorizar' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Por autorizar
                          </span>
                        )}
                        {ord.estado === 'Pendiente' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            Pendiente
                          </span>
                        )}
                        {ord.estado === 'En proceso' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            En proceso
                          </span>
                        )}
                        {ord.estado === 'Terminado' && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Terminado
                          </span>
                        )}
                        {ord.entregado && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Entregado
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-[#231F20] text-sm">{client?.nombre || 'Cliente no encontrado'}</p>
                      <p className="text-xs text-[#5F6B73] mt-0.5">
                        {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo no registrado'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ord.servicio}</p>
                      {ord.mecanicoNombre && (
                        <p className="text-xs text-amber-800 font-medium flex items-center gap-1 mt-1">
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>Mecánico: {ord.mecanicoNombre}</span>
                        </p>
                      )}
                      {linkedCot && (
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <LinkIcon className="w-3 h-3 text-indigo-600" />
                          <span>Cotización: {linkedCot.folio}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isMecanico ? (
                        <button
                          type="button"
                          onClick={() => handleOpenContinuar(ord)}
                          className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] text-xs font-semibold text-white bg-[#1D7EAE] hover:bg-[#0032A0] rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Registrar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenContinuar(ord)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[42px] text-xs font-semibold text-white bg-[#1D7EAE] hover:bg-[#0032A0] rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Continuar</span>
                        </button>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : ord.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg"
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
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEdit(ord);
                                }}
                                className="w-full px-3 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4 text-slate-500" />
                                <span>Editar orden</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPrintingOrden(ord);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Ver / imprimir</span>
                              </button>

                              {ord.entregado && !isMecanico && onRegistrarGarantia && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRegistrarGarantia(ord);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2.5 text-[#1D7EAE] hover:bg-rose-50 flex items-center gap-2 font-medium"
                                >
                                  <ShieldCheck className="w-4 h-4 text-[#1D7EAE]" />
                                  <span>Registrar garantía</span>
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
                ? 'No se encontraron órdenes que coincidan con la búsqueda.'
                : filter !== 'todas'
                ? `No hay órdenes con estado "${filter}".`
                : 'No hay órdenes de trabajo registradas.'}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CONTINUAR WORKFLOW (ETAPA 7) */}
      {/* ======================================================== */}
      {continuarOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6 flex flex-col">
            {/* Header: Folio, Cliente, Vehículo */}
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#1D7EAE] font-bold text-sm bg-[#98DAE9]/20 border border-[#98DAE9]/40 px-2 py-0.5 rounded">
                    {continuarOrden.folio}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#5F6B73] border border-[#DDE4E8]">
                    Estado: {continuarOrden.estado}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#231F20] mt-1">
                  {clienteMap.get(continuarOrden.clienteId)?.nombre} — {vehiculoMap.get(continuarOrden.vehiculoId)?.marca}{' '}
                  {vehiculoMap.get(continuarOrden.vehiculoId)?.modelo} ({vehiculoMap.get(continuarOrden.vehiculoId)?.placas})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setContinuarOrden(null)}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Apartado desplegable: Diagnóstico, presupuesto y autorización */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors"
                >
                  <span>Diagnóstico, presupuesto y autorización</span>
                  {isAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {isAccordionOpen && (
                  <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                    {/* Diagnóstico */}
                    <div>
                      <span className="font-semibold text-slate-600 block mb-0.5">Diagnóstico y Trabajo:</span>
                      <p className="text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                        {continuarOrden.diagnostico || continuarOrden.servicio}
                      </p>
                    </div>

                    {/* Presupuesto */}
                    <div>
                      <span className="font-semibold text-slate-600 block mb-0.5">Cotización / Presupuesto:</span>
                      {activeLinkedCotizacion ? (
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                          <div className="flex justify-between">
                            <span>Folio: <strong>{activeLinkedCotizacion.folio}</strong></span>
                            <span className="capitalize font-semibold text-purple-700">
                              {activeLinkedCotizacion.estado}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Refacciones: ${activeLinkedCotizacion.importeRefacciones.toFixed(2)}</span>
                            <span>Mano de obra: ${activeLinkedCotizacion.importeManoObra.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                            <span>Total:</span>
                            <span>${activeLinkedCotizacion.total.toFixed(2)} MXN</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No hay cotización vinculada todavía.</p>
                      )}
                    </div>

                    {/* Autorización */}
                    <div>
                      <span className="font-semibold text-slate-600 block mb-0.5">Autorización:</span>
                      {activeLinkedCotizacion?.autorizacion ? (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-emerald-900">
                          <p>
                            Autorizado por: <strong>{activeLinkedCotizacion.autorizacion.autorizadoPor}</strong>
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Fecha y hora: {activeLinkedCotizacion.autorizacion.fechaHora}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Sin autorización registrada.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Apartado desplegable: Refacciones utilizadas (ETAPA 9) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setIsRefaccionesAccordionOpen(!isRefaccionesAccordionOpen)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Refacciones utilizadas</span>
                    {continuarOrden.refaccionesUtilizadas && continuarOrden.refaccionesUtilizadas.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {continuarOrden.refaccionesUtilizadas.reduce(
                          (sum, u) => sum + (u.cantidad - (u.devueltas || 0)),
                          0
                        )}{' '}
                        piezas
                      </span>
                    )}
                  </div>
                  {isRefaccionesAccordionOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {isRefaccionesAccordionOpen && (
                  <div className="p-4 bg-white space-y-4 border-t border-slate-200">
                    {/* Lista de refacciones registradas en esta orden */}
                    <div>
                      <span className="font-semibold text-slate-700 block mb-2">
                        Refacciones registradas en esta orden:
                      </span>
                      {continuarOrden.refaccionesUtilizadas && continuarOrden.refaccionesUtilizadas.length > 0 ? (
                        <div className="space-y-2">
                          {continuarOrden.refaccionesUtilizadas.map((item) => {
                            const ref = refaccionMap.get(item.refaccionId);
                            const netQuantity = item.cantidad - (item.devueltas || 0);
                            const isReturning = returningItemId === item.id;

                            return (
                              <div
                                key={item.id}
                                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {ref ? ref.codigo : 'REF'}
                                      </span>
                                      <span>{ref ? ref.nombre : 'Refacción'}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                      Registrada: {item.fechaHora} • Asignadas: <strong>{item.cantidad}</strong> pzs
                                      {item.devueltas > 0 && (
                                        <span className="text-amber-700 ml-1.5 font-medium">
                                          (Devueltas al inventario: {item.devueltas} pzs)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center">
                                    <span className="font-semibold text-slate-800 text-xs bg-white px-2 py-1 rounded border border-slate-200">
                                      {netQuantity} en orden
                                    </span>
                                    {netQuantity > 0 && !isReturning && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReturningItemId(item.id);
                                          setReturningCantidad('1');
                                          setReturningError('');
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Devolver</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Formulario de devolución */}
                                {isReturning && (
                                  <div className="p-3 bg-white border border-rose-200 rounded-lg space-y-2 mt-2">
                                    <div className="flex justify-between items-center text-slate-700 font-semibold text-xs">
                                      <span>Devolución a inventario:</span>
                                      <span className="text-[11px] text-slate-500 font-normal">
                                        Disponible a devolver: {netQuantity} pzs
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min="1"
                                          max={netQuantity}
                                          step="1"
                                          value={returningCantidad}
                                          onChange={(e) => setReturningCantidad(e.target.value)}
                                          className="w-20 p-1.5 border border-[#DDE4E8] rounded text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                                        />
                                        <span className="text-slate-500 text-xs">pzs</span>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={isActionProcessing}
                                        onClick={() => handleConfirmReturnRefaccion(continuarOrden, item)}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                                      >
                                        Confirmar devolución
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReturningItemId(null)}
                                        className="px-2.5 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-xs font-medium"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    {returningError && (
                                      <p className="text-rose-600 text-[11px] bg-rose-50 p-1.5 rounded border border-rose-200">
                                        {returningError}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic py-1">
                          No se han registrado refacciones utilizadas en esta orden todavía.
                        </p>
                      )}
                    </div>

                    {/* Formulario para registrar uso de refacción */}
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <span className="font-semibold text-slate-700 block">
                        Registrar refacción utilizada:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">
                            Seleccionar refacción
                          </label>
                          <select
                            value={selectedRefaccionId}
                            onChange={(e) => {
                              setSelectedRefaccionId(e.target.value);
                              setRefaccionError('');
                            }}
                            className="w-full p-2 border border-[#DDE4E8] rounded text-[#231F20] bg-white text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                          >
                            <option value="">Seleccionar refacción del catálogo...</option>
                            {refacciones.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.codigo} — {r.nombre} (Disponibles: {r.existencias} pzs)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">
                            Cantidad (pzs)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={selectedRefaccionCantidad}
                              onChange={(e) => {
                                setSelectedRefaccionCantidad(e.target.value);
                                setRefaccionError('');
                              }}
                              className="w-20 p-2 border border-[#DDE4E8] rounded text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                            />
                            <button
                              type="button"
                              disabled={!selectedRefaccionId || isActionProcessing}
                              onClick={() => handleConfirmUseRefaccion(continuarOrden)}
                              className="flex-1 py-2 px-3 bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                            >
                              Confirmar uso
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedRefaccionId && (() => {
                        const sel = refaccionMap.get(selectedRefaccionId);
                        if (!sel) return null;
                        return (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>
                              Existencias disponibles en almacén: <strong>{sel.existencias} pzs</strong>
                            </span>
                            {sel.existencias === 0 && (
                              <span className="text-rose-600 font-semibold">
                                Sin existencias disponibles para registrar salidas.
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {refaccionError && (
                        <p className="text-rose-600 text-xs mt-1 bg-rose-50 p-2 rounded border border-rose-200">
                          {refaccionError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* UN SOLO SIGUIENTE PASO VISIBLE (ETAPA 7) */}
              {/* ======================================================== */}

              {/* 1. Sin cotización: preparar una cotización o vincular una existente del mismo vehículo */}
              {currentWorkflowStep === 'sin-cotizacion' && (
                <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <FileText className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-[#231F20] text-sm">
                      Paso siguiente: Preparar o vincular cotización
                    </h4>
                  </div>
                  <p className="text-xs text-[#5F6B73]">
                    Esta orden aún no tiene un presupuesto vinculado. Puedes redactar una nueva cotización o asociar una existente del vehículo.
                  </p>

                  <div className="flex rounded-md border border-[#DDE4E8] bg-white p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setStep1SubTab('crear')}
                      className={`flex-1 py-1.5 rounded transition-colors font-medium cursor-pointer ${
                        step1SubTab === 'crear' ? 'bg-[#1D7EAE] text-white shadow-xs' : 'text-[#5F6B73]'
                      }`}
                    >
                      Preparar nueva cotización
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep1SubTab('vincular')}
                      className={`flex-1 py-1.5 rounded transition-colors font-medium cursor-pointer ${
                        step1SubTab === 'vincular' ? 'bg-[#1D7EAE] text-white shadow-xs' : 'text-[#5F6B73]'
                      }`}
                    >
                      Vincular cotización existente
                    </button>
                  </div>

                  {step1CotError && (
                    <p className="text-xs text-red-600">{step1CotError}</p>
                  )}

                  {step1SubTab === 'crear' ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-lg border border-[#DDE4E8] text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Servicio del catálogo <span className="text-[11px] text-slate-400 font-normal">(Opcional)</span>
                        </label>
                        <select
                          value={step1SelectedCatalogId}
                          onChange={(e) => handleSelectCatalogInStep1(e.target.value)}
                          className="w-full p-2 border border-[#DDE4E8] rounded text-[#231F20] bg-white"
                        >
                          <option value="">Seleccionar del catálogo o escribir abajo...</option>
                          {activeCatalogServices.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} (${s.total.toFixed(2)} MXN)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Descripción del trabajo
                        </label>
                        <textarea
                          rows={2}
                          value={newCotDesc}
                          onChange={(e) => setNewCotDesc(e.target.value)}
                          className="w-full p-2 border border-[#DDE4E8] rounded text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Refacciones ($ MXN)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newCotRef}
                            onChange={(e) => setNewCotRef(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Mano de obra ($ MXN)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newCotMo}
                            onChange={(e) => setNewCotMo(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#DDE4E8]">
                        <span className="font-semibold text-slate-700">Total calculado:</span>
                        <span className="font-bold text-sm text-[#1D7EAE]">
                          ${((parseFloat(newCotRef) || 0) + (parseFloat(newCotMo) || 0)).toFixed(2)} MXN
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isActionProcessing}
                        onClick={handleStep1CreateNewQuote}
                        className="w-full py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Crear cotización y vincular a la orden
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3.5 rounded-lg border border-[#DDE4E8] text-xs">
                      {availableUnlinkedCotizaciones.length > 0 ? (
                        <>
                          <label className="block font-medium text-slate-700">
                            Seleccionar cotización del mismo vehículo:
                          </label>
                          <select
                            value={selectedExistingCotId}
                            onChange={(e) => setSelectedExistingCotId(e.target.value)}
                            className="w-full p-2.5 border border-[#DDE4E8] rounded-lg text-slate-800 bg-white"
                          >
                            {availableUnlinkedCotizaciones.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.folio} — {c.descripcion} (${c.total.toFixed(2)} MXN - {c.estado})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedExistingCotId || isActionProcessing}
                            onClick={handleStep1LinkExistingQuote}
                            className="w-full py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Vincular a esta cotización
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-500 italic py-2">
                          No hay cotizaciones existentes para este vehículo. Elige la pestaña "Preparar nueva cotización".
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Cotización pendiente: revisar el presupuesto y registrar la autorización */}
              {currentWorkflowStep === 'cotizacion-pendiente' && activeLinkedCotizacion && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Paso siguiente: Revisar presupuesto y registrar autorización
                    </h4>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500">Trabajo presupuestado:</span>
                      <span className="font-medium text-slate-800 text-right max-w-xs">
                        {activeLinkedCotizacion.descripcion}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 text-slate-600">
                      <span>Refacciones:</span>
                      <span>${activeLinkedCotizacion.importeRefacciones.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Mano de obra:</span>
                      <span>${activeLinkedCotizacion.importeManoObra.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 border-t pt-1.5">
                      <span>Total presupuestado:</span>
                      <span className="text-[#1D7EAE]">${activeLinkedCotizacion.total.toFixed(2)} MXN</span>
                    </div>
                  </div>

                  {/* Form de captura de autorización */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nombre de quien autoriza <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={authNombre}
                        onChange={(e) => setAuthNombre(e.target.value)}
                        placeholder="Ej. Nombre del cliente o responsable"
                        className="w-full p-2 border border-slate-200 rounded text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Fecha y hora de autorización
                      </label>
                      <input
                        type="text"
                        value={authFechaHora}
                        onChange={(e) => setAuthFechaHora(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-slate-800"
                      />
                    </div>

                    {authError && <p className="text-xs text-red-600">{authError}</p>}

                    <button
                      type="button"
                      disabled={isActionProcessing}
                      onClick={handleStep2RegisterAuthorization}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Registrar autorización</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Cotización rechazada: revisar y corregir el presupuesto; no iniciar el trabajo */}
              {currentWorkflowStep === 'cotizacion-rechazada' && activeLinkedCotizacion && (
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Paso siguiente: Cotización rechazada
                    </h4>
                  </div>
                  <p className="text-xs text-rose-700 font-medium">
                    El presupuesto fue rechazado. Revisa y corrige el presupuesto. No iniciar el trabajo en el vehículo.
                  </p>

                  {editingRejectedCot ? (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Descripción corregida
                        </label>
                        <textarea
                          rows={2}
                          value={rejDesc}
                          onChange={(e) => setRejDesc(e.target.value)}
                          className="w-full p-2 border rounded text-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Refacciones ($ MXN)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rejRef}
                            onChange={(e) => setRejRef(e.target.value)}
                            className="w-full p-2 border rounded text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Mano de obra ($ MXN)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rejMo}
                            onChange={(e) => setRejMo(e.target.value)}
                            className="w-full p-2 border rounded text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t font-semibold">
                        <span>Total corregido:</span>
                        <span className="text-[#1D7EAE]">
                          ${((parseFloat(rejRef) || 0) + (parseFloat(rejMo) || 0)).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingRejectedCot(null)}
                          className="px-3 py-1.5 border border-[#DDE4E8] rounded-lg text-slate-600 hover:bg-slate-50 min-h-[36px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleStep3SaveCorrectedQuote}
                          className="px-4 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg font-medium min-h-[36px] cursor-pointer"
                        >
                          Guardar y solicitar autorización
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRejectedCot(activeLinkedCotizacion);
                        setRejDesc(activeLinkedCotizacion.descripcion);
                        setRejRef(activeLinkedCotizacion.importeRefacciones.toString());
                        setRejMo(activeLinkedCotizacion.importeManoObra.toString());
                      }}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                    >
                      Revisar y corregir presupuesto
                    </button>
                  )}
                </div>
              )}

              {/* 4. Autorizada: iniciar el trabajo y cambiar el estado a “En proceso” */}
              {currentWorkflowStep === 'autorizada' && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Play className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Paso siguiente: Iniciar el trabajo
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    La cotización está aprobada y el presupuesto autorizado. Iniciar el trabajo y cambiar el estado de la orden a “En proceso”.
                  </p>

                  <button
                    type="button"
                    disabled={isActionProcessing}
                    onClick={handleStep4IniciarTrabajo}
                    className="w-full py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar el trabajo (cambiar a “En proceso”)</span>
                  </button>
                </div>
              )}

              {/* 5. En proceso: marcar el trabajo como terminado y registrar la revisión final */}
              {currentWorkflowStep === 'en-proceso' && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-900">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Paso siguiente: Marcar trabajo como terminado y registrar revisión final
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    El vehículo se encuentra en reparación. Marca el trabajo como terminado y confirma la revisión final para cambiar el estado a “Terminado”.
                  </p>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={step5TrabajoTerminado}
                        onChange={(e) => setStep5TrabajoTerminado(e.target.checked)}
                        className="w-4 h-4 text-[#1D7EAE] rounded border-slate-300"
                      />
                      <span className="font-medium">Trabajo terminado verificado</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={step5RevisionFinal}
                        onChange={(e) => setStep5RevisionFinal(e.target.checked)}
                        className="w-4 h-4 text-[#1D7EAE] rounded border-slate-300"
                      />
                      <span className="font-medium">Revisión final realizada</span>
                    </label>

                    {step5Error && (
                      <p className="text-xs text-red-600">{step5Error}</p>
                    )}

                    <button
                      type="button"
                      disabled={isActionProcessing}
                      onClick={handleStep5MarcarTerminadoYRevision}
                      className="w-full py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Marcar como terminado y registrar revisión final</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. Terminado: registrar la entrega del vehículo al cliente */}
              {currentWorkflowStep === 'terminado' && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Paso siguiente: Registrar la entrega del vehículo al cliente
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    El trabajo mecánico y la revisión final han concluido. Registra la entrega del vehículo al cliente para completar el servicio.
                  </p>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-900 font-semibold">
                      <input
                        type="checkbox"
                        checked={step6Entregado}
                        onChange={(e) => setStep6Entregado(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                      />
                      <span>Vehículo entregado al cliente</span>
                    </label>

                    {step6Error && (
                      <p className="text-xs text-red-600">{step6Error}</p>
                    )}

                    <button
                      type="button"
                      disabled={isActionProcessing}
                      onClick={handleStep6RegistrarEntrega}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Registrar entrega al cliente</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Entregado: mostrar únicamente un mensaje de confirmación de servicio completado */}
              {currentWorkflowStep === 'entregado' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">
                      Servicio completado
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      El vehículo fue entregado satisfactoriamente al cliente.
                    </p>
                    {continuarOrden.fechaHoraEntrega && (
                      <p className="text-xs text-slate-500 mt-1">
                        Fecha y hora de entrega: <strong className="text-slate-800">{continuarOrden.fechaHoraEntrega}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const ord = continuarOrden;
                  setContinuarOrden(null);
                  handleOpenEdit(ord);
                }}
                className="text-xs text-[#1D7EAE] hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Abrir formulario completo</span>
              </button>

              <button
                type="button"
                onClick={() => setContinuarOrden(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FORMULARIO AGREGAR / EDITAR */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingOrden ? `Editar orden (${editingOrden.folio})` : 'Nueva orden de trabajo'}
                </h3>
                {editingOrden && (
                  <p className="text-xs text-slate-500">Folio asignado: {editingOrden.folio}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const dirty =
                    formClientId !== (editingOrden?.clienteId || clientes[0]?.id || '') ||
                    formVehiculoId !== (editingOrden?.vehiculoId || '') ||
                    formServicio.trim() !== (editingOrden?.servicio || '') ||
                    formKm.trim() !== (editingOrden?.kilometraje || '');
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

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Selector opcional: Servicio del catálogo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogInModal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                >
                  <option value="">Seleccionar del catálogo o escribir abajo...</option>
                  {activeCatalogServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (${s.total.toFixed(2)} MXN)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Al seleccionar un servicio activo se completa la descripción del trabajo automáticamente.
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción del trabajo solicitado <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formServicio}
                  onChange={(e) => {
                    setFormServicio(e.target.value);
                    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
                  }}
                  placeholder="Ej. Revisión general, cambio de balatas delanteras y cambio de aceite"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.servicio ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.servicio && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.servicio}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado de la orden <span className="text-red-500">*</span>
                </label>
                <select
                  value={formEstado}
                  onChange={(e) => {
                    setFormEstado(e.target.value as EstadoOrden);
                    if (formErrors.estado) setFormErrors((prev) => ({ ...prev, estado: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.estado ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                >
                  <option value="Por autorizar">Por autorizar</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Terminado">Terminado</option>
                </select>
                {formErrors.estado && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{formErrors.estado}</span>
                  </p>
                )}
              </div>

              {/* Asignación de mecánico (ETAPA 20) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mecánico asignado <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={formMecanicoId}
                  disabled={isMecanico}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setFormMecanicoId(selId);
                    const found = availableMecanicos.find((m) => m.id === selId);
                    setFormMecanicoNombre(found ? found.nombre : '');
                  }}
                  className={`w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    isMecanico ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                  }`}
                >
                  <option value="">-- Sin mecánico asignado --</option>
                  {availableMecanicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      🔧 {m.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {isMecanico
                    ? 'Técnico asignado a esta orden de trabajo.'
                    : 'Al vincular un mecánico, la orden le aparecerá únicamente a él en su sesión de trabajo.'}
                </p>
              </div>

              {/* Apartados desplegables en formulario */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenRecepcion(!openRecepcion)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span>1. Recepción (Kilometraje y daños visibles)</span>
                  {openRecepcion ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {openRecepcion && (
                  <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Kilometraje de recepción (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formKm}
                        onChange={(e) => setFormKm(e.target.value)}
                        placeholder="Ej. 78,500 km"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Daños visibles preexistentes (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={formDaños}
                        onChange={(e) => setFormDaños(e.target.value)}
                        placeholder="Ej. Rayón en puerta derecha..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Fecha prometida de entrega (Opcional)
                      </label>
                      <input
                        type="date"
                        value={formFechaEntregaPrometida}
                        onChange={(e) => setFormFechaEntregaPrometida(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-800 bg-white"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Permite detectar entregas vencidas y generar avisos operativos automáticamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenTrabajo(!openTrabajo)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span>2. Trabajo (Diagnóstico y observaciones del mecánico)</span>
                  {openTrabajo ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {openTrabajo && (
                  <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                    {isRecepcion && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                        Tu rol (Recepción) no puede registrar trabajo técnico ni diagnóstico. Estos campos corresponden al mecánico asignado.
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Diagnóstico técnico (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isRecepcion}
                        value={formDiagnostico}
                        onChange={(e) => setFormDiagnostico(e.target.value)}
                        placeholder="Detalle de diagnóstico..."
                        className={`w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-800 ${
                          isRecepcion ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Observaciones del mecánico (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isRecepcion}
                        value={formObsMecanico}
                        onChange={(e) => setFormObsMecanico(e.target.value)}
                        placeholder="Observaciones técnicas..."
                        className={`w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-800 ${
                          isRecepcion ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenRevision(!openRevision)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span>3. Revisión y entrega</span>
                  {openRevision ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {openRevision && (
                  <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                    {formErrors.entrega && (
                      <p className="text-xs text-red-600">{formErrors.entrega}</p>
                    )}
                    <label className={`flex items-center gap-2 text-xs ${isRecepcion ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={isRecepcion}
                        checked={formTrabajoTerminado}
                        onChange={(e) => setFormTrabajoTerminado(e.target.checked)}
                        className="w-4 h-4 text-[#1D7EAE] rounded"
                      />
                      <span>Trabajo terminado {isRecepcion && '(Solo mecánico)'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formRevisionFinal}
                        onChange={(e) => setFormRevisionFinal(e.target.checked)}
                        className="w-4 h-4 text-[#1D7EAE] rounded"
                      />
                      <span>Revisión final realizada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold pt-1 border-t">
                      <input
                        type="checkbox"
                        checked={formEntregado}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormEntregado(checked);
                          if (checked && formEstado !== 'Terminado') setFormEstado('Terminado');
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Vehículo entregado al cliente</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Apartado desplegable: 4. Refacciones utilizadas (solo en edición de orden) */}
              {editingOrden && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenRefaccionesInEdit(!openRefaccionesInEdit)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>4. Refacciones utilizadas</span>
                      {editingOrden.refaccionesUtilizadas && editingOrden.refaccionesUtilizadas.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {editingOrden.refaccionesUtilizadas.reduce(
                            (sum, u) => sum + (u.cantidad - (u.devueltas || 0)),
                            0
                          )}{' '}
                          pzs
                        </span>
                      )}
                    </div>
                    {openRefaccionesInEdit ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openRefaccionesInEdit && (
                    <div className="p-4 bg-white space-y-3 border-t border-slate-200 text-xs">
                      {editingOrden.refaccionesUtilizadas && editingOrden.refaccionesUtilizadas.length > 0 ? (
                        <div className="space-y-2">
                          {editingOrden.refaccionesUtilizadas.map((item) => {
                            const ref = refaccionMap.get(item.refaccionId);
                            const netQuantity = item.cantidad - (item.devueltas || 0);
                            const isReturning = returningItemId === item.id;

                            return (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                                        {ref ? ref.codigo : 'REF'}
                                      </span>
                                      <span>{ref ? ref.nombre : 'Refacción'}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      Asignadas: <strong>{item.cantidad}</strong> pzs
                                      {item.devueltas > 0 && (
                                        <span className="text-amber-700 ml-1.5 font-medium">
                                          (Devueltas: {item.devueltas} pzs)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {netQuantity} en orden
                                    </span>
                                    {netQuantity > 0 && !isReturning && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReturningItemId(item.id);
                                          setReturningCantidad('1');
                                          setReturningError('');
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Devolver</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isReturning && (
                                  <div className="p-2.5 bg-white border border-rose-200 rounded-md space-y-2 text-xs">
                                    <div className="flex justify-between items-center text-slate-700 font-semibold">
                                      <span>Devolver piezas:</span>
                                      <span className="text-[11px] text-slate-500 font-normal">
                                        Máx: {netQuantity} pzs
                                      </span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="number"
                                        min="1"
                                        max={netQuantity}
                                        step="1"
                                        value={returningCantidad}
                                        onChange={(e) => setReturningCantidad(e.target.value)}
                                        className="w-20 p-1.5 border border-slate-200 rounded text-slate-800 text-xs"
                                      />
                                      <button
                                        type="button"
                                        disabled={isActionProcessing}
                                        onClick={() => handleConfirmReturnRefaccion(editingOrden, item)}
                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs"
                                      >
                                        Confirmar devolución
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReturningItemId(null)}
                                        className="px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 text-xs"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    {returningError && (
                                      <p className="text-rose-600 text-[11px]">{returningError}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No hay refacciones registradas en esta orden.</p>
                      )}

                      {/* Registrar refacción */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="font-semibold text-slate-700 block">
                          Registrar refacción:
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={selectedRefaccionId}
                            onChange={(e) => {
                              setSelectedRefaccionId(e.target.value);
                              setRefaccionError('');
                            }}
                            className="flex-1 p-2 border border-slate-200 rounded text-slate-800 bg-white text-xs"
                          >
                            <option value="">Seleccionar refacción...</option>
                            {refacciones.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.codigo} — {r.nombre} (Disponibles: {r.existencias} pzs)
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={selectedRefaccionCantidad}
                              onChange={(e) => {
                                setSelectedRefaccionCantidad(e.target.value);
                                setRefaccionError('');
                              }}
                              className="w-20 p-2 border border-slate-200 rounded text-slate-800 text-xs"
                            />
                            <button
                              type="button"
                              disabled={!selectedRefaccionId || isActionProcessing}
                              onClick={() => handleConfirmUseRefaccion(editingOrden)}
                              className="px-3 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Confirmar uso
                            </button>
                          </div>
                        </div>
                        {refaccionError && (
                          <p className="text-rose-600 text-xs">{refaccionError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const dirty =
                      formClientId !== (editingOrden?.clienteId || clientes[0]?.id || '') ||
                      formVehiculoId !== (editingOrden?.vehiculoId || '') ||
                      formServicio.trim() !== (editingOrden?.servicio || '') ||
                      formKm.trim() !== (editingOrden?.kilometraje || '');
                    if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                      return;
                    }
                    setIsFormModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#5F6B73] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VER / IMPRIMIR */}
      {/* ======================================================== */}
      {printingOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 print-area">
            <div className="no-print bg-white border-b border-[#DDE4E8] text-[#231F20] px-6 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Vista previa de orden de trabajo</span>
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
                  onClick={() => setPrintingOrden(null)}
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
                  <div className="text-xs text-slate-500">Folio de orden</div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {printingOrden.folio}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha de recepción:{' '}
                    {new Date(printingOrden.creadoEn).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border">
                      Estado: {printingOrden.estado}
                    </span>
                    {printingOrden.entregado && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Entregado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Datos del cliente
                  </h4>
                  {(() => {
                    const c = clienteMap.get(printingOrden.clienteId);
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
                    const v = vehiculoMap.get(printingOrden.vehiculoId);
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
                        {printingOrden.kilometraje && (
                          <p className="text-xs text-slate-600">
                            Km registrado: {printingOrden.kilometraje}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Vehículo no encontrado</p>
                    );
                  })()}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Trabajo solicitado
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {printingOrden.servicio}
                </div>
              </div>

              {printingOrden.dañosVisibles && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Daños visibles en recepción
                  </h4>
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-slate-700">
                    {printingOrden.dañosVisibles}
                  </div>
                </div>
              )}

              {(printingOrden.diagnostico || printingOrden.observacionesMecanico || printingOrden.observaciones) && (
                <div className="space-y-3">
                  {printingOrden.diagnostico && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Diagnóstico técnico
                      </h4>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                        {printingOrden.diagnostico}
                      </div>
                    </div>
                  )}

                  {(printingOrden.observacionesMecanico || printingOrden.observaciones) && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Observaciones del mecánico
                      </h4>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800">
                        {printingOrden.observacionesMecanico || printingOrden.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {printingOrden.refaccionesUtilizadas && printingOrden.refaccionesUtilizadas.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Refacciones utilizadas
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Refacción</th>
                          <th className="py-2 px-3 text-center">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {printingOrden.refaccionesUtilizadas.map((u) => {
                          const ref = refaccionMap.get(u.refaccionId);
                          const net = u.cantidad - (u.devueltas || 0);
                          if (net <= 0) return null;
                          return (
                            <tr key={u.id}>
                              <td className="py-2 px-3 font-mono text-[11px] font-bold text-amber-800">
                                {ref ? ref.codigo : 'REF'}
                              </td>
                              <td className="py-2 px-3 text-slate-800">
                                {ref ? ref.nombre : 'Refacción'}
                              </td>
                              <td className="py-2 px-3 text-center font-semibold text-slate-900">
                                {net} pzs
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Control de calidad y entrega
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      printingOrden.trabajoTerminado ? 'bg-[#1D7EAE] text-white border-[#1D7EAE]' : 'bg-white border-slate-300'
                    }`}>
                      {printingOrden.trabajoTerminado ? '✓' : ''}
                    </span>
                    <span>Trabajo terminado</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      printingOrden.revisionFinal ? 'bg-[#1D7EAE] text-white border-[#1D7EAE]' : 'bg-white border-slate-300'
                    }`}>
                      {printingOrden.revisionFinal ? '✓' : ''}
                    </span>
                    <span>Revisión final</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      printingOrden.entregado ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300'
                    }`}>
                      {printingOrden.entregado ? '✓' : ''}
                    </span>
                    <span>Vehículo entregado</span>
                  </div>
                </div>

                {printingOrden.fechaHoraEntrega && (
                  <p className="text-slate-500 pt-1 border-t border-slate-200">
                    Fecha y hora de entrega:{' '}
                    <strong className="text-slate-800">{printingOrden.fechaHoraEntrega}</strong>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-10 pt-8 text-center text-xs text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  Firma del responsable del taller
                </div>
                <div className="border-t border-slate-300 pt-2">
                  Firma de conformidad del cliente
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                Este documento es una orden de trabajo de {configuracion?.nombre || 'IOT Technologies'} con fines de demostración.
              </div>
            </div>

            <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPrintingOrden(null)}
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
                <span>Imprimir orden</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
