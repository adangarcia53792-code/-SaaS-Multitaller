import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Car,
  Calendar,
  Wrench,
  FileText,
  Menu,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Pencil,
  ChevronDown,
  ChevronUp,
  Layers,
  Package,
  CalendarDays,
  MoreVertical,
  History,
  Settings,
  Receipt,
  UserCheck,
  Sparkles,
  BarChart3,
  UserPlus,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Lock,
  Building2,
  CheckCircle,
  Bell,
  Truck,
} from 'lucide-react';
import {
  SectionId,
  Cliente,
  Vehiculo,
  Flotilla,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  ServicioCatalogo,
  Refaccion,
  MovimientoInventario,
  OrdenCompra,
  RefaccionUtilizadaOrden,
  ConfiguracionTaller,
  RespaldoDemo,
  Factura,
  Empleado,
  RegistroAsistencia,
  Seguimiento,
  Prospecto,
  Usuario,
  SesionUsuario,
  RolUsuario,
  Garantia,
  EventoBitacora,
  SeccionBitacora,
  DetalleCambioBitacora,
  AvisoPendiente,
  NivelAviso,
} from './types';
import { CitasSection } from './components/CitasSection';
import { NuevaAtencionSection } from './components/NuevaAtencionSection';
import { CotizacionesSection } from './components/CotizacionesSection';
import { OrdenesSection } from './components/OrdenesSection';
import { ServiciosSection } from './components/ServiciosSection';
import { InventarioSection } from './components/InventarioSection';
import { CalendarioSection } from './components/CalendarioSection';
import { HistorialModal } from './components/HistorialModal';
import { ConfiguracionSection } from './components/ConfiguracionSection';
import { DashboardSection } from './components/DashboardSection';
import { FacturacionSection } from './components/FacturacionSection';
import { PersonalAsistenciaSection } from './components/PersonalAsistenciaSection';
import { AtencionAsistidaSection } from './components/AtencionAsistidaSection';
import { ReportesSection } from './components/ReportesSection';
import { ProspectosSection } from './components/ProspectosSection';
import { GarantiasSection } from './components/GarantiasSection';
import { BitacoraSection } from './components/BitacoraSection';
import { FlotillasSection } from './components/FlotillasSection';
import { HistorialVehicularSection } from './components/HistorialVehicularSection';
import { LoginView } from './components/LoginView';
import { CentroAvisosDrawer } from './components/CentroAvisosDrawer';
import { IotLogo } from './components/IotLogo';
import { useModalDismiss, notifySectionChange } from './hooks/useModalDismiss';

interface MenuItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_LEVEL_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nueva-atencion', label: 'Nueva atención', icon: PlusCircle },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'vehiculos', label: 'Vehículos', icon: Car },
  { id: 'flotillas', label: 'Flotillas', icon: Truck },
  { id: 'historial-vehicular', label: 'Historial vehicular', icon: History },
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'ordenes', label: 'Órdenes de trabajo', icon: Wrench },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
];

const CATALOGOS_ITEMS: MenuItem[] = [
  { id: 'servicios', label: 'Servicios', icon: Layers },
  { id: 'inventario', label: 'Inventario', icon: Package },
];

const ADMINISTRACION_ITEMS: MenuItem[] = [
  { id: 'facturacion', label: 'Facturación', icon: Receipt },
  { id: 'personal-asistencia', label: 'Personal y asistencia', icon: UserCheck },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'prospectos', label: 'Prospectos', icon: UserPlus },
  { id: 'garantias', label: 'Garantías', icon: ShieldCheck },
  { id: 'bitacora', label: 'Bitácora', icon: ClipboardList },
];

const CONFIGURACION_ITEMS: MenuItem[] = [
  { id: 'configuracion', label: 'Configuración', icon: Settings },
  { id: 'atencion-asistida', label: 'Atención asistida', icon: Sparkles },
];

const ALL_MENU_ITEMS: MenuItem[] = [
  ...TOP_LEVEL_MENU_ITEMS,
  ...CATALOGOS_ITEMS,
  ...ADMINISTRACION_ITEMS,
  ...CONFIGURACION_ITEMS,
];

const MENU_ITEMS = ALL_MENU_ITEMS;

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'Carlos Mendoza',
    telefono: '555-123-4567',
    correo: 'carlos.mendoza@email.com',
  },
  {
    id: 'cli-2',
    nombre: 'Lucía Fernández',
    telefono: '555-987-6543',
    correo: 'lucia.fernandez@email.com',
  },
];

const INITIAL_VEHICULOS: Vehiculo[] = [
  {
    id: 'veh-1',
    clienteId: 'cli-1',
    marca: 'Toyota',
    modelo: 'Corolla',
    año: '2020',
    placas: 'ABC-123',
  },
  {
    id: 'veh-2',
    clienteId: 'cli-2',
    marca: 'Nissan',
    modelo: 'Versa',
    año: '2022',
    placas: 'XYZ-789',
  },
];

const getHoyDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAyerDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEnDiasDateString = (dias: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_CITAS: Cita[] = [
  {
    id: 'cita-init-1',
    clienteId: 'cli-1',
    vehiculoId: 'veh-1',
    servicio: 'Afinación mayor y cambio de aceite sintético',
    fecha: getHoyDateString(),
    hora: '10:00',
    estado: 'Programada',
    creadoEn: '2026-09-28T10:00:00Z',
  },
  {
    id: 'cita-init-2',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    servicio: 'Revisión preventiva de frenos y niveles',
    fecha: getEnDiasDateString(3),
    hora: '15:30',
    estado: 'Programada',
    creadoEn: '2026-09-28T11:00:00Z',
  },
];

const INITIAL_COTIZACIONES: Cotizacion[] = [
  {
    id: 'cot-init-1',
    folio: 'COT-001',
    clienteId: 'cli-1',
    vehiculoId: 'veh-1',
    descripcion: 'Cambio de balatas delanteras y rectificado de discos',
    importeRefacciones: 1450,
    importeManoObra: 800,
    total: 2250,
    estado: 'Por autorizar',
    creadoEn: '2026-09-28T09:30:00Z',
  },
  {
    id: 'cot-init-2',
    folio: 'COT-002',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    ordenId: 'ord-init-1',
    descripcion: 'Afinación integral con cambio de bujías y filtros',
    importeRefacciones: 2200,
    importeManoObra: 1300,
    total: 3500,
    estado: 'Aprobada',
    autorizacion: {
      autorizadoPor: 'Lucía Fernández (Cliente)',
      fechaHora: '28/09/2026, 16:30',
      trabajoAutorizado: 'Afinación integral con cambio de bujías y filtros',
      totalAutorizado: 3500,
    },
    creadoEn: '2026-09-27T16:00:00Z',
  },
];

const INITIAL_ORDENES: OrdenTrabajo[] = [
  {
    id: 'ord-init-1',
    folio: 'ORD-001',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    cotizacionId: 'cot-init-2',
    servicio: 'Afinación integral con cambio de bujías y filtros',
    kilometraje: '42,100 km',
    dañosVisibles: 'Sin daños visibles en carrocería',
    diagnostico: 'Bujías con desgaste y filtros saturados. Sistema de frenos e inyección en buen estado.',
    observacionesMecanico: 'Reemplazo de bujías y filtros en proceso en rampa de servicio.',
    trabajoTerminado: false,
    revisionFinal: false,
    entregado: false,
    estado: 'En proceso',
    mecanicoId: 'emp-2',
    mecanicoNombre: 'Miguel Ángel Gómez',
    fechaEntregaPrometida: getHoyDateString(),
    refaccionesUtilizadas: [
      {
        id: 'ru-init-1',
        refaccionId: 'ref-2',
        cantidad: 1,
        devueltas: 0,
        fechaHora: '28/09/2026, 08:30:00',
      },
    ],
    creadoEn: '2026-09-28T11:15:00Z',
  },
];

const STORAGE_KEY_CLIENTES = 'taller_clientes_data';
const STORAGE_KEY_VEHICULOS = 'taller_vehiculos_data';
const STORAGE_KEY_FLOTILLAS = 'taller_flotillas_data';
const STORAGE_KEY_CITAS = 'taller_citas_data';
const STORAGE_KEY_COTIZACIONES = 'taller_cotizaciones_data';
const STORAGE_KEY_ORDENES = 'taller_ordenes_data';
const STORAGE_KEY_SERVICIOS = 'taller_servicios_data';
const STORAGE_KEY_REFACCIONES = 'taller_refacciones_data';
const STORAGE_KEY_MOVIMIENTOS = 'taller_movimientos_inventario_data';
const STORAGE_KEY_ORDENES_COMPRA = 'taller_ordenes_compra_data';
const STORAGE_KEY_CONFIGURACION = 'taller_configuracion_data';
const STORAGE_KEY_FACTURAS = 'taller_facturas_data';
const STORAGE_KEY_EMPLEADOS = 'taller_empleados_data';
const STORAGE_KEY_ASISTENCIAS = 'taller_asistencias_data';
const STORAGE_KEY_SEGUIMIENTOS = 'taller_seguimientos_data';
const STORAGE_KEY_PROSPECTOS = 'taller_prospectos_data';
const STORAGE_KEY_USUARIOS = 'taller_usuarios_data';
const STORAGE_KEY_SESION = 'taller_sesion_data';
const STORAGE_KEY_GARANTIAS = 'taller_garantias_data';
const STORAGE_KEY_BITACORA = 'taller_bitacora_data';

const getFechaHoraLocal = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const migrateRolUsuario = (rol: string): RolUsuario => {
  if (rol === 'Recepción') return 'Recepción/CRM';
  if (rol === 'Mecánico') return 'Técnico';
  return rol as RolUsuario;
};

const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr-admin',
    nombre: 'Administrador Demo',
    usuario: 'admin@taller.demo',
    password: 'admin123',
    rol: 'Administrador',
    activo: true,
    creadoEn: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-recepcion',
    nombre: 'Sofía Ramírez',
    usuario: 'recepcion@taller.demo',
    password: 'recepcion123',
    rol: 'Recepción/CRM',
    activo: true,
    empleadoId: 'emp-3',
    creadoEn: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-cotizador',
    nombre: 'Carlos Valdés',
    usuario: 'cotizador@taller.demo',
    password: 'cotizador123',
    rol: 'Cotizador',
    activo: true,
    creadoEn: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-tecnico',
    nombre: 'Roberto Sánchez',
    usuario: 'tecnico@taller.demo',
    password: 'tecnico123',
    rol: 'Técnico',
    activo: true,
    empleadoId: 'emp-1',
    creadoEn: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-calidad',
    nombre: 'Elena Morales',
    usuario: 'calidad@taller.demo',
    password: 'calidad123',
    rol: 'Control de calidad',
    activo: true,
    creadoEn: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-caja',
    nombre: 'Patricia Domínguez',
    usuario: 'caja@taller.demo',
    password: 'caja123',
    rol: 'Caja',
    activo: true,
    creadoEn: '2026-09-01T08:00:00Z',
  },
];

const INITIAL_GARANTIAS: Garantia[] = [];

const INITIAL_BITACORA: EventoBitacora[] = [
  {
    id: 'ev-init-5',
    fechaHora: '2026-09-28 11:30',
    usuarioId: 'usr-mecanico',
    usuarioNombre: 'Roberto Sánchez',
    usuarioRol: 'Mecánico',
    tipoAccion: 'Inicio de trabajo',
    seccion: 'Órdenes',
    registroId: 'ord-init-1',
    registroFolio: 'ORD-001',
    descripcion: 'Inicio de trabajos en la orden ORD-001 (En proceso)',
    detalles: [
      { etiqueta: 'Estado', anterior: 'Pendiente', nuevo: 'En proceso' },
    ],
  },
  {
    id: 'ev-init-4',
    fechaHora: '2026-09-28 10:15',
    usuarioId: 'usr-recepcion',
    usuarioNombre: 'Sofía Ramírez',
    usuarioRol: 'Recepción',
    tipoAccion: 'Creación de orden',
    seccion: 'Órdenes',
    registroId: 'ord-init-1',
    registroFolio: 'ORD-001',
    descripcion: 'Apertura de orden de trabajo ORD-001 vinculada a cotización aprobada COT-002',
  },
  {
    id: 'ev-init-3',
    fechaHora: '2026-09-28 09:45',
    usuarioId: 'usr-recepcion',
    usuarioNombre: 'Sofía Ramírez',
    usuarioRol: 'Recepción',
    tipoAccion: 'Aprobación de cotización',
    seccion: 'Cotizaciones',
    registroId: 'cot-init-2',
    registroFolio: 'COT-002',
    descripcion: 'Aprobación de la cotización COT-002 por parte del cliente Lucía Fernández',
    detalles: [
      { etiqueta: 'Estado', anterior: 'Por autorizar', nuevo: 'Aprobada' },
      { etiqueta: 'Total', nuevo: '$3,500.00' },
    ],
  },
  {
    id: 'ev-init-2',
    fechaHora: '2026-09-28 09:10',
    usuarioId: 'usr-recepcion',
    usuarioNombre: 'Sofía Ramírez',
    usuarioRol: 'Recepción',
    tipoAccion: 'Creación de vehículo',
    seccion: 'Vehículos',
    registroId: 'veh-2',
    registroFolio: 'XYZ-789',
    descripcion: 'Registro del vehículo Nissan Versa (XYZ-789)',
  },
  {
    id: 'ev-init-1',
    fechaHora: '2026-09-28 09:05',
    usuarioId: 'usr-recepcion',
    usuarioNombre: 'Sofía Ramírez',
    usuarioRol: 'Recepción',
    tipoAccion: 'Creación de cliente',
    seccion: 'Clientes',
    registroId: 'cli-2',
    registroFolio: 'Lucía Fernández',
    descripcion: 'Registro de nueva clienta Lucía Fernández',
  },
];

const INITIAL_FACTURAS: Factura[] = [];

const INITIAL_SEGUIMIENTOS: Seguimiento[] = [
  {
    id: 'seg-init-1',
    clienteId: 'cli-1',
    vehiculoId: 'veh-1',
    motivo: 'seguimiento_cotizacion',
    motivoLabel: 'Seguimiento de cotización',
    registroTipo: 'cotizacion',
    registroRef: 'Cotización COT-001',
    mensaje:
      'Hola Carlos Mendoza, nos comunicamos de IOT Technologies para dar seguimiento a la cotización COT-001 de tu Toyota Corolla.',
    fecha: getHoyDateString(),
    hora: '10:30',
    estado: 'Pendiente',
    creadoEn: '2026-09-28T10:00:00Z',
  },
];

const INITIAL_PROSPECTOS: Prospecto[] = [
  {
    id: 'pros-init-1',
    nombre: 'Mariana Ríos',
    telefono: '555-345-6789',
    correo: 'mariana.rios@email.com',
    servicioInteres: 'Afinación mayor y cambio de aceite',
    origen: 'Recomendación',
    estado: 'Nuevo',
    notas: 'Interesada en cotizar mantenimiento preventivo para auto sedán.',
    fechaContacto: '2026-09-28',
    proximaAccionFecha: '2026-10-02',
    proximaAccionHora: '11:00',
    proximaAccionNota: 'Llamar para confirmar cotización y agendar visita para afinación mayor.',
    seguimientoId: 'seg-init-3',
    historial: [
      {
        id: 'hist-pros-1',
        fechaHora: '2026-09-28T09:30:00Z',
        tipo: 'creacion',
        descripcion: 'Prospecto registrado vía Recomendación. Servicio de interés: Afinación mayor y cambio de aceite.',
      },
      {
        id: 'hist-pros-2',
        fechaHora: '2026-09-28T09:35:00Z',
        tipo: 'seguimiento',
        descripcion: 'Próxima acción programada para el 02/10/2026 a las 11:00 hrs.',
      },
    ],
    creadoEn: '2026-09-28T09:30:00Z',
  },
  {
    id: 'pros-init-2',
    nombre: 'Roberto Garza',
    telefono: '555-876-5432',
    correo: 'roberto.garza@email.com',
    servicioInteres: 'Revisión de suspensión y frenos',
    origen: 'Llamada',
    estado: 'Contactado',
    notas: 'Escucha ruidos al pasar baches. Se le brindó asesoría preliminar.',
    fechaContacto: '2026-09-27',
    proximaAccionFecha: '2026-10-03',
    proximaAccionHora: '16:00',
    proximaAccionNota: 'Dar seguimiento a presupuesto preliminar.',
    historial: [
      {
        id: 'hist-pros-3',
        fechaHora: '2026-09-27T11:00:00Z',
        tipo: 'creacion',
        descripcion: 'Prospecto registrado vía Llamada.',
      },
      {
        id: 'hist-pros-4',
        fechaHora: '2026-09-27T11:20:00Z',
        tipo: 'estado',
        descripcion: 'Estado actualizado a Contactado.',
      },
    ],
    creadoEn: '2026-09-27T11:00:00Z',
  },
];

