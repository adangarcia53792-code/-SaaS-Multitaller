import React, { useState, useRef } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Save,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  FileJson,
  AlertCircle,
  Settings,
  Sliders,
} from 'lucide-react';
import {
  ConfiguracionTaller,
  RespaldoDemo,
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  ServicioCatalogo,
  Refaccion,
  MovimientoInventario,
  Factura,
  Empleado,
  RegistroAsistencia,
  Seguimiento,
  Prospecto,
  Usuario,
  SesionUsuario,
  Garantia,
  EventoBitacora,
} from '../types';
import { UsuariosPermisosSection } from './UsuariosPermisosSection';

interface ConfiguracionSectionProps {
  configuracion: ConfiguracionTaller;
  onSaveConfiguracion: (config: ConfiguracionTaller) => void;
  // Current data to generate backup and download before restore
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
  // Restore all data handler
  onRestoreData: (backup: RespaldoDemo) => void;
  // Usuarios y permisos (ETAPA 20)
  usuarios?: Usuario[];
  currentUser?: SesionUsuario;
  onSaveUsuario?: (usuario: Usuario) => void;
  onUpdateUsuario?: (usuario: Usuario) => void;
  onToggleActivoUsuario?: (usuarioId: string) => { success: boolean; message?: string };
  onChangePasswordUsuario?: (usuarioId: string, newPassword: string) => void;
}

