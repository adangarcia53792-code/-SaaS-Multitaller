import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  SectionId,
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  ServicioCatalogo,
  Refaccion,
  MovimientoInventario,
  RefaccionUtilizadaOrden,
  ConfiguracionTaller,
  RespaldoDemo,
  Factura,
  Empleado,
  RegistroAsistencia,
  Seguimiento,
  Prospecto,
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

interface MenuItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nueva-atencion', label: 'Nueva atención', icon: PlusCircle },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'vehiculos', label: 'Vehículos', icon: Car },
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'ordenes', label: 'Órdenes de trabajo', icon: Wrench },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
  { id: 'calendario', label: 'Calendario', icon: CalendarDays },
  { id: 'facturacion', label: 'Facturación', icon: Receipt },
  { id: 'personal-asistencia', label: 'Personal y asistencia', icon: UserCheck },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'prospectos', label: 'Prospectos', icon: UserPlus },
  { id: 'atencion-asistida', label: 'Atención asistida', icon: Sparkles },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

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

const INITIAL_CITAS: Cita[] = [
  {
    id: 'cita-init-1',
    clienteId: 'cli-1',
    vehiculoId: 'veh-1',
    servicio: 'Afinación mayor y cambio de aceite sintético',
    fecha: '2026-10-02',
    hora: '10:00',
    estado: 'Programada',
    creadoEn: '2026-09-28T10:00:00Z',
  },
  {
    id: 'cita-init-2',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    servicio: 'Revisión preventiva de frenos y niveles',
    fecha: '2026-10-05',
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
    descripcion: 'Afinación integral con cambio de bujías y filtros',
    importeRefacciones: 2200,
    importeManoObra: 1300,
    total: 3500,
    estado: 'Aprobada',
    creadoEn: '2026-09-27T16:00:00Z',
  },
];

const INITIAL_ORDENES: OrdenTrabajo[] = [
  {
    id: 'ord-init-1',
    folio: 'ORD-001',
    clienteId: 'cli-1',
    vehiculoId: 'veh-1',
    servicio: 'Diagnóstico de ruidos en tren delantero y cambio de bujes',
    kilometraje: '75,400 km',
    dañosVisibles: 'Leve raspadura en fascia trasera derecha',
    diagnostico: 'Bujes de horquilla agrietados, amortiguadores en buen estado',
    observacionesMecanico: 'Reemplazo de bujes completado exitosamente',
    trabajoTerminado: true,
    revisionFinal: true,
    entregado: false,
    estado: 'Terminado',
    creadoEn: '2026-09-28T08:30:00Z',
  },
  {
    id: 'ord-init-2',
    folio: 'ORD-002',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    servicio: 'Mantenimiento preventivo general y cambio de banda de accesorios',
    kilometraje: '42,100 km',
    estado: 'En proceso',
    trabajoTerminado: false,
    revisionFinal: false,
    entregado: false,
    creadoEn: '2026-09-28T11:15:00Z',
  },
];

const STORAGE_KEY_CLIENTES = 'taller_clientes_data';
const STORAGE_KEY_VEHICULOS = 'taller_vehiculos_data';
const STORAGE_KEY_CITAS = 'taller_citas_data';
const STORAGE_KEY_COTIZACIONES = 'taller_cotizaciones_data';
const STORAGE_KEY_ORDENES = 'taller_ordenes_data';
const STORAGE_KEY_SERVICIOS = 'taller_servicios_data';
const STORAGE_KEY_REFACCIONES = 'taller_refacciones_data';
const STORAGE_KEY_MOVIMIENTOS = 'taller_movimientos_inventario_data';
const STORAGE_KEY_CONFIGURACION = 'taller_configuracion_data';
const STORAGE_KEY_FACTURAS = 'taller_facturas_data';
const STORAGE_KEY_EMPLEADOS = 'taller_empleados_data';
const STORAGE_KEY_ASISTENCIAS = 'taller_asistencias_data';
const STORAGE_KEY_SEGUIMIENTOS = 'taller_seguimientos_data';
const STORAGE_KEY_PROSPECTOS = 'taller_prospectos_data';

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
      'Hola Carlos Mendoza, nos comunicamos de Taller mecánico para dar seguimiento a la cotización COT-001 de tu Toyota Corolla.',
    fecha: '2026-10-03',
    hora: '10:30',
    estado: 'Pendiente',
    creadoEn: '2026-09-28T10:00:00Z',
  },
  {
    id: 'seg-init-2',
    clienteId: 'cli-2',
    vehiculoId: 'veh-2',
    motivo: 'recordatorio_cita',
    motivoLabel: 'Recordatorio de cita',
    registroTipo: 'cita',
    registroRef: 'Cita 05/10/2026',
    mensaje:
      'Hola Lucía Fernández, te recordamos tu cita en Taller mecánico programada para el día 05/10/2026 a las 15:30 hrs para tu Nissan Versa.',
    fecha: '2026-10-04',
    hora: '11:00',
    estado: 'Pendiente',
    creadoEn: '2026-09-28T10:00:00Z',
  },
  {
    id: 'seg-init-3',
    clienteId: '',
    prospectoId: 'pros-init-1',
    prospectoNombre: 'Mariana Ríos',
    motivo: 'seguimiento_prospecto',
    motivoLabel: 'Contacto comercial',
    registroTipo: 'prospecto',
    registroRef: 'Prospecto: Mariana Ríos',
    mensaje: 'Llamar para confirmar cotización y agendar visita para afinación mayor.',
    fecha: '2026-10-02',
    hora: '11:00',
    estado: 'Pendiente',
    creadoEn: '2026-09-28T09:35:00Z',
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
  nombre: 'Taller mecánico',
  telefono: '',
  direccion: '',
};

