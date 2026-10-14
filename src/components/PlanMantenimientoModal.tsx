import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  User,
  ShieldCheck,
  Wrench,
  MessageSquare,
  BookmarkPlus,
  Send,
  HelpCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Vehiculo,
  Cliente,
  OrdenTrabajo,
  Cita,
  Garantia,
  ConfiguracionTaller,
  Seguimiento,
  ResultadoPlanMantenimiento,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { generarPlanMantenimientoLocal } from '../utils/planMantenimientoLocal';
import { TunnoLogo } from './TunnoLogo';

interface PlanMantenimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  cliente?: Cliente;
  ordenes: OrdenTrabajo[];
  citas: Cita[];
  garantias?: Garantia[];
  configuracion?: ConfiguracionTaller;
  onSaveSeguimiento?: (nuevoSeg: Seguimiento) => void;
  onUpdateVehiculoRecomendaciones?: (
    vehiculoId: string,
    recomendaciones: string[],
    proximaFecha?: string,
    proximoKm?: string
  ) => void;
}

export const PlanMantenimientoModal: React.FC<PlanMantenimientoModalProps> = ({
  isOpen,
  onClose,
  vehiculo,
  cliente,
  ordenes,
  citas,
  garantias = [],
  configuracion,
  onSaveSeguimiento,
  onUpdateVehiculoRecomendaciones,
}) => {
  const [cargando, setCargando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoPlanMantenimiento | null>(null);
  const [copiadoRecordatorio, setCopiadoRecordatorio] = useState<boolean>(false);
  const [seguimientoCreado, setSeguimientoCreado] = useState<boolean>(false);
  const [guardadoEnVehiculo, setGuardadoEnVehiculo] = useState<boolean>(false);
  const [mostrandoConfirmacionGuardar, setMostrandoConfirmacionGuardar] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const { handleBackdropClick } = useModalDismiss({ isOpen, onClose });

  const ejecutarAnalisis = useCallback(async () => {
    if (!vehiculo) return;

    setCargando(true);
    setErrorMensaje(null);
    setSeguimientoCreado(false);
    setGuardadoEnVehiculo(false);
    setMostrandoConfirmacionGuardar(false);

    try {
      const res = await fetch('/api/generar-plan-mantenimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiculo,
          cliente,
          ordenes,
          citas,
          garantias,
          configuracion,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor (${res.status})`);
      }

      const data: ResultadoPlanMantenimiento = await res.json();
      setResultado(data);
    } catch (err: any) {
      console.warn('[Plan Mantenimiento IA] Fallback local tras error:', err);
      // Fallback local garantizado
      const local = generarPlanMantenimientoLocal({
        vehiculo,
        cliente,
        ordenes,
        citas,
        garantias,
        configuracion,
      });
      setResultado(local);
    } finally {
      setCargando(false);
    }
  }, [vehiculo, cliente, ordenes, citas, garantias, configuracion]);

  useEffect(() => {
    if (isOpen && vehiculo) {
      ejecutarAnalisis();
    } else {
      setResultado(null);
      setCopiadoRecordatorio(false);
      setSeguimientoCreado(false);
      setGuardadoEnVehiculo(false);
      setMostrandoConfirmacionGuardar(false);
      setErrorMensaje(null);
    }
  }, [isOpen, vehiculo, ejecutarAnalisis]);

  if (!isOpen || !vehiculo) return null;

  // Acciones
  const handleCopiarRecordatorio = async () => {
    if (!resultado?.mensajeRecordatorioWhatsApp) return;
    try {
      await navigator.clipboard.writeText(resultado.mensajeRecordatorioWhatsApp);
      setCopiadoRecordatorio(true);
      setTimeout(() => setCopiadoRecordatorio(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCrearSeguimiento = () => {
    if (!resultado || !onSaveSeguimiento) return;

    const fechaSeguimiento = resultado.fechaSugeridaRevision || new Date().toISOString().split('T')[0];
    const nuevoSeg: Seguimiento = {
      id: `seg-plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: vehiculo.clienteId,
      vehiculoId: vehiculo.id,
      motivo: 'proximo_mantenimiento',
      motivoLabel: 'Próximo mantenimiento preventivo',
      registroTipo: 'mantenimiento',
      registroRef: `Vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`,
      mensaje: resultado.mensajeRecordatorioWhatsApp,
      fecha: fechaSeguimiento,
      hora: '10:00',
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
    };

    onSaveSeguimiento(nuevoSeg);
    setSeguimientoCreado(true);
    setTimeout(() => setSeguimientoCreado(false), 3500);
  };

  const handleConfirmarGuardarEnVehiculo = () => {
    if (!resultado || !onUpdateVehiculoRecomendaciones) return;

    const listaRecomendaciones = resultado.serviciosRecomendados.map(
      (s) => `${s.servicio} (${s.prioridad}): ${s.justificacion}`
    );

    onUpdateVehiculoRecomendaciones(
      vehiculo.id,
      listaRecomendaciones,
      resultado.fechaSugeridaRevision,
      resultado.kilometrajeSugeridoRevision
    );

    setGuardadoEnVehiculo(true);
    setMostrandoConfirmacionGuardar(false);
    setTimeout(() => setGuardadoEnVehiculo(false), 3500);
  };

  const handleImprimir = () => {
    window.print();
  };

  // Badges y colores
  const getBadgeEstadoGeneral = (estado: string) => {
    switch (estado) {
      case 'Al corriente':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Al corriente',
        };
      case 'Próximo':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Próximo a revisión',
        };
      case 'Vencido':
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Mantenimiento vencido',
        };
    }
  };

  const getBadgePrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Media':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Baja':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const estadoBadge = resultado ? getBadgeEstadoGeneral(resultado.estadoGeneral) : null;

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
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#06345A] to-[#1497F2] text-white flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  Plan de mantenimiento con IA
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs">
                  <Car className="w-3 h-3" />
                  <span>{vehiculo.placas}</span>
                </span>
              </div>
              <p className="text-xs text-sky-100 truncate mt-0.5">
                {vehiculo.marca} {vehiculo.modelo} {vehiculo.año ? `(${vehiculo.año})` : ''} • Propietario:{' '}
                {cliente?.nombre || 'Particular'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={ejecutarAnalisis}
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
        {/* BANNER AVISO OBLIGATORIO Y ESTADO DEL SERVICIO */}
        {/* ======================================================== */}
        <div className="bg-sky-50/80 border-b border-sky-100 px-5 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0 no-print">
          <div className="flex items-start sm:items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#1497F2] shrink-0 mt-0.5 sm:mt-0" />
            <span className="font-medium">
              Aviso: Plan preventivo de apoyo; debe validarse según el manual del fabricante y la inspección del técnico.
            </span>
          </div>

          {resultado && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-sky-200 text-sky-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2]" />
                <span>{resultado.esAnalisisLocal ? 'Motor local' : resultado.modeloUtilizado || 'IA Gemini'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Notificaciones flotantes de feedback */}
        {seguimientoCreado && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-inner no-print animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              Seguimiento creado exitosamente en el taller para la fecha sugerida.
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

        {guardadoEnVehiculo && (
          <div className="bg-sky-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shadow-inner no-print animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-200" />
              Recomendaciones y próximo servicio guardados en la ficha del vehículo.
            </span>
            <button
              type="button"
              onClick={() => setGuardadoEnVehiculo(false)}
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
                <p className="text-sm font-bold text-slate-800">Analizando historial vehicular con IA...</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Revisando kilometraje, órdenes registradas, fechas de visitas anteriores y componentes inspeccionados.
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
                Reintentar análisis
              </button>
            </div>
          ) : resultado ? (
            <>
              {/* Membrete para impresión oficial */}
              <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TunnoLogo variant="positive" format="horizontal" size="sm" />
                      <h1 className="text-base font-bold font-heading text-[#06345A]">
                        {configuracion?.nombre || 'TUNNO'}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600">Plan Preventivo de Mantenimiento Vehicular</p>
                    <p className="text-[11px] text-slate-500">
                      Emitido el: {new Date().toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-slate-800">PLACA: {vehiculo.placas}</p>
                    <p className="text-xs text-slate-600">
                      {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año || 'N/D'})
                    </p>
                    <p className="text-xs text-slate-600">Cliente: {cliente?.nombre || 'Particular'}</p>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 1. TARJETA DE ESTADO GENERAL Y RESUMEN EJECUTIVO */}
              {/* ---------------------------------------------------- */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1497F2] shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-500 block">
                        Estado general del mantenimiento
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {estadoBadge && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${estadoBadge.bg}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${estadoBadge.dot}`} />
                            <span>{resultado.estadoGeneral}</span>
                          </span>
                        )}
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgePrioridad(
                            resultado.prioridadGlobal
                          )}`}
                        >
                          Prioridad {resultado.prioridadGlobal}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha sugerida</span>
                      <span className="font-bold text-xs sm:text-sm text-[#1497F2] flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {resultado.fechaSugeridaRevision
                            ? new Date(resultado.fechaSugeridaRevision + 'T12:00:00').toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Inmediata'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kilometraje meta</span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {resultado.kilometrajeSugeridoRevision || 'Por verificar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <p>
                    <strong className="text-slate-900">Diagnóstico de periodicidad: </strong>
                    {resultado.justificacionEstadoGeneral}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    <strong className="text-slate-800">Fundamento del historial: </strong>
                    {resultado.justificacionGeneral}
                  </p>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 2. SERVICIOS RECOMENDADOS (PREVENTIVOS) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1497F2]" />
                    <span>Servicios recomendados para próxima revisión</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {resultado.serviciosRecomendados.length} recomendación(es)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resultado.serviciosRecomendados.map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-[#1497F2]/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 leading-tight">
                            {srv.servicio}
                          </span>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgePrioridad(
                              srv.prioridad
                            )}`}
                          >
                            {srv.prioridad}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="inline-block px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                            {srv.sistema}
                          </span>
                          {srv.kilometrajeSugerido && (
                            <span>• {srv.kilometrajeSugerido}</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-normal pt-1">
                          <span className="text-slate-400 font-medium">Justificación: </span>
                          {srv.justificacion}
                        </p>
                      </div>

                      {srv.fechaSugerida && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Sugerido para:</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(srv.fechaSugerida + 'T12:00:00').toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 3. PLAN RESUMIDO (CRONOLÓGICO / POR KILOMETRAJE) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1497F2]" />
                    <span>Plan resumido (Secuencia de mantenimiento)</span>
                  </h3>
                  <span className="text-xs text-slate-500">Orden cronológico recomendado</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Servicio preventivo</th>
                          <th className="py-2.5 px-3">Fecha sugerida</th>
                          <th className="py-2.5 px-3">Kilometraje</th>
                          <th className="py-2.5 px-3">Prioridad</th>
                          <th className="py-2.5 px-3">Acción sugerida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultado.planResumido.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                              {item.orden}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {item.servicio}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {item.fechaSugerida
                                ? new Date(item.fechaSugerida + 'T12:00:00').toLocaleDateString('es-MX')
                                : 'Inmediato'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {item.kilometrajeSugerido}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgePrioridad(
                                  item.prioridad
                                )}`}
                              >
                                {item.prioridad}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {item.accionSugerida}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 4. DATOS FALTANTES QUE CONVIENE CAPTURAR */}
              {/* ---------------------------------------------------- */}
              {resultado.datosFaltantes && resultado.datosFaltantes.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Datos técnicos o antecedentes pendientes de registrar:</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Para calibrar las recomendaciones futuras con mayor precisión, se sugiere verificar con el cliente o en recepción:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 pl-1">
                    {resultado.datosFaltantes.map((df, i) => (
                      <li key={i}>{df}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 5. MENSAJE PARA EL CLIENTE (WHATSAPP RECORDATORIO) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2 no-print">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Recordatorio sugerido para el cliente (WhatsApp)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopiarRecordatorio}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiadoRecordatorio ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar recordatorio</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-xs text-slate-800 relative group">
                  <p className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800">
                    {resultado.mensajeRecordatorioWhatsApp}
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>Listo para enviar por WhatsApp o llamada</span>
                    </span>
                    <span className="text-slate-500">No se envían mensajes automáticamente</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* CONFIRMACIÓN DE GUARDAR EN VEHÍCULO (MODAL INLINE) */}
        {/* ======================================================== */}
        {mostrandoConfirmacionGuardar && (
          <div className="bg-amber-50 border-t border-amber-200 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in no-print">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">¿Confirmas guardar estas recomendaciones en el vehículo?</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Se actualizará la fecha de próximo servicio a{' '}
                  <strong>{resultado?.fechaSugeridaRevision || 'N/D'}</strong> y se almacenarán las recomendaciones
                  preventivas en su expediente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setMostrandoConfirmacionGuardar(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarGuardarEnVehiculo}
                className="px-3.5 py-1.5 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold shadow-xs cursor-pointer"
              >
                Sí, confirmar y guardar
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* FOOTER CON BOTONES DE ACCIÓN */}
        {/* ======================================================== */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copiar recordatorio */}
            <button
              type="button"
              onClick={handleCopiarRecordatorio}
              disabled={!resultado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Copiar texto para WhatsApp"
            >
              {copiadoRecordatorio ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar recordatorio</span>
                </>
              )}
            </button>

            {/* Crear seguimiento */}
            {onSaveSeguimiento && (
              <button
                type="button"
                onClick={handleCrearSeguimiento}
                disabled={!resultado || seguimientoCreado}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Crear seguimiento en el taller"
              >
                <Calendar className="w-3.5 h-3.5 text-[#1497F2]" />
                <span>{seguimientoCreado ? 'Seguimiento creado' : 'Crear seguimiento'}</span>
              </button>
            )}

            {/* Guardar en vehículo */}
            {onUpdateVehiculoRecomendaciones && (
              <button
                type="button"
                onClick={() => setMostrandoConfirmacionGuardar(true)}
                disabled={!resultado || guardadoEnVehiculo}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Guardar recomendación en la ficha del vehículo"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#06345A]" />
                <span>{guardadoEnVehiculo ? 'Guardado en ficha' : 'Guardar en vehículo'}</span>
              </button>
            )}

            {/* Imprimir plan */}
            <button
              type="button"
              onClick={handleImprimir}
              disabled={!resultado}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Imprimir documento de mantenimiento"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir plan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ejecutarAnalisis}
              disabled={cargando}
              className="inline-flex sm:hidden items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
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
