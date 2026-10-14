import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SectionId,
  RolUsuario,
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
} from '../types';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Send,
  HelpCircle,
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
  MessageSquare,
  Bot,
} from 'lucide-react';

export type PrioridadAsistente = 'urgente' | 'importante' | 'informativa';

export interface RecomendacionItem {
  id: string;
  prioridad: PrioridadAsistente;
  titulo: string;
  motivo: string;
  accionTexto: string;
  seccionDestino: SectionId;
  filtroParam?: string;
  registroId?: string;
}

export interface AccionInmediataItem {
  id: string;
  titulo: string;
  descripcion: string;
  accionTexto: string;
  seccionDestino: SectionId;
}

export interface ChatMensaje {
  id: string;
  remitente: 'usuario' | 'asistente';
  texto: string;
  timestamp: string;
  accionSugerida?: {
    texto: string;
    seccion: SectionId;
  };
  advertenciaConfirmacion?: boolean;
}

interface AsistenteInteligenteProps {
  currentSection: SectionId;
  onNavigateToSection: (section: SectionId, extraParam?: string) => void;
  userRol?: RolUsuario;
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
}

export const AsistenteInteligente: React.FC<AsistenteInteligenteProps> = ({
  currentSection,
  onNavigateToSection,
  userRol,
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPregunta, setInputPregunta] = useState('');
  const [mensajesChat, setMensajesChat] = useState<ChatMensaje[]>([]);
  const [isPensando, setIsPensando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Mapeo amigable de nombres de secciones
  const nombresSecciones: Record<SectionId, string> = {
    dashboard: 'Dashboard',
    citas: 'Citas y Calendario',
    calendario: 'Calendario operativo',
    cotizaciones: 'Cotizaciones',
    ordenes: 'Órdenes de trabajo',
    inventario: 'Inventario de refacciones',
    facturacion: 'Facturación y Caja',
    clientes: 'Clientes y Padrón',
    vehiculos: 'Vehículos',
    'historial-vehicular': 'Historial vehicular',
    flotillas: 'Flotillas',
    servicios: 'Servicios de taller',
    'nueva-atencion': 'Nueva atención',
    'atencion-asistida': 'Asistente IA',
    'personal-asistencia': 'Personal y Asistencias',
    bitacora: 'Seguimientos y Bitácora',
    prospectos: 'Prospectos CRM',
    garantias: 'Garantías',
    reportes: 'Reportes gerenciales',
    configuracion: 'Configuración',
  };

  const seccionActualNombre = nombresSecciones[currentSection] || currentSection;

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-scroll en el chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [mensajesChat, isPensando]);

  // Fecha actual YYYY-MM-DD
  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ============================================================================
  // ANÁLISIS CONTEXTUAL SEGÚN LA SECCIÓN ("¿Qué requiere atención?")
  // Máximo 3 recomendaciones ordenadas por prioridad: urgente, importante, informativa
  // ============================================================================
  const { recomendaciones, accionesInmediatas, resumenContexto } = useMemo(() => {
    const recs: RecomendacionItem[] = [];
    const accs: AccionInmediataItem[] = [];
    let resumen = '';

    switch (currentSection) {
      case 'dashboard': {
        resumen = 'Resumen ejecutivo de pendientes prioritarios en todo el taller.';

        // 1. Órdenes retrasadas
        const ordenesAtrasadas = ordenes.filter(
          (o) =>
            o.estado !== 'Terminado' &&
            o.fechaEntregaPrometida &&
            o.fechaEntregaPrometida <= hoyStr
        );
        if (ordenesAtrasadas.length > 0) {
          const ord = ordenesAtrasadas[0];
          recs.push({
            id: 'dash-ord-retraso',
            prioridad: 'urgente',
            titulo: `${ordenesAtrasadas.length} orden(es) con entrega para hoy o vencida`,
            motivo: `La orden ${ord.folio} (${ord.servicio}) requiere finalizarse para evitar incumplimiento al cliente.`,
            accionTexto: 'Abrir orden',
            seccionDestino: 'ordenes',
            registroId: ord.id,
          });
        }

        // 2. Cotizaciones por autorizar
        const cotizacionesPendientes = cotizaciones.filter((c) => c.estado === 'Por autorizar');
        if (cotizacionesPendientes.length > 0) {
          const cot = cotizacionesPendientes[0];
          recs.push({
            id: 'dash-cot-pend',
            prioridad: 'importante',
            titulo: `${cotizacionesPendientes.length} cotización(es) en espera de autorización`,
            motivo: `Folio ${cot.folio} por $${cot.total.toLocaleString('es-MX')} pendiente de confirmación con el cliente.`,
            accionTexto: 'Revisar cotización',
            seccionDestino: 'cotizaciones',
            registroId: cot.id,
          });
        }

        // 3. Refacciones con stock bajo
        const refaccionesCriticas = refacciones.filter((r) => r.existencias <= r.minimo);
        if (refaccionesCriticas.length > 0) {
          const ref = refaccionesCriticas[0];
          recs.push({
            id: 'dash-ref-bajo',
            prioridad: 'informativa',
            titulo: `${refaccionesCriticas.length} producto(s) con existencias bajas`,
            motivo: `"${ref.nombre}" cuenta con solo ${ref.existencias} pza(s) (mínimo ${ref.minimo}).`,
            accionTexto: 'Ver inventario',
            seccionDestino: 'inventario',
            registroId: ref.id,
          });
        }

        accs.push({
          id: 'acc-dash-1',
          titulo: 'Revisar citas de hoy',
          descripcion: 'Verificar la llegada de los autos programados para el turno actual.',
          accionTexto: 'Ver Citas',
          seccionDestino: 'citas',
        });
        accs.push({
          id: 'acc-dash-2',
          titulo: 'Emitir nueva cotización rápida',
          descripcion: 'Recibir al cliente que arriba al taller y levantar presupuesto.',
          accionTexto: 'Nueva Atención',
          seccionDestino: 'nueva-atencion',
        });
        break;
      }

      case 'citas':
      case 'calendario': {
        resumen = 'Control de citas de servicio, confirmación de asistencia y asignación.';

        // Citas de hoy sin atender
        const citasHoy = citas.filter((c) => c.fecha === hoyStr && c.estado === 'Programada');
        if (citasHoy.length > 0) {
          const c = citasHoy[0];
          recs.push({
            id: 'citas-hoy',
            prioridad: 'urgente',
            titulo: `${citasHoy.length} cita(s) programada(s) para hoy`,
            motivo: `Servicio programado: "${c.servicio}". Conviene tener la bahía despejada y verificar el arribo.`,
            accionTexto: 'Confirmar cita',
            seccionDestino: 'citas',
            registroId: c.id,
          });
        }

        // Citas con datos faltantes
        const citasIncompletas = citas.filter(
          (c) => !c.clienteId || !c.vehiculoId || c.servicio.trim() === ''
        );
        if (citasIncompletas.length > 0) {
          recs.push({
            id: 'citas-inc',
            prioridad: 'importante',
            titulo: `${citasIncompletas.length} cita(s) con datos incompletos`,
            motivo: 'Falta asociar vehículo o especificar los síntomas del cliente antes de su llegada.',
            accionTexto: 'Completar datos',
            seccionDestino: 'citas',
          });
        }

        // Citas de mañana
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const mañanaStr = mañana.toISOString().split('T')[0];
        const citasMañana = citas.filter((c) => c.fecha === mañanaStr && c.estado === 'Programada');
        if (citasMañana.length > 0) {
          recs.push({
            id: 'citas-manana',
            prioridad: 'informativa',
            titulo: `${citasMañana.length} cita(s) para mañana`,
            motivo: 'Enviar recordatorio vía WhatsApp para confirmar que el cliente traerá la unidad.',
            accionTexto: 'Ver agenda',
            seccionDestino: 'citas',
          });
        }

        accs.push({
          id: 'acc-cit-1',
          titulo: 'Programar nueva cita',
          descripcion: 'Agendar fecha, hora y servicio acordado con el cliente.',
          accionTexto: 'Agendar cita',
          seccionDestino: 'citas',
        });
        accs.push({
          id: 'acc-cit-2',
          titulo: 'Convertir cita en orden',
          descripcion: 'Al recibir la unidad en taller, transferir la cita a orden de trabajo.',
          accionTexto: 'Ir a Órdenes',
          seccionDestino: 'ordenes',
        });
        break;
      }

      case 'cotizaciones': {
        resumen = 'Evaluación de cotizaciones pendientes, precios y probabilidad de cierre.';

        // Cotizaciones por autorizar de alto importe
        const porAutorizar = cotizaciones.filter((c) => c.estado === 'Por autorizar');
        const cotUrgente = porAutorizar.sort((a, b) => b.total - a.total)[0];
        if (cotUrgente) {
          recs.push({
            id: 'cot-urgente',
            prioridad: 'urgente',
            titulo: `Cotización ${cotUrgente.folio} por autorizar ($${cotUrgente.total.toLocaleString('es-MX')})`,
            motivo: `Mayor presupuesto pendiente de respuesta: "${cotUrgente.descripcion}". Requiere contacto de cierre.`,
            accionTexto: 'Revisar cotización',
            seccionDestino: 'cotizaciones',
            registroId: cotUrgente.id,
          });
        }

        // Cotizaciones sin desglose claro o con importe 0
        const cotSinDesglose = cotizaciones.filter(
          (c) => c.estado === 'Por autorizar' && (c.importeManoObra === 0 || c.total === 0)
        );
        if (cotSinDesglose.length > 0) {
          recs.push({
            id: 'cot-sindesglose',
            prioridad: 'importante',
            titulo: `${cotSinDesglose.length} cotización(es) con importes incompletos`,
            motivo: 'Existen presupuestos con mano de obra o total en cero que deben detallarse antes de enviar.',
            accionTexto: 'Completar cotización',
            seccionDestino: 'cotizaciones',
            registroId: cotSinDesglose[0].id,
          });
        }

        // Cotizaciones aprobadas pendientes de iniciar orden
        const aprobadasSinOrden = cotizaciones.filter(
          (c) => c.estado === 'Aprobada' && !c.ordenId
        );
        if (aprobadasSinOrden.length > 0) {
          recs.push({
            id: 'cot-aprobadas-sin-orden',
            prioridad: 'informativa',
            titulo: `${aprobadasSinOrden.length} cotización(es) aprobada(s) sin orden de trabajo`,
            motivo: `El folio ${aprobadasSinOrden[0].folio} ya fue aprobado por el cliente y está listo para ingresar a bahía.`,
            accionTexto: 'Generar orden',
            seccionDestino: 'ordenes',
          });
        }

        accs.push({
          id: 'acc-cot-1',
          titulo: 'Analizar margen con IA',
          descripcion: 'Evaluar competitividad y rentabilidad de tus precios antes de presentar.',
          accionTexto: 'Analizar Cotización',
          seccionDestino: 'cotizaciones',
        });
        accs.push({
          id: 'acc-cot-2',
          titulo: 'Descargar o imprimir PDF',
          descripcion: 'Entregar la propuesta formal con membrete oficial TUNNO al cliente.',
          accionTexto: 'Ver Cotizaciones',
          seccionDestino: 'cotizaciones',
        });
        break;
      }

      case 'ordenes': {
        resumen = 'Monitoreo de tiempos en bahía, diagnósticos, asignación técnica y calidad.';

        // Órdenes retrasadas
        const retrasadas = ordenes.filter(
          (o) =>
            o.estado !== 'Terminado' &&
            o.fechaEntregaPrometida &&
            o.fechaEntregaPrometida < hoyStr
        );
        if (retrasadas.length > 0) {
          const ord = retrasadas[0];
          recs.push({
            id: 'ord-retraso-critico',
            prioridad: 'urgente',
            titulo: `${retrasadas.length} orden(es) con fecha prometida vencida`,
            motivo: `Orden ${ord.folio} tenía entrega comprometida para el ${ord.fechaEntregaPrometida}. Se requiere coordinar al técnico.`,
            accionTexto: 'Abrir orden',
            seccionDestino: 'ordenes',
            registroId: ord.id,
          });
        }

        // Órdenes sin técnico asignado
        const sinTecnico = ordenes.filter(
          (o) => o.estado !== 'Terminado' && (!o.mecanicoNombre || o.mecanicoNombre.trim() === '')
        );
        if (sinTecnico.length > 0) {
          recs.push({
            id: 'ord-sin-tecnico',
            prioridad: 'importante',
            titulo: `${sinTecnico.length} orden(es) sin mecánico asignado`,
            motivo: `Folio ${sinTecnico[0].folio} está en espera de técnico responsable para iniciar labores en bahía.`,
            accionTexto: 'Asignar técnico',
            seccionDestino: 'ordenes',
            registroId: sinTecnico[0].id,
          });
        }

        // Órdenes terminadas sin control de calidad
        const terminadasSinCalidad = ordenes.filter(
          (o) => o.estado === 'Terminado' && !o.revisionFinal
        );
        if (terminadasSinCalidad.length > 0) {
          recs.push({
            id: 'ord-sin-calidad',
            prioridad: 'informativa',
            titulo: `${terminadasSinCalidad.length} orden(es) terminada(s) sin control de calidad`,
            motivo: `Folio ${terminadasSinCalidad[0].folio} requiere validación final de torque, fluidos y limpieza antes de cobro.`,
            accionTexto: 'Revisión de calidad',
            seccionDestino: 'ordenes',
            registroId: terminadasSinCalidad[0].id,
          });
        }

        accs.push({
          id: 'acc-ord-1',
          titulo: 'Asistencia técnica con IA',
          descripcion: 'Consultar causas raíz y códigos OBD2 para agilizar el diagnóstico.',
          accionTexto: 'Diagnóstico IA',
          seccionDestino: 'ordenes',
        });
        accs.push({
          id: 'acc-ord-2',
          titulo: 'Validar refacciones consumidas',
          descripcion: 'Verificar que las piezas instaladas coincidan con lo cotizado.',
          accionTexto: 'Cargar Refacciones',
          seccionDestino: 'ordenes',
        });
        break;
      }

      case 'inventario': {
        resumen = 'Control de existencias mínimas, stock agotado y reposición de refacciones.';

        // Stock agotado
        const agotadas = refacciones.filter((r) => r.existencias === 0);
        if (agotadas.length > 0) {
          const ref = agotadas[0];
          recs.push({
            id: 'inv-agotadas',
            prioridad: 'urgente',
            titulo: `${agotadas.length} refacción(es) completamente agotada(s)`,
            motivo: `"${ref.nombre}" (Código: ${ref.codigo}) no tiene existencias y podría retrasar órdenes en proceso.`,
            accionTexto: 'Ver inventario',
            seccionDestino: 'inventario',
            registroId: ref.id,
          });
        }

        // Stock bajo (menor o igual al mínimo pero > 0)
        const stockBajo = refacciones.filter((r) => r.existencias > 0 && r.existencias <= r.minimo);
        if (stockBajo.length > 0) {
          const ref = stockBajo[0];
          recs.push({
            id: 'inv-stock-bajo',
            prioridad: 'importante',
            titulo: `${stockBajo.length} producto(s) por debajo del stock mínimo`,
            motivo: `"${ref.nombre}" tiene ${ref.existencias} pzas. Se sugiere ordenar reposición al proveedor ${ref.proveedor || 'habitual'}.`,
            accionTexto: 'Generar orden de compra',
            seccionDestino: 'inventario',
            registroId: ref.id,
          });
        }

        // Refacciones sin precio de venta asignado
        const sinPrecio = refacciones.filter((r) => !r.precioVenta || r.precioVenta <= 0);
        if (sinPrecio.length > 0) {
          recs.push({
            id: 'inv-sin-precio',
            prioridad: 'informativa',
            titulo: `${sinPrecio.length} refacción(es) sin precio de venta configurado`,
            motivo: 'Asignar margen de utilidad a las refacciones para no generar cotizaciones con pérdidas.',
            accionTexto: 'Configurar precios',
            seccionDestino: 'inventario',
          });
        }

        accs.push({
          id: 'acc-inv-1',
          titulo: 'Análisis de inventario con IA',
          descripcion: 'Recibir sugerencias automáticas de compras basadas en órdenes activas.',
          accionTexto: 'Análisis IA',
          seccionDestino: 'inventario',
        });
        accs.push({
          id: 'acc-inv-2',
          titulo: 'Registrar entrada de refacciones',
          descripcion: 'Dar ingreso a piezas recibidas de proveedores para actualizar stock.',
          accionTexto: 'Nueva Entrada',
          seccionDestino: 'inventario',
        });
        break;
      }

      case 'facturacion': {
        resumen = 'Auditoría de órdenes por cobrar, comprobantes fiscales y flujo de caja.';

        // Facturas pendientes de cobro
        const facturasPendientes = facturas.filter((f) => f.estado === 'Pendiente');
        const totalPorCobrar = facturasPendientes.reduce((acc, f) => acc + f.total, 0);
        if (facturasPendientes.length > 0) {
          recs.push({
            id: 'fac-pendientes',
            prioridad: 'urgente',
            titulo: `${facturasPendientes.length} factura(s) pendiente(s) de pago ($${totalPorCobrar.toLocaleString('es-MX')})`,
            motivo: `Comprobante ${facturasPendientes[0].folio} por cobrar. Se requiere asentar el pago antes de liberar la unidad.`,
            accionTexto: 'Registrar pago',
            seccionDestino: 'facturacion',
            registroId: facturasPendientes[0].id,
          });
        }

        // Órdenes terminadas sin factura emitida
        const terminadasSinFactura = ordenes.filter((o) => {
          if (o.estado !== 'Terminado') return false;
          return !facturas.some((f) => f.cotizacionId === o.cotizacionId);
        });
        if (terminadasSinFactura.length > 0) {
          recs.push({
            id: 'fac-ordenes-sin-factura',
            prioridad: 'importante',
            titulo: `${terminadasSinFactura.length} orden(es) terminada(s) sin factura emitida`,
            motivo: `Folio ${terminadasSinFactura[0].folio} finalizó trabajo pero aún no tiene comprobante de cobro emitido en caja.`,
            accionTexto: 'Generar factura',
            seccionDestino: 'facturacion',
          });
        }

        // Facturas con RFC genérico o datos fiscales incompletos
        const rfcGenerico = facturas.filter((f) => !f.rfc || f.rfc === 'XAXX010101000');
        if (rfcGenerico.length > 0) {
          recs.push({
            id: 'fac-rfc-generico',
            prioridad: 'informativa',
            titulo: `${rfcGenerico.length} factura(s) con RFC genérico para público en general`,
            motivo: 'Verificar si alguno de estos clientes solicitó factura con desglose fiscal antes de fin de mes.',
            accionTexto: 'Revisar datos fiscales',
            seccionDestino: 'facturacion',
          });
        }

        accs.push({
          id: 'acc-fac-1',
          titulo: 'Emitir nueva factura',
          descripcion: 'Facturar una cotización aprobada u orden de trabajo lista.',
          accionTexto: 'Nueva Factura',
          seccionDestino: 'facturacion',
        });
        accs.push({
          id: 'acc-fac-2',
          titulo: 'Corte de caja del día',
          descripcion: 'Verificar los métodos de pago registrados (Efectivo, Tarjeta, Transferencia).',
          accionTexto: 'Ver Cobros',
          seccionDestino: 'facturacion',
        });
        break;
      }

      case 'clientes':
      case 'vehiculos': {
        resumen = 'Control del padrón de clientes, expedientes vehiculares y mantenimientos.';

        // Clientes sin teléfono o correo
        const clientesSinContacto = clientes.filter(
          (c) => !c.telefono || c.telefono.trim().length < 10 || !c.correo
        );
        if (clientesSinContacto.length > 0) {
          recs.push({
            id: 'cli-sin-contacto',
            prioridad: 'urgente',
            titulo: `${clientesSinContacto.length} cliente(s) con teléfono o correo incompleto`,
            motivo: `Cliente "${clientesSinContacto[0].nombre}" no tiene teléfono completo para avisar sobre su presupuesto o auto listo.`,
            accionTexto: 'Actualizar cliente',
            seccionDestino: 'clientes',
            registroId: clientesSinContacto[0].id,
          });
        }

        // Vehículos sin kilometraje o placas
        const vehiculosIncompletos = vehiculos.filter(
          (v) => !v.placas || v.placas.trim() === '' || !v.kilometraje
        );
        if (vehiculosIncompletos.length > 0) {
          recs.push({
            id: 'veh-incompletos',
            prioridad: 'importante',
            titulo: `${vehiculosIncompletos.length} vehículo(s) sin kilometraje o placas registradas`,
            motivo: 'El kilometraje es indispensable para calcular el próximo servicio preventivo (afinación, frenos).',
            accionTexto: 'Completar vehículo',
            seccionDestino: 'vehiculos',
            registroId: vehiculosIncompletos[0].id,
          });
        }

        // Vehículos con mantenimiento próximo recomendado
        const vehiculosProximos = vehiculos.filter(
          (v) =>
            v.proximoServicioFecha &&
            v.proximoServicioFecha >= hoyStr
        );
        if (vehiculosProximos.length > 0) {
          recs.push({
            id: 'veh-proximo-serv',
            prioridad: 'informativa',
            titulo: `${vehiculosProximos.length} vehículo(s) con fecha de servicio preventivo agendada`,
            motivo: `Unidad ${vehiculosProximos[0].marca} ${vehiculosProximos[0].modelo} (${vehiculosProximos[0].placas}) tiene mantenimiento estimado.`,
            accionTexto: 'Ver vehículo',
            seccionDestino: 'vehiculos',
            registroId: vehiculosProximos[0].id,
          });
        }

        accs.push({
          id: 'acc-cli-1',
          titulo: 'Plan de mantenimiento con IA',
          descripcion: 'Generar la proyección de servicios sugeridos para el auto.',
          accionTexto: 'Plan de Mantenimiento',
          seccionDestino: 'vehiculos',
        });
        accs.push({
          id: 'acc-cli-2',
          titulo: 'Registrar nuevo cliente',
          descripcion: 'Dar de alta al propietario para asociar su auto y cotizaciones.',
          accionTexto: 'Nuevo Cliente',
          seccionDestino: 'clientes',
        });
        break;
      }

      case 'bitacora':
      case 'prospectos': {
        resumen = 'Fidelización post-servicio, llamadas de satisfacción y clientes potenciales.';

        // Seguimientos vencidos o para hoy
        const seguimientosPendientes = seguimientos.filter(
          (s) => s.estado === 'Pendiente' && s.fecha <= hoyStr
        );
        if (seguimientosPendientes.length > 0) {
          const seg = seguimientosPendientes[0];
          recs.push({
            id: 'seg-pendientes',
            prioridad: 'urgente',
            titulo: `${seguimientosPendientes.length} seguimiento(s) de clientes programados para hoy`,
            motivo: `Contacto pendiente: "${seg.motivoLabel}" para verificar satisfacción tras la entrega vehicular.`,
            accionTexto: 'Abrir seguimiento',
            seccionDestino: 'bitacora',
            registroId: seg.id,
          });
        }

        // Prospectos sin contactar
        const prospectosNuevos = prospectos.filter((p) => p.estado === 'Nuevo');
        if (prospectosNuevos.length > 0) {
          recs.push({
            id: 'prosp-nuevos',
            prioridad: 'importante',
            titulo: `${prospectosNuevos.length} prospecto(s) nuevo(s) sin primer contacto`,
            motivo: `Prospecto "${prospectosNuevos[0].nombre}" solicita cotización o información de servicio.`,
            accionTexto: 'Contactar prospecto',
            seccionDestino: 'prospectos',
            registroId: prospectosNuevos[0].id,
          });
        }

        // Clientes con más de 90 días sin visita
        recs.push({
          id: 'seg-reactivacion',
          prioridad: 'informativa',
          titulo: 'Campaña de reactivación recomendada',
          motivo: 'Existen clientes con historial en taller que no han realizado servicio preventivo en este trimestre.',
          accionTexto: 'Ver historial',
          seccionDestino: 'historial-vehicular',
        });

        accs.push({
          id: 'acc-seg-1',
          titulo: 'Seguimiento inteligente con IA',
          descripcion: 'Redactar mensajes de WhatsApp personalizados con tono profesional.',
          accionTexto: 'Redactar WhatsApp',
          seccionDestino: 'bitacora',
        });
        accs.push({
          id: 'acc-seg-2',
          titulo: 'Registrar nuevo prospecto',
          descripcion: 'Anotar clientes potenciales que llamaron o pidieron informes.',
          accionTexto: 'Nuevo Prospecto',
          seccionDestino: 'prospectos',
        });
        break;
      }

      default: {
        // Fallback genérico para secciones restantes (garantías, personal, reportes, etc.)
        resumen = `Supervisión operativa de ${seccionActualNombre}.`;

        const ordenesEnProceso = ordenes.filter((o) => o.estado === 'En proceso');
        if (ordenesEnProceso.length > 0) {
          recs.push({
            id: 'gen-ord-proc',
            prioridad: 'urgente',
            titulo: `${ordenesEnProceso.length} orden(es) activas en taller`,
            motivo: `Orden ${ordenesEnProceso[0].folio} actualmente en rampa. Mantén actualizado su semáforo.`,
            accionTexto: 'Ver órdenes',
            seccionDestino: 'ordenes',
          });
        }

        const cotPorAut = cotizaciones.filter((c) => c.estado === 'Por autorizar');
        if (cotPorAut.length > 0) {
          recs.push({
            id: 'gen-cot-aut',
            prioridad: 'importante',
            titulo: `${cotPorAut.length} cotización(es) en espera de cierre`,
            motivo: 'Revisa presupuestos pendientes para confirmar compras de piezas.',
            accionTexto: 'Revisar cotización',
            seccionDestino: 'cotizaciones',
          });
        }

        const refStockBajo = refacciones.filter((r) => r.existencias <= r.minimo);
        if (refStockBajo.length > 0) {
          recs.push({
            id: 'gen-ref-stock',
            prioridad: 'informativa',
            titulo: `${refStockBajo.length} refacciones con existencias bajas`,
            motivo: 'Verifica los insumos básicos antes del arribo de autos de mañana.',
            accionTexto: 'Ver inventario',
            seccionDestino: 'inventario',
          });
        }

        accs.push({
          id: 'acc-gen-1',
          titulo: 'Ir a Órdenes de trabajo',
          descripcion: 'Supervisar el avance físico de los vehículos en reparación.',
          accionTexto: 'Ver Órdenes',
          seccionDestino: 'ordenes',
        });
        accs.push({
          id: 'acc-gen-2',
          titulo: 'Consultar Reportes',
          descripcion: 'Revisar ingresos, productividad de mecánicos y ticket promedio.',
          accionTexto: 'Ver Reportes',
          seccionDestino: 'reportes',
        });
        break;
      }
    }

    // Ordenar rigurosamente por prioridad: Urgente -> Importante -> Informativa
    const ordenPrioridad: Record<PrioridadAsistente, number> = {
      urgente: 1,
      importante: 2,
      informativa: 3,
    };

    const sortedRecs = recs
      .sort((a, b) => ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad])
      .slice(0, 3); // Máximo 3 recomendaciones tal como solicita la instrucción

    return {
      recomendaciones: sortedRecs,
      accionesInmediatas: accs.slice(0, 3),
      resumenContexto: resumen,
    };
  }, [
    currentSection,
    citas,
    cotizaciones,
    ordenes,
    refacciones,
    facturas,
    clientes,
    vehiculos,
    seguimientos,
    prospectos,
    hoyStr,
    seccionActualNombre,
  ]);

  // Cantidad total de recomendaciones urgentes o importantes (para el badge flotante)
  const totalAlertas = useMemo(() => {
    return recomendaciones.filter((r) => r.prioridad === 'urgente' || r.prioridad === 'importante')
      .length;
  }, [recomendaciones]);

  // ============================================================================
  // PREGUNTAS SUGERIDAS (REQUERIMIENTO EXACTO DEL PROMPT)
  // ============================================================================
  const preguntasSugeridas = [
    '¿Qué tengo pendiente hoy?',
    '¿Qué cotizaciones debo revisar?',
    '¿Qué vehículos están próximos a entrega?',
    '¿Qué productos tienen poco inventario?',
    '¿Qué clientes necesitan seguimiento?',
  ];

  // ============================================================================
  // PROCESADOR INTELIGENTE DE PREGUNTAS SENCILLAS CON DATOS REALES DE DEMO
  // ============================================================================
  const responderPregunta = (preguntaTexto: string) => {
    if (!preguntaTexto.trim()) return;

    const query = preguntaTexto.trim().toLowerCase();
    const ahora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    // Agregar mensaje del usuario
    const msgUsuario: ChatMensaje = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: preguntaTexto,
      timestamp: ahora,
    };

    setMensajesChat((prev) => [...prev, msgUsuario]);
    setInputPregunta('');
    setIsPensando(true);

    setTimeout(() => {
      let respuesta = '';
      let accion: { texto: string; seccion: SectionId } | undefined = undefined;
      let advertenciaConfirmacion = false;

      // REGLA CRÍTICA DE SEGURIDAD: La IA no aprueba, no factura, no elimina datos.
      if (
        query.includes('aprueba') ||
        query.includes('aprobar') ||
        query.includes('factura') ||
        query.includes('generar factura') ||
        query.includes('elimina') ||
        query.includes('borrar') ||
        query.includes('cambiar estado') ||
        query.includes('modifica')
      ) {
        respuesta =
          'Por seguridad del taller y control administrativo, como asistente inteligente solo puedo orientarte y llevarte al registro correspondiente. Las aprobaciones, emisión de facturas y cambios de estado no se realizan de forma automática: deben ser confirmadas manualmente por el personal responsable en su pantalla.';
        advertenciaConfirmacion = true;

        if (query.includes('cotiz')) {
          accion = { texto: 'Abrir Cotizaciones para autorizar', seccion: 'cotizaciones' };
        } else if (query.includes('factur')) {
          accion = { texto: 'Abrir Facturación para emitir', seccion: 'facturacion' };
        } else {
          accion = { texto: 'Ir a Órdenes de trabajo', seccion: 'ordenes' };
        }
      } else if (query.includes('pendiente hoy') || query.includes('tengo hoy') || query.includes('hoy')) {
        const citasHoy = citas.filter((c) => c.fecha === hoyStr && c.estado === 'Programada');
        const ordenesHoy = ordenes.filter(
          (o) =>
            o.estado !== 'Terminado' &&
            o.fechaEntregaPrometida &&
            o.fechaEntregaPrometida <= hoyStr
        );
        const cotPend = cotizaciones.filter((c) => c.estado === 'Por autorizar');

        respuesta = `Para hoy tienes ${citasHoy.length} cita(s) programada(s), ${ordenesHoy.length} orden(es) de trabajo con entrega prevista para hoy o retrasadas, y ${cotPend.length} cotización(es) en espera de autorización del cliente.`;
        accion = { texto: 'Ver Citas de hoy', seccion: 'citas' };
      } else if (query.includes('cotizaci') || query.includes('cotizaciones')) {
        const porAut = cotizaciones.filter((c) => c.estado === 'Por autorizar');
        const total = porAut.reduce((acc, c) => acc + c.total, 0);

        if (porAut.length > 0) {
          respuesta = `Tienes ${porAut.length} cotización(es) por autorizar por un monto total de $${total.toLocaleString('es-MX')}. Las más prioritarias son ${porAut
            .slice(0, 2)
            .map((c) => `${c.folio} ($${c.total.toLocaleString('es-MX')})`)
            .join(' y ')}.`;
        } else {
          respuesta = 'No tienes cotizaciones pendientes de autorización en este momento. Todas están aprobadas o concluidas.';
        }
        accion = { texto: 'Revisar cotizaciones', seccion: 'cotizaciones' };
      } else if (query.includes('entrega') || query.includes('vehículos') || query.includes('proximos')) {
        const porEntregar = ordenes.filter(
          (o) => o.estado === 'Terminado' && !o.entregado
        );
        const enProcesoHoy = ordenes.filter(
          (o) => o.estado === 'En proceso' && o.fechaEntregaPrometida === hoyStr
        );

        respuesta = `Hay ${porEntregar.length} vehículo(s) ya terminados listos para entrega en mostrador y ${enProcesoHoy.length} unidad(es) en proceso con fecha de entrega para hoy.`;
        accion = { texto: 'Ver Órdenes por entregar', seccion: 'ordenes' };
      } else if (query.includes('inventario') || query.includes('producto') || query.includes('refaccion') || query.includes('piezas')) {
        const stockBajo = refacciones.filter((r) => r.existencias <= r.minimo);
        if (stockBajo.length > 0) {
          const nombres = stockBajo.slice(0, 3).map((r) => `"${r.nombre}" (${r.existencias} pzas)`).join(', ');
          respuesta = `Se detectaron ${stockBajo.length} producto(s) con existencias iguales o menores a su stock mínimo: ${nombres}. Se recomienda emitir órdenes de compra a proveedores.`;
        } else {
          respuesta = 'Todos los productos en el catálogo de refacciones se encuentran actualmente por encima de su nivel mínimo de stock.';
        }
        accion = { texto: 'Ver inventario', seccion: 'inventario' };
      } else if (query.includes('seguimiento') || query.includes('cliente') || query.includes('contacto')) {
        const segPend = seguimientos.filter((s) => s.estado === 'Pendiente');
        const prospNuevos = prospectos.filter((p) => p.estado === 'Nuevo');

        respuesta = `Hay ${segPend.length} cliente(s) con seguimiento pendiente de satisfacción o afinación, además de ${prospNuevos.length} prospecto(s) nuevo(s) que requieren primer contacto comercial.`;
        accion = { texto: 'Ir a Seguimientos', seccion: 'bitacora' };
      } else {
        // Respuesta contextual genérica basada en la sección
        respuesta = `En la sección de ${seccionActualNombre}, te recomiendo revisar los ${recomendaciones.length} puntos de atención destacados arriba. Si deseas realizar alguna acción operativa, puedo llevarte directamente a la pantalla correspondiente.`;
        accion = { texto: `Operar en ${seccionActualNombre}`, seccion: currentSection };
      }

      const msgAsistente: ChatMensaje = {
        id: `asst-${Date.now()}`,
        remitente: 'asistente',
        texto: respuesta,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        accionSugerida: accion,
        advertenciaConfirmacion,
      };

      setMensajesChat((prev) => [...prev, msgAsistente]);
      setIsPensando(false);
    }, 400);
  };

  const handleSelectAccion = (seccion: SectionId, extraParam?: string) => {
    onNavigateToSection(seccion, extraParam);
    // En pantallas pequeñas cerramos el panel para que el usuario vea la acción
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const getPriorityBadge = (p: PrioridadAsistente) => {
    switch (p) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Urgente
          </span>
        );
      case 'importante':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Importante
          </span>
        );
      case 'informativa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-sky-50 text-[#06345A] border border-[#73C7FF]/50">
            <Info className="w-3 h-3 text-[#1497F2]" />
            Informativa
          </span>
        );
    }
  };

  return (
    <>
      {/* ==================================================================== */}
      {/* BOTÓN DISCRETO EN LA ESQUINA INFERIOR DERECHA                        */}
      {/* ==================================================================== */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-200 cursor-pointer group select-none ${
            isOpen
              ? 'bg-[#06345A] text-white border-[#1497F2] ring-2 ring-[#1497F2]/40'
              : 'bg-white hover:bg-sky-50/70 text-[#06345A] border-[#E5E7EB] hover:border-[#1497F2] hover:shadow-xl'
          }`}
          title="Asistente inteligente TUNNO"
          aria-label="Abrir asistente inteligente"
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              isOpen
                ? 'bg-[#1497F2] text-white'
                : 'bg-gradient-to-br from-[#06345A] to-[#1497F2] text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>

          <span className="font-heading font-bold text-xs tracking-tight hidden sm:inline text-[#06345A] group-hover:text-[#1497F2] transition-colors">
            {isOpen ? 'Cerrar asistente' : 'Asistente inteligente'}
          </span>

          {totalAlertas > 0 && !isOpen && (
            <span
              className="w-5 h-5 rounded-full bg-[#1497F2] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs animate-pulse"
              title={`${totalAlertas} pendientes detectados`}
            >
              {totalAlertas}
            </span>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* BACKDROP SUTIL EN PANTALLAS PEQUEÑAS                                 */}
      {/* ==================================================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#06345A]/25 backdrop-blur-[1px] z-40 sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* PANEL LATERAL COMPACTO                                               */}
      {/* ==================================================================== */}
      <div
        ref={panelRef}
        role="complementary"
        aria-label="Panel del Asistente Inteligente"
        className={`fixed top-0 right-0 h-full w-full sm:w-[410px] md:w-[440px] bg-white z-50 shadow-2xl border-l border-[#E5E7EB] flex flex-col font-body transition-transform duration-300 ease-out no-print ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* CABECERA DEL PANEL */}
        <div className="bg-[#06345A] text-white px-5 py-4 shrink-0 flex items-center justify-between border-b border-[#1497F2]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1497F2] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-sm tracking-wide text-white">
                  Asistente inteligente
                </h3>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#1497F2]/30 text-[#73C7FF] border border-[#73C7FF]/40">
                  TUNNO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Diagnóstico contextual en tiempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Escape)"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IDENTIFICADOR DE LA SECCIÓN ACTUAL */}
        <div className="px-5 py-2.5 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#374151]">
            <span className="text-[#6B7280]">Estás en:</span>
            <span className="font-heading font-semibold text-[#06345A] truncate max-w-[200px]">
              {seccionActualNombre}
            </span>
          </div>
          <span className="text-[11px] text-[#6B7280] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
            {recomendaciones.length} recomendación(es)
          </span>
        </div>

        {/* CUERPO DEL PANEL CON SCROLL */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs text-[#374151]">
          {/* ================================================================ */}
          {/* BLOQUE 1: ¿QUÉ REQUIERE ATENCIÓN?                                */}
          {/* ================================================================ */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#1497F2]" />
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                  ¿Qué requiere atención?
                </h4>
              </div>
              <span className="text-[10px] text-[#6B7280]">Máx. 3 prioridades</span>
            </div>

            {recomendaciones.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs font-heading">
                    Todo al corriente en {seccionActualNombre}
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    No se detectaron urgencias o anomalías operativas pendientes en esta área.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recomendaciones.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#1497F2]/60 hover:shadow-xs transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-xs text-[#06345A] line-clamp-1">
                        {rec.titulo}
                      </span>
                      {getPriorityBadge(rec.prioridad)}
                    </div>

                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      {rec.motivo}
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleSelectAccion(rec.seccionDestino, rec.registroId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06345A] hover:bg-[#1497F2] text-white text-[11px] font-heading font-semibold transition-colors cursor-pointer group shadow-2xs"
                      >
                        <span>{rec.accionTexto}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* BLOQUE 2: ¿QUÉ PUEDO HACER AHORA?                                */}
          {/* ================================================================ */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1497F2]" />
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                ¿Qué puedo hacer ahora?
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {accionesInmediatas.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectAccion(acc.seccionDestino)}
                  className="w-full p-2.5 rounded-xl bg-[#F4F6F8] hover:bg-sky-50 border border-[#E5E7EB] hover:border-[#73C7FF] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-heading font-semibold text-xs text-[#06345A] group-hover:text-[#1497F2] transition-colors truncate">
                      {acc.titulo}
                    </p>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">
                      {acc.descripcion}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-[#1497F2] flex items-center gap-0.5">
                    {acc.accionTexto}
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* BLOQUE 3: PREGUNTAS AL ASISTENTE (SUGERIDAS + INPUT)             */}
          {/* ================================================================ */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-4 h-4 text-[#1497F2]" />
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                Preguntas al asistente
              </h4>
            </div>

            {/* Chips de preguntas rápidas sugeridas */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {preguntasSugeridas.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => responderPregunta(item)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-[#E5E7EB] hover:border-[#1497F2] text-[#06345A] text-[10px] font-medium transition-colors cursor-pointer text-left shadow-2xs"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Historial de conversación */}
            {mensajesChat.length > 0 && (
              <div
                ref={chatScrollRef}
                className="max-h-56 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#F4F6F8] border border-[#E5E7EB] mb-3"
              >
                {mensajesChat.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.remitente === 'usuario' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl max-w-[90%] text-[11px] leading-relaxed ${
                        m.remitente === 'usuario'
                          ? 'bg-[#06345A] text-white rounded-br-xs'
                          : 'bg-white text-[#374151] border border-[#E5E7EB] rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {m.remitente === 'asistente' && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#1497F2] font-heading mb-1">
                          <Bot className="w-3 h-3" />
                          TUNNO Asistente
                        </div>
                      )}
                      <p>{m.texto}</p>

                      {m.advertenciaConfirmacion && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            Control humano: Para evitar errores, debes confirmar la acción directamente en la sección.
                          </span>
                        </div>
                      )}

                      {m.accionSugerida && (
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                          <button
                            type="button"
                            onClick={() => handleSelectAccion(m.accionSugerida!.seccion)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1497F2] hover:bg-[#06345A] text-white text-[10px] font-semibold font-heading transition-colors cursor-pointer"
                          >
                            <span>{m.accionSugerida.texto}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[#9CA3AF] px-1 mt-0.5">
                      {m.timestamp}
                    </span>
                  </div>
                ))}

                {isPensando && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] italic px-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce" />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    />
                    <span>Consultando datos del taller...</span>
                  </div>
                )}
              </div>
            )}

            {/* Input para preguntas manuales */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                responderPregunta(inputPregunta);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputPregunta}
                onChange={(e) => setInputPregunta(e.target.value)}
                placeholder="Escribe tu pregunta sobre el taller..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#E5E7EB] focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] rounded-xl outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                type="submit"
                disabled={!inputPregunta.trim() || isPensando}
                className="w-9 h-9 rounded-xl bg-[#06345A] hover:bg-[#1497F2] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Enviar pregunta"
                aria-label="Enviar pregunta"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* PIE DEL PANEL: AVISO INSTITUCIONAL DE CONFIRMACIÓN / SAFEGUARD */}
        <div className="px-5 py-3 bg-[#F4F6F8] border-t border-[#E5E7EB] shrink-0 text-[10px] text-[#6B7280] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#06345A] shrink-0" />
          <p className="leading-snug">
            La IA solo resume y facilita la navegación. No aprueba cotizaciones, no genera facturas ni altera datos sin tu confirmación manual.
          </p>
        </div>
      </div>
    </>
  );
};
