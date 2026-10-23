import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  OrdenTrabajo,
  Cotizacion,
  Cliente,
  Vehiculo,
  Refaccion,
  ServicioCatalogo,
  Factura,
  ConfiguracionTaller,
  SectionId,
} from '../types';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  Clock,
  Receipt,
  UserCheck,
  Car,
  Package,
  Layers,
  MessageSquare,
  ClipboardCheck,
  DollarSign,
  Send,
} from 'lucide-react';

export type EstadoRevisionServicio =
  | 'listo_para_entregar'
  | 'requiere_revision'
  | 'pendientes_importantes';

export type CategoriaHallazgo = 'faltante' | 'inconsistencia' | 'pendiente';

export interface HallazgoRevisionServicio {
  id: string;
  categoria: CategoriaHallazgo;
  titulo: string;
  descripcion: string;
  gravedad: 'alta' | 'media' | 'baja';
  accionTexto: string;
  accionDestino: {
    tipo: 'campo' | 'seccion' | 'modal';
    destino:
      | 'diagnostico'
      | 'mecanico'
      | 'refacciones'
      | 'control_calidad'
      | 'facturacion'
      | 'cotizaciones'
      | 'kilometraje'
      | 'fecha_prometida'
      | 'cliente'
      | 'observaciones';
  };
}

export interface DimensionAuditada {
  id: string;
  etiqueta: string;
  estado: 'correcto' | 'atencion' | 'incompleto';
  detalle: string;
}

interface RevisionInteligenteServicioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenTrabajo | null;
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  refacciones: Refaccion[];
  servicios: ServicioCatalogo[];
  facturas: Factura[];
  configuracion?: ConfiguracionTaller;
  onEjecutarAccion: (hallazgo: HallazgoRevisionServicio, orden: OrdenTrabajo) => void;
}

