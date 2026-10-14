import { SectionId, RolUsuario } from '../types';

export type TipoGuia =
  | 'general'
  | 'flujo-cliente'
  | 'recepcion'
  | 'mecanico'
  | 'administrador'
  | 'ia'
  | 'nuevos';

export interface PasoGuia {
  id: string;
  numero: number;
  totalPasos?: number;
  titulo: string;
  seccion: SectionId;
  seccionNombre: string;
  targetSelector?: string; // CSS selector para resaltar (ej: [data-tour="dashboard-avisos"])
  posicionPreferida?: 'bottom' | 'top' | 'left' | 'right' | 'auto';
  paraQueSirve: string;
  queHacer: string;
  queSucedeDespues: string;
  recomendacionPractica: string;
  accionTexto?: string;
  isNew?: boolean; // Para "ver únicamente pasos nuevos"
}

export interface DefinicionGuia {
  id: TipoGuia;
  nombre: string;
  descripcionCorta: string;
  iconoNombre: string;
  rolesPermitidos?: RolUsuario[];
  pasos: PasoGuia[];
}

// ============================================================================
// 1. RECORRIDO GENERAL (13 pasos en el orden exacto solicitado)
// ============================================================================
export const PASOS_RECORRIDO_GENERAL: PasoGuia[] = [
  {
    id: 'gen-1-dashboard',
    numero: 1,
    titulo: 'Dashboard y avisos importantes',
    seccion: 'dashboard',
    seccionNombre: 'Dashboard',
    targetSelector: '[data-tour="dashboard-header"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Proporciona una vista ejecutiva instantánea del estado del taller: citas de hoy, órdenes en proceso, cotizaciones pendientes y alertas de inventario o trabajos retrasados.',
    queHacer:
      'Revisa los 4 indicadores superiores y la campana de avisos para enterarte de citas urgentes o refacciones por agotarse.',
    queSucedeDespues:
      'Al pulsar sobre cualquier indicador o aviso, el sistema te redirige de inmediato a la sección operativa correspondiente.',
    recomendacionPractica:
      'Empieza cada jornada revisando "Atención de hoy" para asignar bahías y técnicos antes del arribo vehicular.',
  },
  {
    id: 'gen-2-nueva-atencion',
    numero: 2,
    titulo: 'Nueva atención',
    seccion: 'nueva-atencion',
    seccionNombre: 'Nueva atención',
    targetSelector: '[data-tour="nav-nueva-atencion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Es la puerta de entrada para recibir al cliente de forma ágil, capturar motivo de visita, odómetro, fotos del vehículo y canalizar a cita, cotización u orden directa.',
    queHacer:
      'Ingresa las placas o nombre del cliente. Puedes usar la captura inteligente por voz o texto guiada por IA para registrar los síntomas.',
    queSucedeDespues:
      'Se vinculan los datos automáticamente y puedes expedir la cotización o abrir la orden de trabajo con un solo clic.',
    recomendacionPractica:
      'Verifica siempre el kilometraje actual para activar alertas preventivas automáticas de cambio de aceite y frenos.',
  },
  {
    id: 'gen-3-clientes-vehiculos',
    numero: 3,
    titulo: 'Clientes y vehículos',
    seccion: 'clientes',
    seccionNombre: 'Clientes y Padrón',
    targetSelector: '[data-tour="nav-clientes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Directorio maestro de clientes particulares y flotillas, vinculados a sus expedientes vehiculares con placas, VIN, año, marca y motor.',
    queHacer:
      'Consulta teléfonos, correos y autos registrados. Puedes agregar nuevos vehículos a clientes existentes sin duplicar registros.',
    queSucedeDespues:
      'Toda orden, cotización o factura emitida se asocia permanentemente a este cliente para alimentar su historial.',
    recomendacionPractica:
      'Registra el correo electrónico y teléfono con WhatsApp para enviar notificaciones de estado y presupuestos.',
  },
  {
    id: 'gen-4-citas-calendario',
    numero: 4,
    titulo: 'Citas y calendario',
    seccion: 'citas',
    seccionNombre: 'Citas y Calendario',
    targetSelector: '[data-tour="nav-citas"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Gestiona la programación de servicios, control de bahías y citas agendadas por día, semana o mes, evitando saturación del taller.',
    queHacer:
      'Agenda citas asignando cliente, vehículo, servicio solicitado, fecha, hora estimada y bahía de atención.',
    queSucedeDespues:
      'La cita aparece en el calendario operativo y genera un recordatorio automático en el Dashboard el día programado.',
    recomendacionPractica:
      'Al recibir el vehículo en la fecha citada, pulsa "Convertir en orden" para no volver a capturar los datos.',
  },
  {
    id: 'gen-5-cotizaciones-autorizacion',
    numero: 5,
    titulo: 'Cotizaciones y autorización',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    targetSelector: '[data-tour="nav-cotizaciones"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Elabora presupuestos transparentes desglosando refacciones, mano de obra, utilidad y tiempos estimados con aprobación formal.',
    queHacer:
      'Agrega conceptos de catálogo o personalizados, imprime o comparte la cotización en PDF y registra la aprobación del cliente.',
    queSucedeDespues:
      'Una cotización autorizada puede convertirse directamente en orden de trabajo con piezas y costos ya vinculados.',
    recomendacionPractica:
      'Utiliza el botón de "Análisis con IA" para evaluar si tus márgenes de ganancia son competitivos antes de enviar.',
  },
  {
    id: 'gen-6-ordenes-trabajo',
    numero: 6,
    titulo: 'Órdenes de trabajo',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    targetSelector: '[data-tour="nav-ordenes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'El núcleo operativo del taller: asignación de mecánicos, registro de refacciones consumidas, semáforo de tiempos y estatus de servicio.',
    queHacer:
      'Monitorea el avance de las órdenes: "Por autorizar", "En proceso", "Terminado" y "Entregado", registrando consumos reales.',
    queSucedeDespues:
      'El semáforo indica si la entrega va en tiempo o está en riesgo de retraso, manteniendo el control de bahías.',
    recomendacionPractica:
      'Registra las refacciones utilizadas directamente en la orden para descontar inventario en tiempo real.',
  },
  {
    id: 'gen-7-control-calidad',
    numero: 7,
    titulo: 'Control de calidad',
    seccion: 'ordenes',
    seccionNombre: 'Control de calidad',
    targetSelector: '[data-tour="ordenes-control-calidad"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Garantiza que ningún vehículo salga sin una inspección final rigurosa: torque de ruedas, niveles de fluidos, prueba de ruta y limpieza.',
    queHacer:
      'En órdenes terminadas, abre el modal de "Revisión Final con IA", valida los puntos del checklist y aprueba la salida.',
    queSucedeDespues:
      'Se expide el certificado de calidad y se autoriza al personal de recepción o caja para entregar el vehículo al cliente.',
    recomendacionPractica:
      'Involucra al jefe de taller o mecánico líder en la firma del checklist para evitar garantías por descuido.',
    isNew: true,
  },
  {
    id: 'gen-8-inventario',
    numero: 8,
    titulo: 'Inventario de refacciones',
    seccion: 'inventario',
    seccionNombre: 'Inventario',
    targetSelector: '[data-tour="nav-inventario"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Control integral de piezas, lubricantes y consumibles: existencias, stock mínimo, costos de compra, precios de venta y ubicación en almacén.',
    queHacer:
      'Registra entradas por compra, salidas a órdenes y devoluciones. Configura el stock mínimo para recibir alertas oportunas.',
    queSucedeDespues:
      'Cada pieza cargada a una orden disminuye automáticamente las existencias y calcula el costo real del trabajo.',
    recomendacionPractica:
      'Revisa los productos con badge de "Stock bajo" para reabastecer aceites y filtros de alta rotación.',
  },
  {
    id: 'gen-9-facturacion-pago',
    numero: 9,
    titulo: 'Facturación y pago',
    seccion: 'facturacion',
    seccionNombre: 'Facturación y Caja',
    targetSelector: '[data-tour="nav-facturacion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Emisión de comprobantes fiscales demostrativos, desglose de IVA (16%), folios consecutivos y registro formal de pagos y anticipos.',
    queHacer:
      'Genera la factura desde una orden terminada o cotización aprobada, define la forma de pago (Efectivo, Tarjeta, Transferencia) y registra la referencia.',
    queSucedeDespues:
      'El comprobante queda marcado como "Pagada", se actualizan los reportes financieros y se permite la entrega sin adeudos.',
    recomendacionPractica:
      'Siempre anota la referencia bancaria o voucher para una conciliación de caja impecable al cierre del día.',
  },
  {
    id: 'gen-10-historial-vehicular',
    numero: 10,
    titulo: 'Historial vehicular',
    seccion: 'historial-vehicular',
    seccionNombre: 'Historial vehicular',
    targetSelector: '[data-tour="nav-historial-vehicular"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Expediente clínico completo del vehículo: consultas por placa o VIN con todos sus servicios, kilometrajes, refacciones instaladas y garantías.',
    queHacer:
      'Ingresa las placas para ver la cronología completa de atenciones, diagnósticos pasados e imprimir la ficha técnica de servicio.',
    queSucedeDespues:
      'Permite responder con total certeza al cliente sobre qué se le cambió, cuándo y con qué garantía.',
    recomendacionPractica:
      'Muestra este historial impreso al cliente para generar confianza profesional y recomendar el siguiente mantenimiento.',
  },
  {
    id: 'gen-11-seguimientos',
    numero: 11,
    titulo: 'Seguimientos y bitácora',
    seccion: 'bitacora',
    seccionNombre: 'Bitácora y Seguimiento',
    targetSelector: '[data-tour="nav-bitacora"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Control de llamadas post-servicio, satisfacción del cliente, recordatorios de afinación y bitácora de auditoría de movimientos del sistema.',
    queHacer:
      'Revisa la lista de clientes a contactar a los 3 días de entregado el vehículo para confirmar satisfacción o agendar ajustes.',
    queSucedeDespues:
      'Aumenta la lealtad del cliente e incrementa la recurrencia de visitas al taller en un 35 %.',
    recomendacionPractica:
      'Aprovecha el botón de WhatsApp directo para enviar un mensaje cordial de seguimiento post-servicio.',
  },
  {
    id: 'gen-12-reportes',
    numero: 12,
    titulo: 'Reportes y análisis',
    seccion: 'reportes',
    seccionNombre: 'Reportes',
    targetSelector: '[data-tour="nav-reportes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Métricas financieras y operativas del taller: ingresos totales, margen de utilidad bruta, productividad por mecánico y servicios más rentables.',
    queHacer:
      'Filtra por rango de fechas (mes, trimestre, año) y exporta resúmenes ejecutivos para junta de resultados.',
    queSucedeDespues:
      'Identificas fugas de dinero, mecánicos con mayor eficiencia y refacciones que generan más margen.',
    recomendacionPractica:
      'Usa el botón "Análisis Gerencial con IA" para recibir recomendaciones predictivas de crecimiento de tu taller.',
  },
  {
    id: 'gen-13-funciones-ia',
    numero: 13,
    titulo: 'Funciones de IA TUNNO',
    seccion: 'atencion-asistida',
    seccionNombre: 'Asistente IA',
    targetSelector: '[data-tour="nav-atencion-asistida"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Tecnología de Inteligencia Artificial integrada que optimiza la recepción, el diagnóstico de fallas, la cotización y la toma de decisiones.',
    queHacer:
      'Utiliza la Asistencia Técnica en órdenes para analizar síntomas complejos y obtener causas probables con refacciones recomendadas.',
    queSucedeDespues:
      'Reduce los tiempos de diagnóstico hasta en un 50% y previene diagnósticos erróneos o reemplazo innecesario de piezas.',
    recomendacionPractica:
      'Prueba dictar por voz los síntomas que reporta el cliente en Nueva Atención para generar una recepción profesional al instante.',
    isNew: true,
  },
];

