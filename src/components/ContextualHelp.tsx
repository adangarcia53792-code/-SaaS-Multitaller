import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Lightbulb, CheckCircle2 } from 'lucide-react';

export type TemaAyudaContextual =
  | 'aprobar-cotizacion'
  | 'generar-factura'
  | 'registrar-pago'
  | 'cambiar-estado-orden'
  | 'utilizar-devolver-refaccion'
  | 'control-calidad'
  | 'garantias'
  | 'funciones-ia';

interface ContenidoAyuda {
  titulo: string;
  badge: string;
  paraQueSirve: string;
  queHacer: string;
  queSucedeDespues: string;
  consejo: string;
}

const DICCIONARIO_AYUDA: Record<TemaAyudaContextual, ContenidoAyuda> = {
  'aprobar-cotizacion': {
    titulo: 'Aprobar cotización',
    badge: 'Cotizaciones',
    paraQueSirve:
      'Registra que el cliente dio su visto bueno a las refacciones, mano de obra y costos estimados del presupuesto.',
    queHacer:
      'Verifica con el cliente por teléfono, mensaje o en mostrador que acepte el monto total y pulsa este botón de "Aprobar".',
    queSucedeDespues:
      'La cotización cambia de "Por autorizar" a "Aprobada" y permite generar de inmediato la Orden de Trabajo en bahía.',
    consejo:
      'Si el cliente solo autorizó una parte del trabajo, edita los conceptos antes de aprobar.',
  },
  'generar-factura': {
    titulo: 'Generar factura administrativa',
    badge: 'Facturación',
    paraQueSirve:
      'Emite el comprobante de cobro oficial con desglose de IVA (16%), folio consecutivo y datos fiscales del taller y cliente.',
    queHacer:
      'Selecciona una orden de trabajo terminada o cotización aprobada, valida los datos del receptor y pulsa emitir.',
    queSucedeDespues:
      'Se crea el registro en el módulo de facturación listo para recibir el pago y ser impreso en PDF con formato membretado.',
    consejo:
      'Confirma si el cliente requiere RFC específico o si se emite como "Público en general" antes de guardarla.',
  },
  'registrar-pago': {
    titulo: 'Registrar pago o cobro',
    badge: 'Caja y Cobranza',
    paraQueSirve:
      'Asentar formalmente el ingreso de dinero en caja y liquidar la cuenta por cobrar de una factura.',
    queHacer:
      'Indica la forma de pago (Efectivo, Tarjeta, Transferencia), el monto recibido y anota la referencia bancaria o número de voucher.',
    queSucedeDespues:
      'El comprobante se marca como "Pagada", se actualizan las entradas de dinero del día y se autoriza la entrega del auto.',
    consejo:
      'Guarda siempre el folio de autorización bancaria para cuadrar fácilmente el corte de terminal al final del turno.',
  },
  'cambiar-estado-orden': {
    titulo: 'Cambiar estado de la orden',
    badge: 'Órdenes de trabajo',
    paraQueSirve:
      'Controlar el flujo del vehículo en el taller: "Por autorizar" ➔ "En proceso" ➔ "Terminado" ➔ "Entregado".',
    queHacer:
      'Selecciona el nuevo estatus conforme avance el trabajo técnico en rampa o bahía.',
    queSucedeDespues:
      'El semáforo de tiempos se recalcula, la recepción sabe exactamente si el auto está listo y el cliente puede ser notificado.',
    consejo:
      'No marques "Terminado" hasta que el auto pase la inspección de control de calidad.',
  },
  'utilizar-devolver-refaccion': {
    titulo: 'Consumo y devolución de refacciones',
    badge: 'Inventario en Orden',
    paraQueSirve:
      'Garantizar que a la orden solo se le cobren las refacciones que físicamente se quedaron instaladas en el auto.',
    queHacer:
      'Usa "+ Refacción" para solicitar piezas de almacén. Si una bujía, filtro o aceite sobró o no se ocupó, pulsa "Devolver" indicando la cantidad devuelta.',
    queSucedeDespues:
      'Las existencias del almacén se reintegran de inmediato y el costo final para el cliente disminuye en consecuencia.',
    consejo:
      'Devuelve las piezas sin abrir antes de terminar la orden para que el cobro final sea exacto sin cancelaciones.',
  },
  'control-calidad': {
    titulo: 'Control de calidad y revisión final',
    badge: 'Inspección de salida',
    paraQueSirve:
      'Asegurar que el vehículo cumple todos los estándares de seguridad y limpieza antes de devolverlo al cliente.',
    queHacer:
      'Verifica torque de ruedas, niveles de fluidos, ausencia de códigos de falla en tablero y pulsa "Aprobar inspección".',
    queSucedeDespues:
      'Se emite la constancia de calidad técnica y la orden queda formalmente autorizada para entrega con garantía.',
    consejo:
      'Una inspección de 3 minutos previene el 95% de los retornos por garantía y genera máxima confianza en el cliente.',
  },
  garantias: {
    titulo: 'Gestión de garantías de servicio',
    badge: 'Garantías TUNNO',
    paraQueSirve:
      'Proteger al cliente y formalizar el periodo de cobertura en refacciones (30-90 días) y mano de obra aplicada.',
    queHacer:
      'Al entregar el servicio, consulta la póliza de garantía generada. Si el auto regresa por inconformidad, registra la reclamación aquí.',
    queSucedeDespues:
      'El sistema rastrea si la garantía está vigente, quién fue el mecánico responsable y qué piezas se sustituyeron.',
    consejo:
      'Explica al cliente los días de garantía al cobrar; reduce su desconfianza y asegura que regrese con nosotros.',
  },
  'funciones-ia': {
    titulo: 'Funciones con Inteligencia Artificial',
    badge: 'Tecnología TUNNO IA',
    paraQueSirve:
      'Herramientas inteligentes de análisis rápido para diagnóstico de fallas, recepción de clientes y recomendaciones de negocio.',
    queHacer:
      'Pulsa el botón de Asistencia Técnica o Análisis con IA en órdenes, cotizaciones o reportes para obtener diagnósticos y sugerencias.',
    queSucedeDespues:
      'El modelo procesa los datos del vehículo y motor, ofreciendo causas probables, componentes a revisar y márgenes recomendados.',
    consejo:
      'Utiliza la IA como tu copiloto consultivo; la decisión final siempre está en manos del mecánico y del jefe de taller.',
  },
};