export const RevisionInteligenteServicioPanel: React.FC<RevisionInteligenteServicioPanelProps> = ({
  isOpen,
  onClose,
  orden,
  cotizaciones,
  clientes,
  vehiculos,
  refacciones,
  servicios,
  facturas,
  configuracion,
  onEjecutarAccion,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [tabActiva, setTabActiva] = useState<
    'todos' | 'faltante' | 'inconsistencia' | 'pendiente' | 'resumen'
  >('todos');
  const [copiadoWhatsApp, setCopiadoWhatsApp] = useState(false);
  const [copiadoNota, setCopiadoNota] = useState(false);

  // Cerrar al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset al abrir una nueva orden
  useEffect(() => {
    if (isOpen) {
      setMostrarTodos(false);
      setTabActiva('todos');
      setCopiadoWhatsApp(false);
      setCopiadoNota(false);
    }
  }, [isOpen, orden?.id]);

  // Si no hay orden seleccionada o está cerrado
  if (!isOpen || !orden) return null;

  // Datos asociados a la orden
  const cliente = clientes.find((c) => c.id === orden.clienteId);
  const vehiculo = vehiculos.find((v) => v.id === orden.vehiculoId);
  const cotizacion = cotizaciones.find(
    (c) => c.id === orden.cotizacionId || c.ordenId === orden.id
  );
  const factura = facturas.find(
    (f) =>
      (orden.cotizacionId && f.cotizacionId === orden.cotizacionId) ||
      f.folio === orden.folio ||
      (f.descripcion && f.descripcion.includes(orden.folio))
  );

  const hoyStr = new Date().toISOString().split('T')[0];

  // ============================================================================
  // MOTOR DE ANÁLISIS INTEGRAL DEL SERVICIO (10 DIMENSIONES)
  // ============================================================================
  const {
    dimensionesAuditadas,
    informacionFaltante,
    posiblesInconsistencias,
    pendientesParaEntregar,
    resumenParaCliente,
    estadoGeneral,
    etiquetaEstado,
    resumenEstado,
  } = useMemo(() => {
    const faltantes: HallazgoRevisionServicio[] = [];
    const inconsistencias: HallazgoRevisionServicio[] = [];
    const pendientes: HallazgoRevisionServicio[] = [];
    const dimensiones: DimensionAuditada[] = [];

    // 1. Datos del cliente y vehículo
    const clienteTieneContacto =
      cliente?.telefono && cliente.telefono.trim().length >= 10 && cliente.correo;
    const vehiculoCompleto = vehiculo?.placas && vehiculo?.marca && vehiculo?.modelo;

    if (!clienteTieneContacto) {
      faltantes.push({
        id: 'falt-cliente-contacto',
        categoria: 'faltante',
        titulo: 'Datos de contacto incompletos',
        descripcion: `El cliente ${cliente?.nombre || 'asociado'} no tiene teléfono con 10 dígitos o correo electrónico para enviar avisos de entrega.`,
        gravedad: 'media',
        accionTexto: 'Completar cliente',
        accionDestino: { tipo: 'seccion', destino: 'cliente' },
      });
      dimensiones.push({
        id: 'dim-cliente',
        etiqueta: 'Cliente y vehículo',
        estado: 'atencion',
        detalle: 'Falta teléfono completo o correo para notificaciones.',
      });
    } else {
      dimensiones.push({
        id: 'dim-cliente',
        etiqueta: 'Cliente y vehículo',
        estado: 'correcto',
        detalle: `${cliente.nombre} · ${vehiculo?.marca || ''} ${vehiculo?.modelo || ''} (${vehiculo?.placas || ''})`,
      });
    }

    // Odómetro / Kilometraje
    if (!orden.kilometraje || orden.kilometraje.trim() === '') {
      faltantes.push({
        id: 'falt-kilometraje',
        categoria: 'faltante',
        titulo: 'Kilometraje no registrado',
        descripcion:
          'El odómetro de ingreso está vacío. Es indispensable para fijar la periodicidad de los próximos servicios y validez de garantías.',
        gravedad: 'media',
        accionTexto: 'Registrar odómetro',
        accionDestino: { tipo: 'campo', destino: 'kilometraje' },
      });
    }

    // 2. Motivo de ingreso y diagnóstico
    const tieneDiagnostico =
      orden.diagnostico && orden.diagnostico.trim().length > 10;
    if (!tieneDiagnostico) {
      faltantes.push({
        id: 'falt-diagnostico',
        categoria: 'faltante',
        titulo: 'Diagnóstico técnico pendiente',
        descripcion:
          'No se ha redactado el diagnóstico detallado de la falla reportada ni la causa raíz identificada.',
        gravedad: 'alta',
        accionTexto: 'Capturar diagnóstico',
        accionDestino: { tipo: 'campo', destino: 'diagnostico' },
      });
      dimensiones.push({
        id: 'dim-diag',
        etiqueta: 'Motivo y diagnóstico',
        estado: 'incompleto',
        detalle: 'Diagnóstico técnico sin asentar en expediente.',
      });
    } else {
      dimensiones.push({
        id: 'dim-diag',
        etiqueta: 'Motivo y diagnóstico',
        estado: 'correcto',
        detalle: 'Diagnóstico técnico registrado y asentado.',
      });
    }

    // 3. Servicios solicitados y autorizados
    if (!cotizacion) {
      inconsistencias.push({
        id: 'inc-sin-cotizacion',
        categoria: 'inconsistencia',
        titulo: 'Sin cotización formal vinculada',
        descripcion:
          'Esta orden no cuenta con un presupuesto formal registrado en el módulo de Cotizaciones con desglose de mano de obra y refacciones.',
        gravedad: 'media',
        accionTexto: 'Vincular cotización',
        accionDestino: { tipo: 'seccion', destino: 'cotizaciones' },
      });
      dimensiones.push({
        id: 'dim-servicios',
        etiqueta: 'Servicios y autorización',
        estado: 'atencion',
        detalle: 'Orden sin folio de cotización vinculado.',
      });
    } else if (cotizacion.estado === 'Por autorizar') {
      pendientes.push({
        id: 'pend-autorizacion',
        categoria: 'pendiente',
        titulo: 'Cotización pendiente de autorización',
        descripcion: `La cotización ${cotizacion.folio} ($${cotizacion.total.toLocaleString('es-MX')}) aún no cuenta con la aprobación registrada del cliente.`,
        gravedad: 'alta',
        accionTexto: 'Autorizar cotización',
        accionDestino: { tipo: 'seccion', destino: 'cotizaciones' },
      });
      dimensiones.push({
        id: 'dim-servicios',
        etiqueta: 'Servicios y autorización',
        estado: 'atencion',
        detalle: `Cotización ${cotizacion.folio} en espera de luz verde del cliente.`,
      });
    } else {
      dimensiones.push({
        id: 'dim-servicios',
        etiqueta: 'Servicios y autorización',
        estado: 'correcto',
        detalle: `Cotización ${cotizacion.folio} aprobada ($${cotizacion.total.toLocaleString('es-MX')}).`,
      });
    }

    // 4. Refacciones utilizadas vs cotizadas
    const totalRefaccionesUsadas = (orden.refaccionesUtilizadas || []).reduce(
      (sum, r) => sum + (r.cantidad - (r.devueltas || 0)),
      0
    );

    if (cotizacion && cotizacion.importeRefacciones > 0 && totalRefaccionesUsadas === 0) {
      inconsistencias.push({
        id: 'inc-refacciones-no-cargadas',
        categoria: 'inconsistencia',
        titulo: 'Refacciones cotizadas no descargadas de almacén',
        descripcion: `La cotización incluye $${cotizacion.importeRefacciones.toLocaleString('es-MX')} en refacciones, pero la orden no registra piezas consumidas en almacén.`,
        gravedad: 'alta',
        accionTexto: 'Cargar refacciones',
        accionDestino: { tipo: 'campo', destino: 'refacciones' },
      });
      dimensiones.push({
        id: 'dim-refacciones',
        etiqueta: 'Refacciones utilizadas',
        estado: 'incompleto',
        detalle: 'Piezas cotizadas no cargadas a rampa.',
      });
    } else if (totalRefaccionesUsadas > 0) {
      // Verificar si hay devoluciones sin justificar
      const tieneDevueltas = (orden.refaccionesUtilizadas || []).some(
        (r) => (r.devueltas || 0) > 0
      );
      dimensiones.push({
        id: 'dim-refacciones',
        etiqueta: 'Refacciones utilizadas',
        estado: 'correcto',
        detalle: `${totalRefaccionesUsadas} pieza(s) registrada(s) en consumo real.${tieneDevueltas ? ' Con devoluciones registradas.' : ''}`,
      });
    } else {
      dimensiones.push({
        id: 'dim-refacciones',
        etiqueta: 'Refacciones utilizadas',
        estado: 'correcto',
        detalle: 'Servicio de mano de obra pura sin consumo de refacciones.',
      });
    }

    // 5. Precios de compra, venta y margen de rentabilidad
    if (
      orden.margenRealPorcentaje !== undefined &&
      orden.margenRealPorcentaje < 20 &&
      orden.margenRealPorcentaje > 0
    ) {
      inconsistencias.push({
        id: 'inc-margen-bajo',
        categoria: 'inconsistencia',
        titulo: `Margen de rentabilidad bajo (${orden.margenRealPorcentaje.toFixed(1)}%)`,
        descripcion:
          'El margen obtenido en este servicio está por debajo del estándar recomendado del taller (mínimo 25%), posiblemente por refacciones con precio de compra elevado.',
        gravedad: 'media',
        accionTexto: 'Revisar costos y precios',
        accionDestino: { tipo: 'campo', destino: 'refacciones' },
      });
      dimensiones.push({
        id: 'dim-precios',
        etiqueta: 'Precios y margen',
        estado: 'atencion',
        detalle: `Margen real de ${orden.margenRealPorcentaje.toFixed(1)}% inferior al objetivo.`,
      });
    } else {
      dimensiones.push({
        id: 'dim-precios',
        etiqueta: 'Precios y margen',
        estado: 'correcto',
        detalle: 'Costeo de piezas y mano de obra con margen estándar.',
      });
    }

    // 6. Tiempo estimado y fecha prometida
    if (!orden.fechaEntregaPrometida) {
      faltantes.push({
        id: 'falt-fecha-entrega',
        categoria: 'faltante',
        titulo: 'Fecha de entrega prometida no fijada',
        descripcion:
          'No se ha establecido el compromiso de entrega al cliente, lo cual dificulta la gestión de bahías y control de retrasos.',
        gravedad: 'media',
        accionTexto: 'Definir fecha de entrega',
        accionDestino: { tipo: 'campo', destino: 'fecha_prometida' },
      });
      dimensiones.push({
        id: 'dim-tiempo',
        etiqueta: 'Tiempos y fecha prometida',
        estado: 'atencion',
        detalle: 'Sin fecha de entrega comprometida.',
      });
    } else if (
      orden.estado !== 'Terminado' &&
      orden.fechaEntregaPrometida < hoyStr
    ) {
      pendientes.push({
        id: 'pend-entrega-vencida',
        categoria: 'pendiente',
        titulo: `Fecha prometida vencida (${orden.fechaEntregaPrometida})`,
        descripcion:
          'La fecha acordada con el cliente ya pasó y la orden sigue en proceso. Se debe reprogramar o apresurar el armado en bahía.',
        gravedad: 'alta',
        accionTexto: 'Reprogramar o finalizar',
        accionDestino: { tipo: 'campo', destino: 'fecha_prometida' },
      });
      dimensiones.push({
        id: 'dim-tiempo',
        etiqueta: 'Tiempos y fecha prometida',
        estado: 'incompleto',
        detalle: `Entrega comprometida vencida (${orden.fechaEntregaPrometida}).`,
      });
    } else {
      dimensiones.push({
        id: 'dim-tiempo',
        etiqueta: 'Tiempos y fecha prometida',
        estado: 'correcto',
        detalle: `Compromiso de entrega: ${orden.fechaEntregaPrometida || 'En tiempo'}.`,
      });
    }

    // 7. Trabajo realizado por el técnico
    if (!orden.mecanicoNombre || orden.mecanicoNombre.trim() === '') {
      faltantes.push({
        id: 'falt-tecnico',
        categoria: 'faltante',
        titulo: 'Mecánico no asignado',
        descripcion:
          'No se ha asignado el técnico responsable de rampa. Se requiere para seguimiento de productividad y control de calidad.',
        gravedad: 'alta',
        accionTexto: 'Asignar técnico',
        accionDestino: { tipo: 'campo', destino: 'mecanico' },
      });
      dimensiones.push({
        id: 'dim-tecnico',
        etiqueta: 'Trabajo técnico en rampa',
        estado: 'incompleto',
        detalle: 'Falta asignar técnico responsable.',
      });
    } else if (!orden.trabajoTerminado && orden.estado !== 'Terminado') {
      pendientes.push({
        id: 'pend-trabajo-mecanico',
        categoria: 'pendiente',
        titulo: 'Trabajo físico en rampa en proceso',
        descripcion: `El técnico ${orden.mecanicoNombre} aún no marca el trabajo físico como concluido en bahía.`,
        gravedad: 'media',
        accionTexto: 'Finalizar trabajo en bahía',
        accionDestino: { tipo: 'modal', destino: 'mecanico' },
      });
      dimensiones.push({
        id: 'dim-tecnico',
        etiqueta: 'Trabajo técnico en rampa',
        estado: 'atencion',
        detalle: `En proceso por ${orden.mecanicoNombre}.`,
      });
    } else {
      dimensiones.push({
        id: 'dim-tecnico',
        etiqueta: 'Trabajo técnico en rampa',
        estado: 'correcto',
        detalle: `Completado por ${orden.mecanicoNombre}.`,
      });
    }

    // 8. Evidencias y observaciones
    if (!orden.observaciones && !orden.observacionesMecanico) {
      faltantes.push({
        id: 'falt-observaciones',
        categoria: 'faltante',
        titulo: 'Sin notas ni observaciones técnicas',
        descripcion:
          'Conviene asentar observaciones sobre el estado general del auto (ej. calibración, desgaste de balatas o piezas próximas a fallar).',
        gravedad: 'baja',
        accionTexto: 'Anotar observaciones',
        accionDestino: { tipo: 'campo', destino: 'observaciones' },
      });
      dimensiones.push({
        id: 'dim-evidencias',
        etiqueta: 'Evidencias y observaciones',
        estado: 'atencion',
        detalle: 'Sin notas técnicas registradas.',
      });
    } else {
      dimensiones.push({
        id: 'dim-evidencias',
        etiqueta: 'Evidencias y observaciones',
        estado: 'correcto',
        detalle: 'Notas y observaciones técnicas registradas.',
      });
    }

    // 9. Control de calidad
    if (!orden.revisionFinal) {
      pendientes.push({
        id: 'pend-control-calidad',
        categoria: 'pendiente',
        titulo: 'Control de calidad final pendiente',
        descripcion:
          'Ningún vehículo debe salir sin validación de puntos críticos: torque de birlos, niveles de fluidos, prueba de ruta y limpieza interior.',
        gravedad: 'alta',
        accionTexto: 'Validar control de calidad',
        accionDestino: { tipo: 'modal', destino: 'control_calidad' },
      });
      dimensiones.push({
        id: 'dim-calidad',
        etiqueta: 'Control de calidad',
        estado: 'incompleto',
        detalle: 'Checklist final y prueba de ruta pendientes.',
      });
    } else {
      dimensiones.push({
        id: 'dim-calidad',
        etiqueta: 'Control de calidad',
        estado: 'correcto',
        detalle: 'Revisión final aprobada satisfactoriamente.',
      });
    }

    // 10. Cotización, factura y estado de pago
    if (!factura) {
      if (orden.estado === 'Terminado' || orden.trabajoTerminado) {
        pendientes.push({
          id: 'pend-factura-generar',
          categoria: 'pendiente',
          titulo: 'Factura / Comprobante de cobro no emitido',
          descripcion:
            'El trabajo está terminado o avanzado pero aún no se genera el comprobante fiscal o nota en caja para el cobro del cliente.',
          gravedad: 'alta',
          accionTexto: 'Generar comprobante en Facturación',
          accionDestino: { tipo: 'seccion', destino: 'facturacion' },
        });
      }
      dimensiones.push({
        id: 'dim-factura',
        etiqueta: 'Facturación y pago',
        estado: orden.estado === 'Terminado' ? 'incompleto' : 'atencion',
        detalle: 'Comprobante de cobro pendiente de emisión.',
      });
    } else if (factura.estado === 'Pendiente') {
      pendientes.push({
        id: 'pend-factura-cobro',
        categoria: 'pendiente',
        titulo: `Cobro pendiente en caja ($${factura.total.toLocaleString('es-MX')})`,
        descripcion: `Factura ${factura.folio} emitida pero sin liquidar. Se requiere registrar el método y referencia de pago antes de entregar llaves.`,
        gravedad: 'alta',
        accionTexto: 'Registrar pago en caja',
        accionDestino: { tipo: 'seccion', destino: 'facturacion' },
      });
      dimensiones.push({
        id: 'dim-factura',
        etiqueta: 'Facturación y pago',
        estado: 'atencion',
        detalle: `Factura ${factura.folio} pendiente de cobro ($${factura.total.toLocaleString('es-MX')}).`,
      });
    } else {
      dimensiones.push({
        id: 'dim-factura',
        etiqueta: 'Facturación y pago',
        estado: 'correcto',
        detalle: `Factura ${factura.folio} liquidada ($${factura.total.toLocaleString('es-MX')}).`,
      });
    }

    // ========================================================================
    // CÁLCULO DEL INDICADOR GENERAL (SEMÁFORO)
    // - Verde: Listo para entregar
    // - Amarillo: Requiere revisión
    // - Rojo: Tiene pendientes importantes
    // ========================================================================
    const pendientesCriticos = [
      ...faltantes.filter((f) => f.gravedad === 'alta'),
      ...inconsistencias.filter((i) => i.gravedad === 'alta'),
      ...pendientes.filter((p) => p.gravedad === 'alta'),
    ];

    let estadoG: EstadoRevisionServicio = 'listo_para_entregar';
    let etiquetaG = 'Listo para entregar';
    let resumenG =
      'Todos los puntos críticos, trabajo físico, control de calidad y cobranza están completamente solventados.';

    if (pendientesCriticos.length > 0) {
      estadoG = 'pendientes_importantes';
      etiquetaG = 'Tiene pendientes importantes';
      resumenG = `Se identificaron ${pendientesCriticos.length} asunto(s) crítico(s) que impiden entregar el vehículo al cliente sin riesgo administrativo o técnico.`;
    } else if (
      faltantes.length > 0 ||
      inconsistencias.length > 0 ||
      pendientes.length > 0 ||
      !orden.revisionFinal ||
      !orden.entregado
    ) {
      estadoG = 'requiere_revision';
      etiquetaG = 'Requiere revisión';
      resumenG =
        'El servicio va por buen camino pero requiere completar datos secundarios o verificar notas antes de la entrega formal.';
    }

    // ========================================================================
    // RESUMEN PARA EL CLIENTE (EXPLICACIÓN CLARA Y BREVE DEL TRABAJO)
    // ========================================================================
    const nombreCliente = cliente?.nombre || 'Estimado cliente';
    const vehiculoDesc = `${vehiculo?.marca || ''} ${vehiculo?.modelo || ''} (${vehiculo?.placas || 'Placas N/D'})`;
    const servicioDesc = orden.servicio || 'Servicio de mantenimiento automotriz';
    const nombreTaller = configuracion?.nombre || 'TUNNO Taller Automotriz';
    const tecnicoDesc = orden.mecanicoNombre
      ? `realizado por el técnico ${orden.mecanicoNombre}`
      : 'realizado por nuestro equipo técnico';

    const explicacionCorta = `Se concluyó el servicio de "${servicioDesc}" para su vehículo ${vehiculoDesc}, ${tecnicoDesc}. Se realizó la inspección de seguridad, verificación de componentes y prueba final de funcionamiento bajo estándares de calidad ${nombreTaller}.`;

    const puntosClave = [
      `Servicio efectuado: ${servicioDesc}`,
      orden.kilometraje ? `Odómetro de entrada: ${orden.kilometraje}` : 'Inspección física completa de rampa',
      orden.revisionFinal ? 'Control de calidad: Aprobado (Torque, fluidos y prueba de ruta)' : 'Control de calidad: En proceso de validación final',
      factura?.estado === 'Pagada' ? 'Estado de pago: Liquidado en caja' : 'Estado de pago: En proceso de liquidación',
      'Garantía: Aplica garantía TUNNO por escrito en refacciones y mano de obra',
    ];

    const mensajeWhatsApp = `Hola ${nombreCliente}, le saludamos de *${nombreTaller}* 🚗🔧.\n\nLe informamos sobre su vehículo *${vehiculoDesc}*:\n\n✅ *Trabajo realizado:* ${servicioDesc}.\n${orden.diagnostico ? `🔍 *Diagnóstico:* ${orden.diagnostico}\n` : ''}${orden.revisionFinal ? '🏁 *Inspección final:* Aprobada y lista para entrega.\n' : '⏳ *Estatus:* En fase final de revisión de calidad.\n'}\nSi tiene alguna duda o requiere preparar su salida, con gusto le atendemos.\n\n_TUNNO · Tu taller. Tu control._`;

    const recomendacionPreventiva =
      'Sugerimos programar el siguiente servicio preventivo de afinación y rotación de neumáticos en 10,000 km o 6 meses para preservar el rendimiento del motor.';

    return {
      dimensionesAuditadas: dimensiones,
      informacionFaltante: faltantes,
      posiblesInconsistencias: inconsistencias,
      pendientesParaEntregar: pendientes,
      resumenParaCliente: {
        titulo: `Resumen de servicio · ${vehiculoDesc}`,
        explicacion: explicacionCorta,
        puntosClave,
        mensajeWhatsApp,
        recomendacionPreventiva,
      },
      estadoGeneral: estadoG,
      etiquetaEstado: etiquetaG,
      resumenEstado: resumenG,
    };
  }, [orden, cotizacion, factura, cliente, vehiculo, configuracion, hoyStr]);

  // Lista consolidada de hallazgos ordenados por gravedad
  const todosLosHallazgos = useMemo(() => {
    const ordenGravedad: Record<'alta' | 'media' | 'baja', number> = {
      alta: 1,
      media: 2,
      baja: 3,
    };
    const lista = [
      ...informacionFaltante,
      ...posiblesInconsistencias,
      ...pendientesParaEntregar,
    ];
    return lista.sort(
      (a, b) => ordenGravedad[a.gravedad] - ordenGravedad[b.gravedad]
    );
  }, [informacionFaltante, posiblesInconsistencias, pendientesParaEntregar]);

  // Filtrado según tab activa
  const hallazgosFiltrados = useMemo(() => {
    switch (tabActiva) {
      case 'faltante':
        return informacionFaltante;
      case 'inconsistencia':
        return posiblesInconsistencias;
      case 'pendiente':
        return pendientesParaEntregar;
      default:
        return todosLosHallazgos;
    }
  }, [
    tabActiva,
    todosLosHallazgos,
    informacionFaltante,
    posiblesInconsistencias,
    pendientesParaEntregar,
  ]);

  // REGLA CLAVE DE INTERFAZ: Máximo cinco hallazgos visibles por defecto y opción "Ver todos"
  const hallazgosVisibles = useMemo(() => {
    if (mostrarTodos) return hallazgosFiltrados;
    return hallazgosFiltrados.slice(0, 5);
  }, [hallazgosFiltrados, mostrarTodos]);

  const totalOcultos = Math.max(0, hallazgosFiltrados.length - 5);

  const handleCopiarWhatsApp = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resumenParaCliente.mensajeWhatsApp);
      setCopiadoWhatsApp(true);
      setTimeout(() => setCopiadoWhatsApp(false), 2500);
    }
  };

  const handleCopiarNota = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${resumenParaCliente.explicacion}\n\nRecomendación preventiva: ${resumenParaCliente.recomendacionPreventiva}`
      );
      setCopiadoNota(true);
      setTimeout(() => setCopiadoNota(false), 2500);
    }
  };

  // Badge del semáforo general
  const renderBadgeEstadoGeneral = () => {
    switch (estadoGeneral) {
      case 'listo_para_entregar':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wide block text-emerald-800">
                Listo para entregar
              </span>
              <span className="text-[10px] text-emerald-700">Sin bloqueos activos</span>
            </div>
          </div>
        );
      case 'requiere_revision':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wide block text-amber-900">
                Requiere revisión
              </span>
              <span className="text-[10px] text-amber-800">Verificar notas o datos</span>
            </div>
          </div>
        );
      case 'pendientes_importantes':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-wide block text-rose-900">
                Tiene pendientes importantes
              </span>
              <span className="text-[10px] text-rose-800">Atención urgente requerida</span>
            </div>
          </div>
        );
    }
  };

  const getBadgeCategoria = (categoria: CategoriaHallazgo) => {
    switch (categoria) {
      case 'faltante':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Información faltante
          </span>
        );
      case 'inconsistencia':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
            Posible inconsistencia
          </span>
        );
      case 'pendiente':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Pendiente para entregar
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Fondo oscurecido con desenfoque suave */}
      <div
        className="fixed inset-0 bg-[#06345A]/40 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* PANEL LATERAL COMPACTO */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Panel de Revisión inteligente del servicio"
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[520px] bg-white z-50 shadow-2xl border-l border-[#E5E7EB] flex flex-col font-body animate-in slide-in-from-right duration-250 ease-out select-none sm:select-auto"
      >
        {/* CABECERA DEL PANEL */}
        <div className="bg-[#06345A] text-white px-5 py-4 shrink-0 flex items-center justify-between border-b border-[#1497F2]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1497F2] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm tracking-wide text-white">
                  Revisión inteligente del servicio
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-900/80 text-[#73C7FF] border border-[#73C7FF]/40">
                  {orden.folio}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-[280px]">
                {cliente?.nombre || 'Cliente'} · {vehiculo?.marca || ''} {vehiculo?.modelo || ''} ({vehiculo?.placas || 'Placas N/D'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Escape)"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INDICADOR GENERAL (SEMÁFORO) */}
        <div className="px-5 py-3.5 bg-[#F4F6F8] border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider block">
                Estado general del servicio
              </span>
              <p className="text-xs text-[#374151] mt-0.5 leading-snug max-w-[280px]">
                {resumenEstado}
              </p>
            </div>
            {renderBadgeEstadoGeneral()}
          </div>
        </div>

        {/* PESTAÑAS SIMPLES DE NAVEGACIÓN */}
        <div className="px-5 pt-2 pb-1 bg-white border-b border-[#E5E7EB] shrink-0 flex items-center gap-1 overflow-x-auto text-xs font-heading">
          <button
            type="button"
            onClick={() => setTabActiva('todos')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              tabActiva === 'todos'
                ? 'bg-[#06345A] text-white shadow-2xs'
                : 'text-[#4B5563] hover:bg-slate-100'
            }`}
          >
            Todos ({todosLosHallazgos.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('faltante')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              tabActiva === 'faltante'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-[#4B5563] hover:bg-slate-100'
            }`}
          >
            Faltantes ({informacionFaltante.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('inconsistencia')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              tabActiva === 'inconsistencia'
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : 'text-[#4B5563] hover:bg-slate-100'
            }`}
          >
            Inconsistencias ({posiblesInconsistencias.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('pendiente')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              tabActiva === 'pendiente'
                ? 'bg-red-100 text-red-900 border border-red-300'
                : 'text-[#4B5563] hover:bg-slate-100'
            }`}
          >
            Pendientes ({pendientesParaEntregar.length})
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('resumen')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              tabActiva === 'resumen'
                ? 'bg-[#1497F2] text-white'
                : 'text-[#4B5563] hover:bg-slate-100'
            }`}
          >
            Resumen cliente
          </button>
        </div>

        {/* CONTENIDO DEL PANEL CON SCROLL */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs text-[#374151]">
          {tabActiva !== 'resumen' ? (
            <>
              {/* LISTA DE HALLAZGOS (MÁXIMO 5 VISIBLES INICIALMENTE) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#06345A]">
                  <span className="font-heading uppercase tracking-wider text-[11px]">
                    Hallazgos analizados ({hallazgosFiltrados.length})
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    Mostrando {hallazgosVisibles.length} de {hallazgosFiltrados.length}
                  </span>
                </div>

                {hallazgosFiltrados.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-heading font-bold text-xs">
                        Sin observaciones en este apartado
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        No se detectaron puntos pendientes ni inconsistencias en esta categoría.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {hallazgosVisibles.map((h) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#1497F2]/60 hover:shadow-xs transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {h.gravedad === 'alta' ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            ) : h.gravedad === 'media' ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <span className="font-heading font-bold text-xs text-[#06345A] leading-snug">
                              {h.titulo}
                            </span>
                          </div>
                          {getBadgeCategoria(h.categoria)}
                        </div>

                        <p className="text-[11px] text-[#4B5563] leading-relaxed pl-5">
                          {h.descripcion}
                        </p>

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => onEjecutarAccion(h, orden)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06345A] hover:bg-[#1497F2] text-white text-[11px] font-heading font-semibold transition-colors cursor-pointer group shadow-2xs"
                          >
                            <span>{h.accionTexto}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BOTÓN VER TODOS / MOSTRAR MENOS (REQUERIMIENTO EXACTO) */}
                {hallazgosFiltrados.length > 5 && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setMostrarTodos(!mostrarTodos)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#06345A] font-heading font-semibold text-xs transition-colors cursor-pointer"
                    >
                      {mostrarTodos ? (
                        <>
                          <ChevronUp className="w-4 h-4 text-[#1497F2]" />
                          <span>Mostrar menos</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 text-[#1497F2]" />
                          <span>Ver todos ({hallazgosFiltrados.length} hallazgos)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* SECCIÓN 4 INTEGRADA: VISTA RESUMIDA DE LAS 10 DIMENSIONES AUDITADAS */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                    Dimensiones auditadas del servicio (10)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dimensionesAuditadas.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg bg-[#F4F6F8] border border-[#E5E7EB] text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#06345A] font-heading truncate">
                          {d.etiqueta}
                        </span>
                        {d.estado === 'correcto' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : d.estado === 'atencion' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] line-clamp-1">{d.detalle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ================================================================ */
            /* APARTADO 4: RESUMEN PARA EL CLIENTE (EXPLICACIÓN CLARA Y BREVE)  */
            /* ================================================================ */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-50/70 border border-[#73C7FF]/40 text-[#06345A] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#06345A]">
                    {resumenParaCliente.titulo}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1497F2] text-white">
                    Listo para compartir
                  </span>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">
                  {resumenParaCliente.explicacion}
                </p>
              </div>

              {/* PUNTOS CLAVE DEL TRABAJO REALIZADO */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                <span className="font-heading font-bold text-xs text-[#06345A] uppercase tracking-wider block">
                  Puntos clave del servicio
                </span>
                <ul className="space-y-1.5 text-xs text-[#4B5563]">
                  {resumenParaCliente.puntosClave.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#1497F2] shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RECOMENDACIÓN PREVENTIVA PARA FIDELIZACIÓN */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Recomendación preventiva para el cliente</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {resumenParaCliente.recomendacionPreventiva}
                </p>
              </div>

              {/* VISTA PREVIA DEL MENSAJE PARA WHATSAPP */}
              <div className="p-3.5 rounded-xl bg-[#F4F6F8] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#06345A] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#1497F2]" />
                    Mensaje formateado para WhatsApp
                  </span>
                </div>
                <pre className="p-3 bg-white rounded-lg border border-[#E5E7EB] text-[11px] text-[#374151] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {resumenParaCliente.mensajeWhatsApp}
                </pre>
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopiarNota}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#06345A] text-xs font-semibold font-heading transition-colors cursor-pointer"
                  >
                    {copiadoNota ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>Copiar nota técnica</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopiarWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold font-heading transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiadoWhatsApp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Mensaje copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>Copiar para WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL PANEL: AVISO INSTITUCIONAL DE CONTROL HUMANO (REGLA DE SEGURIDAD) */}
        <div className="px-5 py-3 bg-[#F4F6F8] border-t border-[#E5E7EB] shrink-0 text-[10px] text-[#6B7280] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#06345A] shrink-0" />
            <p className="leading-snug">
              La IA diagnostica y redacta mensajes de apoyo; no modifica datos, no autoriza servicios, no descuenta inventario ni cobra automáticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-slate-100 text-[#06345A] text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