// ============================================================================
// 2. FLUJO DE UN CLIENTE ("Atender un cliente paso a paso", 10 pasos)
// ============================================================================
export const PASOS_FLUJO_CLIENTE: PasoGuia[] = [
  {
    id: 'flujo-1-cliente',
    numero: 1,
    titulo: '1. Registrar o buscar al cliente',
    seccion: 'clientes',
    seccionNombre: 'Clientes',
    targetSelector: '[data-tour="nav-clientes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Identificar al propietario o representante del vehículo antes de iniciar cualquier cotización o servicio.',
    queHacer:
      'Escribe su nombre o teléfono en el buscador. Si es nuevo, pulsa "+ Nuevo cliente" e ingresa sus datos de contacto.',
    queSucedeDespues:
      'El cliente queda disponible para asociarle vehículos, citas, cotizaciones y facturas.',
    recomendacionPractica:
      'Pregunta siempre si requiere comprobante fiscal para capturar de una vez su RFC y correo de facturación.',
    accionTexto: 'Ir a Clientes',
  },
  {
    id: 'flujo-2-vehiculo',
    numero: 2,
    titulo: '2. Seleccionar o registrar el vehículo',
    seccion: 'vehiculos',
    seccionNombre: 'Vehículos',
    targetSelector: '[data-tour="nav-vehiculos"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Vincular el auto al cliente con datos exactos: marca, modelo, año, placas, VIN y kilometraje.',
    queHacer:
      'Verifica si el auto ya está en el padrón del cliente. Si es su primera visita, pulsa "+ Nuevo vehículo" y guárdalo.',
    queSucedeDespues:
      'Se abre el expediente clínico del auto donde se guardará todo el historial de servicios de por vida.',
    recomendacionPractica:
      'Asegúrate de escribir correctamente las placas sin guiones ni espacios para búsquedas rápidas.',
    accionTexto: 'Ir a Vehículos',
  },
  {
    id: 'flujo-3-servicio',
    numero: 3,
    titulo: '3. Capturar el servicio solicitado',
    seccion: 'nueva-atencion',
    seccionNombre: 'Nueva atención',
    targetSelector: '[data-tour="nav-nueva-atencion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Registrar formalmente lo que el cliente solicita o los síntomas que reporta (ruidos, vibraciones, testigos de tablero).',
    queHacer:
      'Ingresa a Nueva Atención, selecciona el cliente y vehículo, y captura el motivo de visita y observaciones iniciales.',
    queSucedeDespues:
      'Los datos quedan estructurados para emitir de inmediato una cita, cotización u orden directa.',
    recomendacionPractica:
      'Anota textualmente las palabras del cliente sobre la falla para que el mecánico tenga la referencia exacta.',
    accionTexto: 'Ir a Nueva Atención',
  },
  {
    id: 'flujo-4-crear-doc',
    numero: 4,
    titulo: '4. Crear una cita, cotización u orden',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    targetSelector: '[data-tour="nav-cotizaciones"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Formalizar la atención en el documento adecuado según si el auto se queda hoy, requiere presupuesto previo o viene otro día.',
    queHacer:
      'Si requiere desglose de costos previo, crea una "Cotización". Si el trabajo ya está acordado, genera la "Orden de trabajo".',
    queSucedeDespues:
      'Se genera un folio consecutivo único (COT-XXXX u ORD-XXXX) que servirá de rastreo en todo el taller.',
    recomendacionPractica:
      'Para reparaciones mayores a $3,000 MXN siempre emite primero cotización para respaldo de ambas partes.',
    accionTexto: 'Ir a Cotizaciones',
  },
  {
    id: 'flujo-5-aprobar-cotizacion',
    numero: 5,
    titulo: '5. Aprobar la cotización',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    targetSelector: '[data-tour="cotizaciones-aprobar-btn"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Registrar el consentimiento explícito del cliente sobre los trabajos y costos autorizados.',
    queHacer:
      'En la lista de cotizaciones, ubica el folio y pulsa el botón "Aprobar" tras la confirmación telefónica o presencial del cliente.',
    queSucedeDespues:
      'El estatus cambia a "Aprobada" y se habilita la creación inmediata de la orden de trabajo en bahía.',
    recomendacionPractica:
      'Puedes imprimir o enviar el PDF oficial TUNNO con el desglose para firma de conformidad antes de comprar refacciones.',
    accionTexto: 'Gestionar Cotizaciones',
  },
  {
    id: 'flujo-6-seguimiento-reparacion',
    numero: 6,
    titulo: '6. Dar seguimiento a la reparación',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    targetSelector: '[data-tour="nav-ordenes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Supervisar la ejecución técnica del servicio, piezas instaladas y cumplimiento del tiempo de entrega prometido.',
    queHacer:
      'Asigna el mecánico responsable, pasa el estatus a "En proceso", carga las refacciones usadas y monitorea el semáforo de entrega.',
    queSucedeDespues:
      'El taller mantiene control del avance y el cliente puede ser informado con certeza si llama para consultar.',
    recomendacionPractica:
      'Si surge un imprevisto o falla oculta, actualiza la fecha prometida de entrega y avisa al cliente de inmediato.',
    accionTexto: 'Ver Órdenes en Proceso',
  },
  {
    id: 'flujo-7-control-calidad',
    numero: 7,
    titulo: '7. Registrar el control de calidad',
    seccion: 'ordenes',
    seccionNombre: 'Control de calidad',
    targetSelector: '[data-tour="ordenes-control-calidad"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Inspección formal del vehículo antes de notificar al cliente que su unidad está lista.',
    queHacer:
      'Cuando el mecánico termina, abre "Revisión Final", valida puntos de seguridad, fluidos y limpieza, y aprueba la salida.',
    queSucedeDespues:
      'La orden pasa a estado "Terminada", lista para cobro y entrega con garantía respaldada.',
    recomendacionPractica:
      'Revisa que el vehículo esté limpio por dentro y que no queden herramientas en el compartimento del motor.',
    accionTexto: 'Abrir Control de Calidad',
    isNew: true,
  },
  {
    id: 'flujo-8-factura-pago',
    numero: 8,
    titulo: '8. Generar factura y registrar pago',
    seccion: 'facturacion',
    seccionNombre: 'Facturación',
    targetSelector: '[data-tour="nav-facturacion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Cobrar el servicio terminado, emitir el comprobante oficial y asentar el ingreso financiero en caja.',
    queHacer:
      'En Facturación, pulsa "Generar factura", selecciona la orden terminada, elige el método de pago y anota la referencia bancaria.',
    queSucedeDespues:
      'El comprobante se emite con folio consecutivo, desglose de IVA y queda marcado como "Pagada".',
    recomendacionPractica:
      'Entrega siempre una copia física o digital del comprobante al cliente como respaldo de su pago y garantía.',
    accionTexto: 'Ir a Facturación',
  },
  {
    id: 'flujo-9-entrega-vehiculo',
    numero: 9,
    titulo: '9. Entregar el vehículo',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    targetSelector: '[data-tour="nav-ordenes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Cierre físico y administrativo de la atención: devolución de llaves, explicación de trabajos realizados y firma de salida.',
    queHacer:
      'En la orden, marca la casilla "Entregado al cliente" tras validar que el pago esté registrado y las refacciones viejas devueltas si el cliente las pidió.',
    queSucedeDespues:
      'La bahía queda libre en el sistema y se activa el temporizador para la llamada de seguimiento post-servicio.',
    recomendacionPractica:
      'Explica brevemente al cliente las piezas que se reemplazaron para reafirmar el valor del trabajo realizado.',
    accionTexto: 'Finalizar Entrega',
  },
  {
    id: 'flujo-10-guardar-seguimiento',
    numero: 10,
    titulo: '10. Guardar recomendaciones y seguimiento',
    seccion: 'historial-vehicular',
    seccionNombre: 'Historial vehicular',
    targetSelector: '[data-tour="nav-historial-vehicular"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Fidelizar al cliente recomendándole su próxima afinación o cambio de balatas según el kilometraje actual.',
    queHacer:
      'En el expediente del vehículo, anota las recomendaciones preventivas y programa un recordatorio de seguimiento a 3 meses.',
    queSucedeDespues:
      'El sistema te recordará llamar al cliente antes de que la falla preventiva se convierta en una avería costosa.',
    recomendacionPractica:
      'Un taller que recuerda el próximo servicio a sus clientes logra hasta un 40% más de recurrencia anual.',
    accionTexto: 'Ver Historial Vehicular',
  },
];

