export type SectionId =
  | 'dashboard'
  | 'nueva-atencion'
  | 'clientes'
  | 'vehiculos'
  | 'flotillas'
  | 'historial-vehicular'
  | 'citas'
  | 'ordenes'
  | 'cotizaciones'
  | 'calendario'
  | 'servicios'
  | 'inventario'
  | 'facturacion'
  | 'personal-asistencia'
  | 'atencion-asistida'
  | 'reportes'
  | 'prospectos'
  | 'garantias'
  | 'bitacora'
  | 'configuracion';

export type MotivoAtencion =
  | 'consulta_servicio'
  | 'seguimiento_cotizacion'
  | 'recordatorio_cita'
  | 'avance_reparacion'
  | 'proximo_mantenimiento';

export type EstadoSeguimiento = 'Pendiente' | 'Realizado' | 'Cancelado';

export interface Seguimiento {
  id: string;
  clienteId: string;
  vehiculoId?: string;
  prospectoId?: string;
  prospectoNombre?: string;
  motivo: MotivoAtencion | string;
  motivoLabel: string;
  registroTipo?: 'servicio' | 'cotizacion' | 'cita' | 'orden' | 'mantenimiento' | 'prospecto';
  registroId?: string;
  registroRef?: string;
  mensaje: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  estado: EstadoSeguimiento;
  creadoEn: string;
}

export type EstadoProspecto =
  | 'Nuevo'
  | 'Contactado'
  | 'Sin respuesta'
  | 'Cita agendada'
  | 'No interesado'
  | 'Convertido en cliente';

export type OrigenProspecto =
  | 'Recomendación'
  | 'Redes sociales'
  | 'Llamada'
  | 'Visita'
  | 'Otro';

export interface HistorialProspectoItem {
  id: string;
  fechaHora: string;
  tipo: 'creacion' | 'estado' | 'nota' | 'seguimiento' | 'conversion';
  descripcion: string;
}

export interface Prospecto {
  id: string;
  nombre: string;
  telefono: string;
  correo?: string;
  servicioInteres?: string;
  origen: OrigenProspecto;
  estado: EstadoProspecto;
  notas?: string;
  fechaContacto: string; // YYYY-MM-DD
  proximaAccionFecha?: string; // YYYY-MM-DD
  proximaAccionHora?: string; // HH:MM
  proximaAccionNota?: string;
  clienteId?: string;
  seguimientoId?: string;
  historial: HistorialProspectoItem[];
  creadoEn: string;
}

export interface RespuestaSesion {
  id: string;
  clienteId: string;
  clienteNombre: string;
  motivo: string;
  texto: string;
  fechaHora: string;
  registroRef?: string;
}

export interface ConfiguracionTaller {
  nombre: string;
  telefono?: string;
  direccion?: string;
}

export type RolUsuario =
  | 'Administrador'
  | 'Recepción/CRM'
  | 'Cotizador'
  | 'Técnico'
  | 'Control de calidad'
  | 'Caja'
  | 'Recepción'
  | 'Mecánico';

