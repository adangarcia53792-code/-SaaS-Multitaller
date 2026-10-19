import React, { useMemo } from 'react';
import {
  Calendar,
  Wrench,
  FileText,
  AlertTriangle,
  Clock,
  Car,
  ArrowRight,
  CheckCircle2,
  Package,
  LayoutDashboard,
  Plus,
  Sparkles,
  User,
  AlertCircle,
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
  onOpenCopiloto?: () => void;
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
  onOpenCopiloto,
}) => {
  // Mapas para búsquedas rápidas
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

  // Fecha actual local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 1. TRABAJO DE HOY
  // a) Citas del día
  const citasHoy = useMemo(() => {
    return citas
      .filter((c) => c.estado === 'Programada' && c.fecha === todayStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [citas, todayStr]);

  // b) Órdenes activas en proceso hoy
  const ordenesHoy = useMemo(() => {
    return ordenes.filter((o) => o.estado === 'En proceso');
  }, [ordenes]);

  // 2. VEHÍCULOS PRÓXIMOS A ENTREGAR
  const proximasEntregas = useMemo(() => {
    return ordenes
      .filter((o) => {
        if (o.entregado) return false;
        // Órdenes terminadas pendientes de entrega o en proceso con fecha próxima
        const fechaEntrega = (o as any).fechaEntregaPrometida || (o as any).fechaPrometidaEntrega || (o as any).fechaPrometida;
        if (!fechaEntrega) return o.estado === 'Terminado';
        return fechaEntrega >= todayStr || o.estado === 'Terminado';
      })
      .sort((a, b) => {
        // Primero terminadas, luego por fecha
        if (a.estado === 'Terminado' && b.estado !== 'Terminado') return -1;
        if (b.estado === 'Terminado' && a.estado !== 'Terminado') return 1;
        const fa = (a as any).fechaEntregaPrometida || (a as any).fechaPrometidaEntrega || '';
        const fb = (b as any).fechaEntregaPrometida || (b as any).fechaPrometidaEntrega || '';
        return fa.localeCompare(fb);
      })
      .slice(0, 5);
  }, [ordenes, todayStr]);

  // 3. COTIZACIONES PENDIENTES
  const cotizacionesPendientes = useMemo(() => {
    return cotizaciones
      .filter((c) => c.estado === 'Por autorizar')
      .slice(0, 5);
  }, [cotizaciones]);

  // 4. ALERTAS IMPORTANTES (Únicamente críticas)
  const alertasImportantes = useMemo(() => {
    const list: {
      id: string;
      tipo: 'stock' | 'orden_vencida' | 'seguimiento';
      titulo: string;
      detalle: string;
      seccion: SectionId;
      accion: string;
      urgente: boolean;
    }[] = [];

    // Refacciones bajo el stock mínimo
    const bajoStock = refacciones.filter((r) => r.existencias < r.minimo);
    if (bajoStock.length > 0) {
      list.push({
        id: 'alerta-stock',
        tipo: 'stock',
        titulo: `${bajoStock.length} refacción(es) con existencias críticas`,
        detalle: `Piezas bajo el mínimo requerido: ${bajoStock.slice(0, 2).map((r) => r.nombre).join(', ')}${bajoStock.length > 2 ? ' y más' : ''}.`,
        seccion: 'inventario',
        accion: 'Ver inventario',
        urgente: true,
      });
    }

    // Órdenes cuya fecha de entrega venció
    const ordenesVencidas = ordenes.filter((o) => {
      if (o.estado === 'Terminado' || o.entregado) return false;
      const f = (o as any).fechaEntregaPrometida || (o as any).fechaPrometidaEntrega || (o as any).fechaPrometida;
      return f && typeof f === 'string' && f < todayStr;
    });

    if (ordenesVencidas.length > 0) {
      list.push({
        id: 'alerta-ordenes-vencidas',
        tipo: 'orden_vencida',
        titulo: `${ordenesVencidas.length} orden(es) con fecha de entrega vencida`,
        detalle: `Retrasos detectados en taller: ${ordenesVencidas.map((o) => o.folio).join(', ')}.`,
        seccion: 'ordenes',
        accion: 'Revisar órdenes',
        urgente: true,
      });
    }

    // Seguimientos vencidos
    const segVencidos = seguimientos.filter((s) => s.fecha && s.fecha < todayStr && s.estado === 'Pendiente');
    if (segVencidos.length > 0) {
      list.push({
        id: 'alerta-seguimientos',
        tipo: 'seguimiento',
        titulo: `${segVencidos.length} seguimiento(s) de clientes pendientes`,
        detalle: 'Atención pos-servicio o cotizaciones sin respuesta que requieren contacto.',
        seccion: 'atencion-asistida',
        accion: 'Ver seguimientos',
        urgente: false,
      });
    }

    return list;
  }, [refacciones, ordenes, seguimientos, todayStr]);

  return (
    <section className="space-y-6">
      {/* ENCABEZADO SIMPLIFICADO CON 3 BOTONES PRINCIPALES */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5 text-[#1497F2]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading text-[#06345A] tracking-tight">
              Dashboard
            </h2>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              Trabajo del día y prioridades operativas de TUNNO.
            </p>
          </div>
        </div>

        {/* 3 BOTONES PRINCIPALES: NUEVA ATENCIÓN, NUEVA CITA Y NUEVA COTIZACIÓN */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">

          {/* Botón 1: Nueva atención */}
          <button
            type="button"
            onClick={() => onNavigate('nueva-atencion')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-xs md:text-sm font-semibold font-heading shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]/30"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva atención</span>
          </button>

          {/* Botón 2: Nueva cita */}
          <button
            type="button"
            onClick={() => onNavigate('citas')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-white hover:bg-slate-50 text-[#06345A] border border-[#E5E7EB] hover:border-[#1497F2] text-xs md:text-sm font-semibold font-heading shadow-xs transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#1497F2]" />
            <span>Nueva cita</span>
          </button>

          {/* Botón 3: Nueva cotización */}
          <button
            type="button"
            onClick={() => onNavigate('cotizaciones')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-white hover:bg-slate-50 text-[#06345A] border border-[#E5E7EB] hover:border-[#1497F2] text-xs md:text-sm font-semibold font-heading shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#1497F2]" />
            <span>Nueva cotización</span>
          </button>
        </div>
      </div>

      {/* BLOQUES OPERATIVOS PRINCIPALES (ÚNICAMENTE 4 SECCIONES) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ================================================================= */}
        {/* 1. TRABAJO DE HOY                                                 */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1497F2]" />
              <h3 className="font-heading font-bold text-[#06345A] text-sm">
                1. Trabajo de hoy
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40">
                {citasHoy.length} citas · {ordenesHoy.length} en rampa
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('citas')}
              className="text-xs font-semibold text-[#1497F2] hover:text-[#06345A] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver agenda</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {citasHoy.length === 0 && ordenesHoy.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-heading font-semibold text-xs text-[#06345A]">
                  Sin citas ni trabajos pendientes para hoy
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Usa "Nueva atención" o "Nueva cita" para agendar un ingreso.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Citas de hoy */}
                {citasHoy.slice(0, 3).map((cita) => {
                  const cliente = clienteMap.get(cita.clienteId);
                  const vehiculo = vehiculoMap.get(cita.vehiculoId);
                  return (
                    <div
                      key={cita.id}
                      className="p-3 bg-[#F9FAFB] hover:bg-sky-50/50 border border-[#E5E7EB] hover:border-[#73C7FF]/60 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 px-2 py-1 bg-white border border-[#E5E7EB] rounded font-mono font-bold text-[#06345A] text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#1497F2]" />
                          {cita.hora}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#06345A] truncate">
                            {cliente?.nombre || 'Cliente sin registrar'}
                          </p>
                          <p className="text-[11px] text-[#6B7280] truncate flex items-center gap-1 mt-0.5">
                            <Car className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {vehiculo
                                ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`
                                : 'Vehículo'} · {cita.servicio}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        Programada
                      </span>
                    </div>
                  );
                })}

                {/* Órdenes en proceso activas */}
                {ordenesHoy.slice(0, 3).map((ord) => {
                  const cliente = clienteMap.get(ord.clienteId);
                  const vehiculo = vehiculoMap.get(ord.vehiculoId);
                  return (
                    <div
                      key={ord.id}
                      className="p-3 bg-white hover:bg-sky-50/40 border border-[#E5E7EB] rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 px-2 py-1 bg-sky-50 text-[#06345A] border border-[#73C7FF]/40 rounded font-mono font-bold text-[11px]">
                          {ord.folio}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#06345A] truncate">
                            {ord.servicio}
                          </p>
                          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                            {cliente?.nombre || 'Cliente'} · {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : ''}
                            {ord.mecanicoNombre ? ` · Mec: ${ord.mecanicoNombre}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('ordenes')}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-[#1497F2] hover:bg-sky-50 rounded border border-[#73C7FF]/50 transition-colors cursor-pointer"
                      >
                        Ver orden
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. VEHÍCULOS PRÓXIMOS A ENTREGAR                                  */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#1497F2]" />
              <h3 className="font-heading font-bold text-[#06345A] text-sm">
                2. Vehículos próximos a entregar
              </h3>
              {proximasEntregas.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {proximasEntregas.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ordenes')}
              className="text-xs font-semibold text-[#1497F2] hover:text-[#06345A] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-2.5">
            {proximasEntregas.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-heading font-semibold text-xs text-[#06345A]">
                  Sin entregas programadas inmediatas
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Los trabajos concluidos aparecerán aquí para entrega y cobro.
                </p>
              </div>
            ) : (
              proximasEntregas.map((ord) => {
                const cliente = clienteMap.get(ord.clienteId);
                const vehiculo = vehiculoMap.get(ord.vehiculoId);
                const fechaPrometida = (ord as any).fechaEntregaPrometida || (ord as any).fechaPrometidaEntrega || 'Hoy';
                const esTerminado = ord.estado === 'Terminado';

                return (
                  <div
                    key={ord.id}
                    className="p-3 bg-[#F9FAFB] hover:bg-slate-100 border border-[#E5E7EB] rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#06345A]">
                          {ord.folio}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            esTerminado
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {ord.estado}
                        </span>
                      </div>
                      <p className="font-semibold text-[#06345A] truncate mt-0.5">
                        {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'Vehículo'} · {cliente?.nombre || 'Cliente'}
                      </p>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        Prometido: {fechaPrometida} · {ord.servicio}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('ordenes')}
                      className="shrink-0 px-3 py-1.5 min-h-[34px] bg-white hover:bg-slate-50 text-[#06345A] border border-[#E5E7EB] hover:border-[#1497F2] rounded-lg font-medium text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. COTIZACIONES PENDIENTES                                        */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1497F2]" />
              <h3 className="font-heading font-bold text-[#06345A] text-sm">
                3. Cotizaciones pendientes
              </h3>
              {cotizacionesPendientes.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {cotizacionesPendientes.length} por autorizar
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cotizaciones')}
              className="text-xs font-semibold text-[#1497F2] hover:text-[#06345A] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver cotizaciones</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-2.5">
            {cotizacionesPendientes.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-heading font-semibold text-xs text-[#06345A]">
                  No hay presupuestos pendientes de autorización
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Todas las cotizaciones se encuentran autorizadas o cerradas.
                </p>
              </div>
            ) : (
              cotizacionesPendientes.map((cot) => {
                const cliente = clienteMap.get(cot.clienteId);
                const vehiculo = vehiculoMap.get(cot.vehiculoId);
                return (
                  <div
                    key={cot.id}
                    className="p-3 bg-[#F9FAFB] hover:bg-amber-50/40 border border-[#E5E7EB] hover:border-amber-300 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#06345A]">
                          {cot.folio}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Por autorizar
                        </span>
                      </div>
                      <p className="font-semibold text-[#06345A] truncate mt-0.5">
                        {cliente?.nombre || 'Cliente'} · {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : ''}
                      </p>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {cot.descripcion}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-bold text-sm text-[#06345A]">
                        ${cot.total.toLocaleString('es-MX')} MXN
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('cotizaciones')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#1497F2] hover:bg-sky-50 rounded border border-[#73C7FF]/40 transition-colors cursor-pointer"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4. ALERTAS IMPORTANTES                                            */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-heading font-bold text-[#06345A] text-sm">
                4. Alertas importantes
              </h3>
              {alertasImportantes.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {alertasImportantes.length} críticas
                </span>
              )}
            </div>
            {alertasImportantes.length > 0 && (
              <span className="text-xs text-[#6B7280]">
                Atención requerida
              </span>
            )}
          </div>

          <div className="p-4 flex-1 space-y-2.5">
            {alertasImportantes.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="font-heading font-semibold text-xs text-[#06345A]">
                  Taller en orden sin alertas urgentes
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Inventario suficiente y órdenes dentro del plazo de entrega.
                </p>
              </div>
            ) : (
              alertasImportantes.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
                    alerta.urgente
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                      : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#06345A]">
                        {alerta.titulo}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          alerta.urgente
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alerta.urgente ? 'Urgente' : 'Importante'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] line-clamp-1">
                      {alerta.detalle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(alerta.seccion)}
                    className="shrink-0 px-3 py-1.5 min-h-[34px] bg-white text-[#06345A] border border-[#E5E7EB] hover:border-[#1497F2] rounded-lg font-medium text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{alerta.accion}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
