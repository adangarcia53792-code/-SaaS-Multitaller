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
  | 'Respaldos';

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
}

export interface Vehiculo {
  id: string;
  clienteId: string;
  marca: string;
  modelo: string;
  placas: string;
  año?: string;
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
