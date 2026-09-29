import React, { useState, useMemo } from 'react';
import {
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  ServicioCatalogo,
  ConfiguracionTaller,
  Seguimiento,
  MotivoAtencion,
  RespuestaSesion,
} from '../types';
import {
  Sparkles,
  Copy,
  CalendarPlus,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Car,
  FileText,
  Wrench,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  Info,
  CalendarDays,
  Check,
  X,
  Layers,
} from 'lucide-react';

interface AtencionAsistidaSectionProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  servicios: ServicioCatalogo[];
  configuracion: ConfiguracionTaller;
  seguimientos: Seguimiento[];
  onSaveSeguimiento: (nuevoSeguimiento: Seguimiento) => void;
  onUpdateSeguimientoEstado?: (
    id: string,
    nuevoEstado: 'Pendiente' | 'Realizado' | 'Cancelado',
    newDate?: string,
    newTime?: string
  ) => void;
  onNavigateToSection?: (sectionId: any) => void;
}

const MOTIVOS_OPTIONS: { id: MotivoAtencion; label: string }[] = [
  { id: 'consulta_servicio', label: 'Consulta de servicio' },
  { id: 'seguimiento_cotizacion', label: 'Seguimiento de cotización' },
  { id: 'recordatorio_cita', label: 'Recordatorio de cita' },
  { id: 'avance_reparacion', label: 'Avance de reparación' },
  { id: 'proximo_mantenimiento', label: 'Próximo mantenimiento' },
];

