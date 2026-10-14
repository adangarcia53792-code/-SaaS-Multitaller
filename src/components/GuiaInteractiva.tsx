import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SectionId, RolUsuario } from '../types';
import {
  PasoGuia,
  TipoGuia,
  CATALOGO_GUIAS,
  guardarProgresoGuia,
  limpiarProgresoGuia,
} from '../data/guiaData';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  Compass,
  Sparkles,
  UserCheck,
  ClipboardList,
  Wrench,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GuiaInteractivaProps {
  isOpen: boolean;
  tipoGuia: TipoGuia;
  pasoInicialIndex?: number;
  userRol?: RolUsuario;
  currentSection: SectionId;
  onNavigateToSection: (section: SectionId) => void;
  isSectionAllowed: (section: SectionId, rol?: RolUsuario) => boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const GuiaInteractiva: React.FC<GuiaInteractivaProps> = ({
  isOpen,
  tipoGuia,
  pasoInicialIndex = 0,
  userRol,
  currentSection,
  onNavigateToSection,
  isSectionAllowed,
  onClose,
  onComplete,
}) => {
  // Obtener definición de la guía y filtrar pasos según permisos del rol
  const definicion = CATALOGO_GUIAS[tipoGuia] || CATALOGO_GUIAS.general;

  const pasosFiltrados = React.useMemo(() => {
    return definicion.pasos.filter((p) => isSectionAllowed(p.seccion, userRol));
  }, [definicion, userRol, isSectionAllowed]);

  const [currentStepIndex, setCurrentStepIndex] = useState(pasoInicialIndex);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const initialScrollYRef = useRef<number>(0);

  // Asegurar que el paso actual esté en rango si los pasos cambiaron
  useEffect(() => {
    if (pasoInicialIndex < pasosFiltrados.length) {
      setCurrentStepIndex(pasoInicialIndex);
    } else {
      setCurrentStepIndex(0);
    }
  }, [pasoInicialIndex, pasosFiltrados.length]);

  const pasoActual: PasoGuia | undefined = pasosFiltrados[currentStepIndex];

  // Guardar scroll original al abrir
  useEffect(() => {
    if (isOpen) {
      initialScrollYRef.current = window.scrollY;
    }
  }, [isOpen]);

  // Navegar a la sección del paso si es diferente
  useEffect(() => {
    if (!isOpen || !pasoActual) return;

    if (pasoActual.seccion !== currentSection) {
      onNavigateToSection(pasoActual.seccion);
    }
  }, [isOpen, pasoActual, currentSection, onNavigateToSection]);

  // Medir y ubicar el elemento objetivo en la pantalla
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !pasoActual) {
      setTargetRect(null);
      setTargetFound(false);
      return;
    }

    let el: Element | null = null;
    if (pasoActual.targetSelector) {
      el = document.querySelector(pasoActual.targetSelector);
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      // Validar que tenga dimensiones visibles
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
        setTargetFound(true);
        return;
      }
    }

    setTargetRect(null);
    setTargetFound(false);
  }, [isOpen, pasoActual]);

  // Efecto cuando cambia el paso: esperar render y hacer scroll suave al elemento
  useEffect(() => {
    if (!isOpen || !pasoActual) return;

    // Guardar progreso automáticamente
    guardarProgresoGuia(tipoGuia, currentStepIndex);

    const timer = setTimeout(() => {
      let el: Element | null = null;
      if (pasoActual.targetSelector) {
        el = document.querySelector(pasoActual.targetSelector);
      }

      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch {
          // Fallback silencioso
        }
      }

      // Medir después de permitir que comience el scroll
      updateTargetPosition();
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, pasoActual, tipoGuia, updateTargetPosition]);

  // Actualizar rectángulos en resize y scroll de la ventana
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateTargetPosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateTargetPosition]);

  // Atajos de teclado: Escape para cerrar, flechas para navegar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < pasosFiltrados.length - 1) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          e.preventDefault();
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, pasosFiltrados.length]);

  const handleNext = () => {
    if (currentStepIndex < pasosFiltrados.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Fin de la guía
      limpiarProgresoGuia();
      if (onComplete) onComplete();
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    // Restaurar scroll suave al estado anterior
    try {
      window.scrollTo({ top: initialScrollYRef.current, behavior: 'smooth' });
    } catch {
      // Fallback
    }
    onClose();
  };

  if (!isOpen || !pasoActual || pasosFiltrados.length === 0) {
    return null;
  }

  // Cálculo de posición de la tarjeta flotante
  const calculateCardPosition = () => {
    if (typeof window === 'undefined') return {};

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      // En móvil se posiciona como una tarjeta en la parte inferior visible
      return {
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxWidth: 'calc(100vw - 32px)',
      };
    }

    if (!targetRect || !targetFound) {
      // Centrado en pantalla si no se encuentra el elemento
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '440px',
        width: '100%',
      };
    }

    const cardWidth = 420;
    const cardHeightEst = 360;
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = targetRect.bottom + margin;
    let left = targetRect.left;

    // Preferencia o verificación de espacio inferior
    if (targetRect.bottom + cardHeightEst + margin > viewportHeight) {
      // No cabe abajo, intentar arriba
      if (targetRect.top - cardHeightEst - margin > 0) {
        top = targetRect.top - cardHeightEst - margin;
      } else {
        // No cabe ni arriba ni abajo con holgura: colocar al centro vertical libre
        top = Math.max(margin, Math.min(viewportHeight - cardHeightEst - margin, 80));
      }
    }

    // Ajuste horizontal para no desbordar por la derecha
    if (left + cardWidth > viewportWidth - margin) {
      left = viewportWidth - cardWidth - margin;
    }
    // No desbordar por la izquierda
    if (left < margin) {
      left = margin;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${cardWidth}px`,
      width: '100%',
    };
  };

  const cardStyle = calculateCardPosition();

  // Icono de la guía
  const getGuideIcon = () => {
    switch (tipoGuia) {
      case 'flujo-cliente':
        return <UserCheck className="w-4 h-4 text-[#1497F2]" />;
      case 'recepcion':
        return <ClipboardList className="w-4 h-4 text-[#1497F2]" />;
      case 'mecanico':
        return <Wrench className="w-4 h-4 text-[#1497F2]" />;
      case 'administrador':
        return <ShieldCheck className="w-4 h-4 text-[#1497F2]" />;
      case 'ia':
        return <Sparkles className="w-4 h-4 text-[#1497F2]" />;
      case 'nuevos':
        return <Zap className="w-4 h-4 text-[#1497F2]" />;
      default:
        return <Compass className="w-4 h-4 text-[#1497F2]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto select-none sm:select-auto font-body">
      {/* 1. Fondo oscurecido con recorte o destaque del elemento */}
      <div
        className="fixed inset-0 bg-[#06345A]/40 backdrop-blur-[1.5px] transition-opacity duration-300 pointer-events-auto"
        onClick={handleClose}
      />

      {/* 2. Resaltado con borde azul eléctrico #1497F2 sobre el elemento objetivo */}
      {targetFound && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 z-[10000]"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '12px',
            border: '3px solid #1497F2',
            boxShadow: '0 0 0 4px rgba(20, 151, 242, 0.35), 0 8px 30px rgba(0, 0, 0, 0.35)',
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* 3. Tarjeta interactiva explicativa */}
      <div
        ref={cardRef}
        role="dialog"
        aria-label="Guía interactiva TUNNO"
        className="fixed z-[10001] bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 md:p-6 text-[#374151] animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera de la tarjeta */}
        <div className="space-y-2 border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 rounded-md bg-sky-50 border border-[#73C7FF]/40 shrink-0">
                {getGuideIcon()}
              </span>
              <span className="text-xs font-semibold text-[#06345A] font-heading truncate">
                {definicion.nombre}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F6F8] text-[#1497F2] border border-[#E5E7EB]">
                Paso {currentStepIndex + 1} de {pasosFiltrados.length}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-[#6B7280] hover:text-[#06345A] hover:bg-slate-100 p-1 rounded-md transition-colors cursor-pointer"
                title="Cerrar guía (Esc)"
                aria-label="Cerrar guía"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1497F2] h-full transition-all duration-300 rounded-full"
              style={{
                width: `${((currentStepIndex + 1) / pasosFiltrados.length) * 100}%`,
              }}
            />
          </div>

          {/* Título del paso */}
          <div className="pt-1 flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold font-heading text-[#06345A] leading-snug">
              {pasoActual.titulo}
            </h3>
            {pasoActual.isNew && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Nuevo</span>
              </span>
            )}
          </div>
        </div>

        {/* Cuerpo explicativo respondiendo las 3 preguntas clave */}
        <div className="py-3.5 space-y-2.5 text-xs">
          {/* 1. ¿Para qué sirve? */}
          <div className="bg-[#F4F6F8] p-3 rounded-xl border border-[#E5E7EB]/80">
            <span className="font-bold text-[#06345A] block mb-1 font-heading text-[11px] uppercase tracking-wider">
              ¿Para qué sirve?
            </span>
            <p className="text-[#374151] leading-relaxed">{pasoActual.paraQueSirve}</p>
          </div>

          {/* 2. ¿Qué debe hacer el usuario? */}
          <div className="bg-[#F4F6F8] p-3 rounded-xl border border-[#E5E7EB]/80">
            <span className="font-bold text-[#06345A] block mb-1 font-heading text-[11px] uppercase tracking-wider">
              ¿Qué debes hacer?
            </span>
            <p className="text-[#374151] leading-relaxed">{pasoActual.queHacer}</p>
          </div>

          {/* 3. ¿Qué sucede después? */}
          <div className="bg-[#F4F6F8] p-3 rounded-xl border border-[#E5E7EB]/80">
            <span className="font-bold text-[#06345A] block mb-1 font-heading text-[11px] uppercase tracking-wider">
              ¿Qué sucede después?
            </span>
            <p className="text-[#374151] leading-relaxed">{pasoActual.queSucedeDespues}</p>
          </div>

          {/* Recomendación práctica */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-amber-950 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold font-heading">Recomendación TUNNO: </strong>
              <span>{pasoActual.recomendacionPractica}</span>
            </div>
          </div>

          {/* Botón de acción directa si está configurado (especial para Flujo de un cliente) */}
          {pasoActual.accionTexto && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onNavigateToSection(pasoActual.seccion);
                  // Actualizar elemento resaltado
                  setTimeout(() => updateTargetPosition(), 100);
                }}
                className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 text-[#06345A] border border-[#73C7FF]/60 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{pasoActual.accionTexto}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#1497F2]" />
              </button>
            </div>
          )}
        </div>

        {/* Pie de controles: Saltar, Anterior, Siguiente */}
        <div className="border-t border-[#E5E7EB] pt-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-[#6B7280] hover:text-[#06345A] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Saltar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className={`px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold flex items-center gap-1 transition-all ${
                currentStepIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                  : 'bg-white text-[#374151] hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              {currentStepIndex === pasosFiltrados.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finalizar</span>
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