const INITIAL_EMPLEADOS: Empleado[] = [
  {
    id: 'emp-1',
    codigoQr: 'EMP-001',
    nombre: 'Roberto Sánchez',
    puesto: 'Jefe de taller / Mecánico principal',
    activo: true,
    fechaAlta: '2026-09-01T08:00:00Z',
  },
  {
    id: 'emp-2',
    codigoQr: 'EMP-002',
    nombre: 'Miguel Ángel Gómez',
    puesto: 'Mecánico automotriz',
    activo: true,
    fechaAlta: '2026-09-01T08:00:00Z',
  },
  {
    id: 'emp-3',
    codigoQr: 'EMP-003',
    nombre: 'Sofía Ramírez',
    puesto: 'Asesora de servicio / Recepción',
    activo: true,
    fechaAlta: '2026-09-01T08:00:00Z',
  },
];

const INITIAL_ASISTENCIAS: RegistroAsistencia[] = [
  {
    id: 'asist-init-1',
    empleadoId: 'emp-1',
    fecha: '2026-09-29',
    hora: '08:00',
    tipo: 'Entrada',
    fechaHora: '2026-09-29T08:00:00Z',
  },
  {
    id: 'asist-init-2',
    empleadoId: 'emp-2',
    fecha: '2026-09-29',
    hora: '08:15',
    tipo: 'Entrada',
    fechaHora: '2026-09-29T08:15:00Z',
  },
  {
    id: 'asist-init-3',
    empleadoId: 'emp-3',
    fecha: '2026-09-29',
    hora: '08:30',
    tipo: 'Entrada',
    fechaHora: '2026-09-29T08:30:00Z',
  },
];

const INITIAL_CONFIGURACION: ConfiguracionTaller = {
  nombre: 'IOT Technologies',
  telefono: '555-432-1000',
  direccion: 'Av. Tecnológico 1000, Edificio IOT',
};

const INITIAL_FLOTILLAS: Flotilla[] = [
  {
    id: 'flot-1',
    nombre: 'Flotilla Ejecutiva Monterrey',
    empresa: 'Transportes Rápidos del Norte S.A. de C.V.',
    contacto: 'Ing. Roberto Garza',
    telefono: '818-234-5678',
    correo: 'contacto@transportesnorte.com',
    notas: 'Mantenimiento preventivo mensual de vehículos utilitarios.',
    estado: 'Activa',
    vehiculoIds: ['veh-1'],
    creadoEn: '2026-09-15T08:00:00Z',
  },
  {
    id: 'flot-2',
    nombre: 'Distribución Metropolitana',
    empresa: 'Logística y Envíos Express',
    contacto: 'Lic. Andrea Morales',
    telefono: '555-876-5432',
    correo: 'flotilla@enviosexpress.com',
    notas: 'Horario de recepción matutino antes de las 9:00 AM.',
    estado: 'Activa',
    vehiculoIds: [],
    creadoEn: '2026-09-20T08:00:00Z',
  },
];

const INITIAL_REFACCIONES: Refaccion[] = [
  {
    id: 'ref-1',
    codigo: 'BAL-DEL-01',
    nombre: 'Juego de balatas delanteras cerámicas',
    existencias: 8,
    minimo: 4,
    costoUnitario: 520,
    precioCompra: 520,
    precioVenta: 780,
    proveedor: 'Frenos y Partes de México',
    telefonoProveedor: '555-444-1122',
    fechaUltimaCompra: '2026-09-20',
    diasEntregaEstimados: 2,
    compatibilidad: 'Toyota Corolla 2018-2024, Nissan Versa 2020-2024',
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-2',
    codigo: 'FIL-ACE-01',
    nombre: 'Filtro de aceite sintético para motor 4 cil',
    existencias: 3,
    minimo: 5,
    costoUnitario: 140,
    precioCompra: 140,
    precioVenta: 220,
    proveedor: 'Distribuidora Automotriz del Centro',
    telefonoProveedor: '555-321-7788',
    fechaUltimaCompra: '2026-09-25',
    diasEntregaEstimados: 1,
    compatibilidad: 'Nissan Versa, Sentra, Tiida 1.6L y 1.8L',
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-3',
    codigo: 'BUJ-PLAT-01',
    nombre: 'Juego de bujías de platino (4 pzs)',
    existencias: 12,
    minimo: 6,
    costoUnitario: 380,
    precioCompra: 380,
    precioVenta: 560,
    proveedor: 'Encendido y Sensores Nacional',
    telefonoProveedor: '555-778-9900',
    fechaUltimaCompra: '2026-09-18',
    diasEntregaEstimados: 3,
    compatibilidad: 'Universal / Motores 4 cilindros japoneses y americanos',
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-4',
    codigo: 'LQD-FRN-DOT4',
    nombre: 'Líquido para frenos DOT-4 (1 litro)',
    existencias: 6,
    minimo: 4,
    costoUnitario: 110,
    precioCompra: 110,
    precioVenta: 180,
    proveedor: 'Lubricantes y Químicos del Bajío',
    telefonoProveedor: '555-889-1234',
    fechaUltimaCompra: '2026-09-15',
    diasEntregaEstimados: 2,
    compatibilidad: 'Multimarca estándar DOT-4',
    creadoEn: '2026-09-28T08:00:00Z',
  },
];

const INITIAL_ORDENES_COMPRA: OrdenCompra[] = [
  {
    id: 'oc-init-1',
    folio: 'OC-001',
    refaccionId: 'ref-2',
    refaccionNombre: 'Filtro de aceite sintético para motor 4 cil',
    refaccionCodigo: 'FIL-ACE-01',
    cantidad: 10,
    proveedor: 'Distribuidora Automotriz del Centro',
    telefonoProveedor: '555-321-7788',
    fecha: '2026-09-25',
    costoUnitario: 140,
    total: 1400,
    estado: 'Recibida',
    recibidaEn: '2026-09-27T10:00:00Z',
    notas: 'Pedido de reposición mensual.',
    creadoEn: '2026-09-25T09:00:00Z',
  },
  {
    id: 'oc-init-2',
    folio: 'OC-002',
    refaccionId: 'ref-1',
    refaccionNombre: 'Juego de balatas delanteras cerámicas',
    refaccionCodigo: 'BAL-DEL-01',
    cantidad: 5,
    proveedor: 'Frenos y Partes de México',
    telefonoProveedor: '555-444-1122',
    fecha: getHoyDateString(),
    costoUnitario: 520,
    total: 2600,
    estado: 'Pendiente',
    notas: 'Surtido solicitado para órdenes de la semana.',
    creadoEn: '2026-09-28T11:00:00Z',
  },
];

const INITIAL_MOVIMIENTOS: MovimientoInventario[] = [
  {
    id: 'mov-init-1',
    refaccionId: 'ref-1',
    tipo: 'Entrada',
    cantidad: 8,
    motivo: 'Inventario inicial',
    fechaHora: '28/9/2026, 08:00:00',
  },
  {
    id: 'mov-init-2',
    refaccionId: 'ref-2',
    tipo: 'Entrada',
    cantidad: 3,
    motivo: 'Inventario inicial',
    fechaHora: '28/9/2026, 08:00:00',
  },
  {
    id: 'mov-init-3',
    refaccionId: 'ref-3',
    tipo: 'Entrada',
    cantidad: 12,
    motivo: 'Inventario inicial',
    fechaHora: '28/9/2026, 08:00:00',
  },
  {
    id: 'mov-init-4',
    refaccionId: 'ref-4',
    tipo: 'Entrada',
    cantidad: 2,
    motivo: 'Inventario inicial',
    fechaHora: '28/9/2026, 08:00:00',
  },
];

