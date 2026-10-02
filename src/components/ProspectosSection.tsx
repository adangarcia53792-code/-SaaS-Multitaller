import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Plus,
  Pencil,
  X,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MoreVertical,
  ArrowRight,
  History,
  Check,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Tag,
  ChevronDown,
  ChevronUp,
  ListOrdered,
} from 'lucide-react';
import {
  Prospecto,
  EstadoProspecto,
  OrigenProspecto,
  Cliente,
  ServicioCatalogo,
  Seguimiento,
  HistorialProspectoItem,
} from '../types';

interface ProspectosSectionProps {
  prospectos: Prospecto[];
  clientes: Cliente[];
  servicios: ServicioCatalogo[];
  seguimientos: Seguimiento[];
  onSaveProspecto: (prospecto: Prospecto, seguimiento?: Seguimiento) => void;
  onUpdateProspecto: (prospecto: Prospecto, seguimiento?: Seguimiento) => void;
  onConvertirEnCliente: (
    prospectoId: string,
    clienteData: { nombre: string; telefono: string; correo?: string },
    existingClienteId?: string
  ) => void;
  onUpdateSeguimientoEstado?: (
    seguimientoId: string,
    nuevoEstado: 'Pendiente' | 'Realizado' | 'Cancelado',
    newDate?: string,
    newTime?: string
  ) => void;
  onNavigateToClientes?: () => void;
}

const ESTADOS_PROSPECTO: EstadoProspecto[] = [
  'Nuevo',
  'Contactado',
  'Sin respuesta',
  'Cita agendada',
  'No interesado',
  'Convertido en cliente',
];

const ORIGENES_PROSPECTO: OrigenProspecto[] = [
  'Recomendación',
  'Redes sociales',
  'Llamada',
  'Visita',
  'Otro',
];

