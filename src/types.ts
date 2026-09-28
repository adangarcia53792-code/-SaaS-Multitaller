export type SectionId =
  | 'dashboard'
  | 'nueva-atencion'
  | 'clientes'
  | 'vehiculos'
  | 'citas'
  | 'ordenes'
  | 'cotizaciones'
  | 'calendario'
  | 'servicios'
  | 'inventario';

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
  costoUnitario?: number;
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
  importeRefacciones: number;
  importeManoObra: number;
  total: number;
  activo: boolean; // Activo o Inactivo
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
  creadoEn: string;
}