export const ROLES_SISTEMA: { rol: RolUsuario; descripcion: string; permisos: string[] }[] = [
  {
    rol: 'Administrador',
    descripcion: 'Acceso completo a todas las secciones y administración del taller.',
    permisos: ['Acceso completo', 'Usuarios y permisos', 'Configuración general'],
  },
  {
    rol: 'Recepción/CRM',
    descripcion: 'Clientes, vehículos, citas, prospectos, seguimientos y creación inicial de órdenes.',
    permisos: ['Clientes', 'Vehículos', 'Citas', 'Prospectos', 'Seguimientos', 'Creación inicial de órdenes'],
  },
  {
    rol: 'Cotizador',
    descripcion: 'Servicios, refacciones y elaboración de cotizaciones.',
    permisos: ['Servicios', 'Refacciones', 'Elaboración de cotizaciones'],
  },
  {
    rol: 'Técnico',
    descripcion: 'Diagnóstico y actualización de órdenes asignadas.',
    permisos: ['Diagnóstico de órdenes asignadas', 'Actualización de órdenes', 'Refacciones utilizadas'],
  },
  {
    rol: 'Control de calidad',
    descripcion: 'Revisión, aprobación o rechazo de trabajos terminados.',
    permisos: ['Revisión de trabajos terminados', 'Aprobación / rechazo', 'Inspección de garantías'],
  },
  {
    rol: 'Caja',
    descripcion: 'Facturas, pagos y consulta del resumen de la orden.',
    permisos: ['Facturas', 'Pagos', 'Consulta del resumen de la orden'],
  },
];

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string; // Correo o nombre de usuario
  password?: string; // Contraseña demo local
  rol: RolUsuario;
  activo: boolean;
  empleadoId?: string; // Vinculación opcional con Empleado (Mecánico)
  creadoEn: string;
}

export interface SesionUsuario {
  usuarioId: string;
  nombre: string;
  usuario: string;
  rol: RolUsuario;
  empleadoId?: string;
  recordar: boolean;
  inicioEn: string;
}

export interface Empleado {
  id: string;
  codigoQr: string;
  nombre: string;
  puesto: string;
  activo: boolean; // Activo o Inactivo
  fechaAlta: string;
}

export type TipoAsistencia = 'Entrada' | 'Salida';

export interface RegistroAsistencia {
  id: string;
  empleadoId: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  tipo: TipoAsistencia;
  fechaHora: string;
}

export type EstadoFactura = 'Pendiente' | 'Pagada' | 'Cancelada';

export interface PagoFactura {
  metodoPago: string;
  fechaPago: string;
  monto?: number;
  referencia?: string;
  notas?: string;
}

export interface Factura {
  id: string;
  folio: string;
  cotizacionId: string;
  cotizacionFolio: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteCorreo?: string;
  razonSocial?: string;
  rfc?: string;
  usoCfdi?: string;
  formaPago?: string;
  metodoPagoSat?: string;
  subtotal?: number;
  iva?: number;
  total: number;
  vehiculoId: string;
  vehiculoDesc: string;
  vehiculoPlacas: string;
  descripcion: string;
  importeRefacciones: number;
  importeManoObra: number;
  estado: EstadoFactura;
  fechaCreacion: string;
  pago?: PagoFactura;
  motivoCancelacion?: string;
  fechaCancelacion?: string;
}

export interface RespaldoDemo {
  version: string;
  fechaExportacion: string;
  configuracion: ConfiguracionTaller;
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  servicios: ServicioCatalogo[];
  refacciones: Refaccion[];
  movimientos: MovimientoInventario[];
  facturas?: Factura[];
  empleados?: Empleado[];
  asistencias?: RegistroAsistencia[];
  seguimientos?: Seguimiento[];
  prospectos?: Prospecto[];
  garantias?: Garantia[];
  bitacora?: EventoBitacora[];
  flotillas?: Flotilla[];
  ordenesCompra?: OrdenCompra[];
}

export type SeccionBitacora =
  | 'Clientes'
  | 'Vehículos'
  | 'Flotillas'
  | 'Citas'
  | 'Cotizaciones'
  | 'Órdenes'
  | 'Servicios'
  | 'Inventario'
  | 'Facturación'
  | 'Garantías'
  | 'Configuración'
  | 'Usuarios'
  | 'Respaldos'
  | 'Copiloto IA'
  | 'Asistente IA';

export interface DetalleCambioBitacora {
  etiqueta: string;
  anterior?: string;
  nuevo?: string;
}

export interface EventoBitacora {
  id: string;
  fechaHora: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioRol: RolUsuario;
  tipoAccion: string;
  seccion: SeccionBitacora;
  registroId?: string;
  registroFolio?: string;
  descripcion: string;
  detalles?: DetalleCambioBitacora[];
}