// ============================================================================
// 3. GUÍA DE RECEPCIÓN (Clientes, vehículos, citas, cotizaciones, atención inicial, seguimiento)
// ============================================================================
export const PASOS_GUIA_RECEPCION: PasoGuia[] = [
  {
    id: 'rec-1-atencion',
    numero: 1,
    titulo: 'Recepción inicial del cliente',
    seccion: 'nueva-atencion',
    seccionNombre: 'Nueva atención',
    targetSelector: '[data-tour="nav-nueva-atencion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Recibir al cliente con rapidez, identificar si ya está registrado y capturar la falla o mantenimiento requerido.',
    queHacer:
      'Busca por placa o teléfono. Si no existe, créalo con su nombre y modelo vehicular, registrando el kilometraje actual.',
    queSucedeDespues:
      'Canalizas al cliente hacia una cita programada, un presupuesto en cotizaciones o una orden inmediata de taller.',
    recomendacionPractica:
      'Usa el dictado o notas rápidas para no hacer esperar al cliente en mostrador.',
    accionTexto: 'Ir a Nueva Atención',
  },
  {
    id: 'rec-2-clientes',
    numero: 2,
    titulo: 'Padrón de clientes y contactos',
    seccion: 'clientes',
    seccionNombre: 'Clientes',
    targetSelector: '[data-tour="nav-clientes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Mantener actualizados teléfonos, correos y datos fiscales de clientes particulares y flotillas.',
    queHacer:
      'Verifica que el número telefónico tenga WhatsApp activo para enviar presupuestos y notificaciones de vehículo listo.',
    queSucedeDespues:
      'Facilita la comunicación continua durante el tiempo que el auto permanezca en el taller.',
    recomendacionPractica:
      'Si es empresa o flotilla, registra el nombre del chofer habitual en las notas.',
    accionTexto: 'Gestionar Clientes',
  },
  {
    id: 'rec-3-vehiculos',
    numero: 3,
    titulo: 'Registro vehicular y placas',
    seccion: 'vehiculos',
    seccionNombre: 'Vehículos',
    targetSelector: '[data-tour="nav-vehiculos"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Ficha técnica del vehículo para evitar confusiones de modelo, motor o año al ordenar refacciones.',
    queHacer:
      'Revisa placas, marca, submarca y año. Si el cliente tiene varios autos, asegúrate de asociar el correcto.',
    queSucedeDespues:
      'Las cotizaciones y órdenes se vinculan con el historial exacto del automóvil.',
    recomendacionPractica:
      'Siempre verifica el año exacto en la tarjeta de circulación para que las refacciones coincidan al 100%.',
    accionTexto: 'Padrón Vehicular',
  },
  {
    id: 'rec-4-citas',
    numero: 4,
    titulo: 'Agenda de citas y calendario',
    seccion: 'citas',
    seccionNombre: 'Citas y Calendario',
    targetSelector: '[data-tour="nav-citas"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Organizar la llegada de vehículos escalonada para no saturar las bahías ni hacer esperar a los técnicos.',
    queHacer:
      'Agenda fecha y hora convenida. Revisa el calendario para no empalmar más de 2 servicios mayores a la misma hora.',
    queSucedeDespues:
      'El cliente recibe confirmación y el equipo técnico ve la carga de trabajo prevista para el día.',
    recomendacionPractica:
      'Llama o envía WhatsApp un día antes para confirmar la asistencia a la cita.',
    accionTexto: 'Abrir Agenda de Citas',
  },
  {
    id: 'rec-5-cotizaciones',
    numero: 5,
    titulo: 'Cotizaciones y autorización formal',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    targetSelector: '[data-tour="nav-cotizaciones"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Explicar al cliente el presupuesto detallado y registrar su autorización antes de iniciar el trabajo.',
    queHacer:
      'Genera el PDF con la cotización TUNNO oficial, compártela y pulsa "Aprobar" en cuanto el cliente dé luz verde.',
    queSucedeDespues:
      'Se evitan reclamos por costos imprevistos y se autoriza la compra y apartado de piezas.',
    recomendacionPractica:
      'Desglosa siempre mano de obra y refacciones por separado para máxima transparencia.',
    accionTexto: 'Ver Cotizaciones',
  },
  {
    id: 'rec-6-seguimiento',
    numero: 6,
    titulo: 'Seguimiento y entrega al cliente',
    seccion: 'bitacora',
    seccionNombre: 'Seguimiento',
    targetSelector: '[data-tour="nav-bitacora"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Garantizar que el cliente quedó 100% satisfecho con su reparación y responder cualquier duda posterior.',
    queHacer:
      'Revisa la lista de atenciones entregadas hace 3 a 5 días y envía un mensaje cordial de verificación.',
    queSucedeDespues:
      'Detectas cualquier pequeño ajuste a tiempo y aseguras una reseña de 5 estrellas para el taller.',
    recomendacionPractica:
      'Pregunta si notó mejora en el manejo; esa simple pregunta demuestra profesionalismo superior.',
    accionTexto: 'Bitácora de Seguimiento',
  },
];

