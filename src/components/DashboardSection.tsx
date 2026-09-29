import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Wrench,
  FileText,
  AlertTriangle,
  Clock,
  Car,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Users,
} from 'lucide-react';
import {
  SectionId,
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Refaccion,
  Seguimiento,
  SesionUsuario,
} from '../types';

interface DashboardSectionProps {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  refacciones: Refaccion[];
  seguimientos?: Seguimiento[];
  onNavigate: (section: SectionId) => void;
  currentUser?: SesionUsuario;
}

interface PendienteItem {
  id: string;
  tipo: 'orden' | 'seguimiento' | 'refaccion';
  titulo: string;
  subtitulo: string;
  etiquetaUrgencia: string;
  scoreUrgencia: number;
  seccion: SectionId;
  textoBoton: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  clientes,
  vehiculos,
  citas,
  cotizaciones,
  ordenes,
  refacciones,
  seguimientos = [],
  onNavigate,
  currentUser,
}) => {
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);

  // Maps for lookups
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

  // Current local date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 1. Citas programadas para hoy (excluye canceladas)
  const citasHoy = useMemo(() => {
    return citas
      .filter((c) => c.estado === 'Programada' && c.fecha === todayStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [citas, todayStr]);

  // 2. Órdenes actualmente en proceso
  const ordenesEnProceso = useMemo(() => {
    return ordenes.filter((o) => o.estado === 'En proceso');
  }, [ordenes]);

  // 3. Cotizaciones pendientes de autorización
  const cotizacionesPendientes = useMemo(() => {
    return cotizaciones.filter((c) => c.estado === 'Por autorizar');
  }, [cotizaciones]);

  // 4. Refacciones con stock bajo (existencias < minimo)
  const refaccionesStockBajo = useMemo(() => {
    return refacciones.filter((r) => r.existencias < r.minimo);
  }, [refacciones]);

  // Pendientes importantes (máximo 5)
  const pendientes = useMemo(() => {
    const items: PendienteItem[] = [];

    // a) Órdenes cuya fecha prometida de entrega ya venció (no terminadas ni entregadas)
    ordenes.forEach((o) => {
      if (o.estado === 'Terminado' || o.entregado) return;
      const fechaPrometida = (o as any).fechaPrometidaEntrega || (o as any).fechaPrometida;
      if (fechaPrometida && typeof fechaPrometida === 'string' && fechaPrometida < todayStr) {
        const veh = vehiculoMap.get(o.vehiculoId);
        const cli = clienteMap.get(o.clienteId);
        const descVeh = veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : '';
        items.push({
          id: `ord-vencida-${o.id}`,
          tipo: 'orden',
          titulo: `Orden ${o.folio}: Entrega vencida`,
          subtitulo: `${cli?.nombre ? cli.nombre + ' · ' : ''}${descVeh ? descVeh + ' · ' : ''}${o.servicio}`,
          etiquetaUrgencia: `Venció el ${fechaPrometida}`,
          scoreUrgencia: 1000,
          seccion: 'ordenes',
          textoBoton: 'Ver orden',
        });
      }
    });

    // b) Seguimientos pendientes cuya fecha ya pasó
    if (Array.isArray(seguimientos)) {
      seguimientos.forEach((s) => {
        if (s.fecha && s.fecha < todayStr && s.estado === 'Pendiente') {
          const cli = clienteMap.get(s.clienteId);
          items.push({
            id: `seg-vencido-${s.id}`,
            tipo: 'seguimiento',
            titulo: `Seguimiento vencido: ${cli?.nombre || 'Cliente'}`,
            subtitulo: `${s.motivoLabel}${s.registroRef ? ` (${s.registroRef})` : ''}`,
            etiquetaUrgencia: `Venció el ${s.fecha}`,
            scoreUrgencia: 850,
            seccion: 'atencion-asistida',
            textoBoton: 'Ver seguimiento',
          });
        }
      });
    }

    // Órdenes con seguimientos (soporte retrocompatible si existieran en el objeto orden)
    ordenes.forEach((o) => {
      const segs = (o as any).seguimientos;
      if (Array.isArray(segs)) {
        segs.forEach((s: any) => {
          if (s.fecha && s.fecha < todayStr && !s.realizado && !s.cancelado) {
            items.push({
              id: `seg-vencido-${s.id || Math.random()}`,
              tipo: 'seguimiento',
              titulo: `Seguimiento pendiente: Orden ${o.folio}`,
              subtitulo: s.motivo || s.descripcion || 'Seguimiento con cliente',
              etiquetaUrgencia: `Fecha límite: ${s.fecha}`,
              scoreUrgencia: 800,
              seccion: 'ordenes',
              textoBoton: 'Ver seguimiento',
            });
          }
        });
      }
    });

    // c) Refacciones con existencias inferiores al mínimo
    refaccionesStockBajo.forEach((r) => {
      const deficit = r.minimo - r.existencias;
      items.push({
        id: `ref-baja-${r.id}`,
        tipo: 'refaccion',
        titulo: `Stock crítico: ${r.nombre}`,
        subtitulo: `Código: ${r.codigo} · Existencias actuales: ${r.existencias} pieza${r.existencias === 1 ? '' : 's'}`,
        etiquetaUrgencia: `Mínimo: ${r.minimo} (Faltan ${deficit})`,
        scoreUrgencia: 500 + deficit * 10,
        seccion: 'inventario',
        textoBoton: 'Ver inventario',
      });
    });

    // Ordenar del más urgente al menos urgente
    items.sort((a, b) => b.scoreUrgencia - a.scoreUrgencia);

    // Retornar máximo 5
    return items.slice(0, 5);
  }, [ordenes, refaccionesStockBajo, todayStr, vehiculoMap, clienteMap]);

  // Dashboard simplificado para rol Mecánico (ETAPA 20)
  if (currentUser?.rol === 'Mecánico') {
    const misOrdenes = ordenes.filter(
      (o) =>
        o.mecanicoId === currentUser.usuarioId ||
        o.mecanicoId === currentUser.empleadoId ||
        o.mecanicoNombre === currentUser.nombre
    );
    const pendientes = misOrdenes.filter(
      (o) => o.estado === 'Pendiente' || o.estado === 'Por autorizar'
    );
    const enProceso = misOrdenes.filter((o) => o.estado === 'En proceso');
    const terminadas = misOrdenes.filter((o) => o.estado === 'Terminado');

    const misVehiculoIds = new Set(misOrdenes.map((o) => o.vehiculoId));
    const misVehiculos = vehiculos.filter((v) => misVehiculoIds.has(v.id));

    return (
      <section className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Dashboard de Mecánico
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {currentUser.nombre}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Panel simplificado: consulta tus órdenes asignadas y vehículos relacionados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('ordenes')}
              className="px-4 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver mis órdenes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for Mechanic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('ordenes')}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Pendientes asignadas</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{pendientes.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Órdenes esperando inicio técnico</p>
          </div>

          <div
            onClick={() => onNavigate('ordenes')}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>En proceso</span>
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{enProceso.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Trabajos activos en bahía</p>
          </div>

          <div
            onClick={() => onNavigate('ordenes')}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Trabajos terminados</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{terminadas.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Listos para entrega</p>
          </div>
        </div>

        {/* Assigned Orders List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#0d5c58]" />
              <h3 className="font-bold text-slate-900 text-sm">Mis órdenes de trabajo asignadas</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-[#0d5c58]">
                {misOrdenes.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ordenes')}
              className="text-xs font-semibold text-[#0d5c58] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gestionar en Órdenes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5">
            {misOrdenes.length > 0 ? (
              <div className="divide-y divide-slate-100 space-y-3">
                {misOrdenes.map((ord) => {
                  const cli = clienteMap.get(ord.clienteId);
                  const veh = vehiculoMap.get(ord.vehiculoId);
                  return (
                    <div
                      key={ord.id}
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0d5c58] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                            {ord.folio}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              ord.estado === 'Terminado'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ord.estado === 'En proceso'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {ord.estado}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{ord.servicio}</p>
                        <div className="text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                          <span>Cliente: {cli?.nombre || 'Desconocido'}</span>
                          <span>
                            Vehículo: {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'No vinculado'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('ordenes')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#0d5c58] hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Abrir orden</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No tienes órdenes asignadas actualmente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-[#0d5c58]" />
            <div>
              <span className="font-bold text-slate-800">
                Vehículos vinculados a tus órdenes ({misVehiculos.length})
              </span>
              <p className="text-slate-500 text-[11px]">
                Consulta los vehículos correspondientes a tus trabajos asignados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('vehiculos')}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
          >
            Consultar vehículos
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Resumen del taller
        </h2>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Estado general y actividades del día en el taller mecánico.
        </p>
      </div>

      {/* 4 Indicadores Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Citas programadas para hoy */}
        <button
          type="button"
          onClick={() => onNavigate('citas')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-[#0d5c58]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Citas hoy
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#0d5c58] group-hover:bg-[#0d5c58] group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">
              {citasHoy.length}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Programadas para hoy</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 2. Órdenes actualmente en proceso */}
        <button
          type="button"
          onClick={() => onNavigate('ordenes')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-[#0d5c58]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En proceso
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#0d5c58] group-hover:bg-[#0d5c58] group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">
              {ordenesEnProceso.length}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Órdenes activas en taller</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 3. Cotizaciones pendientes de autorización */}
        <button
          type="button"
          onClick={() => onNavigate('cotizaciones')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-[#0d5c58]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cotizaciones
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#0d5c58] group-hover:bg-[#0d5c58] group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">
              {cotizacionesPendientes.length}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Pendientes de autorizar</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 4. Refacciones con stock bajo */}
        <button
          type="button"
          onClick={() => onNavigate('inventario')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-[#0d5c58]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock bajo
            </span>
            <div
              className={`p-2 rounded-lg transition-colors ${
                refaccionesStockBajo.length > 0
                  ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                  : 'bg-teal-50 text-[#0d5c58] group-hover:bg-[#0d5c58] group-hover:text-white'
              }`}
            >
              {refaccionesStockBajo.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Package className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-3xl font-bold ${
                refaccionesStockBajo.length > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {refaccionesStockBajo.length}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Bajo el stock mínimo</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>
      </div>

      {/* Dos apartados compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. ATENCIÓN DE HOY */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0d5c58]" />
              <h3 className="font-bold text-slate-900 text-sm">Atención de hoy</h3>
              {citasHoy.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-[#0d5c58]">
                  {citasHoy.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('citas')}
              className="text-xs font-semibold text-[#0d5c58] hover:text-[#0a4845] hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 flex-1">
            {citasHoy.length > 0 ? (
              <div className="space-y-2.5">
                {citasHoy.slice(0, 5).map((cita) => {
                  const cliente = clienteMap.get(cita.clienteId);
                  const vehiculo = vehiculoMap.get(cita.vehiculoId);
                  return (
                    <div
                      key={cita.id}
                      className="p-3 bg-slate-50/60 hover:bg-slate-100/70 border border-slate-200/80 rounded-lg transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="shrink-0 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-[#0d5c58]" />
                          <span>{cita.hora}</span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-slate-900 truncate">
                            {cliente?.nombre || 'Cliente sin registrar'}
                          </div>
                          <div className="text-slate-600 flex items-center gap-1 truncate text-[11px]">
                            <Car className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {vehiculo
                                ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`
                                : 'Vehículo no identificado'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate">
                            {cita.servicio}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4">
                <div className="w-9 h-9 rounded-full bg-teal-50 text-[#0d5c58] flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Agenda del día despejada
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No hay citas agendadas para el día de hoy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. PENDIENTES IMPORTANTES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Pendientes importantes</h3>
              {pendientes.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendientes.length}
                </span>
              )}
            </div>
            {pendientes.length > 0 && (
              <span className="text-xs text-slate-400">
                Máx. 5 prioritarios
              </span>
            )}
          </div>

          <div className="p-4 flex-1">
            {pendientes.length > 0 ? (
              <div className="space-y-2.5">
                {pendientes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-amber-50/40 hover:bg-amber-50/70 border border-amber-200/80 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {item.titulo}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          {item.etiquetaUrgencia}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate text-[11px]">
                        {item.subtitulo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate(item.seccion)}
                      className="shrink-0 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md font-medium text-xs shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>{item.textoBoton}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Todo al día
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No hay órdenes vencidas ni alertas urgentes de inventario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apartado desplegable: "Ver más información" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMoreInfoOpen(!isMoreInfoOpen)}
          className="w-full px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-700">
            <Layers className="w-4 h-4 text-[#0d5c58]" />
            <span className="font-semibold text-sm">Ver más información</span>
            <span className="text-xs text-slate-400 font-normal">
              (Totales generales y catálogos)
            </span>
          </div>
          {isMoreInfoOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isMoreInfoOpen && (
          <div className="p-5 border-t border-slate-200 bg-white animate-in fade-in duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div
                onClick={() => onNavigate('clientes')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Clientes</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {clientes.length}
                </span>
                <span className="text-[11px] text-slate-400">Registrados</span>
              </div>

              <div
                onClick={() => onNavigate('vehiculos')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Car className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Vehículos</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {vehiculos.length}
                </span>
                <span className="text-[11px] text-slate-400">En padrón</span>
              </div>

              <div
                onClick={() => onNavigate('citas')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Citas totales</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {citas.length}
                </span>
                <span className="text-[11px] text-slate-400">Históricas</span>
              </div>

              <div
                onClick={() => onNavigate('ordenes')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Wrench className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Órdenes de trabajo</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {ordenes.length}
                </span>
                <span className="text-[11px] text-slate-400">Folios emitidos</span>
              </div>

              <div
                onClick={() => onNavigate('cotizaciones')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <FileText className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Cotizaciones</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {cotizaciones.length}
                </span>
                <span className="text-[11px] text-slate-400">Presupuestos</span>
              </div>

              <div
                onClick={() => onNavigate('inventario')}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Package className="w-3.5 h-3.5 text-[#0d5c58]" />
                  <span>Refacciones</span>
                </div>
                <span className="text-lg font-bold text-slate-900 block">
                  {refacciones.length}
                </span>
                <span className="text-[11px] text-slate-400">En catálogo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
