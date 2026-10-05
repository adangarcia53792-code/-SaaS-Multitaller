import React, { useState, useMemo } from 'react';
import { Cliente, Vehiculo, Cita, Cotizacion, OrdenTrabajo } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import {
  X,
  History,
  FileText,
  Calendar,
  Wrench,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface HistorialModalProps {
  tipo: 'cliente' | 'vehiculo';
  targetId: string;
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  onClose: () => void;
}

type FilterTipo = 'Todos' | 'Citas' | 'Cotizaciones' | 'Órdenes';

interface HistorialItem {
  id: string;
  tipo: 'Cita' | 'Cotización' | 'Orden';
  timestamp: number; // -1 if no date
  fechaDisplay: string;
  folio?: string;
  servicio: string;
  estado: string;
  vehiculoId?: string;
  rawRecord: Cita | Cotizacion | OrdenTrabajo;
}

export const HistorialModal: React.FC<HistorialModalProps> = ({
  tipo,
  targetId,
  clientes,
  vehiculos,
  citas,
  cotizaciones,
  ordenes,
  onClose,
}) => {
  // Single filter state: Todos, Citas, Cotizaciones y Órdenes
  const [filter, setFilter] = useState<FilterTipo>('Todos');

  // Modal for detail view
  const [viewingDetailItem, setViewingDetailItem] = useState<HistorialItem | null>(null);

  const mainModalDismiss = useModalDismiss({
    isOpen: true,
    onClose,
    closeOnBackdrop: true,
  });

  const detailModalDismiss = useModalDismiss({
    isOpen: Boolean(viewingDetailItem),
    onClose: () => setViewingDetailItem(null),
    closeOnBackdrop: true,
  });

  // Lookups
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

  // Target entity
  const targetCliente = useMemo(() => {
    if (tipo !== 'cliente') return null;
    return clientes.find((c) => c.id === targetId) || null;
  }, [tipo, targetId, clientes]);

  const targetVehiculo = useMemo(() => {
    if (tipo !== 'vehiculo') return null;
    return vehiculos.find((v) => v.id === targetId) || null;
  }, [tipo, targetId, vehiculos]);

  // Client's vehicles if target is client
  const clientVehicles = useMemo(() => {
    if (!targetCliente) return [];
    return vehiculos.filter((v) => v.clienteId === targetCliente.id);
  }, [targetCliente, vehiculos]);

  // Compile history items directly from existing records
  const items = useMemo<HistorialItem[]>(() => {
    const result: HistorialItem[] = [];

    // Filter citas
    const relevantCitas = citas.filter((c) => {
      if (tipo === 'cliente') return c.clienteId === targetId;
      return c.vehiculoId === targetId;
    });

    relevantCitas.forEach((c) => {
      let timestamp = -1;
      let fechaDisplay = 'Sin fecha registrada';
      if (c.fecha && c.fecha.trim()) {
        const [y, m, d] = c.fecha.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.getTime();
          const monthName = dateObj.toLocaleDateString('es-MX', { month: 'short' });
          fechaDisplay = `${d} ${monthName} ${y}${c.hora ? ` • ${c.hora} hrs` : ''}`;
        }
      }

      result.push({
        id: `cita-${c.id}`,
        tipo: 'Cita',
        timestamp,
        fechaDisplay,
        folio: undefined,
        servicio: c.servicio,
        estado: c.estado,
        vehiculoId: c.vehiculoId,
        rawRecord: c,
      });
    });

    // Filter cotizaciones
    const relevantCotizaciones = cotizaciones.filter((cot) => {
      if (tipo === 'cliente') return cot.clienteId === targetId;
      return cot.vehiculoId === targetId;
    });

    relevantCotizaciones.forEach((cot) => {
      let timestamp = -1;
      let fechaDisplay = 'Sin fecha registrada';
      if (cot.creadoEn && cot.creadoEn.trim()) {
        const dateObj = new Date(cot.creadoEn);
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.getTime();
          const d = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('es-MX', { month: 'short' });
          const y = dateObj.getFullYear();
          fechaDisplay = `${d} ${monthName} ${y}`;
        }
      }

      result.push({
        id: `cot-${cot.id}`,
        tipo: 'Cotización',
        timestamp,
        fechaDisplay,
        folio: cot.folio,
        servicio: cot.descripcion,
        estado: cot.estado,
        vehiculoId: cot.vehiculoId,
        rawRecord: cot,
      });
    });

    // Filter ordenes
    const relevantOrdenes = ordenes.filter((ord) => {
      if (tipo === 'cliente') return ord.clienteId === targetId;
      return ord.vehiculoId === targetId;
    });

    relevantOrdenes.forEach((ord) => {
      let timestamp = -1;
      let fechaDisplay = 'Sin fecha registrada';
      if (ord.creadoEn && ord.creadoEn.trim()) {
        const dateObj = new Date(ord.creadoEn);
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.getTime();
          const d = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('es-MX', { month: 'short' });
          const y = dateObj.getFullYear();
          fechaDisplay = `${d} ${monthName} ${y}`;
        }
      }

      result.push({
        id: `ord-${ord.id}`,
        tipo: 'Orden',
        timestamp,
        fechaDisplay,
        folio: ord.folio,
        servicio: ord.servicio,
        estado: ord.estado,
        vehiculoId: ord.vehiculoId,
        rawRecord: ord,
      });
    });

    // Sort: most recent to oldest. Records without date go to the end!
    result.sort((a, b) => {
      if (a.timestamp === -1 && b.timestamp === -1) return 0;
      if (a.timestamp === -1) return 1;
      if (b.timestamp === -1) return -1;
      return b.timestamp - a.timestamp;
    });

    return result;
  }, [tipo, targetId, citas, cotizaciones, ordenes]);

  // Apply single filter: Todos, Citas, Cotizaciones, Órdenes
  const filteredItems = useMemo(() => {
    if (filter === 'Todos') return items;
    if (filter === 'Citas') return items.filter((i) => i.tipo === 'Cita');
    if (filter === 'Cotizaciones') return items.filter((i) => i.tipo === 'Cotización');
    if (filter === 'Órdenes') return items.filter((i) => i.tipo === 'Orden');
    return items;
  }, [items, filter]);

  const citasCount = useMemo(() => items.filter((i) => i.tipo === 'Cita').length, [items]);
  const cotizacionesCount = useMemo(() => items.filter((i) => i.tipo === 'Cotización').length, [items]);
  const ordenesCount = useMemo(() => items.filter((i) => i.tipo === 'Orden').length, [items]);

  // Helper for badge styling per type
  const renderTipoBadge = (itemTipo: 'Cita' | 'Cotización' | 'Orden', folio?: string) => {
    if (itemTipo === 'Cita') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Calendar className="w-3 h-3 text-sky-600" />
          <span>Cita</span>
        </span>
      );
    }
    if (itemTipo === 'Cotización') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FileText className="w-3 h-3 text-indigo-600" />
            <span>Cotización</span>
          </span>
          {folio && (
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {folio}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Wrench className="w-3 h-3 text-amber-600" />
          <span>Orden</span>
        </span>
        {folio && (
          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            {folio}
          </span>
        )}
      </div>
    );
  };

  // Helper for status badge
  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Programada':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Programada
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        );
      case 'Por autorizar':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Por autorizar
          </span>
        );
      case 'Aprobada':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Aprobada
          </span>
        );
      case 'Rechazada':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Rechazada
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Pendiente
          </span>
        );
      case 'En proceso':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            En proceso
          </span>
        );
      case 'Terminado':
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Terminado
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {estado}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto no-print animate-in fade-in duration-100"
      onClick={mainModalDismiss.handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] my-4">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#98DAE9]/20 border border-[#98DAE9]/40 rounded-lg text-[#1D7EAE]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#231F20] tracking-tight">
                {tipo === 'cliente' ? 'Historial del cliente' : 'Historial del vehículo'}
              </h3>
              <p className="text-xs text-[#5F6B73]">
                Consulta cronológica de citas, cotizaciones y órdenes de trabajo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={mainModalDismiss.handleClose}
            className="p-1.5 text-slate-400 hover:text-[#231F20] rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Entity Card: Name, Contact or Vehicle info */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
          {tipo === 'cliente' && targetCliente && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Cliente
                  </span>
                  <h4 className="text-xl font-bold text-slate-900">
                    {targetCliente.nombre}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{targetCliente.telefono}</strong>
                  </span>
                  {targetCliente.correo && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{targetCliente.correo}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Client Vehicles List */}
              <div className="pt-2 border-t border-slate-200/80 text-xs">
                <span className="text-slate-500 font-medium mr-2">
                  Vehículos registrados ({clientVehicles.length}):
                </span>
                {clientVehicles.length > 0 ? (
                  <span className="inline-flex flex-wrap gap-2 mt-1 sm:mt-0">
                    {clientVehicles.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800"
                      >
                        <Car className="w-3 h-3 text-[#1D7EAE]" />
                        <span>
                          {v.marca} {v.modelo}
                        </span>
                        <strong className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1 rounded">
                          {v.placas}
                        </strong>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Sin vehículos registrados</span>
                )}
              </div>
            </div>
          )}

          {tipo === 'vehiculo' && targetVehiculo && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Vehículo
                  </span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <h4 className="text-xl font-bold text-slate-900">
                      {targetVehiculo.marca} {targetVehiculo.modelo}
                    </h4>
                    {targetVehiculo.año && (
                      <span className="text-xs text-slate-500">({targetVehiculo.año})</span>
                    )}
                    <span className="font-mono font-bold text-xs bg-slate-900 text-teal-300 px-2 py-0.5 rounded border border-slate-800">
                      {targetVehiculo.placas}
                    </span>
                  </div>
                </div>

                {/* Owner info */}
                {(() => {
                  const owner = clienteMap.get(targetVehiculo.clienteId);
                  return (
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                        Propietario
                      </span>
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#1D7EAE]" />
                          <strong className="text-slate-900">{owner.nombre}</strong>
                          <span className="text-slate-500">({owner.telefono})</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 italic">No asignado</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Filter Bar: Un solo filtro (Todos, Citas, Cotizaciones, Órdenes) */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white flex-wrap">
          <div className="flex rounded-lg border border-[#DDE4E8] bg-slate-50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter('Todos')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'Todos'
                  ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Citas')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'Citas'
                  ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citas ({citasCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Cotizaciones')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'Cotizaciones'
                  ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cotizaciones ({cotizacionesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('Órdenes')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filter === 'Órdenes'
                  ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Órdenes ({ordenesCount})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Content Area: Table for Desktop, Cards for Mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredItems.length > 0 ? (
            <>
              {/* Desktop Table (hidden on mobile) */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4 w-40">Fecha</th>
                      <th className="py-3 px-4 w-48">Tipo y folio</th>
                      <th className="py-3 px-4">Servicio solicitado</th>
                      {tipo === 'cliente' && <th className="py-3 px-4 w-40">Vehículo</th>}
                      <th className="py-3 px-4 w-32">Estado</th>
                      <th className="py-3 px-4 text-right w-28">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const veh = item.vehiculoId ? vehiculoMap.get(item.vehiculoId) : undefined;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Fecha */}
                          <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {item.fechaDisplay === 'Sin fecha registrada' ? (
                              <span className="text-slate-400 italic">Sin fecha registrada</span>
                            ) : (
                              <span>{item.fechaDisplay}</span>
                            )}
                          </td>

                          {/* Tipo y Folio */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderTipoBadge(item.tipo, item.folio)}
                          </td>

                          {/* Servicio solicitado */}
                          <td className="py-3.5 px-4 text-slate-700 max-w-xs">
                            <span className="line-clamp-2">{item.servicio}</span>
                          </td>

                          {/* Vehículo (si estamos en vista de cliente) */}
                          {tipo === 'cliente' && (
                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                              {veh ? (
                                <span>
                                  {veh.marca} {veh.modelo}{' '}
                                  <strong className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1 py-0.5 rounded">
                                    {veh.placas}
                                  </strong>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                          )}

                          {/* Estado */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderEstadoBadge(item.estado)}
                          </td>

                          {/* Botón Ver detalle */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewingDetailItem(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#1D7EAE] bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver detalle</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (visible only on mobile) */}
              <div className="block md:hidden space-y-3">
                {filteredItems.map((item) => {
                  const veh = item.vehiculoId ? vehiculoMap.get(item.vehiculoId) : undefined;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {renderTipoBadge(item.tipo, item.folio)}
                        <span className="text-xs text-slate-500 font-medium">
                          {item.fechaDisplay}
                        </span>
                      </div>

                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                        {item.servicio}
                      </div>

                      {tipo === 'cliente' && veh && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {veh.marca} {veh.modelo} ({veh.placas})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {renderEstadoBadge(item.estado)}
                        <button
                          type="button"
                          onClick={() => setViewingDetailItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1D7EAE] bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalle</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 my-4 shadow-2xs space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                Todavía no hay atenciones registradas
              </p>
              <p className="text-xs text-slate-400">
                {filter !== 'Todos'
                  ? `No se encontraron registros del tipo "${filter}".`
                  : 'Este registro no cuenta con citas, cotizaciones ni órdenes asociadas.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={mainModalDismiss.handleClose}
            className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar historial
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OVERLAY: VER DETALLE DEL REGISTRO */}
      {/* Reutiliza las vistas existentes de forma limpia */}
      {/* ======================================================== */}
      {viewingDetailItem && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-in fade-in duration-100"
          onClick={detailModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
            {/* Modal Detail Header */}
            <div className="px-6 py-4 bg-white border-b border-[#DDE4E8] text-[#231F20] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#231F20]">
                  Detalle de {viewingDetailItem.tipo.toLowerCase()}
                </span>
                {viewingDetailItem.folio && (
                  <span className="font-mono text-[#1D7EAE] font-bold text-xs bg-[#98DAE9]/20 border border-[#98DAE9]/40 px-2 py-0.5 rounded">
                    {viewingDetailItem.folio}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={detailModalDismiss.handleClose}
                className="p-1.5 text-slate-400 hover:text-[#231F20] rounded-lg transition-colors cursor-pointer"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* DETALLE: CITA */}
              {viewingDetailItem.tipo === 'Cita' && (() => {
                const c = viewingDetailItem.rawRecord as Cita;
                const client = clienteMap.get(c.clienteId);
                const veh = vehiculoMap.get(c.vehiculoId);

                return (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Fecha y hora programada
                        </span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {c.fecha} • {c.hora} hrs
                        </div>
                      </div>
                      {renderEstadoBadge(c.estado)}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Cliente
                        </span>
                        <p className="font-bold text-slate-900">{client ? client.nombre : 'No encontrado'}</p>
                        {client && <p className="text-slate-500 mt-0.5">{client.telefono}</p>}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Vehículo
                        </span>
                        {veh ? (
                          <>
                            <p className="font-bold text-slate-900">{veh.marca} {veh.modelo}</p>
                            <p className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border inline-block mt-0.5 text-[10px]">
                              {veh.placas}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-400 italic">No encontrado</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">
                        Servicio solicitado:
                      </span>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800">
                        {c.servicio}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DETALLE: COTIZACIÓN */}
              {viewingDetailItem.tipo === 'Cotización' && (() => {
                const cot = viewingDetailItem.rawRecord as Cotizacion;
                const client = clienteMap.get(cot.clienteId);
                const veh = vehiculoMap.get(cot.vehiculoId);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Folio de cotización
                        </span>
                        <span className="font-mono font-bold text-sm text-[#1D7EAE]">
                          {cot.folio}
                        </span>
                      </div>
                      {renderEstadoBadge(cot.estado)}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Cliente
                        </span>
                        <p className="font-bold text-slate-900">{client ? client.nombre : 'No encontrado'}</p>
                        {client && <p className="text-slate-500 mt-0.5">{client.telefono}</p>}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Vehículo
                        </span>
                        {veh ? (
                          <>
                            <p className="font-bold text-slate-900">{veh.marca} {veh.modelo}</p>
                            <p className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border inline-block mt-0.5 text-[10px]">
                              {veh.placas}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-400 italic">No encontrado</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">
                        Trabajo presupuestado:
                      </span>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                        {cot.descripcion}
                      </div>
                    </div>

                    {/* Desglose de importes */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="font-semibold text-slate-600 block mb-1">
                        Presupuesto económico:
                      </span>
                      <div className="flex justify-between text-slate-600">
                        <span>Refacciones:</span>
                        <span>${cot.importeRefacciones.toFixed(2)} MXN</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Mano de obra:</span>
                        <span>${cot.importeManoObra.toFixed(2)} MXN</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[#1D7EAE] border-t border-slate-200 pt-1.5">
                        <span>Total:</span>
                        <span>${cot.total.toFixed(2)} MXN</span>
                      </div>
                    </div>

                    {/* Autorización si existe */}
                    {cot.autorizacion && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Autorización registrada</span>
                        </div>
                        <p>Autorizado por: <strong>{cot.autorizacion.autorizadoPor}</strong></p>
                        <p className="text-[11px] text-emerald-700">Fecha: {cot.autorizacion.fechaHora}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DETALLE: ORDEN DE TRABAJO */}
              {viewingDetailItem.tipo === 'Orden' && (() => {
                const ord = viewingDetailItem.rawRecord as OrdenTrabajo;
                const client = clienteMap.get(ord.clienteId);
                const veh = vehiculoMap.get(ord.vehiculoId);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Folio de orden
                        </span>
                        <span className="font-mono font-bold text-sm text-[#1D7EAE]">
                          {ord.folio}
                        </span>
                      </div>
                      {renderEstadoBadge(ord.estado)}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Cliente
                        </span>
                        <p className="font-bold text-slate-900">{client ? client.nombre : 'No encontrado'}</p>
                        {client && <p className="text-slate-500 mt-0.5">{client.telefono}</p>}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                          Vehículo
                        </span>
                        {veh ? (
                          <>
                            <p className="font-bold text-slate-900">{veh.marca} {veh.modelo}</p>
                            <p className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border inline-block mt-0.5 text-[10px]">
                              {veh.placas}
                            </p>
                            {ord.kilometraje && (
                              <p className="text-slate-500 text-[10px] mt-0.5">Km: {ord.kilometraje}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-400 italic">No encontrado</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">
                        Trabajo solicitado:
                      </span>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                        {ord.servicio}
                      </div>
                    </div>

                    {ord.diagnostico && (
                      <div>
                        <span className="font-semibold text-slate-600 block mb-1">
                          Diagnóstico técnico:
                        </span>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                          {ord.diagnostico}
                        </div>
                      </div>
                    )}

                    {/* Estado del control */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="font-semibold text-slate-600 block">
                        Control de calidad:
                      </span>
                      <div className="flex items-center gap-4 text-slate-700 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${ord.trabajoTerminado ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Trabajo terminado</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${ord.revisionFinal ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Revisión final</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${ord.entregado ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Entregado</span>
                        </span>
                      </div>
                      {ord.fechaHoraEntrega && (
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          Entrega: <strong>{ord.fechaHoraEntrega}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={detailModalDismiss.handleClose}
                className="px-4 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Volver al historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
