import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  User,
  ShieldCheck,
  FileText,
  Wrench,
  MessageSquare,
  Send,
  HelpCircle,
  ArrowRight,
  Receipt,
  FileCheck,
  CalendarPlus,
  BookmarkPlus,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  Cliente,
  Vehiculo,
  OrdenTrabajo,
  Cotizacion,
  Factura,
  Garantia,
  Seguimiento,
  ConfiguracionTaller,
  CasoSeguimientoInteligente,
  TonoSeguimiento,
  PrioridadSeguimiento,
  ResultadoSeguimientoInteligenteIA,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { generarSeguimientoInteligenteLocal } from '../utils/seguimientoInteligenteLocal';

interface SeguimientoInteligenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteInicial?: Cliente | null;
  vehiculoInicial?: Vehiculo | null;
  seguimientoAEditar?: Seguimiento | null;
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  ordenes: OrdenTrabajo[];
  cotizaciones: Cotizacion[];
  facturas?: Factura[];
  garantias?: Garantia[];
  seguimientos: Seguimiento[];
  configuracion?: ConfiguracionTaller;
  onSaveSeguimiento: (seguimiento: Seguimiento) => void;
  onUpdateSeguimientoEstado?: (
    id: string,
    nuevoEstado: 'Pendiente' | 'Realizado' | 'Cancelado',
    newDate?: string,
    newTime?: string
  ) => void;
  onSaveGarantia?: (garantia: Garantia) => void;
  onNavigateToGarantias?: () => void;
}

const CASOS_DISPONIBLES: { id: CasoSeguimientoInteligente; label: string }[] = [
  { id: 'auto_detectar', label: '✦ Auto-detectar con IA (Recomendado)' },
  { id: 'confirmar_funcionamiento', label: '1. Confirmar funcionamiento post-servicio' },
  { id: 'solicitar_valoracion', label: '2. Solicitar valoración de la atención' },
  { id: 'recordar_mantenimiento', label: '3. Recordar mantenimiento próximo' },
  { id: 'seguimiento_cotizacion', label: '4. Seguimiento a cotización pendiente' },
  { id: 'consultar_factura', label: '5. Consultar factura o pago pendiente' },
  { id: 'detectar_garantia', label: '6. Reporte de falla / Posible garantía' },
  { id: 'recuperar_cliente', label: '7. Reactivar cliente sin visitas recientes' },
];