export const ProspectosSection: React.FC<ProspectosSectionProps> = ({
  prospectos,
  clientes,
  servicios,
  seguimientos,
  onSaveProspecto,
  onUpdateProspecto,
  onConvertirEnCliente,
  onUpdateSeguimientoEstado,
  onNavigateToClientes,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Row menus & apartados desplegables
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Form Modal (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProspecto, setEditingProspecto] = useState<Prospecto | null>(null);

  // Form fields
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formServicioInteres, setFormServicioInteres] = useState('');
  const [formOrigen, setFormOrigen] = useState<OrigenProspecto>('Llamada');
  const [formEstado, setFormEstado] = useState<EstadoProspecto>('Nuevo');
  const [formNotas, setFormNotas] = useState('');
  const [formProximaFecha, setFormProximaFecha] = useState('');
  const [formProximaHora, setFormProximaHora] = useState('10:00');
  const [formProximaNota, setFormProximaNota] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateWarningAck, setDuplicateWarningAck] = useState(false);

  // Convert to Client Modal
  const [convertingProspecto, setConvertingProspecto] = useState<Prospecto | null>(null);
  const [convertClientNombre, setConvertClientNombre] = useState('');
  const [convertClientTelefono, setConvertClientTelefono] = useState('');
  const [convertClientCorreo, setConvertClientCorreo] = useState('');
  const [matchedExistingClientId, setMatchedExistingClientId] = useState<string | null>(null);
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [convertErrors, setConvertErrors] = useState<Record<string, string>>({});

  // History & Details Modal
  const [viewingProspecto, setViewingProspecto] = useState<Prospecto | null>(null);

  // Quick Reschedule Modal
  const [reschedulingProspecto, setReschedulingProspecto] = useState<Prospecto | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Duplicate phone detection for form
  const duplicatePhoneProspect = useMemo(() => {
    const cleanPhone = formTelefono.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 6) return null;

    return prospectos.find((p) => {
      if (editingProspecto && p.id === editingProspecto.id) return false;
      const otherClean = p.telefono.trim().replace(/[^0-9]/g, '');
      return otherClean === cleanPhone;
    });
  }, [formTelefono, prospectos, editingProspecto]);

  // Client lookup map
  const clienteMap = useMemo(() => {
    return new Map(clientes.map((c) => [c.id, c]));
  }, [clientes]);

  // Filtered prospectos list
  const filteredProspectos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return prospectos.filter((p) => {
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.telefono.toLowerCase().includes(q) ||
        (p.servicioInteres && p.servicioInteres.toLowerCase().includes(q));

      const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [prospectos, searchQuery, filterEstado]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProspecto(null);
    setFormNombre('');
    setFormTelefono('');
    setFormCorreo('');
    setFormServicioInteres('');
    setFormOrigen('Llamada');
    setFormEstado('Nuevo');
    setFormNotas('');
    setFormProximaFecha('');
    setFormProximaHora('10:00');
    setFormProximaNota('');
    setFormErrors({});
    setDuplicateWarningAck(false);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Prospecto) => {
    setEditingProspecto(p);
    setFormNombre(p.nombre);
    setFormTelefono(p.telefono);
    setFormCorreo(p.correo || '');
    setFormServicioInteres(p.servicioInteres || '');
    setFormOrigen(p.origen);
    setFormEstado(p.estado);
    setFormNotas(p.notas || '');
    setFormProximaFecha(p.proximaAccionFecha || '');
    setFormProximaHora(p.proximaAccionHora || '10:00');
    setFormProximaNota(p.proximaAccionNota || '');
    setFormErrors({});
    setDuplicateWarningAck(false);
    setIsFormModalOpen(true);
    setOpenMenuId(null);
  };

  // Open Convert Modal
  const handleOpenConvert = (p: Prospecto) => {
    if (p.estado === 'Convertido en cliente') {
      showFeedback('Este prospecto ya fue convertido en cliente.');
      return;
    }

    setConvertingProspecto(p);
    setConvertClientNombre(p.nombre);
    setConvertClientTelefono(p.telefono);
    setConvertClientCorreo(p.correo || '');
    setConvertErrors({});

    // Check if phone or email matches an existing client
    const cleanPhone = p.telefono.trim().replace(/[^0-9]/g, '');
    const cleanEmail = (p.correo || '').trim().toLowerCase();

    const existingMatch = clientes.find((c) => {
      const matchPhone = cleanPhone && c.telefono.replace(/[^0-9]/g, '') === cleanPhone;
      const matchEmail = cleanEmail && c.correo && c.correo.trim().toLowerCase() === cleanEmail;
      return matchPhone || matchEmail;
    });

    if (existingMatch) {
      setMatchedExistingClientId(existingMatch.id);
      setUseExistingClient(true);
    } else {
      setMatchedExistingClientId(null);
      setUseExistingClient(false);
    }

    setOpenMenuId(null);
  };

  // Save Prospecto Form (Add / Edit)
  const handleSaveProspectoForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
    }

    if (!formTelefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio.';
    } else {
      const cleanDigits = formTelefono.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 7) {
        errors.telefono = 'Ingresa un teléfono válido (al menos 7 dígitos).';
      }
    }

    if (formCorreo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formCorreo.trim())) {
        errors.correo = 'El formato del correo electrónico no es válido.';
      }
    }

    // Duplicate check without acknowledgement
    if (duplicatePhoneProspect && !duplicateWarningAck) {
      errors.telefono =
        'Este teléfono ya pertenece a otro prospecto. Revisa la advertencia antes de continuar.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const nowIso = new Date().toISOString();
    const todayYmd = nowIso.slice(0, 10);

    let linkedSeguimiento: Seguimiento | undefined = undefined;

    if (editingProspecto) {
      // Editing existing
      const updatedHistorial = [...editingProspecto.historial];

      // Track state change
      if (editingProspecto.estado !== formEstado) {
        updatedHistorial.unshift({
          id: `hist-${Date.now()}-1`,
          fechaHora: nowIso,
          tipo: 'estado',
          descripcion: `Estado cambiado de "${editingProspecto.estado}" a "${formEstado}".`,
        });
      }

      // Track notes change
      if ((editingProspecto.notas || '') !== formNotas.trim()) {
        updatedHistorial.unshift({
          id: `hist-${Date.now()}-2`,
          fechaHora: nowIso,
          tipo: 'nota',
          descripcion: formNotas.trim()
            ? `Nota actualizada: "${formNotas.trim().slice(0, 60)}${formNotas.trim().length > 60 ? '...' : ''}"`
            : 'Nota eliminada.',
        });
      }

      // Track next action change
      if (
        formProximaFecha &&
        (editingProspecto.proximaAccionFecha !== formProximaFecha ||
          editingProspecto.proximaAccionHora !== formProximaHora)
      ) {
        updatedHistorial.unshift({
          id: `hist-${Date.now()}-3`,
          fechaHora: nowIso,
          tipo: 'seguimiento',
          descripcion: `Próxima acción programada para el ${formProximaFecha} a las ${formProximaHora || '10:00'} hrs.`,
        });

        // Create or update linked Seguimiento
        linkedSeguimiento = {
          id:
            editingProspecto.seguimientoId ||
            `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          clienteId: editingProspecto.clienteId || '',
          prospectoId: editingProspecto.id,
          prospectoNombre: formNombre.trim(),
          motivo: 'seguimiento_prospecto',
          motivoLabel: 'Contacto comercial',
          registroTipo: 'prospecto',
          registroRef: `Prospecto: ${formNombre.trim()}`,
          mensaje:
            formProximaNota.trim() ||
            `Seguimiento comercial con prospecto ${formNombre.trim()} (${formTelefono.trim()})${
              formServicioInteres.trim() ? ' para ' + formServicioInteres.trim() : ''
            }`,
          fecha: formProximaFecha,
          hora: formProximaHora || '10:00',
          estado: 'Pendiente',
          creadoEn: nowIso,
        };
      }

      const updated: Prospecto = {
        ...editingProspecto,
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        correo: formCorreo.trim() || undefined,
        servicioInteres: formServicioInteres.trim() || undefined,
        origen: formOrigen,
        estado: formEstado,
        notas: formNotas.trim() || undefined,
        proximaAccionFecha: formProximaFecha || undefined,
        proximaAccionHora: formProximaFecha ? formProximaHora || '10:00' : undefined,
        proximaAccionNota: formProximaFecha ? formProximaNota.trim() || undefined : undefined,
        seguimientoId: linkedSeguimiento ? linkedSeguimiento.id : editingProspecto.seguimientoId,
        historial: updatedHistorial,
      };

      onUpdateProspecto(updated, linkedSeguimiento);
      showFeedback('Prospecto actualizado exitosamente.');
    } else {
      // Creating new
      const newId = `pros-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const initialHistorial: HistorialProspectoItem[] = [
        {
          id: `hist-${Date.now()}-1`,
          fechaHora: nowIso,
          tipo: 'creacion',
          descripcion: `Prospecto registrado vía ${formOrigen}.${formServicioInteres ? ' Servicio de interés: ' + formServicioInteres.trim() : ''}`,
        },
      ];

      if (formProximaFecha) {
        initialHistorial.unshift({
          id: `hist-${Date.now()}-2`,
          fechaHora: nowIso,
          tipo: 'seguimiento',
          descripcion: `Próxima acción programada para el ${formProximaFecha} a las ${formProximaHora || '10:00'} hrs.`,
        });

        linkedSeguimiento = {
          id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          clienteId: '',
          prospectoId: newId,
          prospectoNombre: formNombre.trim(),
          motivo: 'seguimiento_prospecto',
          motivoLabel: 'Contacto comercial',
          registroTipo: 'prospecto',
          registroRef: `Prospecto: ${formNombre.trim()}`,
          mensaje:
            formProximaNota.trim() ||
            `Seguimiento comercial con prospecto ${formNombre.trim()} (${formTelefono.trim()})${
              formServicioInteres.trim() ? ' para ' + formServicioInteres.trim() : ''
            }`,
          fecha: formProximaFecha,
          hora: formProximaHora || '10:00',
          estado: 'Pendiente',
          creadoEn: nowIso,
        };
      }

      const newProspecto: Prospecto = {
        id: newId,
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        correo: formCorreo.trim() || undefined,
        servicioInteres: formServicioInteres.trim() || undefined,
        origen: formOrigen,
        estado: formEstado,
        notas: formNotas.trim() || undefined,
        fechaContacto: todayYmd,
        proximaAccionFecha: formProximaFecha || undefined,
        proximaAccionHora: formProximaFecha ? formProximaHora || '10:00' : undefined,
        proximaAccionNota: formProximaFecha ? formProximaNota.trim() || undefined : undefined,
        seguimientoId: linkedSeguimiento?.id,
        historial: initialHistorial,
        creadoEn: nowIso,
      };

      onSaveProspecto(newProspecto, linkedSeguimiento);
      showFeedback('Prospecto agregado exitosamente.');
    }

    setIsFormModalOpen(false);
  };

  // Confirm Convert to Client
  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingProspecto) return;

    if (useExistingClient && matchedExistingClientId) {
      // Link to existing client
      onConvertirEnCliente(
        convertingProspecto.id,
        {
          nombre: convertClientNombre.trim(),
          telefono: convertClientTelefono.trim(),
          correo: convertClientCorreo.trim() || undefined,
        },
        matchedExistingClientId
      );
      showFeedback('Prospecto vinculado exitosamente con el cliente existente.');
      setConvertingProspecto(null);
      return;
    }

    // Validate new client data
    const errors: Record<string, string> = {};
    if (!convertClientNombre.trim()) errors.nombre = 'El nombre es obligatorio.';
    if (!convertClientTelefono.trim()) errors.telefono = 'El teléfono es obligatorio.';

    if (convertClientCorreo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(convertClientCorreo.trim())) {
        errors.correo = 'El correo no tiene un formato válido.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setConvertErrors(errors);
      return;
    }

    onConvertirEnCliente(convertingProspecto.id, {
      nombre: convertClientNombre.trim(),
      telefono: convertClientTelefono.trim(),
      correo: convertClientCorreo.trim() || undefined,
    });

    showFeedback('¡Prospecto convertido en cliente con éxito! Ya aparece en el directorio de Clientes.');
    setConvertingProspecto(null);
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (p: Prospecto) => {
    setReschedulingProspecto(p);
    setRescheduleDate(p.proximaAccionFecha || '');
    setRescheduleTime(p.proximaAccionHora || '10:00');
    setRescheduleNote(p.proximaAccionNota || '');
    setRescheduleError(null);
    setOpenMenuId(null);
  };

  // Save Reschedule
  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingProspecto) return;

    if (!rescheduleDate) {
      setRescheduleError('Debes seleccionar una fecha para la próxima acción.');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedHistorial = [...reschedulingProspecto.historial];
    updatedHistorial.unshift({
      id: `hist-${Date.now()}-resched`,
      fechaHora: nowIso,
      tipo: 'seguimiento',
      descripcion: `Próxima acción reprogramada para el ${rescheduleDate} a las ${rescheduleTime || '10:00'} hrs.${
        rescheduleNote.trim() ? ' Nota: ' + rescheduleNote.trim() : ''
      }`,
    });

    // Update or create linked seguimiento
    let linkedSeguimiento: Seguimiento | undefined;
    if (reschedulingProspecto.seguimientoId) {
      const existingSeg = seguimientos.find((s) => s.id === reschedulingProspecto.seguimientoId);
      if (existingSeg) {
        linkedSeguimiento = {
          ...existingSeg,
          fecha: rescheduleDate,
          hora: rescheduleTime || '10:00',
          estado: 'Pendiente',
          mensaje:
            rescheduleNote.trim() ||
            existingSeg.mensaje ||
            `Seguimiento con prospecto ${reschedulingProspecto.nombre}`,
        };
      }
    }

    if (!linkedSeguimiento) {
      linkedSeguimiento = {
        id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clienteId: reschedulingProspecto.clienteId || '',
        prospectoId: reschedulingProspecto.id,
        prospectoNombre: reschedulingProspecto.nombre,
        motivo: 'seguimiento_prospecto',
        motivoLabel: 'Contacto comercial',
        registroTipo: 'prospecto',
        registroRef: `Prospecto: ${reschedulingProspecto.nombre}`,
        mensaje:
          rescheduleNote.trim() ||
          `Seguimiento comercial con prospecto ${reschedulingProspecto.nombre} (${reschedulingProspecto.telefono})`,
        fecha: rescheduleDate,
        hora: rescheduleTime || '10:00',
        estado: 'Pendiente',
        creadoEn: nowIso,
      };
    }

    const updatedProspecto: Prospecto = {
      ...reschedulingProspecto,
      proximaAccionFecha: rescheduleDate,
      proximaAccionHora: rescheduleTime || '10:00',
      proximaAccionNota: rescheduleNote.trim() || undefined,
      seguimientoId: linkedSeguimiento.id,
      historial: updatedHistorial,
    };

    onUpdateProspecto(updatedProspecto, linkedSeguimiento);
    setReschedulingProspecto(null);
    showFeedback('Próxima acción reprogramada exitosamente.');
  };

  // Update Seguimiento status directly (Realizado / Cancelado)
  const handleUpdateActionStatus = (p: Prospecto, nuevoEstado: 'Realizado' | 'Cancelado') => {
    const nowIso = new Date().toISOString();
    const updatedHistorial = [...p.historial];
    updatedHistorial.unshift({
      id: `hist-${Date.now()}-status`,
      fechaHora: nowIso,
      tipo: 'seguimiento',
      descripcion: `Próxima acción marcada como ${nuevoEstado}.`,
    });

    if (p.seguimientoId && onUpdateSeguimientoEstado) {
      onUpdateSeguimientoEstado(p.seguimientoId, nuevoEstado);
    }

    const updatedProspecto: Prospecto = {
      ...p,
      historial: updatedHistorial,
    };

    onUpdateProspecto(updatedProspecto);
    showFeedback(`Próxima acción marcada como ${nuevoEstado.toLowerCase()}.`);
  };

  // Helper for status badge style
  const getEstadoBadge = (estado: EstadoProspecto) => {
    switch (estado) {
      case 'Nuevo':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Contactado':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Sin respuesta':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cita agendada':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'No interesado':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Convertido en cliente':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Prospectos */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Prospectos y seguimientos
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Registro y seguimiento de oportunidades comerciales y personas interesadas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar prospecto</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o servicio..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] focus:bg-white transition-all"
          />
        </div>

        {/* State filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Estado:
          </span>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] focus:bg-white transition-all cursor-pointer"
          >
            <option value="todos">Todos los estados ({prospectos.length})</option>
            {ESTADOS_PROSPECTO.map((est) => {
              const count = prospectos.filter((p) => p.estado === est).length;
              return (
                <option key={est} value={est}>
                  {est} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Table & Mobile View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Servicio de interés</th>
                <th className="py-3 px-4">Fecha de contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Próxima acción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProspectos.length > 0 ? (
                filteredProspectos.map((p) => {
                  const linkedSeg = p.seguimientoId
                    ? seguimientos.find((s) => s.id === p.seguimientoId)
                    : undefined;

                  const isConverted = p.estado === 'Convertido en cliente';
                  const linkedClient = p.clienteId ? clienteMap.get(p.clienteId) : undefined;

                  const isExpanded = expandedRowId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Nombre con botón desplegable */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title={isExpanded ? 'Ocultar apartado de detalles' : 'Desplegar detalles e historial'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#1D7EAE]" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="font-semibold text-slate-900">{p.nombre}</div>
                              {p.origen && (
                                <span className="text-[11px] text-slate-400">Origen: {p.origen}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Teléfono */}
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                          {p.telefono}
                        </td>

                        {/* Servicio de interés */}
                        <td className="py-3 px-4 text-slate-700">
                          {p.servicioInteres ? (
                            <span className="truncate block max-w-xs">{p.servicioInteres}</span>
                          ) : (
                            <span className="text-slate-400 italic">No especificado</span>
                          )}
                        </td>

                        {/* Fecha de contacto */}
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {p.fechaContacto}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadge(
                              p.estado
                            )}`}
                          >
                            {p.estado}
                          </span>
                        </td>

                        {/* Próxima acción */}
                        <td className="py-3 px-4">
                          {p.proximaAccionFecha ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                <Calendar className="w-3.5 h-3.5 text-[#1D7EAE]" />
                                <span>
                                  {p.proximaAccionFecha} {p.proximaAccionHora ? `(${p.proximaAccionHora})` : ''}
                                </span>
                              </div>
                              {linkedSeg && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    linkedSeg.estado === 'Pendiente'
                                      ? 'bg-amber-100 text-amber-800'
                                      : linkedSeg.estado === 'Realizado'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {linkedSeg.estado}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin programar</span>
                          )}
                        </td>

                        {/* Botón Editar, Ver Cliente y Más Opciones */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {isConverted && (
                              <button
                                type="button"
                                onClick={() => onNavigateToClientes && onNavigateToClientes()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                                title="Ver cliente en el directorio"
                              >
                                <User className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ver cliente</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            {/* Más opciones dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Más opciones"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === p.id && (
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-xs text-left animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedRowId(p.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <History className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Ver detalles e historial</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenReschedule(p)}
                                    className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>
                                      {p.proximaAccionFecha ? 'Reprogramar acción' : 'Programar acción'}
                                    </span>
                                  </button>

                                  {!isConverted ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConvert(p)}
                                      className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100"
                                    >
                                      <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Convertir en cliente</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        if (onNavigateToClientes) onNavigateToClientes();
                                      }}
                                      className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100"
                                    >
                                      <User className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>
                                        Ver cliente {linkedClient ? `(${linkedClient.nombre})` : ''}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* APARTADO DESPLEGABLE: DETALLES, SEGUIMIENTO E HISTORIAL */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="space-y-4 max-w-5xl text-xs">
                              {/* Encabezado del apartado desplegable */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-200/80 gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-sm">
                                    Detalle del prospecto: {p.nombre}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadge(
                                      p.estado
                                    )}`}
                                  >
                                    {p.estado}
                                  </span>
                                  {isConverted && (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                                      Cliente vinculado: {linkedClient?.nombre || 'Registrado'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  {isConverted && (
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToClientes && onNavigateToClientes()}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D7EAE] hover:underline"
                                    >
                                      <User className="w-3.5 h-3.5" />
                                      <span>Ver en Clientes</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedRowId(null)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Cerrar apartado"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Bloque 1: Información de contacto & Notas */}
                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Datos de contacto y consulta
                                  </span>
                                  <div className="space-y-1 text-slate-700">
                                    <p>
                                      <span className="text-slate-400">Teléfono:</span>{' '}
                                      <strong className="font-mono text-slate-900">{p.telefono}</strong>
                                    </p>
                                    {p.correo && (
                                      <p>
                                        <span className="text-slate-400">Correo:</span> {p.correo}
                                      </p>
                                    )}
                                    <p>
                                      <span className="text-slate-400">Origen de contacto:</span>{' '}
                                      <span className="font-medium text-slate-800">{p.origen}</span>
                                    </p>
                                    {p.servicioInteres && (
                                      <p>
                                        <span className="text-slate-400">Servicio de interés:</span>{' '}
                                        <strong className="text-slate-900">{p.servicioInteres}</strong>
                                      </p>
                                    )}
                                    <p className="text-[11px] text-slate-400">
                                      Fecha primer contacto: {p.fechaContacto}
                                    </p>
                                  </div>

                                  {p.notas ? (
                                    <div className="pt-2 border-t border-slate-100">
                                      <span className="text-slate-400 text-[11px] block mb-0.5 font-medium">
                                        Notas u observaciones:
                                      </span>
                                      <p className="text-slate-800 italic bg-slate-50 p-2.5 rounded border border-slate-200/70 text-xs">
                                        "{p.notas}"
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-slate-400 italic pt-1 text-[11px]">
                                      Sin notas u observaciones adicionales.
                                    </p>
                                  )}
                                </div>

                                {/* Bloque 2: Próxima acción y seguimiento */}
                                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                      Seguimiento y próxima acción
                                    </span>
                                    {p.proximaAccionFecha && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReschedule(p)}
                                        className="text-xs text-[#1D7EAE] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        <span>Reprogramar</span>
                                      </button>
                                    )}
                                  </div>

                                  {p.proximaAccionFecha ? (
                                    <div className="space-y-2.5">
                                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold flex items-center gap-1.5 text-xs">
                                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                                            {p.proximaAccionFecha} · {p.proximaAccionHora || '10:00'} hrs
                                          </span>
                                          {linkedSeg && (
                                            <span
                                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                                linkedSeg.estado === 'Pendiente'
                                                  ? 'bg-amber-200 text-amber-900'
                                                  : linkedSeg.estado === 'Realizado'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-slate-200 text-slate-700'
                                              }`}
                                            >
                                              {linkedSeg.estado}
                                            </span>
                                          )}
                                        </div>
                                        {p.proximaAccionNota && (
                                          <p className="text-xs text-amber-800 pt-0.5 italic">
                                            "{p.proximaAccionNota}"
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateActionStatus(p, 'Realizado')}
                                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Marcar realizada</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateActionStatus(p, 'Cancelado')}
                                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Cancelar</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 text-slate-500 py-2">
                                      <p className="italic">
                                        No hay ninguna acción comercial programada actualmente.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReschedule(p)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                                      >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Programar próxima acción</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bloque 3: Historial de cambios */}
                              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Historial de eventos (ordenado del más reciente al más antiguo)
                                </span>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {p.historial && p.historial.length > 0 ? (
                                    p.historial.map((h, idx) => (
                                      <div
                                        key={h.id || idx}
                                        className="p-2 bg-slate-50 rounded border border-slate-100 flex items-start justify-between gap-3 text-xs"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                                h.tipo === 'creacion'
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : h.tipo === 'estado'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : h.tipo === 'conversion'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : h.tipo === 'seguimiento'
                                                  ? 'bg-purple-100 text-purple-800'
                                                  : 'bg-slate-200 text-slate-700'
                                              }`}
                                            >
                                              {h.tipo}
                                            </span>
                                            <span className="text-slate-700 font-medium">
                                              {h.descripcion}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                          {new Date(h.fechaHora).toLocaleString('es-MX')}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-400 italic">Sin historial registrado.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm italic">
                    {searchQuery || filterEstado !== 'todos'
                      ? 'No se encontraron prospectos con los filtros aplicados.'
                      : 'No hay prospectos registrados aún. Haz clic en "Agregar prospecto" para registrar uno.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredProspectos.length > 0 ? (
            filteredProspectos.map((p) => {
              const isConverted = p.estado === 'Convertido en cliente';
              return (
                <div key={p.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{p.nombre}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getEstadoBadge(
                            p.estado
                          )}`}
                        >
                          {p.estado}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-600 font-medium">{p.telefono}</p>
                      {p.servicioInteres && (
                        <p className="text-xs text-slate-700 mt-0.5">
                          Interés: <strong>{p.servicioInteres}</strong>
                        </p>
                      )}
                      {p.proximaAccionFecha && (
                        <p className="text-xs text-amber-800 mt-1 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Próx: {p.proximaAccionFecha} ({p.proximaAccionHora || '10:00'})</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg"
                          aria-label="Más opciones"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-xs text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedRowId(p.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <History className="w-4 h-4 text-slate-400" />
                              <span>Ver detalles e historial</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleOpenReschedule(p);
                              }}
                              className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{p.proximaAccionFecha ? 'Reprogramar acción' : 'Programar acción'}</span>
                            </button>

                            {!isConverted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenConvert(p);
                                }}
                                className="w-full px-3.5 py-2.5 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2 border-t border-slate-100"
                              >
                                <UserPlus className="w-4 h-4 text-emerald-600" />
                                <span>Convertir en cliente</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onNavigateToClientes && onNavigateToClientes();
                                }}
                                className="w-full px-3.5 py-2.5 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2 border-t border-slate-100"
                              >
                                <User className="w-4 h-4 text-emerald-600" />
                                <span>Ir a Clientes</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              {searchQuery || filterEstado !== 'todos'
                ? 'No se encontraron prospectos con los filtros aplicados.'
                : 'No hay prospectos registrados aún.'}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FORMULARIO AGREGAR / EDITAR PROSPECTO */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-white text-[#231F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">
                  {editingProspecto ? 'Editar prospecto' : 'Agregar prospecto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const dirty =
                    formNombre.trim() !== (editingProspecto?.nombre || '') ||
                    formTelefono.trim() !== (editingProspecto?.telefono || '') ||
                    formCorreo.trim() !== (editingProspecto?.correo || '') ||
                    formNotas.trim() !== (editingProspecto?.notas || '');
                  if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                    return;
                  }
                  setIsFormModalOpen(false);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProspectoForm} className="p-6 space-y-4 text-sm">
              {/* Advertencia de teléfono duplicado */}
              {duplicatePhoneProspect && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg space-y-2 text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Advertencia: Teléfono ya registrado</p>
                      <p className="mt-0.5 text-amber-800">
                        Ya existe el prospecto <strong>"{duplicatePhoneProspect.nombre}"</strong> con el número{' '}
                        <strong>{duplicatePhoneProspect.telefono}</strong> (Estado: {duplicatePhoneProspect.estado}).
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-amber-900 font-medium cursor-pointer pt-1 border-t border-amber-200">
                    <input
                      type="checkbox"
                      checked={duplicateWarningAck}
                      onChange={(e) => setDuplicateWarningAck(e.target.checked)}
                      className="rounded border-amber-400 text-[#1D7EAE] focus:ring-[#1D7EAE]"
                    />
                    <span>Deseo registrarlo de todas formas con este número telefónico.</span>
                  </label>
                </div>
              )}

              {/* Nombre obligatorio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: '' });
                  }}
                  placeholder="Ej. Mariana Ríos"
                  className={`w-full px-3 py-2 border rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] ${
                    formErrors.nombre ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Teléfono obligatorio & Correo opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formTelefono}
                    onChange={(e) => {
                      setFormTelefono(e.target.value);
                      if (formErrors.telefono) setFormErrors({ ...formErrors, telefono: '' });
                      setDuplicateWarningAck(false);
                    }}
                    placeholder="Ej. 555-345-6789"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] ${
                      formErrors.telefono ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.telefono && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo electrónico <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => {
                      setFormCorreo(e.target.value);
                      if (formErrors.correo) setFormErrors({ ...formErrors, correo: '' });
                    }}
                    placeholder="Ej. mariana@email.com"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] ${
                      formErrors.correo ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.correo && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.correo}</p>
                  )}
                </div>
              </div>

              {/* Servicio de interés */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Servicio de interés
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={formServicioInteres}
                    onChange={(e) => setFormServicioInteres(e.target.value)}
                    placeholder="Ej. Afinación mayor, frenos, diagnóstico..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  />
                  {servicios.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                      <span>Sugeridos:</span>
                      {servicios.slice(0, 3).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormServicioInteres(s.nombre)}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                        >
                          {s.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Origen y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origen del contacto
                  </label>
                  <select
                    value={formOrigen}
                    onChange={(e) => setFormOrigen(e.target.value as OrigenProspecto)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] bg-white cursor-pointer"
                  >
                    {ORIGENES_PROSPECTO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado actual
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as EstadoProspecto)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE] bg-white cursor-pointer"
                  >
                    {ESTADOS_PROSPECTO.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas u observaciones <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Detalles sobre las dudas o necesidades del prospecto..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              {/* Próxima acción (opcional) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Programar próxima acción comercial (Opcional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Fecha de acción</label>
                    <input
                      type="date"
                      value={formProximaFecha}
                      onChange={(e) => setFormProximaFecha(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Hora sugerida</label>
                    <input
                      type="time"
                      value={formProximaHora}
                      onChange={(e) => setFormProximaHora(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                  </div>
                </div>

                {formProximaFecha && (
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Objetivo de la acción
                    </label>
                    <input
                      type="text"
                      value={formProximaNota}
                      onChange={(e) => setFormProximaNota(e.target.value)}
                      placeholder="Ej. Llamar para resolver dudas sobre el presupuesto..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Se generará automáticamente un seguimiento visible en Calendario y Seguimientos.
                    </p>
                  </div>
                )}
              </div>

              {/* Botones Guardar y Cancelar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const dirty =
                      formNombre.trim() !== (editingProspecto?.nombre || '') ||
                      formTelefono.trim() !== (editingProspecto?.telefono || '') ||
                      formCorreo.trim() !== (editingProspecto?.correo || '') ||
                      formNotas.trim() !== (editingProspecto?.notas || '');
                    if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                      return;
                    }
                    setIsFormModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
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

      {/* ========================================================================= */}
      {/* MODAL: CONVERTIR EN CLIENTE */}
      {/* ========================================================================= */}
      {convertingProspecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold text-white">Convertir en cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertingProspecto(null)}
                className="text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConvert} className="p-6 space-y-4 text-sm">
              <p className="text-xs text-slate-600">
                Revisa y confirma los datos para convertir a <strong>{convertingProspecto.nombre}</strong> en cliente formal del taller.
              </p>

              {/* Si se encontró coincidencia previa */}
              {matchedExistingClientId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-start gap-2 text-amber-900 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Se encontró un cliente con datos coincidentes:</span>
                  </div>
                  {(() => {
                    const c = clienteMap.get(matchedExistingClientId);
                    return c ? (
                      <div className="pl-6 text-amber-800 space-y-0.5">
                        <p className="font-bold">{c.nombre}</p>
                        <p>Tel: {c.telefono} {c.correo ? `• ${c.correo}` : ''}</p>
                      </div>
                    ) : null;
                  })()}

                  <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-950">
                      <input
                        type="radio"
                        name="clientOption"
                        checked={useExistingClient}
                        onChange={() => setUseExistingClient(true)}
                        className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                      />
                      <span>Vincular a este cliente existente (Evita duplicados)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-amber-950">
                      <input
                        type="radio"
                        name="clientOption"
                        checked={!useExistingClient}
                        onChange={() => setUseExistingClient(false)}
                        className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                      />
                      <span>Crear como nuevo cliente independiente</span>
                    </label>
                  </div>
                </div>
              )}

              {!useExistingClient && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={convertClientNombre}
                      onChange={(e) => {
                        setConvertClientNombre(e.target.value);
                        if (convertErrors.nombre) setConvertErrors({ ...convertErrors, nombre: '' });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                    {convertErrors.nombre && (
                      <p className="text-xs text-red-600 mt-1">{convertErrors.nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={convertClientTelefono}
                      onChange={(e) => {
                        setConvertClientTelefono(e.target.value);
                        if (convertErrors.telefono)
                          setConvertErrors({ ...convertErrors, telefono: '' });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                    {convertErrors.telefono && (
                      <p className="text-xs text-red-600 mt-1">{convertErrors.telefono}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo electrónico <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={convertClientCorreo}
                      onChange={(e) => {
                        setConvertClientCorreo(e.target.value);
                        if (convertErrors.correo) setConvertErrors({ ...convertErrors, correo: '' });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                    />
                    {convertErrors.correo && (
                      <p className="text-xs text-red-600 mt-1">{convertErrors.correo}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                💡 No es necesario registrar vehículos ni órdenes en este paso. El cliente quedará disponible para usarse con "Nueva atención".
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingProspecto(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar conversión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLES E HISTORIAL DEL PROSPECTO */}
      {/* ========================================================================= */}
      {viewingProspecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-white text-[#231F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">
                  Historial: {viewingProspecto.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProspecto(null)}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Resumen del prospecto */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{viewingProspecto.nombre}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEstadoBadge(
                      viewingProspecto.estado
                    )}`}
                  >
                    {viewingProspecto.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Teléfono:</span> {viewingProspecto.telefono}
                  </div>
                  <div>
                    <span className="text-slate-400">Origen:</span> {viewingProspecto.origen}
                  </div>
                  {viewingProspecto.correo && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Correo:</span> {viewingProspecto.correo}
                    </div>
                  )}
                  {viewingProspecto.servicioInteres && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Servicio de interés:</span>{' '}
                      <strong>{viewingProspecto.servicioInteres}</strong>
                    </div>
                  )}
                </div>

                {viewingProspecto.notas && (
                  <div className="pt-2 border-t border-slate-200/80 text-slate-700 italic">
                    "{viewingProspecto.notas}"
                  </div>
                )}
              </div>

              {/* Próxima acción si existe */}
              {viewingProspecto.proximaAccionFecha && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      Próxima acción programada
                    </span>
                    <span className="font-mono text-amber-800">
                      {viewingProspecto.proximaAccionFecha} a las{' '}
                      {viewingProspecto.proximaAccionHora || '10:00'} hrs
                    </span>
                  </div>
                  {viewingProspecto.proximaAccionNota && (
                    <p className="text-amber-800">{viewingProspecto.proximaAccionNota}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateActionStatus(viewingProspecto, 'Realizado');
                        setViewingProspecto({
                          ...viewingProspecto,
                          historial: [
                            {
                              id: `hist-${Date.now()}`,
                              fechaHora: new Date().toISOString(),
                              tipo: 'seguimiento',
                              descripcion: 'Próxima acción marcada como Realizado.',
                            },
                            ...viewingProspecto.historial,
                          ],
                        });
                      }}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Marcar realizada</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateActionStatus(viewingProspecto, 'Cancelado');
                        setViewingProspecto({
                          ...viewingProspecto,
                          historial: [
                            {
                              id: `hist-${Date.now()}`,
                              fechaHora: new Date().toISOString(),
                              tipo: 'seguimiento',
                              descripcion: 'Próxima acción marcada como Cancelado.',
                            },
                            ...viewingProspecto.historial,
                          ],
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancelar acción</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Línea de tiempo de cambios */}
              <div>
                <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Historial de cambios (del más reciente al más antiguo)
                </h4>
                <div className="space-y-2">
                  {viewingProspecto.historial.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span
                          className={`font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded text-[10px] ${
                            item.tipo === 'creacion'
                              ? 'bg-blue-100 text-blue-800'
                              : item.tipo === 'estado'
                              ? 'bg-amber-100 text-amber-800'
                              : item.tipo === 'conversion'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.tipo === 'seguimiento'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.tipo}
                        </span>
                        <span>{new Date(item.fechaHora).toLocaleString('es-MX')}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {item.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingProspecto(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPROGRAMAR PRÓXIMA ACCIÓN */}
      {/* ========================================================================= */}
      {reschedulingProspecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-white text-[#231F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">
                  Programar acción: {reschedulingProspecto.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingProspecto(null)}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora sugerida
                  </label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objetivo o nota de la acción
                </label>
                <textarea
                  rows={2}
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="Ej. Volver a llamar tras revisión del presupuesto..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20 focus:border-[#1D7EAE]"
                />
              </div>

              {rescheduleError && (
                <p className="text-xs text-red-600">{rescheduleError}</p>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                📌 La acción se reflejará de inmediato en Seguimientos y Calendario. No se envían mensajes automáticos.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReschedulingProspecto(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer min-h-[42px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
