import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Layers,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Info,
  Loader2,
  Share2,
} from 'lucide-react';
import {
  OrdenTrabajo,
  Cotizacion,
  Cita,
  Factura,
  Refaccion,
  ServicioCatalogo,
  MovimientoInventario,
  Empleado,
  Cliente,
  Seguimiento,
  Garantia,
  ConfiguracionTaller,
  PeriodoAnalisisGerencial,
  ResultadoAnalisisGerencialIA,
} from '../types';
import { generarAnalisisGerencialLocal } from '../utils/analisisGerencialLocal';
import { TunnoLogo } from './TunnoLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AnalisisGerencialModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenes: OrdenTrabajo[];
  cotizaciones: Cotizacion[];
  citas: Cita[];
  facturas: Factura[];
  refacciones: Refaccion[];
  servicios: ServicioCatalogo[];
  movimientos?: MovimientoInventario[];
  empleados?: Empleado[];
  clientes?: Cliente[];
  seguimientos?: Seguimiento[];
  garantias?: Garantia[];
  configuracion: ConfiguracionTaller;
}

export const AnalisisGerencialModal: React.FC<AnalisisGerencialModalProps> = ({
  isOpen,
  onClose,
  ordenes,
  cotizaciones,
  citas,
  facturas,
  refacciones,
  servicios,
  movimientos = [],
  empleados = [],
  clientes = [],
  seguimientos = [],
  garantias = [],
  configuracion,
}) => {
  // Manejo de cierre por tecla Escape y backdrop
  const { handleBackdropClick } = useModalDismiss({ isOpen, onClose });

  // Estado del periodo
  const [periodo, setPeriodo] = useState<PeriodoAnalisisGerencial>('este_mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estado de análisis
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAnalisisGerencialIA | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de feedback de copiado
  const [copiadoEjecutivo, setCopiadoEjecutivo] = useState(false);
  const [copiadoMensaje, setCopiadoMensaje] = useState(false);

  // Pestaña visual activa dentro del reporte para navegación rápida en celular/desktop
  const [seccionActiva, setSeccionActiva] = useState<
    'resumen' | 'indicadores' | 'recomendaciones' | 'compartir'
  >('resumen');

  // Inicializar fechas por defecto para periodo personalizado si no están seteadas
  useEffect(() => {
    if (!fechaDesde || !fechaHasta) {
      const hoy = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
      const hace30Dias = new Date(hoy.getTime() - 30 * 86400000);
      const hace30Str = `${hace30Dias.getFullYear()}-${pad(hace30Dias.getMonth() + 1)}-${pad(
        hace30Dias.getDate()
      )}`;
      setFechaDesde(hace30Str);
      setFechaHasta(hoyStr);
    }
  }, [fechaDesde, fechaHasta]);

  // Función principal para ejecutar o re-ejecutar el análisis
  const ejecutarAnalisis = useCallback(
    async (periodoAUsar: PeriodoAnalisisGerencial = periodo) => {
      setIsLoading(true);
      setError(null);

      const payload = {
        ordenes,
        cotizaciones,
        citas,
        facturas,
        refacciones,
        servicios,
        movimientos,
        empleados,
        clientes,
        seguimientos,
        garantias,
        configuracion,
        periodo: periodoAUsar,
        fechaDesde: periodoAUsar === 'personalizado' ? fechaDesde : undefined,
        fechaHasta: periodoAUsar === 'personalizado' ? fechaHasta : undefined,
      };

      try {
        const response = await fetch('/api/analizar-gerencial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error en el servidor: HTTP ${response.status}`);
        }

        const data: ResultadoAnalisisGerencialIA = await response.json();
        setResultado(data);
      } catch (err: any) {
        console.warn(
          'Fallo la llamada al endpoint de IA, ejecutando análisis gerencial localmente:',
          err
        );
        // Fallback local garantizado conforme a las reglas obligatorias
        try {
          const localData = generarAnalisisGerencialLocal(payload);
          setResultado(localData);
        } catch (localErr: any) {
          setError(
            'No fue posible calcular el análisis con los datos actuales: ' +
              (localErr?.message || 'Error desconocido')
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      periodo,
      fechaDesde,
      fechaHasta,
      ordenes,
      cotizaciones,
      citas,
      facturas,
      refacciones,
      servicios,
      movimientos,
      empleados,
      clientes,
      seguimientos,
      garantias,
      configuracion,
    ]
  );

  // Ejecutar automáticamente al abrir por primera vez si no hay resultado
  useEffect(() => {
    if (isOpen && !resultado && !isLoading) {
      ejecutarAnalisis();
    }
  }, [isOpen, resultado, isLoading, ejecutarAnalisis]);

  if (!isOpen) return null;

  // Cambiar periodo y re-analizar
  const handleCambiarPeriodo = (nuevoPeriodo: PeriodoAnalisisGerencial) => {
    setPeriodo(nuevoPeriodo);
    ejecutarAnalisis(nuevoPeriodo);
  };

  // Copiar resumen ejecutivo al portapapeles
  const handleCopiarEjecutivo = () => {
    if (!resultado?.resumenEjecutivo) return;
    navigator.clipboard.writeText(resultado.resumenEjecutivo);
    setCopiadoEjecutivo(true);
    setTimeout(() => setCopiadoEjecutivo(false), 2200);
  };

  // Copiar mensaje para el gerente
  const handleCopiarMensaje = () => {
    if (!resultado?.resumenParaCompartir) return;
    navigator.clipboard.writeText(resultado.resumenParaCompartir);
    setCopiadoMensaje(true);
    setTimeout(() => setCopiadoMensaje(false), 2200);
  };

  // Imprimir análisis
  const handleImprimir = () => {
    window.print();
  };

  const ind = resultado?.indicadores;
  const comp = resultado?.comparacion;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-analisis-gerencial"
      >
        {/* ======================================================== */}
        {/* ENCABEZADO DEL MODAL */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-[#06345A] via-[#1497F2] to-[#06345A] text-white px-5 py-4.5 sm:px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="titulo-analisis-gerencial"
                  className="text-lg sm:text-xl font-bold tracking-tight text-white"
                >
                  Análisis gerencial con IA
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white/90 border border-white/25 hidden sm:inline-block">
                  Reportes & Estrategia
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Evaluación integral de finanzas, operaciones, ventas y calidad del taller.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Cerrar análisis gerencial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* BARRA DE CONTROL: SELECTOR DE PERIODO Y ACCIONES RÁPIDAS */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 no-print">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Periodo:
            </span>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('hoy')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodo === 'hoy'
                  ? 'bg-[#06345A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('ultimos_7_dias')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodo === 'ultimos_7_dias'
                  ? 'bg-[#06345A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => handleCambiarPeriodo('este_mes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodo === 'este_mes'
                  ? 'bg-[#06345A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('personalizado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodo === 'personalizado'
                  ? 'bg-[#06345A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Personalizado
            </button>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => ejecutarAnalisis()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Volver a analizar con los datos más recientes"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#1497F2]' : ''}`} />
              <span>Volver a analizar</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* SELECTOR PERSONALIZADO EXTENDIDO SI SE ELIGE 'personalizado' */}
        {periodo === 'personalizado' && (
          <div className="bg-amber-50/70 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs text-amber-900 no-print animate-in fade-in">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>Rango de fechas:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1497F2]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1497F2]"
              />
            </div>
            <button
              type="button"
              onClick={() => ejecutarAnalisis('personalizado')}
              disabled={isLoading || !fechaDesde || !fechaHasta}
              className="px-3 py-1 rounded bg-[#06345A] text-white font-semibold hover:bg-[#1497F2] transition-colors cursor-pointer disabled:opacity-50"
            >
              Aplicar rango
            </button>
          </div>
        )}

        {/* NAVEGACIÓN SECUNDARIA INTERNA (TABS PARA PANTALLA) */}
        {resultado && (
          <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto no-print">
            <button
              type="button"
              onClick={() => setSeccionActiva('resumen')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                seccionActiva === 'resumen'
                  ? 'border-[#06345A] text-[#06345A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Resumen & Diagnóstico
            </button>
            <button
              type="button"
              onClick={() => setSeccionActiva('indicadores')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                seccionActiva === 'indicadores'
                  ? 'border-[#06345A] text-[#06345A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Indicadores clave ({ind?.ordenesTotales || 0} órdenes)
            </button>
            <button
              type="button"
              onClick={() => setSeccionActiva('recomendaciones')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                seccionActiva === 'recomendaciones'
                  ? 'border-[#06345A] text-[#06345A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Recomendaciones ({resultado.recomendaciones.length})
            </button>
            <button
              type="button"
              onClick={() => setSeccionActiva('compartir')}
              className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                seccionActiva === 'compartir'
                  ? 'border-[#06345A] text-[#06345A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Mensaje para gerente</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CUERPO DEL MODAL (SCROLLABLE & PRINTABLE) */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ENCABEZADO DE IMPRESIÓN (Visible al imprimir) */}
          <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800 text-left">
            <div className="flex items-start justify-between">
              <div>
                <TunnoLogo variant="positive" format="horizontal" size="sm" />
                <h1 className="text-2xl font-bold font-heading text-[#06345A] mt-2">
                  Informe de Análisis Gerencial con IA
                </h1>
                <p className="text-xs text-slate-600">
                  {configuracion.nombre || 'Taller Mecánico'} • {resultado?.etiquetaPeriodo} ({resultado?.rangoFechas.desde} al{' '}
                  {resultado?.rangoFechas.hasta})
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                <p>Fecha de emisión: {new Date().toLocaleDateString('es-MX')}</p>
                <p>Generado por: Asistente IA Gerencial</p>
              </div>
            </div>
          </div>

          {/* SPINNER DE CARGA */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-[#06345A] border border-blue-200">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Analizando información…
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Revisando ingresos, costos de mano de obra y refacciones, tasa de conversión,
                  desempeño de técnicos y tiempos de entrega del periodo.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar análisis
                </button>
              </div>
            </div>
          )}

          {/* MENSAJE DE ERROR */}
          {!isLoading && error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ocurrió un inconveniente al generar el análisis</p>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => ejecutarAnalisis()}
                  className="mt-2.5 px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* RESULTADO COMPLETO */}
          {!isLoading && resultado && (
            <div className="space-y-6">
              {/* Aviso si Gemini no responde y se usa el análisis local */}
              {resultado.esAnalisisLocal && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    El servicio en la nube de Gemini no estuvo disponible temporalmente. Se utilizó el <strong>análisis gerencial local de TUNNO</strong> para calcular los indicadores y recomendaciones del periodo.
                  </p>
                </div>
              )}
              {/* ======================================================== */}
              {/* VISTA 1: RESUMEN EJECUTIVO & BALANCE DEL PERIODO */}
              {/* ======================================================== */}
              {(seccionActiva === 'resumen' || window.matchMedia?.('print').matches) && (
                <div className="space-y-6">
                  {/* RESUMEN EJECUTIVO BOX */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-5 shadow-xs relative">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1497F2]" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          1. Resumen ejecutivo
                        </h3>
                        <span className="text-xs text-slate-500 font-normal">
                          ({resultado.etiquetaPeriodo})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopiarEjecutivo}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 text-[#06345A] border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto no-print"
                      >
                        {copiadoEjecutivo ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar resumen</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {resultado.resumenEjecutivo}
                    </p>

                    {/* COMPARACIÓN CON PERIODO ANTERIOR */}
                    {comp && (
                      <div className="mt-4 pt-3 border-t border-slate-200/60 bg-white/70 rounded-lg p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-[#1497F2]" />
                            Contraste con {comp.periodoAnteriorNombre}:
                          </span>
                          <p className="text-slate-600">{comp.resumenComparativa}</p>
                        </div>
                        {comp.disponible && (
                          <div className="flex items-center gap-3 shrink-0 flex-wrap">
                            {typeof comp.cambioIngresosPorcentaje === 'number' && (
                              <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-center">
                                <span className="block text-[10px] text-slate-500 uppercase">
                                  Ingresos
                                </span>
                                <span
                                  className={`font-bold flex items-center justify-center gap-0.5 ${
                                    comp.cambioIngresosPorcentaje >= 0
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {comp.cambioIngresosPorcentaje >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {comp.cambioIngresosPorcentaje > 0 ? '+' : ''}
                                  {comp.cambioIngresosPorcentaje}%
                                </span>
                              </div>
                            )}

                            {typeof comp.cambioConversionPorcentaje === 'number' && (
                              <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-center">
                                <span className="block text-[10px] text-slate-500 uppercase">
                                  Conversión
                                </span>
                                <span
                                  className={`font-bold flex items-center justify-center gap-0.5 ${
                                    comp.cambioConversionPorcentaje >= 0
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {comp.cambioConversionPorcentaje >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {comp.cambioConversionPorcentaje > 0 ? '+' : ''}
                                  {comp.cambioConversionPorcentaje}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CUADRICULA: ASPECTOS POSITIVOS VS SITUACIONES QUE REQUIEREN ATENCIÓN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ASPECTOS POSITIVOS */}
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4.5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-900 pb-2 border-b border-emerald-200/70">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          2. Aspectos positivos encontrados
                        </h4>
                      </div>
                      <ul className="space-y-2.5 text-xs text-slate-700">
                        {resultado.aspectosPositivos.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SITUACIONES QUE REQUIEREN ATENCIÓN */}
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4.5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 pb-2 border-b border-amber-200/70">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          3. Situaciones que requieren atención
                        </h4>
                      </div>
                      <ul className="space-y-2.5 text-xs text-slate-700">
                        {resultado.situacionesAtencion.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* DATOS FALTANTES / OBSERVACIONES DE RIGOR */}
                  {resultado.datosFaltantes && resultado.datosFaltantes.length > 0 && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#1497F2] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-semibold text-[#06345A]">
                          Campos o datos identificados para mayor precisión:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                          {resultado.datosFaltantes.map((df, idx) => (
                            <li key={idx}>{df}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA 2: INDICADORES CLAVE DETALLADOS */}
              {/* ======================================================== */}
              {(seccionActiva === 'indicadores' || window.matchMedia?.('print').matches) && ind && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#06345A]" />
                      <span>5. Indicadores destacados utilizados para el análisis</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      {ind.ordenesTotales} órdenes • {ind.cotizacionesTotales} cotizaciones
                    </span>
                  </div>

                  {/* TARJETAS KPI DE ALTO IMPACTO */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* INGRESOS TOTALES */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Ingresos Totales</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-900">
                        ${ind.ingresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                        <span>Cobrado: ${ind.ingresosCobrados.toLocaleString('es-MX')}</span>
                      </div>
                    </div>

                    {/* SALDO PENDIENTE */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Por Cobrar</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-base sm:text-lg font-bold text-amber-800">
                        ${ind.ingresosPendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {ind.ordenesEnProceso} órdenes por liquidar
                      </div>
                    </div>

                    {/* MARGEN ESTIMADO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Margen Bruto Est.</span>
                        <TrendingUp className="w-4 h-4 text-[#1497F2]" />
                      </div>
                      <div className="text-base sm:text-lg font-bold text-[#06345A]">
                        {ind.margenEstimadoPorcentaje}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        ${ind.margenEstimadoPesos.toLocaleString('es-MX')} ganancia est.
                      </div>
                    </div>

                    {/* CONVERSIÓN COTIZACIONES */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase">Conversión Cotiz.</span>
                        <Briefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-base sm:text-lg font-bold text-purple-900">
                        {ind.tasaConversionCotizaciones}%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {ind.cotizacionesAprobadas} de {ind.cotizacionesTotales} aprobadas
                      </div>
                    </div>
                  </div>

                  {/* DESGLOSE EN 2 COLUMNAS: FINANZAS/COSTOS vs OPERACIÓN/TALLER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* COSTOS Y FLUJO */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                        Desglose de Costos y Margen
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Costo directo en Refacciones:</span>
                          <span className="font-semibold text-slate-900">
                            ${ind.costoRefacciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Mano de Obra y Servicios:</span>
                          <span className="font-semibold text-slate-900">
                            ${ind.costoManoObra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600 font-medium">Costos Totales Estimados:</span>
                          <span className="font-bold text-slate-900">
                            ${ind.costosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 text-emerald-800 font-bold bg-emerald-50 px-2 rounded">
                          <span>Margen Bruto Calculado:</span>
                          <span>
                            ${ind.margenEstimadoPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                            ({ind.margenEstimadoPorcentaje}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* OPERACIONES Y CICLO DE ÓRDENES */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-600" />
                        Ciclo Operativo & Calidad
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Órdenes Concluidas / Entregadas:</span>
                          <span className="font-semibold text-emerald-700">
                            {ind.ordenesTerminadas} de {ind.ordenesTotales}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Órdenes Atrasadas en Entrega:</span>
                          <span
                            className={`font-semibold ${
                              ind.ordenesAtrasadas > 0 ? 'text-rose-700' : 'text-slate-700'
                            }`}
                          >
                            {ind.ordenesAtrasadas}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Tiempo Promedio de Ciclo:</span>
                          <span className="font-semibold text-slate-900">
                            {ind.tiempoPromedioAtencionDias} días por orden
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-slate-600">Garantías / Retornos Reportados:</span>
                          <span className="font-semibold text-slate-900">
                            {ind.garantiasRegistradas} ({ind.tasaGarantiasPorcentaje}% incidencia)
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">Seguimientos Pendientes:</span>
                          <span className="font-semibold text-slate-900">
                            {ind.seguimientosPendientes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCTIVIDAD POR TÉCNICO Y REFACCIONES TOP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PRODUCTIVIDAD POR TÉCNICO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#06345A]" />
                        Productividad por Técnico
                      </h4>
                      {ind.productividadTecnicos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Sin asignaciones de técnicos registradas en este periodo.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {ind.productividadTecnicos.map((tec, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-800">{tec.tecnico}</span>
                                <span className="block text-[11px] text-slate-500">
                                  {tec.asignadas} asignadas • {tec.terminadas} concluidas
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-[#06345A]">
                                  {tec.eficienciaPorcentaje}%
                                </span>
                                <span className="block text-[10px] text-slate-400">cierre</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* REFACCIONES CON MAYOR MOVIMIENTO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#1497F2]" />
                        Refacciones con Mayor Rotación
                      </h4>
                      {ind.refaccionesMayorMovimiento.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Sin refacciones consumidas en el periodo seleccionado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {ind.refaccionesMayorMovimiento.map((ref, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-800">{ref.nombre}</span>
                                <span className="block text-[11px] text-slate-500">
                                  Código: {ref.codigo}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900">
                                  {ref.unidadesMovidas} pzas
                                </span>
                                <span className="block text-[10px] text-slate-400">utilizadas</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA 3: RECOMENDACIONES ESTRATÉGICAS (MÁXIMO 5) */}
              {/* ======================================================== */}
              {(seccionActiva === 'recomendaciones' || window.matchMedia?.('print').matches) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>4. Recomendaciones prioritarias (Máximo 5 acciones)</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Ordenadas por impacto operativo y financiero
                    </span>
                  </div>

                  <div className="space-y-3">
                    {resultado.recomendaciones.map((rec) => (
                      <div
                        key={rec.prioridad}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-[#1497F2]/50 transition-all flex flex-col sm:flex-row sm:items-start gap-3.5"
                      >
                        {/* BADGE DE PRIORIDAD */}
                        <div className="w-8 h-8 rounded-lg bg-[#06345A] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-inner">
                          {rec.prioridad}
                        </div>

                        <div className="flex-1 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{rec.titulo}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase border border-slate-200">
                              Área: {rec.area}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-normal">
                            <strong className="text-slate-800">Acción sugerida:</strong> {rec.accion}
                          </p>
                          <div className="pt-1 flex items-center gap-1.5 text-emerald-800 font-medium">
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                            <span>Impacto esperado: {rec.impactoEsperado}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* VISTA 4: MENSAJE EJECUTIVO PARA COMPARTIR AL GERENTE */}
              {/* ======================================================== */}
              {(seccionActiva === 'compartir' || window.matchMedia?.('print').matches) && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[#06345A]" />
                        <span>7. Resumen para compartir con el gerente</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mensaje formateado para copiar y enviar de inmediato por WhatsApp o correo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopiarMensaje}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#06345A] hover:bg-[#1497F2] text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto no-print"
                    >
                      {copiadoMensaje ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Mensaje copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar mensaje para el gerente</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all shadow-inner border border-slate-800 overflow-x-auto">
                    {resultado.resumenParaCompartir}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* AVISO REGLAMENTARIO INSTITUCIONAL */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">
                    {resultado.advertenciaRegla ||
                      'Análisis administrativo basado en los datos disponibles de la demostración.'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Los cálculos presentados no sustituyen una auditoría contable ni fiscal oficial.
                    Motor de soporte:{' '}
                    <span className="font-medium text-slate-700">
                      {resultado.modeloUtilizado || 'Inteligencia Artificial'}
                    </span>
                    {resultado.esAnalisisLocal && ' (Modo local de demostración)'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PIE DEL MODAL CON ACCIONES FINALES */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Periodo actual:</span>
            <strong className="text-slate-800 font-semibold">{resultado?.etiquetaPeriodo}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopiarMensaje}
              disabled={!resultado}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar mensaje</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
