import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Factura,
  Garantia,
  Seguimiento,
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
  Sparkles,
  Eye,
} from 'lucide-react';
import { TunnoLogo } from './TunnoLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { AsistenciaTecnicaModal } from './AsistenciaTecnicaModal';
import { RevisionFinalModal } from './RevisionFinalModal';
import { ContextualHelp } from './ContextualHelp';
import {
  RevisionInteligenteServicioPanel,
  HallazgoRevisionServicio,
} from './RevisionInteligenteServicioPanel';
import { SectionId } from '../types';

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
  facturas?: Factura[];
  garantias?: Garantia[];
  onSaveSeguimiento?: (seguimiento: Seguimiento) => void;
  onNavigateToSection?: (section: SectionId) => void;
  onOpenCopiloto?: () => void;
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
  facturas = [],
  garantias = [],
  onSaveSeguimiento,
  onNavigateToSection,
  onOpenCopiloto,
}) => {
  const [filter, setFilter] = useState<EstadoFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown portal menu state (renderizado fuera de la tabla para evitar recorte)
  const [activeMenuOrden, setActiveMenuOrden] = useState<{
    orden: OrdenTrabajo;
    top: number;
    left: number;
  } | null>(null);

  const handleToggleMenu = (e: React.MouseEvent, ord: OrdenTrabajo) => {
    e.stopPropagation();
    if (activeMenuOrden?.orden.id === ord.id) {
      setActiveMenuOrden(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const menuHeight = 280;
    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight) {
      top = Math.max(8, rect.top - menuHeight - 4);
    }
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    setActiveMenuOrden({
      orden: ord,
      top,
      left,
    });
  };

  // Modal: Add / Edit (traditional form)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenTrabajo | null>(null);

  // Modal: Continuar Workflow (ETAPA 7)
  const [continuarOrden, setContinuarOrden] = useState<OrdenTrabajo | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Modal: Asistencia Técnica con IA
  const [asistenciaOrden, setAsistenciaOrden] = useState<OrdenTrabajo | null>(null);

  // Modal: Revisión Final con IA (Órdenes terminadas)
  const [revisionFinalOrden, setRevisionFinalOrden] = useState<OrdenTrabajo | null>(null);

  // Panel: Revisión inteligente del servicio con IA
  const [revisionServicioOrden, setRevisionServicioOrden] = useState<OrdenTrabajo | null>(null);

  const handleOpenRevisionServicio = (ord: OrdenTrabajo) => {
    setRevisionServicioOrden(ord);
  };

  const handleEjecutarAccionRevision = (hallazgo: HallazgoRevisionServicio, ord: OrdenTrabajo) => {
    if (hallazgo.accionDestino.destino === 'control_calidad') {
      setRevisionServicioOrden(null);
      setRevisionFinalOrden(ord);
      return;
    }

    if (hallazgo.accionDestino.destino === 'facturacion') {
      setRevisionServicioOrden(null);
      if (onNavigateToSection) onNavigateToSection('facturacion');
      return;
    }

    if (hallazgo.accionDestino.destino === 'cotizaciones') {
      setRevisionServicioOrden(null);
      if (onNavigateToSection) onNavigateToSection('cotizaciones');
      return;
    }

    if (hallazgo.accionDestino.destino === 'cliente') {
      setRevisionServicioOrden(null);
      if (onNavigateToSection) onNavigateToSection('clientes');
      return;
    }

    if (
      hallazgo.accionDestino.destino === 'diagnostico' ||
      hallazgo.accionDestino.destino === 'refacciones'
    ) {
      setRevisionServicioOrden(null);
      handleOpenContinuar(ord);
      setIsAccordionOpen(true);
      return;
    }

    if (
      hallazgo.accionDestino.destino === 'mecanico' ||
      hallazgo.accionDestino.destino === 'kilometraje' ||
      hallazgo.accionDestino.destino === 'fecha_prometida' ||
      hallazgo.accionDestino.destino === 'observaciones'
    ) {
      setRevisionServicioOrden(null);
      handleOpenEdit(ord);
      return;
    }

    setRevisionServicioOrden(null);
    handleOpenContinuar(ord);
  };

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
  const [formTrabajoTerminado, setFormTrabajoTerminado] = useState(false);
  const [formRevisionFinal, setFormRevisionFinal] = useState(false);
  const [formEntregado, setFormEntregado] = useState(false);
  const [formFechaHoraEntrega, setFormFechaHoraEntrega] = useState<string | undefined>(undefined);
  const [formMecanicoId, setFormMecanicoId] = useState('');
  const [formMecanicoNombre, setFormMecanicoNombre] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isMecanico = currentUser?.rol === 'Mecánico' || currentUser?.rol === 'Técnico';
  const isRecepcion = currentUser?.rol === 'Recepción' || currentUser?.rol === 'Recepción/CRM';
  const isCaja = currentUser?.rol === 'Caja';
  const isControlCalidad = currentUser?.rol === 'Control de calidad';
  const isAdmin = currentUser?.rol === 'Administrador';
  const canCreateOrden = isAdmin || isRecepcion;

  const availableMecanicos = useMemo(() => {
    const list: { id: string; nombre: string }[] = [];
    usuarios
      .filter((u) => (u.rol === 'Mecánico' || u.rol === 'Técnico') && u.activo)
      .forEach((u) => {
        list.push({ id: u.id, nombre: u.nombre });
      });
    empleados
      .filter((e) => e.activo && (e.puesto.toLowerCase().includes('mecánic') || e.puesto.toLowerCase().includes('técnic') || e.puesto.toLowerCase().includes('taller')))
      .forEach((e) => {
        if (!list.some((m) => m.nombre === e.nombre)) {
          list.push({ id: e.id, nombre: e.nombre });
        }
      });
    return list;
  }, [usuarios, empleados]);

  // View / Print modal state
  const [printingOrden, setPrintingOrden] = useState<OrdenTrabajo | null>(null);

  const initialFormValuesRef = useRef({
    clientId: '',
    vehiculoId: '',
    servicio: '',
    km: '',
    daños: '',
    fechaEntrega: '',
    diagnostico: '',
    obsMecanico: '',
    mecanicoId: '',
    trabajoTerminado: false,
    revisionFinal: false,
    entregado: false,
  });

  const orderFormDismiss = useModalDismiss({
    isOpen: isFormModalOpen,
    onClose: () => {
      setIsFormModalOpen(false);
      setEditingOrden(null);
      setFormErrors({});
    },
    isDirty: () => {
      const init = initialFormValuesRef.current;
      return (
        formClientId !== init.clientId ||
        formVehiculoId !== init.vehiculoId ||
        formServicio.trim() !== init.servicio.trim() ||
        formKm.trim() !== init.km.trim() ||
        formDaños.trim() !== init.daños.trim() ||
        formFechaEntregaPrometida !== init.fechaEntrega ||
        formDiagnostico.trim() !== init.diagnostico.trim() ||
        formObsMecanico.trim() !== init.obsMecanico.trim() ||
        formMecanicoId !== init.mecanicoId ||
        formTrabajoTerminado !== init.trabajoTerminado ||
        formRevisionFinal !== init.revisionFinal ||
        formEntregado !== init.entregado
      );
    },
    closeOnBackdrop: true,
  });

  const continuarModalDismiss = useModalDismiss({
    isOpen: Boolean(continuarOrden),
    onClose: () => setContinuarOrden(null),
    closeOnBackdrop: true,
  });

  const printingModalDismiss = useModalDismiss({
    isOpen: Boolean(printingOrden),
    onClose: () => setPrintingOrden(null),
    closeOnBackdrop: true,
  });

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

  // Costeo real por orden state (Flotillas & Costeo)
  const [formCostoRealRefacciones, setFormCostoRealRefacciones] = useState('0');
  const [formCostoRealManoObra, setFormCostoRealManoObra] = useState('0');
  const [openCosteoRealInEdit, setOpenCosteoRealInEdit] = useState(false);

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

  // Helper para cálculo de costeo real, comparación con cotización y semáforo discreto
  const getRentabilidadOrden = (ord: OrdenTrabajo) => {
    // 1. Costo real de refacciones utilizadas: omitir piezas devueltas
    let costoRefCalculado = 0;
    if (ord.refaccionesUtilizadas && ord.refaccionesUtilizadas.length > 0) {
      ord.refaccionesUtilizadas.forEach((u) => {
        const netQty = Math.max(0, u.cantidad - (u.devueltas || 0));
        if (netQty > 0) {
          const ref = refaccionMap.get(u.refaccionId);
          const costoUnit = ref?.precioCompra ?? ref?.costoUnitario ?? 0;
          costoRefCalculado += netQty * costoUnit;
        }
      });
    }

    const costoRefReal = ord.costoRealRefacciones !== undefined ? ord.costoRealRefacciones : costoRefCalculado;
    const costoMoReal = ord.costoRealManoObra !== undefined ? ord.costoRealManoObra : 0;
    const costoTotalReal = Math.round((costoRefReal + costoMoReal) * 100) / 100;

    // 2. Comparar con cotización aprobada
    const linkedCot = ord.cotizacionId
      ? cotizacionMap.get(ord.cotizacionId)
      : cotizaciones.find((c) => c.ordenId === ord.id);
    const isCotAprobada = linkedCot && linkedCot.estado === 'Aprobada';
    const precioAprobado = isCotAprobada
      ? linkedCot.total
      : (ord.precioCobrado || linkedCot?.total || 0);

    // 3. Utilidad y margen real
    const utilidadReal = Math.round((precioAprobado - costoTotalReal) * 100) / 100;
    const margenReal = precioAprobado > 0 ? Math.round(((utilidadReal / precioAprobado) * 100) * 10) / 10 : 0;

    // 4. Semáforo discreto: verde para rentable, amarillo para margen bajo y rojo para pérdida
    let semaforo: 'verde' | 'amarillo' | 'rojo' | 'neutro';
    if (precioAprobado <= 0) {
      semaforo = 'neutro';
    } else if (utilidadReal < 0 || margenReal < 0) {
      semaforo = 'rojo'; // Pérdida
    } else if (margenReal < 20) {
      semaforo = 'amarillo'; // Margen bajo
    } else {
      semaforo = 'verde'; // Rentable
    }

    return {
      costoRefCalculado,
      costoRefReal,
      costoMoReal,
      costoTotalReal,
      linkedCot,
      isCotAprobada,
      precioAprobado,
      utilidadReal,
      margenReal,
      semaforo,
    };
  };

  // Semáforo de entrega: Verde (en tiempo/entregada), Amarillo (hoy o en 2 días), Rojo (vencida con días de atraso), Gris (sin fecha)
  const getIndicadorEntrega = (orden: OrdenTrabajo) => {
    // Verde: orden en tiempo, terminada o entregada
    if (orden.entregado || orden.estado === 'Terminado' || orden.trabajoTerminado) {
      return {
        color: 'verde' as const,
        texto: orden.entregado ? 'Entregada' : 'Terminada a tiempo',
        detalle: orden.fechaEntregaPrometida ? `Prometida: ${orden.fechaEntregaPrometida}` : 'Servicio finalizado',
      };
    }

    // Gris: orden sin fecha prometida de entrega
    if (!orden.fechaEntregaPrometida || !orden.fechaEntregaPrometida.trim()) {
      return {
        color: 'gris' as const,
        texto: 'Sin fecha prometida',
        detalle: 'No se programó fecha de entrega',
      };
    }

    // Parse YYYY-MM-DD local
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const partes = orden.fechaEntregaPrometida.split('-');
    let fechaProm: Date;
    if (partes.length === 3) {
      fechaProm = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    } else {
      fechaProm = new Date(orden.fechaEntregaPrometida);
    }
    fechaProm.setHours(0, 0, 0, 0);

    const diffMs = fechaProm.getTime() - hoy.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      const atraso = Math.abs(diffDias);
      return {
        color: 'rojo' as const,
        texto: `Vencida (${atraso} día${atraso === 1 ? '' : 's'} atraso)`,
        detalle: `Debió entregarse el ${orden.fechaEntregaPrometida}`,
        diasAtraso: atraso,
      };
    } else if (diffDias === 0) {
      return {
        color: 'amarillo' as const,
        texto: 'Entrega para hoy',
        detalle: `Programada hoy ${orden.fechaEntregaPrometida}`,
      };
    } else if (diffDias <= 2) {
      return {
        color: 'amarillo' as const,
        texto: `Entrega en ${diffDias} día${diffDias === 1 ? '' : 's'}`,
        detalle: `Programada el ${orden.fechaEntregaPrometida}`,
      };
    } else {
      return {
        color: 'verde' as const,
        texto: `En tiempo (${diffDias} días)`,
        detalle: `Programada el ${orden.fechaEntregaPrometida}`,
      };
    }
  };

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

  // Handlers: Asistencia Técnica con IA
  const handleOpenAsistenciaTecnica = (orden: OrdenTrabajo) => {
    setAsistenciaOrden(orden);
  };

  const handleAplicarDiagnosticoDesdeAsistencia = (nuevoDiagnostico: string) => {
    if (!asistenciaOrden) return;

    // Si estamos editando en el modal de formulario tradicional, actualizar el estado del formulario en vivo
    if (isFormModalOpen) {
      setFormDiagnostico(nuevoDiagnostico);
    }

    const ordenActualizada: OrdenTrabajo = {
      ...asistenciaOrden,
      diagnostico: nuevoDiagnostico,
      actualizadoEn: new Date().toISOString(),
    };

    onSaveOrden(ordenActualizada);

    if (continuarOrden && continuarOrden.id === asistenciaOrden.id) {
      setContinuarOrden(ordenActualizada);
    }
    if (editingOrden && editingOrden.id === asistenciaOrden.id) {
      setEditingOrden(ordenActualizada);
    }
    setAsistenciaOrden(ordenActualizada);
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
    setFormCostoRealRefacciones('0');
    setFormCostoRealManoObra('0');
    setOpenCosteoRealInEdit(false);

    setOpenRecepcion(true);
    setOpenTrabajo(false);
    setOpenRevision(false);
    setFormErrors({});
    initialFormValuesRef.current = {
      clientId: defClient,
      vehiculoId: clientVehs[0]?.id || '',
      servicio: '',
      km: '',
      daños: '',
      fechaEntrega: '',
      diagnostico: '',
      obsMecanico: '',
      mecanicoId: '',
      trabajoTerminado: false,
      revisionFinal: false,
      entregado: false,
    };
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

    // Inicializar costos reales
    let initialCostoRef = orden.costoRealRefacciones;
    if (initialCostoRef === undefined) {
      let sum = 0;
      if (orden.refaccionesUtilizadas && orden.refaccionesUtilizadas.length > 0) {
        orden.refaccionesUtilizadas.forEach((u) => {
          const netQty = Math.max(0, u.cantidad - (u.devueltas || 0));
          if (netQty > 0) {
            const ref = refaccionMap.get(u.refaccionId);
            sum += netQty * (ref?.precioCompra ?? ref?.costoUnitario ?? 0);
          }
        });
      }
      initialCostoRef = sum;
    }
    setFormCostoRealRefacciones((initialCostoRef ?? 0).toString());
    setFormCostoRealManoObra((orden.costoRealManoObra ?? 0).toString());
    setOpenCosteoRealInEdit(false);

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
    setActiveMenuOrden(null);
    initialFormValuesRef.current = {
      clientId: orden.clienteId,
      vehiculoId: orden.vehiculoId,
      servicio: orden.servicio,
      km: orden.kilometraje || '',
      daños: orden.dañosVisibles || '',
      fechaEntrega: orden.fechaEntregaPrometida || '',
      diagnostico: orden.diagnostico || '',
      obsMecanico: orden.observacionesMecanico || orden.observaciones || '',
      mecanicoId: orden.mecanicoId || '',
      trabajoTerminado: Boolean(orden.trabajoTerminado),
      revisionFinal: Boolean(orden.revisionFinal),
      entregado: Boolean(orden.entregado),
    };
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

    const cRefVal = parseFloat(formCostoRealRefacciones) || 0;
    const cMoVal = parseFloat(formCostoRealManoObra) || 0;
    const cTotalVal = Math.round((cRefVal + cMoVal) * 100) / 100;

    const linkedCot = editingOrden?.cotizacionId
      ? cotizacionMap.get(editingOrden.cotizacionId)
      : cotizaciones.find((c) => c.ordenId === editingOrden?.id);
    const precioBase = linkedCot && linkedCot.estado === 'Aprobada'
      ? linkedCot.total
      : (editingOrden?.precioCobrado || linkedCot?.total || 0);

    const utilidadVal = Math.round((precioBase - cTotalVal) * 100) / 100;
    const margenVal = precioBase > 0 ? Math.round(((utilidadVal / precioBase) * 100) * 10) / 10 : 0;

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
      costoRealRefacciones: cRefVal,
      costoRealManoObra: cMoVal,
      costoRealTotal: cTotalVal,
      precioCobrado: precioBase,
      utilidadReal: utilidadVal,
      margenRealPorcentaje: margenVal,
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
      {/* Encabezado TUNNO para Órdenes */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1497F2]/10 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight">
                {isMecanico ? 'Órdenes asignadas' : 'Órdenes de trabajo'}
              </h2>
              {isMecanico && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Técnico
                </span>
              )}
              {isRecepcion && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  Recepción/CRM
                </span>
              )}
              {isControlCalidad && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  Control de calidad
                </span>
              )}
              {isCaja && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Caja
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              {isMecanico
                ? `Órdenes asignadas a ${currentUser?.nombre}. Registra diagnóstico, observaciones, refacciones y finaliza trabajos.`
                : isControlCalidad
                ? 'Revisión y validación de trabajos terminados.'
                : isCaja
                ? 'Consulta del resumen de órdenes para facturación y cobro.'
                : 'Control de recepción, diagnóstico, progreso y entrega de vehículos.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenCopiloto && (
            <button
              type="button"
              onClick={onOpenCopiloto}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg bg-sky-50 hover:bg-sky-100/80 text-[#06345A] border border-[#73C7FF]/50 text-xs md:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Abrir Copiloto de Órdenes de Trabajo"
            >
              <Sparkles className="w-4 h-4 text-[#1497F2]" />
              <span>Ayudarme con IA</span>
            </button>
          )}

          {canCreateOrden && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva orden</span>
            </button>
          )}
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
            onClick={() => setFilter('Pendiente')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Pendiente'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            Pendiente
          </button>
          <button
            type="button"
            onClick={() => setFilter('En proceso')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'En proceso'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
            }`}
          >
            En proceso
          </button>
          <button
            type="button"
            onClick={() => setFilter('Terminado')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filter === 'Terminado'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-[#6B7280] hover:text-[#06345A]'
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
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Cliente y vehículo</th>
                <th className="py-3.5 px-4">Trabajo solicitado</th>
                <th className="py-3.5 px-4 text-center">Costeo y rentabilidad</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Entrega</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrdenes.length > 0 ? (
                filteredOrdenes.map((ord) => {
                  const client = clienteMap.get(ord.clienteId);
                  const veh = vehiculoMap.get(ord.vehiculoId);
                  const linkedCot = ord.cotizacionId ? cotizacionMap.get(ord.cotizacionId) : undefined;
                  const rent = getRentabilidadOrden(ord);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Folio */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs">
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

                      {/* Costeo real y Semáforo discreto */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {rent.semaforo === 'verde' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Utilidad: +$${rent.utilidadReal.toLocaleString('es-MX')}`}>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Rentable ({rent.margenReal}%)</span>
                          </span>
                        )}
                        {rent.semaforo === 'amarillo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title={`Margen estrecho: +$${rent.utilidadReal.toLocaleString('es-MX')}`}>
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Margen bajo ({rent.margenReal}%)</span>
                          </span>
                        )}
                        {rent.semaforo === 'rojo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200" title={`Pérdida estimada: -$${Math.abs(rent.utilidadReal).toLocaleString('es-MX')}`}>
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Pérdida ({rent.margenReal}%)</span>
                          </span>
                        )}
                        {rent.semaforo === 'neutro' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            <span>Sin cotización</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Costo ${rent.costoTotalReal.toFixed(2)} / Aprob ${rent.precioAprobado.toFixed(2)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-center">
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Entregado</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Semáforo de entrega */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {(() => {
                          const sem = getIndicadorEntrega(ord);
                          return (
                            <div className="flex flex-col items-center gap-1">
                              {sem.color === 'verde' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  title={sem.detalle}
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>{sem.texto}</span>
                                </span>
                              )}
                              {sem.color === 'amarillo' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                  title={sem.detalle}
                                >
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  <span>{sem.texto}</span>
                                </span>
                              )}
                              {sem.color === 'rojo' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                                  title={sem.detalle}
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                  <span>{sem.texto}</span>
                                </span>
                              )}
                              {sem.color === 'gris' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
                                  title={sem.detalle}
                                >
                                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                  <span>{sem.texto}</span>
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">
                                {ord.fechaEntregaPrometida ? `Prom: ${ord.fechaEntregaPrometida}` : 'Sin fecha prometida'}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Acciones: Visible Ver + Menú de tres puntos */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => (isCaja ? setPrintingOrden(ord) : handleOpenContinuar(ord))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-[#06345A] bg-sky-50 hover:bg-sky-100 border border-[#73C7FF]/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={`Ver detalle formal de ${ord.folio}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1497F2]" />
                            <span>Ver</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleMenu(e, ord)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              activeMenuOrden?.orden.id === ord.id
                                ? 'bg-slate-200 text-slate-900'
                                : 'text-[#6B7280] hover:text-[#06345A] hover:bg-slate-100'
                            }`}
                            title="Más opciones"
                            aria-label={`Más opciones para ${ord.folio}`}
                            aria-haspopup="menu"
                            aria-expanded={activeMenuOrden?.orden.id === ord.id}
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
                  <td colSpan={7} className="py-8 text-center text-slate-400">
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
                      <p className="font-medium text-[#06345A] text-sm">{client?.nombre || 'Cliente no encontrado'}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
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
                      {/* Semáforo de entrega en móvil */}
                      {(() => {
                        const semMobile = getIndicadorEntrega(ord);
                        return (
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[11px] text-slate-500 font-medium">Entrega:</span>
                            {semMobile.color === 'verde' && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                                title={semMobile.detalle}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>{semMobile.texto}</span>
                              </span>
                            )}
                            {semMobile.color === 'amarillo' && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                title={semMobile.detalle}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>{semMobile.texto}</span>
                              </span>
                            )}
                            {semMobile.color === 'rojo' && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                                title={semMobile.detalle}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>{semMobile.texto}</span>
                              </span>
                            )}
                            {semMobile.color === 'gris' && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                                title={semMobile.detalle}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span>{semMobile.texto}</span>
                              </span>
                            )}
                            {ord.fechaEntregaPrometida && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({ord.fechaEntregaPrometida})
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Semáforo discreto y costos en móvil */}
                      {(() => {
                        const rentMobile = getRentabilidadOrden(ord);
                        return (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-1">
                            <div>
                              {rentMobile.semaforo === 'verde' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Rentable ({rentMobile.margenReal}%)</span>
                                </span>
                              )}
                              {rentMobile.semaforo === 'amarillo' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>Margen bajo ({rentMobile.margenReal}%)</span>
                                </span>
                              )}
                              {rentMobile.semaforo === 'rojo' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  <span>Pérdida ({rentMobile.margenReal}%)</span>
                                </span>
                              )}
                              {rentMobile.semaforo === 'neutro' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>Sin cotización</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Costo ${rentMobile.costoTotalReal.toFixed(2)} / Aprob ${rentMobile.precioAprobado.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => (isCaja ? setPrintingOrden(ord) : handleOpenContinuar(ord))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold text-[#06345A] bg-sky-50 hover:bg-sky-100 border border-[#73C7FF]/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#1497F2]" />
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleMenu(e, ord)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          activeMenuOrden?.orden.id === ord.id
                            ? 'bg-slate-200 text-slate-900'
                            : 'text-[#6B7280] hover:text-[#06345A] hover:bg-slate-100'
                        }`}
                        aria-label={`Más opciones para ${ord.folio}`}
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
                ? 'No se encontraron órdenes que coincidan con la búsqueda.'
                : filter !== 'todas'
                ? `No hay órdenes con estado "${filter}".`
                : 'No hay órdenes de trabajo registradas.'}
            </div>
          )}
        </div>

        {/* Leyenda pequeña del semáforo de entrega */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
            <span>Semáforo de entrega:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700 font-medium">Verde:</span>
              <span className="text-slate-500">En tiempo, terminada o entregada</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-700 font-medium">Amarillo:</span>
              <span className="text-slate-500">Entrega hoy o próximos 2 días</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-700 font-medium">Rojo:</span>
              <span className="text-slate-500">Vencida (muestra días de atraso)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-slate-700 font-medium">Gris:</span>
              <span className="text-slate-500">Sin fecha prometida de entrega</span>
            </span>
          </div>
        </div>
      </div>

      {/* PORTAL: MENÚ FLOTANTE DE OPCIONES (RENDERIZADO DIRECTAMENTE EN BODY PARA EVITAR RECORTE) */}
      {activeMenuOrden && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9990] bg-transparent cursor-default"
            onClick={() => setActiveMenuOrden(null)}
            aria-hidden="true"
          />

          <div
            style={{
              position: 'fixed',
              top: `${activeMenuOrden.top}px`,
              left: `${activeMenuOrden.left}px`,
            }}
            className="z-[9999] w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl py-1 text-left text-xs font-medium animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
          >
            {(() => {
              const ord = activeMenuOrden.orden;
              return (
                <>
                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleOpenContinuar(ord);
                        setActiveMenuOrden(null);
                      }}
                      className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#1497F2]" />
                      <span>{isMecanico ? 'Registrar avance' : isControlCalidad ? 'Revisar orden' : 'Ver detalle / flujo'}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setPrintingOrden(ord);
                        setActiveMenuOrden(null);
                      }}
                      className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>{isCaja ? 'Ver resumen' : 'Ver / imprimir ficha'}</span>
                    </button>

                    {!isCaja && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleOpenEdit(ord);
                          setActiveMenuOrden(null);
                        }}
                        className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                        <span>Editar orden</span>
                      </button>
                    )}
                  </div>

                  <div className="py-1 bg-sky-50/50">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleOpenRevisionServicio(ord);
                        setActiveMenuOrden(null);
                      }}
                      className="w-full px-3.5 py-2 text-[#06345A] hover:bg-sky-100/60 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                    >
                      <Sparkles className="w-4 h-4 text-[#1497F2]" />
                      <span>Revisión inteligente IA</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleOpenAsistenciaTecnica(ord);
                        setActiveMenuOrden(null);
                      }}
                      className="w-full px-3.5 py-2 text-slate-700 hover:bg-sky-100/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#1497F2]" />
                      <span>Asistencia técnica IA</span>
                    </button>

                    {(ord.estado === 'Terminado' || ord.trabajoTerminado) && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setRevisionFinalOrden(ord);
                          setActiveMenuOrden(null);
                        }}
                        className="w-full px-3.5 py-2 text-amber-800 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Revisión final con IA</span>
                      </button>
                    )}
                  </div>

                  {ord.entregado && !isMecanico && !isCaja && onRegistrarGarantia && (
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onRegistrarGarantia(ord);
                          setActiveMenuOrden(null);
                        }}
                        className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Registrar garantía</span>
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

      {/* ======================================================== */}
      {/* MODAL: CONTINUAR WORKFLOW (ETAPA 7) */}
      {/* ======================================================== */}
      {continuarOrden && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto no-print"
          onClick={continuarModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 my-6 flex flex-col">
            {/* Header: Folio, Cliente, Vehículo */}
            <div className="px-6 py-4 bg-white border-b border-[#E5E7EB] text-[#06345A] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#1497F2] font-bold text-sm bg-[#73C7FF]/20 border border-[#73C7FF]/40 px-2 py-0.5 rounded">
                    {continuarOrden.folio}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#6B7280] border border-[#E5E7EB]">
                    Estado: {continuarOrden.estado}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRevisionServicio(continuarOrden)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-[#06345A] bg-sky-50 hover:bg-sky-100 rounded-md border border-[#73C7FF]/60 hover:border-[#1497F2] transition-colors cursor-pointer"
                    title="Revisión inteligente del servicio"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#1497F2]" />
                    <span>Revisar con IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAsistenciaTecnica(continuarOrden)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-[#1497F2] bg-[#1497F2]/10 hover:bg-[#1497F2]/20 rounded-md border border-[#1497F2]/20 transition-colors cursor-pointer"
                    title="Asistencia técnica con IA"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#1497F2]" />
                    <span>Asistencia técnica con IA</span>
                  </button>
                </div>
                <h3 className="text-base font-bold text-[#06345A] mt-1">
                  {clienteMap.get(continuarOrden.clienteId)?.nombre} — {vehiculoMap.get(continuarOrden.vehiculoId)?.marca}{' '}
                  {vehiculoMap.get(continuarOrden.vehiculoId)?.modelo} ({vehiculoMap.get(continuarOrden.vehiculoId)?.placas})
                </h3>
              </div>
              <button
                type="button"
                onClick={continuarModalDismiss.handleClose}
                className="p-1 text-slate-400 hover:text-[#06345A] transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
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
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-600">Diagnóstico y Trabajo:</span>
                        <button
                          type="button"
                          onClick={() => handleOpenAsistenciaTecnica(continuarOrden)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1497F2] hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#1497F2]" />
                          <span>Asistencia técnica con IA</span>
                        </button>
                      </div>
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
                    <ContextualHelp tema="utilizar-devolver-refaccion" />
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
                                          className="w-20 p-1.5 border border-[#E5E7EB] rounded text-[#06345A] text-xs focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
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
                            className="w-full p-2 border border-[#E5E7EB] rounded text-[#06345A] bg-white text-xs focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
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
                              className="w-20 p-2 border border-[#E5E7EB] rounded text-[#06345A] text-xs focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
                            />
                            <button
                              type="button"
                              disabled={!selectedRefaccionId || isActionProcessing}
                              onClick={() => handleConfirmUseRefaccion(continuarOrden)}
                              className="flex-1 py-2 px-3 bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
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

              {/* Costeo real y rentabilidad en Continuar Workflow */}
              {(() => {
                const rent = getRentabilidadOrden(continuarOrden);
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-semibold text-slate-700">Costeo real y margen de la orden:</span>
                      {rent.semaforo === 'verde' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Rentable ({rent.margenReal}%)
                        </span>
                      )}
                      {rent.semaforo === 'amarillo' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Margen bajo ({rent.margenReal}%)
                        </span>
                      )}
                      {rent.semaforo === 'rojo' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Pérdida ({rent.margenReal}%)
                        </span>
                      )}
                      {rent.semaforo === 'neutro' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Sin cotización aprobada
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center pt-1.5 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Costo refacc</span>
                        <span className="font-bold text-slate-700">${rent.costoRefReal.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Costo MO</span>
                        <span className="font-bold text-slate-700">${rent.costoMoReal.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Cotizado</span>
                        <span className="font-bold text-[#1497F2]">${rent.precioAprobado.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Utilidad</span>
                        <span className={`font-bold ${rent.utilidadReal >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ${rent.utilidadReal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ======================================================== */}
              {/* UN SOLO SIGUIENTE PASO VISIBLE (ETAPA 7) */}
              {/* ======================================================== */}

              {/* 1. Sin cotización: preparar una cotización o vincular una existente del mismo vehículo */}
              {currentWorkflowStep === 'sin-cotizacion' && (
                <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <FileText className="w-5 h-5 shrink-0" />
                    <h4 className="font-bold text-[#06345A] text-sm">
                      Paso siguiente: Preparar o vincular cotización
                    </h4>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Esta orden aún no tiene un presupuesto vinculado. Puedes redactar una nueva cotización o asociar una existente del vehículo.
                  </p>

                  <div className="flex rounded-md border border-[#E5E7EB] bg-white p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setStep1SubTab('crear')}
                      className={`flex-1 py-1.5 rounded transition-colors font-medium cursor-pointer ${
                        step1SubTab === 'crear' ? 'bg-[#1497F2] text-white shadow-xs' : 'text-[#6B7280]'
                      }`}
                    >
                      Preparar nueva cotización
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep1SubTab('vincular')}
                      className={`flex-1 py-1.5 rounded transition-colors font-medium cursor-pointer ${
                        step1SubTab === 'vincular' ? 'bg-[#1497F2] text-white shadow-xs' : 'text-[#6B7280]'
                      }`}
                    >
                      Vincular cotización existente
                    </button>
                  </div>

                  {step1CotError && (
                    <p className="text-xs text-red-600">{step1CotError}</p>
                  )}

                  {step1SubTab === 'crear' ? (
                    <div className="space-y-3 bg-white p-3.5 rounded-lg border border-[#E5E7EB] text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Servicio del catálogo <span className="text-[11px] text-slate-400 font-normal">(Opcional)</span>
                        </label>
                        <select
                          value={step1SelectedCatalogId}
                          onChange={(e) => handleSelectCatalogInStep1(e.target.value)}
                          className="w-full p-2 border border-[#E5E7EB] rounded text-[#06345A] bg-white"
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
                          className="w-full p-2 border border-[#E5E7EB] rounded text-[#06345A] focus:outline-none focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2]"
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

                      <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                        <span className="font-semibold text-slate-700">Total calculado:</span>
                        <span className="font-bold text-sm text-[#1497F2]">
                          ${((parseFloat(newCotRef) || 0) + (parseFloat(newCotMo) || 0)).toFixed(2)} MXN
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isActionProcessing}
                        onClick={handleStep1CreateNewQuote}
                        className="w-full py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Crear cotización y vincular a la orden
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3.5 rounded-lg border border-[#E5E7EB] text-xs">
                      {availableUnlinkedCotizaciones.length > 0 ? (
                        <>
                          <label className="block font-medium text-slate-700">
                            Seleccionar cotización del mismo vehículo:
                          </label>
                          <select
                            value={selectedExistingCotId}
                            onChange={(e) => setSelectedExistingCotId(e.target.value)}
                            className="w-full p-2.5 border border-[#E5E7EB] rounded-lg text-slate-800 bg-white"
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
                            className="w-full py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
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
                      <span className="text-[#1497F2]">${activeLinkedCotizacion.total.toFixed(2)} MXN</span>
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
                        <span className="text-[#1497F2]">
                          ${((parseFloat(rejRef) || 0) + (parseFloat(rejMo) || 0)).toFixed(2)} MXN
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingRejectedCot(null)}
                          className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-slate-600 hover:bg-slate-50 min-h-[36px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleStep3SaveCorrectedQuote}
                          className="px-4 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg font-medium min-h-[36px] cursor-pointer"
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
                    className="w-full py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                        className="w-4 h-4 text-[#1497F2] rounded border-slate-300"
                      />
                      <span className="font-medium">Trabajo terminado verificado</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="checkbox"
                        checked={step5RevisionFinal}
                        onChange={(e) => setStep5RevisionFinal(e.target.checked)}
                        className="w-4 h-4 text-[#1497F2] rounded border-slate-300"
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
                      className="w-full py-2.5 min-h-[42px] bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
                    El trabajo mecánico y la revisión final han concluido. Audita los trabajos con IA antes de entregar o registra la entrega al cliente para completar el servicio.
                  </p>

                  {/* Tarjeta de auditoría previa a entrega */}
                  <div className="bg-white p-3.5 rounded-lg border border-sky-200 bg-gradient-to-r from-sky-50/60 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#1497F2] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          Revisión final con IA antes de entregar
                        </span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Audita cotización autorizada, refacciones utilizadas, pagos, diferencias y redacta el mensaje de entrega para WhatsApp.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevisionFinalOrden(continuarOrden)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold rounded-lg text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Revisión final con IA</span>
                    </button>
                  </div>

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
                    <div className="pt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setRevisionFinalOrden(continuarOrden)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#1497F2] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ver revisión final con IA</span>
                      </button>
                    </div>
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
                className="text-xs text-[#1497F2] hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Abrir formulario completo</span>
              </button>

              <button
                type="button"
                onClick={continuarModalDismiss.handleClose}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={orderFormDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingOrden ? `Editar orden (${editingOrden.folio})` : 'Nueva orden de trabajo'}
                </h3>
                {editingOrden && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500">Folio asignado: {editingOrden.folio}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenRevisionServicio(editingOrden)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-[#06345A] bg-sky-50 hover:bg-sky-100 rounded-md border border-[#73C7FF]/60 hover:border-[#1497F2] transition-colors cursor-pointer"
                      title="Revisión inteligente del servicio"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#1497F2]" />
                      <span>Revisar con IA</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={orderFormDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
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

              {/* Selector opcional: Servicio del catálogo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Servicio del catálogo <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogInModal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
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
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] placeholder-slate-400 focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                    formErrors.servicio ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                  }`}
                />
                {formErrors.servicio && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.servicio}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Estado de la orden <span className="text-red-500">*</span>
                  </label>
                  <ContextualHelp tema="cambiar-estado-orden" />
                </div>
                <select
                  value={formEstado}
                  onChange={(e) => {
                    setFormEstado(e.target.value as EstadoOrden);
                    if (formErrors.estado) setFormErrors((prev) => ({ ...prev, estado: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
                    formErrors.estado ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
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
                  className={`w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20 ${
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-600">
                          Diagnóstico técnico (Opcional)
                        </label>
                        {editingOrden && (
                          <button
                            type="button"
                            onClick={() => handleOpenAsistenciaTecnica(editingOrden)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1497F2] hover:underline cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#1497F2]" />
                            <span>Asistencia técnica con IA</span>
                          </button>
                        )}
                      </div>
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
                        className="w-4 h-4 text-[#1497F2] rounded"
                      />
                      <span>Trabajo terminado {isRecepcion && '(Solo mecánico)'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formRevisionFinal}
                        onChange={(e) => setFormRevisionFinal(e.target.checked)}
                        className="w-4 h-4 text-[#1497F2] rounded"
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
                              className="px-3 py-2 bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
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

              {/* Apartado desplegable: 5. Costeo real y rentabilidad (solo en edición o creación) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCosteoRealInEdit(!openCosteoRealInEdit)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>5. Costeo real y rentabilidad de la orden</span>
                  </div>
                  {openCosteoRealInEdit ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {openCosteoRealInEdit && (
                  <div className="p-4 bg-white space-y-4 border-t border-slate-200 text-xs">
                    <p className="text-slate-500">
                      Registra los costos reales incurridos en refacciones y mano de obra para calcular la utilidad y margen frente a la cotización aprobada.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-medium text-slate-700">
                            Costo real refacciones ($ MXN)
                          </label>
                          {editingOrden && editingOrden.refaccionesUtilizadas && editingOrden.refaccionesUtilizadas.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                let sum = 0;
                                editingOrden.refaccionesUtilizadas?.forEach((u) => {
                                  const net = Math.max(0, u.cantidad - (u.devueltas || 0));
                                  if (net > 0) {
                                    const r = refaccionMap.get(u.refaccionId);
                                    sum += net * (r?.precioCompra ?? r?.costoUnitario ?? 0);
                                  }
                                });
                                setFormCostoRealRefacciones(sum.toFixed(2));
                              }}
                              className="text-[10px] text-[#1497F2] hover:underline font-semibold"
                            >
                              Calcular de piezas
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formCostoRealRefacciones}
                          onChange={(e) => setFormCostoRealRefacciones(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-md text-slate-800 text-xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          No cuenta refacciones devueltas al almacén.
                        </p>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Costo real mano de obra ($ MXN)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formCostoRealManoObra}
                          onChange={(e) => setFormCostoRealManoObra(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-md text-slate-800 text-xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Costo directo interno pagado por el servicio realizado.
                        </p>
                      </div>
                    </div>

                    {/* Resumen de rentabilidad en el modal */}
                    {(() => {
                      const cRef = parseFloat(formCostoRealRefacciones) || 0;
                      const cMo = parseFloat(formCostoRealManoObra) || 0;
                      const totalCosto = Math.round((cRef + cMo) * 100) / 100;

                      const cot = editingOrden?.cotizacionId
                        ? cotizacionMap.get(editingOrden.cotizacionId)
                        : cotizaciones.find((c) => c.ordenId === editingOrden?.id);
                      const isAprob = cot && cot.estado === 'Aprobada';
                      const precioAprob = isAprob ? cot.total : (editingOrden?.precioCobrado || cot?.total || 0);

                      const util = Math.round((precioAprob - totalCosto) * 100) / 100;
                      const marg = precioAprob > 0 ? Math.round(((util / precioAprob) * 100) * 10) / 10 : 0;

                      let semaforo: 'verde' | 'amarillo' | 'rojo' | 'neutro' = 'neutro';
                      if (precioAprob > 0) {
                        if (util < 0 || marg < 0) semaforo = 'rojo';
                        else if (marg < 20) semaforo = 'amarillo';
                        else semaforo = 'verde';
                      }

                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-semibold text-slate-700">Semáforo de rentabilidad:</span>
                            {semaforo === 'verde' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Rentable ({marg}%)
                              </span>
                            )}
                            {semaforo === 'amarillo' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Margen bajo ({marg}%)
                              </span>
                            )}
                            {semaforo === 'rojo' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Pérdida ({marg}%)
                              </span>
                            )}
                            {semaforo === 'neutro' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Sin cotización aprobada
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Costo real</span>
                              <span className="font-bold text-slate-800">${totalCosto.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Precio aprobado</span>
                              <span className="font-bold text-[#1497F2]">${precioAprob.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Utilidad real</span>
                              <span className={`font-bold ${util >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                ${util.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={orderFormDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2.5 bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
          onClick={printingModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 print-area">
            <div className="no-print bg-white border-b border-[#E5E7EB] text-[#06345A] px-6 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Vista previa de orden de trabajo</span>
              <div className="flex items-center gap-2">
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
                    Orden de servicio automotriz
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
                      printingOrden.trabajoTerminado ? 'bg-[#1497F2] text-white border-[#1497F2]' : 'bg-white border-slate-300'
                    }`}>
                      {printingOrden.trabajoTerminado ? '✓' : ''}
                    </span>
                    <span>Trabajo terminado</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      printingOrden.revisionFinal ? 'bg-[#1497F2] text-white border-[#1497F2]' : 'bg-white border-slate-300'
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

              <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <p>Este documento es una orden de trabajo de {configuracion?.nombre || 'TUNNO'}.</p>
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
                className="px-4 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir orden</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASISTENCIA TÉCNICA CON IA */}
      {/* ======================================================== */}
      {asistenciaOrden && (
        <AsistenciaTecnicaModal
          isOpen={Boolean(asistenciaOrden)}
          onClose={() => setAsistenciaOrden(null)}
          orden={asistenciaOrden}
          vehiculo={vehiculoMap.get(asistenciaOrden.vehiculoId)}
          cliente={clienteMap.get(asistenciaOrden.clienteId)}
          historialServicios={ordenes}
          catalogoRefacciones={refacciones}
          onAplicarDiagnostico={handleAplicarDiagnosticoDesdeAsistencia}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL: REVISIÓN FINAL CON IA (ÓRDENES TERMINADAS) */}
      {/* ======================================================== */}
      <RevisionFinalModal
        isOpen={Boolean(revisionFinalOrden)}
        onClose={() => setRevisionFinalOrden(null)}
        orden={revisionFinalOrden}
        cotizaciones={cotizaciones}
        vehiculos={vehiculos}
        clientes={clientes}
        refacciones={refacciones}
        facturas={facturas}
        garantias={garantias}
        configuracion={configuracion}
        currentUser={currentUser}
        onSaveOrden={(ord) => {
          onSaveOrden(ord);
          if (continuarOrden && continuarOrden.id === ord.id) {
            setContinuarOrden(ord);
          }
          if (editingOrden && editingOrden.id === ord.id) {
            setEditingOrden(ord);
          }
        }}
        onSaveSeguimiento={onSaveSeguimiento}
      />

      {/* ======================================================== */}
      {/* PANEL LATERAL: REVISIÓN INTELIGENTE DEL SERVICIO (IA) */}
      {/* ======================================================== */}
      <RevisionInteligenteServicioPanel
        isOpen={Boolean(revisionServicioOrden)}
        onClose={() => setRevisionServicioOrden(null)}
        orden={revisionServicioOrden}
        cotizaciones={cotizaciones}
        clientes={clientes}
        vehiculos={vehiculos}
        refacciones={refacciones}
        servicios={servicios}
        facturas={facturas}
        configuracion={configuracion}
        onEjecutarAccion={handleEjecutarAccionRevision}
      />
    </section>
  );
};
