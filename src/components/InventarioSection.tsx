import React, { useState, useMemo } from 'react';
import { Refaccion, MovimientoInventario } from '../types';
import {
  Search,
  Plus,
  Pencil,
  X,
  MoreVertical,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  AlertTriangle,
  Package,
  Layers
} from 'lucide-react';

interface InventarioSectionProps {
  refacciones: Refaccion[];
  movimientos: MovimientoInventario[];
  onSaveRefaccion: (refaccion: Refaccion, initialMovement?: MovimientoInventario) => void;
  onRecordMovement: (movement: MovimientoInventario) => void;
}

type FilterStock = 'todas' | 'stock-bajo';

export const InventarioSection: React.FC<InventarioSectionProps> = ({
  refacciones,
  movimientos,
  onSaveRefaccion,
  onRecordMovement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<FilterStock>('todas');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal: Add / Edit Refacción
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRefaccion, setEditingRefaccion] = useState<Refaccion | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formExistencias, setFormExistencias] = useState('0');
  const [formMinimo, setFormMinimo] = useState('5');
  const [formCostoUnitario, setFormCostoUnitario] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal: Registrar Entrada / Salida
  const [movementModal, setMovementModal] = useState<{
    tipo: 'Entrada' | 'Salida';
    refaccion: Refaccion;
  } | null>(null);
  const [movCantidad, setMovCantidad] = useState('1');
  const [movMotivo, setMovMotivo] = useState('');
  const [movError, setMovError] = useState('');

  // Modal: Ver Movimientos
  const [viewingHistoryRefaccion, setViewingHistoryRefaccion] = useState<Refaccion | null>(null);

  // Action processing lock
  const [isProcessing, setIsProcessing] = useState(false);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingRefaccion(null);
    setFormCodigo('');
    setFormNombre('');
    setFormExistencias('0');
    setFormMinimo('5');
    setFormCostoUnitario('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (ref: Refaccion) => {
    setEditingRefaccion(ref);
    setFormCodigo(ref.codigo);
    setFormNombre(ref.nombre);
    setFormExistencias(ref.existencias.toString());
    setFormMinimo(ref.minimo.toString());
    setFormCostoUnitario(ref.costoUnitario !== undefined ? ref.costoUnitario.toString() : '');
    setFormErrors({});
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanCodigo = formCodigo.trim().toUpperCase();
    if (!cleanCodigo) {
      errors.codigo = 'El código de la refacción es obligatorio.';
    } else {
      const isDuplicate = refacciones.some(
        (r) => r.codigo.toUpperCase() === cleanCodigo && (!editingRefaccion || r.id !== editingRefaccion.id)
      );
      if (isDuplicate) {
        errors.codigo = 'Ya existe una refacción con este código.';
      }
    }

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre de la refacción es obligatorio.';
    }

    const minVal = parseInt(formMinimo, 10);
    if (isNaN(minVal) || minVal < 0) {
      errors.minimo = 'La cantidad mínima debe ser un número entero mayor o igual a 0.';
    }

    let existVal = 0;
    if (!editingRefaccion) {
      existVal = parseInt(formExistencias, 10);
      if (isNaN(existVal) || existVal < 0) {
        errors.existencias = 'La existencia inicial debe ser un número entero mayor o igual a 0.';
      }
    }

    let costoVal: number | undefined = undefined;
    if (formCostoUnitario.trim()) {
      const parsedCosto = parseFloat(formCostoUnitario);
      if (isNaN(parsedCosto) || parsedCosto < 0) {
        errors.costoUnitario = 'El costo unitario no puede ser negativo.';
      } else {
        costoVal = Math.round(parsedCosto * 100) / 100;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingRefaccion) {
      // Editing updates fields without directly overwriting existencias
      const updated: Refaccion = {
        ...editingRefaccion,
        codigo: cleanCodigo,
        nombre: formNombre.trim(),
        minimo: minVal,
        costoUnitario: costoVal,
      };
      onSaveRefaccion(updated);
    } else {
      const newId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRef: Refaccion = {
        id: newId,
        codigo: cleanCodigo,
        nombre: formNombre.trim(),
        existencias: existVal,
        minimo: minVal,
        costoUnitario: costoVal,
        creadoEn: new Date().toISOString(),
      };

      let initialMovement: MovimientoInventario | undefined = undefined;
      if (existVal > 0) {
        initialMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          refaccionId: newId,
          tipo: 'Entrada',
          cantidad: existVal,
          motivo: 'Inventario inicial',
          fechaHora: new Date().toLocaleString('es-MX'),
        };
      }

      onSaveRefaccion(newRef, initialMovement);
    }

    setIsFormModalOpen(false);
  };

  // Open Movement modal (Entrada o Salida)
  const handleOpenMovementModal = (ref: Refaccion, tipo: 'Entrada' | 'Salida') => {
    setMovementModal({ tipo, refaccion: ref });
    setMovCantidad('1');
    setMovMotivo(tipo === 'Entrada' ? 'Compra / Reabastecimiento' : 'Uso en taller / Ajuste');
    setMovError('');
    setOpenMenuId(null);
  };

  // Confirm Movement
  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal || isProcessing) return;

    const cant = parseInt(movCantidad, 10);
    if (isNaN(cant) || cant <= 0) {
      setMovError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    if (movementModal.tipo === 'Salida' && cant > movementModal.refaccion.existencias) {
      setMovError(
        `La salida no puede superar las existencias disponibles (${movementModal.refaccion.existencias} piezas).`
      );
      return;
    }

    if (!movMotivo.trim()) {
      setMovError('Debe ingresar un motivo para el movimiento.');
      return;
    }

    setIsProcessing(true);
    const mov: MovimientoInventario = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId: movementModal.refaccion.id,
      tipo: movementModal.tipo,
      cantidad: cant,
      motivo: movMotivo.trim(),
      fechaHora: new Date().toLocaleString('es-MX'),
    };

    onRecordMovement(mov);
    setIsProcessing(false);
    setMovementModal(null);
  };

  // Filtered refacciones
  const filteredRefacciones = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return refacciones.filter((r) => {
      if (filterStock === 'stock-bajo' && r.existencias >= r.minimo) {
        return false;
      }

      if (q) {
        const codMatch = r.codigo.toLowerCase().includes(q);
        const nomMatch = r.nombre.toLowerCase().includes(q);
        return codMatch || nomMatch;
      }

      return true;
    });
  }, [refacciones, searchQuery, filterStock]);

  // Movements of selected refaccion for history modal
  const selectedRefaccionMovements = useMemo(() => {
    if (!viewingHistoryRefaccion) return [];
    return movimientos
      .filter((m) => m.refaccionId === viewingHistoryRefaccion.id)
      .sort((a, b) => (b.id > a.id ? 1 : -1));
  }, [movimientos, viewingHistoryRefaccion]);

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies para Catálogos e Inventario */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE] shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
              Inventario de refacciones
            </h2>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Control de existencias, cantidades mínimas y registro de movimientos de refacciones.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar refacción</span>
        </button>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#DDE4E8] text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilterStock('todas')}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterStock === 'todas' ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold' : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Todas ({refacciones.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStock('stock-bajo')}
            className={`px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterStock === 'stock-bajo' ? 'bg-[#1D7EAE] text-white shadow-xs font-semibold' : 'text-[#5F6B73] hover:text-[#231F20]'
            }`}
          >
            Stock bajo ({refacciones.filter((r) => r.existencias < r.minimo).length})
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
                <th className="py-3.5 px-5">Código</th>
                <th className="py-3.5 px-5">Nombre de la refacción</th>
                <th className="py-3.5 px-5 text-center">Existencias</th>
                <th className="py-3.5 px-5 text-center">Mínimo</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRefacciones.length > 0 ? (
                filteredRefacciones.map((ref) => {
                  const isLowStock = ref.existencias < ref.minimo;
                  const isMenuOpen = openMenuId === ref.id;

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Código */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded text-xs border border-emerald-200">
                          {ref.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#231F20]">{ref.nombre}</div>
                        {ref.costoUnitario !== undefined && (
                          <div className="text-xs text-[#5F6B73] mt-0.5">
                            Costo base: ${ref.costoUnitario.toFixed(2)} MXN
                          </div>
                        )}
                      </td>

                      {/* Existencias */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            isLowStock ? 'text-amber-700 font-extrabold' : 'text-slate-800'
                          }`}
                        >
                          {ref.existencias} pzs
                        </span>
                      </td>

                      {/* Cantidad mínima */}
                      <td className="py-3.5 px-5 text-center text-slate-600 whitespace-nowrap">
                        {ref.minimo} pzs
                      </td>

                      {/* Etiqueta discreta Stock bajo */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-50 text-[#FF661B] border border-orange-200">
                            <AlertTriangle className="w-3 h-3 text-[#FF661B]" />
                            <span>Stock bajo</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Botón Editar y Más opciones */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ref)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {/* Más opciones */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : ref.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="Más opciones"
                              aria-label="Más opciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMovementModal(ref, 'Entrada')}
                                    className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                    <span>Registrar entrada</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenMovementModal(ref, 'Salida')}
                                    className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                    <span>Registrar salida</span>
                                  </button>

                                  <div className="border-t border-slate-100 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingHistoryRefaccion(ref);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <History className="w-4 h-4 text-slate-500" />
                                    <span>Ver movimientos</span>
                                  </button>
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
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchQuery
                      ? 'No se encontraron refacciones que coincidan con la búsqueda.'
                      : filterStock === 'stock-bajo'
                      ? 'No hay refacciones con stock bajo en este momento.'
                      : 'No hay refacciones registradas en el inventario.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Bloques legibles sin scroll horizontal */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredRefacciones.length > 0 ? (
            filteredRefacciones.map((ref) => {
              const isLowStock = ref.existencias < ref.minimo;
              const isMenuOpen = openMenuId === ref.id;

              return (
                <div key={ref.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                          {ref.codigo}
                        </span>
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-orange-50 text-[#FF661B] border border-orange-200">
                            <AlertTriangle className="w-3 h-3 text-[#FF661B]" />
                            <span>Stock bajo</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{ref.nombre}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Existencias: <strong className={`font-bold ${isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>{ref.existencias} pzs</strong> (Mínimo: {ref.minimo} pzs)
                      </p>
                      {ref.costoUnitario !== undefined && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Costo: ${ref.costoUnitario.toFixed(2)} MXN
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ref)}
                        className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-[#5F6B73] hover:text-[#231F20] bg-white hover:bg-slate-50 border border-[#DDE4E8] rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : ref.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 rounded-lg"
                          aria-label="Más opciones"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => handleOpenMovementModal(ref, 'Entrada')}
                                className="w-full px-3 py-2.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                <span>Registrar entrada</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenMovementModal(ref, 'Salida')}
                                className="w-full px-3 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                <span>Registrar salida</span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setViewingHistoryRefaccion(ref);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <History className="w-4 h-4 text-slate-500" />
                                <span>Ver movimientos</span>
                              </button>
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
                ? 'No se encontraron refacciones que coincidan con la búsqueda.'
                : filterStock === 'stock-bajo'
                ? 'No hay refacciones con stock bajo en este momento.'
                : 'No hay refacciones registradas en el inventario.'}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: FORMULARIO AGREGAR / EDITAR REFACCIÓN */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRefaccion ? `Editar refacción (${editingRefaccion.codigo})` : 'Agregar refacción'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingRefaccion
                    ? 'Actualiza los datos de la refacción.'
                    : 'Registra una nueva refacción en el inventario.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const dirty =
                    formCodigo.trim() !== (editingRefaccion?.codigo || '') ||
                    formNombre.trim() !== (editingRefaccion?.nombre || '') ||
                    formMinimo !== (editingRefaccion?.minimo?.toString() || '3') ||
                    formCostoUnitario !== (editingRefaccion?.costoUnitario !== undefined ? editingRefaccion.costoUnitario.toString() : '');
                  if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                    return;
                  }
                  setIsFormModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-sm">
              {/* Código */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de refacción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ej. REF-010 o FIL-ACE-01"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm uppercase font-mono text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.codigo ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.codigo && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.codigo}</p>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1">
                  Nombre de la refacción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Filtro de aire para motor"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Existencia inicial (Solo al crear) */}
              {!editingRefaccion ? (
                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1">
                    Existencia inicial (piezas) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formExistencias}
                    onChange={(e) => setFormExistencias(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                      formErrors.existencias ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                    }`}
                  />
                  {formErrors.existencias && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.existencias}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Número de piezas disponibles al dar de alta la refacción.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-[#DDE4E8] rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Existencias actuales:</span>
                    <strong className="text-slate-900">{editingRefaccion.existencias} pzs</strong>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Las existencias se modifican mediante “Registrar entrada” o “Registrar salida” en Más opciones.
                  </p>
                </div>
              )}

              {/* Cantidad mínima */}
              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1">
                  Cantidad mínima para alerta de stock bajo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formMinimo}
                  onChange={(e) => setFormMinimo(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.minimo ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.minimo && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.minimo}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Si las existencias caen por debajo de este valor, se mostrará la etiqueta “Stock bajo”.
                </p>
              </div>

              {/* Costo unitario opcional */}
              <div>
                <label className="block text-xs font-semibold text-[#231F20] mb-1">
                  Costo unitario ($ MXN) <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formCostoUnitario}
                  onChange={(e) => setFormCostoUnitario(e.target.value)}
                  placeholder="Ej. 180.50"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 ${
                    formErrors.costoUnitario ? 'border-red-400 bg-red-50/20' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.costoUnitario && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.costoUnitario}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const dirty =
                      formCodigo.trim() !== (editingRefaccion?.codigo || '') ||
                      formNombre.trim() !== (editingRefaccion?.nombre || '') ||
                      formMinimo !== (editingRefaccion?.minimo?.toString() || '3') ||
                      formCostoUnitario !== (editingRefaccion?.costoUnitario !== undefined ? editingRefaccion.costoUnitario.toString() : '');
                    if (dirty && !window.confirm('¿Deseas descartar los cambios sin guardar?')) {
                      return;
                    }
                    setIsFormModalOpen(false);
                  }}
                  className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-sm font-medium text-[#5F6B73] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR ENTRADA / SALIDA */}
      {/* ======================================================== */}
      {movementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registrar {movementModal.tipo.toLowerCase()}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {movementModal.refaccion.codigo} — {movementModal.refaccion.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovementModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMovement} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <span className="text-slate-600">Existencias actuales:</span>
                <span className="font-bold text-sm text-slate-900">
                  {movementModal.refaccion.existencias} pzs
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cantidad ({movementModal.tipo === 'Entrada' ? 'a ingresar' : 'a descontar'}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={movCantidad}
                  onChange={(e) => setMovCantidad(e.target.value)}
                  className="w-full p-2.5 border border-[#DDE4E8] rounded-lg text-[#231F20] text-sm focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo del movimiento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  placeholder="Ej. Compra de lote, ajuste de conteo, merma..."
                  className="w-full p-2.5 border border-[#DDE4E8] rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                />
              </div>

              {movError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {movError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovementModal(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-4 py-1.5 text-white rounded font-semibold transition-colors disabled:opacity-50 ${
                    movementModal.tipo === 'Entrada'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmar {movementModal.tipo.toLowerCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VER MOVIMIENTOS HISTÓRICOS */}
      {/* ======================================================== */}
      {viewingHistoryRefaccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Historial de movimientos
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {viewingHistoryRefaccion.codigo} — {viewingHistoryRefaccion.nombre} ({viewingHistoryRefaccion.existencias} pzs disponibles)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryRefaccion(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {selectedRefaccionMovements.length > 0 ? (
                <div className="space-y-2">
                  {selectedRefaccionMovements.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              m.tipo === 'Entrada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {m.tipo === 'Entrada' ? '+ ' : '- '}
                            {m.cantidad} pzs
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {m.motivo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.fechaHora}
                          {m.ordenId && ' • Orden vinculada'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-8">
                  No hay movimientos registrados para esta refacción.
                </p>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingHistoryRefaccion(null)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
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