const INITIAL_REFACCIONES: Refaccion[] = [
  {
    id: 'ref-1',
    codigo: 'BAL-DEL-01',
    nombre: 'Juego de balatas delanteras cerámicas',
    existencias: 8,
    minimo: 4,
    costoUnitario: 520,
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-2',
    codigo: 'FIL-ACE-01',
    nombre: 'Filtro de aceite sintético para motor 4 cil',
    existencias: 3,
    minimo: 5,
    costoUnitario: 140,
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-3',
    codigo: 'BUJ-PLAT-01',
    nombre: 'Juego de bujías de platino (4 pzs)',
    existencias: 12,
    minimo: 6,
    costoUnitario: 380,
    creadoEn: '2026-09-28T08:00:00Z',
  },
  {
    id: 'ref-4',
    codigo: 'LQD-FRN-DOT4',
    nombre: 'Líquido para frenos DOT-4 (1 litro)',
    existencias: 2,
    minimo: 4,
    costoUnitario: 110,
    creadoEn: '2026-09-28T08:00:00Z',
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
  const [isCatalogosOpen, setIsCatalogosOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(true);

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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (saved) {
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
      if (saved) {
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.nombre === 'string') return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CONFIGURACION;
  });

  // Servicios State (ETAPA 8)
  const [servicios, setServicios] = useState<ServicioCatalogo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICIOS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SERVICIOS;
  });

  // Inventario & Movimientos State (ETAPA 9)
  const [refacciones, setRefacciones] = useState<Refaccion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REFACCIONES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_REFACCIONES;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (saved) {
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
      if (saved) {
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
      if (saved) {
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
  };

  const handleUpdateFactura = (updatedFac: Factura) => {
    setFacturas((prev) => prev.map((f) => (f.id === updatedFac.id ? updatedFac : f)));
  };

  // Restore whole demo data handler (ETAPA 12 & 15)
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

  const currentItem =
    MENU_ITEMS.find((item) => item.id === activeSection) || {
      id: activeSection,
      label: 'Catálogos',
      icon: Layers,
    };

  const handleSelectSection = (id: SectionId) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
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
      setClientes((prev) =>
        prev.map((c) =>
          c.id === editingCliente.id
            ? {
                ...c,
                nombre: clienteForm.nombre.trim(),
                telefono: clienteForm.telefono.trim(),
                correo: clienteForm.correo.trim() || undefined,
              }
            : c
        )
      );
    } else {
      const newCliente: Cliente = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nombre: clienteForm.nombre.trim(),
        telefono: clienteForm.telefono.trim(),
        correo: clienteForm.correo.trim() || undefined,
      };
      setClientes((prev) => [newCliente, ...prev]);
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
      setVehiculos((prev) =>
        prev.map((v) =>
          v.id === editingVehiculo.id
            ? {
                ...v,
                clienteId: vehiculoForm.clienteId,
                marca: vehiculoForm.marca.trim(),
                modelo: vehiculoForm.modelo.trim(),
                placas: vehiculoForm.placas.trim().toUpperCase(),
                año: vehiculoForm.año.trim() || undefined,
              }
            : v
        )
      );
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
    }

    setIsVehiculoModalOpen(false);
  };

  // Cita handlers
  const handleSaveCita = (savedCita: Cita) => {
    setCitas((prev) => {
      const exists = prev.some((c) => c.id === savedCita.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCita.id ? savedCita : c));
      }
      return [savedCita, ...prev];
    });
  };

  const handleCancelCita = (citaId: string) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: 'Cancelada' } : c))
    );
  };

  // Cotizaciones handlers
  const handleSaveCotizacion = (savedCot: Cotizacion) => {
    setCotizaciones((prev) => {
      const exists = prev.some((c) => c.id === savedCot.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCot.id ? savedCot : c));
      }
      return [savedCot, ...prev];
    });
  };

  const handleUpdateCotizacionEstado = (id: string, nuevoEstado: 'Aprobada' | 'Rechazada') => {
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
    );
  };

  // Órdenes handler
  const handleSaveOrden = (savedOrd: OrdenTrabajo) => {
    setOrdenes((prev) => {
      const exists = prev.some((o) => o.id === savedOrd.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOrd.id ? savedOrd : o));
      }
      return [savedOrd, ...prev];
    });
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
  };

  // Filtered Clientes and Vehículos
  const filteredClientes = useMemo(() => {
    const q = searchCliente.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.toLowerCase().includes(q)
    );
  }, [clientes, searchCliente]);

  const filteredVehiculos = useMemo(() => {
    const q = searchVehiculo.toLowerCase().trim();
    if (!q) return vehiculos;
    return vehiculos.filter((v) => {
      const placasMatch = v.placas.toLowerCase().includes(q);
      const ownerName = clienteMap.get(v.clienteId)?.nombre?.toLowerCase() || '';
      return placasMatch || ownerName.includes(q);
    });
  }, [vehiculos, clienteMap, searchVehiculo]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 text-slate-800 font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0d1b2a] text-white shadow-sm sticky top-0 z-30 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0d5c58] flex items-center justify-center font-bold text-white text-sm">
            {(configuracion.nombre || 'TM')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase() || 'TM'}
          </div>
          <span className="font-semibold text-lg tracking-tight">
            {configuracion.nombre || 'Taller mecánico'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-[#1b2d45] focus:outline-none transition-colors"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity no-print"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Menú lateral izquierdo azul oscuro */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-40 w-64 bg-[#0d1b2a] text-slate-200 flex flex-col transition-transform duration-200 ease-in-out no-print ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 py-6 border-b border-[#1b2d45] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0d5c58] flex items-center justify-center font-bold text-white shadow-sm">
              {(configuracion.nombre || 'TM')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase() || 'TM'}
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-tight">
                {configuracion.nombre || 'Taller mecánico'}
              </h1>
              <span className="text-xs text-slate-400 font-normal">Panel de gestión</span>
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.filter(
            (item) =>
              item.id !== 'configuracion' &&
              item.id !== 'facturacion' &&
              item.id !== 'personal-asistencia' &&
              item.id !== 'reportes' &&
              item.id !== 'prospectos' &&
              item.id !== 'atencion-asistida'
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                  isSelected
                    ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Grupo desplegable: Catálogos (ETAPA 8) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCatalogosOpen(!isCatalogosOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#172a3f]/50 uppercase tracking-wider transition-colors text-left"
            >
              <span>Catálogos</span>
              {isCatalogosOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isCatalogosOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => handleSelectSection('servicios')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'servicios'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <Layers
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'servicios' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Servicios</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('inventario')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'inventario'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <Package
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'inventario' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Inventario</span>
                </button>
              </div>
            )}
          </div>

          {/* Grupo desplegable: Administración (ETAPA 15) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#172a3f]/50 uppercase tracking-wider transition-colors text-left"
            >
              <span>Administración</span>
              {isAdminOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isAdminOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => handleSelectSection('facturacion')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'facturacion'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <Receipt
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'facturacion' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Facturación</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('personal-asistencia')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'personal-asistencia'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <UserCheck
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'personal-asistencia' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Personal y asistencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('reportes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'reportes'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <BarChart3
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'reportes' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Reportes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('prospectos')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                    activeSection === 'prospectos'
                      ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
                  }`}
                >
                  <UserPlus
                    className={`w-4 h-4 shrink-0 ${
                      activeSection === 'prospectos' ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  />
                  <span>Prospectos</span>
                </button>
              </div>
            )}
          </div>

          {/* Opción secundaria: Atención asistida (ETAPA 17) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectSection('atencion-asistida')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === 'atencion-asistida'
                  ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Sparkles
                  className={`w-5 h-5 shrink-0 ${
                    activeSection === 'atencion-asistida' ? 'text-teal-200' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Atención asistida</span>
              </div>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                Demo
              </span>
            </button>
          </div>

          {/* Configuración (ETAPA 12) - Al final del menú izquierdo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSelectSection('configuracion')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === 'configuracion'
                  ? 'bg-[#0d5c58] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-[#172a3f] hover:text-white'
              }`}
            >
              <Settings
                className={`w-5 h-5 shrink-0 ${
                  activeSection === 'configuracion' ? 'text-teal-200' : 'text-slate-400'
                }`}
              />
              <span>Configuración</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-[#1b2d45] text-xs text-slate-400 text-center">
          Versión 1.0 — Demo
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <div className="p-6 md:p-10 max-w-5xl w-full mx-auto">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Clientes
                  </h2>
                  <p className="text-sm md:text-base text-slate-500 mt-1">
                    Directorio de clientes registrados en el taller.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCliente}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar cliente</span>
                </button>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-3.5 px-5">Nombre</th>
                        <th className="py-3.5 px-5">Teléfono</th>
                        <th className="py-3.5 px-5">Correo</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5 font-medium text-slate-900">{cliente.nombre}</td>
                            <td className="py-3.5 px-5 text-slate-600">{cliente.telefono}</td>
                            <td className="py-3.5 px-5 text-slate-500">
                              {cliente.correo || <span className="text-slate-400 italic">No registrado</span>}
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCliente(cliente)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0d5c58] bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenClienteMenuId(
                                        openClienteMenuId === cliente.id ? null : cliente.id
                                      )
                                    }
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                    title="Más opciones"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openClienteMenuId === cliente.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setOpenClienteMenuId(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenClienteMenuId(null);
                                            setHistorialTarget({ tipo: 'cliente', id: cliente.id });
                                          }}
                                          className="w-full px-3 py-2 text-slate-700 hover:bg-teal-50 hover:text-[#0d5c58] flex items-center gap-2 transition-colors"
                                        >
                                          <History className="w-4 h-4 text-slate-500" />
                                          <span>Ver historial</span>
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
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            {searchCliente
                              ? 'No se encontraron clientes que coincidan con la búsqueda.'
                              : 'No hay clientes registrados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* VEHÍCULOS */}
          {activeSection === 'vehiculos' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Vehículos
                  </h2>
                  <p className="text-sm md:text-base text-slate-500 mt-1">
                    Listado de vehículos vinculados a sus propietarios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddVehiculo}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar vehículo</span>
                </button>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchVehiculo}
                  onChange={(e) => setSearchVehiculo(e.target.value)}
                  placeholder="Buscar por placas o propietario..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-3.5 px-5">Vehículo</th>
                        <th className="py-3.5 px-5">Placas</th>
                        <th className="py-3.5 px-5">Propietario</th>
                        <th className="py-3.5 px-5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVehiculos.length > 0 ? (
                        filteredVehiculos.map((v) => {
                          const owner = clienteMap.get(v.clienteId);
                          return (
                            <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-medium text-slate-900">{v.marca} {v.modelo}</div>
                                {v.año && <div className="text-xs text-slate-500">Año: {v.año}</div>}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800 tracking-wider">
                                  {v.placas}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-700">
                                {owner ? (
                                  <div>
                                    <div className="font-medium text-slate-900">{owner.nombre}</div>
                                    <div className="text-xs text-slate-500">{owner.telefono}</div>
                                  </div>
                                ) : (
                                  <span className="text-red-500 text-xs italic">Cliente no encontrado</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditVehiculo(v)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0d5c58] bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenVehiculoMenuId(
                                          openVehiculoMenuId === v.id ? null : v.id
                                        )
                                      }
                                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                      title="Más opciones"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openVehiculoMenuId === v.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-20"
                                          onClick={() => setOpenVehiculoMenuId(null)}
                                        />
                                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenVehiculoMenuId(null);
                                              setHistorialTarget({ tipo: 'vehiculo', id: v.id });
                                            }}
                                            className="w-full px-3 py-2 text-slate-700 hover:bg-teal-50 hover:text-[#0d5c58] flex items-center gap-2 transition-colors"
                                          >
                                            <History className="w-4 h-4 text-slate-500" />
                                            <span>Ver historial</span>
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
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            {searchVehiculo
                              ? 'No se encontraron vehículos que coincidan con la búsqueda.'
                              : 'No hay vehículos registrados.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
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
              onSaveRefaccion={handleSaveRefaccion}
              onRecordMovement={handleRecordMovement}
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

          {/* CONFIGURACIÓN Y RESPALDO (ETAPA 12) */}
          {activeSection === 'configuracion' && (
            <ConfiguracionSection
              configuracion={configuracion}
              onSaveConfiguracion={(newConf) => setConfiguracion(newConf)}
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
              onRestoreData={handleRestoreData}
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
            activeSection !== 'configuracion' && (
              <section className="bg-white rounded-xl p-8 md:p-12 border border-slate-200 text-center max-w-xl mx-auto my-12 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
                  <currentItem.icon className="w-7 h-7 text-[#0d5c58]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {currentItem.label}
                </h2>
                <p className="text-base text-slate-500">
                  Sección en preparación
                </p>
              </section>
            )}
        </div>
      </main>

      {/* MODAL: CLIENTE */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCliente ? 'Editar cliente' : 'Agregar cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsClienteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCliente} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clienteForm.nombre}
                  onChange={(e) => {
                    setClienteForm({ ...clienteForm, nombre: e.target.value });
                    if (clienteErrors.nombre) setClienteErrors({ ...clienteErrors, nombre: undefined });
                  }}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] transition-all ${
                    clienteErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {clienteErrors.nombre && <p className="text-xs text-red-600 mt-1">{clienteErrors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={clienteForm.telefono}
                  onChange={(e) => {
                    setClienteForm({ ...clienteForm, telefono: e.target.value });
                    if (clienteErrors.telefono) setClienteErrors({ ...clienteErrors, telefono: undefined });
                  }}
                  placeholder="Ej. 555-123-4567"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] transition-all ${
                    clienteErrors.telefono ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {clienteErrors.telefono && <p className="text-xs text-red-600 mt-1">{clienteErrors.telefono}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo electrónico <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={clienteForm.correo}
                  onChange={(e) => setClienteForm({ ...clienteForm, correo: e.target.value })}
                  placeholder="Ej. juan.perez@email.com"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClienteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingVehiculo ? 'Editar vehículo' : 'Agregar vehículo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVehiculoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehiculo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cliente propietario <span className="text-red-500">*</span>
                </label>
                {clientes.length > 0 ? (
                  <select
                    value={vehiculoForm.clienteId}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, clienteId: e.target.value });
                      if (vehiculoErrors.clienteId) setVehiculoErrors({ ...vehiculoErrors, clienteId: '' });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.marca}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, marca: e.target.value });
                      if (vehiculoErrors.marca) setVehiculoErrors({ ...vehiculoErrors, marca: '' });
                    }}
                    placeholder="Ej. Toyota"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  />
                  {vehiculoErrors.marca && (
                    <p className="text-xs text-red-600 mt-1">{vehiculoErrors.marca}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.modelo}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, modelo: e.target.value });
                      if (vehiculoErrors.modelo) setVehiculoErrors({ ...vehiculoErrors, modelo: '' });
                    }}
                    placeholder="Ej. Corolla"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  />
                  {vehiculoErrors.modelo && (
                    <p className="text-xs text-red-600 mt-1">{vehiculoErrors.modelo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Placas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.placas}
                    onChange={(e) => {
                      setVehiculoForm({ ...vehiculoForm, placas: e.target.value });
                      if (vehiculoErrors.placas) setVehiculoErrors({ ...vehiculoErrors, placas: '' });
                    }}
                    placeholder="Ej. ABC-123"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  />
                  {vehiculoErrors.placas && (
                    <p className="text-xs text-red-600 mt-1">{vehiculoErrors.placas}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Año <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehiculoForm.año}
                    onChange={(e) => setVehiculoForm({ ...vehiculoForm, año: e.target.value })}
                    placeholder="Ej. 2021"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehiculoModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0}
                  className="px-5 py-2 bg-[#0d5c58] hover:bg-[#0a4845] disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
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
    </div>
  );
}