// ============================================================================
// 4. GUÍA PARA MECÁNICO (Órdenes asignadas, diagnóstico, checklist, refacciones, observaciones, finalización)
// ============================================================================
export const PASOS_GUIA_MECANICO: PasoGuia[] = [
  {
    id: 'mec-1-ordenes',
    numero: 1,
    titulo: 'Órdenes de trabajo asignadas',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    targetSelector: '[data-tour="nav-ordenes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Ver la lista de vehículos en taller asignados a tu bahía o nombre, con la fecha prometida de entrega.',
    queHacer:
      'Revisa tus órdenes "Por iniciar" o "En proceso". Da prioridad a las que tengan semáforo amarillo o rojo.',
    queSucedeDespues:
      'El sistema contabiliza tus tiempos de trabajo y productividad para comisiones o bonos.',
    recomendacionPractica:
      'Inicia el estatus "En proceso" en cuanto montes el auto a la rampa para registrar tiempos reales.',
    accionTexto: 'Ver mis órdenes',
  },
  {
    id: 'mec-2-diagnostico',
    numero: 2,
    titulo: 'Diagnóstico y asistencia técnica con IA',
    seccion: 'ordenes',
    seccionNombre: 'Diagnóstico',
    targetSelector: '[data-tour="ordenes-asistencia-ia"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Herramienta de apoyo para fallas difíciles: sugiere causas probables, pruebas con multímetro/escáner y piezas a cambiar.',
    queHacer:
      'En la orden, pulsa "Asistencia técnica con IA" e introduce los códigos OBD2 o síntomas mecánicos observados.',
    queSucedeDespues:
      'Recibes una guía técnica paso a paso con los valores estándar y precauciones específicas del motor.',
    recomendacionPractica:
      'Compara siempre el diagnóstico con las cartas de servicio del fabricante.',
    accionTexto: 'Abrir Asistencia Técnica',
    isNew: true,
  },
  {
    id: 'mec-3-checklist',
    numero: 3,
    titulo: 'Checklist inicial y puntos de seguridad',
    seccion: 'ordenes',
    seccionNombre: 'Checklist',
    targetSelector: '[data-tour="ordenes-checklist-tab"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Inventariar estado de carrocería, llantas, testigos encendidos y pertenencias antes de desarmar.',
    queHacer:
      'Marca los puntos del checklist: nivel de aceite, batería, luces y rayones previos en carrocería.',
    queSucedeDespues:
      'Protege al taller y a ti de reclamos injustificados por daños que el auto ya traía al entrar.',
    recomendacionPractica:
      'Si encuentras una fuga o pieza rota que no estaba en la orden, notifícalo de inmediato a recepción.',
    accionTexto: 'Consultar Checklist',
  },
  {
    id: 'mec-4-refacciones',
    numero: 4,
    titulo: 'Consumo y devolución de refacciones',
    seccion: 'ordenes',
    seccionNombre: 'Refacciones en orden',
    targetSelector: '[data-tour="ordenes-refacciones-box"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Cargar a la orden las piezas que realmente instalaste y devolver al almacén las que no se ocuparon.',
    queHacer:
      'Registra las piezas solicitadas. Si alguna no se usó, utiliza la función "Devolver refacción" para no cobrarla de más.',
    queSucedeDespues:
      'El inventario del taller se descuenta con precisión y el costo final de la orden queda exacto.',
    recomendacionPractica:
      'Guarda las refacciones usadas en la cajuela si el cliente solicitó ver las piezas sustituidas.',
    accionTexto: 'Gestionar Refacciones',
  },
  {
    id: 'mec-5-observaciones',
    numero: 5,
    titulo: 'Observaciones y recomendaciones técnicas',
    seccion: 'ordenes',
    seccionNombre: 'Observaciones',
    targetSelector: '[data-tour="ordenes-observaciones-area"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Dejar asentado qué ajustes especiales se hicieron (calibración, torque) y qué futuros servicios necesitará el auto.',
    queHacer:
      'Escribe notas claras: "Se calibraron bujías a 0.044 pulg.", "Amortiguadores traseros presentan inicio de fuga".',
    queSucedeDespues:
      'Estas notas se imprimen en el comprobante del cliente y alimentan el historial vehicular del coche.',
    recomendacionPractica:
      'Tus recomendaciones se convierten en futuras cotizaciones preventivas para el taller.',
    accionTexto: 'Anotar Observaciones',
  },
  {
    id: 'mec-6-finalizacion',
    numero: 6,
    titulo: 'Finalización del trabajo y entrega a calidad',
    seccion: 'ordenes',
    seccionNombre: 'Finalización',
    targetSelector: '[data-tour="ordenes-finalizar-btn"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Marcar la orden como terminada para que pase a inspección de calidad y cobro en recepción.',
    queHacer:
      'Verifica que todas las tuercas tengan su torque, retira protectores de asiento/volante y cambia el estado a "Terminado".',
    queSucedeDespues:
      'Recepción recibe aviso automático de que la unidad está lista para entrega y facturación.',
    recomendacionPractica:
      'Realiza una breve prueba de motor o vuelta a la manzana antes de dar por concluido el servicio.',
    accionTexto: 'Finalizar Orden',
  },
];

