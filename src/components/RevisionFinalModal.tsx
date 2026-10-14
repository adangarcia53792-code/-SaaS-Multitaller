import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  User,
  DollarSign,
  FileText,
  Wrench,
  MessageSquare,
  Calendar,
  Send,
  HelpCircle,
  FileCheck,
  BookmarkPlus,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  OrdenTrabajo,
  Cotizacion,
  Vehiculo,
  Cliente,
  Refaccion,
  Factura,
  Garantia,
  ConfiguracionTaller,
  SesionUsuario,
  Seguimiento,
  ResultadoRevisionFinalIA,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { generarRevisionFinalLocal } from '../utils/revisionFinalLocal';

interface RevisionFinalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenTrabajo | null;
  cotizaciones: Cotizacion[];
  vehiculos: Vehiculo[];
  clientes: Cliente[];
  refacciones: Refaccion[];
  facturas?: Factura[];
  garantias?: Garantia[];
  configuracion?: ConfiguracionTaller;
  currentUser?: SesionUsuario;
  onSaveOrden?: (orden: OrdenTrabajo) => void;
  onSaveSeguimiento?: (seguimiento: Seguimiento) => void;
}

export const RevisionFinalModal: React.FC<RevisionFinalModalProps> = ({
  isOpen,
  onClose,
  orden,
  cotizaciones,
  vehiculos,
  clientes,
  refacciones,
  facturas = [],
  garantias = [],
  configuracion,
  currentUser,
  onSaveOrden,
  onSaveSeguimiento,
}) => {
  const [cargando, setCargando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoRevisionFinalIA | null>(null);
  const [copiadoMensaje, setCopiadoMensaje] = useState<boolean>(false);
  const [resumenAplicado, setResumenAplicado] = useState<boolean>(false);
  const [seguimientoCreado, setSeguimientoCreado] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const { handleBackdropClick } = useModalDismiss({ isOpen, onClose });

  const cliente = orden ? clientes.find((c) => c.id === orden.clienteId) : undefined;
  const vehiculo = orden ? vehiculos.find((v) => v.id === orden.vehiculoId) : undefined;
  const cotizacion = orden ? cotizaciones.find((c) => c.id === orden.cotizacionId || c.ordenId === orden.id) : undefined;

  const ejecutarRevision = useCallback(async () => {
    if (!orden) return;

    setCargando(true);
    setErrorMensaje(null);
    setResumenAplicado(false);
    setSeguimientoCreado(false);

    const responsable = {
      nombre: currentUser?.nombre || orden.mecanicoNombre || 'Responsable de Calidad',
      rol: currentUser?.rol || 'Control de calidad',
    };

    try {
      const res = await fetch('/api/revision-final-orden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orden,
          cotizacion,
          vehiculo,
          cliente,
          refacciones,
          facturas,
          garantias,
          configuracion,
          responsable,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor (${res.status})`);
      }

      const data: ResultadoRevisionFinalIA = await res.json();
      setResultado(data);
    } catch (err: any) {
      console.warn('[Revisión Final IA] Fallback local tras error:', err);
      const local = generarRevisionFinalLocal({
        orden,
        cotizacion,
        vehiculo,
        cliente,
        refacciones,
        facturas,
        garantias,
        configuracion,
        responsable,
      });
      setResultado(local);
    } finally {
      setCargando(false);
    }
  }, [orden, cotizacion, vehiculo, cliente, refacciones, facturas, garantias, configuracion, currentUser]);

  useEffect(() => {
    if (isOpen && orden) {
      ejecutarRevision();
    } else {
      setResultado(null);
      setCopiadoMensaje(false);
      setResumenAplicado(false);
      setSeguimientoCreado(false);
      setErrorMensaje(null);
    }
  }, [isOpen, orden, ejecutarRevision]);

  if (!isOpen || !orden) return null;

  // Acciones
  const handleCopiarMensaje = async () => {
    if (!resultado?.mensajeEntregaWhatsApp) return;
    try {
      await navigator.clipboard.writeText(resultado.mensajeEntregaWhatsApp);
      setCopiadoMensaje(true);
      setTimeout(() => setCopiadoMensaje(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleAplicarResumen = () => {
    if (!resultado?.resumenCliente || !onSaveOrden) return;

    const obsPrevias = orden.observacionesMecanico ? `${orden.observacionesMecanico}\n\n` : '';
    const textoActualizado = `${obsPrevias}[Resumen de entrega al cliente]: ${resultado.resumenCliente}`;

    const ordenActualizada: OrdenTrabajo = {
      ...orden,
      observacionesMecanico: textoActualizado,
    };

    onSaveOrden(ordenActualizada);
    setResumenAplicado(true);
    setTimeout(() => setResumenAplicado(false), 3500);
  };

  const handleCrearSeguimiento = () => {
    if (!resultado || !onSaveSeguimiento) return;

    // Calcular fecha en 30 días
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    const fechaSeg = `${y}-${m}-${d}`;

    const recomendacionPrincipal =
      resultado.recomendacionesMantenimiento?.[0]?.servicio || 'Revisión preventiva periódica';

    const nuevoSeg: Seguimiento = {
      id: `seg-rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: orden.clienteId,
      vehiculoId: orden.vehiculoId,
      motivo: 'proximo_mantenimiento',
      motivoLabel: 'Próximo mantenimiento preventivo',
      registroTipo: 'orden',
      registroId: orden.id,
      registroRef: `Orden ${orden.folio}`,
      mensaje: `Seguimiento post-servicio (${orden.folio}): Verificar satisfacción del cliente y agendar ${recomendacionPrincipal}.`,
      fecha: fechaSeg,
      hora: '10:00',
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
    };

    onSaveSeguimiento(nuevoSeg);
    setSeguimientoCreado(true);
    setTimeout(() => setSeguimientoCreado(false), 3500);
  };

  // Configuración de Badges según Estado de Entrega
  const getBadgeEstadoEntrega = (estado: string) => {
    switch (estado) {
      case 'Lista para entregar':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Lista para entregar',
        };
      case 'Requiere revisión':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Requiere revisión',
        };
      case 'Incompleta':
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          label: 'Incompleta',
        };
    }
  };

  const estadoBadge = resultado ? getBadgeEstadoEntrega(resultado.estadoEntrega) : null;
  const EstadoIcon = estadoBadge ? estadoBadge.icon : CheckCircle2;

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
        {/* HEADER DEL MODAL */}
        {/* ======================================================== */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#06345A] to-[#1497F2] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  Revisión final con IA
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white backdrop-blur-xs">
                  {orden.folio}
                </span>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  {orden.estado}
                </span>
              </div>
              <p className="text-xs text-sky-100 truncate mt-0.5">
                {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'Vehículo'} • Cliente:{' '}
                {cliente?.nombre || 'Particular'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={ejecutarRevision}
              disabled={cargando}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Volver a analizar"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Volver a analizar</span>
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
        {/* BANNER AVISO OBLIGATORIO DE RESPONSABILIDAD */}
        {/* ======================================================== */}
        <div className="bg-sky-50/90 border-b border-sky-100 px-5 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-start sm:items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#1497F2] shrink-0 mt-0.5 sm:mt-0" />
            <span className="font-medium">
              Aviso: Revisión de apoyo; la liberación del vehículo corresponde al responsable de calidad.
            </span>
          </div>

          {resultado && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-sky-200 text-sky-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2]" />
                <span>{resultado.esAnalisisLocal ? 'Validación local' : resultado.modeloUtilizado || 'IA Gemini'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Notificaciones flotantes de feedback */}
        {resumenAplicado && (
          <div className="bg-sky-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-inner animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-200" />
              Resumen para el cliente aplicado y guardado en las observaciones de la orden.
            </span>
            <button
              type="button"
              onClick={() => setResumenAplicado(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {seguimientoCreado && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-inner animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              Seguimiento de mantenimiento programado en el sistema con éxito.
            </span>
            <button
              type="button"
              onClick={() => setSeguimientoCreado(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CUERPO DEL CONTENIDO SCROLLABLE */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {cargando ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center animate-pulse text-[#1497F2]">
                  <Sparkles className="w-7 h-7 animate-spin" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Auditando orden y expediente con IA...</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Revisando servicio solicitado, cotización autorizada, refacciones utilizadas, control de calidad, pagos y garantías antes de la entrega.
                </p>
              </div>
            </div>
          ) : errorMensaje ? (
            <div className="p-6 text-center bg-rose-50 rounded-xl border border-rose-200 space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-rose-800">{errorMensaje}</p>
              <button
                type="button"
                onClick={ejecutarRevision}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Reintentar auditoría
              </button>
            </div>
          ) : resultado ? (
            <>
              {/* ---------------------------------------------------- */}
              {/* 1. TARJETA PRINCIPAL: ESTADO DE ENTREGA */}
              {/* ---------------------------------------------------- */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1497F2] shrink-0 shadow-2xs">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-500 block">
                        Estado para entrega del vehículo
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {estadoBadge && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${estadoBadge.bg}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${estadoBadge.dot}`} />
                            <EstadoIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{resultado.estadoEntrega}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-200 text-left sm:text-right text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Auditor responsable</span>
                    <span className="font-semibold text-slate-800 block">
                      {resultado.responsableRevision.nombre} ({resultado.responsableRevision.rol})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Fecha: {resultado.responsableRevision.fechaRevision}
                    </span>
                  </div>
                </div>

                <div className="pt-3 text-xs text-slate-700 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Evaluación: </strong>
                    {resultado.justificacionEstado}
                  </p>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 2. PENDIENTES IMPORTANTES ANTES DE LIBERAR */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1497F2]" />
                    <span>Pendientes importantes de liberación</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Facturación, pagos, control de calidad y refacciones
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {resultado.pendientesImportantes.map((pen, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                        pen.resuelto
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                          {pen.categoria}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            pen.resuelto
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pen.resuelto ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Completo</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs leading-snug">{pen.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 3. DIFERENCIAS Y ADVERTENCIAS DETECTADAS */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Diferencias detectadas en la orden</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Trabajos vs. cotización autorizada
                  </span>
                </div>

                {resultado.diferencias && resultado.diferencias.length > 0 ? (
                  <div className="space-y-2">
                    {resultado.diferencias.map((dif, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                          dif.gravedad === 'alta'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : dif.gravedad === 'media'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            dif.gravedad === 'alta'
                              ? 'text-rose-600'
                              : dif.gravedad === 'media'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="font-bold text-xs">{dif.titulo}</span>
                            <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/70 border border-current">
                              {dif.gravedad}
                            </span>
                          </div>
                          <p className="mt-0.5 leading-relaxed">{dif.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Sin discrepancias detectadas: los trabajos realizados coinciden con el presupuesto y catálogo autorizado.
                    </span>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* 4. DATOS FALTANTES QUE DEBEN CAPTURARSE */}
              {/* ---------------------------------------------------- */}
              {resultado.datosFaltantes && resultado.datosFaltantes.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Información que todavía debe capturarse en el expediente:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 pl-1">
                    {resultado.datosFaltantes.map((df, i) => (
                      <li key={i}>{df}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 5. RESUMEN PARA EL CLIENTE (EXPLICACIÓN SENCILLA) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1497F2]" />
                    <span>Resumen claro de trabajos para el cliente</span>
                  </h3>
                  {onSaveOrden && (
                    <button
                      type="button"
                      onClick={handleAplicarResumen}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      title="Aplicar a observaciones de la orden"
                    >
                      {resumenAplicado ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">¡Aplicado a la orden!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Aplicar resumen a la orden</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
                  <p>{resultado.resumenCliente}</p>
                  <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{resultado.garantiaAplicableTexto}</span>
                  </p>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 6. RECOMENDACIONES DE MANTENIMIENTO FUTURO */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#1497F2]" />
                    <span>Recomendaciones para próximos servicios</span>
                  </h3>
                  <span className="text-xs text-slate-500">Mantenimiento preventivo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {resultado.recomendacionesMantenimiento.map((rec, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900">{rec.servicio}</span>
                        {(rec.fechaSugerida || rec.kilometrajeSugerido) && (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#1497F2] border border-sky-100">
                            {rec.fechaSugerida || rec.kilometrajeSugerido}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px]">{rec.motivo}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 7. MENSAJE DE ENTREGA POR WHATSAPP */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Mensaje de entrega para WhatsApp</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopiarMensaje}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiadoMensaje ? (
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
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-xs text-slate-800">
                  <p className="whitespace-pre-wrap leading-relaxed font-sans">
                    {resultado.mensajeEntregaWhatsApp}
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>Listo para avisar al cliente que su auto está listo</span>
                    </span>
                    <span className="text-slate-500">No se envía automáticamente</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* FOOTER CON BOTONES DE ACCIÓN */}
        {/* ======================================================== */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copiar mensaje de entrega */}
            <button
              type="button"
              onClick={handleCopiarMensaje}
              disabled={!resultado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Copiar texto para WhatsApp"
            >
              {copiadoMensaje ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar mensaje de entrega</span>
                </>
              )}
            </button>

            {/* Aplicar el resumen sugerido */}
            {onSaveOrden && (
              <button
                type="button"
                onClick={handleAplicarResumen}
                disabled={!resultado || resumenAplicado}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Guardar resumen en las observaciones de la orden"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#1497F2]" />
                <span>{resumenAplicado ? 'Resumen aplicado' : 'Aplicar el resumen sugerido'}</span>
              </button>
            )}

            {/* Crear seguimiento de mantenimiento */}
            {onSaveSeguimiento && (
              <button
                type="button"
                onClick={handleCrearSeguimiento}
                disabled={!resultado || seguimientoCreado}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Crear seguimiento preventivo"
              >
                <Calendar className="w-3.5 h-3.5 text-[#06345A]" />
                <span>{seguimientoCreado ? 'Seguimiento creado' : 'Crear seguimiento'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ejecutarRevision}
              disabled={cargando}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Volver a analizar</span>
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