export type EstadoGarantia = 'Vigente' | 'Vencida' | 'Aplicada' | 'Cancelada';

export interface AplicacionGarantia {
  motivoRegreso: string;
  observaciones?: string;
  fecha: string; // YYYY-MM-DD
  nuevaOrdenId: string;
  nuevaOrdenFolio: string;
  fechaAplicacion: string;
}

export interface CancelacionGarantia {
  motivo: string;
  fechaCancelacion: string;
}

export interface ObservacionMecanicoGarantia {
  id: string;
  mecanicoNombre: string;
  texto: string;
  fechaHora: string;
}

export interface Garantia {
  id: string;
  folio: string; // Ej. GAR-001
  ordenId: string;
  ordenFolio: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono?: string;
  vehiculoId: string;
  vehiculoDescripcion: string;
  vehiculoPlacas: string;
  mecanicoId?: string;
  mecanicoNombre?: string;
  trabajoCubierto: string; // Copia del trabajo cubierto
  fechaInicio: string; // YYYY-MM-DD
  duracionDias: number; // Ej. 30, 60, 90, 180
  fechaVencimiento: string; // YYYY-MM-DD
  condiciones: string; // Condiciones o alcance
  estado: EstadoGarantia;
  aplicacion?: AplicacionGarantia;
  cancelacion?: CancelacionGarantia;
  observacionesMecanico?: ObservacionMecanicoGarantia[];
  creadoEn: string;
}

export type TipoMovimiento = 'Entrada' | 'Salida';

export interface MovimientoInventario {
  id: string;
  refaccionId: string;
  tipo: TipoMovimiento;
  cantidad: number; // entero positivo
  motivo: string;
  fechaHora: string;
  ordenId?: string;
}

export interface Refaccion {
  id: string;
  codigo: string;
  nombre: string;
  existencias: number;
  minimo: number;
  costoUnitario?: number; // legacy alias de precioCompra
  precioCompra: number; // Precio de compra
  precioVenta: number; // Precio de venta
  proveedor?: string;
  telefonoProveedor?: string;
  fechaUltimaCompra?: string; // YYYY-MM-DD
  diasEntregaEstimados?: number;
  compatibilidad?: string; // Marcas, modelos y años compatibles
  creadoEn: string;
}

export type EstadoOrdenCompra = 'Pendiente' | 'Recibida';

export interface OrdenCompra {
  id: string;
  folio: string; // OC-001
  refaccionId: string;
  refaccionNombre: string;
  refaccionCodigo?: string;
  cantidad: number;
  proveedor: string;
  telefonoProveedor?: string;
  fecha: string; // YYYY-MM-DD
  costoUnitario: number;
  total: number;
  estado: EstadoOrdenCompra;
  recibidaEn?: string;
  notas?: string;
  creadoEn: string;
}

export interface RefaccionUtilizadaOrden {
  id: string;
  refaccionId: string;
  cantidad: number;
  devueltas: number;
  fechaHora: string;
}

export interface ServicioCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
  // Costos internos de taller
  costoRefacciones: number;
  costoManoObra: number;
  // Precios de venta al público
  importeRefacciones: number;
  importeManoObra: number;
  total: number;
  activo: boolean; // Activo o Inactivo
  creadoEn: string;
}

export type EstadoFlotilla = 'Activa' | 'Inactiva';

export interface Flotilla {
  id: string;
  nombre: string; // Nombre de la flotilla
  empresa: string; // Empresa o razón social
  contacto: string; // Persona de contacto
  telefono: string; // Teléfono
  correo?: string; // Correo electrónico
  notas?: string; // Notas adicionales
  estado: EstadoFlotilla; // 'Activa' | 'Inactiva'
  vehiculoIds: string[]; // IDs de vehículos asignados
  creadoEn: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  correo?: string;
  rfc?: string;
}