// ============================================================================
// 5. GUÍA PARA ADMINISTRADOR (Inventario, facturación, personal, reportes, configuración, permisos, respaldos)
// ============================================================================
export const PASOS_GUIA_ADMINISTRADOR: PasoGuia[] = [
  {
    id: 'adm-1-inventario',
    numero: 1,
    titulo: 'Control maestro de inventario',
    seccion: 'inventario',
    seccionNombre: 'Inventario',
    targetSelector: '[data-tour="nav-inventario"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Supervisar existencias, valor monetario total del almacén, costos promedio y márgenes de utilidad en refacciones.',
    queHacer:
      'Monitorea el valor del inventario, da de alta proveedores y define stocks mínimos para evitar desabastos.',
    queSucedeDespues:
      'Evitas compras de pánico o piezas estancadas con dinero parado en los anaqueles.',
    recomendacionPractica:
      'Realiza un conteo físico rápido cada 15 días de los 10 productos con mayor rotación.',
    accionTexto: 'Ir a Inventario',
  },
  {
    id: 'adm-2-facturacion',
    numero: 2,
    titulo: 'Facturación, cobros y flujo de caja',
    seccion: 'facturacion',
    seccionNombre: 'Facturación',
    targetSelector: '[data-tour="nav-facturacion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Auditar todos los ingresos del taller, facturas emitidas, cuentas por cobrar y conciliación bancaria.',
    queHacer:
      'Revisa que no existan facturas pendientes con más de 7 días sin cobrar y valida las referencias de pago bancarias.',
    queSucedeDespues:
      'Mantienes el flujo de caja sano para pago de nómina, refacciones y servicios del taller.',
    recomendacionPractica:
      'Revisa el balance de IVA trasladado mensualmente para planear pagos de impuestos con tu contador.',
    accionTexto: 'Auditar Facturación',
  },
  {
    id: 'adm-3-personal',
    numero: 3,
    titulo: 'Personal, asistencias y comisiones',
    seccion: 'personal-asistencia',
    seccionNombre: 'Personal y Asistencia',
    targetSelector: '[data-tour="nav-personal-asistencia"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Control de asistencia diaria, gafetes oficiales TUNNO con QR, sueldos base y cálculo de comisiones por orden.',
    queHacer:
      'Registra ingresos/salidas del personal, revisa órdenes completadas por cada mecánico y emite gafetes institucionales.',
    queSucedeDespues:
      'Pagas nóminas justas y transparentes basadas en el trabajo real completado por cada empleado.',
    recomendacionPractica:
      'Imprime el gafete oficial TUNNO para cada colaborador para proyectar una imagen 100% corporativa.',
    accionTexto: 'Gestionar Personal',
  },
  {
    id: 'adm-4-reportes',
    numero: 4,
    titulo: 'Métricas gerenciales y rentabilidad',
    seccion: 'reportes',
    seccionNombre: 'Reportes',
    targetSelector: '[data-tour="nav-reportes"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Tomar decisiones con datos duros: ticket promedio, margen neto, marcas de autos más atendidas y horas facturables.',
    queHacer:
      'Consulta los gráficos de ingresos vs. costos. Usa el botón "Análisis Gerencial con IA" para detectar tendencias.',
    queSucedeDespues:
      'Identificas qué servicios son los más rentables y cuáles generan pérdidas o retrabajos.',
    recomendacionPractica:
      'Establece una meta mensual de ticket promedio y compártela en la junta semanal con tu equipo.',
    accionTexto: 'Ver Reportes Gerenciales',
  },
  {
    id: 'adm-5-configuracion',
    numero: 5,
    titulo: 'Configuración general del taller',
    seccion: 'configuracion',
    seccionNombre: 'Configuración',
    targetSelector: '[data-tour="nav-configuracion"]',
    posicionPreferida: 'right',
    paraQueSirve:
      'Personalizar nombre comercial del taller, dirección, teléfono, IVA configurable, logos membretados y condiciones de servicio.',
    queHacer:
      'Asegúrate de que el RFC, teléfonos y dirección coincidan con los membretes impresos oficiales.',
    queSucedeDespues:
      'Todos los documentos (cotizaciones, órdenes, facturas) salen con la identidad visual corporativa de tu taller.',
    recomendacionPractica:
      'Mantén actualizadas las políticas de garantía para proteger legalmente a la empresa.',
    accionTexto: 'Abrir Configuración',
  },
  {
    id: 'adm-6-usuarios-permisos',
    numero: 6,
    titulo: 'Usuarios y control de accesos (RBAC)',
    seccion: 'configuracion',
    seccionNombre: 'Usuarios y Permisos',
    targetSelector: '[data-tour="config-usuarios-tab"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Asignar roles y contraseñas: Administrador, Recepción, Mecánico, Cotizador, Caja o Control de Calidad.',
    queHacer:
      'Crea cuentas individuales para cada empleado. Ningún mecánico debe tener acceso a facturación o reportes de utilidades.',
    queSucedeDespues:
      'Blindas la información financiera confidencial del taller y previenes modificaciones no autorizadas.',
    recomendacionPractica:
      'Desactiva inmediatamente el usuario de cualquier empleado que deje de laborar en el taller.',
    accionTexto: 'Configurar Usuarios',
  },
  {
    id: 'adm-7-respaldos',
    numero: 7,
    titulo: 'Respaldos y seguridad de la información',
    seccion: 'configuracion',
    seccionNombre: 'Respaldos',
    targetSelector: '[data-tour="config-respaldo-btn"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Exportar una copia de seguridad completa de la base de datos en formato JSON para restaurarla ante cualquier emergencia.',
    queHacer:
      'Pulsa "Descargar respaldo completo" al menos una vez por semana y guárdalo en una memoria externa o nube segura.',
    queSucedeDespues:
      'Tu taller nunca perderá el historial de clientes, órdenes ni facturas por fallas de equipo o caídas de internet.',
    recomendacionPractica:
      'Guarda una copia de respaldo cada viernes al finalizar el corte operativo.',
    accionTexto: 'Ir a Respaldos',
  },
];

