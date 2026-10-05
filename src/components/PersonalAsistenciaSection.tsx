import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  Users,
  Search,
  Plus,
  Pencil,
  MoreVertical,
  QrCode,
  CalendarCheck,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Printer,
  Download,
  Clock,
  Briefcase,
  UserCheck,
  UserX,
  History,
  IdCard,
} from 'lucide-react';
import {
  Empleado,
  RegistroAsistencia,
  TipoAsistencia,
  ConfiguracionTaller,
} from '../types';
import { IotLogo } from './IotLogo';

interface PersonalAsistenciaSectionProps {
  empleados: Empleado[];
  asistencias: RegistroAsistencia[];
  configuracion: ConfiguracionTaller;
  onSaveEmpleado: (empleado: Empleado) => void;
  onUpdateEmpleado: (empleado: Empleado) => void;
  onSaveAsistencia: (asistencia: RegistroAsistencia) => void;
}

type TabVista = 'personal' | 'historial';
type FilterEstadoEmp = 'todos' | 'activos' | 'inactivos';

export const PersonalAsistenciaSection: React.FC<PersonalAsistenciaSectionProps> = ({
  empleados,
  asistencias,
  configuracion,
  onSaveEmpleado,
  onUpdateEmpleado,
  onSaveAsistencia,
}) => {
  const [activeTab, setActiveTab] = useState<TabVista>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstadoEmp>('activos');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form Modal: Add / Edit Employee
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formPuesto, setFormPuesto] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Credencial / QR
  const [viewingCredentialEmp, setViewingCredentialEmp] = useState<Empleado | null>(null);
  const [credentialQrDataUrl, setCredentialQrDataUrl] = useState<string>('');

  // Modal: Attendance History for single Employee
  const [singleEmpHistory, setSingleEmpHistory] = useState<Empleado | null>(null);

  // General History Filters
  const [filterHistEmpleadoId, setFilterHistEmpleadoId] = useState('');
  const [filterHistFecha, setFilterHistFecha] = useState('');

  // Attendance Scanner Modal
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Pending Scanned Confirmation
  const [scannedEmployee, setScannedEmployee] = useState<Empleado | null>(null);
  const [proposedTipo, setProposedTipo] = useState<TipoAsistencia>('Entrada');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Video / Canvas refs for scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local date helper: YYYY-MM-DD
  const getTodayStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => getTodayStr(), []);

  // Map of employees for lookups
  const empleadoMap = useMemo(() => {
    const map = new Map<string, Empleado>();
    empleados.forEach((e) => map.set(e.id, e));
    return map;
  }, [empleados]);

  // Generate QR Data URL when opening credential modal
  useEffect(() => {
    if (viewingCredentialEmp) {
      QRCode.toDataURL(viewingCredentialEmp.codigoQr, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#0d1b2a',
          light: '#ffffff',
        },
      })
        .then((url) => setCredentialQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    } else {
      setCredentialQrDataUrl('');
    }
  }, [viewingCredentialEmp]);

  // Clean up camera stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Close scanner modal completely
  const closeScannerModal = () => {
    stopCamera();
    setIsScannerModalOpen(false);
    setScannedEmployee(null);
    setCameraError(null);
    setScanNotice(null);
    setConfirmError(null);
  };

  // Stop camera if unmounted or tab changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Filtered employees list
  const filteredEmpleados = useMemo(() => {
    let list = empleados;
    if (filterEstado === 'activos') {
      list = list.filter((e) => e.activo);
    } else if (filterEstado === 'inactivos') {
      list = list.filter((e) => !e.activo);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.puesto.toLowerCase().includes(q) ||
          e.codigoQr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [empleados, filterEstado, searchQuery]);

  // Daily attendance summary map for each employee
  const dailyAttendanceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        primerEntrada?: string;
        ultimaSalida?: string;
        estadoTexto: string;
        tipoBadge: 'completada' | 'en_turno' | 'sin_registro';
      }
    >();

    empleados.forEach((emp) => {
      const empToday = asistencias
        .filter((a) => a.empleadoId === emp.id && a.fecha === todayStr)
        .sort((a, b) => a.hora.localeCompare(b.hora));

      if (empToday.length === 0) {
        map.set(emp.id, {
          estadoTexto: 'Sin registro hoy',
          tipoBadge: 'sin_registro',
        });
        return;
      }

      const entradas = empToday.filter((a) => a.tipo === 'Entrada');
      const salidas = empToday.filter((a) => a.tipo === 'Salida');
      const primerEntrada = entradas[0]?.hora;
      const ultimaSalida = salidas[salidas.length - 1]?.hora;
      const ultimoRegistro = empToday[empToday.length - 1];

      if (ultimoRegistro.tipo === 'Entrada') {
        map.set(emp.id, {
          primerEntrada,
          estadoTexto: `En turno (Entrada: ${ultimoRegistro.hora})`,
          tipoBadge: 'en_turno',
        });
      } else {
        map.set(emp.id, {
          primerEntrada,
          ultimaSalida,
          estadoTexto: `Completada (${primerEntrada} - ${ultimaSalida})`,
          tipoBadge: 'completada',
        });
      }
    });

    return map;
  }, [empleados, asistencias, todayStr]);

  // Grouped and sorted attendance history
  const historicoAsistencias = useMemo(() => {
    // Collect all records, sort newest first
    let records = [...asistencias].sort((a, b) => {
      const dateComp = b.fecha.localeCompare(a.fecha);
      if (dateComp !== 0) return dateComp;
      return b.hora.localeCompare(a.hora);
    });

    if (filterHistEmpleadoId) {
      records = records.filter((r) => r.empleadoId === filterHistEmpleadoId);
    }
    if (filterHistFecha) {
      records = records.filter((r) => r.fecha === filterHistFecha);
    }

    // Group by employee and date to compute approximate hours
    const grouped = new Map<string, { entradas: string[]; salidas: string[]; empleadoId: string; fecha: string }>();

    records.forEach((r) => {
      const key = `${r.empleadoId}_${r.fecha}`;
      if (!grouped.has(key)) {
        grouped.set(key, { entradas: [], salidas: [], empleadoId: r.empleadoId, fecha: r.fecha });
      }
      const entry = grouped.get(key)!;
      if (r.tipo === 'Entrada') entry.entradas.push(r.hora);
      else entry.salidas.push(r.hora);
    });

    // Generate readable history rows
    const rows: {
      key: string;
      empleadoId: string;
      empleadoNombre: string;
      puesto: string;
      fecha: string;
      horaEntrada: string;
      horaSalida: string;
      horasAprox: string;
      esHoy: boolean;
    }[] = [];

    // Sort grouped keys by date desc
    const sortedGroupKeys = Array.from(grouped.keys()).sort((a, b) => {
      const dateA = grouped.get(a)!.fecha;
      const dateB = grouped.get(b)!.fecha;
      return dateB.localeCompare(dateA);
    });

    sortedGroupKeys.forEach((key) => {
      const g = grouped.get(key)!;
      const emp = empleadoMap.get(g.empleadoId);
      const sortedEntradas = [...g.entradas].sort();
      const sortedSalidas = [...g.salidas].sort();

      const horaEntrada = sortedEntradas[0] || '—';
      const horaSalida = sortedSalidas[sortedSalidas.length - 1] || 'En turno';

      let horasAprox = '—';
      if (sortedEntradas[0] && sortedSalidas[sortedSalidas.length - 1]) {
        const [hE, mE] = sortedEntradas[0].split(':').map(Number);
        const [hS, mS] = sortedSalidas[sortedSalidas.length - 1].split(':').map(Number);
        const minsEntrada = hE * 60 + mE;
        const minsSalida = hS * 60 + mS;
        const diffMins = Math.max(0, minsSalida - minsEntrada);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        horasAprox = `${hrs}h ${mins}m`;
      }

      rows.push({
        key,
        empleadoId: g.empleadoId,
        empleadoNombre: emp?.nombre || 'Empleado no encontrado',
        puesto: emp?.puesto || 'Puesto no asignado',
        fecha: g.fecha,
        horaEntrada,
        horaSalida,
        horasAprox,
        esHoy: g.fecha === todayStr,
      });
    });

    return rows;
  }, [asistencias, filterHistEmpleadoId, filterHistFecha, empleadoMap, todayStr]);

  // Handle open add employee
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormNombre('');
    setFormPuesto('');
    setFormActivo(true);
    setFormError(null);
    setIsEmployeeModalOpen(true);
  };

  // Handle open edit employee
  const handleOpenEdit = (emp: Empleado) => {
    setEditingEmployee(emp);
    setFormNombre(emp.nombre);
    setFormPuesto(emp.puesto);
    setFormActivo(emp.activo);
    setFormError(null);
    setIsEmployeeModalOpen(true);
  };

  // Save employee
  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setFormError('El nombre del empleado es obligatorio.');
      return;
    }
    if (!formPuesto.trim()) {
      setFormError('El puesto del empleado es obligatorio.');
      return;
    }

    if (editingEmployee) {
      const updated: Empleado = {
        ...editingEmployee,
        nombre: formNombre.trim(),
        puesto: formPuesto.trim(),
        activo: formActivo,
      };
      onUpdateEmpleado(updated);
    } else {
      const maxNum = empleados.reduce((max, emp) => {
        const match = emp.codigoQr.match(/\d+/);
        return match ? Math.max(max, parseInt(match[0], 10)) : max;
      }, 0);
      const newNum = maxNum + 1;
      const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newEmpleado: Empleado = {
        id: newId,
        codigoQr: `EMP-${String(newNum).padStart(3, '0')}`,
        nombre: formNombre.trim(),
        puesto: formPuesto.trim(),
        activo: formActivo,
        fechaAlta: new Date().toISOString(),
      };
      onSaveEmpleado(newEmpleado);
    }

    setIsEmployeeModalOpen(false);
  };

  // Process a QR code read string
  const handleProcessQrCode = (qrCodeString: string) => {
    const code = qrCodeString.trim();
    if (!code) {
      setScanNotice('Código QR vacío.');
      return;
    }

    // Match employee by codigoQr or id
    const foundEmp = empleados.find(
      (e) => e.codigoQr.toUpperCase() === code.toUpperCase() || e.id === code
    );

    if (!foundEmp) {
      setCameraError(`El código QR leído ("${code}") no pertenece a ningún empleado registrado.`);
      setScannedEmployee(null);
      return;
    }

    if (!foundEmp.activo) {
      setCameraError(`El empleado ${foundEmp.nombre} se encuentra Inactivo y no puede registrar asistencia.`);
      setScannedEmployee(null);
      return;
    }

    // Determine proposed tipo based on today's records
    const empToday = asistencias
      .filter((a) => a.empleadoId === foundEmp.id && a.fecha === todayStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    let proposed: TipoAsistencia = 'Entrada';
    if (empToday.length > 0) {
      const last = empToday[empToday.length - 1];
      if (last.tipo === 'Entrada') {
        proposed = 'Salida';
      } else {
        proposed = 'Entrada';
      }
    }

    stopCamera();
    setScannedEmployee(foundEmp);
    setProposedTipo(proposed);
    setConfirmError(null);
    setCameraError(null);
  };

  // Start Camera scanning loop
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setScanNotice(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador o dispositivo no soporta el acceso a la cámara. Puedes seleccionar una imagen con el QR.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera error', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos del navegador o selecciona una imagen que contenga el QR.');
      setIsCameraActive(false);
    }
  };

  // Scan single frame with jsQR
  const scanFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleProcessQrCode(code.data);
    } else {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // Image Upload handler for QR reading
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setCameraError('Error al procesar la imagen seleccionada.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleProcessQrCode(code.data);
        } else {
          setCameraError('No se encontró ningún código QR legible en la imagen seleccionada.');
        }
      };
      img.onerror = () => {
        setCameraError('No se pudo cargar la imagen seleccionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm attendance record
  const handleConfirmAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedEmployee) return;

    // Check consecutive duplicate prevention
    const empToday = asistencias
      .filter((a) => a.empleadoId === scannedEmployee.id && a.fecha === todayStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    if (empToday.length > 0) {
      const last = empToday[empToday.length - 1];
      if (last.tipo === proposedTipo) {
        setConfirmError(
          `No es posible registrar dos veces consecutivas "${proposedTipo}". El último registro fue "${last.tipo}" a las ${last.hora}.`
        );
        return;
      }
    } else if (proposedTipo === 'Salida') {
      setConfirmError(
        'El empleado todavía no tiene una entrada registrada hoy. Debe registrar primero su Entrada.'
      );
      return;
    }

    const now = new Date();
    const horaStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRegistro: RegistroAsistencia = {
      id: `asist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      empleadoId: scannedEmployee.id,
      fecha: todayStr,
      hora: horaStr,
      tipo: proposedTipo,
      fechaHora: now.toISOString(),
    };

    onSaveAsistencia(newRegistro);
    setSuccessMessage(`Se registró exitosamente ${proposedTipo} para ${scannedEmployee.nombre} a las ${horaStr}.`);
    closeScannerModal();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Personal y asistencia */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Personal y asistencia
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Gestión del equipo de trabajo y registro de asistencia mediante código QR.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsScannerModalOpen(true);
              setScannerMode('camera');
              setCameraError(null);
              setScannedEmployee(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <span>Registrar asistencia</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar empleado</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sub Tabs: Personal vs Historial */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'personal'
              ? 'border-[#1D7EAE] text-[#1D7EAE]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipo y empleados ({empleados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'historial'
              ? 'border-[#1D7EAE] text-[#1D7EAE]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Historial de asistencias</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL */}
      {activeTab === 'personal' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, puesto o código QR..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] transition-all"
              />
            </div>

            <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setFilterEstado('activos')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterEstado === 'activos'
                    ? 'bg-[#1D7EAE] text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Activos
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('inactivos')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterEstado === 'inactivos'
                    ? 'bg-[#1D7EAE] text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Inactivos
              </button>
              <button
                type="button"
                onClick={() => setFilterEstado('todos')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterEstado === 'todos'
                    ? 'bg-[#1D7EAE] text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Table & Mobile View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-5">Nombre</th>
                    <th className="py-3.5 px-5">Puesto</th>
                    <th className="py-3.5 px-5 text-center">Estado</th>
                    <th className="py-3.5 px-5">Asistencia del día</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmpleados.length > 0 ? (
                    filteredEmpleados.map((emp) => {
                      const asistenciaHoy = dailyAttendanceMap.get(emp.id);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{emp.nombre}</div>
                            <span className="text-[11px] font-mono text-slate-400">
                              Código: {emp.codigoQr}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-medium">
                            {emp.puesto}
                          </td>
                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                emp.activo
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {emp.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                asistenciaHoy?.tipoBadge === 'completada'
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                  : asistenciaHoy?.tipoBadge === 'en_turno'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{asistenciaHoy?.estadoTexto || 'Sin registro'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(emp)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                  title="Más opciones"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {openMenuId === emp.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setOpenMenuId(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setViewingCredentialEmp(emp);
                                        }}
                                        className="w-full px-3 py-2 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2 transition-colors"
                                      >
                                        <IdCard className="w-4 h-4 text-slate-500" />
                                        <span>Ver credencial</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setViewingCredentialEmp(emp);
                                        }}
                                        className="w-full px-3 py-2 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2 transition-colors"
                                      >
                                        <QrCode className="w-4 h-4 text-slate-500" />
                                        <span>Descargar o imprimir QR</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setSingleEmpHistory(emp);
                                        }}
                                        className="w-full px-3 py-2 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2 transition-colors border-t border-slate-100"
                                      >
                                        <History className="w-4 h-4 text-slate-500" />
                                        <span>Ver asistencias</span>
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
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        {searchQuery
                          ? 'No se encontraron empleados que coincidan con la búsqueda.'
                          : 'No hay empleados registrados en este estado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Block View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredEmpleados.length > 0 ? (
                filteredEmpleados.map((emp) => {
                  const asistenciaHoy = dailyAttendanceMap.get(emp.id);
                  return (
                    <div key={emp.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm">{emp.nombre}</span>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                emp.activo
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {emp.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">{emp.puesto}</p>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Código: {emp.codigoQr}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                asistenciaHoy?.tipoBadge === 'completada'
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                  : asistenciaHoy?.tipoBadge === 'en_turno'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{asistenciaHoy?.estadoTexto || 'Sin registro'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg"
                              aria-label="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === emp.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setViewingCredentialEmp(emp);
                                    }}
                                    className="w-full px-3 py-2.5 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2"
                                  >
                                    <IdCard className="w-4 h-4 text-slate-500" />
                                    <span>Ver credencial</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setViewingCredentialEmp(emp);
                                    }}
                                    className="w-full px-3 py-2.5 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2"
                                  >
                                    <QrCode className="w-4 h-4 text-slate-500" />
                                    <span>Descargar / imprimir QR</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setSingleEmpHistory(emp);
                                    }}
                                    className="w-full px-3 py-2.5 text-slate-700 hover:bg-rose-50 hover:text-[#1D7EAE] flex items-center gap-2 border-t border-slate-100"
                                  >
                                    <History className="w-4 h-4 text-slate-500" />
                                    <span>Ver asistencias</span>
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
                <div className="py-10 text-center text-slate-400 text-xs">
                  {searchQuery
                    ? 'No se encontraron empleados que coincidan con la búsqueda.'
                    : 'No hay empleados registrados en este estado.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE ASISTENCIAS */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-slate-500 font-medium mb-1">
                Filtrar por empleado:
              </label>
              <select
                value={filterHistEmpleadoId}
                onChange={(e) => setFilterHistEmpleadoId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1D7EAE] focus:border-[#1D7EAE]"
              >
                <option value="">Todos los empleados</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} ({e.puesto})
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-slate-500 font-medium mb-1">
                Filtrar por fecha:
              </label>
              <input
                type="date"
                value={filterHistFecha}
                onChange={(e) => setFilterHistFecha(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1D7EAE] focus:border-[#1D7EAE]"
              />
            </div>

            {(filterHistEmpleadoId || filterHistFecha) && (
              <div className="self-end pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterHistEmpleadoId('');
                    setFilterHistFecha('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Records Table & Mobile View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-5">Fecha</th>
                    <th className="py-3.5 px-5">Empleado</th>
                    <th className="py-3.5 px-5">Puesto</th>
                    <th className="py-3.5 px-5">Hora de entrada</th>
                    <th className="py-3.5 px-5">Hora de salida</th>
                    <th className="py-3.5 px-5 text-right">Total horas aprox.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicoAsistencias.length > 0 ? (
                    historicoAsistencias.map((item) => (
                      <tr key={item.key} className="hover:bg-slate-50/70 transition-colors text-xs">
                        <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-800">
                          {item.fecha}{' '}
                          {item.esHoy && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-[#0032A0] rounded font-bold text-[10px]">
                              Hoy
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {item.empleadoNombre}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">
                          {item.puesto}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                            {item.horaEntrada}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span
                            className={`font-mono px-2 py-1 rounded ${
                              item.horaSalida === 'En turno'
                                ? 'bg-amber-100 text-amber-800 font-bold font-sans'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {item.horaSalida}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {item.horasAprox}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No hay registros de asistencia que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Block View */}
            <div className="md:hidden divide-y divide-slate-100">
              {historicoAsistencias.length > 0 ? (
                historicoAsistencias.map((item) => (
                  <div key={item.key} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        {item.fecha}
                        {item.esHoy && (
                          <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-[#0032A0] rounded font-bold text-[10px]">
                            Hoy
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {item.horasAprox !== '—' ? `${item.horasAprox}` : 'Sin cálculo'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{item.empleadoNombre}</h4>
                      <p className="text-xs text-slate-500">{item.puesto}</p>
                    </div>
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Entrada:</span>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-medium">
                          {item.horaEntrada}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Salida:</span>
                        <span
                          className={`font-mono px-2 py-0.5 rounded font-medium ${
                            item.horaSalida === 'En turno'
                              ? 'bg-amber-100 text-amber-800 font-sans font-bold'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.horaSalida}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No hay registros de asistencia que coincidan con los filtros seleccionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORMULARIO AGREGAR / EDITAR EMPLEADO */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEmployee ? 'Editar empleado' : 'Agregar empleado'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  const dirty =
                    formNombre.trim() !== (editingEmployee?.nombre || '') ||
                    formPuesto.trim() !== (editingEmployee?.puesto || '');
                  if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                    return;
                  }
                  setIsEmployeeModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ej. Juan Pérez González"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Puesto o cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formPuesto}
                  onChange={(e) => {
                    setFormPuesto(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ej. Mecánico automotriz, Asesor de servicio..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estado del empleado
                </label>
                <div className="flex gap-4 pt-1 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoEmpleado"
                      checked={formActivo}
                      onChange={() => setFormActivo(true)}
                      className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                    />
                    <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Activo
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estadoEmpleado"
                      checked={!formActivo}
                      onChange={() => setFormActivo(false)}
                      className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                    />
                    <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Inactivo
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Para conservar el historial de asistencias, desactiva al empleado en lugar de eliminarlo.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const dirty =
                      formNombre.trim() !== (editingEmployee?.nombre || '') ||
                      formPuesto.trim() !== (editingEmployee?.puesto || '');
                    if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                      return;
                    }
                    setIsEmployeeModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[44px]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER CREDENCIAL / DESCARGAR QR */}
      {viewingCredentialEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150 print-area">
            {/* Modal Controls (No print) */}
            <div className="no-print bg-white border-b border-[#DDE4E8] text-[#231F20] px-5 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Credencial del empleado</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCredentialEmp(null)}
                  className="p-1 text-slate-400 hover:text-[#231F20] rounded transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Credential Card Document */}
            <div className="p-6 bg-white flex flex-col items-center text-center space-y-4">
              <div className="border-b border-slate-200 pb-3 w-full flex flex-col items-center">
                <div className="mb-2">
                  <IotLogo size="sm" variant="dark" />
                </div>
                <span className="text-xs uppercase tracking-widest text-[#1D7EAE] font-bold block">
                  {configuracion?.nombre || 'IOT Technologies'}
                </span>
                <span className="text-[11px] text-slate-400">Credencial de identificación</span>
              </div>

              {/* QR Image */}
              <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner">
                {credentialQrDataUrl ? (
                  <img
                    src={credentialQrDataUrl}
                    alt={`Código QR de ${viewingCredentialEmp.nombre}`}
                    className="w-48 h-48 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                    Generando QR...
                  </div>
                )}
              </div>

              {/* Employee Info Only (Name, Role, QR Code id) - strictly no private data */}
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 leading-tight">
                  {viewingCredentialEmp.nombre}
                </h4>
                <p className="text-xs font-semibold text-[#0032A0] bg-rose-50 px-2.5 py-0.5 rounded-full inline-block">
                  {viewingCredentialEmp.puesto}
                </p>
                <p className="text-xs font-mono font-bold text-slate-400 pt-1">
                  ID: {viewingCredentialEmp.codigoQr}
                </p>
              </div>

              {/* Download QR image button (Screen only) */}
              <div className="no-print pt-2 w-full flex justify-center">
                {credentialQrDataUrl && (
                  <a
                    href={credentialQrDataUrl}
                    download={`credencial-qr-${viewingCredentialEmp.codigoQr}.png`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar código QR (PNG)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL ESPECÍFICO DEL EMPLEADO */}
      {singleEmpHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Asistencias de {singleEmpHistory.nombre}
                </h3>
                <span className="text-xs text-slate-500">{singleEmpHistory.puesto}</span>
              </div>
              <button
                type="button"
                onClick={() => setSingleEmpHistory(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[420px] overflow-y-auto">
              {(() => {
                const empRecords = asistencias
                  .filter((a) => a.empleadoId === singleEmpHistory.id)
                  .sort((a, b) => {
                    const d = b.fecha.localeCompare(a.fecha);
                    if (d !== 0) return d;
                    return b.hora.localeCompare(a.hora);
                  });

                if (empRecords.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Este empleado aún no tiene registros de asistencia.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {empRecords.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              r.tipo === 'Entrada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.tipo}
                          </span>
                          <span className="text-slate-700 font-medium">{r.fecha}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">{r.hora} hrs</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ESCANEAR CÓDIGO QR / REGISTRAR ASISTENCIA */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#1D7EAE]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Registrar asistencia con QR
                </h3>
              </div>
              <button
                type="button"
                onClick={closeScannerModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* If no employee has been scanned yet, show options */}
              {!scannedEmployee ? (
                <>
                  {/* Mode selector */}
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setScannerMode('camera');
                        setCameraError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        scannerMode === 'camera'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Escanear con cámara</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setScannerMode('upload');
                        setCameraError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        scannerMode === 'upload'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir imagen con QR</span>
                    </button>
                  </div>

                  {/* Mode 1: Camera */}
                  {scannerMode === 'camera' && (
                    <div className="space-y-3">
                      <div className="relative aspect-square max-h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-300">
                        {isCameraActive ? (
                          <>
                            <video
                              ref={videoRef}
                              className="w-full h-full object-cover"
                            />
                            {/* Scanning target overlay */}
                            <div className="absolute inset-8 border-2 border-teal-400/80 rounded-lg pointer-events-none animate-pulse" />
                          </>
                        ) : (
                          <div className="text-center p-6 text-slate-300 space-y-3">
                            <Camera className="w-10 h-10 mx-auto text-slate-400" />
                            <p className="text-xs">
                              Por privacidad, la cámara solo se activará cuando lo solicites.
                            </p>
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-4 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                            >
                              Activar cámara para escanear
                            </button>
                          </div>
                        )}
                      </div>

                      {isCameraActive && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Escaneando en tiempo real...
                          </span>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="text-rose-600 hover:underline font-semibold"
                          >
                            Detener cámara
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Upload Image */}
                  {scannerMode === 'upload' && (
                    <div className="space-y-3">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 border-2 border-dashed border-slate-300 hover:border-[#1D7EAE] rounded-xl text-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-slate-50"
                      >
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">
                          Selecciona una imagen que contenga el código QR
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG o captura de pantalla
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Step 2: Confirmation after reading valid QR */
                <form onSubmit={handleConfirmAttendance} className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-[#1D7EAE] tracking-wider">
                        Código QR detectado
                      </span>
                      <span className="font-mono font-bold text-slate-600">
                        {scannedEmployee.codigoQr}
                      </span>
                    </div>

                    <div className="pt-1">
                      <h4 className="text-base font-bold text-slate-900">
                        {scannedEmployee.nombre}
                      </h4>
                      <p className="text-slate-600">{scannedEmployee.puesto}</p>
                    </div>
                  </div>

                  {/* Direction Proposal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de registro propuesto:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          proposedTipo === 'Entrada'
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>Entrada</span>
                        <input
                          type="radio"
                          name="proposedTipo"
                          value="Entrada"
                          checked={proposedTipo === 'Entrada'}
                          onChange={() => {
                            setProposedTipo('Entrada');
                            setConfirmError(null);
                          }}
                          className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                        />
                      </label>

                      <label
                        className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          proposedTipo === 'Salida'
                            ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>Salida</span>
                        <input
                          type="radio"
                          name="proposedTipo"
                          value="Salida"
                          checked={proposedTipo === 'Salida'}
                          onChange={() => {
                            setProposedTipo('Salida');
                            setConfirmError(null);
                          }}
                          className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center text-slate-600">
                    <span>Fecha y hora actual:</span>
                    <strong className="text-slate-900">
                      {todayStr} — {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs
                    </strong>
                  </div>

                  {confirmError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {confirmError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannedEmployee(null);
                        setConfirmError(null);
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Escanear otro
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      Confirmar registro
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
