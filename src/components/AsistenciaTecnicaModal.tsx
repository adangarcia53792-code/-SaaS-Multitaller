import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  OrdenTrabajo,
  Vehiculo,
  Cliente,
  Refaccion,
  ResultadoAsistenciaTecnica,
  ItemChecklistTecnico,
} from '../types';
import {
  Sparkles,
  X,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  Wrench,
  HelpCircle,
  FileText,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { generarAsistenciaTecnicaLocal } from '../utils/asistenciaTecnicaLocal';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AsistenciaTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenTrabajo;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
  historialServicios?: OrdenTrabajo[];
  catalogoRefacciones?: Refaccion[];
  onAplicarDiagnostico: (nuevoDiagnostico: string) => void;
}

type TabFuncion =
  | 'todo'
  | 'sintomas'
  | 'puntos_revision'
  | 'preguntas'
  | 'checklist'
  | 'diagnostico'
  | 'explicacion';

export const AsistenciaTecnicaModal: React.FC<AsistenciaTecnicaModalProps> = ({
  isOpen,
  onClose,
  orden,
  vehiculo,
  cliente,
  historialServicios = [],
  catalogoRefacciones = [],
  onAplicarDiagnostico,
}) => {
  const [activeTab, setActiveTab] = useState<TabFuncion>('todo');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAsistenciaTecnica | null>(null);
  const [checklistState, setChecklistState] = useState<ItemChecklistTecnico[]>([]);
  const [hallazgosInput, setHallazgosInput] = useState('');
  const [versionSeed, setVersionSeed] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmarAplicar, setConfirmarAplicar] = useState(false);
  const [aplicadoExito, setAplicadoExito] = useState(false);

  const modalDismiss = useModalDismiss({
    isOpen,
    onClose,
  });

  const historialVehiculo = useMemo(() => {
    return historialServicios.filter(
      (h) => h.id !== orden.id && (h.vehiculoId === orden.vehiculoId || (vehiculo && h.vehiculoId === vehiculo.id))
    );
  }, [historialServicios, orden.id, orden.vehiculoId, vehiculo]);

  const ejecutarAsistencia = useCallback(
    async (seed = 1, hallazgos = '') => {
      setIsLoading(true);
      setErrorMsg(null);
      setConfirmarAplicar(false);
      setAplicadoExito(false);

      const payload = {
        orden,
        vehiculo,
        cliente,
        historialServicios: historialVehiculo,
        catalogoRefacciones,
        hallazgosMecanico: hallazgos,
        versionSeed: seed,
      };

      try {
        const response = await fetch('/api/asistencia-tecnica-orden', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Error al conectar con el servicio`);
        }

        const data: ResultadoAsistenciaTecnica = await response.json();
        setResultado(data);
        setChecklistState(data.checklistTecnico || []);
      } catch (err: any) {
        console.warn('Fallback a asistencia técnica local:', err?.message || err);
        // Respaldo local garantizado
        const fallback = generarAsistenciaTecnicaLocal({
          orden,
          vehiculo,
          cliente,
          historialServicios: historialVehiculo,
          catalogoRefacciones,
          hallazgosMecanico: hallazgos,
          versionSeed: seed,
        });
        setResultado({
          ...fallback,
          errorDetalle: err?.message,
        });
        setChecklistState(fallback.checklistTecnico || []);
      } finally {
        setIsLoading(false);
      }
    },
    [orden, vehiculo, cliente, historialVehiculo, catalogoRefacciones]
  );

  useEffect(() => {
    if (isOpen) {
      setHallazgosInput(orden.observacionesMecanico || '');
      setVersionSeed(1);
      ejecutarAsistencia(1, orden.observacionesMecanico || '');
    } else {
      setResultado(null);
      setErrorMsg(null);
      setConfirmarAplicar(false);
      setAplicadoExito(false);
    }
  }, [isOpen, orden.id]);

  const handleCopiarTexto = (texto: string, key: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const handleToggleChecklist = (itemId: string) => {
    setChecklistState((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completado: !item.completado } : item
      )
    );
  };

  const handleRegenerar = () => {
    const nextSeed = versionSeed + 1;
    setVersionSeed(nextSeed);
    ejecutarAsistencia(nextSeed, hallazgosInput);
  };

  const handleAplicarDiagnosticoConfirmado = () => {
    if (!resultado?.diagnosticoSugerido) return;
    onAplicarDiagnostico(resultado.diagnosticoSugerido);
    setAplicadoExito(true);
    setConfirmarAplicar(false);
    setTimeout(() => {
      setAplicadoExito(false);
    }, 3500);
  };

  const checklistCompletados = checklistState.filter((c) => c.completado).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={modalDismiss.handleBackdropClick}
    >
      <div
        ref={modalDismiss.dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-asistencia-tecnica-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* ENCABEZADO INSTITUCIONAL */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#0a2336] to-[#1497F2] text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="modal-asistencia-tecnica-title"
                  className="font-bold text-base sm:text-lg text-white truncate"
                >
                  Asistencia técnica con IA
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/20 text-white font-semibold border border-white/20">
                  {orden.folio}
                </span>
                {resultado?.esAnalisisLocal && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30">
                    Modo local
                  </span>
                )}
                {!resultado?.esAnalisisLocal && resultado?.modeloUtilizado && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    {resultado.modeloUtilizado}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {vehiculo
                  ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año || ''} • Placas: ${vehiculo.placas || 'S/P'}`
                  : 'Vehículo registrado en orden'}{' '}
                {orden.kilometraje ? `• ${orden.kilometraje} km` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRegenerar}
              disabled={isLoading}
              title="Generar otra versión del análisis"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Nueva versión</span>
            </button>
            <button
              type="button"
              onClick={modalDismiss.handleClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Cerrar asistencia técnica"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REGLA OBLIGATORIA / AVISO PERMANENTE */}
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-950">
              Sugerencia de apoyo. Requiere revisión y confirmación del técnico responsable.
            </span>
          </div>
          <span className="text-[11px] text-amber-800">
            No asegura daño sin inspección física • No modifica la orden automáticamente
          </span>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS (6 FUNCIONES REQUERIDAS) */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('todo')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'todo'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumen completo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sintomas')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'sintomas'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>1. Organizar síntomas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('puntos_revision')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'puntos_revision'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>2. Puntos de revisión</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preguntas')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'preguntas'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. Preparar preguntas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>4. Checklist ({checklistCompletados}/{checklistState.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostico')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'diagnostico'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>5. Redactar diagnóstico</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('explicacion')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'explicacion'
                ? 'bg-[#1497F2] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>6. Explicar reparación</span>
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white text-slate-800">
          {/* ESTADO DE CARGA */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-[#1497F2] border-t-transparent animate-spin" />
              <div>
                <p className="font-semibold text-sm text-slate-800">
                  Analizando información…
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Evaluando síntomas del cliente, daños visibles, kilometraje e historial previo del vehículo
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

          {/* Aviso si Gemini no responde y se usa el análisis local */}
          {!isLoading && resultado?.esAnalisisLocal && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                El servicio en la nube de Gemini no estuvo disponible temporalmente. Se utilizó el <strong>análisis técnico local de TUNNO</strong> para estructurar los puntos de revisión y el diagnóstico sin interrumpir tu trabajo.
              </p>
            </div>
          )}

          {/* MENSAJE DE ÉXITO AL APLICAR */}
          {aplicadoExito && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Diagnóstico aplicado con éxito a la orden!</strong> El texto sugerido ha sido copiado al campo de diagnóstico técnico. Recuerda guardar los cambios de la orden cuando concluyas tu jornada.
              </span>
            </div>
          )}

          {/* CONFIRMACIÓN DE APLICAR DIAGNÓSTICO */}
          {confirmarAplicar && resultado && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1497F2] mt-0.5 shrink-0" />
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">
                    ¿Confirmas aplicar el diagnóstico sugerido a esta orden?
                  </p>
                  <p>
                    El texto se guardará en el campo "Diagnóstico técnico" de la orden {orden.folio}. No se modificará el estado de la orden ni se agregarán refacciones o costos automáticamente.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmarAplicar(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAplicarDiagnosticoConfirmado}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1497F2] hover:bg-[#06345A] rounded-lg shadow-xs"
                >
                  Confirmar y aplicar
                </button>
              </div>
            </div>
          )}

          {!isLoading && resultado && (
            <>
              {/* TARJETA DE RESUMEN DEL PROBLEMA & PRIORIDAD */}
              {(activeTab === 'todo' || activeTab === 'sintomas') && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Resumen del problema
                      </span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {resultado.resumenProblema}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Prioridad:</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          resultado.prioridad === 'alta'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : resultado.prioridad === 'media'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {resultado.prioridad === 'alta' && <AlertTriangle className="w-3 h-3" />}
                        {resultado.prioridad}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic border-l-2 border-[#1497F2] pl-2.5">
                    {resultado.justificacionPrioridad}
                  </p>

                  {/* DATOS DE CONTEXTO UTILIZADOS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] border-t border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block">Servicio solicitado:</span>
                      <span className="font-semibold text-slate-800">{orden.servicio || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Odómetro registrado:</span>
                      <span className="font-semibold text-slate-800">{orden.kilometraje ? `${orden.kilometraje} km` : 'No capturado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Daños visibles:</span>
                      <span className="font-semibold text-slate-800">{orden.dañosVisibles || 'Ninguno'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Historial previo:</span>
                      <span className="font-semibold text-slate-800">
                        {historialVehiculo.length > 0 ? `${historialVehiculo.length} orden(es) previas` : 'Primer ingreso'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: ORGANIZAR SÍNTOMAS */}
              {(activeTab === 'todo' || activeTab === 'sintomas') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#1497F2]" />
                      <span>1. Síntomas organizados para el técnico</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {resultado.sintomasOrganizados.length} punto(s)
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {resultado.sintomasOrganizados.map((sintoma, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-start gap-2 text-slate-800 hover:border-slate-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#1497F2]/10 text-[#1497F2] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{sintoma}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* POSIBLES CAUSAS PARA REVISIÓN */}
              {(activeTab === 'todo' || activeTab === 'puntos_revision') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span>Posibles causas para revisión preliminar</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Sujeto a verificación física en taller
                    </span>
                  </div>

                  <div className="space-y-2">
                    {resultado.posiblesCausas.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{item.causa}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                            {item.sistema}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          {item.explicacion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: PUNTOS DE REVISIÓN SUGERIDOS */}
              {(activeTab === 'todo' || activeTab === 'puntos_revision') && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-[#1497F2]" />
                    <span>2. Componentes o sistemas a inspeccionar</span>
                  </h4>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {resultado.puntosRevision.map((pto, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1 shadow-2xs hover:border-[#1497F2]/50 transition-colors"
                      >
                        <span className="text-[10px] font-bold text-[#1497F2] uppercase tracking-wide block">
                          {pto.sistema}
                        </span>
                        <p className="font-semibold text-slate-900">{pto.componente}</p>
                        <p className="text-[11px] text-slate-600 leading-snug">{pto.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: PREPARAR PREGUNTAS PARA EL CLIENTE */}
              {(activeTab === 'todo' || activeTab === 'preguntas') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#1497F2]" />
                      <span>3. Preguntas para el cliente (Recepción / Mecánico)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Para precisar síntomas y ahorrar tiempo en diagnóstico
                    </span>
                  </div>

                  <div className="space-y-2">
                    {resultado.preguntasCliente.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="font-semibold text-slate-900 text-xs">
                            "{p.pregunta}"
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <strong>Razón técnica:</strong> {p.razon}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              p.dirigidoA === 'recepcion'
                                ? 'bg-blue-100 text-blue-800'
                                : p.dirigidoA === 'mecanico'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {p.dirigidoA}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopiarTexto(p.pregunta, `preg-${idx}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copiar pregunta"
                          >
                            {copiedKey === `preg-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: CHECKLIST TÉCNICO INTERACTIVO */}
              {(activeTab === 'todo' || activeTab === 'checklist') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span>4. Checklist técnico interactivo</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        El mecánico puede marcar las verificaciones concluidas en rampa
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {checklistCompletados} de {checklistState.length} verificados
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          checklistState.length > 0
                            ? (checklistCompletados / checklistState.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {checklistState.map((chk) => (
                      <div
                        key={chk.id}
                        onClick={() => handleToggleChecklist(chk.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer select-none transition-colors ${
                          chk.completado
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {chk.completado ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`leading-snug ${chk.completado ? 'line-through text-emerald-800' : ''}`}>
                            {chk.item}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {chk.sistema}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 5: REDACTAR DIAGNÓSTICO (CON HALLAZGOS DEL MECÁNICO) */}
              {(activeTab === 'todo' || activeTab === 'diagnostico') && (
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#1497F2]" />
                      <span>5. Diagnóstico técnico sugerido para la orden</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopiarTexto(resultado.diagnosticoSugerido, 'diag-text')
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        {copiedKey === 'diag-text' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmarAplicar(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-[#1497F2] hover:bg-[#06345A] rounded-md shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar a la orden</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                    {resultado.diagnosticoSugerido}
                  </div>

                  {/* CAPTURA DE HALLAZGOS ADICIONALES DEL MECÁNICO */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      Hallazgos observados por el mecánico en taller (Opcional):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={hallazgosInput}
                        onChange={(e) => setHallazgosInput(e.target.value)}
                        placeholder="Ej. Balatas delanteras al 15%, fuga en retén de flecha, código P0300..."
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1497F2]"
                      />
                      <button
                        type="button"
                        onClick={() => ejecutarAsistencia(versionSeed, hallazgosInput)}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs font-semibold text-[#1497F2] bg-[#1497F2]/10 hover:bg-[#1497F2]/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                      >
                        Refinar con hallazgos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 6: EXPLICACIÓN PARA EL CLIENTE */}
              {(activeTab === 'todo' || activeTab === 'explicacion') && (
                <div className="space-y-2.5 p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        <span>6. Explicación clara y accesible para el cliente</span>
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Redacción en lenguaje no técnico para recepción o envío al propietario
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopiarTexto(resultado.explicacionCliente, 'exp-cliente')
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors shadow-2xs"
                    >
                      {copiedKey === 'exp-cliente' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar explicación</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 leading-relaxed">
                    {resultado.explicacionCliente}
                  </div>
                </div>
              )}

              {/* DATOS FALTANTES / VERIFICACIONES PENDIENTES */}
              {resultado.datosFaltantes && resultado.datosFaltantes.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Datos o verificaciones que faltan para concluir diagnóstico:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    {resultado.datosFaltantes.map((df, idx) => (
                      <li key={idx}>{df}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* PIE DEL MODAL CON ACCIONES REQUERIDAS */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerar}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Generar otra versión</span>
            </button>

            {resultado?.diagnosticoSugerido && (
              <button
                type="button"
                onClick={() => {
                  const reporteCompleto = `RESUMEN TÉCNICO (${orden.folio}):
${resultado.resumenProblema}

DIAGNÓSTICO TUGERIDO:
${resultado.diagnosticoSugerido}

EXPLICACIÓN AL CLIENTE:
${resultado.explicacionCliente}

AVISO: ${resultado.advertenciaRegla}`;
                  handleCopiarTexto(reporteCompleto, 'reporte-completo');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {copiedKey === 'reporte-completo' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reporte copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar reporte completo</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {resultado?.diagnosticoSugerido && (
              <button
                type="button"
                onClick={() => setConfirmarAplicar(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1497F2] hover:bg-[#06345A] rounded-lg shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar diagnóstico</span>
              </button>
            )}

            <button
              type="button"
              onClick={modalDismiss.handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