// ============================================================================
// 6. EXPLICACIÓN DE FUNCIONES CON IA
// ============================================================================
export const PASOS_GUIA_IA: PasoGuia[] = [
  {
    id: 'ia-1-recepcion',
    numero: 1,
    titulo: 'Recepción inteligente de clientes',
    seccion: 'nueva-atencion',
    seccionNombre: 'Nueva atención',
    targetSelector: '[data-tour="nueva-atencion-ia-btn"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Convierte el relato desordenado del cliente ("hace un ruidito al frenar y vibra el volante") en un reporte técnico profesional.',
    queHacer:
      'Dicta o escribe las palabras del cliente. La IA clasifica los sistemas afectados (frenos, dirección) y sugiere revisiones.',
    queSucedeDespues:
      'El mecánico recibe una orden estructurada sin ambigüedades, agilizando el diagnóstico en un 40%.',
    recomendacionPractica:
      'Ideal cuando hay fila en recepción: capturas los puntos clave en menos de 30 segundos.',
    accionTexto: 'Probar Recepción IA',
    isNew: true,
  },
  {
    id: 'ia-2-asistencia-tecnica',
    numero: 2,
    titulo: 'Asistencia técnica en taller y diagnóstico',
    seccion: 'ordenes',
    seccionNombre: 'Órdenes de trabajo',
    targetSelector: '[data-tour="ordenes-asistencia-ia"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Copiloto para el mecánico ante códigos de falla OBD2 raros o fallas intermitentes complejas.',
    queHacer:
      'Dentro de la orden, pulsa "Asistencia técnica con IA". Ingresa síntomas o códigos DTC para recibir un plan de pruebas.',
    queSucedeDespues:
      'Sugiere causas raíz más probables, componentes a medir y refacciones compatibles recomendadas.',
    recomendacionPractica:
      'Ahorra horas de prueba y error en sistemas de inyección electrónica, sensores de oxígeno y transmisión.',
    accionTexto: 'Ver Asistencia Técnica',
    isNew: true,
  },
  {
    id: 'ia-3-analisis-cotizaciones',
    numero: 3,
    titulo: 'Análisis inteligente de cotizaciones',
    seccion: 'cotizaciones',
    seccionNombre: 'Cotizaciones',
    targetSelector: '[data-tour="cotizaciones-analisis-ia"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Evalúa la competitividad del presupuesto antes de presentarlo al cliente, analizando márgenes y probabilidad de cierre.',
    queHacer:
      'Al redactar la cotización, pulsa "Analizar con IA". El sistema califica si tus precios son acordes al mercado y sugiere mejoras.',
    queSucedeDespues:
      'Aumenta la tasa de cotizaciones aprobadas al no quedar ni muy caro ni perder margen de ganancia.',
    recomendacionPractica:
      'Revisa el balance entre mano de obra y refacciones sugerido por el modelo.',
    accionTexto: 'Probar Análisis Cotización',
    isNew: true,
  },
  {
    id: 'ia-4-analisis-gerencial',
    numero: 4,
    titulo: 'Análisis gerencial predictivo',
    seccion: 'reportes',
    seccionNombre: 'Reportes',
    targetSelector: '[data-tour="reportes-analisis-ia"]',
    posicionPreferida: 'bottom',
    paraQueSirve:
      'Lee todos los números del taller y te entrega un diagnóstico de negocio en lenguaje claro de dueño de taller.',
    queHacer:
      'En Reportes, abre "Análisis Gerencial con IA" para ver fortalezas, alertas de costos y oportunidades de crecimiento.',
    queSucedeDespues:
      'Te ayuda a fijar precios justos, optimizar tiempos muertos y premiar a los colaboradores más rentables.',
    recomendacionPractica:
      'Genera este reporte a fin de mes para planear las inversiones y compras de herramienta del siguiente periodo.',
    accionTexto: 'Ver Análisis Gerencial',
    isNew: true,
  },
];

