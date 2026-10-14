import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  FileText,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Bot,
  Car,
  User,
} from 'lucide-react';
import { Cotizacion, Cliente, Vehiculo, ServicioCatalogo, ConfiguracionTaller, Refaccion } from '../types';
import {
  AnalisisCotizacionResultado,
  generarAnalisisCotizacionLocal,
} from '../utils/analisisCotizacionLocal';

interface AnalisisCotizacionModalProps {
  cotizacion: Cotizacion | null;
  cliente?: Cliente | null;
  vehiculo?: Vehiculo | null;
  servicios?: ServicioCatalogo[];
  refacciones?: Refaccion[];
  configuracion?: ConfiguracionTaller | null;
  onClose: () => void;
  onApplyDescripcion: (cotizacionId: string, nuevaDescripcion: string) => void;
}

export const AnalisisCotizacionModal: React.FC<AnalisisCotizacionModalProps> = ({
  cotizacion,
  cliente,
  vehiculo,
  servicios,
  refacciones,
  configuracion,
  onClose,
  onApplyDescripcion,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analisis, setAnalisis] = useState<AnalisisCotizacionResultado | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [showConfirmApply, setShowConfirmApply] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  const fetchAnalisis = useCallback(async () => {
    if (!cotizacion) return;

    setLoading(true);
    setErrorMsg(null);
    setCopiedWhatsApp(false);
    setApplySuccess(false);

    try {
      const response = await fetch('/api/analizar-cotizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cotizacion,
          cliente,
          vehiculo,
          servicios,
          refacciones,
          configuracion,
        }),
      });

      if (!response.ok) {
        throw new Error(`Respuesta del servidor: ${response.statusText}`);
      }

      const data: AnalisisCotizacionResultado = await response.json();
      setAnalisis(data);
    } catch (err: any) {
      console.warn('Fallo al obtener análisis desde backend, usando respaldo local:', err);
      // Respaldo local inmediato para que la demostración continúe funcionando sin interrupciones
      const localResult = generarAnalisisCotizacionLocal({
        cotizacion,
        cliente,
        vehiculo,
        servicios,
        refacciones,
        configuracion,
      });
      setAnalisis({
        ...localResult,
        esAnalisisLocal: true,
        modeloUtilizado: 'Análisis local heurístico (Respaldo sin conexión)',
      });
    } finally {
      setLoading(false);
    }
  }, [cotizacion, cliente, vehiculo, servicios, refacciones, configuracion]);

  useEffect(() => {
    if (cotizacion) {
      fetchAnalisis();
    }
  }, [cotizacion, fetchAnalisis]);

  // Tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmApply) {
          setShowConfirmApply(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showConfirmApply]);

  // Bloqueo de scroll de la página de fondo
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  if (!cotizacion) return null;

  const handleCopyWhatsApp = () => {
    if (!analisis?.mensajeWhatsApp) return;
    navigator.clipboard.writeText(analisis.mensajeWhatsApp);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleConfirmApply = () => {
    if (!analisis?.descripcionMejorada) return;
    onApplyDescripcion(cotizacion.id, analisis.descripcionMejorada);
    setShowConfirmApply(false);
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 3500);
  };

  const cleanPhone = cliente?.telefono?.replace(/[^0-9]/g, '') || '';
  const whatsAppUrl = cleanPhone && analisis?.mensajeWhatsApp
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(analisis.mensajeWhatsApp)}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showConfirmApply) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ia-analisis-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden relative min-h-0 animate-in fade-in zoom-in-95 duration-150 border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO SUPERIOR */}
        <div className="bg-gradient-to-r from-[#06345A] to-[#1497F2] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="ia-analisis-title" className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Revisión Inteligente con IA
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/20 text-white border border-white/30">
                  {cotizacion.folio}
                </span>
              </div>
              <p className="text-[11px] text-blue-100 truncate mt-0.5">
                Auditoría técnica, márgenes comerciales y asistencia para asesor automotriz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar análisis"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DESPLAZABLE */}
        <div
          className="p-5 sm:p-6 md:p-7 bg-[#F4F6F8] overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-5 text-xs text-[#06345A]"
          style={{
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* ESTADO: ANALIZANDO (CARGA) */}
          {loading && (
            <div className="p-8 sm:p-12 text-center space-y-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
              <div className="relative w-14 h-14 mx-auto">
                <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-60" />
                <div className="relative w-14 h-14 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
                  <Bot className="w-7 h-7 animate-bounce" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#06345A]">
                  Analizando cotización {cotizacion.folio}…
                </h4>
                <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                  Revisando datos del cliente, vehículo, precios, consistencia aritmética, margen de utilidad y claridad de la propuesta.
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2 pt-2 text-left font-mono text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-pulse" />
                  <span>Auditando datos del cliente y vehículo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                  <span>Calculando margen y costos estimados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Generando sugerencia para WhatsApp</span>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO: ERROR Y REINTENTO */}
          {!loading && errorMsg && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Ocurrió un error al procesar el análisis</span>
              </div>
              <p className="text-xs text-rose-700">{errorMsg}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={fetchAnalisis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          )}

          {/* MENSAJE DE ÉXITO AL APLICAR DESCRIPCIÓN */}
          {applySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Descripción actualizada con éxito!</strong> La cotización ahora incluye la redacción profesional sugerida por la IA.
              </span>
            </div>
          )}

          {/* RESULTADOS DEL ANÁLISIS */}
          {!loading && analisis && (
            <>
              {/* Tarjeta de contexto de la cotización analizada */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E5E7EB] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#1497F2] border border-sky-200 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}` : 'Vehículo no registrado'}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      Placas: <strong className="font-mono text-slate-700">{vehiculo?.placas || 'S/P'}</strong>
                      {(vehiculo as any)?.kilometraje ? ` • Odómetro: ${(vehiculo as any).kilometraje}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-medium">
                    {cliente?.nombre || 'Cliente no asignado'}
                  </span>
                  {cliente?.telefono && (
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {cliente.telefono}
                    </span>
                  )}
                </div>
              </div>

              {/* 1. ESTADO GENERAL */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    1. Estado General de la Cotización
                  </span>
                  <div className="flex items-center gap-2">
                    {analisis.esAnalisisLocal && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200" title="Ejecutado con motor heurístico local">
                        Modo Demostración Local
                      </span>
                    )}
                    {analisis.modeloUtilizado && !analisis.esAnalisisLocal && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>{analisis.modeloUtilizado}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      analisis.estadoGeneral === 'Correcta'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : analisis.estadoGeneral === 'Requiere revisión'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {analisis.estadoGeneral === 'Correcta' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : analisis.estadoGeneral === 'Requiere revisión' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{analisis.estadoGeneral}</span>
                  </span>

                  <p className="text-xs text-slate-700 font-medium">
                    {analisis.resumenEstado}
                  </p>
                </div>
              </div>

              {/* 2. ALERTAS ENCONTRADAS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    2. Alertas y Puntos de Atención ({analisis.alertas.length})
                  </span>
                </div>

                {analisis.alertas.length > 0 ? (
                  <div className="space-y-2">
                    {analisis.alertas.map((alerta, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                          alerta.tipo === 'error'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                            : alerta.tipo === 'advertencia'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-sky-50/70 border-sky-200 text-sky-950'
                        }`}
                      >
                        {alerta.tipo === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        ) : alerta.tipo === 'advertencia' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-[#1497F2] mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-0.5 flex-1">
                          <strong className="font-semibold block text-xs">
                            {alerta.titulo}
                          </strong>
                          <p className="text-[11px] text-slate-700 leading-relaxed">
                            {alerta.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No se identificaron inconsistencias aritméticas ni omisiones críticas.</span>
                  </div>
                )}
              </div>

              {/* 3. COSTOS, PRECIO DE VENTA Y MARGEN ESTIMADO */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  3. Análisis Financiero y Margen Estimado
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Costo Estimado
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-800 block">
                      ${analisis.metricasFinancieras.costoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Piezas + Costo MO
                    </span>
                  </div>

                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-[#1497F2] uppercase tracking-wider font-semibold block">
                      Precio de Venta
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      ${analisis.metricasFinancieras.precioVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Total al cliente
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold block">
                      Utilidad Bruta
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-900 block">
                      ${analisis.metricasFinancieras.utilidadBruta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      Ganancia estimada
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-purple-700 uppercase tracking-wider font-semibold block">
                      Margen Estimado
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-sm font-bold font-mono text-purple-900">
                        {analisis.metricasFinancieras.margenEstimadoPorcentaje}%
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-600 block">
                      Margen sobre venta
                    </span>
                  </div>
                </div>

                {/* Observación sobre el margen */}
                {analisis.metricasFinancieras.observacionMargen && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-sans">
                    💡 <strong>Evaluación financiera:</strong> {analisis.metricasFinancieras.observacionMargen}
                  </p>
                )}
              </div>

              {/* 4. RECOMENDACIONES CONCRETAS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  4. Recomendaciones Concretas
                </span>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  {analisis.recomendaciones.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2] mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. DESCRIPCIÓN MEJORADA DEL SERVICIO */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    5. Descripción Mejorada del Servicio
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfirmApply(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Aplicar únicamente esta descripción</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 whitespace-pre-line leading-relaxed font-sans text-xs">
                  {analisis.descripcionMejorada}
                </div>
                <p className="text-[10px] text-slate-400">
                  * Esta opción solo actualiza la redacción del trabajo para mayor claridad del cliente; los precios de refacciones, mano de obra y el total permanecen intactos.
                </p>
              </div>

              {/* 6. MENSAJE BREVE PARA WHATSAPP */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      6. Mensaje para Enviar al Cliente por WhatsApp
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar mensaje</span>
                        </>
                      )}
                    </button>

                    {whatsAppUrl && (
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors"
                        title="Abrir chat en WhatsApp Web o Móvil"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir chat</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/40 border border-emerald-200/80 rounded-lg text-emerald-950 font-sans text-xs whitespace-pre-line leading-relaxed shadow-2xs">
                  {analisis.mensajeWhatsApp}
                </div>
              </div>
            </>
          )}
        </div>

        {/* BARRA INFERIOR DE ACCIONES */}
        <div className="bg-white border-t border-[#E5E7EB] px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchAnalisis}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Volver a analizar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar análisis
          </button>
        </div>

        {/* MODAL DE CONFIRMACIÓN: APLICAR ÚNICAMENTE LA DESCRIPCIÓN SUGERIDA */}
        {showConfirmApply && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowConfirmApply(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#1497F2] border border-sky-200 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Confirmar cambio de descripción
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Cotización {cotizacion.folio}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                ¿Deseas reemplazar la descripción actual de la cotización por la versión mejorada redactada por la IA?
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                ⚠️ <strong>Nota de seguridad:</strong> Los importes de refacciones (${cotizacion.importeRefacciones.toFixed(2)}), mano de obra (${cotizacion.importeManoObra.toFixed(2)}) y el total (${cotizacion.total.toFixed(2)}) <strong>no se modificarán</strong>.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmApply(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-4 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Sí, aplicar descripción
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
