import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Calendar,
  Filter,
  X,
  Eye,
  User,
  Clock,
  FileText,
  Tag,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Shield,
  ChevronDown,
} from 'lucide-react';
import {
  EventoBitacora,
  SeccionBitacora,
  OrdenTrabajo,
  SesionUsuario,
  ConfiguracionTaller,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface BitacoraSectionProps {
  bitacora: EventoBitacora[];
  ordenes: OrdenTrabajo[];
  currentUser?: SesionUsuario;
  configuracion: ConfiguracionTaller;
}

const SECCIONES_FILTRO: SeccionBitacora[] = [
  'Clientes',
  'Vehículos',
  'Citas',
  'Cotizaciones',
  'Órdenes',
  'Inventario',
  'Facturación',
  'Garantías',
  'Configuración',
  'Usuarios',
  'Respaldos',
];

export const BitacoraSection: React.FC<BitacoraSectionProps> = ({
  bitacora,
  ordenes,
  currentUser,
  configuracion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seccionFiltro, setSeccionFiltro] = useState<string>('todas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedEvento, setSelectedEvento] = useState<EventoBitacora | null>(null);

  const eventoModalDismiss = useModalDismiss({
    isOpen: Boolean(selectedEvento),
    onClose: () => setSelectedEvento(null),
    closeOnBackdrop: true,
  });

  const rol = currentUser?.rol || 'Administrador';

  // 1. Filtrar eventos por permisos del rol
  const bitacoraPermitida = useMemo(() => {
    if (rol === 'Administrador') {
      return bitacora;
    }

    if (rol === 'Recepción') {
      const seccionesPermitidas: SeccionBitacora[] = [
        'Clientes',
        'Vehículos',
        'Citas',
        'Cotizaciones',
        'Órdenes',
      ];
      return bitacora.filter((e) => seccionesPermitidas.includes(e.seccion));
    }

    if (rol === 'Mecánico') {
      // Mecánico puede consultar únicamente eventos de las órdenes que tiene asignadas
      const misOrdenIds = new Set(
        ordenes
          .filter(
            (o) =>
              o.mecanicoId === currentUser?.usuarioId ||
              o.mecanicoId === currentUser?.empleadoId ||
              o.mecanicoNombre === currentUser?.nombre
          )
          .map((o) => o.id)
      );

      const misOrdenFolios = new Set(
        ordenes
          .filter(
            (o) =>
              o.mecanicoId === currentUser?.usuarioId ||
              o.mecanicoId === currentUser?.empleadoId ||
              o.mecanicoNombre === currentUser?.nombre
          )
          .map((o) => o.folio)
      );

      return bitacora.filter((e) => {
        if (e.seccion !== 'Órdenes') return false;
        if (e.registroId && misOrdenIds.has(e.registroId)) return true;
        if (e.registroFolio && misOrdenFolios.has(e.registroFolio)) return true;
        return false;
      });
    }

    return [];
  }, [bitacora, rol, ordenes, currentUser]);

  // Función auxiliar para extraer YYYY-MM-DD de forma segura
  const extractDateYMD = (str: string): string => {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, d, m, y] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return str.slice(0, 10);
  };

  // 2. Filtrar por búsqueda, sección y rango de fechas
  const filteredBitacora = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return bitacoraPermitida.filter((evento) => {
      // Filtro de sección
      if (seccionFiltro !== 'todas' && evento.seccion !== seccionFiltro) {
        return false;
      }

      // Filtro de fecha inicial
      if (fechaInicio) {
        const dateStr = extractDateYMD(evento.fechaHora);
        if (dateStr && dateStr < fechaInicio) return false;
      }

      // Filtro de fecha final
      if (fechaFin) {
        const dateStr = extractDateYMD(evento.fechaHora);
        if (dateStr && dateStr > fechaFin) return false;
      }

      // Buscador por usuario, folio o descripción
      if (q) {
        const matchUsuario = evento.usuarioNombre.toLowerCase().includes(q);
        const matchFolio = evento.registroFolio?.toLowerCase().includes(q) || false;
        const matchDesc = evento.descripcion.toLowerCase().includes(q);
        const matchAccion = evento.tipoAccion.toLowerCase().includes(q);
        if (!matchUsuario && !matchFolio && !matchDesc && !matchAccion) {
          return false;
        }
      }

      return true;
    });
  }, [bitacoraPermitida, searchQuery, seccionFiltro, fechaInicio, fechaFin]);

  // Paginación: tomar los primeros visibleCount
  const displayedEventos = useMemo(() => {
    return filteredBitacora.slice(0, visibleCount);
  }, [filteredBitacora, visibleCount]);

  const hasMore = visibleCount < filteredBitacora.length;

  const handleVerMas = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const handleLimpiarFiltros = () => {
    setSearchQuery('');
    setSeccionFiltro('todas');
    setFechaInicio('');
    setFechaFin('');
    setVisibleCount(20);
  };

  // Badge de sección
  const getSeccionBadge = (seccion: SeccionBitacora) => {
    switch (seccion) {
      case 'Clientes':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Vehículos':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Citas':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cotizaciones':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Órdenes':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Inventario':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Facturación':
        return 'bg-rose-50 text-[#0032A0] border-rose-200';
      case 'Garantías':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Configuración':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Usuarios':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Respaldos':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRolBadge = (rolUser: string) => {
    switch (rolUser) {
      case 'Administrador':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Recepción':
      case 'Recepción/CRM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cotizador':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Mecánico':
      case 'Técnico':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Control de calidad':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Caja':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Bitácora */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE] shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                Bitácora de actividad
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#98DAE9]/20 text-[#1D7EAE] border border-[#98DAE9]/40">
                Auditoría
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Registro cronológico inmutable de las operaciones y movimientos realizados en el taller.
            </p>
          </div>
        </div>
      </div>

      {/* Nota educativa de consulta */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {rol === 'Administrador' && 'Visualizando actividad global del taller.'}
            {rol === 'Recepción' && 'Visualizando eventos de clientes, vehículos, citas, cotizaciones y órdenes.'}
            {rol === 'Mecánico' && 'Visualizando exclusivamente eventos vinculados a tus órdenes asignadas.'}
          </span>
        </div>
        <span className="font-semibold text-slate-700">
          {filteredBitacora.length} evento{filteredBitacora.length === 1 ? '' : 's'} encontrado{filteredBitacora.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(20);
              }}
              placeholder="Buscar usuario, folio o texto..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all"
            />
          </div>

          {/* Filtro por Sección */}
          <div>
            <select
              value={seccionFiltro}
              onChange={(e) => {
                setSeccionFiltro(e.target.value);
                setVisibleCount(20);
              }}
              className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all cursor-pointer"
            >
              <option value="todas">Todas las secciones</option>
              {SECCIONES_FILTRO.filter((sec) => {
                if (rol === 'Administrador') return true;
                if (rol === 'Recepción') {
                  return ['Clientes', 'Vehículos', 'Citas', 'Cotizaciones', 'Órdenes'].includes(sec);
                }
                if (rol === 'Mecánico') {
                  return sec === 'Órdenes';
                }
                return false;
              }).map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha inicial */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 shrink-0">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setVisibleCount(20);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
            />
          </div>

          {/* Fecha final */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 shrink-0">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setVisibleCount(20);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
            />
          </div>
        </div>

        {/* Botón limpiar filtros si hay alguno activo */}
        {(searchQuery || seccionFiltro !== 'todas' || fechaInicio || fechaFin) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Eventos & Vista Móvil */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fecha y hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Sección</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedEventos.length > 0 ? (
                displayedEventos.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvento(ev)}
                  >
                    {/* Fecha y hora */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {ev.fechaHora}
                    </td>

                    {/* Usuario */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{ev.usuarioNombre}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {ev.usuarioRol}
                        </span>
                      </div>
                    </td>

                    {/* Sección */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeccionBadge(
                          ev.seccion
                        )}`}
                      >
                        {ev.seccion}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {ev.tipoAccion}
                    </td>

                    {/* Registro relacionado */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {ev.registroFolio ? (
                        <span className="font-mono text-slate-800 font-semibold px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {ev.registroFolio}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Descripción breve */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ev.descripcion}>
                      {ev.descripcion}
                    </td>

                    {/* Botón Ver */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvento(ev);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#1D7EAE] bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer border border-rose-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600 text-sm">
                      {searchQuery || seccionFiltro !== 'todas' || fechaInicio || fechaFin
                        ? 'No se encontraron eventos con los filtros aplicados.'
                        : 'No hay eventos registrados en la bitácora.'}
                    </p>
                    {(searchQuery || seccionFiltro !== 'todas' || fechaInicio || fechaFin) && (
                      <button
                        type="button"
                        onClick={handleLimpiarFiltros}
                        className="mt-2 text-xs font-semibold text-[#1D7EAE] hover:underline"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {displayedEventos.length > 0 ? (
            displayedEventos.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvento(ev)}
                className="p-4 space-y-2 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-mono text-[11px]">{ev.fechaHora}</span>
                  <span className="text-xs font-semibold text-[#0032A0] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {ev.seccion}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">{ev.tipoAccion}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{ev.descripcion}</p>
                    {ev.registroFolio && (
                      <p className="text-[11px] font-mono font-bold text-slate-800 mt-1">
                        Folio: {ev.registroFolio}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-slate-800 block">{ev.usuarioNombre}</span>
                    <span className="text-[10px] text-slate-400 block">{ev.usuarioRol}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600 text-sm">
                {searchQuery || seccionFiltro !== 'todas' || fechaInicio || fechaFin
                  ? 'No se encontraron eventos con los filtros aplicados.'
                  : 'No hay eventos registrados en la bitácora.'}
              </p>
              {(searchQuery || seccionFiltro !== 'todas' || fechaInicio || fechaFin) && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="mt-2 text-xs font-semibold text-[#1D7EAE] hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Paginación / Ver Más */}
        {hasMore && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Mostrando {displayedEventos.length} de {filteredBitacora.length} eventos
            </span>
            <button
              type="button"
              onClick={handleVerMas}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-lg bg-white border border-[#DDE4E8] hover:bg-slate-100 text-[#231F20] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Ver más</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Evento */}
      {selectedEvento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
          onClick={eventoModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#0032A0]">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Detalle del evento
                  </h3>
                  <span className="text-xs text-slate-500">
                    {selectedEvento.tipoAccion} • {selectedEvento.fechaHora}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={eventoModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido modal */}
            <div className="p-6 space-y-4 text-xs">
              {/* Información principal */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Acción</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEvento.tipoAccion}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Sección</span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-semibold border ${getSeccionBadge(
                      selectedEvento.seccion
                    )}`}
                  >
                    {selectedEvento.seccion}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Usuario</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-slate-800">{selectedEvento.usuarioNombre}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRolBadge(
                        selectedEvento.usuarioRol
                      )}`}
                    >
                      {selectedEvento.usuarioRol}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Fecha y hora</span>
                  <span className="text-slate-800 font-mono font-medium">{selectedEvento.fechaHora}</span>
                </div>

                {selectedEvento.registroFolio && (
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Registro relacionado
                    </span>
                    <span className="font-mono font-bold text-[#0032A0] text-xs">
                      {selectedEvento.registroFolio}
                    </span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Descripción del evento
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs leading-relaxed">
                  {selectedEvento.descripcion}
                </div>
              </div>

              {/* Valores principales anteriores y nuevos (si existen) */}
              {selectedEvento.detalles && selectedEvento.detalles.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Cambios registrados
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedEvento.detalles.map((d, idx) => (
                      <div key={idx} className="p-2.5 bg-white flex flex-col gap-1 text-[11px]">
                        <span className="font-semibold text-slate-700">{d.etiqueta}:</span>
                        <div className="flex items-center gap-2 text-slate-600">
                          {d.anterior !== undefined && (
                            <span className="line-through text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              {d.anterior || '(vacío)'}
                            </span>
                          )}
                          {d.anterior !== undefined && d.nuevo !== undefined && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          {d.nuevo !== undefined && (
                            <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {d.nuevo || '(vacío)'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota de integridad */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Registro de auditoría inmutable. No permite edición ni borrado para garantizar la trazabilidad.
                </span>
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={eventoModalDismiss.handleClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
