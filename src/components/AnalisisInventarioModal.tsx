import React, { useState, useEffect, useCallback } from 'react';
import {
  Refaccion,
  MovimientoInventario,
  OrdenTrabajo,
  Vehiculo,
  OrdenCompra,
  ResultadoAnalisisInventarioIA,
  CompraRecomendadaIA,
} from '../types';
import {
  Sparkles,
  X,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ShoppingCart,
  TrendingDown,
  Building2,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  Info,
  DollarSign,
  Package,
  Wrench,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { generarAnalisisInventarioLocal } from '../utils/analisisInventarioLocal';

interface AnalisisInventarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  refacciones: Refaccion[];
  movimientos: MovimientoInventario[];
  ordenesPendientes?: OrdenTrabajo[];
  vehiculos?: Vehiculo[];
  ordenesCompra?: OrdenCompra[];
  onCrearOrdenCompraBorrador?: (compra: CompraRecomendadaIA) => void;
  onVerRefaccionDetalle?: (refaccionId: string) => void;
}

export const AnalisisInventarioModal: React.FC<AnalisisInventarioModalProps> = ({
  isOpen,
  onClose,
  refacciones,
  movimientos,
  ordenesPendientes = [],
  vehiculos = [],
  ordenesCompra = [],
  onCrearOrdenCompraBorrador,
  onVerRefaccionDetalle,
}) => {
  const [activeTab, setActiveTab] = useState<
    'atencion' | 'compras' | 'impacto' | 'precios' | 'proveedores' | 'resumen'
  >('atencion');
  const [analisis, setAnalisis] = useState<ResultadoAnalisisInventarioIA | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [versionCounter, setVersionCounter] = useState<number>(1);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [borradorCreadoId, setBorradorCreadoId] = useState<string | null>(null);

  // Ejecutar el análisis con IA (o heurístico local de respaldo)
  const ejecutarAnalisis = useCallback(
    async (seed = 1) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch('/api/analizar-inventario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refacciones,
            movimientos,
            ordenesPendientes,
            vehiculos,
            ordenesCompra,
            versionSeed: seed,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data: ResultadoAnalisisInventarioIA = await response.json();
        setAnalisis(data);
      } catch (err: any) {
        console.warn(
          '[AnalisisInventarioModal] Falló endpoint remoto, usando motor heurístico local:',
          err
        );
        const local = generarAnalisisInventarioLocal({
          refacciones,
          movimientos,
          ordenesPendientes,
          vehiculos,
          ordenesCompra,
        });
        setAnalisis(local);
      } finally {
        setLoading(false);
      }
    },
    [refacciones, movimientos, ordenesPendientes, vehiculos, ordenesCompra]
  );

  useEffect(() => {
    if (isOpen) {
      ejecutarAnalisis(versionCounter);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(identifier);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleCrearBorrador = (compra: CompraRecomendadaIA) => {
    if (onCrearOrdenCompraBorrador) {
      onCrearOrdenCompraBorrador(compra);
      setBorradorCreadoId(compra.refaccionId);
      setTimeout(() => setBorradorCreadoId(null), 3000);
    }
  };

  const handleReanalizar = () => {
    const nextSeed = versionCounter + 1;
    setVersionCounter(nextSeed);
    ejecutarAnalisis(nextSeed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-analisis-inventario-title"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="bg-linear-to-r from-[#06345A] via-[#1497F2] to-[#0E5275] text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Sparkles className="w-5 h-5 text-[#73C7FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="modal-analisis-inventario-title"
                  className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5"
                >
                  Analizar inventario con IA
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 text-white border border-white/30">
                  Logística y Abastecimiento
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5 line-clamp-1">
                Evaluación integral de existencias, rotación, márgenes y requerimientos de taller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReanalizar}
              disabled={loading}
              title="Volver a analizar inventario"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Cerrar análisis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AVISO INSTITUCIONAL OBLIGATORIO */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-900 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-950">
              Recomendaciones basadas en los datos registrados; requieren validación del responsable.
            </span>
          </div>
          {analisis && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
              {analisis.esAnalisisLocal ? (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono text-[10px]">
                  Motor local (Offline/Respaldo)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px]">
                  Gemini AI Activo
                </span>
              )}
            </span>
          )}
        </div>

        {/* BARRA DE TABS DE NAVEGACIÓN */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-6 py-1.5 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('atencion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'atencion'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Refacciones en atención</span>
            {analisis && analisis.refaccionesAtencion.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'atencion'
                    ? 'bg-white text-[#1497F2]'
                    : 'bg-red-500 text-white'
                }`}
              >
                {analisis.refaccionesAtencion.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compras'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Compras recomendadas</span>
            {analisis && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'compras'
                    ? 'bg-white text-[#1497F2]'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {analisis.comprasRecomendadas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impacto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'impacto'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Impacto en taller</span>
            {analisis && analisis.impactoEnTaller.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'impacto'
                    ? 'bg-white text-[#1497F2]'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {analisis.impactoEnTaller.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('precios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'precios'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Precios y márgenes</span>
            {analisis && analisis.preciosMargenAlertas.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'precios'
                    ? 'bg-white text-[#1497F2]'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {analisis.preciosMargenAlertas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proveedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'proveedores'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Proveedores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-[#1497F2] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Resumen para compra</span>
          </button>
        </div>

        {/* CUERPO PRINCIPAL DEL MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 grow">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#1497F2] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#1497F2] absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Analizando existencias, consumo y órdenes de trabajo...
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Verificando niveles de seguridad, tiempos de entrega de proveedores, rotación y alertas de margen.
                </p>
              </div>
            </div>
          ) : !analisis ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No se ha podido cargar el análisis.</p>
              <button
                type="button"
                onClick={() => ejecutarAnalisis(versionCounter)}
                className="mt-3 px-4 py-2 bg-[#1497F2] text-white text-xs font-semibold rounded-lg hover:bg-[#06345A]"
              >
                Reintentar análisis
              </button>
            </div>
          ) : (
            <>
              {/* RESUMEN SUPERIOR KPI */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Diagnóstico del Almacén
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium leading-relaxed">
                      {analisis.resumenGeneral}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-center min-w-[70px]">
                      <span className="text-[10px] font-bold text-red-600 uppercase block">Urgentes</span>
                      <span className="text-lg font-bold text-red-700">{analisis.prioridades.urgentes}</span>
                    </div>
                    <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-center min-w-[70px]">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Próximas</span>
                      <span className="text-lg font-bold text-amber-700">{analisis.prioridades.proximas}</span>
                    </div>
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-center min-w-[70px]">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">Preventivas</span>
                      <span className="text-lg font-bold text-blue-700">{analisis.prioridades.preventivas}</span>
                    </div>
                  </div>
                </div>

                {/* ALERTA DE DATOS FALTANTES */}
                {analisis.datosFaltantes && analisis.datosFaltantes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-start gap-2.5 text-xs text-amber-900 bg-amber-500/10 p-2.5 rounded-lg">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-950">Datos faltantes detectados en el catálogo:</span>
                      <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                        {analisis.datosFaltantes.slice(0, 4).map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                        {analisis.datosFaltantes.length > 4 && (
                          <li className="font-semibold text-amber-900">
                            +{analisis.datosFaltantes.length - 4} datos adicionales incompletos
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* VISTA 1: REFACCIONES QUE REQUIEREN ATENCIÓN */}
              {activeTab === 'atencion' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      Refacciones agotadas o bajo el mínimo ({analisis.refaccionesAtencion.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Evaluadas contra existencia real vs stock mínimo
                    </span>
                  </div>

                  {analisis.refaccionesAtencion.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      <Package className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800">No hay piezas en nivel crítico</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Todas las refacciones registradas superan holgadamente su nivel de existencias mínimas.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {analisis.refaccionesAtencion.map((item) => (
                        <div
                          key={item.refaccionId}
                          className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-amber-800 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded">
                                {item.codigo}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{item.nombre}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  item.estadoStock === 'agotado'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : item.estadoStock === 'stock_bajo'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}
                              >
                                {item.estadoStock === 'agotado'
                                  ? 'Agotado (0)'
                                  : item.estadoStock === 'stock_bajo'
                                  ? 'Stock Bajo'
                                  : 'Próximo al mínimo'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{item.motivo}</p>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                              <span>
                                Existencias:{' '}
                                <strong
                                  className={
                                    item.existencias === 0 ? 'text-red-600' : 'text-slate-800'
                                  }
                                >
                                  {item.existencias} pzs
                                </strong>
                              </span>
                              <span>
                                Mínimo requerido: <strong className="text-slate-800">{item.minimo} pzs</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {onVerRefaccionDetalle && (
                              <button
                                type="button"
                                onClick={() => onVerRefaccionDetalle(item.refaccionId)}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Ver refacción
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const recomendacion = analisis.comprasRecomendadas.find(
                                  (c) => c.refaccionId === item.refaccionId
                                );
                                if (recomendacion) handleCrearBorrador(recomendacion);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1497F2] hover:bg-[#06345A] rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Sugerir compra</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 2: COMPRAS RECOMENDADAS & PRIORIDAD */}
              {activeTab === 'compras' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-[#1497F2]" />
                        Lote de compra sugerido por la IA ({analisis.comprasRecomendadas.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cantidades calculadas para restablecer stock de seguridad y cubrir órdenes activas
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(analisis.resumenParaCompraTexto, 'todas-compras')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedItem === 'todas-compras' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar lista</span>
                        </>
                      )}
                    </button>
                  </div>

                  {analisis.comprasRecomendadas.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      <p className="text-sm font-semibold text-slate-800">No se requieren compras inmediatas</p>
                      <p className="text-xs text-slate-500 mt-1">El stock actual cubre la operación regular del taller.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {analisis.comprasRecomendadas.map((compra) => {
                        const totalEst = compra.cantidadSugerida * compra.precioCompraEstimado;
                        return (
                          <div
                            key={compra.refaccionId}
                            className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="space-y-1.5 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    compra.prioridad === 'urgente'
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : compra.prioridad === 'proxima'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                                  }`}
                                >
                                  Prioridad: {compra.prioridad}
                                </span>
                                <span className="font-mono text-xs font-bold text-amber-800">
                                  {compra.codigo}
                                </span>
                                <span className="text-sm font-bold text-slate-900">{compra.nombre}</span>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed">{compra.motivo}</p>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  Proveedor: <strong className="text-slate-800">{compra.proveedorSugerido || 'No registrado'}</strong>
                                </span>
                                {compra.diasEntregaEstimados && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Entrega aprox: <strong className="text-slate-800">{compra.diasEntregaEstimados} día(s)</strong>
                                  </span>
                                )}
                                <span>
                                  Costo unitario aprox:{' '}
                                  <strong className="text-slate-800 font-mono">
                                    ${compra.precioCompraEstimado.toFixed(2)} MXN
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              <div className="text-right">
                                <span className="text-xs text-slate-500 block">Sugerido comprar</span>
                                <span className="text-base font-bold text-[#1497F2]">
                                  {compra.cantidadSugerida} pzs
                                </span>
                                <span className="text-[11px] text-slate-500 block font-mono">
                                  Total: ${totalEst.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCrearBorrador(compra)}
                                  className="px-3 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-w-[130px]"
                                >
                                  {borradorCreadoId === compra.refaccionId ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                                      <span>¡Borrador listo!</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>Crear borrador OC</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 3: IMPACTO EN EL TALLER */}
              {activeTab === 'impacto' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-500" />
                        Órdenes y servicios que podrían retrasarse ({analisis.impactoEnTaller.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cruce entre piezas requeridas en órdenes activas y faltantes de inventario
                      </p>
                    </div>
                  </div>

                  {analisis.impactoEnTaller.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      <p className="text-sm font-semibold text-slate-800">
                        Ninguna orden activa presenta riesgo por desabasto
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Las órdenes en proceso y pendientes cuentan con refacciones disponibles o no requieren repuestos adicionales.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analisis.impactoEnTaller.map((impacto, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-300 transition-colors shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-amber-800 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded">
                              {impacto.folioOrden || 'Servicio del taller'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                impacto.nivelRiesgo === 'alto'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : impacto.nivelRiesgo === 'medio'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              Riesgo: {impacto.nivelRiesgo}
                            </span>
                          </div>

                          {impacto.vehiculoDesc && (
                            <p className="text-xs font-semibold text-slate-900">
                              Vehículo: {impacto.vehiculoDesc}
                            </p>
                          )}
                          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-800 block mb-0.5">
                              Refacción requerida: {impacto.refaccionAfectada}
                            </span>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {impacto.descripcionImpacto}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 4: PRECIOS Y MÁRGENES */}
              {activeTab === 'precios' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                        Alertas de precios y rentabilidad ({analisis.preciosMargenAlertas.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Piezas sin costo de compra, sin precio de venta o con margen menor al 20%
                      </p>
                    </div>
                  </div>

                  {analisis.preciosMargenAlertas.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      <p className="text-sm font-semibold text-slate-800">Márgenes y precios saludables</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Todas las refacciones analizadas cuentan con precio de compra, venta y margen adecuado.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {analisis.preciosMargenAlertas.map((alerta) => (
                        <div key={alerta.refaccionId} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-800">
                                {alerta.codigo}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{alerta.nombre}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase self-start sm:self-auto ${
                                alerta.tipoProblema === 'precio_incongruente' || alerta.tipoProblema === 'sin_precio_compra'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {alerta.tipoProblema.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                            <div>
                              <span className="text-[11px] text-slate-500 block">Precio compra</span>
                              <strong className="text-slate-800 font-mono">
                                ${alerta.precioCompra.toFixed(2)} MXN
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">Precio venta</span>
                              <strong className="text-slate-800 font-mono">
                                ${alerta.precioVenta.toFixed(2)} MXN
                              </strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">Margen calculado</span>
                              <strong
                                className={`font-mono ${
                                  alerta.margenPorcentaje <= 0
                                    ? 'text-red-600'
                                    : alerta.margenPorcentaje < 20
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {alerta.margenPorcentaje}%
                              </strong>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-[11px] text-slate-500 block">Diagnóstico</span>
                              <span className="text-xs text-slate-700 font-medium">{alerta.detalle}</span>
                            </div>
                          </div>

                          <p className="text-xs text-indigo-900 font-medium bg-indigo-50/70 p-2 rounded border border-indigo-100">
                            💡 <strong>Sugerencia:</strong> {alerta.sugerencia}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 5: PROVEEDORES SUGERIDOS */}
              {activeTab === 'proveedores' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1497F2]" />
                        Proveedores registrados según tiempos y catálogo ({analisis.proveedoresSugeridos.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Recomendaciones basadas en los proveedores asociados a cada producto en inventario
                      </p>
                    </div>
                  </div>

                  {analisis.proveedoresSugeridos.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      <p className="text-sm font-semibold text-slate-800">No hay proveedores registrados</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Agregue proveedores y teléfonos al dar de alta o editar sus refacciones.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {analisis.proveedoresSugeridos.map((prov, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white border border-slate-200 rounded-xl hover:border-[#1497F2]/50 transition-colors shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#1497F2]" />
                              {prov.proveedor}
                            </h5>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                prov.nivelConfianza === 'alto'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              Respuesta: {prov.nivelConfianza}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span>
                              Teléfono: <strong className="text-slate-800">{prov.telefono || 'No registrado'}</strong>
                            </span>
                            <span>
                              Entrega estimada: <strong className="text-slate-800">{prov.diasEntrega ?? 2} día(s)</strong>
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">{prov.motivoSugerencia}</p>

                          {prov.refaccionesDisponibles.length > 0 && (
                            <div className="pt-1 border-t border-slate-100">
                              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                                Líneas clave que surte:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {prov.refaccionesDisponibles.map((r, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 6: RESUMEN PARA COMPRA (COPIAR / IMPRIMIR) */}
              {activeTab === 'resumen' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-slate-700" />
                        Lista consolidada de compra
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Formato optimizado para compartir con administración, compras o proveedores
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyText(analisis.resumenParaCompraTexto, 'resumen-texto')}
                        className="px-3 py-1.5 bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedItem === 'resumen-texto' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>¡Copiado al portapapeles!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar lista de compra</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-100 font-mono text-xs p-4 sm:p-5 rounded-xl border border-slate-800 shadow-inner overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[420px]">
                    {analisis.resumenParaCompraTexto}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Las órdenes de compra sugeridas quedan registradas como <strong>borradores pendientes</strong> hasta su confirmación.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReanalizar}
              disabled={loading}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Volver a analizar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