export function ConfiguracionSection({
  configuracion,
  onSaveConfiguracion,
  clientes,
  vehiculos,
  citas,
  cotizaciones,
  ordenes,
  servicios,
  refacciones,
  movimientos,
  facturas,
  empleados,
  asistencias,
  seguimientos,
  prospectos,
  garantias,
  bitacora,
  onRestoreData,
  usuarios,
  currentUser,
  onSaveUsuario,
  onUpdateUsuario,
  onToggleActivoUsuario,
  onChangePasswordUsuario,
}: ConfiguracionSectionProps) {
  // Section 1: Workshop data form
  const [nombre, setNombre] = useState(configuracion.nombre || 'Taller mecánico');
  const [telefono, setTelefono] = useState(configuracion.telefono || '');
  const [direccion, setDireccion] = useState(configuracion.direccion || '');
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Section 2: Backup & Restore states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedBackup, setParsedBackup] = useState<RespaldoDemo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Sync internal state if props change
  React.useEffect(() => {
    setNombre(configuracion.nombre || 'Taller mecánico');
    setTelefono(configuracion.telefono || '');
    setDireccion(configuracion.direccion || '');
  }, [configuracion]);

  const handleSaveWorkshopData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setNombreError('El nombre del taller es obligatorio.');
      return;
    }
    setNombreError(null);

    const updated: ConfiguracionTaller = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
    };

    onSaveConfiguracion(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleDownloadBackup = () => {
    const backup: RespaldoDemo = {
      version: '1.0',
      fechaExportacion: new Date().toISOString(),
      configuracion: {
        nombre: nombre.trim() || 'Taller mecánico',
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
      },
      clientes,
      vehiculos,
      citas,
      cotizaciones,
      ordenes,
      servicios,
      refacciones,
      movimientos,
      facturas: facturas || [],
      empleados: empleados || [],
      asistencias: asistencias || [],
      seguimientos: seguimientos || [],
      prospectos: prospectos || [],
      garantias: garantias || [],
      bitacora: bitacora || [],
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `respaldo-taller-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Validate incoming JSON
  const validateBackupData = (jsonObj: any): { valid: boolean; error?: string; data?: RespaldoDemo } => {
    if (!jsonObj || typeof jsonObj !== 'object') {
      return { valid: false, error: 'El archivo no contiene un formato JSON válido.' };
    }

    if (!jsonObj.version || typeof jsonObj.version !== 'string') {
      return { valid: false, error: 'El archivo no contiene una versión de formato válida.' };
    }

    if (!jsonObj.configuracion || typeof jsonObj.configuracion !== 'object') {
      return { valid: false, error: 'El archivo no contiene los datos de configuración del taller.' };
    }

    if (!jsonObj.configuracion.nombre || typeof jsonObj.configuracion.nombre !== 'string' || !jsonObj.configuracion.nombre.trim()) {
      return { valid: false, error: 'El nombre del taller en la configuración es obligatorio.' };
    }

    const requiredArrays = [
      'clientes',
      'vehiculos',
      'citas',
      'cotizaciones',
      'ordenes',
      'servicios',
      'refacciones',
      'movimientos',
    ];

    for (const key of requiredArrays) {
      if (!Array.isArray(jsonObj[key])) {
        return { valid: false, error: `El archivo carece de la lista requerida: ${key}.` };
      }
    }

    const valClientes: Cliente[] = jsonObj.clientes;
    const valVehiculos: Vehiculo[] = jsonObj.vehiculos;
    const valCitas: Cita[] = jsonObj.citas;
    const valCotizaciones: Cotizacion[] = jsonObj.cotizaciones;
    const valOrdenes: OrdenTrabajo[] = jsonObj.ordenes;
    const valServicios: ServicioCatalogo[] = jsonObj.servicios;
    const valRefacciones: Refaccion[] = jsonObj.refacciones;
    const valMovimientos: MovimientoInventario[] = jsonObj.movimientos;

    // Validate Clientes
    const clienteIdSet = new Set<string>();
    for (const c of valClientes) {
      if (!c.id || typeof c.id !== 'string') {
        return { valid: false, error: 'Existe un cliente sin identificador válido.' };
      }
      if (clienteIdSet.has(c.id)) {
        return { valid: false, error: `Identificador de cliente duplicado: ${c.id}` };
      }
      clienteIdSet.add(c.id);
      if (!c.nombre || typeof c.nombre !== 'string' || !c.nombre.trim()) {
        return { valid: false, error: 'Todos los clientes deben contar con un nombre registrado.' };
      }
      if (!c.telefono || typeof c.telefono !== 'string' || !c.telefono.trim()) {
        return { valid: false, error: 'Todos los clientes deben contar con un teléfono.' };
      }
    }

    // Validate Vehículos
    const vehiculoIdSet = new Set<string>();
    for (const v of valVehiculos) {
      if (!v.id || typeof v.id !== 'string') {
        return { valid: false, error: 'Existe un vehículo sin identificador válido.' };
      }
      if (vehiculoIdSet.has(v.id)) {
        return { valid: false, error: `Identificador de vehículo duplicado: ${v.id}` };
      }
      vehiculoIdSet.add(v.id);
      if (!v.clienteId || !clienteIdSet.has(v.clienteId)) {
        return {
          valid: false,
          error: `El vehículo con placas "${v.placas || v.id}" está vinculado a un cliente inexistente.`,
        };
      }
      if (!v.marca || !v.modelo || !v.placas) {
        return { valid: false, error: 'Los vehículos deben tener marca, modelo y placas.' };
      }
    }

    // Validate Citas
    const citaIdSet = new Set<string>();
    for (const ct of valCitas) {
      if (!ct.id || typeof ct.id !== 'string') {
        return { valid: false, error: 'Existe una cita sin identificador válido.' };
      }
      if (citaIdSet.has(ct.id)) {
        return { valid: false, error: `Identificador de cita duplicado: ${ct.id}` };
      }
      citaIdSet.add(ct.id);
      if (!ct.clienteId || !clienteIdSet.has(ct.clienteId)) {
        return { valid: false, error: `Una cita está vinculada a un cliente inexistente.` };
      }
      if (!ct.vehiculoId || !vehiculoIdSet.has(ct.vehiculoId)) {
        return { valid: false, error: `Una cita está vinculada a un vehículo inexistente.` };
      }
      if (!ct.fecha || !ct.hora || !ct.servicio) {
        return { valid: false, error: 'Las citas deben contener fecha, hora y servicio.' };
      }
      if (ct.estado !== 'Programada' && ct.estado !== 'Cancelada') {
        return { valid: false, error: `Estado de cita inválido: ${ct.estado}` };
      }
    }

    // Validate Cotizaciones
    const cotizacionIdSet = new Set<string>();
    const folioCotSet = new Set<string>();
    for (const cot of valCotizaciones) {
      if (!cot.id || typeof cot.id !== 'string') {
        return { valid: false, error: 'Existe una cotización sin identificador válido.' };
      }
      if (cotizacionIdSet.has(cot.id)) {
        return { valid: false, error: `Identificador de cotización duplicado: ${cot.id}` };
      }
      cotizacionIdSet.add(cot.id);
      if (cot.folio) {
        if (folioCotSet.has(cot.folio)) {
          return { valid: false, error: `Folio de cotización duplicado: ${cot.folio}` };
        }
        folioCotSet.add(cot.folio);
      }
      if (!cot.clienteId || !clienteIdSet.has(cot.clienteId)) {
        return { valid: false, error: `La cotización ${cot.folio || cot.id} referencia a un cliente inexistente.` };
      }
      if (!cot.vehiculoId || !vehiculoIdSet.has(cot.vehiculoId)) {
        return { valid: false, error: `La cotización ${cot.folio || cot.id} referencia a un vehículo inexistente.` };
      }
      if (
        typeof cot.importeRefacciones !== 'number' ||
        cot.importeRefacciones < 0 ||
        isNaN(cot.importeRefacciones) ||
        typeof cot.importeManoObra !== 'number' ||
        cot.importeManoObra < 0 ||
        isNaN(cot.importeManoObra) ||
        typeof cot.total !== 'number' ||
        cot.total < 0 ||
        isNaN(cot.total)
      ) {
        return { valid: false, error: `La cotización ${cot.folio || cot.id} contiene importes numéricos inválidos.` };
      }
      if (cot.estado !== 'Por autorizar' && cot.estado !== 'Aprobada' && cot.estado !== 'Rechazada') {
        return { valid: false, error: `Estado de cotización desconocido: ${cot.estado}` };
      }
    }

    // Validate Órdenes
    const ordenIdSet = new Set<string>();
    const folioOrdSet = new Set<string>();
    for (const ord of valOrdenes) {
      if (!ord.id || typeof ord.id !== 'string') {
        return { valid: false, error: 'Existe una orden sin identificador válido.' };
      }
      if (ordenIdSet.has(ord.id)) {
        return { valid: false, error: `Identificador de orden duplicado: ${ord.id}` };
      }
      ordenIdSet.add(ord.id);
      if (ord.folio) {
        if (folioOrdSet.has(ord.folio)) {
          return { valid: false, error: `Folio de orden duplicado: ${ord.folio}` };
        }
        folioOrdSet.add(ord.folio);
      }
      if (!ord.clienteId || !clienteIdSet.has(ord.clienteId)) {
        return { valid: false, error: `La orden ${ord.folio || ord.id} referencia a un cliente inexistente.` };
      }
      if (!ord.vehiculoId || !vehiculoIdSet.has(ord.vehiculoId)) {
        return { valid: false, error: `La orden ${ord.folio || ord.id} referencia a un vehículo inexistente.` };
      }
      if (ord.cotizacionId && !cotizacionIdSet.has(ord.cotizacionId)) {
        return {
          valid: false,
          error: `La orden ${ord.folio || ord.id} vincula a una cotización que no existe en el respaldo.`,
        };
      }
    }

    // Cross-check cotizaciones linking to ordenId
    for (const cot of valCotizaciones) {
      if (cot.ordenId && !ordenIdSet.has(cot.ordenId)) {
        return {
          valid: false,
          error: `La cotización ${cot.folio || cot.id} vincula a una orden que no existe en el respaldo.`,
        };
      }
    }

    // Validate Servicios
    const servicioIdSet = new Set<string>();
    for (const s of valServicios) {
      if (!s.id || typeof s.id !== 'string') {
        return { valid: false, error: 'Existe un servicio sin identificador válido.' };
      }
      if (servicioIdSet.has(s.id)) {
        return { valid: false, error: `Identificador de servicio duplicado: ${s.id}` };
      }
      servicioIdSet.add(s.id);
      if (!s.nombre || typeof s.nombre !== 'string' || !s.nombre.trim()) {
        return { valid: false, error: 'Todos los servicios deben tener nombre.' };
      }
      if (
        typeof s.importeRefacciones !== 'number' ||
        s.importeRefacciones < 0 ||
        isNaN(s.importeRefacciones) ||
        typeof s.importeManoObra !== 'number' ||
        s.importeManoObra < 0 ||
        isNaN(s.importeManoObra) ||
        typeof s.total !== 'number' ||
        s.total < 0 ||
        isNaN(s.total)
      ) {
        return { valid: false, error: `El servicio ${s.nombre} contiene importes numéricos inválidos.` };
      }
    }

    // Validate Refacciones
    const refaccionIdSet = new Set<string>();
    const codigoRefSet = new Set<string>();
    for (const r of valRefacciones) {
      if (!r.id || typeof r.id !== 'string') {
        return { valid: false, error: 'Existe una refacción sin identificador válido.' };
      }
      if (refaccionIdSet.has(r.id)) {
        return { valid: false, error: `Identificador de refacción duplicado: ${r.id}` };
      }
      refaccionIdSet.add(r.id);
      if (r.codigo) {
        const cUp = r.codigo.toUpperCase().trim();
        if (codigoRefSet.has(cUp)) {
          return { valid: false, error: `Código de refacción duplicado: ${r.codigo}` };
        }
        codigoRefSet.add(cUp);
      }
      if (!r.nombre || typeof r.nombre !== 'string' || !r.nombre.trim()) {
        return { valid: false, error: 'Todas las refacciones deben tener nombre.' };
      }
      if (
        typeof r.existencias !== 'number' ||
        r.existencias < 0 ||
        isNaN(r.existencias) ||
        !Number.isInteger(r.existencias)
      ) {
        return {
          valid: false,
          error: `Las existencias de ${r.nombre} deben ser un número entero no negativo.`,
        };
      }
      if (typeof r.minimo !== 'number' || r.minimo < 0 || isNaN(r.minimo) || !Number.isInteger(r.minimo)) {
        return {
          valid: false,
          error: `El stock mínimo de ${r.nombre} debe ser un número entero no negativo.`,
        };
      }
      if (
        r.costoUnitario !== undefined &&
        (typeof r.costoUnitario !== 'number' || r.costoUnitario < 0 || isNaN(r.costoUnitario))
      ) {
        return { valid: false, error: `El costo unitario de ${r.nombre} es inválido.` };
      }
    }

    // Validate used parts in orders
    for (const ord of valOrdenes) {
      if (ord.refaccionesUtilizadas && Array.isArray(ord.refaccionesUtilizadas)) {
        for (const u of ord.refaccionesUtilizadas) {
          if (!refaccionIdSet.has(u.refaccionId)) {
            return {
              valid: false,
              error: `La orden ${ord.folio || ord.id} utiliza una refacción no existente en el catálogo.`,
            };
          }
          if (typeof u.cantidad !== 'number' || u.cantidad < 0 || !Number.isInteger(u.cantidad)) {
            return { valid: false, error: `Cantidad de refacción utilizada inválida en orden ${ord.folio}.` };
          }
          if (
            u.devueltas !== undefined &&
            (typeof u.devueltas !== 'number' || u.devueltas < 0 || !Number.isInteger(u.devueltas))
          ) {
            return { valid: false, error: `Cantidad devuelta de refacción inválida en orden ${ord.folio}.` };
          }
        }
      }
    }

    // Validate Movimientos
    const movIdSet = new Set<string>();
    for (const m of valMovimientos) {
      if (!m.id || typeof m.id !== 'string') {
        return { valid: false, error: 'Existe un movimiento sin identificador válido.' };
      }
      if (movIdSet.has(m.id)) {
        return { valid: false, error: `Identificador de movimiento duplicado: ${m.id}` };
      }
      movIdSet.add(m.id);
      if (!refaccionIdSet.has(m.refaccionId)) {
        return {
          valid: false,
          error: `Un movimiento de inventario hace referencia a una refacción inexistente.`,
        };
      }
      if (m.tipo !== 'Entrada' && m.tipo !== 'Salida') {
        return { valid: false, error: `Tipo de movimiento de inventario no válido: ${m.tipo}` };
      }
      if (typeof m.cantidad !== 'number' || m.cantidad <= 0 || !Number.isInteger(m.cantidad)) {
        return { valid: false, error: `La cantidad de movimiento debe ser un entero positivo.` };
      }
      if (m.ordenId && !ordenIdSet.has(m.ordenId)) {
        return { valid: false, error: `Un movimiento referencia a una orden inexistente.` };
      }
    }

    if (jsonObj.bitacora !== undefined && !Array.isArray(jsonObj.bitacora)) {
      return { valid: false, error: 'La bitácora de actividad en el archivo de respaldo no tiene un formato válido.' };
    }

    return {
      valid: true,
      data: {
        version: jsonObj.version,
        fechaExportacion: jsonObj.fechaExportacion || new Date().toISOString(),
        configuracion: {
          nombre: jsonObj.configuracion.nombre.trim(),
          telefono: jsonObj.configuracion.telefono?.trim() || undefined,
          direccion: jsonObj.configuracion.direccion?.trim() || undefined,
        },
        clientes: valClientes,
        vehiculos: valVehiculos,
        citas: valCitas,
        cotizaciones: valCotizaciones,
        ordenes: valOrdenes,
        servicios: valServicios,
        refacciones: valRefacciones,
        movimientos: valMovimientos,
        facturas: Array.isArray(jsonObj.facturas) ? jsonObj.facturas : undefined,
        empleados: Array.isArray(jsonObj.empleados) ? jsonObj.empleados : undefined,
        asistencias: Array.isArray(jsonObj.asistencias) ? jsonObj.asistencias : undefined,
        seguimientos: Array.isArray(jsonObj.seguimientos) ? jsonObj.seguimientos : undefined,
        prospectos: Array.isArray(jsonObj.prospectos) ? jsonObj.prospectos : undefined,
        garantias: Array.isArray(jsonObj.garantias) ? jsonObj.garantias : undefined,
        bitacora: Array.isArray(jsonObj.bitacora) ? jsonObj.bitacora : undefined,
      },
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          setValidationError(
            'El archivo seleccionado no tiene una estructura JSON válida o está dañado.'
          );
          setParsedBackup(null);
          return;
        }

        const result = validateBackupData(json);
        if (!result.valid || !result.data) {
          setValidationError(
            result.error || 'El archivo no cumple con el formato o contiene registros inconsistentes.'
          );
          setParsedBackup(null);
        } else {
          setValidationError(null);
          setParsedBackup(result.data);
        }
      } catch {
        setValidationError('Ocurrió un error al procesar el archivo de respaldo.');
        setParsedBackup(null);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setValidationError('No se pudo leer el archivo seleccionado.');
      setParsedBackup(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;
    onRestoreData(parsedBackup);
    setParsedBackup(null);
    setRestoreSuccess(true);
    setTimeout(() => setRestoreSuccess(false), 4000);
  };

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Configuración */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Configuración
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Ajustes generales del taller, usuarios y respaldo de la información.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification for Save */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Los datos del taller se guardaron correctamente.</span>
        </div>
      )}

      {/* Success Notification for Restore */}
      {restoreSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>La información de la demo ha sido restaurada con éxito.</span>
        </div>
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800 text-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Respaldo no válido</p>
              <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
              <p className="text-xs text-rose-600 mt-1 italic">
                Los datos actuales de la demo se mantuvieron intactos sin modificaciones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. DATOS DEL TALLER */}
      <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F6F8FA] border-b border-[#DDE4E8] flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-slate-700" />
          <div>
            <h3 className="font-bold text-[#231F20] text-base">Datos del taller</h3>
            <p className="text-xs text-[#5F6B73]">
              Información de identificación reflejada en el encabezado e impresiones.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveWorkshopData} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del taller <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (nombreError) setNombreError(null);
              }}
              placeholder="Ej. Taller mecánico"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all ${
                nombreError ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
              }`}
            />
            {nombreError && <p className="text-xs text-red-600 mt-1">{nombreError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 555-123-4567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Central #123, Col. Industrial"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar cambios</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. USUARIOS Y PERMISOS (ETAPA 20) */}
      {usuarios && currentUser && onSaveUsuario && onUpdateUsuario && onToggleActivoUsuario && onChangePasswordUsuario && (
        <UsuariosPermisosSection
          usuarios={usuarios}
          empleados={empleados || []}
          currentUser={currentUser}
          onSaveUsuario={onSaveUsuario}
          onUpdateUsuario={onUpdateUsuario}
          onToggleActivoUsuario={onToggleActivoUsuario}
          onChangePasswordUsuario={onChangePasswordUsuario}
        />
      )}

      {/* 3. RESPALDO DE LA DEMO */}
      <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F6F8FA] border-b border-[#DDE4E8] flex items-center gap-2.5">
          <FileJson className="w-5 h-5 text-slate-700" />
          <div>
            <h3 className="font-bold text-[#231F20] text-base">Respaldo de la demo</h3>
            <p className="text-xs text-[#5F6B73]">
              Descarga o restaura toda la información del taller en este navegador.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed bg-[#F6F8FA] p-4 rounded-lg border border-[#DDE4E8]">
            Los datos se guardan en este navegador. Descarga un respaldo para conservar una copia o trasladarlos a otro equipo.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar respaldo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-white border border-[#DDE4E8] hover:bg-slate-50 text-[#231F20] text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Restaurar respaldo</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* MODAL: RESUMEN Y CONFIRMACIÓN DE RESTAURACIÓN */}
      {parsedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Resumen del archivo de respaldo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setParsedBackup(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-xs text-slate-500">
                Fecha de exportación:{' '}
                <strong className="text-slate-700">
                  {new Date(parsedBackup.fechaExportacion).toLocaleString('es-MX')}
                </strong>{' '}
                — Versión: <strong className="text-slate-700">{parsedBackup.version}</strong>
              </div>

              {/* Summary of records */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Taller</span>
                  <span className="font-semibold text-slate-900 text-sm truncate block">
                    {parsedBackup.configuracion.nombre}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Clientes</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.clientes.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Vehículos</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.vehiculos.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Citas</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.citas.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Cotizaciones</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.cotizaciones.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Órdenes de trabajo</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.ordenes.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Servicios de catálogo</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.servicios.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Refacciones</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.refacciones.length}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <span className="text-slate-500 block">Movimientos de inventario</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {parsedBackup.movimientos.length}
                  </span>
                </div>
                {parsedBackup.facturas && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Comprobantes de facturación</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {parsedBackup.facturas.length}
                    </span>
                  </div>
                )}
                {parsedBackup.empleados && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Personal registrado</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {parsedBackup.empleados.length}
                    </span>
                  </div>
                )}
                {parsedBackup.asistencias && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                    <span className="text-slate-500 block">Registros de asistencia</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {parsedBackup.asistencias.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-sm">
                    Restaurar reemplazará los datos actuales de esta demo.
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Esta acción reemplazará todos los clientes, vehículos, citas, cotizaciones, órdenes, servicios e inventario actuales por los datos contenidos en el respaldo.
                  </p>
                </div>
              </div>

              {/* Offer to download current backup first */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  ¿Deseas respaldar los datos actuales antes de continuar?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="font-semibold text-[#1D7EAE] hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar actual</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedBackup(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs md:text-sm font-medium shadow-xs transition-colors"
                >
                  Confirmar y restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
