import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  Filter,
  RotateCcw,
  Wrench,
  DollarSign,
  Layers,
  Package,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import {
  OrdenTrabajo,
  Cotizacion,
  Cita,
  Factura,
  Refaccion,
  ServicioCatalogo,
  ConfiguracionTaller,
} from '../types';
import { IotLogo } from './IotLogo';

interface ReportesSectionProps {
  ordenes: OrdenTrabajo[];
  cotizaciones: Cotizacion[];
  citas: Cita[];
  facturas: Factura[];
  refacciones: Refaccion[];
  servicios: ServicioCatalogo[];
  configuracion: ConfiguracionTaller;
}

interface DateRange {
  inicio: string;
  fin: string;
}

export const ReportesSection: React.FC<ReportesSectionProps> = ({
  ordenes,
  cotizaciones,
  citas,
  facturas,
  refacciones,
  servicios: _servicios,
  configuracion,
}) => {
  // Date filter inputs state
  const [fechaInicioInput, setFechaInicioInput] = useState('');
  const [fechaFinInput, setFechaFinInput] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Active applied filter
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null);

  // Accordions state: all open by default so user can inspect and collapse as desired
  const [openSections, setOpenSections] = useState({
    ordenes: true,
    ingresos: true,
    servicios: true,
    inventario: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExpandAll = () => {
    setOpenSections({ ordenes: true, ingresos: true, servicios: true, inventario: true });
  };

  const handleCollapseAll = () => {
    setOpenSections({ ordenes: false, ingresos: false, servicios: false, inventario: false });
  };

  // Filter application
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (!fechaInicioInput && !fechaFinInput) {
      setAppliedRange(null);
      return;
    }

    if (fechaInicioInput && fechaFinInput && fechaInicioInput > fechaFinInput) {
      setDateError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    setAppliedRange({
      inicio: fechaInicioInput,
      fin: fechaFinInput,
    });
  };

  // Clear filter
  const handleClearFilter = () => {
    setFechaInicioInput('');
    setFechaFinInput('');
    setDateError(null);
    setAppliedRange(null);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Helper to test if a record date is within the applied range
  const isDateInRange = (dateStr?: string): boolean => {
    if (!appliedRange) return true;
    if (!appliedRange.inicio && !appliedRange.fin) return true;
    if (!dateStr) return false;

    // Normalizar a YYYY-MM-DD
    const cleanDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;

    if (appliedRange.inicio && cleanDate < appliedRange.inicio) {
      return false;
    }
    if (appliedRange.fin && cleanDate > appliedRange.fin) {
      return false;
    }
    return true;
  };

  // ==========================================
  // 1. REPORTE: ÓRDENES DE TRABAJO
  // ==========================================
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => isDateInRange(o.creadoEn));
  }, [ordenes, appliedRange]);

  const ordenesMetrics = useMemo(() => {
    const total = filteredOrdenes.length;
    const porAutorizar = filteredOrdenes.filter((o) => o.estado === 'Por autorizar').length;
    const enProceso = filteredOrdenes.filter((o) => o.estado === 'En proceso').length;
    // Terminadas: marcadas como terminadas (no entregadas aún o estado Terminado)
    const terminadas = filteredOrdenes.filter(
      (o) => (o.estado === 'Terminado' || o.trabajoTerminado) && !o.entregado
    ).length;
    // Entregadas: orden con confirmación de entrega al cliente
    const entregadas = filteredOrdenes.filter((o) => Boolean(o.entregado)).length;

    return { total, porAutorizar, enProceso, terminadas, entregadas };
  }, [filteredOrdenes]);

  // ==========================================
  // 2. REPORTE: INGRESOS DE DEMOSTRACIÓN
  // Usa solamente facturas de prueba con estado “Pagada”
  // ==========================================
  const facturasPagadas = useMemo(() => {
    return facturas.filter((f) => {
      if (f.estado !== 'Pagada') return false;
      const dateToTest =
        f.pago?.fechaPago || (f.fechaCreacion ? f.fechaCreacion.substring(0, 10) : undefined);
      return isDateInRange(dateToTest);
    });
  }, [facturas, appliedRange]);

  const ingresosMetrics = useMemo(() => {
    const cantidadPagos = facturasPagadas.length;
    const totalCobrado = facturasPagadas.reduce((sum, f) => {
      const val = typeof f.total === 'number' && !isNaN(f.total) ? f.total : 0;
      return sum + val;
    }, 0);

    // Desglose por método de pago
    const desgloseMap: Record<string, { count: number; total: number }> = {};
    facturasPagadas.forEach((f) => {
      const metodo = f.pago?.metodoPago?.trim() || 'No especificado';
      if (!desgloseMap[metodo]) {
        desgloseMap[metodo] = { count: 0, total: 0 };
      }
      desgloseMap[metodo].count += 1;
      desgloseMap[metodo].total += typeof f.total === 'number' && !isNaN(f.total) ? f.total : 0;
    });

    const desglose = Object.entries(desgloseMap).map(([metodo, data]) => ({
      metodo,
      count: data.count,
      total: data.total,
      porcentaje: totalCobrado > 0 ? Math.round((data.total / totalCobrado) * 100) : 0,
    }));

    return { cantidadPagos, totalCobrado, desglose };
  }, [facturasPagadas]);

  // ==========================================
  // 3. REPORTE: SERVICIOS MÁS SOLICITADOS
  // Cuenta servicios registrados en citas, cotizaciones y órdenes.
  // Evita contar dos veces una cotización y una orden vinculadas del mismo trabajo.
  // Máximo cinco principales. Barra horizontal sencilla con estilos locales.
  // ==========================================
  const serviciosMetrics = useMemo(() => {
    // 1. Filtrar órdenes en periodo
    const ords = ordenes.filter((o) => isDateInRange(o.creadoEn));

    // Identificar cotizaciones vinculadas a órdenes
    const linkedCotIds = new Set<string>();
    ordenes.forEach((o) => {
      if (o.cotizacionId) linkedCotIds.add(o.cotizacionId);
    });

    const serviceCounts: Record<
      string,
      { nombre: string; total: number; ordenes: number; cotizaciones: number; citas: number }
    > = {};

    const registerService = (rawName: string, source: 'orden' | 'cotizacion' | 'cita') => {
      const name = rawName?.trim();
      if (!name) return;
      if (!serviceCounts[name]) {
        serviceCounts[name] = { nombre: name, total: 0, ordenes: 0, cotizaciones: 0, citas: 0 };
      }
      serviceCounts[name].total += 1;
      if (source === 'orden') serviceCounts[name].ordenes += 1;
      if (source === 'cotizacion') serviceCounts[name].cotizaciones += 1;
      if (source === 'cita') serviceCounts[name].citas += 1;
    };

    // Registrar órdenes
    ords.forEach((o) => {
      if (o.servicio) registerService(o.servicio, 'orden');
    });

    // 2. Filtrar cotizaciones en periodo y excluir las que estén vinculadas a una orden
    const cots = cotizaciones.filter((c) => isDateInRange(c.creadoEn));
    cots.forEach((c) => {
      const isLinked =
        (c.ordenId && ordenes.some((o) => o.id === c.ordenId)) || linkedCotIds.has(c.id);
      if (!isLinked && c.descripcion) {
        registerService(c.descripcion, 'cotizacion');
      }
    });

    // 3. Filtrar citas en periodo
    const cits = citas.filter((c) => isDateInRange(c.fecha || c.creadoEn));
    cits.forEach((c) => {
      if (c.servicio) registerService(c.servicio, 'cita');
    });

    // Ordenar de mayor a menor y tomar hasta 5
    const top = Object.values(serviceCounts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const maxCount = top.length > 0 ? top[0].total : 1;
    const totalRegistros = Object.values(serviceCounts).reduce((acc, curr) => acc + curr.total, 0);

    return { top, maxCount, totalRegistros };
  }, [ordenes, cotizaciones, citas, appliedRange]);

  // ==========================================
  // 4. REPORTE: INVENTARIO
  // Total refacciones, stock bajo, valor estimado (existencia * costo), lista hasta 5 con stock bajo
  // Maneja de forma segura existencias o costos indefinidos / 0
  // ==========================================
  const inventarioMetrics = useMemo(() => {
    const totalRefacciones = refacciones.length;
    const stockBajo = refacciones.filter((r) => {
      const existencias = typeof r.existencias === 'number' && !isNaN(r.existencias) ? r.existencias : 0;
      const minimo = typeof r.minimo === 'number' && !isNaN(r.minimo) ? r.minimo : 0;
      return existencias < minimo;
    });

    const valorEstimado = refacciones.reduce((sum, r) => {
      const existencias =
        typeof r.existencias === 'number' && !isNaN(r.existencias) && r.existencias > 0
          ? r.existencias
          : 0;
      const costo =
        typeof r.costoUnitario === 'number' && !isNaN(r.costoUnitario) && r.costoUnitario > 0
          ? r.costoUnitario
          : 0;
      return sum + existencias * costo;
    }, 0);

    const listaStockBajo = stockBajo.slice(0, 5);

    return {
      totalRefacciones,
      cantidadStockBajo: stockBajo.length,
      valorEstimado,
      listaStockBajo,
    };
  }, [refacciones]);

  // Text representation of selected period
  const periodoTexto = useMemo(() => {
    if (!appliedRange || (!appliedRange.inicio && !appliedRange.fin)) {
      return 'Histórico completo (todos los registros)';
    }
    if (appliedRange.inicio && appliedRange.fin) {
      return `Del ${appliedRange.inicio} al ${appliedRange.fin}`;
    }
    if (appliedRange.inicio) {
      return `Desde el ${appliedRange.inicio}`;
    }
    return `Hasta el ${appliedRange.fin}`;
  }, [appliedRange]);

  return (
    <section className="space-y-6">
      {/* ENCABEZADO DE IMPRESIÓN (Visible ÚNICAMENTE al imprimir) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800 text-left">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2">
              <IotLogo size="sm" variant="dark" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {configuracion.nombre || 'IOT Technologies'}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-[#1D7EAE] border border-slate-300 rounded">
                Reporte de demostración
              </span>
            </div>
            {configuracion.direccion && (
              <p className="text-xs text-slate-500 mt-1">{configuracion.direccion}</p>
            )}
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <p>
              <strong className="text-slate-800">Periodo:</strong> {periodoTexto}
            </p>
            <p>
              <strong className="text-slate-800">Fecha de generación:</strong>{' '}
              {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* HEADER EN PANTALLA */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE] shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Reportes
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Información operativa consolidada a partir de los registros del taller.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir reporte</span>
          </button>
        </div>
      </div>

      {/* FILTROS DE FECHA (no-print) */}
      <div className="bg-white rounded-xl border border-[#DDE4E8] p-5 shadow-xs no-print">
        <form onSubmit={handleApplyFilter} className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#231F20] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#0032A0]" />
              <span>Filtro por periodo</span>
            </div>
            <div className="text-xs text-slate-500">
              {appliedRange ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#0032A0] font-semibold border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D7EAE]" />
                  Filtro activo
                </span>
              ) : (
                <span className="text-slate-400">Todos los registros</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha inicial
              </label>
              <input
                type="date"
                value={fechaInicioInput}
                onChange={(e) => {
                  setFechaInicioInput(e.target.value);
                  if (dateError) setDateError(null);
                }}
                className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha final
              </label>
              <input
                type="date"
                value={fechaFinInput}
                onChange={(e) => {
                  setFechaFinInput(e.target.value);
                  if (dateError) setDateError(null);
                }}
                className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] transition-all"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 md:col-span-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                <span>Aplicar</span>
              </button>

              <button
                type="button"
                onClick={handleClearFilter}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[42px] bg-white hover:bg-slate-50 text-[#231F20] border border-[#DDE4E8] text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {dateError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{dateError}</span>
            </div>
          )}

          {appliedRange && (
            <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
              <span>
                Mostrando datos para el periodo:{' '}
                <strong className="text-slate-700">{periodoTexto}</strong>
              </span>
            </div>
          )}
        </form>
      </div>

      {/* CONTROLES DE PLEGADO RÁPIDO (no-print) */}
      <div className="flex items-center justify-between text-xs text-slate-500 no-print px-1">
        <span>Apartados desplegables del reporte:</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-[#1D7EAE] hover:underline font-medium cursor-pointer"
          >
            Expandir todos
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="text-slate-500 hover:underline cursor-pointer"
          >
            Colapsar todos
          </button>
        </div>
      </div>

      {/* LOS CUATRO REPORTES */}
      <div className="space-y-5">
        {/* ============================================================== */}
        {/* REPORTE 1: ÓRDENES DE TRABAJO */}
        {/* ============================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
          {/* Header del apartado */}
          <div
            onClick={() => toggleSection('ordenes')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none print:hover:bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  1. Órdenes de trabajo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estatus operativo de las órdenes de servicio en el taller.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                Total: {ordenesMetrics.total}
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 no-print"
                aria-label="Alternar apartado"
              >
                {openSections.ordenes ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Contenido (visible si está abierto o en modo impresión) */}
          <div className={`${openSections.ordenes ? 'block' : 'hidden'} print:!block p-5 pt-0 border-t border-slate-100`}>
            {/* Números grandes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Total órdenes</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">
                  {ordenesMetrics.total}
                </p>
                <span className="text-[11px] text-slate-400">En el periodo</span>
              </div>

              <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-200/80">
                <span className="text-xs font-medium text-amber-800">Por autorizar</span>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-1 font-mono">
                  {ordenesMetrics.porAutorizar}
                </p>
                <span className="text-[11px] text-amber-700">Pendiente de cliente</span>
              </div>

              <div className="bg-blue-50/60 rounded-lg p-3.5 border border-blue-200/80">
                <span className="text-xs font-medium text-blue-800">En proceso</span>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1 font-mono">
                  {ordenesMetrics.enProceso}
                </p>
                <span className="text-[11px] text-blue-700">Trabajo en curso</span>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-200/80">
                <span className="text-xs font-medium text-emerald-800">Terminadas</span>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1 font-mono">
                  {ordenesMetrics.terminadas}
                </p>
                <span className="text-[11px] text-emerald-700">Listas para entrega</span>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-200/80 col-span-2 sm:col-span-1">
                <span className="text-xs font-medium text-emerald-800">Entregadas</span>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1 font-mono">
                  {ordenesMetrics.entregadas}
                </p>
                <span className="text-[11px] text-emerald-700">Completadas con éxito</span>
              </div>
            </div>

            {/* Tabla pequeña de desglose */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Estatus de orden</th>
                      <th className="py-2 px-3 text-right">Cantidad</th>
                      <th className="py-2 px-3 text-right">Proporción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Por autorizar</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {ordenesMetrics.porAutorizar}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {ordenesMetrics.total > 0
                           ? `${Math.round((ordenesMetrics.porAutorizar / ordenesMetrics.total) * 100)}%`
                          : '0%'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>En proceso</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {ordenesMetrics.enProceso}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {ordenesMetrics.total > 0
                          ? `${Math.round((ordenesMetrics.enProceso / ordenesMetrics.total) * 100)}%`
                          : '0%'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Terminadas (pendientes de entrega)</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {ordenesMetrics.terminadas}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {ordenesMetrics.total > 0
                          ? `${Math.round((ordenesMetrics.terminadas / ordenesMetrics.total) * 100)}%`
                          : '0%'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Entregadas</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        {ordenesMetrics.entregadas}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {ordenesMetrics.total > 0
                          ? `${Math.round((ordenesMetrics.entregadas / ordenesMetrics.total) * 100)}%`
                          : '0%'}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 font-bold bg-slate-50/60 text-slate-900">
                      <td className="py-2 px-3">Total órdenes</td>
                      <td className="py-2 px-3 text-right font-mono">{ordenesMetrics.total}</td>
                      <td className="py-2 px-3 text-right font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {ordenesMetrics.total === 0 && (
                <p className="text-center text-xs text-slate-400 py-3 italic">
                  No se encontraron órdenes registradas en el periodo seleccionado.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REPORTE 2: INGRESOS DE DEMOSTRACIÓN */}
        {/* ============================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div
            onClick={() => toggleSection('ingresos')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none print:hover:bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  2. Ingresos de demostración
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liquidaciones efectivas calculadas únicamente con facturas pagadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                ${ingresosMetrics.totalCobrado.toFixed(2)} MXN
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 no-print"
                aria-label="Alternar apartado"
              >
                {openSections.ingresos ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className={`${openSections.ingresos ? 'block' : 'hidden'} print:!block p-5 pt-0 border-t border-slate-100`}>
            {/* Números grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Cantidad de pagos</span>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
                  {ingresosMetrics.cantidadPagos}
                </p>
                <span className="text-[11px] text-slate-400">
                  Facturas con estado «Pagada» en el periodo
                </span>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-4 border border-emerald-200/80">
                <span className="text-xs font-medium text-emerald-800">Total cobrado</span>
                <p className="text-3xl font-bold text-emerald-900 mt-1 font-mono">
                  ${ingresosMetrics.totalCobrado.toFixed(2)}{' '}
                  <span className="text-sm font-normal text-emerald-700">MXN</span>
                </p>
                <span className="text-[11px] text-emerald-700">Suma total de cobros efectuados</span>
              </div>
            </div>

            {/* Tabla pequeña de desglose por método de pago */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Desglose por método de pago
              </h4>

              {ingresosMetrics.desglose.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Método de pago</th>
                        <th className="py-2 px-3 text-right">Cantidad de pagos</th>
                        <th className="py-2 px-3 text-right">Total cobrado</th>
                        <th className="py-2 px-3 text-right">Proporción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ingresosMetrics.desglose.map((d) => (
                        <tr key={d.metodo} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-900">{d.metodo}</td>
                          <td className="py-2 px-3 text-right font-mono">{d.count}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            ${d.total.toFixed(2)} MXN
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">
                            {d.porcentaje}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 font-bold bg-slate-50/60 text-slate-900">
                        <td className="py-2 px-3">Total acumulado</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {ingresosMetrics.cantidadPagos}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-800">
                          ${ingresosMetrics.totalCobrado.toFixed(2)} MXN
                        </td>
                        <td className="py-2 px-3 text-right font-mono">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400 py-3 italic bg-slate-50/50 rounded-lg">
                  No se registraron cobros de facturas pagadas en el periodo seleccionado.
                </p>
              )}
            </div>

            {/* Aviso reglamentario obligatorio */}
            <div className="mt-4 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 text-center font-medium">
              Información de demostración sin validez contable o fiscal.
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REPORTE 3: SERVICIOS MÁS SOLICITADOS */}
        {/* ============================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div
            onClick={() => toggleSection('servicios')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none print:hover:bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  3. Servicios más solicitados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidado de citas, cotizaciones y órdenes (sin duplicar trabajos vinculados).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                Top {serviciosMetrics.top.length}
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 no-print"
                aria-label="Alternar apartado"
              >
                {openSections.servicios ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className={`${openSections.servicios ? 'block' : 'hidden'} print:!block p-5 pt-0 border-t border-slate-100`}>
            {serviciosMetrics.top.length > 0 ? (
              <div className="pt-4 space-y-4">
                {/* Gráfica de barras horizontal sencilla con estilos locales */}
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                    Frecuencia relativa de los 5 servicios principales
                  </span>
                  <div className="space-y-2.5 pt-1">
                    {serviciosMetrics.top.map((s, idx) => {
                      const pct = Math.round((s.total / serviciosMetrics.maxCount) * 100);
                      return (
                        <div key={s.nombre} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-800 truncate max-w-md">
                              <span className="text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                              {s.nombre}
                            </span>
                            <span className="font-mono font-bold text-purple-700 shrink-0 ml-2">
                              {s.total} {s.total === 1 ? 'registro' : 'registros'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(8, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabla pequeña */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3 w-12 text-center">#</th>
                        <th className="py-2 px-3">Nombre del servicio</th>
                        <th className="py-2 px-3 text-right">Cantidad de registros</th>
                        <th className="py-2 px-3 text-right">Desglose (C / Cot / O)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {serviciosMetrics.top.map((s, idx) => (
                        <tr key={s.nombre} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">{s.nombre}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#231F20]">
                            {s.total}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                            {s.citas} citas · {s.cotizaciones} cot · {s.ordenes} ord
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 py-6 italic">
                No se encontraron servicios registrados en citas, cotizaciones ni órdenes en este
                periodo.
              </p>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* REPORTE 4: INVENTARIO */}
        {/* ============================================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div
            onClick={() => toggleSection('inventario')}
            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none print:hover:bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  4. Inventario
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Existencias de refacciones, nivel de criticidad y valuación estimada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {inventarioMetrics.cantidadStockBajo > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {inventarioMetrics.cantidadStockBajo} bajo stock
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800">
                  Stock óptimo
                </span>
              )}
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 no-print"
                aria-label="Alternar apartado"
              >
                {openSections.inventario ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className={`${openSections.inventario ? 'block' : 'hidden'} print:!block p-5 pt-0 border-t border-slate-100`}>
            {/* Números grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
                <span className="text-xs font-medium text-slate-500">Total de refacciones</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">
                  {inventarioMetrics.totalRefacciones}
                </p>
                <span className="text-[11px] text-slate-400">Códigos registrados en catálogo</span>
              </div>

              <div
                className={`rounded-lg p-3.5 border ${
                  inventarioMetrics.cantidadStockBajo > 0
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                }`}
              >
                <span className="text-xs font-medium">Refacciones con stock bajo</span>
                <p className="text-2xl sm:text-3xl font-bold mt-1 font-mono">
                  {inventarioMetrics.cantidadStockBajo}
                </p>
                <span className="text-[11px] opacity-80">Existencias menores al mínimo</span>
              </div>

              <div className="bg-emerald-50/60 rounded-lg p-3.5 border border-emerald-200/80">
                <span className="text-xs font-medium text-emerald-800">Valor estimado de inventario</span>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1 font-mono">
                  ${inventarioMetrics.valorEstimado.toFixed(2)}{' '}
                  <span className="text-xs font-normal">MXN</span>
                </p>
                <span className="text-[11px] text-emerald-700">Existencias × costo unitario</span>
              </div>
            </div>

            {/* Lista de hasta 5 productos con stock bajo */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Refacciones que requieren resurtido (hasta 5)</span>
                <span className="text-[11px] font-normal text-slate-400 lowercase">
                  {inventarioMetrics.listaStockBajo.length} de {inventarioMetrics.cantidadStockBajo} mostradas
                </span>
              </h4>

              {inventarioMetrics.listaStockBajo.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Nombre</th>
                        <th className="py-2 px-3 text-right">Existencia</th>
                        <th className="py-2 px-3 text-right">Mínimo</th>
                        <th className="py-2 px-3 text-right">Faltante</th>
                        <th className="py-2 px-3 text-right">Costo unitario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inventarioMetrics.listaStockBajo.map((ref) => {
                        const existencias =
                          typeof ref.existencias === 'number' && !isNaN(ref.existencias)
                            ? ref.existencias
                            : 0;
                        const minimo =
                          typeof ref.minimo === 'number' && !isNaN(ref.minimo) ? ref.minimo : 0;
                        const faltante = Math.max(0, minimo - existencias);
                        const tieneCosto =
                          typeof ref.costoUnitario === 'number' &&
                          !isNaN(ref.costoUnitario) &&
                          ref.costoUnitario > 0;

                        return (
                          <tr key={ref.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-medium text-slate-600">
                              {ref.codigo}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">{ref.nombre}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                              {existencias}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {minimo}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700 font-medium">
                              -{faltante}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {tieneCosto ? (
                                `$${(ref.costoUnitario as number).toFixed(2)} MXN`
                              ) : (
                                <span className="text-slate-400 italic">Sin costo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Todas las refacciones registradas cuentan con existencias iguales o superiores a su nivel mínimo.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA DE IMPRESIÓN (Visible ÚNICAMENTE al imprimir) */}
      <div className="hidden print:block pt-6 mt-6 border-t border-slate-300 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Reporte de demostración operativa</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Generado por Sistema de Talleres Mecánicos - IOT Technologies para {configuracion.nombre || 'IOT Technologies'}. Sin validez legal ni contable.
        </p>
      </div>
    </section>
  );
};
