import React, { useState } from 'react';
import { TipoGuia } from '../data/guiaData';
import { RolUsuario } from '../types';
import {
  Sparkles,
  Compass,
  UserCheck,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface GuiaBienvenidaModalProps {
  isOpen: boolean;
  userRol?: RolUsuario;
  onClose: () => void;
  onStartGuia: (tipo: TipoGuia) => void;
  onSetNoMostrarNuevamente: (noMostrar: boolean) => void;
}

export const GuiaBienvenidaModal: React.FC<GuiaBienvenidaModalProps> = ({
  isOpen,
  userRol,
  onClose,
  onStartGuia,
  onSetNoMostrarNuevamente,
}) => {
  const [noMostrar, setNoMostrar] = useState(false);

  if (!isOpen) return null;

  const handleStart = (tipo: TipoGuia) => {
    onSetNoMostrarNuevamente(noMostrar);
    onStartGuia(tipo);
    onClose();
  };

  const handleDismiss = () => {
    onSetNoMostrarNuevamente(noMostrar);
    onClose();
  };

  // Sugerencia según el rol del usuario
  const getGuiaSugeridaRol = (): TipoGuia => {
    if (userRol === 'Técnico' || userRol === 'Mecánico') return 'mecanico';
    if (userRol === 'Recepción/CRM' || userRol === 'Recepción') return 'recepcion';
    if (userRol === 'Administrador') return 'administrador';
    return 'general';
  };

  const guiaSugerida = getGuiaSugeridaRol();

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#06345A]/50 backdrop-blur-[2px] animate-in fade-in duration-200 font-body">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden text-[#374151] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
      >
        {/* Banner superior TUNNO */}
        <div className="bg-gradient-to-r from-[#06345A] to-[#1497F2] p-6 text-white relative">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar bienvenida"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs font-heading">
              Bienvenido a TUNNO
            </span>
            <span className="text-white/80 text-xs">Tu taller. Tu control.</span>
          </div>

          <h2 id="bienvenida-titulo" className="text-xl sm:text-2xl font-bold font-heading text-white">
            ¿Deseas iniciar una guía interactiva?
          </h2>
          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            Te mostraremos paso a paso cómo organizar citas, órdenes de trabajo, refacciones y facturación en minutos.
          </p>
        </div>

        {/* Opciones rápidas */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            {/* Opción 1: Recorrido general */}
            <button
              type="button"
              onClick={() => handleStart('general')}
              className="w-full p-4 rounded-2xl border-2 border-[#1497F2]/40 hover:border-[#1497F2] bg-sky-50/40 hover:bg-sky-50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1497F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#06345A] font-heading text-sm">
                      Recorrido general completo
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#1497F2] text-white">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Conoce los 13 módulos del taller de principio a fin.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#1497F2] group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Opción 2: Flujo de atención a un cliente */}
            <button
              type="button"
              onClick={() => handleStart('flujo-cliente')}
              className="w-full p-3.5 rounded-2xl border border-[#E5E7EB] hover:border-[#1497F2] hover:bg-slate-50 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-[#06345A] font-heading text-xs sm:text-sm block">
                    Flujo de atención a un cliente
                  </span>
                  <p className="text-[11px] text-[#6B7280]">
                    Paso a paso: desde que llega el auto hasta el cobro y entrega.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1497F2] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Opción 3: Guía personalizada para su rol si no es general */}
            {guiaSugerida !== 'general' && (
              <button
                type="button"
                onClick={() => handleStart(guiaSugerida)}
                className="w-full p-3.5 rounded-2xl border border-[#E5E7EB] hover:border-[#1497F2] hover:bg-slate-50 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#06345A] font-heading text-xs sm:text-sm block">
                      Guía específica para {userRol}
                    </span>
                    <p className="text-[11px] text-[#6B7280]">
                      Solo las funciones y permisos relevantes para tu puesto.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1497F2] group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>

          {/* Checkbox "No mostrar nuevamente" */}
          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[#6B7280] select-none">
              <input
                type="checkbox"
                checked={noMostrar}
                onChange={(e) => setNoMostrar(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1497F2] focus:ring-[#1497F2]"
              />
              <span>No mostrar este mensaje de bienvenida automáticamente</span>
            </label>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#6B7280] hover:text-[#06345A] font-medium py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Más tarde
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Siempre podrás reiniciar la guía desde el botón &ldquo;Guía&rdquo; en el encabezado.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