export interface Vehiculo {
  id: string;
  clienteId: string;
  marca: string;
  modelo: string;
  placas: string;
  año?: string;
  kilometraje?: number | string;
  color?: string;
  recomendacionesMantenimiento?: string[];
  proximoServicioFecha?: string; // YYYY-MM-DD
  proximoServicioKm?: number | string;
  ultimoPlanMantenimiento?: string;
}

export interface Cita {
  id: string;
  clienteId: string;
  vehiculoId: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: 'Programada' | 'Cancelada';
  creadoEn: string;
}

export interface AutorizacionRegistro {
  autorizadoPor: string;
  fechaHora: string;
  trabajoAutorizado: string;
  totalAutorizado: number;
}

export interface Cotizacion {
  id: string;
  folio: string;
  clienteId: string;
  vehiculoId: string;
  ordenId?: string;
  descripcion: string;
  importeRefacciones: number;
  importeManoObra: number;
  total: number;
  estado: 'Por autorizar' | 'Aprobada' | 'Rechazada';
  autorizacion?: AutorizacionRegistro;
  historialAutorizaciones?: AutorizacionRegistro[];
  creadoEn: string;
  // Metadata de Copiloto IA:
  creadaConIA?: boolean;
  propuestaTipo?: 'Esencial' | 'Recomendada' | 'Completa';
  diagnosticoSugerido?: string;
  costoEstimadoCompra?: number;
  utilidadEstimada?: number;
  margenEstimadoPorcentaje?: number;
  partidasDetalladas?: PartidaCotizacionIA[];
}

export interface PartidaCotizacionIA {
  id: string;
  tipo: 'servicio' | 'refaccion';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  urgente: boolean; // Urgente vs Preventivo
  motivoExplicacion: string;
  refaccionId?: string;
  stockDisponible?: number;
  alertaStockBajo?: boolean;
  alertaMargenBajo?: boolean;
  alertaPrecioAtipico?: boolean;
}

export type TipoPropuestaIA = 'Esencial' | 'Recomendada' | 'Completa';

export interface PropuestaCotizacionIA {
  tipo: TipoPropuestaIA;
  titulo: string;
  descripcionCorta: string;
  diagnosticoPreliminar: string;
  revisionesNecesarias: string[];
  partidas: PartidaCotizacionIA[];
  importeManoObra: number;
  importeRefacciones: number;
  subtotal: number;
  iva: number;
  total: number;
  costoCompraTotal: number;
  utilidadEstimada: number;
  margenPorcentaje: number;
  advertencias: string[];
  explicacionGeneral: string;
}

export type EstadoOrden = 'Por autorizar' | 'Pendiente' | 'En proceso' | 'Terminado';

export interface OrdenTrabajo {
  id: string;
  folio: string;
  clienteId: string;
  vehiculoId: string;
  cotizacionId?: string;
  servicio: string;
  kilometraje?: string;
  dañosVisibles?: string;
  diagnostico?: string;
  observacionesMecanico?: string;
  trabajoTerminado?: boolean;
  revisionFinal?: boolean;
  entregado?: boolean;
  fechaHoraEntrega?: string;
  observaciones?: string;
  sintomasCliente?: string;
  refaccionesUtilizadas?: RefaccionUtilizadaOrden[];
  estado: EstadoOrden;
  mecanicoId?: string;
  mecanicoNombre?: string;
  fechaEntregaPrometida?: string; // YYYY-MM-DD
  // Costeo real y rentabilidad:
  costoRealRefacciones?: number;
  costoRealManoObra?: number;
  costoRealTotal?: number;
  precioCobrado?: number;
  utilidadReal?: number;
  margenRealPorcentaje?: number;
  codigoConsulta?: string;
  mensajePublico?: string;
  actualizadoEn?: string;
  creadoEn: string;
}

export const generarCodigoConsulta = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export type NivelAviso = 'Información' | 'Atención' | 'Urgente';

