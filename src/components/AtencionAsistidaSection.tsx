import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Factura,
  ServicioCatalogo,
  ConfiguracionTaller,
  Seguimiento,
  RespuestaSesion,
  Garantia,
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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  Info,
  CalendarDays,
  Check,
  X,
  MessageSquare,
  Layers,
  Receipt,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  TipoTonoAtencion,
  MotivoAtencionIA,
  MOTIVOS_ATENCION_LISTA,
  RespuestaAtencionIA,
  generarRespuestaAtencionLocal,
} from '../utils/respuestaAtencionLocal';
import { SeguimientoInteligenteModal } from './SeguimientoInteligenteModal';

interface AtencionAsistidaSectionProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  facturas?: Factura[];
  servicios: ServicioCatalogo[];
  configuracion: ConfiguracionTaller;
  seguimientos: Seguimiento[];
  garantias?: Garantia[];
  onSaveSeguimiento: (nuevoSeguimiento: Seguimiento) => void;
  onUpdateSeguimientoEstado?: (
    id: string,
    nuevoEstado: 'Pendiente' | 'Realizado' | 'Cancelado',
    newDate?: string,
    newTime?: string
  ) => void;
  onSaveGarantia?: (garantia: Garantia) => void;
  onNavigateToSection?: (sectionId: any) => void;
}