// Catálogo general de guías
export const CATALOGO_GUIAS: Record<TipoGuia, DefinicionGuia> = {
  general: {
    id: 'general',
    nombre: 'Recorrido general',
    descripcionCorta: 'Conoce todas las áreas y el flujo operativo de TUNNO paso a paso (13 módulos).',
    iconoNombre: 'Compass',
    pasos: PASOS_RECORRIDO_GENERAL,
  },
  'flujo-cliente': {
    id: 'flujo-cliente',
    nombre: 'Flujo de un cliente',
    descripcionCorta: 'Paso a paso para atender a un cliente: desde su llegada hasta la entrega y cobro.',
    iconoNombre: 'UserCheck',
    pasos: PASOS_FLUJO_CLIENTE,
  },
  recepcion: {
    id: 'recepcion',
    nombre: 'Guía de recepción',
    descripcionCorta: 'Enfocada en mostrador: registro de clientes, autos, citas y presupuestos.',
    iconoNombre: 'ClipboardList',
    rolesPermitidos: ['Administrador', 'Recepción/CRM', 'Recepción'],
    pasos: PASOS_GUIA_RECEPCION,
  },
  mecanico: {
    id: 'mecanico',
    nombre: 'Guía para mecánico',
    descripcionCorta: 'Enfocada en bahía: órdenes asignadas, refacciones, checklist y finalización.',
    iconoNombre: 'Wrench',
    rolesPermitidos: ['Administrador', 'Técnico', 'Mecánico'],
    pasos: PASOS_GUIA_MECANICO,
  },
  administrador: {
    id: 'administrador',
    nombre: 'Guía para administrador',
    descripcionCorta: 'Finanzas, compras, personal, permisos de usuarios y respaldos de seguridad.',
    iconoNombre: 'ShieldCheck',
    rolesPermitidos: ['Administrador'],
    pasos: PASOS_GUIA_ADMINISTRADOR,
  },
  ia: {
    id: 'ia',
    nombre: 'Explicación de funciones con IA',
    descripcionCorta: 'Descubre cómo la IA te ayuda en recepción, diagnóstico técnico y reportes.',
    iconoNombre: 'Sparkles',
    pasos: PASOS_GUIA_IA,
  },
  nuevos: {
    id: 'nuevos',
    nombre: 'Novedades y pasos nuevos',
    descripcionCorta: 'Consulta únicamente las nuevas funciones y mejoras añadidas recientemente.',
    iconoNombre: 'Zap',
    pasos: [
      ...PASOS_RECORRIDO_GENERAL.filter((p) => p.isNew),
      ...PASOS_GUIA_IA,
    ],
  },
};