export interface AvisoPendiente {
  id: string; // ID único para control de visto temporal
  tipo: string;
  titulo: string;
  descripcion: string;
  fechaHoraRelacionada: string;
  nivel: NivelAviso;
  seccionDestino: SectionId;
  registroId?: string;
  esHoy?: boolean;
  esUrgente?: boolean;
}

// Asistencia Técnica con IA (Órdenes de Trabajo)
export interface ItemChecklistTecnico {
  id: string;
  item: string;
  sistema: string;
  completado?: boolean;
  observacion?: string;
}

export interface PosibleCausaTecnica {
  causa: string;
  sistema: string;
  explicacion: string;
}

export interface PuntoRevisionTecnica {
  sistema: string;
  componente: string;
  motivo: string;
}

export interface PreguntaClienteTecnica {
  pregunta: string;
  razon: string;
  dirigidoA: 'recepcion' | 'mecanico' | 'ambos';
}

export interface ResultadoAsistenciaTecnica {
  resumenProblema: string;
  sintomasOrganizados: string[];
  posiblesCausas: PosibleCausaTecnica[];
  prioridad: 'baja' | 'media' | 'alta';
  justificacionPrioridad: string;
  puntosRevision: PuntoRevisionTecnica[];
  preguntasCliente: PreguntaClienteTecnica[];
  checklistTecnico: ItemChecklistTecnico[];
  datosFaltantes: string[];
  diagnosticoSugerido: string;
  explicacionCliente: string;
  advertenciaRegla: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  errorDetalle?: string;
}

// ========================================================
// ANÁLISIS DE INVENTARIO CON IA (ETAPA INVENTARIO IA)
// ========================================================
export type PrioridadRecomendacionInventario = 'urgente' | 'proxima' | 'preventiva';

export interface RefaccionAtencionIA {
  refaccionId: string;
  codigo: string;
  nombre: string;
  existencias: number;
  minimo: number;
  estadoStock: 'agotado' | 'stock_bajo' | 'proximo_minimo';
  motivo: string;
}

export interface CompraRecomendadaIA {
  refaccionId: string;
  codigo: string;
  nombre: string;
  cantidadSugerida: number;
  motivo: string;
  prioridad: PrioridadRecomendacionInventario;
  precioCompraEstimado: number;
  proveedorSugerido?: string;
  telefonoProveedor?: string;
  diasEntregaEstimados?: number;
}

export interface ImpactoTallerIA {
  ordenId?: string;
  folioOrden?: string;
  vehiculoDesc?: string;
  servicioDesc?: string;
  estadoOrden?: string;
  refaccionAfectada: string;
  descripcionImpacto: string;
  nivelRiesgo: 'alto' | 'medio' | 'bajo';
}

export interface PrecioMargenAlertaIA {
  refaccionId: string;
  codigo: string;
  nombre: string;
  precioCompra: number;
  precioVenta: number;
  margenPorcentaje: number;
  tipoProblema: 'sin_precio_compra' | 'sin_precio_venta' | 'margen_bajo' | 'precio_incongruente';
  detalle: string;
  sugerencia: string;
}

export interface ProveedorSugeridoIA {
  proveedor: string;
  telefono?: string;
  diasEntrega?: number;
  refaccionesDisponibles: string[];
  motivoSugerencia: string;
  nivelConfianza: 'alto' | 'medio' | 'regular';
}

export interface ResultadoAnalisisInventarioIA {
  resumenGeneral: string;
  refaccionesAtencion: RefaccionAtencionIA[];
  comprasRecomendadas: CompraRecomendadaIA[];
  prioridades: {
    urgentes: number;
    proximas: number;
    preventivas: number;
  };
  impactoEnTaller: ImpactoTallerIA[];
  preciosMargenAlertas: PrecioMargenAlertaIA[];
  proveedoresSugeridos: ProveedorSugeridoIA[];
  resumenParaCompraTexto: string;
  datosFaltantes: string[];
  advertenciaRegla: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  errorDetalle?: string;
}