export const AtencionAsistidaSection: React.FC<AtencionAsistidaSectionProps> = ({
  clientes,
  vehiculos,
  citas,
  cotizaciones,
  ordenes,
  facturas = [],
  servicios,
  configuracion,
  seguimientos,
  garantias = [],
  onSaveSeguimiento,
  onUpdateSeguimientoEstado,
  onSaveGarantia,
  onNavigateToSection,
}) => {
  // Modal de Seguimiento inteligente con IA
  const [isSeguimientoIAOpen, setIsSeguimientoIAOpen] = useState<boolean>(false);
  const [seguimientoTargetIA, setSeguimientoTargetIA] = useState<Seguimiento | null>(null);
  // -------------------------------------------------------------
  // PASO 1: SELECCIONAR CLIENTE
  // -------------------------------------------------------------
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');

  // -------------------------------------------------------------
  // PASO 2: SELECCIONAR VEHÍCULO
  // -------------------------------------------------------------
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');

  // -------------------------------------------------------------
  // PASO 3: MOTIVO DE ATENCIÓN (7 MOTIVOS SOLICITADOS)
  // -------------------------------------------------------------
  const [motivo, setMotivo] = useState<MotivoAtencionIA>('consultar_cotizacion');
  const [tono, setTono] = useState<TipoTonoAtencion>('cordial');
  const [comentarioLibre, setComentarioLibre] = useState<string>('');

  // Selectores específicos según motivo
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<string>('');
  const [selectedCitaId, setSelectedCitaId] = useState<string>('');
  const [selectedOrdenId, setSelectedOrdenId] = useState<string>('');
  const [selectedFacturaId, setSelectedFacturaId] = useState<string>('');

  // -------------------------------------------------------------
  // PASO 4: PESTAÑA ACTIVA EN INFORMACIÓN RELACIONADA
  // -------------------------------------------------------------
  type TabRelacionada = 'citas' | 'cotizaciones' | 'ordenes' | 'facturas' | 'historial' | 'mantenimientos';
  const [activeTabRelacionada, setActiveTabRelacionada] = useState<TabRelacionada>('cotizaciones');

  // -------------------------------------------------------------
  // PASO 5: ESTADO DE LA IA Y RESPUESTA
  // -------------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [respuestaIA, setRespuestaIA] = useState<RespuestaAtencionIA | null>(null);
  const [textoEditable, setTextoEditable] = useState<string>('');
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [feedbackMensaje, setFeedbackMensaje] = useState<string | null>(null);

  // Historial de sesión (máx. 5 respuestas preparadas)
  const [historialSesion, setHistorialSesion] = useState<RespuestaSesion[]>([]);
  const [isHistorialOpen, setIsHistorialOpen] = useState<boolean>(false);
  const [isSeguimientosListOpen, setIsSeguimientosListOpen] = useState<boolean>(false);

  // -------------------------------------------------------------
  // MODAL DE PROGRAMAR SEGUIMIENTO
  // -------------------------------------------------------------
  const [isSeguimientoModalOpen, setIsSeguimientoModalOpen] = useState<boolean>(false);
  const [fechaSeguimiento, setFechaSeguimiento] = useState<string>('');
  const [horaSeguimiento, setHoraSeguimiento] = useState<string>('10:00');
  const [initialSeguimientoData, setInitialSeguimientoData] = useState<{ fecha: string; hora: string }>({
    fecha: '',
    hora: '10:00',
  });
  const [seguimientoError, setSeguimientoError] = useState<string | null>(null);

  // Reprogramación en lista de seguimientos
  const [reprogramandoSegId, setReprogramandoSegId] = useState<string | null>(null);
  const [reprogFecha, setReprogFecha] = useState<string>('');
  const [reprogHora, setReprogHora] = useState<string>('10:00');

  // Mappings
  const clienteMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const vehiculoMap = useMemo(() => new Map(vehiculos.map((v) => [v.id, v])), [vehiculos]);
  const currentCliente = clienteMap.get(selectedClienteId) || null;
  const currentVehiculo = vehiculoMap.get(selectedVehiculoId) || null;

  // Vehículos del cliente seleccionado
  const clientVehiculos = useMemo(() => {
    if (!selectedClienteId) return [];
    return vehiculos.filter((v) => v.clienteId === selectedClienteId);
  }, [vehiculos, selectedClienteId]);

  // Al cambiar cliente, auto-seleccionar su primer vehículo y reiniciar selecciones
  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setSelectedCotizacionId('');
    setSelectedCitaId('');
    setSelectedOrdenId('');
    setSelectedFacturaId('');
    setRespuestaIA(null);
    setTextoEditable('');
    setErrorGeneracion(null);

    const vehs = vehiculos.filter((v) => v.clienteId === clienteId);
    if (vehs.length > 0) {
      setSelectedVehiculoId(vehs[0].id);
    } else {
      setSelectedVehiculoId('');
    }
  };

  // Al cambiar vehículo, reiniciar resultado previo
  const handleVehiculoChange = (vehiculoId: string) => {
    setSelectedVehiculoId(vehiculoId);
    setSelectedCotizacionId('');
    setSelectedCitaId('');
    setSelectedOrdenId('');
    setSelectedFacturaId('');
    setRespuestaIA(null);
    setTextoEditable('');
  };

  // Formateadores seguros
  const formatMoney = (val?: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Dato no registrado';
    return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  };

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

  // =============================================================
  // FILTRADO DE INFORMACIÓN RELACIONADA
  // =============================================================
  const clientCitas = useMemo(() => {
    if (!selectedClienteId) return [];
    return citas.filter(
      (c) => c.clienteId === selectedClienteId && (!selectedVehiculoId || c.vehiculoId === selectedVehiculoId)
    );
  }, [citas, selectedClienteId, selectedVehiculoId]);

  const clientCotizaciones = useMemo(() => {
    if (!selectedClienteId) return [];
    return cotizaciones.filter(
      (c) => c.clienteId === selectedClienteId && (!selectedVehiculoId || c.vehiculoId === selectedVehiculoId)
    );
  }, [cotizaciones, selectedClienteId, selectedVehiculoId]);

  const clientOrdenes = useMemo(() => {
    if (!selectedClienteId) return [];
    return ordenes.filter(
      (o) => o.clienteId === selectedClienteId && (!selectedVehiculoId || o.vehiculoId === selectedVehiculoId)
    );
  }, [ordenes, selectedClienteId, selectedVehiculoId]);

  const clientFacturas = useMemo(() => {
    if (!selectedClienteId) return [];
    return facturas.filter(
      (f) => f.clienteId === selectedClienteId && (!selectedVehiculoId || f.vehiculoId === selectedVehiculoId)
    );
  }, [facturas, selectedClienteId, selectedVehiculoId]);

  // Historial: Órdenes terminadas o entregadas anteriores
  const clientHistorial = useMemo(() => {
    return clientOrdenes.filter((o) => o.trabajoTerminado || o.entregado || o.estado === 'Terminado');
  }, [clientOrdenes]);

  // Próximos mantenimientos estimados en base a datos reales (odómetro / fechas)
  const proximosMantenimientos = useMemo(() => {
    if (!currentVehiculo) return [];
    const kmActual = typeof currentVehiculo.kilometraje === 'number'
      ? currentVehiculo.kilometraje
      : typeof currentVehiculo.kilometraje === 'string'
      ? parseInt(currentVehiculo.kilometraje, 10) || 0
      : 0;
    const proxKm = kmActual > 0 ? kmActual + 5000 : 5000;

    // Calcular fecha a 6 meses para preventivo
    const fechaEstimada = new Date();
    fechaEstimada.setMonth(fechaEstimada.getMonth() + 6);
    const yyyy = fechaEstimada.getFullYear();
    const mm = String(fechaEstimada.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaEstimada.getDate()).padStart(2, '0');
    const fechaObjStr = `${yyyy}-${mm}-${dd}`;

    return [
      {
        id: 'pm-1',
        tipo: 'Afinación y cambio de aceite',
        kilometrajeObjetivo: proxKm,
        fechaEstimada: fechaObjStr,
        descripcion: `Mantenimiento preventivo periódico sugerido cada 5,000 km o 6 meses para ${currentVehiculo.marca} ${currentVehiculo.modelo}.`,
        estado: 'Sugerido por sistema',
      },
      {
        id: 'pm-2',
        tipo: 'Inspección de frenos y suspensión',
        kilometrajeObjetivo: proxKm + 5000,
        fechaEstimada: fechaObjStr,
        descripcion: 'Verificación de pastillas, discos, amortiguadores y niveles de seguridad.',
        estado: 'Recomendado',
      },
    ];
  }, [currentVehiculo]);

  // Sincronizar automáticamente la pestaña de información relacionada según el motivo
  useEffect(() => {
    if (motivo === 'consultar_cotizacion') setActiveTabRelacionada('cotizaciones');
    else if (motivo === 'confirmar_cita') setActiveTabRelacionada('citas');
    else if (motivo === 'informar_avance' || motivo === 'vehiculo_terminado') setActiveTabRelacionada('ordenes');
    else if (motivo === 'recordar_mantenimiento') setActiveTabRelacionada('mantenimientos');
    else if (motivo === 'seguimiento_post_servicio') setActiveTabRelacionada('historial');
  }, [motivo]);

  // =============================================================
  // GENERAR RESPUESTA CON IA
  // =============================================================
  const handleGenerarRespuestaIA = useCallback(
    async (overrideTono?: TipoTonoAtencion) => {
      if (!selectedClienteId || !currentCliente) {
        setFeedbackMensaje('Por favor selecciona primero un cliente registrado.');
        setTimeout(() => setFeedbackMensaje(null), 3500);
        return;
      }

      const tonoUsar = overrideTono || tono;
      setIsGenerating(true);
      setErrorGeneracion(null);
      setCopyFeedback(false);

      const motivoObj = MOTIVOS_ATENCION_LISTA.find((m) => m.id === motivo);
      const motivoLabel = motivoObj?.label || motivo;

      const payload = {
        cliente: currentCliente,
        vehiculo: currentVehiculo,
        motivo,
        motivoLabel,
        tono: tonoUsar,
        comentarioLibre,
        citas: clientCitas,
        cotizaciones: clientCotizaciones,
        ordenes: clientOrdenes,
        facturas: clientFacturas,
        configuracion,
        citaSeleccionadaId: selectedCitaId || undefined,
        cotizacionSeleccionadaId: selectedCotizacionId || undefined,
        ordenSeleccionadaId: selectedOrdenId || undefined,
        facturaSeleccionadaId: selectedFacturaId || undefined,
      };

      try {
        const response = await fetch('/api/generar-respuesta-atencion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Respuesta del servidor: ${response.statusText}`);
        }

        const data: RespuestaAtencionIA = await response.json();
        setRespuestaIA(data);
        setTextoEditable(data.mensajeWhatsApp);

        // Agregar al historial de sesión (máximo 5)
        const nuevoHistorialItem: RespuestaSesion = {
          id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          clienteId: currentCliente.id,
          clienteNombre: currentCliente.nombre,
          motivo: `${motivoLabel} (${tonoUsar})`,
          texto: data.mensajeWhatsApp,
          fechaHora: new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          registroRef: currentVehiculo
            ? `${currentVehiculo.marca} ${currentVehiculo.modelo} (${currentVehiculo.placas})`
            : 'Sin vehículo',
        };
        setHistorialSesion((prev) => [nuevoHistorialItem, ...prev].slice(0, 5));
      } catch (err: any) {
        console.warn('Error al invocar API de IA, ejecutando respaldo local inmediato:', err);
        // Fallback local garantizado para que la demostración continúe funcionando sin interrupciones
        const localResult = generarRespuestaAtencionLocal({
          cliente: currentCliente,
          vehiculo: currentVehiculo,
          motivo,
          tono: tonoUsar,
          comentarioLibre,
          citas: clientCitas,
          cotizaciones: clientCotizaciones,
          ordenes: clientOrdenes,
          facturas: clientFacturas,
          configuracion,
          citaSeleccionadaId: selectedCitaId || undefined,
          cotizacionSeleccionadaId: selectedCotizacionId || undefined,
          ordenSeleccionadaId: selectedOrdenId || undefined,
          facturaSeleccionadaId: selectedFacturaId || undefined,
        });

        setRespuestaIA({
          ...localResult,
          esAnalisisLocal: true,
          modeloUtilizado: 'Plantilla local de atención (Demostración activa)',
        });
        setTextoEditable(localResult.mensajeWhatsApp);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      selectedClienteId,
      currentCliente,
      currentVehiculo,
      motivo,
      tono,
      comentarioLibre,
      clientCitas,
      clientCotizaciones,
      clientOrdenes,
      clientFacturas,
      configuracion,
      selectedCitaId,
      selectedCotizacionId,
      selectedOrdenId,
      selectedFacturaId,
    ]
  );

  // Cambiar tono dinámicamente y regenerar
  const handleCambiarTono = (nuevoTono: TipoTonoAtencion) => {
    setTono(nuevoTono);
    if (respuestaIA) {
      handleGenerarRespuestaIA(nuevoTono);
    }
  };

  // Copiar mensaje
  const handleCopiarMensaje = async () => {
    if (!textoEditable.trim()) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textoEditable);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textoEditable;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Descartar/Cerrar resultado
  const handleCerrarResultado = () => {
    setRespuestaIA(null);
    setTextoEditable('');
    setErrorGeneracion(null);
  };

  // Limpiar todo el formulario
  const handleLimpiarFormulario = () => {
    setSelectedClienteId('');
    setSelectedVehiculoId('');
    setMotivo('consultar_cotizacion');
    setTono('cordial');
    setComentarioLibre('');
    setSelectedCotizacionId('');
    setSelectedCitaId('');
    setSelectedOrdenId('');
    setSelectedFacturaId('');
    setRespuestaIA(null);
    setTextoEditable('');
    setErrorGeneracion(null);
    setCopyFeedback(false);
  };

  // Abrir modal de Seguimiento con la fecha sugerida por la IA
  const handleAbrirSeguimientoSugerido = () => {
    if (!currentCliente) return;

    let targetDate = respuestaIA?.fechaSugeridaSeguimiento;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }

    setFechaSeguimiento(targetDate);
    setHoraSeguimiento('10:00');
    setInitialSeguimientoData({ fecha: targetDate, hora: '10:00' });
    setSeguimientoError(null);
    setIsSeguimientoModalOpen(true);
  };

  // Modal dismiss hook para el modal de seguimiento
  const isSeguimientoDirty = useMemo(() => {
    if (!isSeguimientoModalOpen) return false;
    return fechaSeguimiento !== initialSeguimientoData.fecha || horaSeguimiento !== initialSeguimientoData.hora;
  }, [isSeguimientoModalOpen, fechaSeguimiento, horaSeguimiento, initialSeguimientoData]);

  const seguimientoModalDismiss = useModalDismiss({
    isOpen: isSeguimientoModalOpen,
    onClose: () => {
      setIsSeguimientoModalOpen(false);
      setSeguimientoError(null);
    },
    isDirty: isSeguimientoDirty,
    onCleanup: () => setSeguimientoError(null),
  });

  // Guardar seguimiento confirmado
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

    const motivoLabel = MOTIVOS_ATENCION_LISTA.find((m) => m.id === motivo)?.label || motivo;

    const nuevoSeguimiento: Seguimiento = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: selectedClienteId,
      vehiculoId: selectedVehiculoId || undefined,
      motivo,
      motivoLabel,
      registroTipo:
        motivo === 'consultar_cotizacion'
          ? 'cotizacion'
          : motivo === 'confirmar_cita'
          ? 'cita'
          : motivo === 'informar_avance' || motivo === 'vehiculo_terminado'
          ? 'orden'
          : 'mantenimiento',
      registroId:
        selectedCotizacionId || selectedCitaId || selectedOrdenId || selectedVehiculoId || undefined,
      registroRef: currentVehiculo
        ? `${currentVehiculo.marca} ${currentVehiculo.modelo} (${currentVehiculo.placas})`
        : motivoLabel,
      mensaje: (textoEditable || respuestaIA?.mensajeWhatsApp || '').trim(),
      fecha: fechaSeguimiento,
      hora: horaSeguimiento,
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
    };

    onSaveSeguimiento(nuevoSeguimiento);
    setIsSeguimientoModalOpen(false);
    setFeedbackMensaje('¡Seguimiento agendado con éxito! Se sincronizó en Seguimientos y Calendario.');
    setIsSeguimientosListOpen(true);
    setTimeout(() => setFeedbackMensaje(null), 4500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ======================================================== */}
      {/* ENCABEZADO INSTITUCIONAL TUNNO                           */}
      {/* ======================================================== */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1497F2]/10 border border-[#73C7FF]/40 flex items-center justify-center text-[#1497F2] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight">
                Seguimientos y Atención asistida
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#06345A] border border-[#73C7FF]/40">
                IA Asistida
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              Seguimiento inteligente a clientes con IA y respuestas personalizadas basadas en datos reales registrados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSeguimientoTargetIA(null);
              setIsSeguimientoIAOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1497F2] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Abrir Seguimiento inteligente con IA"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Seguimiento inteligente con IA</span>
          </button>

          {selectedClienteId && (
            <button
              type="button"
              onClick={handleLimpiarFormulario}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMensaje && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMensaje}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TARJETA PRINCIPAL DEL FLUJO DE ATENCIÓN                  */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
        {/* PASO 1 Y 2: CLIENTE Y VEHÍCULO EN CUADRÍCULA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PASO 1: SELECCIONAR CLIENTE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1497F2]/10 text-[#1497F2] inline-flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Seleccionar cliente</span>
                <span className="text-red-500">*</span>
              </label>
              {currentCliente && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Seleccionado
                </span>
              )}
            </div>

            <select
              value={selectedClienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all"
            >
              <option value="">-- Selecciona un cliente registrado --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.telefono ? `· Tel: ${c.telefono}` : '· Sin tel'}
                </option>
              ))}
            </select>

            {/* Ficha rápida de cliente */}
            {currentCliente ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <User className="w-3.5 h-3.5 text-[#1497F2]" />
                  <span>{currentCliente.nombre}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  {currentCliente.telefono ? (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {currentCliente.telefono}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Sin teléfono</span>
                  )}
                  {currentCliente.correo && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {currentCliente.correo}
                    </span>
                  )}
                  {currentCliente.rfc && <span>RFC: {currentCliente.rfc}</span>}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Selecciona al cliente para cargar automáticamente sus autos y expedientes.
              </p>
            )}
          </div>

          {/* PASO 2: SELECCIONAR VEHÍCULO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1497F2]/10 text-[#1497F2] inline-flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Seleccionar vehículo</span>
                <span className="text-red-500">*</span>
              </label>
              {currentVehiculo && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Placas: {currentVehiculo.placas || 'S/P'}
                </span>
              )}
            </div>

            <select
              disabled={!selectedClienteId || clientVehiculos.length === 0}
              value={selectedVehiculoId}
              onChange={(e) => handleVehiculoChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all disabled:bg-slate-100 disabled:text-slate-400"
            >
              {!selectedClienteId ? (
                <option value="">Primero selecciona un cliente</option>
              ) : clientVehiculos.length === 0 ? (
                <option value="">Cliente sin vehículos vinculados</option>
              ) : (
                <>
                  <option value="">-- Selecciona un vehículo --</option>
                  {clientVehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''} · Placas: {v.placas}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Ficha rápida de vehículo */}
            {currentVehiculo ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1 text-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Car className="w-3.5 h-3.5 text-[#1497F2]" />
                    <span>
                      {currentVehiculo.marca} {currentVehiculo.modelo} {currentVehiculo.año || ''}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-mono text-slate-700">
                    {currentVehiculo.placas || 'Sin placas'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>
                    Odómetro:{' '}
                    <strong className="text-slate-700">
                      {currentVehiculo.kilometraje
                        ? `${currentVehiculo.kilometraje.toLocaleString()} km`
                        : 'No registrado'}
                    </strong>
                  </span>
                  {currentVehiculo.color && <span>Color: {currentVehiculo.color}</span>}
                </div>
              </div>
            ) : selectedClienteId && clientVehiculos.length === 0 ? (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Este cliente no cuenta con vehículos registrados actualmente.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                El vehículo focaliza los presupuestos, órdenes y mantenimientos correspondientes.
              </p>
            )}
          </div>
        </div>

        {/* PASO 3: MOTIVO DE ATENCIÓN (7 MOTIVOS SOLICITADOS) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#1497F2]/10 text-[#1497F2] inline-flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Elegir motivo de atención</span>
            <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {MOTIVOS_ATENCION_LISTA.map((m) => {
              const isSelected = motivo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMotivo(m.id);
                    setRespuestaIA(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1497F2]/10 border-[#1497F2] text-[#1497F2] ring-2 ring-[#1497F2]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{m.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1497F2]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {m.descripcion}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selectores específicos contextuales si hay registros */}
          {motivo === 'consultar_cotizacion' && clientCotizaciones.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 animate-in fade-in">
              <label className="block text-xs font-medium text-slate-700">
                Cotización específica a consultar (opcional):
              </label>
              <select
                value={selectedCotizacionId}
                onChange={(e) => setSelectedCotizacionId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#1497F2]"
              >
                <option value="">-- Última cotización registrada (Automático) --</option>
                {clientCotizaciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.folio} · {c.estado} · Total: {formatMoney(c.total)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {motivo === 'confirmar_cita' && clientCitas.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 animate-in fade-in">
              <label className="block text-xs font-medium text-slate-700">
                Cita específica a confirmar (opcional):
              </label>
              <select
                value={selectedCitaId}
                onChange={(e) => setSelectedCitaId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#1497F2]"
              >
                <option value="">-- Próxima cita agendada (Automático) --</option>
                {clientCitas.map((cit) => (
                  <option key={cit.id} value={cit.id}>
                    {formatDateDisplay(cit.fecha)} ({cit.hora || 'S/H'}) · {cit.servicio} · [{cit.estado}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {(motivo === 'informar_avance' || motivo === 'vehiculo_terminado') && clientOrdenes.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 animate-in fade-in">
              <label className="block text-xs font-medium text-slate-700">
                Orden de trabajo específica (opcional):
              </label>
              <select
                value={selectedOrdenId}
                onChange={(e) => setSelectedOrdenId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#1497F2]"
              >
                <option value="">-- Orden más reciente (Automático) --</option>
                {clientOrdenes.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.folio} · {ord.estado} · {ord.servicio}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo para redactar respuesta libre o nota de apoyo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>
                {motivo === 'respuesta_libre'
                  ? 'Redactar consulta o tema a responder'
                  : 'Pregunta o nota del cliente / Indicaciones para la IA'}{' '}
                <span className="text-slate-400 font-normal">
                  {motivo === 'respuesta_libre' ? '(opcional)' : '(opcional)'}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">Datos reales</span>
            </label>
            <textarea
              rows={2}
              value={comentarioLibre}
              onChange={(e) => setComentarioLibre(e.target.value)}
              placeholder={
                motivo === 'respuesta_libre'
                  ? 'Ejemplo: El cliente consulta si ya llegaron sus amortiguadores y si puede pasar mañana por la tarde...'
                  : 'Ejemplo: El cliente preguntó por teléfono cuánto tiempo tomará la reparación...'
              }
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* PASO 4: MOSTRAR INFORMACIÓN RELACIONADA                  */}
        {/* ======================================================== */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1497F2]/10 text-[#1497F2] inline-flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Información relacionada del cliente y vehículo</span>
            </label>
            <span className="text-xs text-slate-500">
              Registros verificados en plataforma
            </span>
          </div>

          {/* Barra de pestañas de información relacionada */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTabRelacionada('cotizaciones')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'cotizaciones'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cotizaciones</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {clientCotizaciones.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabRelacionada('citas')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'citas'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Citas</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {clientCitas.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabRelacionada('ordenes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'ordenes'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Órdenes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {clientOrdenes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabRelacionada('facturas')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'facturas'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Facturas</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {clientFacturas.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabRelacionada('historial')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'historial'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {clientHistorial.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabRelacionada('mantenimientos')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTabRelacionada === 'mantenimientos'
                  ? 'bg-[#1497F2] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Próximos mantenimientos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px]">
                {proximosMantenimientos.length}
              </span>
            </button>
          </div>

          {/* Contenido de la pestaña activa */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 max-h-56 overflow-y-auto text-xs">
            {/* PESTAÑA COTIZACIONES */}
            {activeTabRelacionada === 'cotizaciones' && (
              <div>
                {clientCotizaciones.length > 0 ? (
                  <div className="space-y-2">
                    {clientCotizaciones.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          selectedCotizacionId === c.id ? 'border-[#1497F2] ring-1 ring-[#1497F2]/30' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{c.folio}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-medium ${
                                c.estado === 'Aprobada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.estado === 'Rechazada'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.estado}
                            </span>
                            <span className="text-slate-400 text-[11px]">{formatDateDisplay(c.creadoEn)}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {c.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 text-sm">{formatMoney(c.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    {selectedClienteId
                      ? 'No hay cotizaciones registradas para este cliente/vehículo.'
                      : 'Selecciona un cliente para visualizar sus cotizaciones.'}
                  </p>
                )}
              </div>
            )}

            {/* PESTAÑA CITAS */}
            {activeTabRelacionada === 'citas' && (
              <div>
                {clientCitas.length > 0 ? (
                  <div className="space-y-2">
                    {clientCitas.map((cit) => (
                      <div
                        key={cit.id}
                        className={`p-2.5 rounded bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          selectedCitaId === cit.id ? 'border-[#1497F2] ring-1 ring-[#1497F2]/30' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {formatDateDisplay(cit.fecha)} a las {cit.hora || 'S/H'} hrs
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-blue-100 text-[#06345A] text-[10px] font-medium">
                              {cit.estado}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{cit.servicio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    {selectedClienteId
                      ? 'No hay citas registradas para este cliente/vehículo.'
                      : 'Selecciona un cliente para ver sus citas agendadas.'}
                  </p>
                )}
              </div>
            )}

            {/* PESTAÑA ÓRDENES */}
            {activeTabRelacionada === 'ordenes' && (
              <div>
                {clientOrdenes.length > 0 ? (
                  <div className="space-y-2">
                    {clientOrdenes.map((o) => (
                      <div
                        key={o.id}
                        className={`p-2.5 rounded bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          selectedOrdenId === o.id ? 'border-[#1497F2] ring-1 ring-[#1497F2]/30' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{o.folio}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-medium ${
                                o.trabajoTerminado || o.estado === 'Terminado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-[#06345A]'
                              }`}
                            >
                              {o.trabajoTerminado ? 'Terminado' : o.estado}
                            </span>
                            {o.entregado && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                                Entregado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {o.servicio} {o.diagnostico ? `· Diag: ${o.diagnostico}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    {selectedClienteId
                      ? 'No hay órdenes de trabajo registradas.'
                      : 'Selecciona un cliente para consultar sus órdenes de trabajo.'}
                  </p>
                )}
              </div>
            )}

            {/* PESTAÑA FACTURAS */}
            {activeTabRelacionada === 'facturas' && (
              <div>
                {clientFacturas.length > 0 ? (
                  <div className="space-y-2">
                    {clientFacturas.map((f) => (
                      <div
                        key={f.id}
                        className={`p-2.5 rounded bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          selectedFacturaId === f.id ? 'border-[#1497F2] ring-1 ring-[#1497F2]/30' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{f.folio}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-medium ${
                                f.estado === 'Pagada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : f.estado === 'Cancelada'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {f.estado}
                            </span>
                            <span className="text-slate-400 text-[11px]">{formatDateDisplay(f.fechaCreacion)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Origen: Cotización {f.cotizacionFolio || 'N/D'} · {f.descripcion || 'Servicios automotrices'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 text-sm">{formatMoney(f.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    {selectedClienteId
                      ? 'No hay facturas emitidas para este cliente/vehículo.'
                      : 'Selecciona un cliente para ver sus comprobantes y facturas.'}
                  </p>
                )}
              </div>
            )}

            {/* PESTAÑA HISTORIAL */}
            {activeTabRelacionada === 'historial' && (
              <div>
                {clientHistorial.length > 0 ? (
                  <div className="space-y-2">
                    {clientHistorial.map((h) => (
                      <div key={h.id} className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{h.folio}</span>
                          <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                            Servicio concluido
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{h.servicio}</p>
                        {h.diagnostico && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            Resultado técnico: {h.diagnostico}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    No hay intervenciones o servicios concluidos previamente en el historial.
                  </p>
                )}
              </div>
            )}

            {/* PESTAÑA PRÓXIMOS MANTENIMIENTOS */}
            {activeTabRelacionada === 'mantenimientos' && (
              <div>
                {proximosMantenimientos.length > 0 ? (
                  <div className="space-y-2">
                    {proximosMantenimientos.map((pm) => (
                      <div key={pm.id} className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{pm.tipo}</span>
                          <span className="px-2 py-0.2 rounded bg-blue-100 text-[#06345A] text-[10px] font-medium">
                            {pm.estado}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{pm.descripcion}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span>
                            Kilometraje meta: <strong>{pm.kilometrajeObjetivo.toLocaleString()} km</strong>
                          </span>
                          <span>
                            Fecha estimada: <strong>{formatDateDisplay(pm.fechaEstimada)}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-3 text-slate-400">
                    Selecciona un vehículo con kilometraje para calcular sus mantenimientos preventivos.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PASO 5: BOTÓN "GENERAR RESPUESTA CON IA"                */}
        {/* ======================================================== */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!selectedClienteId || isGenerating}
            onClick={() => handleGenerarRespuestaIA()}
            className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-semibold text-sm sm:text-base shadow-sm transition-all min-h-[48px] ${
              !selectedClienteId
                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                : isGenerating
                ? 'bg-[#1497F2] opacity-80 cursor-wait'
                : 'bg-[#1497F2] hover:bg-[#06345A] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analizando datos registrados y generando respuesta con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#73C7FF]" />
                <span>Generar respuesta con IA</span>
              </>
            )}
          </button>

          {!selectedClienteId && (
            <p className="text-center text-xs text-slate-400 mt-1.5">
              * Selecciona primero un cliente registrado para habilitar el análisis de la IA.
            </p>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RESULTADO GENERADO POR LA IA                             */}
      {/* ======================================================== */}
      {respuestaIA && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Encabezado del resultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#1497F2]/10 text-[#1497F2] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Respuesta preparada con IA
                  </h3>
                  {respuestaIA.esAnalisisLocal && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Modo local
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {currentCliente?.nombre} · {currentVehiculo?.marca} {currentVehiculo?.modelo} (
                  {currentVehiculo?.placas || 'Sin placas'})
                </p>
              </div>
            </div>

            {/* Selector de Tono */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-500 px-2">Tono:</span>
              {(['formal', 'cordial', 'directo'] as TipoTonoAtencion[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleCambiarTono(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                    tono === t
                      ? 'bg-white text-[#1497F2] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 1. MENSAJE PARA WHATSAPP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#1497F2]" />
                <span>Mensaje breve y amable para WhatsApp</span>
              </label>
              <span className="text-[11px] text-slate-400">Puedes editar este texto antes de copiar</span>
            </div>

            <div className="relative">
              <textarea
                rows={5}
                value={textoEditable}
                onChange={(e) => setTextoEditable(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all font-sans"
              />
            </div>
          </div>

          {/* 2. RESUMEN INTERNO Y PRÓXIMA ACCIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Resumen interno para el personal */}
            <div className="p-3.5 bg-[#73C7FF]/10 border border-[#73C7FF]/40 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1497F2] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-[#1497F2]" />
                <span>Resumen interno para el personal</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {respuestaIA.resumenInterno}
              </p>
            </div>

            {/* Próxima acción recomendada */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Próxima acción recomendada</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {respuestaIA.proximaAccion}
              </p>
            </div>
          </div>

          {/* 3. FECHA SUGERIDA DE SEGUIMIENTO */}
          {respuestaIA.fechaSugeridaSeguimiento && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1497F2]/10 text-[#1497F2] flex items-center justify-center shrink-0">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Fecha sugerida de seguimiento: {formatDateDisplay(respuestaIA.fechaSugeridaSeguimiento)}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {respuestaIA.fechaSugeridaExplicacion || 'Recordatorio recomendado para el equipo.'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAbrirSeguimientoSugerido}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Crear seguimiento con esta fecha</span>
              </button>
            </div>
          )}

          {/* 4. ADVERTENCIAS O DATOS FALTANTES */}
          {respuestaIA.advertencias && respuestaIA.advertencias.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Advertencias e integridad de datos:
              </span>
              <div className="space-y-1.5">
                {respuestaIA.advertencias.map((adv, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                      adv.tipo === 'faltante' || adv.tipo === 'inconsistencia'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {adv.tipo === 'faltante' || adv.tipo === 'inconsistencia' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{adv.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. BOTONES DE ACCIÓN PRINCIPALES */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botón: Copiar mensaje */}
              <button
                type="button"
                onClick={handleCopiarMensaje}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors min-h-[42px]"
              >
                {copyFeedback ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span>¡Mensaje copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copiar mensaje para WhatsApp</span>
                  </>
                )}
              </button>

              {/* Botón: Generar otra versión */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerarRespuestaIA()}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors min-h-[42px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Generar otra versión</span>
              </button>
            </div>

            {/* Botón: Cerrar resultado */}
            <button
              type="button"
              onClick={handleCerrarResultado}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cerrar resultado</span>
            </button>
          </div>

          {/* AVISO EXPLÍCITO REQUERIDO POR ESPECIFICACIÓN */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 text-center">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Demostración local: el mensaje no se ha enviado.</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HISTORIAL DE RESPUESTAS EN ESTA SESIÓN (MÁX. 5)          */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHistorialOpen(!isHistorialOpen)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#1497F2]" />
            <span className="text-sm font-semibold text-slate-800">
              Historial de respuestas generadas en esta sesión
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
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#06345A] font-medium border border-blue-200/50">
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
                          setTextoEditable(item.texto);
                          if (!respuestaIA) {
                            setRespuestaIA({
                              mensajeWhatsApp: item.texto,
                              resumenInterno: `Respuesta previa para ${item.clienteNombre}.`,
                              proximaAccion: 'Revisar y enviar por WhatsApp.',
                              fechaSugeridaSeguimiento: null,
                              advertencias: [],
                              tonoUtilizado: tono,
                              esAnalisisLocal: true,
                            });
                          }
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
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#06345A] font-medium transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No hay respuestas preparadas en la sesión actual. Al recargar la página este historial temporal se reinicia.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SEGUIMIENTOS PROGRAMADOS EN EL TALLER                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsSeguimientosListOpen(!isSeguimientosListOpen)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-[#1497F2]" />
            <span className="text-sm font-semibold text-slate-800">
              Seguimientos registrados en el taller
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#06345A] font-medium border border-blue-200/50">
              {seguimientos.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSeguimientoTargetIA(null);
                setIsSeguimientoIAOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1497F2] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Generar o analizar seguimiento con IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Seguimiento inteligente con IA</span>
              <span className="sm:hidden">Seguimiento IA</span>
            </button>
            {isSeguimientosListOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
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
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-[#06345A] font-medium border border-blue-200/50">
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

                        {/* Formulario de reprogramación en línea */}
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
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-0.5">Nueva hora</label>
                                <input
                                  type="time"
                                  value={reprogHora}
                                  onChange={(e) => setReprogHora(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
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
                                className="px-3 py-1 text-xs font-semibold bg-[#1497F2] text-white rounded hover:bg-[#06345A]"
                              >
                                Guardar reprogramación
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Acciones de estado */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSeguimientoTargetIA(seg);
                              setIsSeguimientoIAOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-[#1497F2] border border-sky-200 font-semibold transition-colors cursor-pointer text-xs"
                            title="Analizar este seguimiento con IA"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Seguimiento IA</span>
                          </button>

                          {onUpdateSeguimientoEstado && isPendiente && !isReprogrammingThis && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No hay seguimientos registrados aún. Puedes programar uno con el botón "Crear seguimiento con esta fecha".
              </p>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: GUARDAR COMO SEGUIMIENTO                          */}
      {/* ======================================================== */}
      {isSeguimientoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
          onClick={seguimientoModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#06345A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-[#73C7FF]" />
                <h3 className="font-semibold text-base">Programar seguimiento</h3>
              </div>
              <button
                type="button"
                onClick={seguimientoModalDismiss.handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Cerrar modal"
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
                  <span className="font-semibold text-slate-800">Vehículo:</span>{' '}
                  {currentVehiculo ? `${currentVehiculo.marca} ${currentVehiculo.modelo}` : 'General'}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Motivo:</span>{' '}
                  {MOTIVOS_ATENCION_LISTA.find((m) => m.id === motivo)?.label || motivo}
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
                  Fecha del seguimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fechaSeguimiento}
                  onChange={(e) => setFechaSeguimiento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Hora programada <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={horaSeguimiento}
                  onChange={(e) => setHoraSeguimiento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20 focus:border-[#1497F2] transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={seguimientoModalDismiss.handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg shadow-xs transition-colors min-h-[42px]"
                >
                  Guardar seguimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SEGUIMIENTO INTELIGENTE CON IA                    */}
      {/* ======================================================== */}
      <SeguimientoInteligenteModal
        isOpen={isSeguimientoIAOpen}
        onClose={() => {
          setIsSeguimientoIAOpen(false);
          setSeguimientoTargetIA(null);
        }}
        clienteInicial={currentCliente}
        vehiculoInicial={currentVehiculo}
        seguimientoAEditar={seguimientoTargetIA}
        clientes={clientes}
        vehiculos={vehiculos}
        ordenes={ordenes}
        cotizaciones={cotizaciones}
        facturas={facturas}
        garantias={garantias}
        seguimientos={seguimientos}
        configuracion={configuracion}
        onSaveSeguimiento={onSaveSeguimiento}
        onUpdateSeguimientoEstado={onUpdateSeguimientoEstado}
        onSaveGarantia={onSaveGarantia}
        onNavigateToGarantias={() => {
          if (onNavigateToSection) onNavigateToSection('garantias');
        }}
      />
    </div>
  );
};