const INITIAL_SERVICIOS: ServicioCatalogo[] = [
  {
    id: 'serv-1',
    nombre: 'Afinación mayor 4 cilindros',
    descripcion: 'Cambio de filtros (aceite, aire, gasolina), bujías de platino y lavado de inyectores con boya.',
    costoRefacciones: 650,
    costoManoObra: 400,
    importeRefacciones: 1250,
    importeManoObra: 850,
    total: 2100,
    activo: true,
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'serv-2',
    nombre: 'Cambio de balatas delanteras',
    descripcion: 'Reemplazo de pastillas de freno cerámicas y rectificado de discos.',
    costoRefacciones: 520,
    costoManoObra: 300,
    importeRefacciones: 980,
    importeManoObra: 650,
    total: 1630,
    activo: true,
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'serv-3',
    nombre: 'Cambio de aceite y filtro sintético',
    descripcion: 'Aceite 100% sintético 5W-30 (hasta 5 litros), filtro de aceite nuevo y revisión de 15 puntos de seguridad.',
    costoRefacciones: 450,
    costoManoObra: 150,
    importeRefacciones: 850,
    importeManoObra: 350,
    total: 1200,
    activo: true,
    creadoEn: '2026-09-28T08:00:00Z',
  },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'catalogos' | 'administracion' | 'configuracion' | null>(() => {
    if (['servicios', 'inventario'].includes('dashboard')) return 'catalogos';
    return null;
  });
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarMensaje = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  // Usuarios & Sesión State (ETAPA 20)
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USUARIOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasMigrated = false;
          const migratedUsers = parsed.map((u: Usuario) => {
            const newRol = migrateRolUsuario(u.rol);
            if (newRol !== u.rol) {
              hasMigrated = true;
              return { ...u, rol: newRol };
            }
            return u;
          });

          // Asegurar que las cuentas demo para todos los roles estén disponibles para pruebas inmediatas
          const existingRoles = new Set(migratedUsers.map((u: Usuario) => u.rol));
          const missingDemoUsers = INITIAL_USUARIOS.filter(
            (demo) => !existingRoles.has(demo.rol) && !migratedUsers.some((u: Usuario) => u.usuario === demo.usuario)
          );

          const finalUsers = [...migratedUsers, ...missingDemoUsers];
          if (hasMigrated || missingDemoUsers.length > 0) {
            try {
              localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(finalUsers));
            } catch {
              // ignore
            }
          }
          return finalUsers;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_USUARIOS;
  });

  const [sesion, setSesion] = useState<SesionUsuario | null>(() => {
    try {
      const current = sessionStorage.getItem(STORAGE_KEY_SESION);
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed && parsed.usuarioId) {
          const newRol = migrateRolUsuario(parsed.rol);
          const migratedSesion = { ...parsed, rol: newRol };
          if (newRol !== parsed.rol) {
            sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(migratedSesion));
          }
          return migratedSesion;
        }
      }
      const remembered = localStorage.getItem(STORAGE_KEY_SESION);
      if (remembered) {
        const parsed = JSON.parse(remembered);
        if (parsed && parsed.usuarioId) {
          const newRol = migrateRolUsuario(parsed.rol);
          const migratedSesion = { ...parsed, rol: newRol };
          if (newRol !== parsed.rol) {
            localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(migratedSesion));
          }
          return migratedSesion;
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Garantías State (ETAPA 21)
  const [garantias, setGarantias] = useState<Garantia[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GARANTIAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_GARANTIAS;
  });

  const [initialOrdenGarantia, setInitialOrdenGarantia] = useState<OrdenTrabajo | null>(null);

  // Bitácora State (ETAPA 22)
  const [bitacora, setBitacora] = useState<EventoBitacora[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BITACORA);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_BITACORA;
  });

  // Facturas State (ETAPA 15)
  const [facturas, setFacturas] = useState<Factura[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FACTURAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_FACTURAS;
  });

  // Empleados State (ETAPA 16)
  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLEADOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_EMPLEADOS;
  });

  // Asistencias State (ETAPA 16)
  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASISTENCIAS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ASISTENCIAS;
  });

  // Seguimientos State (ETAPA 17)
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEGUIMIENTOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SEGUIMIENTOS;
  });

  // Prospectos State (ETAPA 19)
  const [prospectos, setProspectos] = useState<Prospecto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROSPECTOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_PROSPECTOS;
  });

  // Configuración del taller (ETAPA 12)
  const [configuracion, setConfiguracion] = useState<ConfiguracionTaller>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIGURACION);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.nombre === 'string') return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CONFIGURACION;
  });

  // Flotillas State
  const [flotillas, setFlotillas] = useState<Flotilla[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FLOTILLAS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_FLOTILLAS;
  });

  // Servicios State (ETAPA 8 & Costeo)
  const [servicios, setServicios] = useState<ServicioCatalogo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICIOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => ({
            ...s,
            costoRefacciones: s.costoRefacciones !== undefined ? s.costoRefacciones : Math.round((s.importeRefacciones || 0) * 0.55),
            costoManoObra: s.costoManoObra !== undefined ? s.costoManoObra : Math.round((s.importeManoObra || 0) * 0.5),
          }));
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SERVICIOS;
  });

  // Inventario & Movimientos State (ETAPA 9 & Costeo)
  const [refacciones, setRefacciones] = useState<Refaccion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REFACCIONES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => {
            const pCompra = r.precioCompra !== undefined ? r.precioCompra : (r.costoUnitario || 100);
            return {
              ...r,
              precioCompra: pCompra,
              precioVenta: r.precioVenta !== undefined ? r.precioVenta : Math.round(pCompra * 1.45),
              proveedor: r.proveedor || 'Proveedor General',
              telefonoProveedor: r.telefonoProveedor || '',
              fechaUltimaCompra: r.fechaUltimaCompra || '',
              diasEntregaEstimados: r.diasEntregaEstimados ?? 2,
              compatibilidad: r.compatibilidad || 'Multimarca / Universal',
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_REFACCIONES;
  });

  // Órdenes de compra State
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDENES_COMPRA);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ORDENES_COMPRA;
  });

  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MOVIMIENTOS;
  });

  // Clientes State
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CLIENTES;
  });

  // Vehículos State
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VEHICULOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_VEHICULOS;
  });

  // Citas State
  const [citas, setCitas] = useState<Cita[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CITAS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CITAS;
  });

  // Cotizaciones State
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COTIZACIONES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_COTIZACIONES;
  });

  // Órdenes State
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDENES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ORDENES;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    } catch (e) {
      console.error(e);
    }
  }, [clientes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VEHICULOS, JSON.stringify(vehiculos));
    } catch (e) {
      console.error(e);
    }
  }, [vehiculos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas));
    } catch (e) {
      console.error(e);
    }
  }, [citas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COTIZACIONES, JSON.stringify(cotizaciones));
    } catch (e) {
      console.error(e);
    }
  }, [cotizaciones]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDENES, JSON.stringify(ordenes));
    } catch (e) {
      console.error(e);
    }
  }, [ordenes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERVICIOS, JSON.stringify(servicios));
    } catch (e) {
      console.error(e);
    }
  }, [servicios]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REFACCIONES, JSON.stringify(refacciones));
    } catch (e) {
      console.error(e);
    }
  }, [refacciones]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movimientos));
    } catch (e) {
      console.error(e);
    }
  }, [movimientos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLOTILLAS, JSON.stringify(flotillas));
    } catch (e) {
      console.error(e);
    }
  }, [flotillas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDENES_COMPRA, JSON.stringify(ordenesCompra));
    } catch (e) {
      console.error(e);
    }
  }, [ordenesCompra]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIGURACION, JSON.stringify(configuracion));
    } catch (e) {
      console.error(e);
    }
  }, [configuracion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FACTURAS, JSON.stringify(facturas));
    } catch (e) {
      console.error(e);
    }
  }, [facturas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLEADOS, JSON.stringify(empleados));
    } catch (e) {
      console.error(e);
    }
  }, [empleados]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASISTENCIAS, JSON.stringify(asistencias));
    } catch (e) {
      console.error(e);
    }
  }, [asistencias]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SEGUIMIENTOS, JSON.stringify(seguimientos));
    } catch (e) {
      console.error(e);
    }
  }, [seguimientos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROSPECTOS, JSON.stringify(prospectos));
    } catch (e) {
      console.error(e);
    }
  }, [prospectos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
    } catch (e) {
      console.error(e);
    }
  }, [usuarios]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GARANTIAS, JSON.stringify(garantias));
    } catch (e) {
      console.error(e);
    }
  }, [garantias]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BITACORA, JSON.stringify(bitacora));
    } catch (e) {
      console.error(e);
    }
  }, [bitacora]);

  // Helper para registrar eventos en la bitácora de actividad (ETAPA 22)
  const registrarEvento = (
    tipoAccion: string,
    seccion: SeccionBitacora,
    descripcion: string,
    registroId?: string,
    registroFolio?: string,
    detalles?: DetalleCambioBitacora[]
  ) => {
    try {
      const nuevoEvento: EventoBitacora = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fechaHora: getFechaHoraLocal(),
        usuarioId: sesion?.usuarioId || 'usr-admin',
        usuarioNombre: sesion?.nombre || 'Administrador Demo',
        usuarioRol: sesion?.rol || 'Administrador',
        tipoAccion,
        seccion,
        registroId,
        registroFolio,
        descripcion,
        detalles: detalles && detalles.length > 0 ? detalles : undefined,
      };

      setBitacora((prev) => [nuevoEvento, ...prev]);
    } catch (err) {
      console.error('Error al registrar evento en bitácora:', err);
    }
  };

  // Auth Handlers (ETAPA 20)
  const handleLogin = (nuevaSesion: SesionUsuario) => {
    setSesion(nuevaSesion);
    if (nuevaSesion.recordar) {
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(nuevaSesion));
      sessionStorage.removeItem(STORAGE_KEY_SESION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(nuevaSesion));
      localStorage.removeItem(STORAGE_KEY_SESION);
    }
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setSesion(null);
    localStorage.removeItem(STORAGE_KEY_SESION);
    sessionStorage.removeItem(STORAGE_KEY_SESION);
  };

  // Usuarios Handlers (ETAPA 20)
  const handleSaveUsuario = (newUsr: Usuario) => {
    setUsuarios((prev) => [...prev, newUsr]);
    registrarEvento(
      'Creación de usuario',
      'Usuarios',
      `Registro del usuario ${newUsr.nombre} (${newUsr.rol})`,
      newUsr.id,
      newUsr.usuario
    );
  };

  const handleUpdateUsuario = (updatedUsr: Usuario) => {
    const oldUsr = usuarios.find((u) => u.id === updatedUsr.id);
    setUsuarios((prev) => prev.map((u) => (u.id === updatedUsr.id ? updatedUsr : u)));
    if (sesion && sesion.usuarioId === updatedUsr.id) {
      const updatedSesion: SesionUsuario = {
        ...sesion,
        nombre: updatedUsr.nombre,
        usuario: updatedUsr.usuario,
        rol: updatedUsr.rol,
        empleadoId: updatedUsr.empleadoId,
      };
      setSesion(updatedSesion);
      if (updatedSesion.recordar) {
        localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(updatedSesion));
      } else {
        sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(updatedSesion));
      }
    }

    const detalles: DetalleCambioBitacora[] = [];
    if (oldUsr && oldUsr.nombre !== updatedUsr.nombre) {
      detalles.push({ etiqueta: 'Nombre', anterior: oldUsr.nombre, nuevo: updatedUsr.nombre });
    }
    if (oldUsr && oldUsr.rol !== updatedUsr.rol) {
      detalles.push({ etiqueta: 'Rol', anterior: oldUsr.rol, nuevo: updatedUsr.rol });
    }
    if (oldUsr && oldUsr.usuario !== updatedUsr.usuario) {
      detalles.push({ etiqueta: 'Usuario / Correo', anterior: oldUsr.usuario, nuevo: updatedUsr.usuario });
    }

    registrarEvento(
      'Modificación de usuario',
      'Usuarios',
      `Actualización de usuario ${updatedUsr.nombre} (${updatedUsr.rol})`,
      updatedUsr.id,
      updatedUsr.usuario,
      detalles
    );
  };

  const handleToggleActivoUsuario = (usuarioId: string): { success: boolean; message?: string } => {
    const target = usuarios.find((u) => u.id === usuarioId);
    if (!target) return { success: false, message: 'Usuario no encontrado' };

    if (target.rol === 'Administrador' && target.activo) {
      const activeAdmins = usuarios.filter((u) => u.rol === 'Administrador' && u.activo);
      if (activeAdmins.length <= 1) {
        return {
          success: false,
          message: 'No puedes desactivar al único administrador activo del sistema.',
        };
      }
    }

    const newActivo = !target.activo;
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioId ? { ...u, activo: newActivo } : u))
    );

    registrarEvento(
      'Cambio de permisos',
      'Usuarios',
      `${newActivo ? 'Activación' : 'Desactivación'} de la cuenta del usuario ${target.nombre}`,
      target.id,
      target.usuario,
      [
        {
          etiqueta: 'Estado de cuenta',
          anterior: target.activo ? 'Activo' : 'Inactivo',
          nuevo: newActivo ? 'Activo' : 'Inactivo',
        },
      ]
    );

    return { success: true };
  };

  const handleChangePasswordUsuario = (usuarioId: string, newPassword: string) => {
    const target = usuarios.find((u) => u.id === usuarioId);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioId ? { ...u, password: newPassword } : u))
    );

    if (target) {
      registrarEvento(
        'Cambio de credenciales',
        'Usuarios',
        `Actualización de contraseña para el usuario ${target.nombre}`,
        target.id,
        target.usuario
      );
    }
  };

  // Garantías Handlers (ETAPA 21)
  const handleSaveGarantia = (newGarantia: Garantia) => {
    // Avoid multiple active warranties for the same order
    const hasActive = garantias.some(
      (g) =>
        g.ordenId === newGarantia.ordenId &&
        (g.estado === 'Vigente' || g.estado === 'Aplicada')
    );
    if (hasActive) return;
    setGarantias((prev) => [newGarantia, ...prev]);

    registrarEvento(
      'Registro de garantía',
      'Garantías',
      `Registro de póliza de garantía ${newGarantia.folio} para orden ${newGarantia.ordenFolio}`,
      newGarantia.id,
      newGarantia.folio,
      [
        { etiqueta: 'Orden asociada', nuevo: newGarantia.ordenFolio },
        { etiqueta: 'Vigencia', nuevo: `${newGarantia.duracionDias} días` },
      ]
    );
  };

  const handleUpdateGarantia = (updatedGarantia: Garantia) => {
    setGarantias((prev) =>
      prev.map((g) => (g.id === updatedGarantia.id ? updatedGarantia : g))
    );
  };

  const handleAplicarGarantia = (
    garantiaId: string,
    motivoRegreso: string,
    observaciones: string,
    fecha: string
  ) => {
    const targetGarantia = garantias.find((g) => g.id === garantiaId);
    if (!targetGarantia || targetGarantia.estado === 'Aplicada' || targetGarantia.aplicacion) {
      return;
    }

    const count = ordenes.length + 1;
    const newFolio = `ORD-${String(count).padStart(3, '0')}`;
    const nuevaOrdenId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create new linked order in status 'Pendiente'
    // Do not copy amounts or deduct inventory
    const nuevaOrden: OrdenTrabajo = {
      id: nuevaOrdenId,
      folio: newFolio,
      clienteId: targetGarantia.clienteId,
      vehiculoId: targetGarantia.vehiculoId,
      servicio: `Reingreso por garantía (${targetGarantia.folio}) — ${targetGarantia.trabajoCubierto}`,
      diagnostico: `Motivo del reingreso por garantía: ${motivoRegreso}. ${observaciones ? `Observaciones: ${observaciones}` : ''}`.trim(),
      observaciones: `Garantía aplicada: ${targetGarantia.folio}. Orden original: ${targetGarantia.ordenFolio}. Fecha solicitud: ${fecha}.`,
      mecanicoId: targetGarantia.mecanicoId,
      mecanicoNombre: targetGarantia.mecanicoNombre,
      estado: 'Pendiente',
      trabajoTerminado: false,
      revisionFinal: false,
      entregado: false,
      creadoEn: new Date().toISOString(),
    };

    const aplicacionData = {
      motivoRegreso,
      observaciones: observaciones || undefined,
      fecha,
      nuevaOrdenId,
      nuevaOrdenFolio: newFolio,
      fechaAplicacion: new Date().toISOString(),
    };

    setGarantias((prev) =>
      prev.map((g) =>
        g.id === garantiaId
          ? {
              ...g,
              estado: 'Aplicada',
              aplicacion: aplicacionData,
            }
          : g
      )
    );

    setOrdenes((prev) => [nuevaOrden, ...prev]);

    registrarEvento(
      'Aplicación de garantía',
      'Garantías',
      `Aplicación de garantía ${targetGarantia.folio}, generada orden de reingreso ${newFolio}`,
      targetGarantia.id,
      targetGarantia.folio,
      [
        { etiqueta: 'Orden de reingreso', nuevo: newFolio },
        { etiqueta: 'Motivo', nuevo: motivoRegreso },
      ]
    );
  };

  const handleCancelarGarantia = (garantiaId: string, motivo: string) => {
    const targetGarantia = garantias.find((g) => g.id === garantiaId);
    setGarantias((prev) =>
      prev.map((g) =>
        g.id === garantiaId
          ? {
              ...g,
              estado: 'Cancelada',
              cancelacion: {
                motivo,
                fechaCancelacion: new Date().toISOString(),
              },
            }
          : g
      )
    );

    if (targetGarantia) {
      registrarEvento(
        'Cancelación de garantía',
        'Garantías',
        `Cancelación de garantía ${targetGarantia.folio}. Motivo: ${motivo}`,
        targetGarantia.id,
        targetGarantia.folio,
        [
          { etiqueta: 'Estado', anterior: targetGarantia.estado, nuevo: 'Cancelada' },
          { etiqueta: 'Motivo de cancelación', nuevo: motivo },
        ]
      );
    }
  };

  const handleAddObservacionMecanico = (garantiaId: string, texto: string) => {
    setGarantias((prev) =>
      prev.map((g) => {
        if (g.id !== garantiaId) return g;
        const currentObs = g.observacionesMecanico || [];
        const newObs = {
          id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          mecanicoNombre: sesion?.nombre || 'Técnico',
          texto,
          fechaHora: new Date().toLocaleString('es-MX'),
        };
        return {
          ...g,
          observacionesMecanico: [...currentObs, newObs],
        };
      })
    );
  };

  const handleRegistrarGarantiaFromOrden = (ord: OrdenTrabajo) => {
    setInitialOrdenGarantia(ord);
    setActiveSection('garantias');
  };

  const handleSaveSeguimiento = (newSeg: Seguimiento) => {
    setSeguimientos((prev) => [newSeg, ...prev]);
  };

  const handleUpdateSeguimientoEstado = (
    id: string,
    nuevoEstado: 'Pendiente' | 'Realizado' | 'Cancelado',
    newDate?: string,
    newTime?: string
  ) => {
    setSeguimientos((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            estado: nuevoEstado,
            ...(newDate ? { fecha: newDate } : {}),
            ...(newTime ? { hora: newTime } : {}),
          };
        }
        return s;
      })
    );

    // Sync with linked prospecto if exists
    setProspectos((prev) =>
      prev.map((p) => {
        if (p.seguimientoId === id) {
          const nowIso = new Date().toISOString();
          const updatedHistorial = [...p.historial];
          let desc = `Seguimiento marcado como ${nuevoEstado}.`;
          if (newDate) {
            desc = `Próxima acción reprogramada para el ${newDate} a las ${newTime || '10:00'} hrs.`;
          }
          updatedHistorial.unshift({
            id: `hist-${Date.now()}-sync`,
            fechaHora: nowIso,
            tipo: 'seguimiento',
            descripcion: desc,
          });

          return {
            ...p,
            proximaAccionFecha: newDate || p.proximaAccionFecha,
            proximaAccionHora: newTime || p.proximaAccionHora,
            historial: updatedHistorial,
          };
        }
        return p;
      })
    );
  };

  const handleSaveProspecto = (newPros: Prospecto, linkedSeguimiento?: Seguimiento) => {
    setProspectos((prev) => [newPros, ...prev]);
    if (linkedSeguimiento) {
      setSeguimientos((prev) => [linkedSeguimiento, ...prev]);
    }
  };

  const handleUpdateProspecto = (updatedPros: Prospecto, linkedSeguimiento?: Seguimiento) => {
    setProspectos((prev) => prev.map((p) => (p.id === updatedPros.id ? updatedPros : p)));
    if (linkedSeguimiento) {
      setSeguimientos((prev) => {
        const exists = prev.some((s) => s.id === linkedSeguimiento.id);
        if (exists) {
          return prev.map((s) => (s.id === linkedSeguimiento.id ? linkedSeguimiento : s));
        } else {
          return [linkedSeguimiento, ...prev];
        }
      });
    }
  };

  const handleConvertirEnCliente = (
    prospectoId: string,
    clienteData: { nombre: string; telefono: string; correo?: string },
    existingClienteId?: string
  ) => {
    let targetClienteId = existingClienteId;

    if (!targetClienteId) {
      const newClienteId = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newCliente: Cliente = {
        id: newClienteId,
        nombre: clienteData.nombre.trim(),
        telefono: clienteData.telefono.trim(),
        correo: clienteData.correo?.trim() || undefined,
      };
      setClientes((prev) => [newCliente, ...prev]);
      targetClienteId = newClienteId;
    }

    const nowIso = new Date().toISOString();
    setProspectos((prev) =>
      prev.map((p) => {
        if (p.id === prospectoId) {
          const updatedHistorial = [...p.historial];
          updatedHistorial.unshift({
            id: `hist-${Date.now()}-conv`,
            fechaHora: nowIso,
            tipo: 'conversion',
            descripcion: `Convertido en cliente formal (${clienteData.nombre.trim()}). Relación guardada exitosamente.`,
          });
          return {
            ...p,
            estado: 'Convertido en cliente',
            clienteId: targetClienteId,
            historial: updatedHistorial,
          };
        }
        return p;
      })
    );
  };

  const handleSaveEmpleado = (newEmp: Empleado) => {
    setEmpleados((prev) => [newEmp, ...prev]);
  };

  const handleUpdateEmpleado = (updatedEmp: Empleado) => {
    setEmpleados((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
  };

  const handleSaveAsistencia = (newAsist: RegistroAsistencia) => {
    setAsistencias((prev) => [newAsist, ...prev]);
  };

  const handleSaveFactura = (newFac: Factura) => {
    setFacturas((prev) => [newFac, ...prev]);
    registrarEvento(
      'Creación de factura',
      'Facturación',
      `Emisión de factura ${newFac.folio} por $${newFac.total.toLocaleString('es-MX')}`,
      newFac.id,
      newFac.folio,
      [
        { etiqueta: 'Total', nuevo: `$${newFac.total.toLocaleString('es-MX')}` },
        { etiqueta: 'Estado', nuevo: newFac.estado },
      ]
    );
  };

  const handleUpdateFactura = (updatedFac: Factura) => {
    const oldFac = facturas.find((f) => f.id === updatedFac.id);
    setFacturas((prev) => prev.map((f) => (f.id === updatedFac.id ? updatedFac : f)));

    if (oldFac) {
      if (updatedFac.estado === 'Pagada' && oldFac.estado !== 'Pagada') {
        registrarEvento(
          'Pago de factura',
          'Facturación',
          `Registro de pago para la factura ${updatedFac.folio}`,
          updatedFac.id,
          updatedFac.folio,
          [
            { etiqueta: 'Estado', anterior: oldFac.estado, nuevo: 'Pagada' },
          ]
        );
      } else if (updatedFac.estado === 'Cancelada' && oldFac.estado !== 'Cancelada') {
        registrarEvento(
          'Cancelación de factura',
          'Facturación',
          `Cancelación de factura ${updatedFac.folio}`,
          updatedFac.id,
          updatedFac.folio,
          [
            { etiqueta: 'Estado', anterior: oldFac.estado, nuevo: 'Cancelada' },
          ]
        );
      }
    }
  };

  // Restore whole demo data handler (ETAPA 12, 15 & 22)
  const handleRestoreData = (backup: RespaldoDemo) => {
    setConfiguracion(backup.configuracion);
    setClientes(backup.clientes);
    setVehiculos(backup.vehiculos);
    setCitas(backup.citas);
    setCotizaciones(backup.cotizaciones);
    setOrdenes(backup.ordenes);
    setServicios(backup.servicios);
    setRefacciones(backup.refacciones);
    setMovimientos(backup.movimientos);
    setFacturas(backup.facturas || []);
    setEmpleados(backup.empleados || INITIAL_EMPLEADOS);
    setAsistencias(backup.asistencias || INITIAL_ASISTENCIAS);
    if (backup.seguimientos) {
      setSeguimientos(backup.seguimientos);
    }
    if (backup.prospectos) {
      setProspectos(backup.prospectos);
    }
    if (backup.flotillas) {
      setFlotillas(backup.flotillas);
    }
    if (backup.ordenesCompra) {
      setOrdenesCompra(backup.ordenesCompra);
    }

    try {
      localStorage.setItem(STORAGE_KEY_CONFIGURACION, JSON.stringify(backup.configuracion));
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(backup.clientes));
      localStorage.setItem(STORAGE_KEY_VEHICULOS, JSON.stringify(backup.vehiculos));
      localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(backup.citas));
      localStorage.setItem(STORAGE_KEY_COTIZACIONES, JSON.stringify(backup.cotizaciones));
      localStorage.setItem(STORAGE_KEY_ORDENES, JSON.stringify(backup.ordenes));
      localStorage.setItem(STORAGE_KEY_SERVICIOS, JSON.stringify(backup.servicios));
      localStorage.setItem(STORAGE_KEY_REFACCIONES, JSON.stringify(backup.refacciones));
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(backup.movimientos));
      localStorage.setItem(STORAGE_KEY_FACTURAS, JSON.stringify(backup.facturas || []));
      localStorage.setItem(STORAGE_KEY_EMPLEADOS, JSON.stringify(backup.empleados || INITIAL_EMPLEADOS));
      localStorage.setItem(STORAGE_KEY_ASISTENCIAS, JSON.stringify(backup.asistencias || INITIAL_ASISTENCIAS));
      if (backup.seguimientos) {
        localStorage.setItem(STORAGE_KEY_SEGUIMIENTOS, JSON.stringify(backup.seguimientos));
      }
      if (backup.prospectos) {
        localStorage.setItem(STORAGE_KEY_PROSPECTOS, JSON.stringify(backup.prospectos));
      }
      if (backup.flotillas) {
        localStorage.setItem(STORAGE_KEY_FLOTILLAS, JSON.stringify(backup.flotillas));
      }
      if (backup.ordenesCompra) {
        localStorage.setItem(STORAGE_KEY_ORDENES_COMPRA, JSON.stringify(backup.ordenesCompra));
      }
      if (backup.garantias) {
        setGarantias(backup.garantias);
        localStorage.setItem(STORAGE_KEY_GARANTIAS, JSON.stringify(backup.garantias));
      }
    } catch (e) {
      console.error(e);
    }

    // Restauración de Bitácora y registro de nuevo evento posterior (ETAPA 22)
    const baseBitacora = Array.isArray(backup.bitacora) ? backup.bitacora : [];
    const evRestauracion: EventoBitacora = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fechaHora: getFechaHoraLocal(),
      usuarioId: sesion?.usuarioId || 'usr-admin',
      usuarioNombre: sesion?.nombre || 'Administrador Demo',
      usuarioRol: sesion?.rol || 'Administrador',
      tipoAccion: 'Restauración de respaldo',
      seccion: 'Respaldos',
      registroFolio: `Respaldo-${backup.version || 'v1.0'}`,
      descripcion: `Restauración exitosa de respaldo del sistema (${backup.version || 'v1.0'})`,
    };

    const finalBitacora = [evRestauracion, ...baseBitacora];
    setBitacora(finalBitacora);
    try {
      localStorage.setItem(STORAGE_KEY_BITACORA, JSON.stringify(finalBitacora));
    } catch (e) {
      console.error(e);
    }
  };

  // Clientes & Vehículos Modals State
  const [searchCliente, setSearchCliente] = useState('');
  const [searchVehiculo, setSearchVehiculo] = useState('');

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteForm, setClienteForm] = useState({ nombre: '', telefono: '', correo: '' });
  const [clienteErrors, setClienteErrors] = useState<{ nombre?: string; telefono?: string }>({});

  const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [vehiculoForm, setVehiculoForm] = useState({
    clienteId: '',
    marca: '',
    modelo: '',
    placas: '',
    año: '',
  });
  const [vehiculoErrors, setVehiculoErrors] = useState<Record<string, string>>({});

  // Historial State (ETAPA 11)
  const [historialTarget, setHistorialTarget] = useState<{
    tipo: 'cliente' | 'vehiculo';
    id: string;
  } | null>(null);
  const [openClienteMenuId, setOpenClienteMenuId] = useState<string | null>(null);
  const [openVehiculoMenuId, setOpenVehiculoMenuId] = useState<string | null>(null);

  const clienteModalDismiss = useModalDismiss({
    isOpen: isClienteModalOpen,
    onClose: () => {
      setIsClienteModalOpen(false);
      setClienteErrors({});
    },
    isDirty: () =>
      clienteForm.nombre.trim() !== (editingCliente?.nombre || '') ||
      clienteForm.telefono.trim() !== (editingCliente?.telefono || '') ||
      clienteForm.correo.trim() !== (editingCliente?.correo || ''),
    closeOnBackdrop: true,
  });

  const vehiculoModalDismiss = useModalDismiss({
    isOpen: isVehiculoModalOpen,
    onClose: () => {
      setIsVehiculoModalOpen(false);
      setVehiculoErrors({});
    },
    isDirty: () =>
      vehiculoForm.clienteId !== (editingVehiculo?.clienteId || clientes[0]?.id || '') ||
      vehiculoForm.marca.trim() !== (editingVehiculo?.marca || '') ||
      vehiculoForm.modelo.trim() !== (editingVehiculo?.modelo || '') ||
      vehiculoForm.placas.trim() !== (editingVehiculo?.placas || '') ||
      vehiculoForm.año.trim() !== (editingVehiculo?.año || ''),
    closeOnBackdrop: true,
  });

  const handleSaveConfiguracion = (newConf: ConfiguracionTaller) => {
    const oldConf = configuracion;
    setConfiguracion(newConf);

    const detalles: DetalleCambioBitacora[] = [];
    if (oldConf.nombre !== newConf.nombre) {
      detalles.push({ etiqueta: 'Nombre del taller', anterior: oldConf.nombre, nuevo: newConf.nombre });
    }
    if ((oldConf.telefono || '') !== (newConf.telefono || '')) {
      detalles.push({ etiqueta: 'Teléfono', anterior: oldConf.telefono || '(sin teléfono)', nuevo: newConf.telefono || '(sin teléfono)' });
    }
    if ((oldConf.direccion || '') !== (newConf.direccion || '')) {
      detalles.push({ etiqueta: 'Dirección', anterior: oldConf.direccion || '(sin dirección)', nuevo: newConf.direccion || '(sin dirección)' });
    }

    registrarEvento(
      'Cambio de configuración',
      'Configuración',
      'Actualización de la configuración general del taller',
      undefined,
      undefined,
      detalles
    );
  };

  const currentItem =
    MENU_ITEMS.find((item) => item.id === activeSection) || {
      id: activeSection,
      label:
        activeSection === 'garantias'
          ? 'Garantías'
          : activeSection === 'bitacora'
          ? 'Bitácora de actividad'
          : 'Catálogos',
      icon:
        activeSection === 'garantias'
          ? ShieldCheck
          : activeSection === 'bitacora'
          ? ClipboardList
          : Layers,
    };

  const isSectionAllowed = (section: SectionId, rol?: RolUsuario): boolean => {
    if (!rol) return false;
    if (rol === 'Administrador') return true;

    // Recepción/CRM: clientes, vehículos, flotillas, citas, prospectos, seguimientos y creación inicial de órdenes
    if (rol === 'Recepción/CRM' || rol === 'Recepción') {
      return [
        'dashboard',
        'nueva-atencion',
        'clientes',
        'vehiculos',
        'flotillas',
        'historial-vehicular',
        'citas',
        'ordenes',
        'calendario',
        'prospectos',
        'atencion-asistida',
      ].includes(section);
    }

    // Cotizador: servicios, refacciones y elaboración de cotizaciones
    if (rol === 'Cotizador') {
      return [
        'dashboard',
        'cotizaciones',
        'servicios',
        'inventario',
        'historial-vehicular',
      ].includes(section);
    }

    // Técnico: diagnóstico y actualización de órdenes asignadas
    if (rol === 'Técnico' || rol === 'Mecánico') {
      return [
        'dashboard',
        'ordenes',
        'vehiculos',
        'historial-vehicular',
      ].includes(section);
    }

    // Control de calidad: revisión, aprobación o rechazo de trabajos terminados
    if (rol === 'Control de calidad') {
      return [
        'dashboard',
        'ordenes',
        'garantias',
        'historial-vehicular',
      ].includes(section);
    }

    // Caja: facturas, pagos y consulta del resumen de la orden
    if (rol === 'Caja') {
      return [
        'dashboard',
        'facturacion',
        'ordenes',
        'historial-vehicular',
      ].includes(section);
    }

    return false;
  };

  const handleSelectSection = (id: SectionId) => {
    notifySectionChange();
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    setIsClienteModalOpen(false);
    setIsVehiculoModalOpen(false);
    setHistorialTarget(null);
    setIsCentroAvisosOpen(false);
    document.body.style.overflow = '';
    if (CATALOGOS_ITEMS.some((i) => i.id === id)) {
      setOpenDropdown('catalogos');
    } else if (ADMINISTRACION_ITEMS.some((i) => i.id === id)) {
      setOpenDropdown('administracion');
    } else if (CONFIGURACION_ITEMS.some((i) => i.id === id)) {
      setOpenDropdown('configuracion');
    }
  };

  // ETAPA 24: Centro de avisos y pendientes (Cálculo dinámico basado en registros actuales)
  const [isCentroAvisosOpen, setIsCentroAvisosOpen] = useState(false);
  const [vistosAvisosIds, setVistosAvisosIds] = useState<string[]>([]);
  const desktopBellRef = useRef<HTMLButtonElement>(null);
  const mobileBellRef = useRef<HTMLButtonElement>(null);
  const lastBellRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenCentroAvisos = (fromMobile = false) => {
    lastBellRef.current = fromMobile ? mobileBellRef.current : desktopBellRef.current;
    setIsCentroAvisosOpen(true);
  };

  const handleCloseCentroAvisos = () => {
    setIsCentroAvisosOpen(false);
    setTimeout(() => {
      lastBellRef.current?.focus();
    }, 50);
  };

  const handleMarcarAvisoVisto = (avisoId: string) => {
    setVistosAvisosIds((prev) => (prev.includes(avisoId) ? prev : [...prev, avisoId]));
  };

  // Cálculo en tiempo real de pendientes sin duplicar datos ni almacenar estadísticas
  const todosLosAvisos = useMemo<AvisoPendiente[]>(() => {
    if (!sesion) return [];

    const hoyStr = getHoyDateString();
    const en7DiasStr = getEnDiasDateString(7);
    const rol = sesion.rol;
    const isMecanico = rol === 'Mecánico' || rol === 'Técnico';
    const isRecepcion = rol === 'Recepción' || rol === 'Recepción/CRM';
    const isCotizador = rol === 'Cotizador';
    const isControlCalidad = rol === 'Control de calidad';
    const isCaja = rol === 'Caja';
    const isAdmin = rol === 'Administrador';

    const avisosGenerados: (AvisoPendiente & { fechaSort: string })[] = [];

    // Helper map para resolución rápida de cliente y vehículo
    const vMap = new Map<string, Vehiculo>();
    vehiculos.forEach((v) => vMap.set(v.id, v));
    const cMap = new Map<string, Cliente>();
    clientes.forEach((c) => cMap.set(c.id, c));

    // Refacciones relacionadas a órdenes asignadas del mecánico
    const refaccionesRelacionadasMecanicoIds = new Set<string>();
    if (isMecanico) {
      ordenes.forEach((o) => {
        const esAsignada =
          o.mecanicoId === sesion.usuarioId ||
          o.mecanicoId === sesion.empleadoId ||
          o.mecanicoNombre === sesion.nombre;
        if (esAsignada && o.refaccionesUtilizadas) {
          o.refaccionesUtilizadas.forEach((ru) => {
            refaccionesRelacionadasMecanicoIds.add(ru.refaccionId);
          });
        }
      });
    }

    // 1. Citas programadas para hoy (Admin y Recepción)
    if (isAdmin || isRecepcion) {
      citas.forEach((cita) => {
        if (cita.estado === 'Programada' && cita.fecha === hoyStr) {
          const cli = cMap.get(cita.clienteId);
          const veh = vMap.get(cita.vehiculoId);
          const vehDesc = veh ? `${veh.marca} ${veh.modelo}` : 'Vehículo';
          avisosGenerados.push({
            id: `cita-${cita.id}-${cita.fecha}-${cita.hora}-${cita.estado}`,
            tipo: 'Cita programada',
            titulo: `Cita de hoy: ${cli?.nombre || 'Cliente'}`,
            descripcion: `${cita.servicio} — ${vehDesc}`,
            fechaHoraRelacionada: `Hoy a las ${cita.hora} hrs`,
            nivel: 'Información',
            seccionDestino: 'citas',
            registroId: cita.id,
            esHoy: true,
            esUrgente: false,
            fechaSort: `${cita.fecha} ${cita.hora}`,
          });
        }
      });
    }

    // 2. Órdenes con entrega prometida vencida
    // Admin y Recepción ven todas; Mecánico solo asignadas
    ordenes.forEach((orden) => {
      const estaPendienteEntrega = !orden.entregado && orden.estado !== 'Terminado';
      const tienePrometidaVencida =
        Boolean(orden.fechaEntregaPrometida) && orden.fechaEntregaPrometida! < hoyStr;

      if (estaPendienteEntrega && tienePrometidaVencida) {
        const esAsignada =
          orden.mecanicoId === sesion.usuarioId ||
          orden.mecanicoId === sesion.empleadoId ||
          orden.mecanicoNombre === sesion.nombre;

        if (isAdmin || isRecepcion || (isMecanico && esAsignada)) {
          const cli = cMap.get(orden.clienteId);
          const veh = vMap.get(orden.vehiculoId);
          const vehDesc = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : '';
          avisosGenerados.push({
            id: `orden-${orden.id}-${orden.fechaEntregaPrometida}-${orden.estado}-${orden.entregado}`,
            tipo: 'Orden de trabajo',
            titulo: `Entrega vencida: ${orden.folio}`,
            descripcion: `${orden.servicio} — ${cli?.nombre || 'Cliente'}${vehDesc ? ` · ${vehDesc}` : ''}`,
            fechaHoraRelacionada: `Prometida: ${orden.fechaEntregaPrometida}`,
            nivel: 'Urgente',
            seccionDestino: 'ordenes',
            registroId: orden.id,
            esHoy: false,
            esUrgente: true,
            fechaSort: `${orden.fechaEntregaPrometida} 00:00`,
          });
        }
      }
    });

    // 3. Cotizaciones pendientes de autorización (Admin y Recepción)
    if (isAdmin || isRecepcion) {
      cotizaciones.forEach((cot) => {
        if (cot.estado === 'Por autorizar') {
          const cli = cMap.get(cot.clienteId);
          avisosGenerados.push({
            id: `cot-${cot.id}-${cot.estado}-${cot.total}`,
            tipo: 'Cotización',
            titulo: `Cotización por autorizar: ${cot.folio}`,
            descripcion: `${cli ? `${cli.nombre} — ` : ''}${cot.descripcion} · Total: $${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
            fechaHoraRelacionada: `Importe: $${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
            nivel: 'Atención',
            seccionDestino: 'cotizaciones',
            registroId: cot.id,
            esHoy: false,
            esUrgente: false,
            fechaSort: cot.creadoEn || '9999-99-99',
          });
        }
      });
    }

    // 4. Seguimientos pendientes vencidos o programados para hoy (Admin y Recepción)
    if (isAdmin || isRecepcion) {
      seguimientos.forEach((seg) => {
        if (seg.estado === 'Pendiente') {
          const esVencido = seg.fecha < hoyStr;
          const esHoy = seg.fecha === hoyStr;

          if (esVencido || esHoy) {
            avisosGenerados.push({
              id: `seg-${seg.id}-${seg.fecha}-${seg.hora}-${seg.estado}`,
              tipo: 'Seguimiento',
              titulo: `Seguimiento: ${seg.motivoLabel || seg.registroRef || 'Comercial'}`,
              descripcion: seg.mensaje || seg.registroRef || 'Seguimiento pendiente de atención.',
              fechaHoraRelacionada: esVencido
                ? `Venció el ${seg.fecha} a las ${seg.hora} hrs`
                : `Hoy a las ${seg.hora} hrs`,
              nivel: esVencido ? 'Urgente' : 'Información',
              seccionDestino: 'atencion-asistida',
              registroId: seg.id,
              esHoy: esHoy,
              esUrgente: esVencido,
              fechaSort: `${seg.fecha} ${seg.hora}`,
            });
          }
        }
      });
    }

    // 5. Refacciones con stock bajo
    // Admin ve todas; Mecánico solo las relacionadas a sus órdenes asignadas; Recepción no ve inventario
    if (isAdmin || isMecanico) {
      refacciones.forEach((ref) => {
        if (ref.existencias <= ref.minimo) {
          if (isAdmin || (isMecanico && refaccionesRelacionadasMecanicoIds.has(ref.id))) {
            avisosGenerados.push({
              id: `ref-${ref.id}-${ref.existencias}-${ref.minimo}`,
              tipo: 'Refacción',
              titulo: `Stock bajo: ${ref.codigo}`,
              descripcion: `${ref.nombre} — Existencias: ${ref.existencias} pzs (Mínimo requerido: ${ref.minimo} pzs)`,
              fechaHoraRelacionada: `Stock: ${ref.existencias} / Mín: ${ref.minimo}`,
              nivel: 'Atención',
              seccionDestino: 'inventario',
              registroId: ref.id,
              esHoy: false,
              esUrgente: false,
              fechaSort: String(ref.existencias).padStart(4, '0'),
            });
          }
        }
      });
    }

    // 6. Garantías próximas a vencer en los siguientes siete días (Admin y Recepción)
    if (isAdmin || isRecepcion) {
      garantias.forEach((gar) => {
        if (
          gar.estado === 'Vigente' &&
          gar.fechaVencimiento >= hoyStr &&
          gar.fechaVencimiento <= en7DiasStr
        ) {
          avisosGenerados.push({
            id: `gar-${gar.id}-${gar.fechaVencimiento}-${gar.estado}`,
            tipo: 'Garantía',
            titulo: `Garantía próxima a vencer: ${gar.folio}`,
            descripcion: `${gar.clienteNombre} (${gar.vehiculoDescripcion}) — ${gar.trabajoCubierto}`,
            fechaHoraRelacionada: `Vence el ${gar.fechaVencimiento}`,
            nivel: 'Atención',
            seccionDestino: 'garantias',
            registroId: gar.id,
            esHoy: gar.fechaVencimiento === hoyStr,
            esUrgente: false,
            fechaSort: `${gar.fechaVencimiento} 00:00`,
          });
        }
      });
    }

    // Ordenamiento: primero Urgentes, después más próximos (Atención, luego Información)
    const pesoNivel: Record<NivelAviso, number> = {
      Urgente: 0,
      Atención: 1,
      Información: 2,
    };

    avisosGenerados.sort((a, b) => {
      const pDiff = pesoNivel[a.nivel] - pesoNivel[b.nivel];
      if (pDiff !== 0) return pDiff;
      return a.fechaSort.localeCompare(b.fechaSort);
    });

    return avisosGenerados.filter((a) => isSectionAllowed(a.seccionDestino, rol));
  }, [sesion, citas, ordenes, cotizaciones, seguimientos, refacciones, garantias, vehiculos, clientes]);

  const avisosVisiblesNoVistos = useMemo(() => {
    return todosLosAvisos.filter((a) => !vistosAvisosIds.includes(a.id));
  }, [todosLosAvisos, vistosAvisosIds]);

  const totalPendientesCount = avisosVisiblesNoVistos.length;
  const tieneAvisosUrgentes = avisosVisiblesNoVistos.some((a) => a.nivel === 'Urgente');

  const toggleDropdown = (name: 'catalogos' | 'administracion' | 'configuracion') => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const clienteMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach((c) => map.set(c.id, c));
    return map;
  }, [clientes]);

  const normalizePlates = (plate: string) => plate.replace(/\s+/g, '').toUpperCase();

  // Cliente Modal handlers
  const handleOpenAddCliente = () => {
    setEditingCliente(null);
    setClienteForm({ nombre: '', telefono: '', correo: '' });
    setClienteErrors({});
    setIsClienteModalOpen(true);
  };

  const handleOpenEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setClienteForm({ nombre: c.nombre, telefono: c.telefono, correo: c.correo || '' });
    setClienteErrors({});
    setIsClienteModalOpen(true);
  };

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { nombre?: string; telefono?: string } = {};

    if (!clienteForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
    if (!clienteForm.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.';

    if (Object.keys(errors).length > 0) {
      setClienteErrors(errors);
      return;
    }

    if (editingCliente) {
      const oldCliente = editingCliente;
      const updatedCliente: Cliente = {
        ...oldCliente,
        nombre: clienteForm.nombre.trim(),
        telefono: clienteForm.telefono.trim(),
        correo: clienteForm.correo.trim() || undefined,
      };
      setClientes((prev) =>
        prev.map((c) => (c.id === oldCliente.id ? updatedCliente : c))
      );

      const detalles: DetalleCambioBitacora[] = [];
      if (oldCliente.nombre !== updatedCliente.nombre) {
        detalles.push({ etiqueta: 'Nombre', anterior: oldCliente.nombre, nuevo: updatedCliente.nombre });
      }
      if (oldCliente.telefono !== updatedCliente.telefono) {
        detalles.push({ etiqueta: 'Teléfono', anterior: oldCliente.telefono, nuevo: updatedCliente.telefono });
      }
      if ((oldCliente.correo || '') !== (updatedCliente.correo || '')) {
        detalles.push({ etiqueta: 'Correo', anterior: oldCliente.correo || '(sin correo)', nuevo: updatedCliente.correo || '(sin correo)' });
      }

      registrarEvento(
        'Edición de cliente',
        'Clientes',
        `Actualización de datos del cliente ${updatedCliente.nombre}`,
        updatedCliente.id,
        updatedCliente.nombre,
        detalles
      );
      mostrarMensaje('Cliente actualizado con éxito.');
    } else {
      const newCliente: Cliente = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nombre: clienteForm.nombre.trim(),
        telefono: clienteForm.telefono.trim(),
        correo: clienteForm.correo.trim() || undefined,
      };
      setClientes((prev) => [newCliente, ...prev]);

      registrarEvento(
        'Creación de cliente',
        'Clientes',
        `Registro de nuevo cliente ${newCliente.nombre}`,
        newCliente.id,
        newCliente.nombre
      );
      mostrarMensaje('Cliente registrado con éxito.');
    }

    setIsClienteModalOpen(false);
  };

  // Vehículo Modal handlers
  const handleOpenAddVehiculo = () => {
    setEditingVehiculo(null);
    setVehiculoForm({
      clienteId: clientes[0]?.id || '',
      marca: '',
      modelo: '',
      placas: '',
      año: '',
    });
    setVehiculoErrors({});
    setIsVehiculoModalOpen(true);
  };

  const handleOpenEditVehiculo = (v: Vehiculo) => {
    setEditingVehiculo(v);
    setVehiculoForm({
      clienteId: v.clienteId,
      marca: v.marca,
      modelo: v.modelo,
      placas: v.placas,
      año: v.año || '',
    });
    setVehiculoErrors({});
    setIsVehiculoModalOpen(true);
  };

  const handleSaveVehiculo = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!vehiculoForm.clienteId.trim()) errors.clienteId = 'Debe seleccionar un cliente registrado.';
    if (!vehiculoForm.marca.trim()) errors.marca = 'La marca es obligatoria.';
    if (!vehiculoForm.modelo.trim()) errors.modelo = 'El modelo es obligatorio.';
    if (!vehiculoForm.placas.trim()) {
      errors.placas = 'Las placas son obligatorias.';
    } else {
      const normalizedNew = normalizePlates(vehiculoForm.placas);
      const isDuplicate = vehiculos.some((v) => {
        if (editingVehiculo && v.id === editingVehiculo.id) return false;
        return normalizePlates(v.placas) === normalizedNew;
      });
      if (isDuplicate) {
        errors.placas = 'Ya existe un vehículo registrado con estas placas.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setVehiculoErrors(errors);
      return;
    }

    if (editingVehiculo) {
      const oldVehiculo = editingVehiculo;
      const updatedVehiculo: Vehiculo = {
        ...oldVehiculo,
        clienteId: vehiculoForm.clienteId,
        marca: vehiculoForm.marca.trim(),
        modelo: vehiculoForm.modelo.trim(),
        placas: vehiculoForm.placas.trim().toUpperCase(),
        año: vehiculoForm.año.trim() || undefined,
      };
      setVehiculos((prev) =>
        prev.map((v) => (v.id === oldVehiculo.id ? updatedVehiculo : v))
      );

      const detalles: DetalleCambioBitacora[] = [];
      if (oldVehiculo.marca !== updatedVehiculo.marca || oldVehiculo.modelo !== updatedVehiculo.modelo) {
        detalles.push({ etiqueta: 'Vehículo', anterior: `${oldVehiculo.marca} ${oldVehiculo.modelo}`, nuevo: `${updatedVehiculo.marca} ${updatedVehiculo.modelo}` });
      }
      if (oldVehiculo.placas !== updatedVehiculo.placas) {
        detalles.push({ etiqueta: 'Placas', anterior: oldVehiculo.placas, nuevo: updatedVehiculo.placas });
      }
      if ((oldVehiculo.año || '') !== (updatedVehiculo.año || '')) {
        detalles.push({ etiqueta: 'Año', anterior: oldVehiculo.año || '(sin año)', nuevo: updatedVehiculo.año || '(sin año)' });
      }

      registrarEvento(
        'Edición de vehículo',
        'Vehículos',
        `Actualización del vehículo ${updatedVehiculo.marca} ${updatedVehiculo.modelo} (${updatedVehiculo.placas})`,
        updatedVehiculo.id,
        updatedVehiculo.placas,
        detalles
      );
      mostrarMensaje('Vehículo actualizado con éxito.');
    } else {
      const newVehiculo: Vehiculo = {
        id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clienteId: vehiculoForm.clienteId,
        marca: vehiculoForm.marca.trim(),
        modelo: vehiculoForm.modelo.trim(),
        placas: vehiculoForm.placas.trim().toUpperCase(),
        año: vehiculoForm.año.trim() || undefined,
      };
      setVehiculos((prev) => [newVehiculo, ...prev]);

      registrarEvento(
        'Creación de vehículo',
        'Vehículos',
        `Registro del vehículo ${newVehiculo.marca} ${newVehiculo.modelo} (${newVehiculo.placas})`,
        newVehiculo.id,
        newVehiculo.placas
      );
      mostrarMensaje('Vehículo registrado con éxito.');
    }

    setIsVehiculoModalOpen(false);
  };

  // Cita handlers
  const handleSaveCita = (savedCita: Cita) => {
    const oldCita = citas.find((c) => c.id === savedCita.id);
    setCitas((prev) => {
      const exists = prev.some((c) => c.id === savedCita.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCita.id ? savedCita : c));
      }
      return [savedCita, ...prev];
    });

    if (oldCita) {
      if (oldCita.fecha !== savedCita.fecha || oldCita.hora !== savedCita.hora) {
        registrarEvento(
          'Reprogramación de cita',
          'Citas',
          `Cita reprogramada para el ${savedCita.fecha} a las ${savedCita.hora} hrs`,
          savedCita.id,
          `Cita ${savedCita.fecha}`,
          [
            { etiqueta: 'Fecha', anterior: oldCita.fecha, nuevo: savedCita.fecha },
            { etiqueta: 'Hora', anterior: oldCita.hora, nuevo: savedCita.hora },
          ]
        );
      } else {
        registrarEvento(
          'Modificación de cita',
          'Citas',
          `Modificación en la cita del ${savedCita.fecha}`,
          savedCita.id,
          `Cita ${savedCita.fecha}`
        );
      }
    } else {
      registrarEvento(
        'Creación de cita',
        'Citas',
        `Nueva cita agendada para el ${savedCita.fecha} a las ${savedCita.hora} hrs`,
        savedCita.id,
        `Cita ${savedCita.fecha}`,
        [
          { etiqueta: 'Fecha', nuevo: savedCita.fecha },
          { etiqueta: 'Hora', nuevo: savedCita.hora },
          { etiqueta: 'Servicio', nuevo: savedCita.servicio },
        ]
      );
    }
  };

  const handleCancelCita = (citaId: string) => {
    const oldCita = citas.find((c) => c.id === citaId);
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: 'Cancelada' } : c))
    );

    if (oldCita) {
      registrarEvento(
        'Cancelación de cita',
        'Citas',
        `Cancelación de cita del ${oldCita.fecha} a las ${oldCita.hora} hrs`,
        oldCita.id,
        `Cita ${oldCita.fecha}`,
        [
          { etiqueta: 'Estado', anterior: oldCita.estado, nuevo: 'Cancelada' },
        ]
      );
    }
  };

  // Cotizaciones handlers
  const handleSaveCotizacion = (savedCot: Cotizacion) => {
    const oldCot = cotizaciones.find((c) => c.id === savedCot.id);
    setCotizaciones((prev) => {
      const exists = prev.some((c) => c.id === savedCot.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCot.id ? savedCot : c));
      }
      return [savedCot, ...prev];
    });

    if (oldCot) {
      // Check if authorization was added or updated
      if (savedCot.autorizacion && (!oldCot.autorizacion || oldCot.autorizacion.fechaHora !== savedCot.autorizacion.fechaHora)) {
        registrarEvento(
          'Registro de autorización',
          'Cotizaciones',
          `Autorización registrada para cotización ${savedCot.folio} por ${savedCot.autorizacion.autorizadoPor}`,
          savedCot.id,
          savedCot.folio,
          [
            { etiqueta: 'Autorizado por', nuevo: savedCot.autorizacion.autorizadoPor },
            { etiqueta: 'Total autorizado', nuevo: `$${savedCot.autorizacion.totalAutorizado.toLocaleString('es-MX')}` },
          ]
        );
      } else if (savedCot.estado !== oldCot.estado) {
        const accion = savedCot.estado === 'Aprobada' ? 'Aprobación de cotización' : savedCot.estado === 'Rechazada' ? 'Rechazo de cotización' : 'Modificación de cotización';
        registrarEvento(
          accion,
          'Cotizaciones',
          `${accion} para ${savedCot.folio}`,
          savedCot.id,
          savedCot.folio,
          [
            { etiqueta: 'Estado', anterior: oldCot.estado, nuevo: savedCot.estado },
          ]
        );
      } else {
        registrarEvento(
          'Modificación de cotización',
          'Cotizaciones',
          `Modificación en la cotización ${savedCot.folio}`,
          savedCot.id,
          savedCot.folio,
          [
            { etiqueta: 'Total', anterior: `$${oldCot.total.toLocaleString('es-MX')}`, nuevo: `$${savedCot.total.toLocaleString('es-MX')}` },
          ]
        );
      }
    } else {
      registrarEvento(
        'Creación de cotización',
        'Cotizaciones',
        `Creación de cotización ${savedCot.folio} por $${savedCot.total.toLocaleString('es-MX')}`,
        savedCot.id,
        savedCot.folio,
        [
          { etiqueta: 'Total', nuevo: `$${savedCot.total.toLocaleString('es-MX')}` },
          { etiqueta: 'Estado', nuevo: savedCot.estado },
        ]
      );
    }
  };

  const handleUpdateCotizacionEstado = (id: string, nuevoEstado: 'Aprobada' | 'Rechazada') => {
    const oldCot = cotizaciones.find((c) => c.id === id);
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
    );

    if (oldCot) {
      const accion = nuevoEstado === 'Aprobada' ? 'Aprobación de cotización' : 'Rechazo de cotización';
      registrarEvento(
        accion,
        'Cotizaciones',
        `${accion} para ${oldCot.folio}`,
        oldCot.id,
        oldCot.folio,
        [
          { etiqueta: 'Estado', anterior: oldCot.estado, nuevo: nuevoEstado },
        ]
      );
    }
  };

  // Órdenes handler
  const handleSaveOrden = (savedOrd: OrdenTrabajo) => {
    const oldOrd = ordenes.find((o) => o.id === savedOrd.id);
    setOrdenes((prev) => {
      const exists = prev.some((o) => o.id === savedOrd.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOrd.id ? savedOrd : o));
      }
      return [savedOrd, ...prev];
    });

    if (oldOrd) {
      if (!oldOrd.entregado && savedOrd.entregado) {
        registrarEvento(
          'Entrega de trabajo',
          'Órdenes',
          `Entrega de vehículo realizada para la orden ${savedOrd.folio}`,
          savedOrd.id,
          savedOrd.folio,
          [
            { etiqueta: 'Estado', anterior: oldOrd.estado, nuevo: 'Entregado' },
          ]
        );
      } else if (!oldOrd.trabajoTerminado && savedOrd.trabajoTerminado) {
        registrarEvento(
          'Terminación de trabajo',
          'Órdenes',
          `Trabajo marcado como terminado en orden ${savedOrd.folio}`,
          savedOrd.id,
          savedOrd.folio,
          [
            { etiqueta: 'Estado', anterior: oldOrd.estado, nuevo: 'Terminado' },
          ]
        );
      } else if (oldOrd.estado !== savedOrd.estado) {
        if (savedOrd.estado === 'En proceso') {
          registrarEvento(
            'Inicio de trabajo',
            'Órdenes',
            `Inicio de trabajos en la orden ${savedOrd.folio}`,
            savedOrd.id,
            savedOrd.folio,
            [
              { etiqueta: 'Estado', anterior: oldOrd.estado, nuevo: 'En proceso' },
            ]
          );
        } else {
          registrarEvento(
            'Cambio de estado de orden',
            'Órdenes',
            `Cambio de estado de la orden ${savedOrd.folio} a ${savedOrd.estado}`,
            savedOrd.id,
            savedOrd.folio,
            [
              { etiqueta: 'Estado', anterior: oldOrd.estado, nuevo: savedOrd.estado },
            ]
          );
        }
      }
    } else {
      registrarEvento(
        'Creación de orden',
        'Órdenes',
        `Apertura de orden de trabajo ${savedOrd.folio}`,
        savedOrd.id,
        savedOrd.folio
      );
    }
  };

  // Mutual linking handlers (ETAPA 7)
  const handleLinkCotizacionToOrden = (cotizacionId: string, ordenId: string) => {
    setCotizaciones((prev) =>
      prev.map((c) => {
        if (c.id === cotizacionId) {
          return { ...c, ordenId };
        }
        if (c.ordenId === ordenId) {
          const updated = { ...c };
          delete updated.ordenId;
          return updated;
        }
        return c;
      })
    );
    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id === ordenId) {
          return { ...o, cotizacionId };
        }
        if (o.cotizacionId === cotizacionId) {
          const updated = { ...o };
          delete updated.cotizacionId;
          return updated;
        }
        return o;
      })
    );
  };

  const handleCreateOrdenFromCotizacion = (cot: Cotizacion) => {
    const count = ordenes.length + 1;
    const newFolio = `ORD-${String(count).padStart(3, '0')}`;
    const newOrd: OrdenTrabajo = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: newFolio,
      clienteId: cot.clienteId,
      vehiculoId: cot.vehiculoId,
      cotizacionId: cot.id,
      servicio: cot.descripcion,
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
    };

    setOrdenes((prev) => [newOrd, ...prev]);
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cot.id ? { ...c, ordenId: newOrd.id } : c))
    );

    registrarEvento(
      'Creación de orden',
      'Órdenes',
      `Apertura de orden de trabajo ${newFolio} vinculada a cotización ${cot.folio}`,
      newOrd.id,
      newOrd.folio
    );
  };

  const handleLinkOrdenAndCotizacion = (ordenId: string, cotizacionId: string) => {
    handleLinkCotizacionToOrden(cotizacionId, ordenId);
  };

  const handleCreateCotizacionForOrden = (
    ordenId: string,
    desc: string,
    ref: number,
    mo: number
  ): Cotizacion => {
    const ord = ordenes.find((o) => o.id === ordenId);
    const count = cotizaciones.length + 1;
    const newFolio = `COT-${String(count).padStart(3, '0')}`;
    const newCot: Cotizacion = {
      id: `cot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: newFolio,
      clienteId: ord?.clienteId || clientes[0]?.id || '',
      vehiculoId: ord?.vehiculoId || vehiculos[0]?.id || '',
      ordenId: ordenId,
      descripcion: desc,
      importeRefacciones: ref,
      importeManoObra: mo,
      total: ref + mo,
      estado: 'Por autorizar',
      creadoEn: new Date().toISOString(),
    };

    setCotizaciones((prev) => [newCot, ...prev]);
    setOrdenes((prev) =>
      prev.map((o) => (o.id === ordenId ? { ...o, cotizacionId: newCot.id } : o))
    );

    registrarEvento(
      'Creación de cotización',
      'Cotizaciones',
      `Creación de cotización ${newFolio} vinculada a la orden`,
      newCot.id,
      newCot.folio,
      [
        { etiqueta: 'Total', nuevo: `$${newCot.total.toLocaleString('es-MX')}` },
      ]
    );

    return newCot;
  };

  const handleSaveServicio = (savedServicio: ServicioCatalogo) => {
    setServicios((prev) => {
      const idx = prev.findIndex((s) => s.id === savedServicio.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedServicio;
        return updated;
      }
      return [savedServicio, ...prev];
    });
  };

  // Inventario handlers (ETAPA 9)
  const handleSaveRefaccion = (savedRef: Refaccion, initialMovement?: MovimientoInventario) => {
    setRefacciones((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRef.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedRef;
        return updated;
      }
      return [savedRef, ...prev];
    });
    if (initialMovement) {
      setMovimientos((prev) => [initialMovement, ...prev]);
    }
  };

  const handleRecordMovement = (mov: MovimientoInventario) => {
    setMovimientos((prev) => [mov, ...prev]);
    setRefacciones((prev) =>
      prev.map((r) => {
        if (r.id !== mov.refaccionId) return r;
        const newStock =
          mov.tipo === 'Entrada'
            ? r.existencias + mov.cantidad
            : Math.max(0, r.existencias - mov.cantidad);
        return { ...r, existencias: newStock };
      })
    );

    const ref = refacciones.find((r) => r.id === mov.refaccionId);
    if (mov.tipo === 'Entrada') {
      registrarEvento(
        'Entrada de inventario',
        'Inventario',
        `Entrada de ${mov.cantidad} pza(s) al inventario: ${mov.motivo}`,
        mov.refaccionId,
        ref?.codigo,
        [
          { etiqueta: 'Cantidad', nuevo: `+${mov.cantidad} pzas` },
          { etiqueta: 'Motivo', nuevo: mov.motivo },
        ]
      );
    } else {
      registrarEvento(
        'Salida de inventario',
        'Inventario',
        `Salida de ${mov.cantidad} pza(s) de inventario: ${mov.motivo}`,
        mov.refaccionId,
        ref?.codigo,
        [
          { etiqueta: 'Cantidad', nuevo: `-${mov.cantidad} pzas` },
          { etiqueta: 'Motivo', nuevo: mov.motivo },
        ]
      );
    }
  };

  const handleUseRefaccionInOrden = (
    ordenId: string,
    refaccionId: string,
    cantidad: number
  ) => {
    if (cantidad <= 0) return;
    const targetRef = refacciones.find((r) => r.id === refaccionId);
    const targetOrd = ordenes.find((o) => o.id === ordenId);
    if (!targetRef || !targetOrd || targetRef.existencias < cantidad) return;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newMov: MovimientoInventario = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId,
      tipo: 'Salida',
      cantidad,
      motivo: `Uso en orden de trabajo ${targetOrd.folio}`,
      ordenId,
      fechaHora: formattedDate,
    };

    const usedItem: RefaccionUtilizadaOrden = {
      id: `ru-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId,
      cantidad,
      devueltas: 0,
      fechaHora: formattedDate,
    };

    setMovimientos((prev) => [newMov, ...prev]);

    setRefacciones((prev) =>
      prev.map((r) =>
        r.id === refaccionId ? { ...r, existencias: Math.max(0, r.existencias - cantidad) } : r
      )
    );

    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== ordenId) return o;
        const currentUsed = o.refaccionesUtilizadas || [];
        return {
          ...o,
          refaccionesUtilizadas: [...currentUsed, usedItem],
        };
      })
    );

    registrarEvento(
      'Salida de inventario',
      'Inventario',
      `Asignación de ${cantidad} pza(s) de ${targetRef.nombre} para orden ${targetOrd.folio}`,
      targetOrd.id,
      targetOrd.folio,
      [
        { etiqueta: 'Refacción', nuevo: targetRef.nombre },
        { etiqueta: 'Cantidad utilizada', nuevo: `${cantidad} pzas` },
      ]
    );
  };

  const handleReturnRefaccionFromOrden = (
    ordenId: string,
    refaccionUtilizadaId: string,
    cantidadDevolver: number,
    motivo?: string
  ) => {
    if (cantidadDevolver <= 0) return;
    const targetOrd = ordenes.find((o) => o.id === ordenId);
    if (!targetOrd || !targetOrd.refaccionesUtilizadas) return;

    const usedItem = targetOrd.refaccionesUtilizadas.find((u) => u.id === refaccionUtilizadaId);
    if (!usedItem) return;

    const currentlyUsed = usedItem.cantidad - (usedItem.devueltas || 0);
    if (cantidadDevolver > currentlyUsed) return;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newMov: MovimientoInventario = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId: usedItem.refaccionId,
      tipo: 'Entrada',
      cantidad: cantidadDevolver,
      motivo: motivo?.trim() || `Devolución de refacción desde orden ${targetOrd.folio}`,
      ordenId,
      fechaHora: formattedDate,
    };

    setMovimientos((prev) => [newMov, ...prev]);

    setRefacciones((prev) =>
      prev.map((r) =>
        r.id === usedItem.refaccionId ? { ...r, existencias: r.existencias + cantidadDevolver } : r
      )
    );

    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== ordenId) return o;
        const updatedUsed = (o.refaccionesUtilizadas || []).map((u) => {
          if (u.id !== refaccionUtilizadaId) return u;
          return {
            ...u,
            devueltas: (u.devueltas || 0) + cantidadDevolver,
          };
        });
        return {
          ...o,
          refaccionesUtilizadas: updatedUsed,
        };
      })
    );

    registrarEvento(
      'Devolución de inventario',
      'Inventario',
      `Devolución de ${cantidadDevolver} pza(s) de refacción desde orden ${targetOrd.folio}`,
      targetOrd.id,
      targetOrd.folio,
      [
        { etiqueta: 'Cantidad devuelta', nuevo: `${cantidadDevolver} pzas` },
        { etiqueta: 'Motivo', nuevo: motivo?.trim() || 'Devolución de almacén' },
      ]
    );
  };

  // Flotillas handlers
  const handleSaveFlotilla = (flotilla: Flotilla) => {
    setFlotillas((prev) => {
      const exists = prev.some((f) => f.id === flotilla.id);
      let updated: Flotilla[];
      if (exists) {
        updated = prev.map((f) => (f.id === flotilla.id ? flotilla : f));
      } else {
        updated = [flotilla, ...prev];
      }
      // Regla: Un vehículo no puede pertenecer a dos flotillas al mismo tiempo
      return updated.map((f) => {
        if (f.id === flotilla.id) return f;
        return {
          ...f,
          vehiculoIds: f.vehiculoIds.filter((vId) => !flotilla.vehiculoIds.includes(vId)),
        };
      });
    });

    registrarEvento(
      'Registro de flotilla',
      'Flotillas',
      `Guardado de datos de la flotilla "${flotilla.nombre}" (${flotilla.empresa}) con ${flotilla.vehiculoIds.length} vehículos asignados.`,
      flotilla.id,
      flotilla.nombre
    );
    mostrarMensaje(`Flotilla "${flotilla.nombre}" guardada correctamente.`);
  };

  const handleDeleteFlotilla = (flotillaId: string) => {
    const flot = flotillas.find((f) => f.id === flotillaId);
    setFlotillas((prev) => prev.filter((f) => f.id !== flotillaId));
    if (flot) {
      registrarEvento(
        'Eliminación de flotilla',
        'Flotillas',
        `Se eliminó la flotilla "${flot.nombre}" (${flot.empresa}).`,
        flotillaId,
        flot.nombre
      );
      mostrarMensaje(`Flotilla "${flot.nombre}" eliminada.`);
    }
  };

  // Órdenes de compra handlers
  const handleSaveOrdenCompra = (oc: OrdenCompra) => {
    setOrdenesCompra((prev) => {
      const exists = prev.some((o) => o.id === oc.id);
      if (exists) {
        return prev.map((o) => (o.id === oc.id ? oc : o));
      }
      return [oc, ...prev];
    });

    registrarEvento(
      'Creación de orden de compra',
      'Inventario',
      `Generación de orden de compra ${oc.folio} para ${oc.cantidad} pzs de "${oc.refaccionNombre}".`,
      oc.id,
      oc.folio
    );
    mostrarMensaje(`Orden de compra "${oc.folio}" registrada exitosamente.`);
  };

  const handleMarcarOrdenCompraRecibida = (ocId: string) => {
    const oc = ordenesCompra.find((o) => o.id === ocId);
    if (!oc || oc.estado === 'Recibida') return;

    const fechaRecibida = new Date().toISOString();

    // 1. Marcar como recibida una sola vez
    setOrdenesCompra((prev) =>
      prev.map((o) => (o.id === ocId ? { ...o, estado: 'Recibida', recibidaEn: fechaRecibida } : o))
    );

    // 2. Incrementar existencias en almacén y actualizar fecha última compra
    setRefacciones((prev) =>
      prev.map((r) =>
        r.id === oc.refaccionId
          ? {
              ...r,
              existencias: r.existencias + oc.cantidad,
              fechaUltimaCompra: oc.fecha || new Date().toISOString().split('T')[0],
            }
          : r
      )
    );

    // 3. Registrar entrada en movimientos de inventario
    const nuevoMovimiento: MovimientoInventario = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId: oc.refaccionId,
      tipo: 'Entrada',
      cantidad: oc.cantidad,
      motivo: `Recepción de orden de compra ${oc.folio}`,
      fechaHora: new Date().toLocaleString('es-MX'),
    };
    setMovimientos((prev) => [nuevoMovimiento, ...prev]);

    registrarEvento(
      'Recepción de orden de compra',
      'Inventario',
      `Recepción de orden ${oc.folio}. Entrada registrada de ${oc.cantidad} pzas al inventario.`,
      oc.id,
      oc.folio,
      [
        { etiqueta: 'Refacción', nuevo: oc.refaccionNombre },
        { etiqueta: 'Cantidad ingresada', nuevo: `+${oc.cantidad} pzas` },
        { etiqueta: 'Proveedor', nuevo: oc.proveedor },
      ]
    );
    mostrarMensaje(`Orden ${oc.folio} recibida. Se ingresaron ${oc.cantidad} pzs al stock.`);
  };

  // Filtered Clientes and Vehículos
  const filteredClientes = useMemo(() => {
    const q = searchCliente.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.toLowerCase().includes(q)
    );
  }, [clientes, searchCliente]);

  const vehiculosPermitidos = useMemo(() => {
    if (sesion?.rol !== 'Mecánico') return vehiculos;
    const misVehiculoIds = new Set(
      ordenes
        .filter(
          (o) =>
            o.mecanicoId === sesion.usuarioId ||
            o.mecanicoId === sesion.empleadoId ||
            o.mecanicoNombre === sesion.nombre
        )
        .map((o) => o.vehiculoId)
    );
    return vehiculos.filter((v) => misVehiculoIds.has(v.id));
  }, [vehiculos, ordenes, sesion]);

  const filteredVehiculos = useMemo(() => {
    const q = searchVehiculo.toLowerCase().trim();
    if (!q) return vehiculosPermitidos;
    return vehiculosPermitidos.filter((v) => {
      const placasMatch = v.placas.toLowerCase().includes(q);
      const ownerName = clienteMap.get(v.clienteId)?.nombre?.toLowerCase() || '';
      return placasMatch || ownerName.includes(q);
    });
  }, [vehiculosPermitidos, clienteMap, searchVehiculo]);

  if (!sesion) {
    return (
      <LoginView
        workshopName={configuracion.nombre || 'Taller mecánico'}
        usuarios={usuarios}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F8FA] text-[#231F20] font-sans selection:bg-[#1D7EAE] selection:text-white">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white text-[#231F20] border-b border-[#DDE4E8] shadow-2xs sticky top-0 z-30 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <IotLogo variant="dark" size="sm" />
          <div className="h-4 w-px bg-[#DDE4E8] shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-xs text-[#231F20] tracking-tight block leading-tight truncate">
              {configuracion.nombre || 'Taller mecánico'}
            </span>
            <span className="text-[10px] text-[#5F6B73] font-medium block truncate">
              {sesion?.nombre} ({sesion?.rol})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Campana de avisos (discreta) */}
          <button
            ref={mobileBellRef}
            type="button"
            onClick={() => handleOpenCentroAvisos(true)}
            className="relative min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[#5F6B73] hover:text-[#231F20] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 transition-colors cursor-pointer"
            title={`Avisos (${totalPendientesCount > 9 ? '9+' : totalPendientesCount} pendientes)`}
            aria-label={`Avisos (${totalPendientesCount > 9 ? '9+' : totalPendientesCount} pendientes)`}
          >
            <Bell className="w-5 h-5 text-[#5F6B73]" />
            {totalPendientesCount > 0 ? (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-[#FF661B]">
                {totalPendientesCount > 9 ? '9+' : totalPendientesCount}
              </span>
            ) : (
              <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-medium flex items-center justify-center text-slate-400 bg-slate-100 border border-slate-200">
                0
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[#5F6B73] hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[#231F20] hover:bg-slate-100 transition-colors"
            aria-label={isMobileMenuOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity no-print"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Menú lateral izquierdo azul profundo #0032A0 IOT Technologies */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-40 w-64 bg-[#0032A0] text-blue-100 flex flex-col transition-transform duration-200 ease-in-out no-print ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IotLogo variant="light" size="sm" />
          </div>
          <button
            type="button"
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-blue-200 hover:text-white rounded-lg focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Top-level visible: 8 opciones principales */}
          {TOP_LEVEL_MENU_ITEMS.filter((item) => isSectionAllowed(item.id, sesion?.rol)).map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left min-h-[42px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#98DAE9]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Grupo desplegable 1: Catálogos */}
          {CATALOGOS_ITEMS.some((i) => isSectionAllowed(i.id, sesion?.rol)) && (
            <div className="pt-2">
              {(() => {
                const isCatalogosActive = CATALOGOS_ITEMS.some((i) => i.id === activeSection);
                const isOpen = openDropdown === 'catalogos';
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('catalogos')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors text-left min-h-[42px] cursor-pointer ${
                        isCatalogosActive
                          ? 'text-[#98DAE9] bg-white/10 pl-3'
                          : 'text-blue-200 hover:text-white hover:bg-white/10'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Catálogos</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-200" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-blue-200" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-1 space-y-1 pl-2">
                        {CATALOGOS_ITEMS.filter((i) => isSectionAllowed(i.id, sesion?.rol)).map((item) => {
                          const Icon = item.icon;
                          const isSelected = activeSection === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectSection(item.id)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-left min-h-[42px] cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#98DAE9]'}`} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Grupo desplegable 2: Administración */}
          {ADMINISTRACION_ITEMS.some((i) => isSectionAllowed(i.id, sesion?.rol)) && (
            <div className="pt-2">
              {(() => {
                const isAdminActive = ADMINISTRACION_ITEMS.some((i) => i.id === activeSection);
                const isOpen = openDropdown === 'administracion';
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('administracion')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors text-left min-h-[42px] cursor-pointer ${
                        isAdminActive
                          ? 'text-[#98DAE9] bg-white/10 pl-3'
                          : 'text-blue-200 hover:text-white hover:bg-white/10'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>Administración</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-200" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-blue-200" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-1 space-y-1 pl-2">
                        {ADMINISTRACION_ITEMS.filter((i) => isSectionAllowed(i.id, sesion?.rol)).map((item) => {
                          const Icon = item.icon;
                          const isSelected = activeSection === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectSection(item.id)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-left min-h-[42px] cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#98DAE9]'}`} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Grupo desplegable 3: Configuración */}
          {CONFIGURACION_ITEMS.some((i) => isSectionAllowed(i.id, sesion?.rol)) && (
            <div className="pt-2">
              {(() => {
                const isConfigActive = CONFIGURACION_ITEMS.some((i) => i.id === activeSection);
                const isOpen = openDropdown === 'configuracion';
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleDropdown('configuracion')}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors text-left min-h-[42px] cursor-pointer ${
                        isConfigActive
                          ? 'text-[#98DAE9] bg-white/10 pl-3'
                          : 'text-blue-200 hover:text-white hover:bg-white/10'
                      }`}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-blue-200" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-blue-200" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-1 space-y-1 pl-2">
                        {CONFIGURACION_ITEMS.filter((i) => isSectionAllowed(i.id, sesion?.rol)).map((item) => {
                          const Icon = item.icon;
                          const isSelected = activeSection === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectSection(item.id)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-left min-h-[42px] cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold'
                                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#98DAE9]'}`} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-blue-200/80 text-center">
          Sistema de Talleres Mecánicos
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F6F8FA]">
        {/* Encabezado superior blanco con Logotipo IOT Technologies, buscador, avisos y usuario */}
        <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-[#DDE4E8] shadow-2xs relative no-print">
          {/* Línea decorativa azul institucional */}
          <div className="absolute bottom-0 left-0 w-36 h-[2px] bg-[#1D7EAE]" />

          {/* Izquierda: Logotipo oficial IOT Technologies + nombre secundario */}
          <div className="flex items-center gap-3.5">
            <IotLogo variant="dark" size="sm" />
            <div className="h-5 w-px bg-[#DDE4E8]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#5F6B73] tracking-tight">
                  Sistema de Talleres Mecánicos
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D7EAE]" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#5F6B73]">
                <span className="font-medium text-[#231F20]">{configuracion.nombre || 'Taller mecánico'}</span>
                <span>/</span>
                <span className="text-[#1D7EAE] font-semibold capitalize">{activeSection.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Derecha: Buscador, Avisos, Usuario */}
          <div className="flex items-center gap-3.5">
            {/* Buscador */}
            <div className="relative w-52 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                placeholder="Buscar cliente, orden..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F6F8FA] border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:bg-white transition-all"
              />
            </div>

            {/* Campana de avisos (discreta) */}
            <button
              ref={desktopBellRef}
              type="button"
              onClick={() => handleOpenCentroAvisos(false)}
              className="relative min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-lg text-[#5F6B73] hover:text-[#231F20] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 transition-colors cursor-pointer"
              title={`Avisos (${totalPendientesCount > 9 ? '9+' : totalPendientesCount} pendientes)`}
              aria-label={`Avisos (${totalPendientesCount > 9 ? '9+' : totalPendientesCount} pendientes)`}
            >
              <Bell className="w-4.5 h-4.5 text-[#5F6B73]" />
              {totalPendientesCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-[#FF661B]">
                  {totalPendientesCount > 9 ? '9+' : totalPendientesCount}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-medium flex items-center justify-center text-slate-400 bg-slate-100 border border-slate-200">
                  0
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-[#DDE4E8]" />

            {/* Usuario */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-50 text-[#1D7EAE] font-bold text-xs flex items-center justify-center border border-[#98DAE9]/50">
                {sesion?.nombre.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-[#231F20] leading-tight">{sesion?.nombre}</p>
                <span
                  className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    sesion?.rol === 'Administrador'
                      ? 'bg-sky-50 text-[#1D7EAE] border border-[#98DAE9]/50'
                      : sesion?.rol === 'Recepción'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {sesion?.rol}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[#DDE4E8]" />

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5F6B73] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[36px]"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-5xl w-full mx-auto">
          {!isSectionAllowed(activeSection, sesion?.rol) ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto shadow-sm my-12">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#202124] mb-2">No tienes permiso para acceder</h3>
              <p className="text-sm text-[#5F6368] mb-6">
                Tu rol actual ({sesion?.rol}) no tiene autorización para consultar o gestionar esta sección.
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('dashboard')}
                className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
              >
                Volver al Dashboard
              </button>
            </div>
          ) : (
            <>
          {/* DASHBOARD (ETAPA 14) */}
          {activeSection === 'dashboard' && (
            <DashboardSection
              clientes={clientes}
              vehiculos={vehiculos}
              citas={citas}
              cotizaciones={cotizaciones}
              ordenes={ordenes}
              refacciones={refacciones}
              seguimientos={seguimientos}
              onNavigate={handleSelectSection}
              currentUser={sesion || undefined}
            />
          )}

          {/* NUEVA ATENCIÓN */}
          {activeSection === 'nueva-atencion' && (
            <NuevaAtencionSection
              clientes={clientes}
              vehiculos={vehiculos}
              servicios={servicios}
              cotizacionesCount={cotizaciones.length}
              ordenesCount={ordenes.length}
              onSaveNewClientAndVehicle={(newClient, newVeh) => {
                setClientes((prev) => [newClient, ...prev]);
                setVehiculos((prev) => [newVeh, ...prev]);
              }}
              onSaveCita={handleSaveCita}
              onSaveCotizacion={(newCot) => setCotizaciones((prev) => [newCot, ...prev])}
              onSaveOrden={(newOrd) => setOrdenes((prev) => [newOrd, ...prev])}
            />
          )}

          {/* CLIENTES */}
          {activeSection === 'clientes' && (
            <section className="space-y-6">
              {/* Encabezado IOT Technologies para Clientes */}
              <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                      Clientes
                    </h2>
                    <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
                      Consulta y administra los clientes registrados.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenAddCliente}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar cliente</span>
                  </button>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                />
              </div>

              <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F6F8FA] border-b border-[#DDE4E8] text-[#231F20] font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-5">Nombre</th>
                        <th className="py-3.5 px-5">Teléfono</th>
                        <th className="py-3.5 px-5">Correo</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE4E8]">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-[#98DAE9]/10 transition-colors">
                            <td className="py-3.5 px-5 font-semibold text-[#231F20]">{cliente.nombre}</td>
                            <td className="py-3.5 px-5 text-[#5F6B73]">{cliente.telefono}</td>
                            <td className="py-3.5 px-5 text-[#5F6B73]">
                              {cliente.correo || <span className="text-slate-400 italic">No registrado</span>}
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setHistorialTarget({ tipo: 'cliente', id: cliente.id })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer min-h-[36px]"
                                >
                                  <History className="w-3.5 h-3.5 text-[#1D7EAE]" />
                                  <span>Historial</span>
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenClienteMenuId(
                                        openClienteMenuId === cliente.id ? null : cliente.id
                                      )
                                    }
                                    className="p-2 text-slate-400 hover:text-[#231F20] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    title="Más opciones"
                                    aria-label="Más opciones"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openClienteMenuId === cliente.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setOpenClienteMenuId(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenClienteMenuId(null);
                                            handleOpenEditCliente(cliente);
                                          }}
                                          className="w-full px-3 py-2 text-[#231F20] hover:bg-slate-50 hover:text-[#1D7EAE] flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Editar cliente</span>
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#5F6B73]">
                            {searchCliente
                              ? 'No se encontraron clientes que coincidan con la búsqueda.'
                              : 'No hay clientes registrados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Block View */}
                <div className="md:hidden divide-y divide-[#DDE4E8]">
                  {filteredClientes.length > 0 ? (
                    filteredClientes.map((cliente) => (
                      <div key={cliente.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-[#231F20] text-sm">{cliente.nombre}</h4>
                            <p className="text-xs text-[#5F6B73] mt-0.5">{cliente.telefono}</p>
                            {cliente.correo && (
                              <p className="text-xs text-slate-400 truncate">{cliente.correo}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setHistorialTarget({ tipo: 'cliente', id: cliente.id })}
                              className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] text-xs font-semibold text-[#231F20] bg-white border border-[#DDE4E8] hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <History className="w-3.5 h-3.5 text-[#1D7EAE]" />
                              <span>Historial</span>
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenClienteMenuId(
                                    openClienteMenuId === cliente.id ? null : cliente.id
                                  )
                                }
                                className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2 text-slate-400 hover:text-[#231F20] rounded-lg"
                                aria-label="Más opciones"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openClienteMenuId === cliente.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setOpenClienteMenuId(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenClienteMenuId(null);
                                        handleOpenEditCliente(cliente);
                                      }}
                                      className="w-full px-3 py-2.5 text-[#231F20] hover:bg-slate-50 hover:text-[#1D7EAE] flex items-center gap-2"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Editar cliente</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#5F6B73]">
                      {searchCliente
                        ? 'No se encontraron clientes que coincidan con la búsqueda.'
                        : 'No hay clientes registrados.'}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* VEHÍCULOS */}
          {activeSection === 'vehiculos' && (
            <section className="space-y-6">
              {/* Encabezado IOT Technologies para Vehículos */}
              <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center shrink-0">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                      Vehículos
                    </h2>
                    <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
                      Consulta y administra los vehículos vinculados a sus propietarios.
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenAddVehiculo}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar vehículo</span>
                  </button>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchVehiculo}
                  onChange={(e) => setSearchVehiculo(e.target.value)}
                  placeholder="Buscar por placas o propietario..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                />
              </div>

              <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F6F8FA] border-b border-[#DDE4E8] text-[#231F20] font-semibold text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-5">Vehículo</th>
                        <th className="py-3.5 px-5">Placas</th>
                        <th className="py-3.5 px-5">Propietario</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE4E8]">
                      {filteredVehiculos.length > 0 ? (
                        filteredVehiculos.map((v) => {
                          const owner = clienteMap.get(v.clienteId);
                          return (
                            <tr key={v.id} className="hover:bg-[#98DAE9]/10 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-semibold text-[#231F20]">{v.marca} {v.modelo}</div>
                                {v.año && <div className="text-xs text-[#5F6B73]">Año: {v.año}</div>}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 border border-[#DDE4E8] rounded text-xs font-mono font-bold text-[#231F20] tracking-wider">
                                  {v.placas}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-[#231F20]">
                                {owner ? (
                                  <div>
                                    <div className="font-semibold text-[#231F20]">{owner.nombre}</div>
                                    <div className="text-xs text-[#5F6B73]">{owner.telefono}</div>
                                  </div>
                                ) : (
                                  <span className="text-rose-500 text-xs italic">Cliente no encontrado</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setHistorialTarget({ tipo: 'vehiculo', id: v.id })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer min-h-[36px]"
                                  >
                                    <History className="w-3.5 h-3.5 text-[#1D7EAE]" />
                                    <span>Historial</span>
                                  </button>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenVehiculoMenuId(
                                          openVehiculoMenuId === v.id ? null : v.id
                                        )
                                      }
                                      className="p-2 text-slate-400 hover:text-[#231F20] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                      title="Más opciones"
                                      aria-label="Más opciones"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openVehiculoMenuId === v.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-20"
                                          onClick={() => setOpenVehiculoMenuId(null)}
                                        />
                                        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenVehiculoMenuId(null);
                                              handleOpenEditVehiculo(v);
                                            }}
                                            className="w-full px-3 py-2 text-[#231F20] hover:bg-slate-50 hover:text-[#1D7EAE] flex items-center gap-2 transition-colors cursor-pointer"
                                          >
                                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Editar vehículo</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#5F6B73]">
                            {searchVehiculo
                              ? 'No se encontraron vehículos que coincidan con la búsqueda.'
                              : 'No hay vehículos registrados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Block View */}
                <div className="md:hidden divide-y divide-[#DDE4E8]">
                  {filteredVehiculos.length > 0 ? (
                    filteredVehiculos.map((v) => {
                      const owner = clienteMap.get(v.clienteId);
                      return (
                        <div key={v.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#231F20] text-sm">{v.marca} {v.modelo}</span>
                                <span className="px-2 py-0.5 bg-slate-100 border border-[#DDE4E8] rounded text-xs font-mono font-bold text-[#231F20]">
                                  {v.placas}
                                </span>
                              </div>
                              {v.año && <p className="text-xs text-[#5F6B73] mt-0.5">Año: {v.año}</p>}
                              <p className="text-xs text-[#5F6B73] mt-1">
                                Propietario: <strong className="text-[#231F20]">{owner ? owner.nombre : 'No encontrado'}</strong>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setHistorialTarget({ tipo: 'vehiculo', id: v.id })}
                                className="inline-flex items-center gap-1 px-3 py-2 min-h-[42px] text-xs font-semibold text-[#231F20] bg-white border border-[#DDE4E8] hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <History className="w-3.5 h-3.5 text-[#1D7EAE]" />
                                <span>Historial</span>
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenVehiculoMenuId(
                                      openVehiculoMenuId === v.id ? null : v.id
                                    )
                                  }
                                  className="min-w-[42px] min-h-[42px] flex items-center justify-center p-2 text-slate-400 hover:text-[#231F20] rounded-lg"
                                  aria-label="Más opciones"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {openVehiculoMenuId === v.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setOpenVehiculoMenuId(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DDE4E8] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenVehiculoMenuId(null);
                                          handleOpenEditVehiculo(v);
                                        }}
                                        className="w-full px-3 py-2.5 text-[#231F20] hover:bg-slate-50 hover:text-[#1D7EAE] flex items-center gap-2"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Editar vehículo</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-[#5F6B73]">
                      {searchVehiculo
                        ? 'No se encontraron vehículos que coincidan con la búsqueda.'
                        : 'No hay vehículos registrados.'}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* FLOTILLAS */}
          {activeSection === 'flotillas' && (
            <FlotillasSection
              flotillas={flotillas}
              vehiculos={vehiculos}
              clientes={clientes}
              onSaveFlotilla={handleSaveFlotilla}
              onDeleteFlotilla={handleDeleteFlotilla}
            />
          )}

          {/* HISTORIAL VEHICULAR */}
          {activeSection === 'historial-vehicular' && (
            <HistorialVehicularSection
              vehiculos={vehiculos}
              clientes={clientes}
              citas={citas}
              cotizaciones={cotizaciones}
              ordenes={ordenes}
              flotillas={flotillas}
              configuracion={configuracion}
            />
          )}

          {/* CITAS (ETAPA 4) */}
          {activeSection === 'citas' && (
            <CitasSection
              citas={citas}
              clientes={clientes}
              vehiculos={vehiculos}
              servicios={servicios}
              onSaveCita={handleSaveCita}
              onCancelCita={handleCancelCita}
            />
          )}

          {/* COTIZACIONES (ETAPA 5 & 7) */}
          {activeSection === 'cotizaciones' && (
            <CotizacionesSection
              cotizaciones={cotizaciones}
              ordenes={ordenes}
              clientes={clientes}
              vehiculos={vehiculos}
              servicios={servicios}
              configuracion={configuracion}
              onSaveCotizacion={handleSaveCotizacion}
              onUpdateEstado={handleUpdateCotizacionEstado}
              onLinkCotizacionToOrden={handleLinkCotizacionToOrden}
              onCreateOrdenFromCotizacion={handleCreateOrdenFromCotizacion}
              onNavigateToOrden={(ordId) => setActiveSection('ordenes')}
            />
          )}

          {/* ÓRDENES DE TRABAJO (ETAPA 6, 7 & 9) */}
          {activeSection === 'ordenes' && (
            <OrdenesSection
              ordenes={ordenes}
              cotizaciones={cotizaciones}
              clientes={clientes}
              vehiculos={vehiculos}
              servicios={servicios}
              refacciones={refacciones}
              configuracion={configuracion}
              onSaveOrden={handleSaveOrden}
              onSaveCotizacion={handleSaveCotizacion}
              onLinkOrdenAndCotizacion={handleLinkOrdenAndCotizacion}
              onCreateCotizacionForOrden={handleCreateCotizacionForOrden}
              onUseRefaccionInOrden={handleUseRefaccionInOrden}
              onReturnRefaccionFromOrden={handleReturnRefaccionFromOrden}
              currentUser={sesion || undefined}
              usuarios={usuarios}
              empleados={empleados}
              onRegistrarGarantia={handleRegistrarGarantiaFromOrden}
            />
          )}

          {/* CATÁLOGO DE SERVICIOS (ETAPA 8) */}
          {activeSection === 'servicios' && (
            <ServiciosSection
              servicios={servicios}
              onSaveServicio={handleSaveServicio}
            />
          )}

          {/* INVENTARIO DE REFACCIONES (ETAPA 9) */}
          {activeSection === 'inventario' && (
            <InventarioSection
              refacciones={refacciones}
              movimientos={movimientos}
              ordenesCompra={ordenesCompra}
              onSaveRefaccion={handleSaveRefaccion}
              onRecordMovement={handleRecordMovement}
              onSaveOrdenCompra={handleSaveOrdenCompra}
              onMarcarOrdenCompraRecibida={handleMarcarOrdenCompraRecibida}
            />
          )}

          {/* CALENDARIO DEL TALLER (ETAPA 10) */}
          {activeSection === 'calendario' && (
            <CalendarioSection
              citas={citas}
              clientes={clientes}
              vehiculos={vehiculos}
              servicios={servicios}
              seguimientos={seguimientos}
              onSaveCita={handleSaveCita}
            />
          )}

          {/* FACTURACIÓN (ETAPA 15) */}
          {activeSection === 'facturacion' && (
            <FacturacionSection
              facturas={facturas}
              cotizaciones={cotizaciones}
              clientes={clientes}
              vehiculos={vehiculos}
              configuracion={configuracion}
              onSaveFactura={handleSaveFactura}
              onUpdateFactura={handleUpdateFactura}
            />
          )}

          {/* PERSONAL Y ASISTENCIA (ETAPA 16) */}
          {activeSection === 'personal-asistencia' && (
            <PersonalAsistenciaSection
              empleados={empleados}
              asistencias={asistencias}
              configuracion={configuracion}
              onSaveEmpleado={handleSaveEmpleado}
              onUpdateEmpleado={handleUpdateEmpleado}
              onSaveAsistencia={handleSaveAsistencia}
            />
          )}

          {/* ATENCIÓN ASISTIDA (ETAPA 17) */}
          {activeSection === 'atencion-asistida' && (
            <AtencionAsistidaSection
              clientes={clientes}
              vehiculos={vehiculos}
              citas={citas}
              cotizaciones={cotizaciones}
              ordenes={ordenes}
              servicios={servicios}
              configuracion={configuracion}
              seguimientos={seguimientos}
              onSaveSeguimiento={handleSaveSeguimiento}
              onUpdateSeguimientoEstado={handleUpdateSeguimientoEstado}
              onNavigateToSection={handleSelectSection}
            />
          )}

          {/* CONFIGURACIÓN Y RESPALDO (ETAPA 12, 20 & 22) */}
          {activeSection === 'configuracion' && (
            <ConfiguracionSection
              configuracion={configuracion}
              onSaveConfiguracion={handleSaveConfiguracion}
              clientes={clientes}
              vehiculos={vehiculos}
              citas={citas}
              cotizaciones={cotizaciones}
              ordenes={ordenes}
              servicios={servicios}
              refacciones={refacciones}
              movimientos={movimientos}
              facturas={facturas}
              empleados={empleados}
              asistencias={asistencias}
              seguimientos={seguimientos}
              prospectos={prospectos}
              garantias={garantias}
              bitacora={bitacora}
              flotillas={flotillas}
              ordenesCompra={ordenesCompra}
              onRestoreData={handleRestoreData}
              usuarios={usuarios}
              currentUser={sesion || undefined}
              onSaveUsuario={handleSaveUsuario}
              onUpdateUsuario={handleUpdateUsuario}
              onToggleActivoUsuario={handleToggleActivoUsuario}
              onChangePasswordUsuario={handleChangePasswordUsuario}
            />
          )}

          {/* REPORTES DE DEMOSTRACIÓN (ETAPA 18) */}
          {activeSection === 'reportes' && (
            <ReportesSection
              ordenes={ordenes}
              cotizaciones={cotizaciones}
              citas={citas}
              facturas={facturas}
              refacciones={refacciones}
              servicios={servicios}
              configuracion={configuracion}
            />
          )}

          {/* PROSPECTOS Y SEGUIMIENTO COMERCIAL (ETAPA 19) */}
          {activeSection === 'prospectos' && (
            <ProspectosSection
              prospectos={prospectos}
              clientes={clientes}
              servicios={servicios}
              seguimientos={seguimientos}
              onSaveProspecto={handleSaveProspecto}
              onUpdateProspecto={handleUpdateProspecto}
              onConvertirEnCliente={handleConvertirEnCliente}
              onUpdateSeguimientoEstado={handleUpdateSeguimientoEstado}
              onNavigateToClientes={() => handleSelectSection('clientes')}
            />
          )}

          {/* GARANTÍAS DE SERVICIOS (ETAPA 21) */}
          {activeSection === 'garantias' && (
            <GarantiasSection
              garantias={garantias}
              ordenes={ordenes}
              clientes={clientes}
              vehiculos={vehiculos}
              configuracion={configuracion}
              currentUser={sesion || undefined}
              onSaveGarantia={handleSaveGarantia}
              onUpdateGarantia={handleUpdateGarantia}
              onAplicarGarantia={handleAplicarGarantia}
              onCancelarGarantia={handleCancelarGarantia}
              onAddObservacionMecanico={handleAddObservacionMecanico}
              initialOrdenParaGarantia={initialOrdenGarantia}
              onClearInitialOrden={() => setInitialOrdenGarantia(null)}
            />
          )}

          {/* BITÁCORA DE ACTIVIDAD (ETAPA 22) */}
          {activeSection === 'bitacora' && (
            <BitacoraSection
              bitacora={bitacora}
              ordenes={ordenes}
              currentUser={sesion || undefined}
              configuracion={configuracion}
            />
          )}

          {/* OTRAS SECCIONES EN PREPARACIÓN */}
          {activeSection !== 'dashboard' &&
            activeSection !== 'nueva-atencion' &&
            activeSection !== 'clientes' &&
            activeSection !== 'vehiculos' &&
            activeSection !== 'citas' &&
            activeSection !== 'cotizaciones' &&
            activeSection !== 'ordenes' &&
            activeSection !== 'servicios' &&
            activeSection !== 'inventario' &&
            activeSection !== 'calendario' &&
            activeSection !== 'facturacion' &&
            activeSection !== 'personal-asistencia' &&
            activeSection !== 'atencion-asistida' &&
            activeSection !== 'reportes' &&
            activeSection !== 'prospectos' &&
            activeSection !== 'garantias' &&
            activeSection !== 'bitacora' &&
            activeSection !== 'configuracion' && (
              <section className="bg-white rounded-xl p-8 md:p-12 border border-[#DDE4E8] text-center max-w-xl mx-auto my-12 shadow-xs relative overflow-hidden">
                <div className="absolute inset-0 iot-dots-pattern pointer-events-none" />
                <div className="w-14 h-14 mx-auto rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 flex items-center justify-center text-[#1D7EAE] mb-4 relative z-10">
                  <currentItem.icon className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-[#231F20] mb-2 relative z-10">
                  {currentItem.label}
                </h2>
                <p className="text-base text-[#5F6B73] relative z-10">
                  Sección en preparación
                </p>
              </section>
            )}
            </>
          )}

          {/* Pie de página oficial IOT Technologies */}
          <footer className="mt-12 py-6 border-t border-[#DDE4E8] text-center text-xs text-[#5F6B73] no-print">
            <p>Tecnología de IOT Technologies</p>
          </footer>
        </div>
      </main>

      {/* MODAL: CLIENTE */}
      {isClienteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={clienteModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#231F20]">
                {editingCliente ? 'Editar cliente' : 'Agregar cliente'}
              </h3>
              <button
                type="button"
                onClick={clienteModalDismiss.handleClose}
                className="text-slate-400 hover:text-[#231F20] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCliente} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                  Nombre completo <span className="text-[#1D7EAE]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={clienteForm.nombre}
                  onChange={(e) => {
                    setClienteForm({ ...clienteForm, nombre: e.target.value });
                    if (clienteErrors.nombre) setClienteErrors({ ...clienteErrors, nombre: undefined });
                  }}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all ${
                    clienteErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {clienteErrors.nombre && <p className="text-xs text-red-600 mt-1">{clienteErrors.nombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                  Teléfono <span className="text-[#1D7EAE]">*</span>
                </label>
                <input
                  type="tel"
                  value={clienteForm.telefono}
                  onChange={(e) => {
                    setClienteForm({ ...clienteForm, telefono: e.target.value });
                    if (clienteErrors.telefono) setClienteErrors({ ...clienteErrors, telefono: undefined });
                  }}
                  placeholder="Ej. 555-123-4567"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all ${
                    clienteErrors.telefono ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {clienteErrors.telefono && <p className="text-xs text-red-600 mt-1">{clienteErrors.telefono}</p>}
              </div>

              {/* Apartado desplegable para datos opcionales */}
              <details className="group pt-1" open={Boolean(clienteForm.correo)}>
                <summary className="text-xs text-[#5F6B73] hover:text-[#231F20] cursor-pointer font-medium flex items-center justify-between py-1 select-none">
                  <span>Datos opcionales (correo electrónico)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Correo electrónico <span className="text-xs text-[#5F6B73] font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={clienteForm.correo}
                    onChange={(e) => setClienteForm({ ...clienteForm, correo: e.target.value })}
                    placeholder="Ej. juan.perez@email.com"
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                  />
                </div>
              </details>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE4E8]">
                <button
                  type="button"
                  onClick={clienteModalDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#231F20] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VEHÍCULO */}
      {isVehiculoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={vehiculoModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#231F20]">
                {editingVehiculo ? 'Editar vehículo' : 'Agregar vehículo'}
              </h3>
              <button
                type="button"
                onClick={vehiculoModalDismiss.handleClose}
                className="text-slate-400 hover:text-[#231F20] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehiculo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                  Cliente propietario <span className="text-[#1D7EAE]">*</span>
                </label>
                {clientes.length > 0 ? (
                  <select
                    autoFocus
                    value={vehiculoForm.clienteId}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, clienteId: e.target.value });
                      if (vehiculoErrors.clienteId) setVehiculoErrors({ ...vehiculoErrors, clienteId: '' });
                    }}
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] bg-white focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                  >
                    <option value="" disabled>Seleccione un cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.telefono})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No hay clientes registrados.
                  </p>
                )}
                {vehiculoErrors.clienteId && (
                  <p className="text-xs text-red-600 mt-1">{vehiculoErrors.clienteId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Marca <span className="text-[#1D7EAE]">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.marca}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, marca: e.target.value });
                      if (vehiculoErrors.marca) setVehiculoErrors({ ...vehiculoErrors, marca: '' });
                    }}
                    placeholder="Ej. Toyota"
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                  />
                  {vehiculoErrors.marca && (
                    <p className="text-xs text-red-600 mt-1">{vehiculoErrors.marca}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Modelo <span className="text-[#1D7EAE]">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.modelo}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, modelo: e.target.value });
                      if (vehiculoErrors.modelo) setVehiculoErrors({ ...vehiculoErrors, modelo: '' });
                    }}
                    placeholder="Ej. Corolla"
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                  />
                  {vehiculoErrors.modelo && (
                    <p className="text-xs text-red-600 mt-1">{vehiculoErrors.modelo}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                  Placas <span className="text-[#1D7EAE]">*</span>
                </label>
                <input
                  type="text"
                  value={vehiculoForm.placas}
                  onChange={(e) => {
                    setVehiculoForm({ ...vehiculoForm, placas: e.target.value });
                    if (vehiculoErrors.placas) setVehiculoErrors({ ...vehiculoErrors, placas: '' });
                  }}
                  placeholder="Ej. ABC-123"
                  className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm uppercase text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                />
                {vehiculoErrors.placas && (
                  <p className="text-xs text-red-600 mt-1">{vehiculoErrors.placas}</p>
                )}
              </div>

              {/* Apartado desplegable para datos opcionales */}
              <details className="group pt-1" open={Boolean(vehiculoForm.año)}>
                <summary className="text-xs text-[#5F6368] hover:text-[#231F20] cursor-pointer font-medium flex items-center justify-between py-1 select-none">
                  <span>Datos opcionales (año del vehículo)</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Año <span className="text-xs text-[#5F6368] font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.año}
                    onChange={(e) => setVehiculoForm({ ...vehiculoForm, año: e.target.value })}
                    placeholder="Ej. 2021"
                    className="w-full px-3.5 py-2.5 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                  />
                </div>
              </details>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DDE4E8]">
                <button
                  type="button"
                  onClick={vehiculoModalDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#231F20] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0}
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: HISTORIAL DEL CLIENTE O DEL VEHÍCULO (ETAPA 11) */}
      {historialTarget && (
        <HistorialModal
          tipo={historialTarget.tipo}
          targetId={historialTarget.id}
          clientes={clientes}
          vehiculos={vehiculos}
          citas={citas}
          cotizaciones={cotizaciones}
          ordenes={ordenes}
          onClose={() => setHistorialTarget(null)}
        />
      )}

      {/* CENTRO DE AVISOS Y PENDIENTES (ETAPA 24) */}
      <CentroAvisosDrawer
        isOpen={isCentroAvisosOpen}
        onClose={handleCloseCentroAvisos}
        avisos={avisosVisiblesNoVistos}
        onVerAviso={(aviso) => {
          handleSelectSection(aviso.seccionDestino);
        }}
        onMarcarVisto={handleMarcarAvisoVisto}
        totalNoVistosCount={totalPendientesCount}
      />

      {/* Toast Feedback Notification (ETAPA 23) */}
      {toastMensaje && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0032A0] text-white px-4 py-3 rounded-xl shadow-lg border border-blue-400/30 flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-[#98DAE9] shrink-0" />
          <span>{toastMensaje}</span>
          <button
            type="button"
            onClick={() => setToastMensaje(null)}
            className="ml-2 text-blue-200 hover:text-white p-0.5"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
