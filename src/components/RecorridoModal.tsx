import React from 'react';
import { SectionId } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  Compass,
  X,
  PlusCircle,
  FileText,
  Wrench,
  Receipt,
  History,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RecorridoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection: (section: SectionId) => void;
}

interface PasoRecorrido {
  numero: number;
  titulo: string;
  seccion: SectionId;
  seccionNombre: string;
  icono: React.ComponentType<{ className?: string }>;
  descripcion: string;
  detalles: string[];
  colorBadge: string;
}

const PASOS_RECORRIDO: PasoRecorrido[] = [
  {
    numero: 1,
    titulo: 'Recibir al cliente',
    seccion: 'nueva-atencion',
    seccionNombre: 'Nueva atención',
    icono: PlusCircle,
    descripcion:
      'Recepción rápida del cliente, registro de datos vehiculares (placas, marca, modelo), motivo de visita y diagnóstico preliminar.',
    detalles: [
      'Búsqueda o alta de cliente y vehículo',
      'Captura de kilometraje y reporte de fallas',
      'Generación de cita, cotización u orden directa',
    ],
    colorBadge: 'bg-sky-50 text-[#1D7EAE] border-sky-200',
  },
  {
    numero: 2,
    titulo: 'Cotizar y autorizar',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    icono: FileText,
    descripcion:
      'Elaboración detallada del presupuesto desglosando refacciones y mano de obra. Registro formal de la aprobación del cliente.',
    detalles: [
      'Cálculo de importes estimados y margen',
      'Registro de autorización del cliente',
      'Pase directo a orden de trabajo o facturación',
    ],
    colorBadge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    numero: 3,
    titulo: 'Realizar el servicio',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    icono: Wrench,
    descripcion:
      'Ejecución del servicio en taller. Asignación de técnico, registro de refacciones consumidas netas y semáforo de entrega en tiempo.',
    detalles: [
      'Semáforo de entrega: verde, amarillo, rojo y gris',
      'Costeo real comparado vs. cotización aprobada',
      'Checklist final y entrega vehicular',
    ],
    colorBadge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    numero: 4,
    titulo: 'Facturar y cobrar',
    seccion: 'facturacion',
    seccionNombre: 'Facturación',
    icono: Receipt,
    descripcion:
      'Emisión del comprobante administrativo con folio consecutivo, desglose de IVA (16 %) y registro de cobro con monto y referencia bancaria.',
    detalles: [
      'Generación con folio automático y datos fiscales',
      'Desglose transparente: Subtotal, IVA 16% y Total',
      'Registro de cobro con referencia SPEI o voucher',
    ],
    colorBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    numero: 5,
    titulo: 'Consultar el historial',
    seccion: 'historial-vehicular',
    seccionNombre: 'Historial vehicular',
    icono: History,
    descripcion:
      'Expediente completo y cronológico del automóvil con todas sus citas, cotizaciones y órdenes de trabajo. Impresión de expediente para el cliente.',
    detalles: [
      'Estadísticas de visitas y trabajos aprobados',
      'Expediente cronológico de servicios',
      'Hoja de servicios lista para imprimir o PDF',
    ],
    colorBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
];

export const RecorridoModal: React.FC<RecorridoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
}) => {
  const modalDismiss = useModalDismiss({
    isOpen,
    onClose,
    closeOnBackdrop: true,
  });

  if (!isOpen) return null;

  const handlePasoClick = (seccion: SectionId) => {
    onNavigateToSection(seccion);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto no-print"
      onClick={modalDismiss.handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-[#DDE4E8] bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#231F20] tracking-tight">
                  Recorrido de presentación
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#1D7EAE]/10 text-[#1D7EAE] border border-[#1D7EAE]/20">
                  Flujo del taller
                </span>
              </div>
              <p className="text-xs text-[#5F6B73] mt-0.5">
                Demostración guiada paso a paso del ciclo completo de atención vehicular.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={modalDismiss.handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Cerrar recorrido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#1D7EAE] shrink-0" />
            <span>
              Haz clic en cualquier paso para abrir directamente la sección correspondiente en la plataforma.
            </span>
          </div>

          <div className="space-y-3">
            {PASOS_RECORRIDO.map((paso) => {
              const Icon = paso.icono;
              return (
                <div
                  key={paso.numero}
                  onClick={() => handlePasoClick(paso.seccion)}
                  className="group p-4 rounded-xl border border-[#DDE4E8] bg-white hover:bg-slate-50/80 hover:border-[#1D7EAE] transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1D7EAE] text-white font-bold flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#0032A0] transition-colors">
                      <span className="text-sm font-mono">{paso.numero}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#231F20] text-sm group-hover:text-[#1D7EAE] transition-colors">
                          {paso.titulo}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${paso.colorBadge}`}>
                          Sección: {paso.seccionNombre}
                        </span>
                      </div>

                      <p className="text-xs text-[#5F6B73] leading-relaxed">
                        {paso.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-500">
                        {paso.detalles.map((det, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{det}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePasoClick(paso.seccion);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 group-hover:bg-[#1D7EAE] text-slate-700 group-hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Abrir {paso.seccionNombre}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#DDE4E8] bg-slate-50 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 text-[11px]">
            Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> o haz clic fuera para cerrar
          </span>

          <button
            type="button"
            onClick={modalDismiss.handleClose}
            className="px-4 py-2 border border-[#DDE4E8] hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar recorrido
          </button>
        </div>
      </div>
    </div>
  );
};
