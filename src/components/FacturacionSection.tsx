import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  X,
  CheckCircle2,
  XCircle,
  MoreVertical,
  DollarSign,
  AlertCircle,
  Clock,
  Car,
  User,
  CreditCard,
  Ban,
  Eye,
} from 'lucide-react';
import {
  Factura,
  Cotizacion,
  Cliente,
  Vehiculo,
  ConfiguracionTaller,
  EstadoFactura,
} from '../types';

interface FacturacionSectionProps {
  facturas: Factura[];
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  configuracion: ConfiguracionTaller;
  onSaveFactura: (factura: Factura) => void;
  onUpdateFactura: (factura: Factura) => void;
}

type FilterEstado = 'todas' | EstadoFactura;

export const FacturacionSection: React.FC<FacturacionSectionProps> = ({
  facturas,
  cotizaciones,
  clientes,
  vehiculos,
  configuracion,
  onSaveFactura,
  onUpdateFactura,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todas');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [payingFactura, setPayingFactura] = useState<Factura | null>(null);
  const [metodoPago, setMetodoPago] = useState('Transferencia bancaria');
  const [fechaPago, setFechaPago] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [notasPago, setNotasPago] = useState('');
  const [pagoError, setPagoError] = useState<string | null>(null);

  const [cancelingFactura, setCancelingFactura] = useState<Factura | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);

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

  // Approved quotes that do not have an invoice yet
  const availableApprovedCotizaciones = useMemo(() => {
    const billedQuoteIds = new Set(facturas.map((f) => f.cotizacionId));
    return cotizaciones.filter(
      (c) => c.estado === 'Aprobada' && !billedQuoteIds.has(c.id)
    );
  }, [cotizaciones, facturas]);

  // Filtered invoices
  const filteredFacturas = useMemo(() => {
    let list = facturas;
    if (filterEstado !== 'todas') {
      list = list.filter((f) => f.estado === filterEstado);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (f) =>
          f.folio.toLowerCase().includes(q) ||
          f.clienteNombre.toLowerCase().includes(q) ||
          f.vehiculoPlacas.toLowerCase().includes(q)
      );
    }
    // Most recent first
    return [...list].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [facturas, filterEstado, searchQuery]);

  // Next unique folio generator
  const getNextFolio = (): string => {
    const numbers = facturas.map((f) => {
      const match = f.folio.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `FAC-${String(max + 1).padStart(3, '0')}`;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedCotizacionId(availableApprovedCotizaciones[0]?.id || '');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Confirm creation
  const handleCreateFactura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCotizacionId) {
      setCreateError('Selecciona una cotización aprobada para facturar.');
      return;
    }

    const cot = cotizaciones.find((c) => c.id === selectedCotizacionId);
    if (!cot) {
      setCreateError('No se encontró la cotización seleccionada.');
      return;
    }

    // Duplicate check
    if (facturas.some((f) => f.cotizacionId === cot.id)) {
      setCreateError('Ya existe una factura generada para esta cotización.');
      return;
    }

    const cli = clienteMap.get(cot.clienteId);
    const veh = vehiculoMap.get(cot.vehiculoId);

    const newFactura: Factura = {
      id: `fac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: getNextFolio(),
      cotizacionId: cot.id,
      cotizacionFolio: cot.folio,
      clienteId: cot.clienteId,
      clienteNombre: cli?.nombre || 'Cliente sin nombre',
      clienteTelefono: cli?.telefono,
      clienteCorreo: cli?.correo,
      vehiculoId: cot.vehiculoId,
      vehiculoDesc: veh ? `${veh.marca} ${veh.modelo}` : 'Vehículo no especificado',
      vehiculoPlacas: veh?.placas || 'S/P',
      descripcion: cot.descripcion,
      importeRefacciones: cot.importeRefacciones,
      importeManoObra: cot.importeManoObra,
      total: cot.total,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
    };

    onSaveFactura(newFactura);
    setIsCreateModalOpen(false);
  };

  // Open Payment Modal
  const handleOpenPayment = (factura: Factura) => {
    if (factura.estado !== 'Pendiente') return;
    setPayingFactura(factura);
    setMetodoPago('Transferencia bancaria');
    const d = new Date();
    setFechaPago(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
    setNotasPago('');
    setPagoError(null);
    setOpenMenuId(null);
  };

  // Confirm Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFactura) return;
    if (!fechaPago) {
      setPagoError('La fecha de pago es requerida.');
      return;
    }

    const updated: Factura = {
      ...payingFactura,
      estado: 'Pagada',
      pago: {
        metodoPago,
        fechaPago,
        notas: notasPago.trim() || undefined,
      },
    };

    onUpdateFactura(updated);
    setPayingFactura(null);
  };

  // Open Cancel Modal
  const handleOpenCancel = (factura: Factura) => {
    if (factura.estado === 'Cancelada') return;
    setCancelingFactura(factura);
    setMotivoCancelacion('');
    setCancelError(null);
    setOpenMenuId(null);
  };

  // Confirm Cancel
  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingFactura) return;
    if (!motivoCancelacion.trim()) {
      setCancelError('El motivo de cancelación es obligatorio.');
      return;
    }

    const updated: Factura = {
      ...cancelingFactura,
      estado: 'Cancelada',
      motivoCancelacion: motivoCancelacion.trim(),
      fechaCancelacion: new Date().toISOString(),
    };

    onUpdateFactura(updated);
    setCancelingFactura(null);
  };

  const selectedQuoteForCreate = useMemo(() => {
    if (!selectedCotizacionId) return null;
    return cotizaciones.find((c) => c.id === selectedCotizacionId) || null;
  }, [selectedCotizacionId, cotizaciones]);

  return (
    <section className="space-y-6">
      {/* Encabezado Merkatics para Facturación */}
      <div className="bg-white border border-[#E4E7EC] border-t-4 border-t-[#C93F43] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C93F43] flex items-center justify-center shrink-0 border border-rose-100">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#202124] tracking-tight">
              Facturación
            </h2>
            <p className="text-xs md:text-sm text-[#5F6368] mt-0.5">
              Comprobantes de demostración administrativa sin validez fiscal.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#E9504F] hover:bg-[#C93F43] text-white text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear factura de prueba</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por folio, cliente o placas..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] placeholder-slate-400 focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20 transition-all"
          />
        </div>

        <div className="flex rounded-lg border border-[#E4E7EC] bg-white p-1 text-xs font-medium shrink-0">
          {(['todas', 'Pendiente', 'Pagada', 'Cancelada'] as FilterEstado[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterEstado(tab)}
              className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                filterEstado === tab
                  ? 'bg-[#E9504F] text-white font-semibold shadow-xs'
                  : 'text-[#5F6368] hover:text-[#202124] hover:bg-slate-50'
              }`}
            >
              {tab === 'todas' ? 'Todas' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table & Mobile View */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-xs overflow-hidden no-print">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Vehículo</th>
                <th className="py-3.5 px-4">Concepto</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((fac) => {
                  const dateStr = new Date(fac.fechaCreacion).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {fac.folio}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{fac.clienteNombre}</div>
                        {fac.clienteTelefono && (
                          <div className="text-xs text-slate-500">{fac.clienteTelefono}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 text-xs font-medium">{fac.vehiculoDesc}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700">
                          {fac.vehiculoPlacas}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 text-xs truncate" title={fac.descripcion}>
                          {fac.descripcion}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          Cotización: {fac.cotizacionFolio}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                        ${fac.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            fac.estado === 'Pagada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fac.estado === 'Cancelada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {fac.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingFactura(fac)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(openMenuId === fac.id ? null : fac.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === fac.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E4E7EC] rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setViewingFactura(fac);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-rose-50 hover:text-[#E9504F] flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ver / imprimir</span>
                                  </button>

                                  {fac.estado === 'Pendiente' && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPayment(fac)}
                                      className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Registrar pago</span>
                                    </button>
                                  )}

                                  {fac.estado !== 'Cancelada' && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCancel(fac)}
                                      className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                                    >
                                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Cancelar factura</span>
                                    </button>
                                  )}
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
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron facturas que coincidan con la búsqueda.'
                      : filterEstado !== 'todas'
                      ? `No hay facturas con estado "${filterEstado}".`
                      : 'No hay comprobantes de facturación registrados todavía.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredFacturas.length > 0 ? (
            filteredFacturas.map((fac) => {
              const dateStr = new Date(fac.fechaCreacion).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div key={fac.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {fac.folio}
                        </span>
                        <span className="text-xs text-slate-400">({dateStr})</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            fac.estado === 'Pagada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fac.estado === 'Cancelada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {fac.estado}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{fac.clienteNombre}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {fac.vehiculoDesc} ({fac.vehiculoPlacas})
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{fac.descripcion}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        Total: ${fac.total.toFixed(2)} MXN
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingFactura(fac)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-[#5F6368] hover:text-[#202124] bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === fac.id ? null : fac.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg"
                          aria-label="Más opciones"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === fac.id && (
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
                                  setViewingFactura(fac);
                                }}
                                className="w-full px-3 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Printer className="w-4 h-4 text-slate-500" />
                                <span>Ver / imprimir</span>
                              </button>

                              {fac.estado === 'Pendiente' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleOpenPayment(fac);
                                  }}
                                  className="w-full px-3 py-2.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CreditCard className="w-4 h-4 text-emerald-600" />
                                  <span>Registrar pago</span>
                                </button>
                              )}

                              {fac.estado !== 'Cancelada' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancel(fac)}
                                  className="w-full px-3 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <Ban className="w-4 h-4 text-rose-600" />
                                  <span>Cancelar factura</span>
                                </button>
                              )}
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
            <div className="p-6 text-center text-xs text-slate-400">
              {searchQuery
                ? 'No se encontraron facturas que coincidan con la búsqueda.'
                : filterEstado !== 'todas'
                ? `No hay facturas con estado "${filterEstado}".`
                : 'No hay comprobantes de facturación registrados todavía.'}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREAR FACTURA DE PRUEBA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#C93F43]" />
                <h3 className="font-bold text-[#202124] text-base">
                  Crear factura de prueba
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFactura} className="p-6 space-y-5">
              {availableApprovedCotizaciones.length > 0 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-1">
                      Seleccionar cotización aprobada <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCotizacionId}
                      onChange={(e) => {
                        setSelectedCotizacionId(e.target.value);
                        if (createError) setCreateError(null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20"
                    >
                      {availableApprovedCotizaciones.map((cot) => {
                        const cli = clienteMap.get(cot.clienteId);
                        const veh = vehiculoMap.get(cot.vehiculoId);
                        return (
                          <option key={cot.id} value={cot.id}>
                            {cot.folio} — {cli?.nombre || 'Cliente'} ({veh?.placas || 'S/P'}) — ${cot.total.toFixed(2)} MXN
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Solo se muestran cotizaciones en estado «Aprobada» sin factura previa.
                    </p>
                  </div>

                  {selectedQuoteForCreate && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-[#E4E7EC] space-y-3 text-xs">
                      <div className="font-bold text-[#202124] text-sm flex items-center justify-between">
                        <span>Resumen de la cotización {selectedQuoteForCreate.folio}</span>
                        <span className="text-[#C93F43] font-bold">
                          ${selectedQuoteForCreate.total.toFixed(2)} MXN
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <span className="text-slate-400 block">Cliente:</span>
                          <span className="font-medium text-slate-800">
                            {clienteMap.get(selectedQuoteForCreate.clienteId)?.nombre || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Vehículo:</span>
                          <span className="font-medium text-slate-800">
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.marca}{' '}
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.modelo} (
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.placas})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Concepto / Trabajo:</span>
                        <p className="text-slate-700 italic mt-0.5">
                          {selectedQuoteForCreate.descripcion}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-700">
                        <span>Refacciones: ${selectedQuoteForCreate.importeRefacciones.toFixed(2)}</span>
                        <span>Mano de obra: ${selectedQuoteForCreate.importeManoObra.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {createError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {createError}
                    </div>
                  )}

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <p className="font-semibold">Aviso administrativo:</p>
                    <p className="mt-0.5">
                      Se creará una copia fija de los datos para la factura. Cambios posteriores en la cotización no alterarán este comprobante.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 border border-[#E4E7EC] rounded-lg text-sm text-[#5F6368] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#E9504F] hover:bg-[#C93F43] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
                    >
                      Emitir factura de prueba
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      No hay cotizaciones aprobadas disponibles
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Para emitir una factura, primero debes aprobar una cotización en la sección Cotizaciones que aún no haya sido facturada.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGO */}
      {payingFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Registrar pago de factura
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingFactura(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block">Factura:</span>
                  <span className="font-bold font-mono text-slate-800 text-sm">
                    {payingFactura.folio}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Total a pagar:</span>
                  <span className="font-bold text-emerald-700 text-base">
                    ${payingFactura.total.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Método de pago <span className="text-red-500">*</span>
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20"
                >
                  <option value="Transferencia bancaria">Transferencia bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de débito">Tarjeta de débito</option>
                  <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas de pago <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={notasPago}
                  onChange={(e) => setNotasPago(e.target.value)}
                  placeholder="Ej. No. de transacción o recibo..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20"
                />
              </div>

              {pagoError && (
                <p className="text-xs text-red-600">{pagoError}</p>
              )}

              <p className="text-[11px] text-slate-500 italic">
                Nota: Una factura pagada no podrá regresar al estado pendiente.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingFactura(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
                >
                  Confirmar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR FACTURA */}
      {cancelingFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  Cancelar factura {cancelingFactura.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelingFactura(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Esta acción cancelará el comprobante <strong>{cancelingFactura.folio}</strong> de{' '}
                <strong>{cancelingFactura.clienteNombre}</strong>. El registro se conservará como cancelado.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Motivo de cancelación <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={motivoCancelacion}
                  onChange={(e) => {
                    setMotivoCancelacion(e.target.value);
                    if (cancelError) setCancelError(null);
                  }}
                  placeholder="Especifica el motivo de la cancelación..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {cancelError && <p className="text-xs text-rose-600 mt-1">{cancelError}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelingFactura(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
                >
                  Confirmar cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER / IMPRIMIR COMPROBANTE DE FACTURACIÓN */}
      {viewingFactura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 print-area">
            {/* Top Bar for Screen only */}
            <div className="no-print bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm">Vista previa de comprobante</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E9504F] hover:bg-[#C93F43] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFactura(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 sm:p-10 bg-white text-slate-800 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-[#202124] tracking-tight">
                    {configuracion?.nombre || 'Taller mecánico'}
                  </h1>
                  {configuracion?.telefono && (
                    <p className="text-xs text-slate-500">Tel: {configuracion.telefono}</p>
                  )}
                  {configuracion?.direccion && (
                    <p className="text-xs text-slate-500">{configuracion.direccion}</p>
                  )}
                  <p className="text-xs uppercase tracking-widest text-[#C93F43] font-bold mt-2">
                    Comprobante de demostración sin validez fiscal
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Folio de factura</div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {viewingFactura.folio}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha de emisión:{' '}
                    {new Date(viewingFactura.fechaCreacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded ${
                        viewingFactura.estado === 'Pagada'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : viewingFactura.estado === 'Cancelada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Estado: {viewingFactura.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer and Vehicle Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Datos del cliente
                  </h4>
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-semibold text-slate-900">{viewingFactura.clienteNombre}</p>
                    {viewingFactura.clienteTelefono && (
                      <p className="text-xs text-slate-600">Tel: {viewingFactura.clienteTelefono}</p>
                    )}
                    {viewingFactura.clienteCorreo && (
                      <p className="text-xs text-slate-600">{viewingFactura.clienteCorreo}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Datos del vehículo
                  </h4>
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-semibold text-slate-900">{viewingFactura.vehiculoDesc}</p>
                    <p className="text-xs text-slate-600">
                      Placas:{' '}
                      <strong className="font-mono bg-white px-1.5 py-0.5 border rounded">
                        {viewingFactura.vehiculoPlacas}
                      </strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Cotización vinculada: {viewingFactura.cotizacionFolio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Concept */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Concepto del servicio
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewingFactura.descripcion}
                </div>
              </div>

              {/* Breakdown Table */}
              <div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                      <th className="py-2">Concepto</th>
                      <th className="py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 text-slate-800 font-medium">
                        Refacciones y componentes suministrados
                      </td>
                      <td className="py-3 text-right text-slate-900">
                        ${viewingFactura.importeRefacciones.toFixed(2)} MXN
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-800 font-medium">
                        Mano de obra y servicios mecánicos
                      </td>
                      <td className="py-3 text-right text-slate-900">
                        ${viewingFactura.importeManoObra.toFixed(2)} MXN
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900">
                      <td className="py-3 font-bold text-slate-900 text-base">Total</td>
                      <td className="py-3 text-right font-bold text-slate-900 text-xl font-mono">
                        ${viewingFactura.total.toFixed(2)} MXN
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Info */}
              {viewingFactura.estado === 'Pagada' && viewingFactura.pago && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Factura pagada</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-emerald-900 pt-1">
                    <div>
                      <span className="text-emerald-700">Método de pago:</span>{' '}
                      <strong>{viewingFactura.pago.metodoPago}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700">Fecha de liquidación:</span>{' '}
                      <strong>{viewingFactura.pago.fechaPago}</strong>
                    </div>
                  </div>
                  {viewingFactura.pago.notas && (
                    <div className="text-emerald-800 pt-1">
                      <span className="text-emerald-700">Notas:</span> {viewingFactura.pago.notas}
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Info */}
              {viewingFactura.estado === 'Cancelada' && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Factura cancelada</span>
                  </div>
                  {viewingFactura.motivoCancelacion && (
                    <p className="text-rose-900 pt-1">
                      <span className="text-rose-700 font-semibold">Motivo:</span>{' '}
                      {viewingFactura.motivoCancelacion}
                    </p>
                  )}
                  {viewingFactura.fechaCancelacion && (
                    <p className="text-rose-700 text-[11px]">
                      Cancelada el:{' '}
                      {new Date(viewingFactura.fechaCancelacion).toLocaleString('es-MX')}
                    </p>
                  )}
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
                Documento emitido exclusivamente para fines de control administrativo interno de la demostración. No constituye comprobante fiscal digital ni tiene validez tributaria.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
