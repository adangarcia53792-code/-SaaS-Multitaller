import React, { useState, useMemo } from 'react';
import { Cliente, Vehiculo, Cita, ServicioCatalogo } from '../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  X,
  Clock,
  Car,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface CalendarioSectionProps {
  citas: Cita[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  servicios: ServicioCatalogo[];
  onSaveCita: (cita: Cita) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatFechaLong(fechaStr: string): string {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('es-MX', { weekday: 'long' });
  const month = date.toLocaleDateString('es-MX', { month: 'long' });
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capWeekday}, ${d} de ${month} de ${y}`;
}

export const CalendarioSection: React.FC<CalendarioSectionProps> = ({
  citas,
  clientes,
  vehiculos,
  servicios,
  onSaveCita,
}) => {
  // Current view date (year & month) in local time
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected appointment for detail modal
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  // Selected day for "Ver más" modal (when > 2 appointments on desktop)
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

  // Appointment Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [formClientId, setFormClientId] = useState('');
  const [formVehiculoId, setFormVehiculoId] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [formServicio, setFormServicio] = useState('');
  const [formFecha, setFormFecha] = useState('');
  const [formHora, setFormHora] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Lookup maps
  const clienteMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach((c) => map.set(c.id, c));
    return map;
  }, [clientes]);

  const vehiculoMap = useMemo(() => {
    const map = new Map<string, Vehiculo>();
    vehiculos.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehiculos]);

  // Active catalog services
  const activeCatalogServices = useMemo(() => {
    return servicios.filter((s) => s.activo);
  }, [servicios]);

  // Available vehicles for selected client in form
  const availableVehicles = useMemo(() => {
    if (!formClientId) return [];
    return vehiculos.filter((v) => v.clienteId === formClientId);
  }, [vehiculos, formClientId]);

  // Filter out cancelled appointments:
  // "Las citas canceladas no deben aparecer en el calendario; seguirán disponibles en la sección Citas. Las anteriores deben poder consultarse al navegar a otros meses."
  const activeCitas = useMemo(() => {
    return citas.filter((c) => c.estado !== 'Cancelada');
  }, [citas]);

  // Calendar dates math (Local browser time)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Today in local browser time
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Month title capitalized: e.g. "Octubre 2026"
  const monthTitle = useMemo(() => {
    const raw = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [currentDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group appointments by date string
  const citasByDate = useMemo(() => {
    const map = new Map<string, Cita[]>();
    activeCitas.forEach((c) => {
      const list = map.get(c.fecha) || [];
      list.push(c);
      map.set(c.fecha, list);
    });
    map.forEach((list) => {
      list.sort((a, b) => a.hora.localeCompare(b.hora));
    });
    return map;
  }, [activeCitas]);

  // Number of appointments in currently displayed month
  const monthCitasCount = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    return activeCitas.filter((c) => c.fecha.startsWith(prefix)).length;
  }, [activeCitas, year, month]);

  // Monthly calendar grid days calculation
  const calendarCells = useMemo(() => {
    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Day of week of the 1st day (0 for Monday, ..., 6 for Sunday)
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    // Number of days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing padding from next month to complete the grid (multiples of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(
        i
      ).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month, todayStr]);

  // Mobile list: appointments for current month grouped by date
  const mobileMonthGroups = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const monthCitas = activeCitas
      .filter((c) => c.fecha.startsWith(prefix))
      .sort((a, b) => {
        const cmp = a.fecha.localeCompare(b.fecha);
        return cmp !== 0 ? cmp : a.hora.localeCompare(b.hora);
      });

    const groups: { fecha: string; citas: Cita[] }[] = [];
    monthCitas.forEach((c) => {
      const last = groups[groups.length - 1];
      if (last && last.fecha === c.fecha) {
        last.citas.push(c);
      } else {
        groups.push({ fecha: c.fecha, citas: [c] });
      }
    });
    return groups;
  }, [activeCitas, year, month]);

  // Form Handlers
  const handleOpenAdd = (prefilledDate?: string) => {
    setEditingCita(null);
    const defaultClient = clientes[0]?.id || '';
    setFormClientId(defaultClient);
    const defaultVehs = vehiculos.filter((v) => v.clienteId === defaultClient);
    setFormVehiculoId(defaultVehs[0]?.id || '');
    setSelectedCatalogId('');
    setFormServicio('');
    setFormFecha(prefilledDate || '');
    setFormHora('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cita: Cita) => {
    setEditingCita(cita);
    setFormClientId(cita.clienteId);
    setFormVehiculoId(cita.vehiculoId);
    setSelectedCatalogId('');
    setFormServicio(cita.servicio);
    setFormFecha(cita.fecha);
    setFormHora(cita.hora);
    setFormErrors({});
    setSelectedCita(null);
    setDayModalDate(null);
    setIsFormModalOpen(true);
  };

  const handleSelectCatalogService = (servId: string) => {
    setSelectedCatalogId(servId);
    if (!servId) return;
    const found = servicios.find((s) => s.id === servId);
    if (!found) return;

    if (formServicio.trim() && formServicio.trim() !== found.nombre) {
      const confirmReplace = window.confirm(
        'Ya escribiste un servicio solicitado. ¿Deseas sustituirlo con los datos del catálogo?'
      );
      if (!confirmReplace) {
        setSelectedCatalogId('');
        return;
      }
    }

    setFormServicio(found.nombre);
    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
  };

  const handleClientChange = (newClientId: string) => {
    setFormClientId(newClientId);
    const clientVehs = vehiculos.filter((v) => v.clienteId === newClientId);
    setFormVehiculoId(clientVehs[0]?.id || '');
    if (formErrors.clienteId) setFormErrors((prev) => ({ ...prev, clienteId: '' }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formClientId) errors.clienteId = 'Debe seleccionar un cliente registrado.';
    if (!formVehiculoId) errors.vehiculoId = 'Debe seleccionar un vehículo.';
    if (!formServicio.trim()) errors.servicio = 'El servicio solicitado es obligatorio.';
    if (!formFecha) errors.fecha = 'La fecha de la cita es obligatoria.';
    if (!formHora) errors.hora = 'La hora de la cita es obligatoria.';

    if (formFecha && formHora) {
      const [fy, fm, fd] = formFecha.split('-').map(Number);
      const [fh, fmin] = formHora.split(':').map(Number);
      const scheduledDateTime = new Date(fy, fm - 1, fd, fh, fmin);
      const isDateChanged =
        !editingCita || editingCita.fecha !== formFecha || editingCita.hora !== formHora;

      if (isDateChanged && scheduledDateTime.getTime() <= Date.now()) {
        errors.fecha = 'La fecha y hora de la cita deben ser futuras.';
      }

      // Check conflict for same vehicle at same date and time
      const hasConflict = citas.some((c) => {
        if (editingCita && c.id === editingCita.id) return false;
        return (
          c.estado === 'Programada' &&
          c.vehiculoId === formVehiculoId &&
          c.fecha === formFecha &&
          c.hora === formHora
        );
      });

      if (hasConflict) {
        errors.hora = 'Este vehículo ya tiene una cita programada para esa fecha y hora.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const savedCita: Cita = {
      id: editingCita
        ? editingCita.id
        : `cita-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: formClientId,
      vehiculoId: formVehiculoId,
      servicio: formServicio.trim(),
      fecha: formFecha,
      hora: formHora,
      estado: editingCita ? editingCita.estado : 'Programada',
      creadoEn: editingCita ? editingCita.creadoEn : new Date().toISOString(),
    };

    onSaveCita(savedCita);
    setIsFormModalOpen(false);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Calendario del taller
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Agenda visual de citas y citas programadas por día y mes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar cita</span>
        </button>
      </div>

      {/* Calendar Controls: Navigation (Anterior, Hoy, Siguiente) + Month title */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            {monthTitle}
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-600 border border-slate-200">
            {monthCitasCount} {monthCitasCount === 1 ? 'cita' : 'citas'}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP / TABLET: MONTHLY GRID VIEW (md:block) */}
      {/* ======================================================== */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs text-center py-2.5">
          {DIAS_SEMANA.map((dia) => (
            <div key={dia}>{dia}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/30">
          {calendarCells.map((cell, idx) => {
            const dayCitas = cell.isCurrentMonth ? citasByDate.get(cell.dateStr) || [] : [];
            const hasMore = dayCitas.length > 2;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => {
                  if (cell.isCurrentMonth) {
                    handleOpenAdd(cell.dateStr);
                  }
                }}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                  cell.isCurrentMonth
                    ? 'bg-white hover:bg-teal-50/20'
                    : 'bg-slate-50/50 text-slate-300 pointer-events-none'
                }`}
              >
                {/* Day Header: Number + subtle indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold inline-flex items-center justify-center ${
                      cell.isToday
                        ? 'w-6 h-6 rounded-full bg-[#0d5c58] text-white font-bold shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cell.isCurrentMonth && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdd(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#0d5c58] transition-opacity"
                      title="Agendar cita en este día"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Appointments (up to 2) */}
                <div className="space-y-1 my-1.5 flex-1">
                  {dayCitas.slice(0, 2).map((c) => {
                    const client = clienteMap.get(c.clienteId);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCita(c);
                        }}
                        className="w-full text-left px-2 py-1 bg-teal-50 hover:bg-teal-100 text-[#0d5c58] border border-teal-200/70 rounded text-[11px] font-medium truncate flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <span className="font-bold text-[10px] shrink-0 font-mono text-teal-800 bg-teal-100/90 px-1 rounded">
                          {c.hora}
                        </span>
                        <span className="truncate">{client ? client.nombre : 'Cliente'}</span>
                      </button>
                    );
                  })}

                  {hasMore && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayModalDate(cell.dateStr);
                      }}
                      className="w-full text-left text-[11px] font-semibold text-[#0d5c58] hover:text-[#0a4845] hover:underline px-1 py-0.5"
                    >
                      + Ver más ({dayCitas.length - 2})
                    </button>
                  )}
                </div>

                {/* Bottom space placeholder */}
                <div />
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE: LIST VIEW GROUPED BY DATE (md:hidden) */}
      {/* "En celular, muestra una lista de citas del mes seleccionado agrupadas por fecha para facilitar la lectura." */}
      {/* ======================================================== */}
      <div className="block md:hidden space-y-4">
        {mobileMonthGroups.length > 0 ? (
          mobileMonthGroups.map((group) => {
            const isTodayGroup = group.fecha === todayStr;

            return (
              <div
                key={group.fecha}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Group Date Header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {formatFechaLong(group.fecha)}
                    </span>
                    {isTodayGroup && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0d5c58] text-white text-[10px] font-bold">
                        Hoy
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAdd(group.fecha)}
                    className="p-1 text-[#0d5c58] hover:bg-teal-50 rounded"
                    title="Agendar cita en esta fecha"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Appointments list for this date */}
                <div className="divide-y divide-slate-100">
                  {group.citas.map((c) => {
                    const client = clienteMap.get(c.clienteId);
                    const veh = vehiculoMap.get(c.vehiculoId);

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCita(c)}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-teal-50 text-[#0d5c58] border border-teal-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-[#0d5c58]" />
                              <span>{c.hora}</span>
                            </span>
                            <span className="font-semibold text-sm text-slate-900">
                              {client ? client.nombre : 'Cliente no encontrado'}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {c.estado}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          {veh ? (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Car className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {veh.marca} {veh.modelo} ({veh.placas})
                              </span>
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-700 line-clamp-2 pt-0.5">
                          {c.servicio}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6 text-[#0d5c58]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Sin citas para este mes</h4>
              <p className="text-xs text-slate-500 mt-1">
                No hay citas programadas para {monthTitle.toLowerCase()}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar cita ahora</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: DETALLE BREVE DE CITA SELECCIONADA */}
      {/* "Al seleccionar una cita, abre un detalle breve con:
          - Fecha y hora.
          - Cliente y vehículo.
          - Servicio solicitado.
          - Estado.
          - Botón “Editar cita” que abra el formulario existente." */}
      {/* ======================================================== */}
      {selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-300" />
                <h3 className="text-base font-bold text-white">Detalle de la cita</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCita(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Fecha y hora */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Fecha y hora programada
                </span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-[#0d5c58]" />
                  <span>{selectedCita.hora} hrs</span>
                  <span className="text-slate-400">•</span>
                  <span>{formatFechaLong(selectedCita.fecha)}</span>
                </div>
              </div>

              {/* Cliente y vehículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Cliente
                  </span>
                  {(() => {
                    const c = clienteMap.get(selectedCita.clienteId);
                    return c ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{c.nombre}</p>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.telefono}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Cliente no encontrado</p>
                    );
                  })()}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Vehículo
                  </span>
                  {(() => {
                    const v = vehiculoMap.get(selectedCita.vehiculoId);
                    return v ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">
                          {v.marca} {v.modelo}
                        </p>
                        <p className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block text-[11px]">
                          {v.placas}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Vehículo no encontrado</p>
                    );
                  })()}
                </div>
              </div>

              {/* Servicio solicitado */}
              <div>
                <span className="font-semibold text-slate-600 block mb-1">
                  Servicio solicitado:
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-medium">
                  {selectedCita.servicio}
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-slate-600">Estado de la cita:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-[#0d5c58] border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedCita.estado}</span>
                </span>
              </div>
            </div>

            {/* Modal Actions: Botón Editar cita */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedCita(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedCita)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar cita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VER MÁS CITAS DE UN DÍA ESPECÍFICO (Desktop) */}
      {/* ======================================================== */}
      {dayModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-base font-bold text-white">
                  Citas del día
                </h3>
                <p className="text-xs text-teal-200 font-medium mt-0.5">
                  {formatFechaLong(dayModalDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDayModalDate(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {(citasByDate.get(dayModalDate) || []).map((c) => {
                const client = clienteMap.get(c.clienteId);
                const veh = vehiculoMap.get(c.vehiculoId);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setDayModalDate(null);
                      setSelectedCita(c);
                    }}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50/40 hover:border-teal-200 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-white text-[#0d5c58] border border-slate-200 px-2 py-0.5 rounded">
                          {c.hora} hrs
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {client ? client.nombre : 'Cliente'}
                        </span>
                      </div>
                      <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        {c.estado}
                      </span>
                    </div>

                    {veh && (
                      <p className="text-slate-500 text-[11px]">
                        {veh.marca} {veh.modelo} • Placas: {veh.placas}
                      </p>
                    )}

                    <p className="text-slate-700 line-clamp-2">
                      {c.servicio}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDayModalDate(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = dayModalDate;
                  setDayModalDate(null);
                  handleOpenAdd(d);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar cita en este día</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FORMULARIO AGENDAR / EDITAR CITA */}
      {/* "Reutilice el formulario de Citas. Si se pulsa desde un día seleccionado, completa la fecha, pero permite elegir la hora antes de guardar. Conserva las validaciones existentes." */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCita ? 'Editar cita' : 'Agendar cita'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCita
                    ? 'Modifica los datos o reprograma la fecha y hora.'
                    : 'Completa los datos para programar la atención.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente registrado <span className="text-red-500">*</span>
                </label>
                {clientes.length > 0 ? (
                  <select
                    value={formClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  >
                    <option value="" disabled>
                      Seleccione un cliente
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No hay clientes registrados en el sistema.
                  </p>
                )}
                {formErrors.clienteId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.clienteId}</p>
                )}
              </div>

              {/* Vehículo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehículo del cliente <span className="text-red-500">*</span>
                </label>
                {availableVehicles.length > 0 ? (
                  <select
                    value={formVehiculoId}
                    onChange={(e) => {
                      setFormVehiculoId(e.target.value);
                      if (formErrors.vehiculoId) setFormErrors((prev) => ({ ...prev, vehiculoId: '' }));
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                  >
                    <option value="" disabled>
                      Seleccione un vehículo
                    </option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} — Placas: {v.placas}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Este cliente no tiene vehículos registrados aún.
                  </p>
                )}
                {formErrors.vehiculoId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.vehiculoId}</p>
                )}
              </div>

              {/* Selector de servicio del catálogo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Servicio del catálogo <span className="text-[11px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleSelectCatalogService(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d5c58]"
                >
                  <option value="">Seleccionar del catálogo o escribir abajo...</option>
                  {activeCatalogServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (${s.total.toFixed(2)} MXN)
                    </option>
                  ))}
                </select>
              </div>

              {/* Servicio solicitado */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Servicio solicitado <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formServicio}
                  onChange={(e) => {
                    setFormServicio(e.target.value);
                    if (formErrors.servicio) setFormErrors((prev) => ({ ...prev, servicio: '' }));
                  }}
                  placeholder="Ej. Afinación mayor, cambio de aceite y filtro sintético"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                    formErrors.servicio ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {formErrors.servicio && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.servicio}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de la cita <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => {
                      setFormFecha(e.target.value);
                      if (formErrors.fecha) setFormErrors((prev) => ({ ...prev, fecha: '' }));
                    }}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.fecha ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.fecha && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hora de la cita <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formHora}
                    onChange={(e) => {
                      setFormHora(e.target.value);
                      if (formErrors.hora) setFormErrors((prev) => ({ ...prev, hora: '' }));
                    }}
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.hora ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.hora && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.hora}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientes.length === 0 || availableVehicles.length === 0}
                  className="px-5 py-2 bg-[#0d5c58] hover:bg-[#0a4845] disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
                >
                  Guardar cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
