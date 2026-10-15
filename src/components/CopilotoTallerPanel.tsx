import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  FileText,
  Wrench,
  Package,
  Receipt,
  Users,
  Car,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Truck,
  ClipboardCheck,
} from 'lucide-react';
import {
  SectionId,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Refaccion,
  Factura,
  Cliente,
  Vehiculo,
  Seguimiento,
  Prospecto,
  Empleado,
  Garantia,
  Flotilla,
  EventoBitacora,
  SesionUsuario,
  SeccionBitacora,
  DetalleCambioBitacora,
} from '../types';

interface CopilotoTallerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: SectionId;
  onNavigateToSection: (section: SectionId) => void;
  currentUser?: SesionUsuario;
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  refacciones: Refaccion[];
  facturas: Factura[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  seguimientos: Seguimiento[];
  prospectos: Prospecto[];
  empleados?: Empleado[];
  garantias?: Garantia[];
  flotillas?: Flotilla[];
  bitacora?: EventoBitacora[];
  onSaveCotizacion?: (cot: Cotizacion) => void;
  onUpdateEstadoCotizacion?: (id: string, nuevoEstado: any) => void;
  onSaveOrden?: (orden: OrdenTrabajo) => void;
  onSaveCita?: (cita: Cita) => void;
  onRegistrarBitacora?: (
    tipoAccion: string,
    seccion: SeccionBitacora,
    descripcion: string,
    registroId?: string,
    registroFolio?: string,
    detalles?: DetalleCambioBitacora[]
  ) => void;
  onOpenCrearCotizacionIA?: () => void;
  onShowToast?: (mensaje: string) => void;
}

