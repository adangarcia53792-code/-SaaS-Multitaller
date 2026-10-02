import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  EyeOff,
  CheckCircle2,
  Calendar,
  FileText,
  Wrench,
  Package,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { AvisoPendiente } from '../types';

interface CentroAvisosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  avisos: AvisoPendiente[];
  onVerAviso: (aviso: AvisoPendiente) => void;
  onMarcarVisto: (avisoId: string) => void;
  totalNoVistosCount: number;
}

type TabFiltro = 'todos' | 'hoy' | 'urgentes';

export const CentroAvisosDrawer: React.FC<CentroAvisosDrawerProps> = ({
  isOpen,
  onClose,
  avisos,
  onVerAviso,
  onMarcarVisto,
  totalNoVistosCount,
}) => {
  const [tabFiltro, setTabFiltro] = useState<TabFiltro>('todos');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      setMostrarTodos(false);
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtrar avisos según pestaña seleccionada
  const avisosFiltrados = avisos.filter((aviso) => {
    if (tabFiltro === 'hoy') {
      return Boolean(aviso.esHoy);
    }
    if (tabFiltro === 'urgentes') {
      return aviso.nivel === 'Urgente' || Boolean(aviso.esUrgente);
    }
    return true;
  });

  // Mostrar máximo 10 inicialmente a menos que el usuario presione "Ver todos"
  const avisosVisibles = mostrarTodos ? avisosFiltrados : avisosFiltrados.slice(0, 10);
  const hayMas = avisosFiltrados.length > 10 && !mostrarTodos;

  const getNivelBadge = (nivel: AvisoPendiente['nivel']) => {
    switch (nivel) {
      case 'Urgente':
        return {
          cardBg: 'bg-rose-50/60 border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
        };
      case 'Atención':
        return {
          cardBg: 'bg-amber-50/70 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'Información':
      default:
        return {
          cardBg: 'bg-blue-50/60 border-blue-200',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
        };
    }
  };

  const getTipoIcon = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('cita')) return Calendar;
    if (t.includes('orden') || t.includes('entrega')) return Wrench;
    if (t.includes('cotiza')) return FileText;
    if (t.includes('stock') || t.includes('refacc')) return Package;
    if (t.includes('garant')) return ShieldCheck;
    return Bell;
  };

  const badgeText =
    totalNoVistosCount === 0
      ? '0 pendientes'
      : totalNoVistosCount > 9
      ? '9+ pendientes'
      : `${totalNoVistosCount} pendiente${totalNoVistosCount === 1 ? '' : 's'}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print" role="dialog" aria-modal="true">
      {/* Telón de fondo */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral deslizable (ancho completo en celular, 420px en desktop) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto">
        <div
          ref={panelRef}
          className="w-full sm:w-[420px] max-w-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 h-full"
        >
          {/* Encabezado del panel */}
          <div className="px-5 py-4 border-b border-[#DDE4E8] bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF661B] border border-orange-200 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#231F20]">Avisos</h3>
                <p className="text-xs text-[#5F6B73]">Pendientes operativos del taller</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-[#FF661B] border border-orange-200">
                {badgeText}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-[#231F20] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 transition-colors"
                aria-label="Cerrar panel de avisos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros: Todos, Hoy, Urgentes */}
          <div className="px-5 py-2.5 bg-[#F6F8FA] border-b border-[#DDE4E8] flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTabFiltro('todos');
                setMostrarTodos(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                tabFiltro === 'todos'
                  ? 'bg-[#231F20] text-white shadow-xs'
                  : 'text-[#5F6B73] hover:bg-slate-200/70'
              }`}
            >
              Todos ({avisos.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setTabFiltro('hoy');
                setMostrarTodos(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                tabFiltro === 'hoy'
                  ? 'bg-[#1D7EAE] text-white shadow-xs'
                  : 'text-[#5F6B73] hover:bg-slate-200/70'
              }`}
            >
              Hoy ({avisos.filter((a) => a.esHoy).length})
            </button>

            <button
              type="button"
              onClick={() => {
                setTabFiltro('urgentes');
                setMostrarTodos(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                tabFiltro === 'urgentes'
                  ? 'bg-[#FF661B] text-white shadow-xs'
                  : 'text-[#5F6B73] hover:bg-slate-200/70'
              }`}
            >
              Urgentes ({avisos.filter((a) => a.nivel === 'Urgente' || a.esUrgente).length})
            </button>
          </div>

          {/* Contenido / Lista de avisos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {avisosVisibles.length > 0 ? (
              avisosVisibles.map((aviso) => {
                const style = getNivelBadge(aviso.nivel);
                const LevelIcon = style.icon;
                const TipoIcon = getTipoIcon(aviso.tipo);

                return (
                  <div
                    key={aviso.id}
                    className={`p-3.5 rounded-xl border ${style.cardBg} transition-all hover:shadow-2xs space-y-2`}
                  >
                    {/* Encabezado del aviso: Tipo y Nivel */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TipoIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {aviso.titulo || aviso.tipo}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${style.badge} shrink-0`}
                      >
                        <LevelIcon className={`w-3 h-3 ${style.iconColor}`} />
                        <span>{aviso.nivel}</span>
                      </span>
                    </div>

                    {/* Descripción breve */}
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {aviso.descripcion}
                    </p>

                    {/* Fecha u hora relacionada */}
                    {aviso.fechaHoraRelacionada && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{aviso.fechaHoraRelacionada}</span>
                      </div>
                    )}

                    {/* Acciones: Ver (principal) y Marcar como visto (secundaria) */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onMarcarVisto(aviso.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 min-h-[36px] py-1 px-2 rounded hover:bg-black/5 transition-colors"
                        title="Ocultar aviso de la vista actual"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Marcar como visto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onVerAviso(aviso);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Ver</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2.5 my-8 relative rounded-xl border border-[#DDE4E8] bg-white">
                <div className="absolute inset-0 iot-dots-pattern rounded-xl pointer-events-none" />
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 relative z-10">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="text-sm font-semibold text-[#231F20] relative z-10">Sin pendientes en este filtro</h4>
                <p className="text-xs text-[#5F6368] max-w-xs mx-auto relative z-10">
                  {tabFiltro === 'urgentes'
                    ? 'No hay avisos urgentes ni entregas vencidas pendientes de atención.'
                    : tabFiltro === 'hoy'
                    ? 'No hay citas ni seguimientos programados para el día de hoy.'
                    : 'Todos los avisos operativos están al día o fueron marcados como vistos.'}
                </p>
              </div>
            )}

            {/* Botón Ver todos cuando haya más de 10 avisos */}
            {hayMas && (
              <div className="pt-2 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setMostrarTodos(true)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Ver todos ({avisosFiltrados.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Pie informativo */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Avisos generados automáticamente a partir de citas, órdenes, cotizaciones, seguimientos, refacciones y garantías.
          </div>
        </div>
      </div>
    </div>
  );
};
