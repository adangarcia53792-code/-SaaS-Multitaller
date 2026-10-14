import React, { useState, useMemo } from 'react';
import {
  Vehiculo,
  Cliente,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Flotilla,
  ConfiguracionTaller,
  Garantia,
  Seguimiento,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  History,
  Search,
  Car,
  User,
  Phone,
  Printer,
  Calendar,
  FileText,
  Wrench,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Building2,
  DollarSign,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TunnoLogo } from './TunnoLogo';
import { PlanMantenimientoModal } from './PlanMantenimientoModal';

interface HistorialVehicularSectionProps {
  vehiculos: Vehiculo[];
  clientes: Cliente[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  flotillas?: Flotilla[];
  configuracion?: ConfiguracionTaller;
  garantias?: Garantia[];
  onSaveSeguimiento?: (nuevoSeg: Seguimiento) => void;
  onUpdateVehiculoRecomendaciones?: (
    vehiculoId: string,
    recomendaciones: string[],
    proximaFecha?: string,
    proximoKm?: string
  ) => void;
}

export const HistorialVehicularSection: React.FC<HistorialVehicularSectionProps> = ({
  vehiculos,
  clientes,
  citas,
  cotizaciones,
  ordenes,
  flotillas = [],
  configuracion,
  garantias = [],
  onSaveSeguimiento,
  onUpdateVehiculoRecomendaciones,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [planMantenimientoVehiculo, setPlanMantenimientoVehiculo] = useState<Vehiculo | null>(null);
  const [activeTab, setActiveTab] = useState<'cronologico' | 'ordenes' | 'cotizaciones' | 'citas'>('cronologico');

  // Fast lookups
  const clienteMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach((c) => map.set(c.id, c));
    return map;
  }, [clientes]);

  const vehiculoFlotillaMap = useMemo(() => {
    const map = new Map<string, Flotilla>();
    flotillas.forEach((f) => {
      f.vehiculoIds.forEach((vId) => map.set(vId, f));
    });
    return map;
  }, [flotillas]);

  const expedienteDismiss = useModalDismiss({
    isOpen: Boolean(selectedVehiculo),
    onClose: () => setSelectedVehiculo(null),
    closeOnBackdrop: true,
  });