export const AtencionAsistidaSection: React.FC<AtencionAsistidaSectionProps> = ({
  clientes,
  vehiculos,
  citas,
  cotizaciones,
  ordenes,
  servicios,
  configuracion,
  seguimientos,
  onSaveSeguimiento,
  onUpdateSeguimientoEstado,
}) => {
  // Form fields
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [motivo, setMotivo] = useState<MotivoAtencion>('consulta_servicio');

  // Related entity selectors
  const [selectedServicioId, setSelectedServicioId] = useState<string>('');
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<string>('');
  const [selectedCitaId, setSelectedCitaId] = useState<string>('');
  const [selectedOrdenId, setSelectedOrdenId] = useState<string>('');
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');
  const [fechaSugeridaMantenimiento, setFechaSugeridaMantenimiento] = useState<string>('');

  // Optional customer query or comment
  const [comentarioCliente, setComentarioCliente] = useState<string>('');

  // Generated & editable response text
  const [textoRespuesta, setTextoRespuesta] = useState<string>('');
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  // UI Feedback
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [feedbackMensaje, setFeedbackMensaje] = useState<string | null>(null);

  // Session history (max 5 items, resets on reload)
  const [historialSesion, setHistorialSesion] = useState<RespuestaSesion[]>([]);

  // Modal or subform for "Guardar como seguimiento"
  const [isSeguimientoModalOpen, setIsSeguimientoModalOpen] = useState<boolean>(false);
  const [fechaSeguimiento, setFechaSeguimiento] = useState<string>('');
  const [horaSeguimiento, setHoraSeguimiento] = useState<string>('');
  const [seguimientoError, setSeguimientoError] = useState<string | null>(null);

  // Collapsible accordion sections
  const [isDetallesOpen, setIsDetallesOpen] = useState<boolean>(false);
  const [isSeguimientosListOpen, setIsSeguimientosListOpen] = useState<boolean>(false);

  // Rescheduling state for individual seguimiento items
  const [reprogramandoSegId, setReprogramandoSegId] = useState<string | null>(null);
  const [reprogFecha, setReprogFecha] = useState<string>('');
  const [reprogHora, setReprogHora] = useState<string>('10:00');
  const [isHistorialOpen, setIsHistorialOpen] = useState<boolean>(true);

  // Lookup maps
  const clienteMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const vehiculoMap = useMemo(() => new Map(vehiculos.map((v) => [v.id, v])), [vehiculos]);

  // Filtered relations based on selected client
  const clientVehiculos = useMemo(() => {
    if (!selectedClienteId) return [];
    return vehiculos.filter((v) => v.clienteId === selectedClienteId);
  }, [vehiculos, selectedClienteId]);

  const clientCitas = useMemo(() => {
    if (!selectedClienteId) return [];
    return citas.filter((c) => c.clienteId === selectedClienteId);
  }, [citas, selectedClienteId]);

  const clientCotizaciones = useMemo(() => {
    if (!selectedClienteId) return [];
    return cotizaciones.filter((c) => c.clienteId === selectedClienteId);
  }, [cotizaciones, selectedClienteId]);

  const clientOrdenes = useMemo(() => {
    if (!selectedClienteId) return [];
    return ordenes.filter((o) => o.clienteId === selectedClienteId);
  }, [ordenes, selectedClienteId]);

  const activeServicios = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Client selected object
  const currentCliente = clienteMap.get(selectedClienteId);

  // Handle client change: reset child selectors
  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setSelectedCotizacionId('');
    setSelectedCitaId('');
    setSelectedOrdenId('');
    // auto select first vehicle if available
    const vehs = vehiculos.filter((v) => v.clienteId === clienteId);
    setSelectedVehiculoId(vehs.length > 0 ? vehs[0].id : '');
  };

  // Format currency
  const formatMoney = (val?: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Dato no registrado';
    return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  };

  // Helper to format date
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Dato no registrado';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // GENERATE PROPOSAL: Local rules and deterministic templates
  const handlePrepararRespuesta = () => {
    if (!selectedClienteId || !currentCliente) {
      setFeedbackMensaje('Por favor selecciona un cliente registrado para preparar la respuesta.');
      setTimeout(() => setFeedbackMensaje(null), 4000);
      return;
    }

    const tallerNombre = configuracion.nombre || 'Taller mecánico';
    const clienteNombre = currentCliente.nombre;
    const comentarioLimpio = comentarioCliente.trim();
    let textoGenerado = '';
    let registroRefDesc = '';

    switch (motivo) {
      case 'consulta_servicio': {
        const serv = servicios.find((s) => s.id === selectedServicioId);
        if (serv) {
          registroRefDesc = `Servicio: ${serv.nombre}`;
          const desc = serv.descripcion ? ` Detalle: ${serv.descripcion}.` : '';
          const comentarioTxt = comentarioLimpio
            ? ` En respuesta a tu consulta: "${comentarioLimpio}".`
            : '';
          textoGenerado =
            `Hola ${clienteNombre}, gracias por contactar a ${tallerNombre}.${comentarioTxt} ` +
            `Respecto al servicio de "${serv.nombre}":${desc} ` +
            `El costo estimado en catálogo es de ${formatMoney(serv.total)}. ` +
            `Aclaramos que los precios del catálogo son estimados y pueden variar tras la inspección física del vehículo. ` +
            `Quedamos a tu disposición para agendar tu cita cuando lo requieras.`;
        } else {
          registroRefDesc = 'Servicio general';
          const comentarioTxt = comentarioLimpio
            ? ` Sobre tu consulta: "${comentarioLimpio}".`
            : '';
          textoGenerado =
            `Hola ${clienteNombre}, gracias por comunicarte con ${tallerNombre}.${comentarioTxt} ` +
            `Contamos con una amplia variedad de servicios de mantenimiento preventivo y correctivo. ` +
            `Los precios de catálogo son estimados y se confirman formalmente al revisar tu vehículo. ` +
            `¿Te gustaría programar una revisión en nuestro taller?`;
        }
        break;
      }

      case 'seguimiento_cotizacion': {
        const cot = cotizaciones.find((c) => c.id === selectedCotizacionId);
        if (cot) {
          registroRefDesc = `Cotización ${cot.folio}`;
          const veh = vehiculoMap.get(cot.vehiculoId);
          const vehDesc = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Vehículo no registrado';
          const trabajoDesc = cot.descripcion || 'Dato no registrado';
          const comentarioTxt = comentarioLimpio
            ? ` En relación con tu duda: "${comentarioLimpio}".`
            : '';
          textoGenerado =
            `Hola ${clienteNombre}, te saludamos de ${tallerNombre} para dar seguimiento a la cotización ${cot.folio} ` +
            `correspondiente a tu ${vehDesc}.${comentarioTxt} ` +
            `Trabajo considerado: ${trabajoDesc}. ` +
            `Monto total cotizado: ${formatMoney(cot.total)}. ` +
            `Estado actual de la cotización: ${cot.estado}. ` +
            `Con gusto estamos atentos en caso de que desees autorizar el trabajo o si requieres cualquier aclaración.`;
        } else {
          registroRefDesc = 'Cotización';
          textoGenerado =
            `Hola ${clienteNombre}, te saludamos de ${tallerNombre} para dar seguimiento a tus servicios pendientes. ` +
            `Actualmente no se encontró un folio específico seleccionado (Dato no registrado). ` +
            `Quedamos a tus órdenes para revisar cualquier presupuesto de tu vehículo.`;
        }
        break;
      }

      case 'recordatorio_cita': {
        const cit = citas.find((c) => c.id === selectedCitaId);
        if (cit) {
          registroRefDesc = `Cita ${formatDateDisplay(cit.fecha)} ${cit.hora || 'Dato no registrado'}`;
          const veh = vehiculoMap.get(cit.vehiculoId);
          const vehDesc = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Dato no registrado';
          const fechaStr = formatDateDisplay(cit.fecha);
          const horaStr = cit.hora ? `${cit.hora} hrs` : 'Dato no registrado';
          const servStr = cit.servicio || 'Revisión general';
          const comentarioTxt = comentarioLimpio
            ? ` Nota registrada: "${comentarioLimpio}".`
            : '';
          textoGenerado =
            `Hola ${clienteNombre}, te recordamos tu cita en ${tallerNombre} programada para el día ${fechaStr} a las ${horaStr}. ` +
            `Vehículo: ${vehDesc}. ` +
            `Servicio a realizar: ${servStr}.${comentarioTxt} ` +
            `Agradecemos tu puntual asistencia. Si requieres reagendar, por favor avísanos con anticipación.`;
        } else {
          registroRefDesc = 'Cita';
          textoGenerado =
            `Hola ${clienteNombre}, te contactamos de ${tallerNombre} respecto a tu cita de servicio. ` +
            `Fecha y hora: Dato no registrado. ` +
            `Por favor contáctanos para confirmar o reprogramar tu horario de atención.`;
        }
        break;
      }

      case 'avance_reparacion': {
        const ord = ordenes.find((o) => o.id === selectedOrdenId);
        if (ord) {
          registroRefDesc = `Orden ${ord.folio}`;
          const veh = vehiculoMap.get(ord.vehiculoId);
          const vehDesc = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Dato no registrado';
          const trabajoSolicitado = ord.servicio || 'Dato no registrado';
          const diag = ord.diagnostico ? ` Diagnóstico: ${ord.diagnostico}.` : '';
          const comentarioTxt = comentarioLimpio
            ? ` En respuesta a tu consulta: "${comentarioLimpio}".`
            : '';
          let detalleEstado = `Estado actual: ${ord.estado}.`;
          if (ord.trabajoTerminado) {
            detalleEstado = 'El trabajo técnico se encuentra terminado y en revisión final.';
          }
          if (ord.entregado) {
            detalleEstado = 'La orden figura como entregada.';
          }
          textoGenerado =
            `Hola ${clienteNombre}, te compartimos el avance de la orden de trabajo ${ord.folio} en ${tallerNombre} ` +
            `para tu vehículo ${vehDesc}.${comentarioTxt} ` +
            `Trabajo solicitado: ${trabajoSolicitado}.${diag} ` +
            `${detalleEstado} ` +
            `Te mantendremos informado de cualquier novedad adicional.`;
        } else {
          registroRefDesc = 'Orden de trabajo';
          textoGenerado =
            `Hola ${clienteNombre}, te contactamos de ${tallerNombre} para informarte sobre el estado de tu vehículo en servicio. ` +
            `Folio de orden: Dato no registrado. ` +
            `Seguimos atendiendo tu solicitud con gusto.`;
        }
        break;
      }

      case 'proximo_mantenimiento': {
        const veh = vehiculoMap.get(selectedVehiculoId);
        const vehDesc = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'Dato no registrado';
        const fechaSugeridaStr = fechaSugeridaMantenimiento
          ? formatDateDisplay(fechaSugeridaMantenimiento)
          : 'Dato no registrado';
        registroRefDesc = `Mantenimiento: ${vehDesc}`;
        const comentarioTxt = comentarioLimpio
          ? ` Comentario: "${comentarioLimpio}".`
          : '';
        textoGenerado =
          `Hola ${clienteNombre}, te saludamos cordialmente de ${tallerNombre}. ` +
          `Te sugerimos considerar el próximo servicio de mantenimiento preventivo para tu vehículo ${vehDesc}.${comentarioTxt} ` +
          `Fecha sugerida recomendada: ${fechaSugeridaStr}. ` +
          `El mantenimiento a tiempo ayuda a prevenir fallas y conservar la vida útil de tu motor. ` +
          `Con gusto podemos reservar tu espacio cuando te sea conveniente.`;
        break;
      }

      default:
        textoGenerado = `Hola ${clienteNombre}, gracias por contactar a ${tallerNombre}. Quedamos atentos para apoyarte con tu vehículo.`;
    }

    setTextoRespuesta(textoGenerado);
    setHasGenerated(true);

    // Add to session history (max 5)
    const nuevoHistorialItem: RespuestaSesion = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: currentCliente.id,
      clienteNombre: currentCliente.nombre,
      motivo: MOTIVOS_OPTIONS.find((m) => m.id === motivo)?.label || motivo,
      texto: textoGenerado,
      fechaHora: new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      registroRef: registroRefDesc,
    };

    setHistorialSesion((prev) => [nuevoHistorialItem, ...prev].slice(0, 5));
  };

  // ACTION 1: Copiar texto
  const handleCopiarTexto = async () => {
    if (!textoRespuesta.trim()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textoRespuesta);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textoRespuesta;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  // ACTION 2: Limpiar
  const handleLimpiar = () => {
    setTextoRespuesta('');
    setHasGenerated(false);
    setComentarioCliente('');
    setFechaSugeridaMantenimiento('');
    setSelectedServicioId('');
    setSelectedCotizacionId('');
    setSelectedCitaId('');
    setSelectedOrdenId('');
    setCopyFeedback(false);
    setFeedbackMensaje(null);
  };

  // ACTION 3: Guardar como seguimiento - Open Modal / Dialog
  const handleOpenSeguimientoModal = () => {
    if (!selectedClienteId || !currentCliente) {
      setFeedbackMensaje('Selecciona primero un cliente válido.');
      setTimeout(() => setFeedbackMensaje(null), 3000);
      return;
    }
    if (!textoRespuesta.trim()) {
      setFeedbackMensaje('Prepara o escribe primero el texto de la respuesta.');
      setTimeout(() => setFeedbackMensaje(null), 3000);
      return;
    }

    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');

    setFechaSeguimiento(`${yyyy}-${mm}-${dd}`);
    setHoraSeguimiento('10:00');
    setSeguimientoError(null);
    setIsSeguimientoModalOpen(true);
  };

  // Confirm Save Seguimiento with future date/time validation
  const handleConfirmSaveSeguimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setSeguimientoError(null);

    if (!fechaSeguimiento) {
      setSeguimientoError('Debes seleccionar una fecha.');
      return;
    }
    if (!horaSeguimiento) {
      setSeguimientoError('Debes seleccionar una hora.');
      return;
    }

    // Validate that fecha & hora are in the future
    const targetDateTime = new Date(`${fechaSeguimiento}T${horaSeguimiento}:00`);
    const now = new Date();
    if (isNaN(targetDateTime.getTime())) {
      setSeguimientoError('La fecha u hora no tienen un formato válido.');
      return;
    }
    if (targetDateTime <= now) {
      setSeguimientoError('La fecha y hora del seguimiento deben ser futuras.');
      return;
    }

    // Determine related record reference
    let registroTipo: Seguimiento['registroTipo'] = undefined;
    let registroId: string | undefined = undefined;
    let registroRef: string | undefined = undefined;

    if (motivo === 'consulta_servicio' && selectedServicioId) {
      registroTipo = 'servicio';
      registroId = selectedServicioId;
      const s = servicios.find((x) => x.id === selectedServicioId);
      registroRef = s ? `Servicio: ${s.nombre}` : 'Consulta de servicio';
    } else if (motivo === 'seguimiento_cotizacion' && selectedCotizacionId) {
      registroTipo = 'cotizacion';
      registroId = selectedCotizacionId;
      const c = cotizaciones.find((x) => x.id === selectedCotizacionId);
      registroRef = c ? `Cotización ${c.folio}` : 'Cotización';
    } else if (motivo === 'recordatorio_cita' && selectedCitaId) {
      registroTipo = 'cita';
      registroId = selectedCitaId;
      const ct = citas.find((x) => x.id === selectedCitaId);
      registroRef = ct ? `Cita ${formatDateDisplay(ct.fecha)}` : 'Cita';
    } else if (motivo === 'avance_reparacion' && selectedOrdenId) {
      registroTipo = 'orden';
      registroId = selectedOrdenId;
      const o = ordenes.find((x) => x.id === selectedOrdenId);
      registroRef = o ? `Orden ${o.folio}` : 'Orden de trabajo';
    } else if (motivo === 'proximo_mantenimiento') {
      registroTipo = 'mantenimiento';
      registroId = selectedVehiculoId;
      const v = vehiculoMap.get(selectedVehiculoId);
      registroRef = v ? `Vehículo ${v.marca} ${v.modelo}` : 'Próximo mantenimiento';
    }

    const motivoLabel = MOTIVOS_OPTIONS.find((m) => m.id === motivo)?.label || motivo;

    const nuevoSeguimiento: Seguimiento = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: selectedClienteId,
      vehiculoId: selectedVehiculoId || undefined,
      motivo,
      motivoLabel,
      registroTipo,
      registroId,
      registroRef: registroRef || motivoLabel,
      mensaje: textoRespuesta.trim(),
      fecha: fechaSeguimiento,
      hora: horaSeguimiento,
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
    };

    onSaveSeguimiento(nuevoSeguimiento);
    setIsSeguimientoModalOpen(false);
    setFeedbackMensaje('¡Seguimiento guardado exitosamente! Ya aparece en Seguimientos y Calendario.');
    setIsSeguimientosListOpen(true);
    setTimeout(() => setFeedbackMensaje(null), 5000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER: Title & Demo Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d5c58]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Atención asistida
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Demo
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Genera respuestas profesionales con datos existentes del taller y prográmalas como seguimientos.
            </p>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMensaje && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-sm text-[#0d5c58] flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0d5c58]" />
          <span>{feedbackMensaje}</span>
        </div>
      )}

      {/* MAIN SINGLE COLUMN CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Formulario de preparación
        </h3>

        {/* 1. Cliente registrado */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Cliente registrado <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedClienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
            >
              <option value="">-- Selecciona un cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                </option>
              ))}
            </select>
          </div>
          {currentCliente && (
            <p className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentCliente.nombre}</span>
              {currentCliente.telefono && <span>· Tel: {currentCliente.telefono}</span>}
              {currentCliente.correo && <span>· {currentCliente.correo}</span>}
            </p>
          )}
        </div>

        {/* 2. Motivo */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Motivo <span className="text-red-500">*</span>
          </label>
          <select
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value as MotivoAtencion);
              setHasGenerated(false);
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
          >
            {MOTIVOS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Registro relacionado según motivo */}
        <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Registro relacionado
            </span>
            <span className="text-xs text-slate-500">Datos reales del proyecto</span>
          </div>

          {/* CASO: Consulta de servicio */}
          {motivo === 'consulta_servicio' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Servicio del catálogo (opcional)
              </label>
              <select
                value={selectedServicioId}
                onChange={(e) => setSelectedServicioId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
              >
                <option value="">-- Servicio general / Consulta abierta --</option>
                {activeServicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} · Estimado: ${s.total.toLocaleString()} MXN
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Nota: Los precios tomados del catálogo se identificarán explícitamente como estimados.
              </p>
            </div>
          )}

          {/* CASO: Seguimiento de cotización */}
          {motivo === 'seguimiento_cotizacion' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Cotización del cliente
              </label>
              {clientCotizaciones.length > 0 ? (
                <select
                  value={selectedCotizacionId}
                  onChange={(e) => setSelectedCotizacionId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
                >
                  <option value="">-- Selecciona una cotización --</option>
                  {clientCotizaciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.folio} · {c.estado} · Total: ${c.total.toLocaleString()} MXN
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  {selectedClienteId
                    ? 'Este cliente no tiene cotizaciones registradas actualmente.'
                    : 'Selecciona primero un cliente para listar sus cotizaciones.'}
                </div>
              )}
            </div>
          )}

          {/* CASO: Recordatorio de cita */}
          {motivo === 'recordatorio_cita' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Cita programada
              </label>
              {clientCitas.length > 0 ? (
                <select
                  value={selectedCitaId}
                  onChange={(e) => setSelectedCitaId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
                >
                  <option value="">-- Selecciona una cita --</option>
                  {clientCitas.map((cit) => (
                    <option key={cit.id} value={cit.id}>
                      {cit.fecha} ({cit.hora}) · {cit.servicio} [{cit.estado}]
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  {selectedClienteId
                    ? 'Este cliente no tiene citas registradas actualmente.'
                    : 'Selecciona primero un cliente para listar sus citas.'}
                </div>
              )}
            </div>
          )}

          {/* CASO: Avance de reparación */}
          {motivo === 'avance_reparacion' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Orden de trabajo en proceso o activa
              </label>
              {clientOrdenes.length > 0 ? (
                <select
                  value={selectedOrdenId}
                  onChange={(e) => setSelectedOrdenId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
                >
                  <option value="">-- Selecciona una orden --</option>
                  {clientOrdenes.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.folio} · {ord.estado} · {ord.servicio}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  {selectedClienteId
                    ? 'Este cliente no tiene órdenes de trabajo registradas actualmente.'
                    : 'Selecciona primero un cliente para listar sus órdenes.'}
                </div>
              )}
            </div>
          )}

          {/* CASO: Próximo mantenimiento */}
          {motivo === 'proximo_mantenimiento' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  Vehículo del cliente
                </label>
                {clientVehiculos.length > 0 ? (
                  <select
                    value={selectedVehiculoId}
                    onChange={(e) => setSelectedVehiculoId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
                  >
                    <option value="">-- Selecciona un vehículo --</option>
                    {clientVehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''} - Placas: {v.placas}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    {selectedClienteId
                      ? 'Este cliente no tiene vehículos vinculados.'
                      : 'Selecciona primero un cliente para ver sus vehículos.'}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  Fecha sugerida de mantenimiento (opcional)
                </label>
                <input
                  type="date"
                  value={fechaSugeridaMantenimiento}
                  onChange={(e) => setFechaSugeridaMantenimiento(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Pregunta o comentario del cliente (opcional) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">
            Pregunta o comentario del cliente <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            value={comentarioCliente}
            onChange={(e) => setComentarioCliente(e.target.value)}
            placeholder="Ejemplo: ¿Cuánto tiempo tardaría? / ¿Incluye cambio de filtro?..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
          />
        </div>

        {/* Botón: Preparar respuesta */}
        <div>
          <button
            type="button"
            onClick={handlePrepararRespuesta}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Preparar respuesta</span>
          </button>
        </div>

        {/* DETALLES DESPLEGABLES DE LA SELECCIÓN */}
        {selectedClienteId && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDetallesOpen(!isDetallesOpen)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-medium text-slate-700 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Ver detalles del registro seleccionado</span>
              </span>
              {isDetallesOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {isDetallesOpen && (
              <div className="p-4 bg-white text-xs space-y-2 text-slate-600 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800">Cliente:</span>{' '}
                  {currentCliente?.nombre} ({currentCliente?.telefono || 'Sin teléfono'})
                </div>
                {motivo === 'consulta_servicio' && selectedServicioId && (
                  <div>
                    <span className="font-semibold text-slate-800">Servicio catálogo:</span>{' '}
                    {servicios.find((s) => s.id === selectedServicioId)?.nombre} · Costo catálogo:{' '}
                    {formatMoney(servicios.find((s) => s.id === selectedServicioId)?.total)}
                  </div>
                )}
                {motivo === 'seguimiento_cotizacion' && selectedCotizacionId && (
                  <div>
                    <span className="font-semibold text-slate-800">Cotización:</span>{' '}
                    {cotizaciones.find((c) => c.id === selectedCotizacionId)?.folio} · Estado:{' '}
                    {cotizaciones.find((c) => c.id === selectedCotizacionId)?.estado} · Total:{' '}
                    {formatMoney(cotizaciones.find((c) => c.id === selectedCotizacionId)?.total)}
                  </div>
                )}
                {motivo === 'recordatorio_cita' && selectedCitaId && (
                  <div>
                    <span className="font-semibold text-slate-800">Cita:</span>{' '}
                    {citas.find((c) => c.id === selectedCitaId)?.fecha} a las{' '}
                    {citas.find((c) => c.id === selectedCitaId)?.hora || 'Dato no registrado'} ·{' '}
                    {citas.find((c) => c.id === selectedCitaId)?.servicio}
                  </div>
                )}
                {motivo === 'avance_reparacion' && selectedOrdenId && (
                  <div>
                    <span className="font-semibold text-slate-800">Orden:</span>{' '}
                    {ordenes.find((o) => o.id === selectedOrdenId)?.folio} · Estado:{' '}
                    {ordenes.find((o) => o.id === selectedOrdenId)?.estado}
                  </div>
                )}
                {motivo === 'proximo_mantenimiento' && selectedVehiculoId && (
                  <div>
                    <span className="font-semibold text-slate-800">Vehículo:</span>{' '}
                    {vehiculoMap.get(selectedVehiculoId)?.marca}{' '}
                    {vehiculoMap.get(selectedVehiculoId)?.modelo} (
                    {vehiculoMap.get(selectedVehiculoId)?.placas})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ÁREA DE RESPUESTA PREPARADA (EDITABLE) Y ACCIONES */}
      {(hasGenerated || textoRespuesta.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0d5c58]" />
              <span>Propuesta de respuesta generada</span>
            </h3>
            <span className="text-xs text-slate-400">Puedes editar el texto libremente</span>
          </div>

          <div className="relative">
            <textarea
              rows={5}
              value={textoRespuesta}
              onChange={(e) => setTextoRespuesta(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
            />
          </div>

          {/* ACCIONES: Copiar texto, Guardar como seguimiento, Limpiar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition-colors"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenSeguimientoModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Guardar como seguimiento</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLimpiar}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* AVISO EXPLICITO: Demostración local. El mensaje no se envió. */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50/80 p-2.5 rounded-lg">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Demostración local. El mensaje no se envió.</span>
          </div>
        </div>
      )}

      {/* HISTORIAL DE LA SESIÓN (MÁX. 5 RESPUESTAS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHistorialOpen(!isHistorialOpen)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#0d5c58]" />
            <span className="text-sm font-semibold text-slate-800">
              Historial de respuestas preparadas en esta sesión
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {historialSesion.length} / 5
            </span>
          </div>
          {isHistorialOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isHistorialOpen && (
          <div className="p-5 border-t border-slate-100">
            {historialSesion.length > 0 ? (
              <div className="space-y-3">
                {historialSesion.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.clienteNombre}</span>
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0d5c58] font-medium border border-teal-200/50">
                          {item.motivo}
                        </span>
                      </div>
                      <span className="text-slate-400">{item.fechaHora}</span>
                    </div>

                    <p className="text-slate-700 italic line-clamp-2 bg-white p-2.5 rounded border border-slate-100">
                      "{item.texto}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTextoRespuesta(item.texto);
                          setHasGenerated(true);
                        }}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        Cargar en editor
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.texto);
                          setFeedbackMensaje('Texto copiado al portapapeles.');
                          setTimeout(() => setFeedbackMensaje(null), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-[#0d5c58] font-medium transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No hay respuestas preparadas en la sesión actual. Al recargar la página este historial se reinicia.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN DESPLEGABLE: SEGUIMIENTOS PROGRAMADOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsSeguimientosListOpen(!isSeguimientosListOpen)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-[#0d5c58]" />
            <span className="text-sm font-semibold text-slate-800">
              Seguimientos registrados en el taller
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-[#0d5c58] font-medium">
              {seguimientos.length}
            </span>
          </div>
          {isSeguimientosListOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isSeguimientosListOpen && (
          <div className="p-5 border-t border-slate-100 space-y-3">
            {seguimientos.length > 0 ? (
              <div className="space-y-3">
                {seguimientos
                  .slice()
                  .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
                  .map((seg) => {
                    const isPros = seg.registroTipo === 'prospecto' || Boolean(seg.prospectoId);
                    const cli = clienteMap.get(seg.clienteId);
                    const veh = seg.vehiculoId ? vehiculoMap.get(seg.vehiculoId) : null;
                    const displayName = isPros
                      ? seg.prospectoNombre || 'Prospecto'
                      : cli?.nombre || 'Cliente';
                    const isPendiente = seg.estado === 'Pendiente';
                    const isRealizado = seg.estado === 'Realizado';
                    const isCancelado = seg.estado === 'Cancelado';
                    const isReprogrammingThis = reprogramandoSegId === seg.id;

                    return (
                      <div
                        key={seg.id}
                        className={`p-4 rounded-lg space-y-2.5 text-xs transition-colors border ${
                          isPros
                            ? 'bg-purple-50/40 border-purple-200 hover:bg-purple-50/70'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">
                              {displayName}
                            </span>
                            {isPros ? (
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                                Prospecto
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                                {seg.motivoLabel}
                              </span>
                            )}
                            {seg.registroRef && (
                              <span className="px-2 py-0.5 rounded bg-teal-50 text-[#0d5c58] font-medium border border-teal-200/50">
                                {seg.registroRef}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium ${
                                isPendiente
                                  ? 'bg-amber-100 text-amber-800'
                                  : isRealizado
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {seg.estado}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDateDisplay(seg.fecha)} a las {seg.hora} hrs
                          </span>
                          {veh && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              {veh.marca} {veh.modelo} ({veh.placas})
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200/80 leading-relaxed">
                          {seg.mensaje}
                        </p>

                        {/* Inline Reschedule Form */}
                        {isReprogrammingThis && (
                          <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 mt-2">
                            <span className="font-semibold text-slate-700 block text-xs">
                              Reprogramar fecha y hora:
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Nueva fecha</label>
                                <input
                                  type="date"
                                  value={reprogFecha}
                                  onChange={(e) => setReprogFecha(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0d5c58]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Nueva hora</label>
                                <input
                                  type="time"
                                  value={reprogHora}
                                  onChange={(e) => setReprogHora(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0d5c58]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setReprogramandoSegId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (reprogFecha && onUpdateSeguimientoEstado) {
                                    onUpdateSeguimientoEstado(
                                      seg.id,
                                      'Pendiente',
                                      reprogFecha,
                                      reprogHora
                                    );
                                    setReprogramandoSegId(null);
                                  }
                                }}
                                className="px-3 py-1 text-xs font-semibold bg-[#0d5c58] text-white rounded hover:bg-[#0a4845]"
                              >
                                Guardar reprogramación
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status update actions */}
                        {onUpdateSeguimientoEstado && isPendiente && !isReprogrammingThis && (
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => {
                                setReprogramandoSegId(seg.id);
                                setReprogFecha(seg.fecha);
                                setReprogHora(seg.hora || '10:00');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Reprogramar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateSeguimientoEstado(seg.id, 'Realizado')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Marcar realizado</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateSeguimientoEstado(seg.id, 'Cancelado')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No hay seguimientos registrados aún. Puedes generar uno usando el botón "Guardar como seguimiento".
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODAL: GUARDAR COMO SEGUIMIENTO (SOLICITA FECHA Y HORA FUTURAS) */}
      {isSeguimientoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-[#0d1b2a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-teal-400" />
                <h3 className="font-semibold text-base">Programar seguimiento</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSeguimientoModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveSeguimiento} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Cliente:</span>{' '}
                  {currentCliente?.nombre}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Motivo:</span>{' '}
                  {MOTIVOS_OPTIONS.find((m) => m.id === motivo)?.label}
                </div>
              </div>

              {seguimientoError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{seguimientoError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Fecha futura <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fechaSeguimiento}
                  onChange={(e) => setFechaSeguimiento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Hora del seguimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={horaSeguimiento}
                  onChange={(e) => setHoraSeguimiento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSeguimientoModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-[#0d5c58] hover:bg-[#0a4845] text-white rounded-lg shadow-xs transition-colors"
                >
                  Guardar seguimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
