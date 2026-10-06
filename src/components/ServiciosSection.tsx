import React, { useState, useMemo } from 'react';
import { ServicioCatalogo } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { Search, Plus, Pencil, X, CheckCircle2, AlertCircle, Sparkles, Wrench } from 'lucide-react';

interface ServiciosSectionProps {
  servicios: ServicioCatalogo[];
  onSaveServicio: (servicio: ServicioCatalogo) => void;
}

export const ServiciosSection: React.FC<ServiciosSectionProps> = ({
  servicios,
  onSaveServicio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioCatalogo | null>(null);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  // Costos internos de taller
  const [formCostoRefacciones, setFormCostoRefacciones] = useState<string>('0');
  const [formCostoManoObra, setFormCostoManoObra] = useState<string>('0');
  // Precios de venta al público
  const [formRefacciones, setFormRefacciones] = useState<string>('0');
  const [formManoObra, setFormManoObra] = useState<string>('0');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const serviceFormDismiss = useModalDismiss({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setFormErrors({});
    },
    isDirty: () =>
      formNombre.trim() !== (editingServicio?.nombre || '') ||
      formDescripcion.trim() !== (editingServicio?.descripcion || '') ||
      formCostoRefacciones !== (editingServicio?.costoRefacciones !== undefined ? editingServicio.costoRefacciones.toString() : '0') ||
      formCostoManoObra !== (editingServicio?.costoManoObra !== undefined ? editingServicio.costoManoObra.toString() : '0') ||
      formRefacciones !== (editingServicio?.importeRefacciones !== undefined ? editingServicio.importeRefacciones.toString() : '0') ||
      formManoObra !== (editingServicio?.importeManoObra !== undefined ? editingServicio.importeManoObra.toString() : '0'),
    closeOnBackdrop: true,
  });

  // Cent calculations helper to avoid decimal floating point errors
  const parseToCents = (valStr: string): number => {
    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  // Cálculos automáticos de costos internos, precios de venta, utilidad y margen
  const costeoCalculado = useMemo(() => {
    const costoRefCents = parseToCents(formCostoRefacciones);
    const costoMoCents = parseToCents(formCostoManoObra);
    const costoTotalVal = (costoRefCents + costoMoCents) / 100;

    const precioRefCents = parseToCents(formRefacciones);
    const precioMoCents = parseToCents(formManoObra);
    const precioTotalVal = (precioRefCents + precioMoCents) / 100;

    const utilidadVal = Math.round((precioTotalVal - costoTotalVal) * 100) / 100;
    const margenPct = precioTotalVal > 0 ? Math.round(((utilidadVal / precioTotalVal) * 100) * 10) / 10 : 0;

    return {
      costoRef: costoRefCents / 100,
      costoMo: costoMoCents / 100,
      costoTotal: costoTotalVal,
      precioRef: precioRefCents / 100,
      precioMo: precioMoCents / 100,
      precioTotal: precioTotalVal,
      utilidad: utilidadVal,
      margen: margenPct,
    };
  }, [formCostoRefacciones, formCostoManoObra, formRefacciones, formManoObra]);

  const handleOpenAdd = () => {
    setEditingServicio(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormCostoRefacciones('0');
    setFormCostoManoObra('0');
    setFormRefacciones('0');
    setFormManoObra('0');
    setFormActivo(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: ServicioCatalogo) => {
    setEditingServicio(s);
    setFormNombre(s.nombre);
    setFormDescripcion(s.descripcion || '');
    setFormCostoRefacciones((s.costoRefacciones ?? 0).toString());
    setFormCostoManoObra((s.costoManoObra ?? 0).toString());
    setFormRefacciones(s.importeRefacciones.toString());
    setFormManoObra(s.importeManoObra.toString());
    setFormActivo(s.activo);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre del servicio es obligatorio.';
    }

    const cRefNum = parseFloat(formCostoRefacciones);
    if (isNaN(cRefNum) || cRefNum < 0) {
      errors.costoRefacciones = 'El costo de refacciones no puede ser negativo.';
    }

    const cMoNum = parseFloat(formCostoManoObra);
    if (isNaN(cMoNum) || cMoNum < 0) {
      errors.costoManoObra = 'El costo de mano de obra no puede ser negativo.';
    }

    const refNum = parseFloat(formRefacciones);
    if (isNaN(refNum) || refNum < 0) {
      errors.refacciones = 'El precio de refacciones no puede ser negativo.';
    }

    const moNum = parseFloat(formManoObra);
    if (isNaN(moNum) || moNum < 0) {
      errors.manoObra = 'El precio de mano de obra no puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cRefCents = parseToCents(formCostoRefacciones);
    const cMoCents = parseToCents(formCostoManoObra);
    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    const totalVal = (refCents + moCents) / 100;

    const saved: ServicioCatalogo = {
      id: editingServicio
        ? editingServicio.id
        : `serv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
      costoRefacciones: cRefCents / 100,
      costoManoObra: cMoCents / 100,
      importeRefacciones: refCents / 100,
      importeManoObra: moCents / 100,
      total: totalVal,
      activo: formActivo,
      creadoEn: editingServicio ? editingServicio.creadoEn : new Date().toISOString(),
    };

    onSaveServicio(saved);
    setIsModalOpen(false);
  };

  const filteredServicios = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return servicios.filter((s) => {
      if (filterEstado === 'activos' && !s.activo) return false;
      if (filterEstado === 'inactivos' && s.activo) return false;

      if (q) {
        const nameMatch = s.nombre.toLowerCase().includes(q);
        const descMatch = s.descripcion?.toLowerCase().includes(q);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [servicios, searchQuery, filterEstado]);

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Catálogos */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Catálogo de servicios
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Gestión de servicios estandarizados con precios base de refacciones y mano de obra.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar servicio</span>
        </button>
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
          />
        </div>

        <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#DDE4E8] text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilterEstado('todos')}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'todos' ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold' : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Todos ({servicios.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('activos')}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'activos' ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold' : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Activos ({servicios.filter((s) => s.activo).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('inactivos')}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterEstado === 'inactivos' ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold' : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Inactivos ({servicios.filter((s) => !s.activo).length})
          </button>
        </div>
      </div>

      {/* Table & Mobile View */}
      <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden no-print">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Servicio</th>
                <th className="py-3.5 px-4">Costo interno taller</th>
                <th className="py-3.5 px-4">Precio de venta</th>
                <th className="py-3.5 px-4 text-center">Utilidad / Margen</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServicios.length > 0 ? (
                filteredServicios.map((s) => {
                  const costoRef = s.costoRefacciones ?? 0;
                  const costoMo = s.costoManoObra ?? 0;
                  const costoTotal = costoRef + costoMo;
                  const precioTotal = s.total;
                  const utilidad = Math.round((precioTotal - costoTotal) * 100) / 100;
                  const margen = precioTotal > 0 ? Math.round(((utilidad / precioTotal) * 100) * 10) / 10 : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre y descripción */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#231F20]">{s.nombre}</div>
                        {s.descripcion && (
                          <div className="text-xs text-[#5F6B73] line-clamp-1 max-w-xs mt-0.5">
                            {s.descripcion}
                          </div>
                        )}
                      </td>

                      {/* Costo interno */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-700">
                          ${costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Ref: ${costoRef.toFixed(2)} | MO: ${costoMo.toFixed(2)}
                        </div>
                      </td>

                      {/* Precio de venta */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#1D7EAE]">
                          ${precioTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Ref: ${s.importeRefacciones.toFixed(2)} | MO: ${s.importeManoObra.toFixed(2)}
                        </div>
                      </td>

                      {/* Utilidad y Margen */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-semibold text-emerald-700">
                          +${utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                          margen >= 30
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : margen > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {margen}% margen
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {s.activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron servicios que coincidan con la búsqueda.'
                      : 'No hay servicios registrados en el catálogo.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredServicios.length > 0 ? (
            filteredServicios.map((s) => {
              const costoRef = s.costoRefacciones ?? 0;
              const costoMo = s.costoManoObra ?? 0;
              const costoTotal = costoRef + costoMo;
              const precioTotal = s.total;
              const utilidad = Math.round((precioTotal - costoTotal) * 100) / 100;
              const margen = precioTotal > 0 ? Math.round(((utilidad / precioTotal) * 100) * 10) / 10 : 0;

              return (
                <div key={s.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#231F20] text-sm">{s.nombre}</span>
                        {s.activo ? (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Inactivo
                          </span>
                        )}
                      </div>
                      {s.descripcion && (
                        <p className="text-xs text-slate-600 line-clamp-2">{s.descripcion}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Costo interno</span>
                      <span className="font-bold text-slate-700">${costoTotal.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Ref ${costoRef} | MO ${costoMo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Precio venta</span>
                      <span className="font-bold text-[#1D7EAE]">${precioTotal.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Ref ${s.importeRefacciones} | MO ${s.importeManoObra}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Utilidad estimada: <strong className="text-emerald-700">+${utilidad.toFixed(2)}</strong></span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {margen}% margen
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              {searchQuery
                ? 'No se encontraron servicios que coincidan con la búsqueda.'
                : 'No hay servicios registrados en el catálogo.'}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: AGENDAR / EDITAR SERVICIO */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={serviceFormDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingServicio ? 'Editar servicio del catálogo' : 'Agregar servicio al catálogo'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configura la descripción y precios base para agilizar cotizaciones y órdenes.
                </p>
              </div>
              <button
                type="button"
                onClick={serviceFormDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: '' });
                  }}
                  placeholder="Ej. Cambio de balatas y rectificado"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all ${
                    formErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1">
                  Descripción breve <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalles de los trabajos y componentes incluidos..."
                  className="w-full px-3.5 py-2 border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                />
              </div>

              {/* SECCIÓN 1: COSTO INTERNO DE TALLER */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Costos internos del taller
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Costo total: ${costeoCalculado.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#231F20] mb-1">
                      Costo refacciones ($ MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formCostoRefacciones}
                      onChange={(e) => {
                        setFormCostoRefacciones(e.target.value);
                        if (formErrors.costoRefacciones) setFormErrors({ ...formErrors, costoRefacciones: '' });
                      }}
                      className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                        formErrors.costoRefacciones ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                      }`}
                    />
                    {formErrors.costoRefacciones && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.costoRefacciones}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#231F20] mb-1">
                      Costo mano de obra ($ MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formCostoManoObra}
                      onChange={(e) => {
                        setFormCostoManoObra(e.target.value);
                        if (formErrors.costoManoObra) setFormErrors({ ...formErrors, costoManoObra: '' });
                      }}
                      className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                        formErrors.costoManoObra ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                      }`}
                    />
                    {formErrors.costoManoObra && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.costoManoObra}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: PRECIO DE VENTA AL PÚBLICO */}
              <div className="bg-blue-50/40 border border-blue-200/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1D7EAE]">
                    2. Precios de venta al público
                  </span>
                  <span className="text-xs font-bold text-[#1D7EAE]">
                    Precio total: ${costeoCalculado.precioTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#231F20] mb-1">
                      Precio venta refacciones ($ MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formRefacciones}
                      onChange={(e) => {
                        setFormRefacciones(e.target.value);
                        if (formErrors.refacciones) setFormErrors({ ...formErrors, refacciones: '' });
                      }}
                      className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                        formErrors.refacciones ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                      }`}
                    />
                    {formErrors.refacciones && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.refacciones}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#231F20] mb-1">
                      Precio venta mano de obra ($ MXN)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formManoObra}
                      onChange={(e) => {
                        setFormManoObra(e.target.value);
                        if (formErrors.manoObra) setFormErrors({ ...formErrors, manoObra: '' });
                      }}
                      className={`w-full px-3.5 py-2 bg-white border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                        formErrors.manoObra ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                      }`}
                    />
                    {formErrors.manoObra && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.manoObra}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RESUMEN DE RENTABILIDAD Y MARGEN */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Costo total</span>
                  <span className="text-sm font-bold text-slate-800">
                    ${costeoCalculado.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Utilidad estimada</span>
                  <span className={`text-sm font-bold ${costeoCalculado.utilidad >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ${costeoCalculado.utilidad.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Margen estimado</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                    costeoCalculado.margen >= 30
                      ? 'bg-emerald-100 text-emerald-800'
                      : costeoCalculado.margen > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {costeoCalculado.margen}%
                  </span>
                </div>
              </div>

              {/* Estado: Activo o Inactivo */}
              <div>
                <label className="block text-sm font-medium text-[#231F20] mb-1.5">
                  Estado en el catálogo
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#231F20]">
                    <input
                      type="radio"
                      name="servicioActivo"
                      checked={formActivo}
                      onChange={() => setFormActivo(true)}
                      className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                    />
                    <span>Activo (disponible en formularios)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#231F20]">
                    <input
                      type="radio"
                      name="servicioActivo"
                      checked={!formActivo}
                      onChange={() => setFormActivo(false)}
                      className="text-[#1D7EAE] focus:ring-[#1D7EAE]"
                    />
                    <span>Inactivo (oculto en selecciones futuras)</span>
                  </label>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Desactivar un servicio lo oculta de futuras selecciones, conservando intactos todos los registros anteriores.
                </p>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={serviceFormDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#5F6B73] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
