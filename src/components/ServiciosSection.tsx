import React, { useState, useMemo } from 'react';
import { ServicioCatalogo } from '../types';
import { Search, Plus, Pencil, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

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
  const [formRefacciones, setFormRefacciones] = useState<string>('0');
  const [formManoObra, setFormManoObra] = useState<string>('0');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cent calculations helper to avoid decimal floating point errors
  const parseToCents = (valStr: string): number => {
    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  const calculatedTotal = useMemo(() => {
    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    return (refCents + moCents) / 100;
  }, [formRefacciones, formManoObra]);

  const handleOpenAdd = () => {
    setEditingServicio(null);
    setFormNombre('');
    setFormDescripcion('');
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

    const refNum = parseFloat(formRefacciones);
    if (isNaN(refNum) || refNum < 0) {
      errors.refacciones = 'El importe de refacciones no puede ser negativo.';
    }

    const moNum = parseFloat(formManoObra);
    if (isNaN(moNum) || moNum < 0) {
      errors.manoObra = 'El importe de mano de obra no puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const refCents = parseToCents(formRefacciones);
    const moCents = parseToCents(formManoObra);
    const totalVal = (refCents + moCents) / 100;

    const saved: ServicioCatalogo = {
      id: editingServicio
        ? editingServicio.id
        : `serv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Catálogo de servicios
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Gestión de servicios estandarizados con precios base de refacciones y mano de obra.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar servicio</span>
        </button>
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilterEstado('todos')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterEstado === 'todos' ? 'bg-[#0d5c58] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({servicios.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('activos')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterEstado === 'activos' ? 'bg-[#0d5c58] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activos ({servicios.filter((s) => s.activo).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterEstado('inactivos')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterEstado === 'inactivos' ? 'bg-[#0d5c58] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactivos ({servicios.filter((s) => !s.activo).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3.5 px-5">Nombre del servicio</th>
                <th className="py-3.5 px-5">Descripción breve</th>
                <th className="py-3.5 px-5">Precio base total</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServicios.length > 0 ? (
                filteredServicios.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nombre */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{s.nombre}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Refacciones: ${s.importeRefacciones.toFixed(2)} | Mano de obra: ${s.importeManoObra.toFixed(2)}
                      </div>
                    </td>

                    {/* Descripción */}
                    <td className="py-3.5 px-5 text-slate-600 max-w-sm">
                      <span className="line-clamp-2">
                        {s.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
                      </span>
                    </td>

                    {/* Precio Base Total */}
                    <td className="py-3.5 px-5 whitespace-nowrap font-bold text-slate-900">
                      ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {s.activo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0d5c58] bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron servicios que coincidan con la búsqueda.'
                      : 'No hay servicios registrados en el catálogo.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AGREGAR / EDITAR SERVICIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: '' });
                  }}
                  placeholder="Ej. Cambio de balatas y rectificado"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] transition-all ${
                    formErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción breve <span className="text-xs text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalles de los trabajos y componentes incluidos..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] transition-all"
                />
              </div>

              {/* Importes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Importe estimado refacciones ($ MXN)
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
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.refacciones ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.refacciones && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.refacciones}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Importe mano de obra ($ MXN)
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
                    className={`w-full px-3.5 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] ${
                      formErrors.manoObra ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.manoObra && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.manoObra}</p>
                  )}
                </div>
              </div>

              {/* Total Calculado Automáticamente */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600 block">Precio base total calculado:</span>
                  <span className="text-xs text-slate-400">Refacciones + Mano de obra en centavos exactos</span>
                </div>
                <div className="text-lg font-bold text-[#0d5c58]">
                  ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </div>
              </div>

              {/* Estado: Activo o Inactivo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Estado en el catálogo
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                    <input
                      type="radio"
                      name="servicioActivo"
                      checked={formActivo}
                      onChange={() => setFormActivo(true)}
                      className="text-[#0d5c58] focus:ring-[#0d5c58]"
                    />
                    <span>Activo (disponible en formularios)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800">
                    <input
                      type="radio"
                      name="servicioActivo"
                      checked={!formActivo}
                      onChange={() => setFormActivo(false)}
                      className="text-[#0d5c58] focus:ring-[#0d5c58]"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0d5c58] hover:bg-[#0a4845] text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
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
