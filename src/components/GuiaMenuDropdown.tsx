import React, { useRef, useEffect } from 'react';
import { TipoGuia, CATALOGO_GUIAS, obtenerProgresoGuia } from '../data/guiaData';
import { RolUsuario } from '../types';
import {
  Compass,
  UserCheck,
  ClipboardList,
  Wrench,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Zap,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface GuiaMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGuia: (tipo: TipoGuia, pasoInicial?: number) => void;
  userRol?: RolUsuario;
}

export const GuiaMenuDropdown: React.FC<GuiaMenuDropdownProps> = ({
  isOpen,
  onClose,
  onSelectGuia,
  userRol,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const progresoPendiente = obtenerProgresoGuia();

  // Cerrar al pulsar fuera o Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtrado de roles si aplica
  const isRolPermitido = (tipo: TipoGuia) => {
    const item = CATALOGO_GUIAS[tipo];
    if (!item.rolesPermitidos) return true;
    if (!userRol) return false;
    return item.rolesPermitidos.includes(userRol);
  };

  const opcionesPrincipales: {
    tipo: TipoGuia;
    nombre: string;
    descripcion: string;
    icono: React.ComponentType<{ className?: string }>;
    destacado?: boolean;
    badge?: string;
  }[] = [
    {
      tipo: 'general',
      nombre: 'Recorrido general',
      descripcion: 'Recorrido paso a paso por los 13 módulos del taller',
      icono: Compass,
      destacado: true,
      badge: '13 pasos',
    },
    {
      tipo: 'flujo-cliente',
      nombre: 'Flujo de un cliente',
      descripcion: 'Atender a un cliente desde la recepción hasta la entrega',
      icono: UserCheck,
      destacado: true,
      badge: '10 pasos',
    },
    {
      tipo: 'recepcion',
      nombre: 'Guía de recepción',
      descripcion: 'Clientes, vehículos, citas, cotizaciones y atención inicial',
      icono: ClipboardList,
    },
    {
      tipo: 'mecanico',
      nombre: 'Guía para mecánico',
      descripcion: 'Órdenes asignadas, diagnóstico, checklist y refacciones',
      icono: Wrench,
    },
    {
      tipo: 'administrador',
      nombre: 'Guía para administrador',
      descripcion: 'Inventario, facturación, personal, reportes y respaldos',
      icono: ShieldCheck,
    },
    {
      tipo: 'ia',
      nombre: 'Explicación de funciones con IA',
      descripcion: 'Asistencia técnica, diagnóstico y análisis predictivo',
      icono: Sparkles,
      badge: 'Inteligente',
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] py-3 z-[1000] text-xs font-body animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Cabecera del menú */}
      <div className="px-4 pb-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#06345A] font-heading text-sm">
              Guía interactiva de TUNNO
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Aprende a operar y controlar tu taller
            </p>
          </div>
        </div>
      </div>

      {/* Opción destacada: Reanudar recorrido si hay uno guardado */}
      {progresoPendiente && !progresoPendiente.completada && (
        <div className="p-2 border-b border-[#E5E7EB] bg-sky-50/50">
          <button
            type="button"
            onClick={() => {
              onSelectGuia(progresoPendiente.tipoGuia, progresoPendiente.pasoActual);
              onClose();
            }}
            className="w-full p-2.5 bg-white hover:bg-sky-50 border border-[#73C7FF]/60 hover:border-[#1497F2] rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1497F2] text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#06345A] font-heading text-xs">
                    Reanudar recorrido pendiente
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#1497F2] text-white">
                    Paso {progresoPendiente.pasoActual + 1}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] truncate max-w-[200px]">
                  {CATALOGO_GUIAS[progresoPendiente.tipoGuia]?.nombre || 'Recorrido'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Lista de guías interactivas */}
      <div className="px-2 py-2 space-y-1 max-h-[380px] overflow-y-auto">
        {opcionesPrincipales.map((item) => {
          const Icon = item.icono;
          const disponible = isRolPermitido(item.tipo);

          return (
            <button
              key={item.tipo}
              type="button"
              disabled={!disponible}
              onClick={() => {
                if (disponible) {
                  onSelectGuia(item.tipo, 0);
                  onClose();
                }
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                !disponible
                  ? 'opacity-40 cursor-not-allowed bg-slate-50'
                  : 'hover:bg-[#F4F6F8] cursor-pointer group'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.destacado
                      ? 'bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40'
                      : 'bg-slate-100 text-[#06345A]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#06345A] font-heading text-xs truncate">
                      {item.nombre}
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug line-clamp-2">
                    {item.descripcion}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1497F2] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </button>
          );
        })}
      </div>

      {/* Pie: Opción para ver únicamente pasos nuevos */}
      <div className="px-3 pt-2 border-t border-[#E5E7EB]">
        <button
          type="button"
          onClick={() => {
            onSelectGuia('nuevos', 0);
            onClose();
          }}
          className="w-full py-2 px-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 border border-amber-200/80 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-xs font-heading">
              Ver únicamente pasos nuevos de la actualización
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>
    </div>
  );
};
