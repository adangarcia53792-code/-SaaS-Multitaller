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
  LayoutDashboard,
  Plus,
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
        {/* Encabezado de sección IOT Technologies */}
        <div className="bg-white rounded-xl border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                  Dashboard de Mecánico
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#1D7EAE] border border-[#98DAE9]/50">
                  {currentUser.nombre}
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#5F6368] mt-0.5">
                Panel simplificado: consulta tus órdenes asignadas y vehículos relacionados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative z-10">
            <button
              type="button"
              onClick={() => onNavigate('ordenes')}
              className="px-4 py-2.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
            >
              <span>Ver mis órdenes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for Mechanic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('ordenes')}
            className="p-5 bg-white rounded-xl border border-[#DDE4E8] shadow-xs hover:border-[#1D7EAE] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-2 uppercase tracking-wider">
              <span>Pendientes asignadas</span>
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#231F20]">{pendientes.length}</div>
              <p className="text-xs text-[#5F6368] mt-1">Órdenes esperando inicio técnico</p>
              <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('ordenes')}
            className="p-5 bg-white rounded-xl border border-[#DDE4E8] shadow-xs hover:border-[#1D7EAE] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-2 uppercase tracking-wider">
              <span>En proceso</span>
              <div className="w-9 h-9 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-[#1D7EAE]" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#231F20]">{enProceso.length}</div>
              <p className="text-xs text-[#5F6368] mt-1">Trabajos activos en bahía</p>
              <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('ordenes')}
            className="p-5 bg-white rounded-xl border border-[#DDE4E8] shadow-xs hover:border-[#1D7EAE] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F6368] mb-2 uppercase tracking-wider">
              <span>Trabajos terminados</span>
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#231F20]">{terminadas.length}</div>
              <p className="text-xs text-[#5F6368] mt-1">Listos para entrega</p>
              <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            </div>
          </div>
        </div>

        {/* Assigned Orders List */}
        <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DDE4E8] flex items-center justify-between bg-[#F6F8FA]">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#1D7EAE]" />
              <h3 className="font-bold text-[#231F20] text-sm">Mis órdenes de trabajo asignadas</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-[#1D7EAE] border border-[#98DAE9]/50">
                {misOrdenes.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ordenes')}
              className="text-xs font-semibold text-[#1D7EAE] hover:text-[#0032A0] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gestionar en Órdenes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5">
            {misOrdenes.length > 0 ? (
              <div className="divide-y divide-[#DDE4E8] space-y-3">
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
                          <span className="font-mono font-bold text-[#231F20] bg-slate-100 px-2 py-0.5 rounded border border-[#DDE4E8]">
                            {ord.folio}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              ord.estado === 'Terminado'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ord.estado === 'En proceso'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ord.estado}
                          </span>
                        </div>
                        <p className="font-semibold text-[#231F20] text-sm">{ord.servicio}</p>
                        <div className="text-[#5F6368] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                          <span>Cliente: {cli?.nombre || 'Desconocido'}</span>
                          <span>
                            Vehículo: {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'No vinculado'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('ordenes')}
                        className="px-3.5 py-2 min-h-[38px] bg-white border border-[#DDE4E8] hover:bg-slate-50 text-[#231F20] rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Abrir orden</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
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
        <div className="p-4 bg-white border border-[#DDE4E8] rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 flex items-center justify-center text-[#1D7EAE] shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#231F20]">
                Vehículos vinculados a tus órdenes ({misVehiculos.length})
              </span>
              <p className="text-[#5F6368] text-[11px]">
                Consulta los vehículos correspondientes a tus trabajos asignados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('vehiculos')}
            className="px-3.5 py-2 min-h-[38px] bg-white border border-[#DDE4E8] hover:bg-slate-50 text-[#231F20] rounded-lg font-semibold transition-colors shrink-0 cursor-pointer"
          >
            Consultar vehículos
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Dashboard */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 iot-dots-pattern pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center font-bold shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Dashboard
            </h2>
            <p className="text-xs md:text-sm text-[#5F6368] mt-0.5">
              Estado general y actividades del día en el taller mecánico.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('nueva-atencion')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D7EAE]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva atención</span>
          </button>
        </div>
      </div>

      {/* 4 Indicadores Principales Oficiales IOT Technologies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Citas programadas para hoy */}
        <button
          type="button"
          onClick={() => onNavigate('citas')}
          className="bg-white rounded-xl p-5 border border-[#DDE4E8] shadow-xs hover:shadow-sm hover:border-[#1D7EAE] transition-all text-left group cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
              Citas hoy
            </span>
            <div className="w-10 h-10 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center group-hover:bg-[#1D7EAE] group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#231F20]">
              {citasHoy.length}
            </span>
            <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            <p className="text-xs text-[#5F6368] mt-2 flex items-center gap-1">
              <span>Programadas para hoy</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 2. Órdenes actualmente en proceso */}
        <button
          type="button"
          onClick={() => onNavigate('ordenes')}
          className="bg-white rounded-xl p-5 border border-[#DDE4E8] shadow-xs hover:shadow-sm hover:border-[#1D7EAE] transition-all text-left group cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
              En proceso
            </span>
            <div className="w-10 h-10 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center group-hover:bg-[#1D7EAE] group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#231F20]">
              {ordenesEnProceso.length}
            </span>
            <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            <p className="text-xs text-[#5F6368] mt-2 flex items-center gap-1">
              <span>Órdenes activas en taller</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 3. Cotizaciones pendientes de autorización */}
        <button
          type="button"
          onClick={() => onNavigate('cotizaciones')}
          className="bg-white rounded-xl p-5 border border-[#DDE4E8] shadow-xs hover:shadow-sm hover:border-[#1D7EAE] transition-all text-left group cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
              Cotizaciones
            </span>
            <div className="w-10 h-10 rounded-full bg-[#98DAE9]/25 border border-[#98DAE9]/50 text-[#1D7EAE] flex items-center justify-center group-hover:bg-[#1D7EAE] group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#231F20]">
              {cotizacionesPendientes.length}
            </span>
            <div className="h-1 w-8 bg-[#1D7EAE] rounded-full mt-2" />
            <p className="text-xs text-[#5F6368] mt-2 flex items-center gap-1">
              <span>Pendientes de autorizar</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>

        {/* 4. Refacciones con stock bajo - Naranja institucional #FF661B solo en alertas */}
        <button
          type="button"
          onClick={() => onNavigate('inventario')}
          className={`bg-white rounded-xl p-5 border shadow-xs hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between ${
            refaccionesStockBajo.length > 0
              ? 'border-orange-200 hover:border-[#FF661B]'
              : 'border-[#DDE4E8] hover:border-[#1D7EAE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
              Stock bajo
            </span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
                refaccionesStockBajo.length > 0
                  ? 'bg-orange-50 text-[#FF661B] border-orange-200 group-hover:bg-[#FF661B] group-hover:text-white'
                  : 'bg-[#98DAE9]/25 text-[#1D7EAE] border-[#98DAE9]/50 group-hover:bg-[#1D7EAE] group-hover:text-white'
              }`}
            >
              {refaccionesStockBajo.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-3xl font-bold ${
                refaccionesStockBajo.length > 0 ? 'text-[#FF661B]' : 'text-[#231F20]'
              }`}
            >
              {refaccionesStockBajo.length}
            </span>
            <div
              className={`h-1 w-8 rounded-full mt-2 ${
                refaccionesStockBajo.length > 0 ? 'bg-[#FF661B]' : 'bg-[#1D7EAE]'
              }`}
            />
            <p className="text-xs text-[#5F6368] mt-2 flex items-center gap-1">
              <span>Bajo el stock mínimo</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </button>
      </div>

      {/* Dos apartados compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. ATENCIÓN DE HOY */}
        <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F6F8FA] border-b border-[#DDE4E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1D7EAE]" />
              <h3 className="font-bold text-[#231F20] text-sm">Atención de hoy</h3>
              {citasHoy.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-[#1D7EAE] border border-[#98DAE9]/50">
                  {citasHoy.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('citas')}
              className="text-xs font-semibold text-[#1D7EAE] hover:text-[#0032A0] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
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
                      className="p-3 bg-[#F6F8FA] hover:bg-slate-100 border border-[#DDE4E8] rounded-lg transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="shrink-0 px-2 py-1 bg-white border border-[#DDE4E8] rounded font-mono font-bold text-[#231F20] text-[11px] flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-[#1D7EAE]" />
                          <span>{cita.hora}</span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-[#231F20] truncate">
                            {cliente?.nombre || 'Cliente sin registrar'}
                          </div>
                          <div className="text-[#5F6368] flex items-center gap-1 truncate text-[11px]">
                            <Car className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {vehiculo
                                ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`
                                : 'Vehículo no identificado'}
                            </span>
                          </div>
                          <div className="text-[#5F6368] text-[11px] truncate">
                            {cita.servicio}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 relative">
                <div className="absolute inset-0 iot-dots-pattern rounded-lg pointer-events-none" />
                <div className="w-9 h-9 rounded-full bg-sky-50 text-[#1D7EAE] flex items-center justify-center mb-2 relative z-10">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#231F20] relative z-10">
                  Agenda del día despejada
                </p>
                <p className="text-xs text-[#5F6368] mt-0.5 relative z-10">
                  No hay citas agendadas para el día de hoy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. PENDIENTES IMPORTANTES */}
        <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F6F8FA] border-b border-[#DDE4E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF661B]" />
              <h3 className="font-bold text-[#231F20] text-sm">Pendientes importantes</h3>
              {pendientes.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF661B] border border-orange-200">
                  {pendientes.length}
                </span>
              )}
            </div>
            {pendientes.length > 0 && (
              <span className="text-xs text-[#5F6368]">
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
                    className="p-3 bg-orange-50/40 hover:bg-orange-50/70 border border-orange-200/80 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#231F20] truncate">
                          {item.titulo}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#FF661B] border border-orange-200 shrink-0">
                          {item.etiquetaUrgencia}
                        </span>
                      </div>
                      <p className="text-[#5F6368] truncate text-[11px]">
                        {item.subtitulo}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate(item.seccion)}
                      className="shrink-0 px-3 py-1.5 min-h-[36px] bg-white hover:bg-slate-50 text-[#231F20] border border-[#DDE4E8] rounded-lg font-medium text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer hover:border-[#1D7EAE]"
                    >
                      <span>{item.textoBoton}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 relative">
                <div className="absolute inset-0 iot-dots-pattern rounded-lg pointer-events-none" />
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 relative z-10">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#231F20] relative z-10">
                  Todo al día
                </p>
                <p className="text-xs text-[#5F6368] mt-0.5 relative z-10">
                  No hay órdenes vencidas ni alertas urgentes de inventario.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apartado desplegable: "Ver más información" */}
      <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMoreInfoOpen(!isMoreInfoOpen)}
          className="w-full px-5 py-3.5 bg-[#F6F8FA] hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[#231F20]">
            <Layers className="w-4 h-4 text-[#1D7EAE]" />
            <span className="font-semibold text-sm">Ver más información</span>
            <span className="text-xs text-[#5F6368] font-normal">
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
          <div className="p-5 border-t border-[#DDE4E8] bg-white animate-in fade-in duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div
                onClick={() => onNavigate('clientes')}
                className="p-3.5 bg-[#F6F8FA] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <Users className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Clientes</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {clientes.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">Registrados</span>
              </div>

              <div
                onClick={() => onNavigate('vehiculos')}
                className="p-3.5 bg-[#F6F7F9] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <Car className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Vehículos</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {vehiculos.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">En padrón</span>
              </div>

              <div
                onClick={() => onNavigate('citas')}
                className="p-3.5 bg-[#F6F7F9] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Citas totales</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {citas.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">Históricas</span>
              </div>

              <div
                onClick={() => onNavigate('ordenes')}
                className="p-3.5 bg-[#F6F7F9] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <Wrench className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Órdenes de trabajo</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {ordenes.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">Folios emitidos</span>
              </div>

              <div
                onClick={() => onNavigate('cotizaciones')}
                className="p-3.5 bg-[#F6F7F9] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <FileText className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Cotizaciones</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {cotizaciones.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">Presupuestos</span>
              </div>

              <div
                onClick={() => onNavigate('inventario')}
                className="p-3.5 bg-[#F6F7F9] hover:bg-slate-100 rounded-lg border border-[#DDE4E8] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-[#5F6368] mb-1">
                  <Package className="w-3.5 h-3.5 text-[#1D7EAE]" />
                  <span>Refacciones</span>
                </div>
                <span className="text-lg font-bold text-[#231F20] block">
                  {refacciones.length}
                </span>
                <span className="text-[11px] text-[#5F6368]">En catálogo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
