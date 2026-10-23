import React, { useState, useMemo } from 'react';
import {
  Refaccion,
  MovimientoInventario,
  OrdenCompra,
  OrdenTrabajo,
  Vehiculo,
  CompraRecomendadaIA,
} from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';
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
  ShoppingCart,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Car,
  Sparkles,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { EmptyState } from './EmptyState';
import { AnalisisInventarioModal } from './AnalisisInventarioModal';

interface InventarioSectionProps {
  refacciones: Refaccion[];
  movimientos: MovimientoInventario[];
  ordenesCompra?: OrdenCompra[];
  ordenesPendientes?: OrdenTrabajo[];
  vehiculos?: Vehiculo[];
  onSaveRefaccion: (refaccion: Refaccion, initialMovement?: MovimientoInventario) => void;
  onRecordMovement: (movement: MovimientoInventario) => void;
  onSaveOrdenCompra?: (ordenCompra: OrdenCompra) => void;
  onMarcarOrdenCompraRecibida?: (ordenCompraId: string) => void;
  onOpenCopiloto?: () => void;
}

type FilterStock = 'todas' | 'stock-bajo';

export const InventarioSection: React.FC<InventarioSectionProps> = ({
  refacciones,
  movimientos,
  ordenesCompra = [],
  ordenesPendientes = [],
  vehiculos = [],
  onSaveRefaccion,
  onRecordMovement,
  onSaveOrdenCompra,
  onMarcarOrdenCompraRecibida,
  onOpenCopiloto,
}) => {
  const [activeTab, setActiveTab] = useState<'existencias' | 'stock-bajo' | 'movimientos' | 'ordenes-compra'>('existencias');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedRefaccionDetail, setSelectedRefaccionDetail] = useState<Refaccion | null>(null);

  // Modal: Análisis de inventario con IA
  const [isAnalisisModalOpen, setIsAnalisisModalOpen] = useState(false);

  // Modal: Add / Edit Refacción
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRefaccion, setEditingRefaccion] = useState<Refaccion | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formExistencias, setFormExistencias] = useState('0');
  const [formMinimo, setFormMinimo] = useState('5');
  const [formPrecioCompra, setFormPrecioCompra] = useState('');
  const [formPrecioVenta, setFormPrecioVenta] = useState('');
  const [formProveedor, setFormProveedor] = useState('');
  const [formTelefonoProveedor, setFormTelefonoProveedor] = useState('');
  const [formDiasEntrega, setFormDiasEntrega] = useState('2');
  const [formFechaUltimaCompra, setFormFechaUltimaCompra] = useState('');
  const [formCompatibilidad, setFormCompatibilidad] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal: Generar Orden de Compra
  const [isOrdenCompraModalOpen, setIsOrdenCompraModalOpen] = useState(false);
  const [ocTargetRefaccion, setOcTargetRefaccion] = useState<Refaccion | null>(null);
  const [ocCantidad, setOcCantidad] = useState('1');
  const [ocProveedor, setOcProveedor] = useState('');
  const [ocTelefono, setOcTelefono] = useState('');
  const [ocCostoUnitario, setOcCostoUnitario] = useState('');
  const [ocFecha, setOcFecha] = useState('');
  const [ocNotas, setOcNotas] = useState('');
  const [ocErrors, setOcErrors] = useState<Record<string, string>>({});

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
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal Dismiss Hooks
  const refaccionFormDismiss = useModalDismiss({
    isOpen: isFormModalOpen,
    onClose: () => {
      setIsFormModalOpen(false);
      setEditingRefaccion(null);
      setFormErrors({});
    },
    closeOnBackdrop: true,
  });

  const ordenCompraModalDismiss = useModalDismiss({
    isOpen: isOrdenCompraModalOpen,
    onClose: () => {
      setIsOrdenCompraModalOpen(false);
      setOcTargetRefaccion(null);
      setOcErrors({});
    },
    closeOnBackdrop: true,
  });

  const movementDismiss = useModalDismiss({
    isOpen: Boolean(movementModal),
    onClose: () => {
      setMovementModal(null);
      setMovError('');
    },
    closeOnBackdrop: true,
  });

  const historyDismiss = useModalDismiss({
    isOpen: Boolean(viewingHistoryRefaccion),
    onClose: () => setViewingHistoryRefaccion(null),
    closeOnBackdrop: true,
  });

  const detailDismiss = useModalDismiss({
    isOpen: Boolean(selectedRefaccionDetail),
    onClose: () => setSelectedRefaccionDetail(null),
    closeOnBackdrop: true,
  });

  const refaccionMap = useMemo(() => new Map(refacciones.map((r) => [r.id, r])), [refacciones]);

  // Financial KPI calculations for Inventory Valuation
  const totalPiezasEnStock = useMemo(() => {
    return refacciones.reduce((sum, r) => sum + r.existencias, 0);
  }, [refacciones]);

  const valorTotalCosto = useMemo(() => {
    return refacciones.reduce((sum, r) => {
      const costo = r.precioCompra || r.costoUnitario || 0;
      return sum + r.existencias * costo;
    }, 0);
  }, [refacciones]);

  const valorTotalVenta = useMemo(() => {
    return refacciones.reduce((sum, r) => {
      const venta = r.precioVenta || (r.precioCompra || r.costoUnitario || 0) * 1.4;
      return sum + r.existencias * venta;
    }, 0);
  }, [refacciones]);

  const gananciaPotencialTotal = useMemo(() => {
    return Math.max(0, valorTotalVenta - valorTotalCosto);
  }, [valorTotalVenta, valorTotalCosto]);

  const lowStockCount = useMemo(() => {
    return refacciones.filter((r) => r.existencias < r.minimo).length;
  }, [refacciones]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingRefaccion(null);
    setFormCodigo('');
    setFormNombre('');
    setFormExistencias('0');
    setFormMinimo('5');
    setFormPrecioCompra('');
    setFormPrecioVenta('');
    setFormProveedor('');
    setFormTelefonoProveedor('');
    setFormDiasEntrega('2');
    setFormFechaUltimaCompra(new Date().toISOString().split('T')[0]);
    setFormCompatibilidad('');
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
    setFormPrecioCompra((ref.precioCompra ?? ref.costoUnitario ?? '').toString());
    setFormPrecioVenta((ref.precioVenta ?? '').toString());
    setFormProveedor(ref.proveedor || '');
    setFormTelefonoProveedor(ref.telefonoProveedor || '');
    setFormDiasEntrega((ref.diasEntregaEstimados ?? 2).toString());
    setFormFechaUltimaCompra(ref.fechaUltimaCompra || '');
    setFormCompatibilidad(ref.compatibilidad || '');
    setFormErrors({});
    setOpenMenuId(null);
    setIsFormModalOpen(true);
  };

  // Open Generar Orden de Compra modal
  const handleOpenOrdenCompra = (ref: Refaccion) => {
    setOcTargetRefaccion(ref);
    // Suggest quantity according to current stock vs minimum
    let sugerida = 5;
    if (ref.existencias < ref.minimo) {
      sugerida = Math.max(1, ref.minimo * 2 - ref.existencias);
    } else {
      sugerida = Math.max(1, ref.minimo);
    }

    setOcCantidad(sugerida.toString());
    setOcProveedor(ref.proveedor || 'Proveedor General');
    setOcTelefono(ref.telefonoProveedor || '');
    setOcCostoUnitario((ref.precioCompra || ref.costoUnitario || 100).toString());
    setOcFecha(new Date().toISOString().split('T')[0]);
    setOcNotas('');
    setOcErrors({});
    setOpenMenuId(null);
    setIsOrdenCompraModalOpen(true);
  };

  // Crear borrador de Orden de Compra desde sugerencia de IA
  const handleCrearOrdenCompraDesdeIA = (compra: CompraRecomendadaIA) => {
    const targetRef = refacciones.find((r) => r.id === compra.refaccionId) || null;
    if (onSaveOrdenCompra) {
      const nextFolioNum = ordenesCompra.length + 1;
      const folio = `OC-${String(nextFolioNum).padStart(3, '0')}`;
      const nuevaOC: OrdenCompra = {
        id: `oc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        folio,
        refaccionId: compra.refaccionId,
        refaccionNombre: compra.nombre,
        refaccionCodigo: compra.codigo,
        cantidad: compra.cantidadSugerida,
        proveedor: compra.proveedorSugerido || 'Proveedor sin asignar',
        telefonoProveedor: compra.telefonoProveedor || '',
        fecha: new Date().toISOString().split('T')[0],
        costoUnitario: compra.precioCompraEstimado,
        total: compra.cantidadSugerida * compra.precioCompraEstimado,
        estado: 'Pendiente', // Queda como borrador pendiente hasta confirmación del usuario
        notas: `[Sugerido por IA - Prioridad: ${compra.prioridad.toUpperCase()}] ${compra.motivo}`,
        creadoEn: new Date().toISOString(),
      };
      onSaveOrdenCompra(nuevaOC);
    } else {
      // Fallback: abrir modal de orden de compra precargado
      if (targetRef) {
        setOcTargetRefaccion(targetRef);
        setOcCantidad(compra.cantidadSugerida.toString());
        setOcProveedor(compra.proveedorSugerido || targetRef.proveedor || 'Proveedor General');
        setOcTelefono(compra.telefonoProveedor || targetRef.telefonoProveedor || '');
        setOcCostoUnitario(compra.precioCompraEstimado.toString());
        setOcFecha(new Date().toISOString().split('T')[0]);
        setOcNotas(`[Sugerido por IA - ${compra.prioridad.toUpperCase()}] ${compra.motivo}`);
        setOcErrors({});
        setIsOrdenCompraModalOpen(true);
      }
    }
  };

  const handleVerRefaccionDesdeIA = (refaccionId: string) => {
    const ref = refacciones.find((r) => r.id === refaccionId);
    if (ref) {
      handleOpenEdit(ref);
    }
  };

  // Save Add / Edit Refacción
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

    const compraVal = parseFloat(formPrecioCompra);
    if (isNaN(compraVal) || compraVal < 0) {
      errors.precioCompra = 'El precio de compra debe ser un número mayor o igual a 0.';
    }

    const ventaVal = parseFloat(formPrecioVenta);
    if (isNaN(ventaVal) || ventaVal < 0) {
      errors.precioVenta = 'El precio de venta debe ser un número mayor o igual a 0.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanCompra = Math.round(compraVal * 100) / 100;
    const cleanVenta = Math.round(ventaVal * 100) / 100;

    if (editingRefaccion) {
      const updated: Refaccion = {
        ...editingRefaccion,
        codigo: cleanCodigo,
        nombre: formNombre.trim(),
        minimo: minVal,
        costoUnitario: cleanCompra,
        precioCompra: cleanCompra,
        precioVenta: cleanVenta,
        proveedor: formProveedor.trim() || undefined,
        telefonoProveedor: formTelefonoProveedor.trim() || undefined,
        diasEntregaEstimados: parseInt(formDiasEntrega, 10) || undefined,
        fechaUltimaCompra: formFechaUltimaCompra || undefined,
        compatibilidad: formCompatibilidad.trim() || undefined,
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
        costoUnitario: cleanCompra,
        precioCompra: cleanCompra,
        precioVenta: cleanVenta,
        proveedor: formProveedor.trim() || undefined,
        telefonoProveedor: formTelefonoProveedor.trim() || undefined,
        diasEntregaEstimados: parseInt(formDiasEntrega, 10) || undefined,
        fechaUltimaCompra: formFechaUltimaCompra || undefined,
        compatibilidad: formCompatibilidad.trim() || undefined,
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

  // Submit Generar Orden de Compra
  const handleSaveOrdenCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocTargetRefaccion) return;

    const errors: Record<string, string> = {};
    const cantVal = parseInt(ocCantidad, 10);
    if (isNaN(cantVal) || cantVal <= 0) {
      errors.cantidad = 'Ingresa una cantidad mayor a 0.';
    }

    if (!ocProveedor.trim()) {
      errors.proveedor = 'El nombre del proveedor es obligatorio.';
    }

    const unitCost = parseFloat(ocCostoUnitario);
    if (isNaN(unitCost) || unitCost < 0) {
      errors.costoUnitario = 'El costo unitario no puede ser negativo.';
    }

    if (Object.keys(errors).length > 0) {
      setOcErrors(errors);
      return;
    }

    const cleanUnitCost = Math.round(unitCost * 100) / 100;
    const totalVal = Math.round(cantVal * cleanUnitCost * 100) / 100;

    const count = ordenesCompra.length + 1;
    const folioStr = `OC-${String(count).padStart(3, '0')}`;

    const newOc: OrdenCompra = {
      id: `oc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: folioStr,
      refaccionId: ocTargetRefaccion.id,
      refaccionNombre: ocTargetRefaccion.nombre,
      refaccionCodigo: ocTargetRefaccion.codigo,
      cantidad: cantVal,
      proveedor: ocProveedor.trim(),
      telefonoProveedor: ocTelefono.trim() || undefined,
      fecha: ocFecha || new Date().toISOString().split('T')[0],
      costoUnitario: cleanUnitCost,
      total: totalVal,
      estado: 'Pendiente',
      notas: ocNotas.trim() || undefined,
      creadoEn: new Date().toISOString(),
    };

    if (onSaveOrdenCompra) {
      onSaveOrdenCompra(newOc);
    }

    setIsOrdenCompraModalOpen(false);
    setActiveTab('ordenes-compra');
  };

  // Movement modals
  const handleOpenMovementModal = (ref: Refaccion, tipo: 'Entrada' | 'Salida') => {
    setMovementModal({ tipo, refaccion: ref });
    setMovCantidad('1');
    setMovMotivo(tipo === 'Entrada' ? 'Compra / Reabastecimiento' : 'Uso en taller / Ajuste');
    setMovError('');
    setOpenMenuId(null);
  };

  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal || isProcessing) return;

    const cant = parseInt(movCantidad, 10);
    if (isNaN(cant) || cant <= 0) {
      setMovError('Ingresa una cantidad válida mayor a 0.');
      return;
    }

    if (movementModal.tipo === 'Salida' && cant > movementModal.refaccion.existencias) {
      setMovError(`Existencias insuficientes (actual: ${movementModal.refaccion.existencias} pzs).`);
      return;
    }

    setIsProcessing(true);
    const mov: MovimientoInventario = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      refaccionId: movementModal.refaccion.id,
      tipo: movementModal.tipo,
      cantidad: cant,
      motivo: movMotivo.trim() || (movementModal.tipo === 'Entrada' ? 'Entrada manual' : 'Salida manual'),
      fechaHora: new Date().toLocaleString('es-MX'),
    };

    onRecordMovement(mov);
    setIsProcessing(false);
    setMovementModal(null);
  };

  const isAnyFilterActive = Boolean(searchQuery.trim() || activeTab !== 'existencias');

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveTab('existencias');
  };

  // Filtered refacciones
  const filteredRefacciones = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return refacciones.filter((r) => {
      if (activeTab === 'stock-bajo' && r.existencias >= r.minimo) {
        return false;
      }

      if (q) {
        const codMatch = r.codigo.toLowerCase().includes(q);
        const nomMatch = r.nombre.toLowerCase().includes(q);
        const provMatch = r.proveedor?.toLowerCase().includes(q);
        const compMatch = r.compatibilidad?.toLowerCase().includes(q);
        return codMatch || nomMatch || provMatch || compMatch;
      }

      return true;
    });
  }, [refacciones, searchQuery, activeTab]);

  const filteredMovimientos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return movimientos.filter((m) => {
      if (!q) return true;
      const ref = refaccionMap.get(m.refaccionId);
      const matchRef = ref ? (ref.nombre.toLowerCase().includes(q) || ref.codigo.toLowerCase().includes(q)) : false;
      const matchMotivo = m.motivo ? m.motivo.toLowerCase().includes(q) : false;
      return matchRef || matchMotivo || m.tipo.toLowerCase().includes(q);
    });
  }, [movimientos, searchQuery, refaccionMap]);

  return (
    <section className="space-y-5">
      {/* Encabezado uniforme TUNNO */}
      <div className="no-print">
        <SectionHeader
          icon={<Package className="w-5 h-5 text-[#1497F2]" />}
          title="Inventario"
          description="Control de existencias, stock bajo, movimientos y órdenes de compra."
          primaryAction={{
            label: 'Agregar refacción',
            icon: <Plus className="w-4 h-4" />,
            onClick: handleOpenAdd,
          }}
          secondaryActions={[
            {
              label: 'Analizar inventario con IA',
              icon: <Sparkles className="w-4 h-4 text-[#1497F2]" />,
              variant: 'ai',
              onClick: () => setIsAnalisisModalOpen(true),
            },
            ...(onOpenCopiloto
              ? [
                  {
                    label: 'Ayudarme con IA',
                    icon: <Sparkles className="w-4 h-4 text-[#1497F2]" />,
                    variant: 'ai' as const,
                    onClick: onOpenCopiloto,
                  },
                ]
              : []),
            {
              label: 'Nueva orden de compra',
              icon: <ShoppingCart className="w-4 h-4" />,
              onClick: () => {
                if (refacciones.length > 0) {
                  handleOpenOrdenCompra(refacciones[0]);
                }
              },
            },
          ]}
        />
      </div>

      {/* KPI Cards: Valuación discreta e indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Existencias</span>
            <Package className="w-3.5 h-3.5 text-[#1497F2]" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#06345A] font-mono">{totalPiezasEnStock} pzs</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">{refacciones.length} refacciones</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Valor al costo</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#06345A] font-mono">
            ${valorTotalCosto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Inversión en almacén</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Valor de venta</span>
            <Tag className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-[#1497F2] font-mono">
            ${valorTotalVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">+${gananciaPotencialTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })} margen</div>
        </div>

        <div className={`bg-white border ${lowStockCount > 0 ? 'border-amber-200' : 'border-[#E5E7EB]'} rounded-xl p-3.5 shadow-xs`}>
          <div className="flex items-center justify-between text-[#6B7280] text-xs font-medium mb-1">
            <span>Stock bajo</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${lowStockCount > 0 ? 'text-amber-700' : 'text-[#06345A]'}`}>
            {lowStockCount} items
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Por debajo del mínimo</div>
        </div>
      </div>

      {/* Barra uniforme de pestañas y búsqueda */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Pestañas: Existencias, Stock bajo, Movimientos, Órdenes de compra */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('existencias')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'existencias'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Existencias</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {refacciones.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stock-bajo')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stock-bajo'
                  ? 'bg-white text-amber-800 shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Stock bajo</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('movimientos')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'movimientos'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Movimientos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {movimientos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ordenes-compra')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ordenes-compra'
                  ? 'bg-white text-[#06345A] shadow-xs font-bold'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
              <span>Órdenes de compra</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {ordenesCompra.length}
              </span>
            </button>
          </div>

          {/* Buscador + Limpiar filtros */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'movimientos'
                    ? 'Buscar movimiento...'
                    : activeTab === 'ordenes-compra'
                    ? 'Buscar orden de compra...'
                    : 'Buscar código o refacción...'
                }
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#06345A] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] transition-all"
              />
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumen de conteo */}
        <div className="text-[11px] text-[#6B7280] pt-1 border-t border-slate-100 flex items-center justify-between">
          <span>
            {activeTab === 'movimientos'
              ? `Mostrando ${filteredMovimientos.length} de ${movimientos.length} movimientos`
              : activeTab === 'ordenes-compra'
              ? `Mostrando ${ordenesCompra.length} órdenes de compra`
              : `Mostrando ${filteredRefacciones.length} de ${refacciones.length} refacciones`}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1 Y 2: EXISTENCIAS Y STOCK BAJO */}
      {/* ======================================================== */}
      {(activeTab === 'existencias' || activeTab === 'stock-bajo') && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden no-print">
          {filteredRefacciones.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Nombre</th>
                      <th className="py-3.5 px-3 text-center">Existencia actual</th>
                      <th className="py-3.5 px-3 text-center">Mínimo</th>
                      <th className="py-3.5 px-4 text-right">Precio</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRefacciones.map((ref) => {
                      const isLowStock = ref.existencias < ref.minimo;
                      const compra = ref.precioCompra || ref.costoUnitario || 0;
                      const venta = ref.precioVenta || compra * 1.4;
                      const isMenuOpen = openMenuId === ref.id;

                      return (
                        <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Código */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded text-xs border border-emerald-200">
                              {ref.codigo}
                            </span>
                          </td>

                          {/* Nombre */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-xs">{ref.nombre}</div>
                            {ref.compatibilidad && (
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs" title={ref.compatibilidad}>
                                {ref.compatibilidad}
                              </div>
                            )}
                          </td>

                          {/* Existencia actual */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span className={`font-bold text-sm ${isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                                {ref.existencias} pzs
                              </span>
                              {isLowStock && (
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200" title="Stock por debajo del mínimo">
                                  Bajo
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Mínimo */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-600 font-mono">
                            {ref.minimo} pzs
                          </td>

                          {/* Precio */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-[#1497F2] text-xs">
                              ${venta.toFixed(2)}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              Costo: ${compra.toFixed(2)}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedRefaccionDetail(ref)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#06345A] border border-[#73C7FF]/60 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                title="Ver detalle de refacción"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#1497F2]" />
                                <span>Ver detalle</span>
                              </button>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(isMenuOpen ? null : ref.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                  title="Más opciones"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {isMenuOpen && (
                                  <>
                                    <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-left text-xs font-medium animate-in fade-in duration-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleOpenMovementModal(ref, 'Entrada');
                                        }}
                                        className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                        <span>Registrar entrada</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleOpenMovementModal(ref, 'Salida');
                                        }}
                                        className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                        <span>Registrar salida</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleOpenOrdenCompra(ref);
                                        }}
                                        className="w-full px-3 py-2 text-[#1497F2] hover:bg-sky-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ShoppingCart className="w-4 h-4 text-[#1497F2]" />
                                        <span>Pedir orden de compra</span>
                                      </button>
                                      <div className="border-t border-slate-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleOpenEdit(ref);
                                        }}
                                        className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Pencil className="w-4 h-4 text-slate-400" />
                                        <span>Editar refacción</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredRefacciones.map((ref) => {
                  const isLowStock = ref.existencias < ref.minimo;
                  const compra = ref.precioCompra || ref.costoUnitario || 0;
                  const venta = ref.precioVenta || compra * 1.4;

                  return (
                    <div key={ref.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                              {ref.codigo}
                            </span>
                            {isLowStock && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Stock bajo
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{ref.nombre}</h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedRefaccionDetail(ref)}
                          className="px-3 py-1.5 bg-sky-50 text-[#1497F2] font-semibold rounded-lg text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalle</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Existencia</span>
                          <span className={`font-bold ${isLowStock ? 'text-amber-700' : 'text-slate-800'}`}>
                            {ref.existencias} pzs
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Mínimo</span>
                          <span className="text-slate-700 font-mono">{ref.minimo} pzs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio</span>
                          <span className="font-mono font-bold text-[#1497F2]">${venta.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Package className="w-8 h-8 text-[#1497F2]" />}
                title={activeTab === 'stock-bajo' ? 'Niveles de stock óptimos' : 'No se encontraron refacciones'}
                description={
                  activeTab === 'stock-bajo'
                    ? 'No hay piezas con existencias por debajo del mínimo en este momento.'
                    : searchQuery
                    ? 'No hay registros que coincidan con la búsqueda ingresada.'
                    : 'Registra tus refacciones para controlar inventario, costos y compras.'
                }
                action={
                  activeTab !== 'stock-bajo'
                    ? {
                        label: 'Agregar refacción',
                        onClick: handleOpenAdd,
                        icon: <Plus className="w-4 h-4" />,
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: MOVIMIENTOS HISTÓRICOS */}
      {/* ======================================================== */}
      {activeTab === 'movimientos' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden no-print">
          {filteredMovimientos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Fecha y hora</th>
                    <th className="py-3.5 px-4">Refacción</th>
                    <th className="py-3.5 px-3 text-center">Cantidad</th>
                    <th className="py-3.5 px-4">Motivo / Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovimientos.map((m) => {
                    const ref = refaccionMap.get(m.refaccionId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              m.tipo === 'Entrada'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {m.tipo === 'Entrada' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>{m.tipo}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono">
                          {m.fechaHora}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{ref ? ref.nombre : 'Refacción'}</div>
                          {ref && (
                            <span className="font-mono text-[10px] text-slate-400">{ref.codigo}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-800 font-mono whitespace-nowrap">
                          {m.tipo === 'Entrada' ? `+${m.cantidad}` : `-${m.cantidad}`} pzs
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.motivo || 'Movimiento de inventario'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<History className="w-8 h-8 text-slate-400" />}
                title="Sin movimientos registrados"
                description="Los registros de entrada y salida de refacciones aparecerán listados aquí."
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 4: ÓRDENES DE COMPRA */}
      {/* ======================================================== */}
      {activeTab === 'ordenes-compra' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden no-print">
          {ordenesCompra.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#06345A]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Refacción</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Total ($)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordenesCompra.map((oc) => (
                    <tr key={oc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1497F2]">{oc.folio}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{oc.refaccionNombre}</div>
                        {oc.refaccionCodigo && (
                          <span className="font-mono text-[10px] text-slate-500">{oc.refaccionCodigo}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {oc.cantidad} pzs
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{oc.proveedor}</div>
                        {oc.telefonoProveedor && (
                          <div className="text-[11px] text-slate-500">{oc.telefonoProveedor}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{oc.fecha}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${oc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            oc.estado === 'Recibida'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {oc.estado === 'Recibida' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{oc.estado}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {oc.estado === 'Pendiente' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onMarcarOrdenCompraRecibida) {
                                onMarcarOrdenCompraRecibida(oc.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marcar recibida</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Ingresada a stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<ShoppingCart className="w-8 h-8 text-[#1497F2]" />}
                title="Sin órdenes de compra"
                description="Genera órdenes de compra a tus proveedores para reabastecer refacciones con stock bajo."
                action={{
                  label: 'Nueva orden de compra',
                  onClick: () => {
                    if (refacciones.length > 0) {
                      handleOpenOrdenCompra(refacciones[0]);
                    }
                  },
                  icon: <Plus className="w-4 h-4" />,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VER DETALLE DE REFACCIÓN */}
      {/* ======================================================== */}
      {selectedRefaccionDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={detailDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#06345A] font-heading">
                    {selectedRefaccionDetail.nombre}
                  </h3>
                  <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                    {selectedRefaccionDetail.codigo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={detailDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Existencias y Stock */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Existencias</span>
                  <span className={`text-base font-bold ${selectedRefaccionDetail.existencias < selectedRefaccionDetail.minimo ? 'text-amber-700' : 'text-slate-800'}`}>
                    {selectedRefaccionDetail.existencias} pzs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mínimo</span>
                  <span className="text-base font-bold text-slate-800">{selectedRefaccionDetail.minimo} pzs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Precio venta</span>
                  <span className="text-base font-bold text-[#1497F2]">
                    ${(selectedRefaccionDetail.precioVenta || (selectedRefaccionDetail.precioCompra || selectedRefaccionDetail.costoUnitario || 0) * 1.4).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Proveedor y entrega */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <span className="font-semibold text-slate-800 block text-xs">Datos de proveedor y entrega:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Proveedor:</span>
                    <strong className="text-slate-800">{selectedRefaccionDetail.proveedor || 'Sin proveedor'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Teléfono:</span>
                    <span>{selectedRefaccionDetail.telefonoProveedor || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tiempo de entrega:</span>
                    <span>{(selectedRefaccionDetail.diasEntregaEstimados || selectedRefaccionDetail.diasEntrega) ? `${selectedRefaccionDetail.diasEntregaEstimados || selectedRefaccionDetail.diasEntrega} días` : 'Inmediato'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Costo de compra:</span>
                    <span className="font-mono">${(selectedRefaccionDetail.precioCompra || selectedRefaccionDetail.costoUnitario || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Compatibilidad vehicular */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-800 block text-xs mb-1">Compatibilidad vehicular:</span>
                <p className="text-slate-600 text-[11px]">
                  {selectedRefaccionDetail.compatibilidad || 'Compatible con múltiples modelos genéricos.'}
                </p>
              </div>

              {/* Historial reciente de movimientos */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs">Historial de movimientos:</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {movimientos.filter((m) => m.refaccionId === selectedRefaccionDetail.id).length} movimientos
                  </span>
                </div>
                {movimientos.filter((m) => m.refaccionId === selectedRefaccionDetail.id).length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {movimientos
                      .filter((m) => m.refaccionId === selectedRefaccionDetail.id)
                      .slice(0, 5)
                      .map((m) => (
                        <div key={m.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {m.tipo === 'Entrada' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span className="font-medium text-slate-800">{m.tipo}: {m.cantidad} pzs</span>
                            <span className="text-slate-400 text-[10px]">• {m.motivo}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{m.fechaHora}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Sin movimientos recientes registrados.</p>
                )}
              </div>

              {/* Accesos rápidos */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenMovementModal(selectedRefaccionDetail, 'Entrada');
                    setSelectedRefaccionDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Registrar entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenMovementModal(selectedRefaccionDetail, 'Salida');
                    setSelectedRefaccionDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>Registrar salida</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenOrdenCompra(selectedRefaccionDetail);
                    setSelectedRefaccionDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#06345A] border border-[#73C7FF]/60 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#1497F2]" />
                  <span>Pedir a proveedor</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = selectedRefaccionDetail;
                  setSelectedRefaccionDetail(null);
                  handleOpenEdit(target);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar refacción</span>
              </button>
              <button
                type="button"
                onClick={detailDismiss.handleClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FORMULARIO AGREGAR / EDITAR REFACCIÓN */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto no-print"
          onClick={refaccionFormDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRefaccion ? `Editar refacción (${editingRefaccion.codigo})` : 'Agregar refacción'}
                </h3>
                <p className="text-xs text-slate-500">
                  Precios de compra y venta, proveedor y compatibilidad
                </p>
              </div>
              <button
                type="button"
                onClick={refaccionFormDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código de refacción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ej. FIL-ACE-01"
                    className={`w-full px-3 py-2 border rounded-lg uppercase font-mono text-[#06345A] bg-white ${
                      formErrors.codigo ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.codigo && <p className="text-red-600 mt-1">{formErrors.codigo}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre de la refacción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Filtro de aceite sintético"
                    className={`w-full px-3 py-2 border rounded-lg text-[#06345A] bg-white ${
                      formErrors.nombre ? 'border-red-400 bg-red-50/20' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {formErrors.nombre && <p className="text-red-600 mt-1">{formErrors.nombre}</p>}
                </div>
              </div>

              {/* Precios y costeo */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <div className="font-bold text-xs text-[#1497F2] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Costeo y precios por pieza</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Precio de compra ($ Costo) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formPrecioCompra}
                      onChange={(e) => setFormPrecioCompra(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white font-mono"
                    />
                    {formErrors.precioCompra && (
                      <p className="text-red-600 mt-1">{formErrors.precioCompra}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Precio de venta ($ Cliente) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formPrecioVenta}
                      onChange={(e) => setFormPrecioVenta(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white font-mono"
                    />
                    {formErrors.precioVenta && (
                      <p className="text-red-600 mt-1">{formErrors.precioVenta}</p>
                    )}
                  </div>
                </div>

                {/* Ganancia por pieza calculada en tiempo real */}
                {(() => {
                  const c = parseFloat(formPrecioCompra) || 0;
                  const v = parseFloat(formPrecioVenta) || 0;
                  const ganancia = v - c;
                  const margen = c > 0 ? Math.round((ganancia / c) * 100) : 0;
                  return (
                    <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-blue-200">
                      <span className="text-slate-600 font-medium">Ganancia por pieza estimada:</span>
                      <div className="font-mono font-bold text-emerald-700 flex items-center gap-2">
                        <span>+${ganancia.toFixed(2)} MXN</span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {margen}% margen
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Existencias y Mínimo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editingRefaccion ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Existencia inicial (piezas) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formExistencias}
                      onChange={(e) => setFormExistencias(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Existencias actuales</label>
                    <input
                      type="text"
                      disabled
                      value={`${editingRefaccion.existencias} pzs`}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cantidad mínima requerida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formMinimo}
                    onChange={(e) => setFormMinimo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Proveedor y Logística */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proveedor habitual</label>
                  <input
                    type="text"
                    value={formProveedor}
                    onChange={(e) => setFormProveedor(e.target.value)}
                    placeholder="Ej. Distribuidora Central"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono proveedor</label>
                  <input
                    type="text"
                    value={formTelefonoProveedor}
                    onChange={(e) => setFormTelefonoProveedor(e.target.value)}
                    placeholder="Ej. 555-123-4567"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Días estimados de entrega</label>
                  <input
                    type="number"
                    min="1"
                    value={formDiasEntrega}
                    onChange={(e) => setFormDiasEntrega(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha última compra</label>
                  <input
                    type="date"
                    value={formFechaUltimaCompra}
                    onChange={(e) => setFormFechaUltimaCompra(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Compatibilidad */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Compatibilidad vehicular (Marcas, modelos y años)
                </label>
                <textarea
                  rows={2}
                  value={formCompatibilidad}
                  onChange={(e) => setFormCompatibilidad(e.target.value)}
                  placeholder="Ej. Toyota Corolla 2018-2023, Nissan Versa 2019-2024, motor 1.6L - 2.0L"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={refaccionFormDismiss.handleClose}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg font-medium text-[#6B7280] hover:bg-slate-50 transition-colors min-h-[42px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold rounded-lg shadow-xs transition-colors min-h-[42px] cursor-pointer"
                >
                  Guardar refacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: GENERAR ORDEN DE COMPRA */}
      {/* ======================================================== */}
      {isOrdenCompraModalOpen && ocTargetRefaccion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto no-print"
          onClick={ordenCompraModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#1497F2]" />
                <h3 className="text-base font-bold text-slate-900">
                  Generar orden de compra
                </h3>
              </div>
              <button
                type="button"
                onClick={ordenCompraModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrdenCompra} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-bold text-slate-900">{ocTargetRefaccion.nombre}</div>
                <div className="text-slate-600 flex justify-between">
                  <span>Código: <strong>{ocTargetRefaccion.codigo}</strong></span>
                  <span>Stock actual: <strong>{ocTargetRefaccion.existencias} pzs</strong></span>
                </div>
                <div className="text-[11px] text-slate-500">Mínimo sugerido: {ocTargetRefaccion.minimo} pzs</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cantidad a comprar (sugerida automáticamente) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ocCantidad}
                  onChange={(e) => setOcCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg font-bold text-slate-900"
                />
                {ocErrors.cantidad && <p className="text-red-600 mt-1">{ocErrors.cantidad}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ocProveedor}
                    onChange={(e) => setOcProveedor(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
                  />
                  {ocErrors.proveedor && <p className="text-red-600 mt-1">{ocErrors.proveedor}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ocCostoUnitario}
                    onChange={(e) => setOcCostoUnitario(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de orden</label>
                  <input
                    type="date"
                    value={ocFecha}
                    onChange={(e) => setOcFecha(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={ocTelefono}
                    onChange={(e) => setOcTelefono(e.target.value)}
                    placeholder="555-000-0000"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
                  />
                </div>
              </div>

              {/* Total preview */}
              {(() => {
                const c = parseInt(ocCantidad, 10) || 0;
                const u = parseFloat(ocCostoUnitario) || 0;
                const tot = c * u;
                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-blue-900">Total de la orden:</span>
                    <span className="font-mono font-bold text-base text-[#1497F2]">
                      ${tot.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={ordenCompraModalDismiss.handleClose}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg font-medium text-[#6B7280]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold rounded-lg shadow-xs"
                >
                  Generar orden pendiente
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={movementDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {movementModal.tipo === 'Entrada' ? 'Registrar entrada' : 'Registrar salida'}
              </h3>
              <button
                type="button"
                onClick={movementDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMovement} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">{movementModal.refaccion.nombre}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Existencias actuales: {movementModal.refaccion.existencias} pzs
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad de piezas *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={movCantidad}
                  onChange={(e) => setMovCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo del movimiento</label>
                <input
                  type="text"
                  value={movMotivo}
                  onChange={(e) => setMovMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg"
                />
              </div>

              {movError && <p className="text-red-600 text-[11px]">{movError}</p>}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={movementDismiss.handleClose}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg font-medium text-[#6B7280]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#1497F2] hover:bg-[#06345A] text-white font-semibold rounded-lg shadow-xs"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
          onClick={historyDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden my-6 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Historial de movimientos: {viewingHistoryRefaccion.nombre}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{viewingHistoryRefaccion.codigo}</p>
              </div>
              <button
                type="button"
                onClick={historyDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-2 text-xs">
              {movimientos.filter((m) => m.refaccionId === viewingHistoryRefaccion.id).length > 0 ? (
                movimientos
                  .filter((m) => m.refaccionId === viewingHistoryRefaccion.id)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                              m.tipo === 'Entrada'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {m.tipo}
                          </span>
                          <span>{m.motivo}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.fechaHora}</div>
                      </div>
                      <div
                        className={`font-mono font-bold text-sm ${
                          m.tipo === 'Entrada' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {m.tipo === 'Entrada' ? `+${m.cantidad}` : `-${m.cantidad}`} pzs
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-4 text-center text-slate-400">No hay movimientos registrados.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ANÁLISIS DE INVENTARIO CON IA */}
      {/* ======================================================== */}
      <AnalisisInventarioModal
        isOpen={isAnalisisModalOpen}
        onClose={() => setIsAnalisisModalOpen(false)}
        refacciones={refacciones}
        movimientos={movimientos}
        ordenesPendientes={ordenesPendientes}
        vehiculos={vehiculos}
        ordenesCompra={ordenesCompra}
        onCrearOrdenCompraBorrador={handleCrearOrdenCompraDesdeIA}
        onVerRefaccionDetalle={handleVerRefaccionDesdeIA}
      />
    </section>
  );
};