// ========================================================
// ANÁLISIS GERENCIAL CON IA (ETAPA REPORTES IA)
// ========================================================
export type PeriodoAnalisisGerencial = 'hoy' | 'ultimos_7_dias' | 'este_mes' | 'personalizado';

export interface IndicadoresGerenciales {
  // Ingresos
  ingresosCobrados: number;
  ingresosPendientes: number;
  ingresosTotales: number;
  // Costos y margen
  costoRefacciones: number;
  costoManoObra: number;
  costosTotales: number;
  margenEstimadoPesos: number;
  margenEstimadoPorcentaje: number;
  // Cotizaciones
  cotizacionesTotales: number;
  cotizacionesAprobadas: number;
  cotizacionesRechazadas: number;
  cotizacionesPendientes: number;
  tasaConversionCotizaciones: number; // Porcentaje 0 - 100
  // Órdenes
  ordenesTotales: number;
  ordenesTerminadas: number;
  ordenesEnProceso: number;
  ordenesAtrasadas: number;
  tiempoPromedioAtencionDias: number;
  // Productividad por técnico
  productividadTecnicos: {
    tecnico: string;
    asignadas: number;
    terminadas: number;
    eficienciaPorcentaje: number;
  }[];
  // Refacciones destacadas
  refaccionesMayorMovimiento: {
    nombre: string;
    codigo: string;
    unidadesMovidas: number;
  }[];
  // Clientes
  clientesAtendidos: number;
  clientesNuevos: number;
  clientesRecurrentes: number;
  // Seguimientos
  seguimientosPendientes: number;
  // Garantías
  garantiasRegistradas: number;
  tasaGarantiasPorcentaje: number;
}

export interface RecomendacionGerencialIA {
  prioridad: number; // 1 a 5
  titulo: string;
  accion: string;
  area: 'Ingresos' | 'Operación' | 'Ventas' | 'Inventario' | 'Calidad';
  impactoEsperado: string;
}

export interface ComparacionPeriodoAnteriorIA {
  disponible: boolean;
  periodoAnteriorNombre: string;
  resumenComparativa: string;
  cambioIngresosPorcentaje?: number;
  cambioOrdenesPorcentaje?: number;
  cambioConversionPorcentaje?: number;
  diferenciaMargenPorcentaje?: number;
  motivoSiNoDisponible?: string;
}

export interface ResultadoAnalisisGerencialIA {
  periodoSeleccionado: PeriodoAnalisisGerencial;
  etiquetaPeriodo: string;
  rangoFechas: {
    desde: string;
    hasta: string;
  };
  resumenEjecutivo: string;
  aspectosPositivos: string[];
  situacionesAtencion: string[];
  recomendaciones: RecomendacionGerencialIA[];
  indicadores: IndicadoresGerenciales;
  comparacion: ComparacionPeriodoAnteriorIA;
  resumenParaCompartir: string;
  datosFaltantes: string[];
  advertenciaRegla: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  errorDetalle?: string;
}

// ========================================================
// PLAN DE MANTENIMIENTO CON IA (VEHÍCULOS E HISTORIAL)
// ========================================================
export type EstadoMantenimientoGeneral = 'Al corriente' | 'Próximo' | 'Vencido';
export type PrioridadPlanMantenimiento = 'Baja' | 'Media' | 'Alta';

export interface ServicioRecomendadoPlan {
  id: string;
  servicio: string;
  sistema: string; // Motor, Frenos, Suspensión, Transmisión, etc.
  prioridad: PrioridadPlanMantenimiento;
  fechaSugerida: string; // YYYY-MM-DD
  kilometrajeSugerido?: string;
  justificacion: string;
}