export const SeguimientoInteligenteModal: React.FC<SeguimientoInteligenteModalProps> = ({
  isOpen,
  onClose,
  clienteInicial,
  vehiculoInicial,
  seguimientoAEditar,
  clientes,
  vehiculos,
  ordenes,
  cotizaciones,
  facturas = [],
  garantias = [],
  seguimientos,
  configuracion,
  onSaveSeguimiento,
  onUpdateSeguimientoEstado,
  onSaveGarantia,
  onNavigateToGarantias,
}) => {
  // Estado de selección
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoSeguimientoInteligente>('auto_detectar');
  const [tonoSeleccionado, setTonoSeleccionado] = useState<TonoSeguimiento>('cordial');
  const [comentarioCliente, setComentarioCliente] = useState<string>('');

  // Estado del resultado
  const [cargando, setCargando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoSeguimientoInteligenteIA | null>(null);
  const [mensajeActual, setMensajeActual] = useState<string>('');
  const [copiadoFeedback, setCopiadoFeedback] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Estados de confirmación
  const [confirmarGuardarSeguimiento, setConfirmarGuardarSeguimiento] = useState<boolean>(false);
  const [confirmarMarcarAtendido, setConfirmarMarcarAtendido] = useState<boolean>(false);
  const [confirmarBorradorGarantia, setConfirmarBorradorGarantia] = useState<boolean>(false);
  const [notificacionExito, setNotificacionExito] = useState<string | null>(null);

  const { handleBackdropClick } = useModalDismiss({ isOpen, onClose });

  // Mapas de ayuda
  const clienteMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const vehiculoMap = useMemo(() => new Map(vehiculos.map((v) => [v.id, v])), [vehiculos]);

  const clienteSeleccionado = clienteMap.get(selectedClienteId) || null;
  const vehiculoSeleccionado = vehiculoMap.get(selectedVehiculoId) || null;

  // Vehículos del cliente seleccionado
  const vehiculosDelCliente = useMemo(() => {
    if (!selectedClienteId) return [];
    return vehiculos.filter((v) => v.clienteId === selectedClienteId);
  }, [vehiculos, selectedClienteId]);

  // Al abrir o cambiar cliente inicial
  useEffect(() => {
    if (isOpen) {
      if (seguimientoAEditar) {
        setSelectedClienteId(seguimientoAEditar.clienteId);
        setSelectedVehiculoId(seguimientoAEditar.vehiculoId || '');
        setComentarioCliente(seguimientoAEditar.mensaje || '');
      } else if (clienteInicial) {
        setSelectedClienteId(clienteInicial.id);
        if (vehiculoInicial) {
          setSelectedVehiculoId(vehiculoInicial.id);
        } else {
          const vehs = vehiculos.filter((v) => v.clienteId === clienteInicial.id);
          setSelectedVehiculoId(vehs[0]?.id || '');
        }
      } else if (clientes.length > 0 && !selectedClienteId) {
        setSelectedClienteId(clientes[0].id);
        const vehs = vehiculos.filter((v) => v.clienteId === clientes[0].id);
        setSelectedVehiculoId(vehs[0]?.id || '');
      }
    } else {
      setResultado(null);
      setMensajeActual('');
      setConfirmarGuardarSeguimiento(false);
      setConfirmarMarcarAtendido(false);
      setConfirmarBorradorGarantia(false);
      setNotificacionExito(null);
    }
  }, [isOpen, clienteInicial, vehiculoInicial, seguimientoAEditar, clientes, vehiculos]);

  // Ejecución de análisis inteligente
  const ejecutarAnalisis = useCallback(async () => {
    const targetCli = clienteMap.get(selectedClienteId);
    if (!targetCli) return;

    setCargando(true);
    setErrorMensaje(null);

    const targetVeh = vehiculoMap.get(selectedVehiculoId);

    try {
      const res = await fetch('/api/seguimiento-inteligente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: targetCli,
          vehiculo: targetVeh,
          caso: casoSeleccionado,
          tono: tonoSeleccionado,
          comentarioCliente,
          ordenes,
          cotizaciones,
          facturas,
          garantias,
          seguimientos,
          configuracion,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor (${res.status})`);
      }

      const data: ResultadoSeguimientoInteligenteIA = await res.json();
      setResultado(data);
      setMensajeActual(data.mensajesPorTono[tonoSeleccionado] || data.mensajeWhatsApp);
    } catch (err: any) {
      console.warn('[Seguimiento IA] Fallback local tras error:', err);
      const local = generarSeguimientoInteligenteLocal({
        cliente: targetCli,
        vehiculo: targetVeh,
        caso: casoSeleccionado,
        tono: tonoSeleccionado,
        comentarioCliente,
        ordenes,
        cotizaciones,
        facturas,
        garantias,
        seguimientos,
        configuracion,
      });
      setResultado(local);
      setMensajeActual(local.mensajesPorTono[tonoSeleccionado] || local.mensajeWhatsApp);
    } finally {
      setCargando(false);
    }
  }, [
    selectedClienteId,
    selectedVehiculoId,
    casoSeleccionado,
    tonoSeleccionado,
    comentarioCliente,
    ordenes,
    cotizaciones,
    facturas,
    garantias,
    seguimientos,
    configuracion,
    clienteMap,
    vehiculoMap,
  ]);

  // Auto-ejecutar cuando se abre y hay un cliente seleccionado
  useEffect(() => {
    if (isOpen && selectedClienteId && !resultado && !cargando) {
      ejecutarAnalisis();
    }
  }, [isOpen, selectedClienteId, resultado, cargando, ejecutarAnalisis]);

  // Cambio de tono dinámico
  const handleCambiarTono = (nuevoTono: TonoSeguimiento) => {
    setTonoSeleccionado(nuevoTono);
    if (resultado) {
      const msg = resultado.mensajesPorTono?.[nuevoTono] || resultado.mensajeWhatsApp;
      setMensajeActual(msg);
    }
  };

  // Copiar mensaje
  const handleCopiarMensaje = async () => {
    if (!mensajeActual) return;
    try {
      await navigator.clipboard.writeText(mensajeActual);
      setCopiadoFeedback(true);
      setTimeout(() => setCopiadoFeedback(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Crear o actualizar seguimiento
  const handleGuardarSeguimiento = () => {
    if (!resultado || !clienteSeleccionado) return;

    const fechaSeg = resultado.fechaSugerida || new Date().toISOString().slice(0, 10);
    const horaSeg = resultado.horaSugerida || '10:00';
    const motivoLabel = resultado.motivoRecomendado || 'Seguimiento inteligente';

    if (seguimientoAEditar) {
      // Actualizar seguimiento existente
      const actualizado: Seguimiento = {
        ...seguimientoAEditar,
        mensaje: mensajeActual,
        fecha: fechaSeg,
        hora: horaSeg,
        motivoLabel,
      };
      onSaveSeguimiento(actualizado);
      setNotificacionExito(`Seguimiento actualizado correctamente para el ${fechaSeg}.`);
    } else {
      // Crear nuevo seguimiento
      const nuevo: Seguimiento = {
        id: `seg-ia-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clienteId: clienteSeleccionado.id,
        vehiculoId: vehiculoSeleccionado?.id,
        motivo: resultado.casoDetectado,
        motivoLabel,
        registroTipo: 'mantenimiento',
        registroId: vehiculoSeleccionado?.id,
        registroRef: vehiculoSeleccionado
          ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.placas})`
          : motivoLabel,
        mensaje: mensajeActual,
        fecha: fechaSeg,
        hora: horaSeg,
        estado: 'Pendiente',
        creadoEn: new Date().toISOString(),
      };
      onSaveSeguimiento(nuevo);
      setNotificacionExito(`Nuevo seguimiento programado exitosamente para el ${fechaSeg} a las ${horaSeg} hrs.`);
    }

    setConfirmarGuardarSeguimiento(false);
    setTimeout(() => setNotificacionExito(null), 4000);
  };

  // Enviar a Garantías como borrador
  const handleEnviarGarantiaBorrador = () => {
    if (!clienteSeleccionado || !onSaveGarantia) return;

    const ordenCliente = ordenes.find((o) => o.clienteId === clienteSeleccionado.id);
    const folioCount = garantias.length + 1;
    const nuevoFolio = `GAR-BORR-${String(folioCount).padStart(3, '0')}`;

    const hoy = new Date().toISOString().slice(0, 10);
    const venceDate = new Date();
    venceDate.setDate(venceDate.getDate() + 30);
    const vence = venceDate.toISOString().slice(0, 10);

    const nuevaGarantia: Garantia = {
      id: `gar-borrador-${Date.now()}`,
      folio: nuevoFolio,
      ordenId: ordenCliente?.id || 'orden-reingreso',
      ordenFolio: ordenCliente?.folio || 'ORD-PREVIA',
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombre,
      clienteTelefono: clienteSeleccionado.telefono,
      vehiculoId: vehiculoSeleccionado?.id || 'veh-general',
      vehiculoDescripcion: vehiculoSeleccionado
        ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
        : 'Vehículo en revisión física',
      vehiculoPlacas: vehiculoSeleccionado?.placas || 'S/P',
      trabajoCubierto:
        resultado?.alertaGarantia?.trabajoRelacionado ||
        ordenCliente?.servicio ||
        'Revisión física por posible reporte de garantía',
      duracionDias: 30,
      fechaInicio: hoy,
      fechaVencimiento: vence,
      condiciones:
        'Borrador derivado de seguimiento IA: Sujeto a inspección física en taller antes de dictamen definitivo.',
      estado: 'Vigente',
      observacionesMecanico: [
        {
          id: `obs-ia-${Date.now()}`,
          mecanicoNombre: 'IA - Seguimiento Inteligente',
          texto: `Borrador derivado de seguimiento al cliente: "${comentarioCliente || resultado?.alertaGarantia?.explicacion || 'Reporte de posible anomalía'}". Requiere inspección física obligatoria.`,
          fechaHora: new Date().toLocaleString('es-MX'),
        },
      ],
      creadoEn: new Date().toISOString(),
    };

    onSaveGarantia(nuevaGarantia);
    setConfirmarBorradorGarantia(false);
    setNotificacionExito(`Caso enviado a Garantías como borrador (${nuevoFolio}). Pendiente de dictamen técnico e inspección.`);
    setTimeout(() => setNotificacionExito(null), 5000);
  };

  // Marcar como atendido
  const handleMarcarAtendido = () => {
    if (seguimientoAEditar && onUpdateSeguimientoEstado) {
      onUpdateSeguimientoEstado(seguimientoAEditar.id, 'Realizado');
      setNotificacionExito('Seguimiento marcado como atendido (Realizado).');
    } else {
      setNotificacionExito('El seguimiento ha sido marcado como atendido en la sesión.');
    }
    setConfirmarMarcarAtendido(false);
    setTimeout(() => setNotificacionExito(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
      >
        {/* ======================================================== */}
        {/* HEADER DEL MODAL                                         */}
        {/* ======================================================== */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#06345A] to-[#1497F2] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  Seguimiento inteligente con IA
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-sky-100 backdrop-blur-xs">
                  CRM & Post-Servicio
                </span>
              </div>
              <p className="text-xs text-sky-100 truncate mt-0.5">
                {clienteSeleccionado ? clienteSeleccionado.nombre : 'Selecciona un cliente'} •{' '}
                {vehiculoSeleccionado
                  ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.placas})`
                  : 'Vehículo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={ejecutarAnalisis}
              disabled={cargando || !selectedClienteId}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Volver a generar análisis"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Volver a generar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BANNER AVISO OBLIGATORIO DE DEMOSTRACIÓN                 */}
        {/* ======================================================== */}
        <div className="bg-sky-50/90 border-b border-sky-100 px-5 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-700">
            <Info className="w-4 h-4 text-[#1497F2] shrink-0" />
            <span className="font-semibold text-slate-800">
              Demostración local: el mensaje no se ha enviado.
            </span>
            <span className="text-slate-500 hidden md:inline">
              La IA apoya con la redacción y priorización; el envío final depende de la confirmación del usuario.
            </span>
          </div>

          {resultado && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-sky-200 text-sky-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2]" />
                <span>{resultado.esAnalisisLocal ? 'Plantillas locales' : resultado.modeloUtilizado || 'Gemini IA'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Notificación flotante de éxito */}
        {notificacionExito && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-medium flex items-center justify-between gap-2 shadow-inner animate-in fade-in shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{notificacionExito}</span>
            </span>
            <button
              type="button"
              onClick={() => setNotificacionExito(null)}
              className="text-white/80 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CUERPO DEL CONTENIDO SCROLLABLE                         */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* PANEL DE SELECCIÓN Y CONFIGURACIÓN RÁPIDA */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Selector de Cliente */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedClienteId(cId);
                    const vehs = vehiculos.filter((v) => v.clienteId === cId);
                    setSelectedVehiculoId(vehs[0]?.id || '');
                    setResultado(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Vehículo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Vehículo vinculado
                </label>
                <select
                  value={selectedVehiculoId}
                  onChange={(e) => {
                    setSelectedVehiculoId(e.target.value);
                    setResultado(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
                >
                  <option value="">-- Todos o General --</option>
                  {vehiculosDelCliente.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.placas ? `(${v.placas})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Caso */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Caso de seguimiento
                </label>
                <select
                  value={casoSeleccionado}
                  onChange={(e) => {
                    setCasoSeleccionado(e.target.value as CasoSeguimientoInteligente);
                    setResultado(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
                >
                  {CASOS_DISPONIBLES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comentario registrado por el cliente */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                <span>Comentario o reporte registrado por el cliente (Opcional):</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Ej. "Dice que siente un ruido", "Agradeció el servicio", etc.
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comentarioCliente}
                  onChange={(e) => setComentarioCliente(e.target.value)}
                  placeholder="Escribe algún reporte, duda o comentario reciente del cliente..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1497F2] focus:border-[#1497F2]"
                />
                <button
                  type="button"
                  onClick={ejecutarAnalisis}
                  disabled={cargando || !selectedClienteId}
                  className="px-4 py-2 bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                  <span>{cargando ? 'Analizando...' : 'Analizar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ESTADO DE CARGA */}
          {cargando ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center animate-pulse text-[#1497F2] mx-auto">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Analizando historial y datos registrados con IA...
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Cruzando órdenes de trabajo, fechas de entrega, cotizaciones, facturas pendientes, garantías vigentes y comentarios del cliente.
                </p>
              </div>
            </div>
          ) : errorMensaje ? (
            <div className="p-6 text-center bg-rose-50 rounded-xl border border-rose-200 space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-800">{errorMensaje}</p>
              <button
                type="button"
                onClick={ejecutarAnalisis}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : resultado ? (
            <>
              {/* ======================================================== */}
              {/* ALERTA DE GARANTÍA (SI EL COMENTARIO LO SUGIERE)          */}
              {/* ======================================================== */}
              {resultado.alertaGarantia?.requiereGarantia && (
                <div className="p-4 rounded-xl border bg-amber-50 border-amber-300 text-amber-950 space-y-2 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-sm text-amber-900 block">
                          {resultado.alertaGarantia.titulo || 'Alerta: Posible caso de garantía detectado'}
                        </span>
                        <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                          {resultado.alertaGarantia.explicacion}
                        </p>
                        {resultado.alertaGarantia.trabajoRelacionado && (
                          <p className="text-[11px] text-amber-800 font-semibold mt-1">
                            Trabajo relacionado: {resultado.alertaGarantia.trabajoRelacionado}
                          </p>
                        )}
                        <p className="text-[11px] text-amber-800 italic mt-0.5">
                          Regla obligatoria: Se debe recomendar inspección física obligatoria. No prometer reparaciones ni devoluciones sin validación del técnico.
                        </p>
                      </div>
                    </div>

                    {onSaveGarantia && (
                      <button
                        type="button"
                        onClick={() => setConfirmarBorradorGarantia(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Enviar a Garantías (Borrador)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TARJETA PRINCIPAL: MOTIVO, PRIORIDAD Y FECHA SUGERIDA    */}
              {/* ======================================================== */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Motivo recomendado de contacto
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {resultado.motivoRecomendado}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Caso detectado: <strong className="text-[#1497F2]">{resultado.casoTitulo}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* Badge de Prioridad */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Prioridad
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                          resultado.prioridad === 'Alta'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : resultado.prioridad === 'Media'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            resultado.prioridad === 'Alta'
                              ? 'bg-rose-500'
                              : resultado.prioridad === 'Media'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>Prioridad {resultado.prioridad}</span>
                      </span>
                    </div>

                    {/* Badge de Fecha */}
                    <div className="text-right bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Fecha sugerida
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#1497F2]" />
                        <span>{resultado.fechaSugerida}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen del contexto utilizado */}
                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Información registrada utilizada para este análisis:
                  </span>
                  <p className="line-clamp-2">{resultado.resumenContexto}</p>
                </div>
              </div>

              {/* ======================================================== */}
              {/* MENSAJE BREVE PARA WHATSAPP & SELECTOR DE TONO          */}
              {/* ======================================================== */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Mensaje breve sugerido para WhatsApp
                    </h4>
                  </div>

                  {/* Selector de Tono: Cordial, Formal, Directo */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    {(['cordial', 'formal', 'directo'] as TonoSeguimiento[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleCambiarTono(t)}
                        className={`px-3 py-1 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                          tonoSeleccionado === t
                            ? 'bg-white text-[#1497F2] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <textarea
                    rows={4}
                    value={mensajeActual}
                    onChange={(e) => setMensajeActual(e.target.value)}
                    className="w-full bg-white border border-emerald-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Mensaje redactado para el cliente..."
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Listo para copiar y enviar manualmente desde WhatsApp Web o celular</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopiarMensaje}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-semibold cursor-pointer shadow-2xs self-start sm:self-auto"
                    >
                      {copiadoFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar mensaje</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* PREGUNTAS RECOMENDADAS PARA EL CLIENTE                   */}
              {/* ======================================================== */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#1497F2]" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Preguntas recomendadas para la llamada o chat
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {resultado.preguntasRecomendadas.map((preg, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <span className="text-[10px] font-bold text-[#1497F2] uppercase">
                        Pregunta {idx + 1}
                      </span>
                      <p className="text-slate-700 leading-snug">{preg}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ======================================================== */}
              {/* PRÓXIMA ACCIÓN SEGÚN LA POSIBLE RESPUESTA                */}
              {/* ======================================================== */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1.5 text-xs text-slate-800">
                <div className="flex items-center gap-2 text-[#06345A] font-bold text-xs uppercase tracking-wider">
                  <ArrowRight className="w-4 h-4 text-[#1497F2]" />
                  <span>Próxima acción según la posible respuesta:</span>
                </div>
                <p className="text-slate-700 leading-relaxed pl-6">
                  {resultado.proximaAccion}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* DIÁLOGOS DE CONFIRMACIÓN DE ESTADO O ACCIONES              */}
        {/* ======================================================== */}
        {confirmarGuardarSeguimiento && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Confirmación requerida:</strong> ¿Deseas {seguimientoAEditar ? 'actualizar' : 'crear'} este seguimiento en la agenda del taller para el cliente {clienteSeleccionado?.nombre}?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmarGuardarSeguimiento(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarSeguimiento}
                className="px-3.5 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Confirmar y guardar
              </button>
            </div>
          </div>
        )}

        {confirmarBorradorGarantia && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Confirmar registro de garantía:</strong> Se registrará una póliza en estado <em>Pendiente/Borrador</em> para dictamen del responsable técnico. No se aprueba de forma automática.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmarBorradorGarantia(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarGarantiaBorrador}
                className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Registrar como borrador
              </button>
            </div>
          </div>
        )}

        {confirmarMarcarAtendido && (
          <div className="p-4 bg-emerald-50 border-t border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Confirmar cambio de estado:</strong> ¿Confirmas marcar este seguimiento como <em>Atendido (Realizado)</em>?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmarMarcarAtendido(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMarcarAtendido}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              >
                Sí, marcar atendido
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* FOOTER CON BOTONES DE ACCIÓN                             */}
        {/* ======================================================== */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copiar mensaje */}
            <button
              type="button"
              onClick={handleCopiarMensaje}
              disabled={!mensajeActual}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {copiadoFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar mensaje</span>
                </>
              )}
            </button>

            {/* Crear o actualizar seguimiento */}
            <button
              type="button"
              onClick={() => setConfirmarGuardarSeguimiento(true)}
              disabled={!resultado || !clienteSeleccionado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-[#1497F2] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Guardar en agenda de seguimientos"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#1497F2]" />
              <span>{seguimientoAEditar ? 'Actualizar seguimiento' : 'Crear seguimiento'}</span>
            </button>

            {/* Enviar el caso a Garantías como borrador */}
            {onSaveGarantia && (
              <button
                type="button"
                onClick={() => setConfirmarBorradorGarantia(true)}
                disabled={!resultado || !clienteSeleccionado}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Registrar borrador en Garantías"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Enviar a Garantías</span>
              </button>
            )}

            {/* Marcar como atendido */}
            <button
              type="button"
              onClick={() => setConfirmarMarcarAtendido(true)}
              disabled={!resultado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 border border-slate-300 text-emerald-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Marcar como atendido"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Marcar como atendido</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ejecutarAnalisis}
              disabled={cargando || !selectedClienteId}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Volver a generar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#06345A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