export const CopilotoTallerPanel: React.FC<CopilotoTallerPanelProps> = ({
  isOpen,
  onClose,
  currentSection,
  onNavigateToSection,
  currentUser,
  citas,
  cotizaciones,
  ordenes,
  refacciones,
  facturas,
  clientes,
  vehiculos,
  seguimientos,
  prospectos,
  empleados = [],
  garantias = [],
  flotillas = [],
  bitacora = [],
  onSaveCotizacion,
  onUpdateEstadoCotizacion,
  onSaveOrden,
  onSaveCita,
  onRegistrarBitacora,
  onOpenCrearCotizacionIA,
  onShowToast,
}) => {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Mapeo de títulos por sección
  const titulosSeccion: Record<SectionId, { titulo: string; icono: any }> = {
    dashboard: { titulo: 'Copiloto de Control General', icono: TrendingUp },
    citas: { titulo: 'Copiloto de Citas y Agenda', icono: Calendar },
    calendario: { titulo: 'Copiloto de Calendario', icono: Calendar },
    cotizaciones: { titulo: 'Copiloto de Cotizaciones', icono: FileText },
    ordenes: { titulo: 'Copiloto de Órdenes de Trabajo', icono: Wrench },
    inventario: { titulo: 'Copiloto de Inventario y Compras', icono: Package },
    facturacion: { titulo: 'Copiloto de Facturación y Caja', icono: Receipt },
    clientes: { titulo: 'Copiloto de Clientes y CRM', icono: Users },
    vehiculos: { titulo: 'Copiloto de Padrón Vehicular', icono: Car },
    'historial-vehicular': { titulo: 'Copiloto de Historial Técnico', icono: Car },
    flotillas: { titulo: 'Copiloto de Flotillas y Mantenimiento', icono: Truck },
    servicios: { titulo: 'Copiloto de Catálogo de Servicios', icono: Wrench },
    'nueva-atencion': { titulo: 'Copiloto de Recepción', icono: Users },
    'atencion-asistida': { titulo: 'Copiloto de Seguimientos', icono: Clock },
    'personal-asistencia': { titulo: 'Copiloto de Personal', icono: Users },
    bitacora: { titulo: 'Copiloto de Auditoría', icono: ShieldCheck },
    prospectos: { titulo: 'Copiloto de Prospectos', icono: Users },
    garantias: { titulo: 'Copiloto de Garantías', icono: ShieldCheck },
    reportes: { titulo: 'Copiloto de Reportes Financieros', icono: TrendingUp },
    configuracion: { titulo: 'Copiloto de Configuración', icono: Wrench },
  };

  const seccionInfo = titulosSeccion[currentSection] || {
    titulo: 'Copiloto Operativo TUNNO',
    icono: Sparkles,
  };
  const IconoSeccion = seccionInfo.icono;

  // Diagnóstico contextual dinámico según la sección actual
  const hallazgos = useMemo(() => {
    const list: {
      id: string;
      prioridad: 'urgente' | 'importante' | 'informativa';
      titulo: string;
      motivo: string;
      datosUsados: string;
      accionTexto: string;
      onClick: () => void;
    }[] = [];

    if (currentSection === 'cotizaciones') {
      const pendientes = cotizaciones.filter((c) => c.estado === 'Por autorizar');
      if (pendientes.length > 0) {
        list.push({
          id: 'cot-1',
          prioridad: 'urgente',
          titulo: `${pendientes.length} cotización(es) en espera de autorización`,
          motivo: 'Clientes aún no han respondido. Se sugiere enviar mensaje de seguimiento por WhatsApp.',
          datosUsados: `Cotizaciones registradas: ${pendientes.map((c) => c.folio).join(', ')}`,
          accionTexto: 'Revisar cotizaciones',
          onClick: () => {
            onNavigateToSection('cotizaciones');
            onClose();
          },
        });
      }
      list.push({
        id: 'cot-2',
        prioridad: 'importante',
        titulo: 'Oportunidad de margen en mano de obra',
        motivo: 'Se detectaron tarifas de mano de obra por debajo de $500/hr en reparaciones de frenos.',
        datosUsados: 'Análisis de costo vs precio de venta en catálogo y cotizaciones activas',
        accionTexto: 'Ajustar con IA',
        onClick: () => {
          if (onOpenCrearCotizacionIA) {
            onOpenCrearCotizacionIA();
            onClose();
          }
        },
      });
    } else if (currentSection === 'citas') {
      const citasHoy = citas.filter((c) => c.estado === 'Programada');
      list.push({
        id: 'cit-1',
        prioridad: 'importante',
        titulo: `${citasHoy.length} cita(s) programada(s) pendientes de confirmación`,
        motivo: 'Confirmar asistencia con los clientes para asegurar ocupación óptima de rampas.',
        datosUsados: 'Agenda del día en calendario operativo',
        accionTexto: 'Ver citas',
        onClick: () => {
          onNavigateToSection('citas');
          onClose();
        },
      });
      list.push({
        id: 'cit-2',
        prioridad: 'informativa',
        titulo: 'Capacidad en rampas disponible para mañana',
        motivo: 'Turnos matutinos libres en rampa 2 con el técnico Miguel Ángel Gómez.',
        datosUsados: 'Horarios de técnicos y citas agendadas',
        accionTexto: 'Agendar cita',
        onClick: () => {
          onNavigateToSection('citas');
          onClose();
        },
      });
    } else if (currentSection === 'ordenes') {
      const enProceso = ordenes.filter((o) => o.estado === 'En proceso');
      list.push({
        id: 'ord-1',
        prioridad: 'urgente',
        titulo: `${enProceso.length} órdenes activas en rampa`,
        motivo: 'Supervisar avance físico y validar que las piezas solicitadas estén entregadas.',
        datosUsados: 'Órdenes de trabajo activas en taller',
        accionTexto: 'Auditar órdenes',
        onClick: () => {
          onNavigateToSection('ordenes');
          onClose();
        },
      });
    } else if (currentSection === 'inventario') {
      const bajas = refacciones.filter((r) => r.existencias <= r.minimo);
      list.push({
        id: 'inv-1',
        prioridad: 'urgente',
        titulo: `${bajas.length} refacción(es) con existencias mínimas o agotadas`,
        motivo: 'Riesgo de retraso en servicios programados si no se emiten órdenes de compra.',
        datosUsados: `Existencias vs stock mínimo en ${bajas.length} piezas críticas`,
        accionTexto: 'Ver existencias',
        onClick: () => {
          onNavigateToSection('inventario');
          onClose();
        },
      });
    } else if (currentSection === 'facturacion') {
      const porCobrar = facturas.filter((f) => f.estado === 'Pendiente');
      list.push({
        id: 'fac-1',
        prioridad: 'importante',
        titulo: `${porCobrar.length} comprobante(s) con cobro pendiente`,
        motivo: 'Flujo de caja: validar pagos bancarios de servicios terminados.',
        datosUsados: 'Módulo de facturas y cobranza',
        accionTexto: 'Revisar cuentas',
        onClick: () => {
          onNavigateToSection('facturacion');
          onClose();
        },
      });
    } else {
      list.push({
        id: 'gen-1',
        prioridad: 'importante',
        titulo: 'Balance operativo general del taller',
        motivo: 'El taller mantiene un flujo regular de citas y órdenes activas.',
        datosUsados: `${cotizaciones.length} cotizaciones, ${ordenes.length} órdenes, ${citas.length} citas`,
        accionTexto: 'Ver detalles',
        onClick: () => {
          onNavigateToSection('dashboard');
          onClose();
        },
      });
    }

    return list;
  }, [currentSection, cotizaciones, citas, ordenes, refacciones, facturas, onNavigateToSection, onClose, onOpenCrearCotizacionIA]);

  const visibles = mostrarTodos ? hallazgos : hallazgos.slice(0, 3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#06345A]/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col font-body">
          {/* Header */}
          <div className="px-5 py-4 bg-[#06345A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1497F2] flex items-center justify-center text-white shrink-0">
                <IconoSeccion className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-white">
                  {seccionInfo.titulo}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Diagnóstico contextual con salvaguardas humanas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar copiloto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#374151]">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                Recomendaciones operativas ({hallazgos.length})
              </span>
              {hallazgos.length > 3 && (
                <button
                  type="button"
                  onClick={() => setMostrarTodos((prev) => !prev)}
                  className="text-[11px] font-semibold text-[#1497F2] hover:underline cursor-pointer"
                >
                  {mostrarTodos ? 'Ver menos' : 'Ver todos'}
                </button>
              )}
            </div>

            {visibles.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-heading font-bold text-xs text-[#06345A]">
                    {h.titulo}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      h.prioridad === 'urgente'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : h.prioridad === 'importante'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {h.prioridad}
                  </span>
                </div>

                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  {h.motivo}
                </p>

                <div className="p-2 rounded bg-[#F8FAFC] text-[10px] text-[#6B7280]">
                  <span className="font-semibold text-[#06345A]">Datos analizados:</span>{' '}
                  {h.datosUsados}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={h.onClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06345A] hover:bg-[#1497F2] text-white text-[11px] font-heading font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>{h.accionTexto}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#F4F6F8] border-t border-[#E5E7EB] shrink-0 text-[10px] text-[#6B7280] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#06345A] shrink-0" />
            <span>
              La IA solo analiza y sugiere. No altera registros ni ejecuta cambios sin autorización expresa.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