export interface ItemPlanResumido {
  id: string;
  orden: number;
  servicio: string;
  fechaSugerida: string;
  kilometrajeSugerido: string;
  prioridad: PrioridadPlanMantenimiento;
  accionSugerida: string;
}

export interface ResultadoPlanMantenimiento {
  estadoGeneral: EstadoMantenimientoGeneral;
  justificacionEstadoGeneral: string;
  serviciosRecomendados: ServicioRecomendadoPlan[];
  prioridadGlobal: PrioridadPlanMantenimiento;
  fechaSugeridaRevision: string;
  kilometrajeSugeridoRevision: string;
  justificacionGeneral: string;
  datosFaltantes: string[];
  mensajeRecordatorioWhatsApp: string;
  planResumido: ItemPlanResumido[];
  avisoResponsabilidad: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  generadoEn: string;
}

// ========================================================
// REVISIÓN FINAL CON IA (ÓRDENES DE TRABAJO TERMINADAS)
// ========================================================
export type EstadoEntregaRevisionFinal =
  | 'Lista para entregar'
  | 'Requiere revisión'
  | 'Incompleta';

export interface DiferenciaRevisionFinal {
  tipo: 'trabajo_no_autorizado' | 'concepto_no_terminado' | 'costo_diferente' | 'otra';
  titulo: string;
  descripcion: string;
  gravedad: 'alta' | 'media' | 'baja';
}

export interface PendienteImportanteRevisionFinal {
  categoria: 'Facturación' | 'Pago' | 'Control de calidad' | 'Firma' | 'Refacciones' | 'General';
  descripcion: string;
  resuelto: boolean;
}

export interface RecomendacionMantenimientoRevisionFinal {
  servicio: string;
  fechaSugerida?: string;
  kilometrajeSugerido?: string;
  motivo: string;
}

export interface ResultadoRevisionFinalIA {
  estadoEntrega: EstadoEntregaRevisionFinal;
  justificacionEstado: string;
  datosFaltantes: string[];
  diferencias: DiferenciaRevisionFinal[];
  pendientesImportantes: PendienteImportanteRevisionFinal[];
  resumenCliente: string;
  recomendacionesMantenimiento: RecomendacionMantenimientoRevisionFinal[];
  mensajeEntregaWhatsApp: string;
  garantiaAplicableTexto: string;
  responsableRevision: {
    nombre: string;
    rol: string;
    fechaRevision: string;
  };
  avisoResponsabilidad: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  generadoEn: string;
}

// ========================================================
// SEGUIMIENTO INTELIGENTE CON IA (SECCIÓN SEGUIMIENTOS)
// ========================================================
export type CasoSeguimientoInteligente =
  | 'confirmar_funcionamiento'
  | 'solicitar_valoracion'
  | 'recordar_mantenimiento'
  | 'seguimiento_cotizacion'
  | 'consultar_factura'
  | 'detectar_garantia'
  | 'recuperar_cliente'
  | 'auto_detectar';

export type PrioridadSeguimiento = 'Baja' | 'Media' | 'Alta';
export type TonoSeguimiento = 'cordial' | 'formal' | 'directo';

export interface AlertaGarantiaSeguimiento {
  requiereGarantia: boolean;
  titulo?: string;
  explicacion?: string;
  trabajoRelacionado?: string;
  recomiendaRevisionFisica: boolean;
}

export interface ResultadoSeguimientoInteligenteIA {
  casoDetectado: CasoSeguimientoInteligente;
  casoTitulo: string;
  motivoRecomendado: string;
  prioridad: PrioridadSeguimiento;
  fechaSugerida: string;
  horaSugerida?: string;
  mensajeWhatsApp: string;
  mensajesPorTono: {
    cordial: string;
    formal: string;
    directo: string;
  };
  preguntasRecomendadas: string[];
  proximaAccion: string;
  alertaGarantia: AlertaGarantiaSeguimiento;
  resumenContexto: string;
  avisoDemostracion: string;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
  generadoEn: string;
}