  // Calculate statistics per vehicle
  const vehiculosConEstadisticas = useMemo(() => {
    return vehiculos.map((v) => {
      const cli = clienteMap.get(v.clienteId);
      const flotilla = vehiculoFlotillaMap.get(v.id);

      const vehOrdenes = ordenes.filter((o) => o.vehiculoId === v.id);
      const vehCotizaciones = cotizaciones.filter((c) => c.vehiculoId === v.id);
      const vehCitas = citas.filter((c) => c.vehiculoId === v.id);

      // Número de visitas: órdenes registradas + citas
      const visitasCount = vehOrdenes.length + vehCitas.filter((c) => c.estado === 'Programada').length;

      // Total trabajos aprobados ($)
      const cotizacionesAprobadas = vehCotizaciones.filter((c) => c.estado === 'Aprobada');
      const totalAprobado = cotizacionesAprobadas.reduce((sum, c) => sum + c.total, 0);

      // Último servicio
      let ultimoServicio = 'Sin servicios registrados';
      let fechaUltimoServicio = '';

      if (vehOrdenes.length > 0) {
        const sortedOrdenes = [...vehOrdenes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
        ultimoServicio = sortedOrdenes[0].servicio;
        fechaUltimoServicio = sortedOrdenes[0].creadoEn ? new Date(sortedOrdenes[0].creadoEn).toLocaleDateString('es-MX') : '';
      } else if (vehCitas.length > 0) {
        const sortedCitas = [...vehCitas].sort((a, b) => b.fecha.localeCompare(a.fecha));
        ultimoServicio = sortedCitas[0].servicio;
        fechaUltimoServicio = sortedCitas[0].fecha;
      }

      return {
        vehiculo: v,
        cliente: cli,
        flotilla,
        visitasCount,
        totalAprobado,
        ultimoServicio,
        fechaUltimoServicio,
        ordenesCount: vehOrdenes.length,
        cotizacionesCount: vehCotizaciones.length,
        citasCount: vehCitas.length,
      };
    });
  }, [vehiculos, ordenes, cotizaciones, citas, clienteMap, vehiculoFlotillaMap]);

  // Filtered list
  const filteredVehiculos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vehiculosConEstadisticas;

    return vehiculosConEstadisticas.filter((item) => {
      const v = item.vehiculo;
      const cli = item.cliente;
      const f = item.flotilla;

      const placaMatch = v.placas.toLowerCase().includes(q);
      const marcaMatch = v.marca.toLowerCase().includes(q);
      const modeloMatch = v.modelo.toLowerCase().includes(q);
      const clienteMatch = cli?.nombre.toLowerCase().includes(q) || cli?.telefono.includes(q);
      const flotillaMatch = f?.nombre.toLowerCase().includes(q) || f?.empresa.toLowerCase().includes(q);

      return placaMatch || marcaMatch || modeloMatch || clienteMatch || flotillaMatch;
    });
  }, [vehiculosConEstadisticas, searchQuery]);

  // Selected vehicle full file records
  const selectedRecords = useMemo(() => {
    if (!selectedVehiculo) return { ordenes: [], cotizaciones: [], citas: [], cronologico: [] };

    const vehOrdenes = ordenes
      .filter((o) => o.vehiculoId === selectedVehiculo.id)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

    const vehCotizaciones = cotizaciones
      .filter((c) => c.vehiculoId === selectedVehiculo.id)
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

    const vehCitas = citas
      .filter((c) => c.vehiculoId === selectedVehiculo.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Combine chronologically for print and timeline
    const cronologico: {
      tipo: 'orden' | 'cotizacion' | 'cita';
      fecha: string;
      folio?: string;
      titulo: string;
      detalle: string;
      monto?: number;
      estado: string;
    }[] = [];

    vehOrdenes.forEach((o) => {
      cronologico.push({
        tipo: 'orden',
        fecha: o.creadoEn ? o.creadoEn.split('T')[0] : 'N/D',
        folio: o.folio,
        titulo: `Orden de trabajo: ${o.servicio}`,
        detalle: o.diagnostico || o.observaciones || 'Servicio en taller',
        monto: o.cotizacionId ? cotizaciones.find((c) => c.id === o.cotizacionId)?.total : undefined,
        estado: o.estado,
      });
    });

    vehCotizaciones.forEach((c) => {
      cronologico.push({
        tipo: 'cotizacion',
        fecha: c.creadoEn ? c.creadoEn.split('T')[0] : 'N/D',
        folio: c.folio,
        titulo: `Cotización: ${c.descripcion}`,
        detalle: `Refacciones: $${c.importeRefacciones.toFixed(2)} | Mano de obra: $${c.importeManoObra.toFixed(2)}`,
        monto: c.total,
        estado: c.estado,
      });
    });

    vehCitas.forEach((ci) => {
      cronologico.push({
        tipo: 'cita',
        fecha: ci.fecha,
        folio: `CITA-${ci.hora}`,
        titulo: `Cita agendada: ${ci.servicio}`,
        detalle: `Hora: ${ci.hora} hrs`,
        estado: ci.estado,
      });
    });

    cronologico.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return {
      ordenes: vehOrdenes,
      cotizaciones: vehCotizaciones,
      citas: vehCitas,
      cronologico,
    };
  }, [selectedVehiculo, ordenes, cotizaciones, citas]);

  return (
    <section className="space-y-6">
      {/* Encabezado TUNNO */}
      <div className="bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1497F2]/10 border border-[#73C7FF]/40 text-[#1497F2] flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight">
                Historial vehicular
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#06345A] border border-[#73C7FF]/40">
                {vehiculos.length} {vehiculos.length === 1 ? 'vehículo' : 'vehículos'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#6B7280] mt-0.5">
              Consulta de visitas, servicios aprobados, expedientes completos e impresión para clientes.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative w-full sm:max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por placas, marca, modelo, propietario o flotilla..."
          className="w-full pl-9 pr-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#06345A] bg-white focus:outline-none focus:border-[#1497F2] focus:ring-2 focus:ring-[#1497F2]/20"
        />
      </div>

      {/* Vehicles Table / Cards */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#06345A]">
            <thead className="bg-slate-50 border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Vehículo y Placas</th>
                <th className="py-3.5 px-4">Propietario / Flotilla</th>
                <th className="py-3.5 px-4 text-center">Visitas</th>
                <th className="py-3.5 px-4">Último servicio</th>
                <th className="py-3.5 px-4 text-right">Trabajos aprobados</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehiculos.length > 0 ? (
                filteredVehiculos.map((item) => {
                  const v = item.vehiculo;
                  const cli = item.cliente;
                  const f = item.flotilla;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1497F2] flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#06345A]">
                              {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''}
                            </div>
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {v.placas}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#06345A]">{cli?.nombre || 'Sin cliente'}</div>
                        {f ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#1497F2] font-semibold mt-0.5">
                            <Truck className="w-3 h-3" />
                            <span>{f.nombre} ({f.empresa})</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#6B7280]">Particular</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {item.visitasCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="truncate font-medium text-[#06345A]" title={item.ultimoServicio}>
                          {item.ultimoServicio}
                        </div>
                        {item.fechaUltimoServicio && (
                          <div className="text-[11px] text-[#6B7280]">{item.fechaUltimoServicio}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-[#06345A]">
                          ${item.totalAprobado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">MXN acumulado</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPlanMantenimientoVehiculo(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#1497F2] font-semibold rounded-lg transition-colors cursor-pointer text-xs border border-sky-200"
                            title="Generar plan de mantenimiento con IA"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Plan IA</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedVehiculo(v)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1497F2]/10 hover:bg-[#1497F2]/20 text-[#1497F2] font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Expediente</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron vehículos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredVehiculos.length > 0 ? (
            filteredVehiculos.map((item) => {
              const v = item.vehiculo;
              const cli = item.cliente;
              const f = item.flotilla;

              return (
                <div key={v.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#06345A]">
                        {v.marca} {v.modelo} {v.año ? `(${v.año})` : ''}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {v.placas}
                        </span>
                        {f && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1497F2] bg-blue-50 px-2 py-0.5 rounded">
                            <Truck className="w-3 h-3" />
                            <span>{f.nombre}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPlanMantenimientoVehiculo(v)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-[#1497F2] border border-sky-200 font-semibold rounded-lg text-xs cursor-pointer"
                        title="Generar plan de mantenimiento con IA"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Plan IA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedVehiculo(v)}
                        className="px-3 py-1.5 bg-[#1497F2] text-white font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Expediente
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Propietario</span>
                      <span className="font-medium text-[#06345A] truncate block">{cli?.nombre || 'Sin cliente'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitas</span>
                      <span className="font-bold text-[#06345A]">{item.visitasCount} servicios</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Último servicio</span>
                      <span className="text-[#06345A] truncate block">{item.ultimoServicio}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No se encontraron vehículos registrados.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL / EXPEDIENTE IMPRIMIBLE DEL VEHÍCULO */}
      {/* ======================================================== */}
      {selectedVehiculo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
          onClick={expedienteDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[94vh] print-area"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Print button (Hidden in print) */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white text-[#06345A] no-print">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#73C7FF]/20 border border-[#73C7FF]/40 flex items-center justify-center text-[#1497F2]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Expediente Vehicular: {selectedVehiculo.marca} {selectedVehiculo.modelo} ({selectedVehiculo.placas})
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Historial cronológico de citas, cotizaciones y órdenes de trabajo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlanMantenimientoVehiculo(selectedVehiculo)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#1497F2] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Generar plan de mantenimiento con IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Plan de mantenimiento IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir expediente</span>
                </button>

                <button
                  type="button"
                  onClick={expedienteDismiss.handleClose}
                  className="text-slate-400 hover:text-slate-600 p-1.5 transition-colors cursor-pointer"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content (Both on-screen and print layout) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#374151]">
              {/* Encabezado membretado para impresión */}
              <div className="border-b border-[#E5E7EB] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TunnoLogo variant="positive" format="horizontal" size="sm" />
                    <span className="text-base font-bold font-heading text-[#06345A]">
                      {configuracion?.nombre || 'TUNNO'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">{configuracion?.direccion || 'Taller Mecánico Especializado'}</p>
                  <p className="text-xs text-[#6B7280]">Teléfono: {configuracion?.telefono || '555-432-1000'}</p>
                </div>

                <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold font-heading bg-[#1497F2] text-white mb-1">
                    EXPEDIENTE HISTÓRICO
                  </span>
                  <p className="text-xs text-[#6B7280]">Fecha de emisión: {new Date().toLocaleDateString('es-MX')}</p>
                  <p className="font-mono text-xs font-bold text-[#06345A]">PLACA: {selectedVehiculo.placas}</p>
                </div>
              </div>

              {/* Ficha técnica del vehículo y titular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehículo</span>
                  <span className="font-bold text-sm text-[#06345A]">
                    {selectedVehiculo.marca} {selectedVehiculo.modelo}
                  </span>
                  <span className="text-xs text-slate-500 block">Año: {selectedVehiculo.año || 'N/D'}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Placas</span>
                  <span className="font-mono font-bold text-sm text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {selectedVehiculo.placas}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Propietario</span>
                  <span className="font-bold text-xs text-[#06345A] block">
                    {clienteMap.get(selectedVehiculo.clienteId)?.nombre || 'Particular'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {clienteMap.get(selectedVehiculo.clienteId)?.telefono || 'Sin teléfono'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Flotilla asignada</span>
                  {vehiculoFlotillaMap.get(selectedVehiculo.id) ? (
                    <span className="font-bold text-xs text-[#1497F2] flex items-center gap-1 mt-0.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>{vehiculoFlotillaMap.get(selectedVehiculo.id)?.nombre}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Vehículo particular</span>
                  )}
                </div>
              </div>

              {/* Navigation Tabs on screen (no-print) */}
              <div className="flex border-b border-[#E5E7EB] no-print text-xs font-medium gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('cronologico')}
                  className={`px-3 py-2 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'cronologico'
                      ? 'border-[#1497F2] text-[#1497F2]'
                      : 'border-transparent text-[#6B7280] hover:text-[#06345A]'
                  }`}
                >
                  Registro cronológico ({selectedRecords.cronologico.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ordenes')}
                  className={`px-3 py-2 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'ordenes'
                      ? 'border-[#1497F2] text-[#1497F2]'
                      : 'border-transparent text-[#6B7280] hover:text-[#06345A]'
                  }`}
                >
                  Órdenes de trabajo ({selectedRecords.ordenes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cotizaciones')}
                  className={`px-3 py-2 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'cotizaciones'
                      ? 'border-[#1497F2] text-[#1497F2]'
                      : 'border-transparent text-[#6B7280] hover:text-[#06345A]'
                  }`}
                >
                  Cotizaciones ({selectedRecords.cotizaciones.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('citas')}
                  className={`px-3 py-2 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeTab === 'citas'
                      ? 'border-[#1497F2] text-[#1497F2]'
                      : 'border-transparent text-[#6B7280] hover:text-[#06345A]'
                  }`}
                >
                  Citas ({selectedRecords.citas.length})
                </button>
              </div>

              {/* Contenido cronológico o por pestañas */}
              <div className="space-y-4">
                {activeTab === 'cronologico' ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Registro Cronológico de Servicios
                    </h4>

                    {selectedRecords.cronologico.length > 0 ? (
                      <div className="border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-slate-100">
                        {selectedRecords.cronologico.map((rec, idx) => (
                          <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                    rec.tipo === 'orden'
                                      ? 'bg-blue-50 text-[#1497F2] border border-blue-200'
                                      : rec.tipo === 'cotizacion'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {rec.folio || rec.tipo.toUpperCase()}
                                </span>
                                <span className="font-bold text-xs text-[#06345A]">{rec.titulo}</span>
                              </div>
                              <p className="text-xs text-[#6B7280] pl-1">{rec.detalle}</p>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-right">
                              <span className="text-[11px] font-medium text-slate-500">{rec.fecha}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {rec.monto !== undefined && (
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    ${rec.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {rec.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg">
                        No hay servicios ni movimientos registrados para este vehículo.
                      </p>
                    )}
                  </div>
                ) : activeTab === 'ordenes' ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Órdenes de Trabajo</h4>
                    {selectedRecords.ordenes.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedRecords.ordenes.map((o) => (
                          <div key={o.id} className="p-3.5 border border-[#E5E7EB] rounded-lg bg-white space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-[#1497F2]">{o.folio}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {o.estado}
                              </span>
                            </div>
                            <div className="font-bold text-xs text-[#06345A]">{o.servicio}</div>
                            {o.diagnostico && <p className="text-xs text-[#6B7280]">Diagnóstico: {o.diagnostico}</p>}
                            <div className="text-[11px] text-slate-400 flex items-center gap-4">
                              <span>Km: {o.kilometraje || 'N/D'}</span>
                              <span>Mecánico: {o.mecanicoNombre || 'No asignado'}</span>
                              <span>Prometida: {o.fechaEntregaPrometida || 'N/D'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No hay órdenes registradas.</p>
                    )}
                  </div>
                ) : activeTab === 'cotizaciones' ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Cotizaciones</h4>
                    {selectedRecords.cotizaciones.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedRecords.cotizaciones.map((c) => (
                          <div key={c.id} className="p-3.5 border border-[#E5E7EB] rounded-lg bg-white space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-purple-700">{c.folio}</span>
                              <span className="font-mono font-bold text-xs text-[#06345A]">
                                Total: ${c.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="font-medium text-xs text-[#06345A]">{c.descripcion}</div>
                            <div className="text-[11px] text-slate-500">Estado: {c.estado}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No hay cotizaciones registradas.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Citas Programadas</h4>
                    {selectedRecords.citas.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedRecords.citas.map((ci) => (
                          <div key={ci.id} className="p-3.5 border border-[#E5E7EB] rounded-lg bg-white space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#06345A]">{ci.servicio}</span>
                              <span className="text-slate-500">{ci.fecha} a las {ci.hora} hrs</span>
                            </div>
                            <span className="text-[11px] text-slate-500">Estado: {ci.estado}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No hay citas registradas.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pie de página oficial para impresión */}
              <div className="pt-6 border-t border-[#E5E7EB] text-center text-[11px] text-[#6B7280] space-y-1">
                <p className="font-semibold text-[#06345A] font-heading">
                  Documento informativo emitido por {configuracion?.nombre || 'TUNNO'}.
                </p>
                <p>Todos los derechos reservados. Para dudas o seguimiento de garantía, favor de comunicarse al taller.</p>
                <p className="text-[10px] font-heading font-semibold text-[#06345A] tracking-wider pt-1">
                  Organiza · Controla · Haz crecer
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PLAN DE MANTENIMIENTO CON IA */}
      {/* ======================================================== */}
      <PlanMantenimientoModal
        isOpen={Boolean(planMantenimientoVehiculo)}
        onClose={() => setPlanMantenimientoVehiculo(null)}
        vehiculo={planMantenimientoVehiculo}
        cliente={planMantenimientoVehiculo ? clienteMap.get(planMantenimientoVehiculo.clienteId) : undefined}
        ordenes={ordenes}
        citas={citas}
        garantias={garantias}
        configuracion={configuracion}
        onSaveSeguimiento={onSaveSeguimiento}
        onUpdateVehiculoRecomendaciones={onUpdateVehiculoRecomendaciones}
      />
    </section>
  );
};