// ============================================================================
// HELPERS DE LOCALSTORAGE Y PROGRESO
// ============================================================================
const STORAGE_PROGRESO_KEY = 'tunno_guia_progreso_v1';
const STORAGE_PREFS_KEY = 'tunno_guia_preferencias_v1';

export interface ProgresoGuiaStorage {
  tipoGuia: TipoGuia;
  pasoActual: number;
  fechaUltimaActualizacion: string;
  completada: boolean;
}

export interface PreferenciasGuiaStorage {
  noMostrarBienvenida: boolean;
  ultimaVersionVista: string;
}

export function guardarProgresoGuia(tipoGuia: TipoGuia, pasoActual: number, completada = false): void {
  try {
    const data: ProgresoGuiaStorage = {
      tipoGuia,
      pasoActual,
      fechaUltimaActualizacion: new Date().toISOString(),
      completada,
    };
    localStorage.setItem(STORAGE_PROGRESO_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error guardando progreso de guía:', err);
  }
}

export function obtenerProgresoGuia(): ProgresoGuiaStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function limpiarProgresoGuia(): void {
  try {
    localStorage.removeItem(STORAGE_PROGRESO_KEY);
  } catch (err) {
    // Ignore
  }
}

export function guardarPreferenciasGuia(prefs: Partial<PreferenciasGuiaStorage>): void {
  try {
    const actual = obtenerPreferenciasGuia();
    const nueva = { ...actual, ...prefs };
    localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(nueva));
  } catch (err) {
    // Ignore
  }
}

export function obtenerPreferenciasGuia(): PreferenciasGuiaStorage {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (!raw) {
      return { noMostrarBienvenida: false, ultimaVersionVista: '1.0' };
    }
    return JSON.parse(raw);
  } catch (err) {
    return { noMostrarBienvenida: false, ultimaVersionVista: '1.0' };
  }
}