interface ContextualHelpProps {
  tema: TemaAyudaContextual;
  className?: string;
  posicion?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  tooltipText?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  tema,
  className = '',
  tooltipText = 'Ayuda sobre esta función',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const data = DICCIONARIO_AYUDA[tema];

  // Cerrar al hacer clic fuera o con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!data) return null;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[#1497F2] hover:text-[#06345A] hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-[#1497F2]/30 transition-all cursor-pointer"
        title={tooltipText}
        aria-label={tooltipText}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 bg-slate-900/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm sm:w-80 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-4 text-left text-xs text-[#374151] z-50 space-y-3 font-body">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-2 border-b border-[#E5E7EB] pb-2.5">
              <div className="space-y-0.5">
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40 font-heading">
                  {data.badge}
                </span>
                <h4 className="font-bold text-[#06345A] text-sm font-heading flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#1497F2] shrink-0" />
                  <span>{data.titulo}</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#6B7280] hover:text-[#06345A] p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar ayuda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tres preguntas clave */}
            <div className="space-y-2">
              <div className="bg-[#F4F6F8] p-2.5 rounded-lg border border-[#E5E7EB]/70">
                <span className="font-bold text-[#06345A] block mb-0.5 font-heading text-[11px]">
                  ¿Para qué sirve?
                </span>
                <p className="text-[#374151] leading-relaxed">{data.paraQueSirve}</p>
              </div>

              <div className="bg-[#F4F6F8] p-2.5 rounded-lg border border-[#E5E7EB]/70">
                <span className="font-bold text-[#06345A] block mb-0.5 font-heading text-[11px]">
                  ¿Qué debe hacer el usuario?
                </span>
                <p className="text-[#374151] leading-relaxed">{data.queHacer}</p>
              </div>

              <div className="bg-[#F4F6F8] p-2.5 rounded-lg border border-[#E5E7EB]/70">
                <span className="font-bold text-[#06345A] block mb-0.5 font-heading text-[11px]">
                  ¿Qué sucede después?
                </span>
                <p className="text-[#374151] leading-relaxed">{data.queSucedeDespues}</p>
              </div>
            </div>

            {/* Consejo práctico */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 text-[11px]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="font-semibold text-amber-950 font-heading">Consejo: </strong>
                <span>{data.consejo}</span>
              </div>
            </div>

            {/* Botón de cierre rápido */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-[#06345A] hover:bg-[#1497F2] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Entendido</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
