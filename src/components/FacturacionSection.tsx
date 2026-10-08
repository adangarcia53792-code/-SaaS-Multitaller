import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  X,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertCircle,
  Clock,
  Car,
  User,
  CreditCard,
  Ban,
  Eye,
  FileText,
  FileCheck,
  Building2,
  Calendar,
  Tag,
  Hash,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Factura,
  Cotizacion,
  Cliente,
  Vehiculo,
  ConfiguracionTaller,
  EstadoFactura,
} from '../types';
import { IotLogo } from './IotLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface FacturacionSectionProps {
  facturas: Factura[];
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  configuracion: ConfiguracionTaller;
  onSaveFactura: (factura: Factura) => void;
  onUpdateFactura: (factura: Factura) => void;
  initialCotizacionId?: string | null;
  onClearInitialCotizacionId?: () => void;
}

type FilterEstado = 'todas' | EstadoFactura;

const CATALOGO_USO_CFDI = [
  { codigo: 'G03', descripcion: 'G03 - Gastos en general' },
  { codigo: 'G01', descripcion: 'G01 - Adquisición de mercancías' },
  { codigo: 'G02', descripcion: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { codigo: 'I08', descripcion: 'I08 - Otra maquinaria y equipo' },
  { codigo: 'D01', descripcion: 'D01 - Honorarios médicos y de transporte' },
  { codigo: 'S01', descripcion: 'S01 - Sin efectos fiscales' },
  { codigo: 'CP01', descripcion: 'CP01 - Pagos' },
];

const CATALOGO_FORMA_PAGO = [
  { codigo: '03', descripcion: '03 - Transferencia electrónica de fondos (SPEI)' },
  { codigo: '01', descripcion: '01 - Efectivo' },
  { codigo: '04', descripcion: '04 - Tarjeta de crédito' },
  { codigo: '28', descripcion: '28 - Tarjeta de débito' },
  { codigo: '02', descripcion: '02 - Cheque nominativo' },
  { codigo: '99', descripcion: '99 - Por definir' },
];

export const FacturacionSection: React.FC<FacturacionSectionProps> = ({
  facturas,
  cotizaciones,
  clientes,
  vehiculos,
  configuracion,
  onSaveFactura,
  onUpdateFactura,
  initialCotizacionId,
  onClearInitialCotizacionId,
}) => {
  const [activeTab, setActiveTab] = useState<'facturas' | 'listas_para_facturar'>('facturas');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todas');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState('');
  const [folioManual, setFolioManual] = useState('');
  const [formRazonSocial, setFormRazonSocial] = useState('');
  const [formRfc, setFormRfc] = useState('XAXX010101000');
  const [formUsoCfdi, setFormUsoCfdi] = useState('G03 - Gastos en general');
  const [formFormaPago, setFormFormaPago] = useState('03 - Transferencia electrónica de fondos (SPEI)');
  const [formMetodoPagoSat, setFormMetodoPagoSat] = useState('PUE - Pago en una sola exhibición');
  const [ivaModo, setIvaModo] = useState<'incluido' | 'desglosar'>('incluido');
  const [createError, setCreateError] = useState<string | null>(null);

  // Payment Modal
  const [payingFactura, setPayingFactura] = useState<Factura | null>(null);
  const [pagoMonto, setPagoMonto] = useState<string>('0');
  const [pagoReferencia, setPagoReferencia] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState('Transferencia electrónica de fondos (SPEI)');
  const [fechaPago, setFechaPago] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [notasPago, setNotasPago] = useState('');
  const [pagoError, setPagoError] = useState<string | null>(null);

  // Cancellation Modal
  const [cancelingFactura, setCancelingFactura] = useState<Factura | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // View / Print Modal
  const [viewingFactura, setViewingFactura] = useState<Factura | null>(null);

  // Fast maps
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

  // Cotizaciones listas para facturar: aprobadas que aún no tienen factura (o tienen una cancelada)
  const cotizacionesListasParaFacturar = useMemo(() => {
    const activeFacturasQuoteIds = new Set(
      facturas.filter((f) => f.estado !== 'Cancelada').map((f) => f.cotizacionId)
    );
    return cotizaciones.filter(
      (c) => c.estado === 'Aprobada' && !activeFacturasQuoteIds.has(c.id)
    );
  }, [cotizaciones, facturas]);

  // KPIs
  const totalPorCobrar = useMemo(() => {
    return facturas
      .filter((f) => f.estado === 'Pendiente')
      .reduce((sum, f) => sum + f.total, 0);
  }, [facturas]);

  const conteoPorCobrar = useMemo(() => {
    return facturas.filter((f) => f.estado === 'Pendiente').length;
  }, [facturas]);

  const totalCobrado = useMemo(() => {
    return facturas
      .filter((f) => f.estado === 'Pagada')
      .reduce((sum, f) => sum + f.total, 0);
  }, [facturas]);

  const conteoCobrado = useMemo(() => {
    return facturas.filter((f) => f.estado === 'Pagada').length;
  }, [facturas]);

  const totalPotencialListas = useMemo(() => {
    return cotizacionesListasParaFacturar.reduce((sum, c) => sum + c.total, 0);
  }, [cotizacionesListasParaFacturar]);

  // Next automatic folio
  const getNextFolio = (): string => {
    const numbers = facturas.map((f) => {
      const match = f.folio.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `FAC-${String(max + 1).padStart(3, '0')}`;
  };

  // Selected quote for creation modal
  const selectedQuoteForCreate = useMemo(() => {
    if (!selectedCotizacionId) return null;
    return cotizaciones.find((c) => c.id === selectedCotizacionId) || null;
  }, [selectedCotizacionId, cotizaciones]);

  // Calculations for quote in creation modal
  const calculosFactura = useMemo(() => {
    if (!selectedQuoteForCreate) {
      return { subtotal: 0, iva: 0, total: 0 };
    }
    const rawTotal = selectedQuoteForCreate.total || 0;
    if (ivaModo === 'incluido') {
      // El total de la cotización ya contiene IVA
      const subtotal = Math.round((rawTotal / 1.16) * 100) / 100;
      const iva = Math.round((rawTotal - subtotal) * 100) / 100;
      return { subtotal, iva, total: rawTotal };
    } else {
      // Se añade 16% sobre el total de cotización
      const subtotal = rawTotal;
      const iva = Math.round(subtotal * 0.16 * 100) / 100;
      const total = Math.round((subtotal + iva) * 100) / 100;
      return { subtotal, iva, total };
    }
  }, [selectedQuoteForCreate, ivaModo]);

  // Iniciar creación desde una cotización específica
  const handleOpenCreateWithCotizacion = (cotId?: string) => {
    const targetId = cotId || cotizacionesListasParaFacturar[0]?.id || '';
    setSelectedCotizacionId(targetId);
    setFolioManual(getNextFolio());

    if (targetId) {
      const cot = cotizaciones.find((c) => c.id === targetId);
      const cli = cot ? clienteMap.get(cot.clienteId) : null;
      setFormRazonSocial(cli?.nombre ? cli.nombre.toUpperCase() : 'PÚBLICO EN GENERAL');
      setFormRfc('XAXX010101000');
    } else {
      setFormRazonSocial('PÚBLICO EN GENERAL');
      setFormRfc('XAXX010101000');
    }

    setFormUsoCfdi('G03 - Gastos en general');
    setFormFormaPago('03 - Transferencia electrónica de fondos (SPEI)');
    setFormMetodoPagoSat('PUE - Pago en una sola exhibición');
    setIvaModo('incluido');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Reaccionar cuando se solicita facturar o ver factura desde Cotizaciones
  React.useEffect(() => {
    if (!initialCotizacionId) return;

    // Verificar si ya existe una factura activa generada para esta cotización
    const facturaExistente = facturas.find(
      (f) => f.cotizacionId === initialCotizacionId && f.estado !== 'Cancelada'
    );

    if (facturaExistente) {
      // Abre la sección de comprobantes y muestra el comprobante relacionado
      setActiveTab('facturas');
      setViewingFactura(facturaExistente);
    } else {
      // Abre el modal para generar factura con la cotización aprobada seleccionada
      handleOpenCreateWithCotizacion(initialCotizacionId);
    }

    if (onClearInitialCotizacionId) {
      onClearInitialCotizacionId();
    }
  }, [initialCotizacionId, facturas]);

  // Al cambiar la cotización en el select
  const handleSelectQuoteChange = (cotId: string) => {
    setSelectedCotizacionId(cotId);
    setCreateError(null);
    const cot = cotizaciones.find((c) => c.id === cotId);
    if (cot) {
      const cli = clienteMap.get(cot.clienteId);
      setFormRazonSocial(cli?.nombre ? cli.nombre.toUpperCase() : 'PÚBLICO EN GENERAL');
      setFormRfc('XAXX010101000');
    }
  };

  // Confirmar creación de factura
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

    if (!formRazonSocial.trim()) {
      setCreateError('La razón social o nombre del cliente es obligatorio.');
      return;
    }

    const cleanRfc = formRfc.trim().toUpperCase() || 'XAXX010101000';

    const cli = clienteMap.get(cot.clienteId);
    const veh = vehiculoMap.get(cot.vehiculoId);

    const folioFinal = folioManual.trim() || getNextFolio();

    const newFactura: Factura = {
      id: `fac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      folio: folioFinal,
      cotizacionId: cot.id,
      cotizacionFolio: cot.folio,
      clienteId: cot.clienteId,
      clienteNombre: cli?.nombre || 'Cliente sin nombre',
      clienteTelefono: cli?.telefono,
      clienteCorreo: cli?.correo,
      razonSocial: formRazonSocial.trim().toUpperCase(),
      rfc: cleanRfc,
      usoCfdi: formUsoCfdi,
      formaPago: formFormaPago,
      metodoPagoSat: formMetodoPagoSat,
      subtotal: calculosFactura.subtotal,
      iva: calculosFactura.iva,
      total: calculosFactura.total,
      vehiculoId: cot.vehiculoId,
      vehiculoDesc: veh ? `${veh.marca} ${veh.modelo} ${veh.año || ''}`.trim() : 'Vehículo no especificado',
      vehiculoPlacas: veh?.placas || 'S/P',
      descripcion: cot.descripcion,
      importeRefacciones: cot.importeRefacciones,
      importeManoObra: cot.importeManoObra,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
    };

    onSaveFactura(newFactura);
    setIsCreateModalOpen(false);
    setActiveTab('facturas');
  };

  // Abrir modal de pago
  const handleOpenPayment = (fac: Factura) => {
    if (fac.estado !== 'Pendiente') return;
    setPayingFactura(fac);
    setPagoMonto(fac.total.toString());
    setPagoReferencia(`SPEI-${Math.floor(100000 + Math.random() * 900000)}`);
    setMetodoPago('Transferencia electrónica de fondos (SPEI)');
    const d = new Date();
    setFechaPago(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
    setNotasPago('');
    setPagoError(null);
  };

  // Confirmar pago
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFactura) return;

    const montoNum = parseFloat(pagoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setPagoError('Ingresa un monto de pago válido mayor a 0.');
      return;
    }

    if (!pagoReferencia.trim()) {
      setPagoError('La referencia de pago o número de transacción es obligatoria.');
      return;
    }

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
        monto: montoNum,
        referencia: pagoReferencia.trim(),
        notas: notasPago.trim() || undefined,
      },
    };

    onUpdateFactura(updated);
    setPayingFactura(null);
  };

  // Abrir modal de cancelación
  const handleOpenCancel = (fac: Factura) => {
    if (fac.estado === 'Cancelada') return;
    setCancelingFactura(fac);
    setMotivoCancelacion('Error en datos fiscales o refacturación');
    setCancelError(null);
  };

  // Confirmar cancelación
  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingFactura) return;

    if (!motivoCancelacion.trim()) {
      setCancelError('Debes especificar el motivo de la cancelación.');
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

  // Filtrado de comprobantes
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
          (f.razonSocial && f.razonSocial.toLowerCase().includes(q)) ||
          (f.rfc && f.rfc.toLowerCase().includes(q)) ||
          f.vehiculoPlacas.toLowerCase().includes(q) ||
          f.cotizacionFolio.toLowerCase().includes(q)
      );
    }

    return [...list].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [facturas, filterEstado, searchQuery]);

  // Modals dismiss
  const createModalDismiss = useModalDismiss({
    isOpen: isCreateModalOpen,
    onClose: () => setIsCreateModalOpen(false),
    closeOnBackdrop: true,
  });

  const payingModalDismiss = useModalDismiss({
    isOpen: Boolean(payingFactura),
    onClose: () => setPayingFactura(null),
    closeOnBackdrop: true,
  });

  const cancelingModalDismiss = useModalDismiss({
    isOpen: Boolean(cancelingFactura),
    onClose: () => setCancelingFactura(null),
    closeOnBackdrop: true,
  });

  const viewingFacturaDismiss = useModalDismiss({
    isOpen: Boolean(viewingFactura),
    onClose: () => setViewingFactura(null),
    closeOnBackdrop: true,
  });

  return (
    <section className="space-y-6">
      {/* Encabezado IOT Technologies */}
      <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-[#231F20] tracking-tight">
                Facturación
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                {facturas.length} {facturas.length === 1 ? 'comprobante' : 'comprobantes'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#5F6B73] mt-0.5">
              Generación de comprobantes administrativos, registro de cobro y timbrado demostrativo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateWithCotizacion()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-sm font-semibold shadow-xs transition-colors min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generar factura</span>
        </button>
      </div>

      {/* AVISO IMPORTANTE DE VALIDEZ FISCAL / SAT */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 md:p-4 text-xs text-amber-900 flex items-start gap-3 no-print">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-950">
            Comprobante administrativo de demostración (Sin validez fiscal ni conexión con el SAT)
          </p>
          <p className="text-amber-800 leading-relaxed">
            Esta sección opera con fines administrativos y de demostración para el control de cobros del taller. No timbra ni emite CFDI ante el SAT en esta versión.
          </p>
        </div>
      </div>

      {/* INDICADORES PRINCIPALES (KPIs solicitados) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        {/* KPI 1: Por cobrar */}
        <div className="bg-white border border-[#DDE4E8] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Por cobrar
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${totalPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{conteoPorCobrar} comprobante{conteoPorCobrar === 1 ? '' : 's'} pendiente{conteoPorCobrar === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* KPI 2: Cobrado */}
        <div className="bg-white border border-[#DDE4E8] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cobrado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            ${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{conteoCobrado} comprobante{conteoCobrado === 1 ? '' : 's'} liquidado{conteoCobrado === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* KPI 3: Cotizaciones listas para facturar */}
        <div
          onClick={() => setActiveTab('listas_para_facturar')}
          className="bg-white border border-[#DDE4E8] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-[#1D7EAE]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#1D7EAE] transition-colors">
              Listas para facturar
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 text-[#1D7EAE] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {cotizacionesListasParaFacturar.length}{' '}
            <span className="text-sm font-normal text-slate-500 font-sans">
              cotización{cotizacionesListasParaFacturar.length === 1 ? '' : 'es'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Potencial: ${totalPotencialListas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-[#1D7EAE] font-semibold flex items-center gap-0.5">
              Ver <ArrowRight className="w-3 h-3 inline" />
            </span>
          </div>
        </div>
      </div>

      {/* Tabs principales de la vista */}
      <div className="flex items-center border-b border-[#DDE4E8] gap-4 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('facturas')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'facturas'
              ? 'border-[#1D7EAE] text-[#1D7EAE]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Comprobantes emitidos</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {facturas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listas_para_facturar')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'listas_para_facturar'
              ? 'border-[#1D7EAE] text-[#1D7EAE]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Cotizaciones listas para facturar</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            cotizacionesListasParaFacturar.length > 0
              ? 'bg-blue-100 text-[#1D7EAE]'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {cotizacionesListasParaFacturar.length}
          </span>
        </button>
      </div>

      {/* VISTA 1: COMPROBANTES EMITIDOS */}
      {activeTab === 'facturas' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros de Estado */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por folio, cliente, razón social, RFC o placas..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
              />
            </div>

            <div className="flex rounded-lg border border-[#DDE4E8] bg-white p-1 text-xs font-medium shrink-0">
              {(['todas', 'Pendiente', 'Pagada', 'Cancelada'] as FilterEstado[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterEstado(tab)}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    filterEstado === tab
                      ? 'bg-[#1D7EAE] text-white font-semibold shadow-xs'
                      : 'text-[#5F6B73] hover:text-[#231F20] hover:bg-slate-50'
                  }`}
                >
                  {tab === 'todas' ? 'Todas' : tab === 'Pendiente' ? 'Por cobrar' : tab === 'Pagada' ? 'Cobrado' : 'Canceladas'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de comprobantes */}
          <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden no-print">
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-[#231F20]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Folio y Fecha</th>
                    <th className="py-3 px-4">Receptor / Razón Social</th>
                    <th className="py-3 px-4">Vehículo</th>
                    <th className="py-3 px-4">Desglose (Subtotal + IVA)</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFacturas.length > 0 ? (
                    filteredFacturas.map((fac) => {
                      const dateStr = new Date(fac.fechaCreacion).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const subtotalVal = fac.subtotal ?? Math.round((fac.total / 1.16) * 100) / 100;
                      const ivaVal = fac.iva ?? Math.round((fac.total - subtotalVal) * 100) / 100;

                      return (
                        <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 block text-sm">
                              {fac.folio}
                            </span>
                            <span className="text-[11px] text-slate-500">{dateStr}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {fac.razonSocial || fac.clienteNombre}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              RFC: <span className="font-semibold text-slate-700">{fac.rfc || 'XAXX010101000'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Uso: {fac.usoCfdi || 'G03 - Gastos en general'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-slate-800 text-xs font-medium">{fac.vehiculoDesc}</div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-[11px] text-slate-700">
                              {fac.vehiculoPlacas}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                            <div>Subtotal: ${subtotalVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                            <div className="text-slate-500">IVA 16%: ${ivaVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900 text-sm">
                            ${fac.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                fac.estado === 'Pagada'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : fac.estado === 'Cancelada'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {fac.estado === 'Pendiente' ? 'Por cobrar' : fac.estado === 'Pagada' ? 'Cobrado' : 'Cancelada'}
                            </span>
                            {fac.estado === 'Pagada' && fac.pago?.referencia && (
                              <span className="block text-[10px] text-emerald-700 font-mono mt-0.5" title={`Ref: ${fac.pago.referencia}`}>
                                Ref: {fac.pago.referencia}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Ver comprobante */}
                              <button
                                type="button"
                                onClick={() => setViewingFactura(fac)}
                                title="Ver comprobante"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1D7EAE] hover:text-[#0032A0] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver</span>
                              </button>

                              {/* Imprimir directo */}
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingFactura(fac);
                                  setTimeout(() => window.print(), 250);
                                }}
                                title="Imprimir"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Registrar Pago */}
                              {fac.estado === 'Pendiente' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayment(fac)}
                                  title="Registrar cobro"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Cobrar</span>
                                </button>
                              )}

                              {/* Cancelar comprobante */}
                              {fac.estado !== 'Cancelada' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancel(fac)}
                                  title="Cancelar comprobante"
                                  className="inline-flex items-center p-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No hay comprobantes que coincidan con la búsqueda</p>
                        <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros o genera una nueva factura.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map((fac) => {
                  const subtotalVal = fac.subtotal ?? Math.round((fac.total / 1.16) * 100) / 100;
                  const ivaVal = fac.iva ?? Math.round((fac.total - subtotalVal) * 100) / 100;

                  return (
                    <div key={fac.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {fac.folio}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {new Date(fac.fechaCreacion).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            fac.estado === 'Pagada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fac.estado === 'Cancelada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {fac.estado === 'Pendiente' ? 'Por cobrar' : fac.estado === 'Pagada' ? 'Cobrado' : 'Cancelada'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-900">{fac.razonSocial || fac.clienteNombre}</div>
                        <div className="text-slate-500 font-mono">RFC: {fac.rfc || 'XAXX010101000'}</div>
                        <div className="text-slate-600">Vehículo: {fac.vehiculoDesc} ({fac.vehiculoPlacas})</div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Subtotal + IVA</span>
                          <span>${subtotalVal.toFixed(2)} + ${ivaVal.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Total</span>
                          <span className="font-bold text-slate-900 text-sm">${fac.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setViewingFactura(fac)}
                          className="px-3 py-1.5 bg-blue-50 text-[#1D7EAE] rounded-lg text-xs font-semibold"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingFactura(fac);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Imprimir
                        </button>
                        {fac.estado === 'Pendiente' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(fac)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Cobrar
                          </button>
                        )}
                        {fac.estado !== 'Cancelada' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(fac)}
                            className="p-1.5 text-rose-600 rounded-lg text-xs font-semibold"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No se encontraron comprobantes registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: COTIZACIONES LISTAS PARA FACTURAR */}
      {activeTab === 'listas_para_facturar' && (
        <div className="space-y-4 no-print">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <FileCheck className="w-5 h-5 text-[#1D7EAE] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-[#0032A0] text-sm">
                  Cotizaciones aprobadas disponibles para facturación
                </h4>
                <p className="text-slate-600 mt-0.5">
                  Estas cotizaciones ya fueron aprobadas por el cliente y aún no tienen comprobante fiscal generado. Puedes emitir su comprobante en un solo clic.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('facturas')}
              className="text-xs text-[#1D7EAE] font-semibold hover:underline shrink-0"
            >
              Volver a comprobantes
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE4E8] shadow-xs overflow-hidden">
            {cotizacionesListasParaFacturar.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {cotizacionesListasParaFacturar.map((cot) => {
                  const cli = clienteMap.get(cot.clienteId);
                  const veh = vehiculoMap.get(cot.vehiculoId);
                  const subtotalEst = Math.round((cot.total / 1.16) * 100) / 100;
                  const ivaEst = Math.round((cot.total - subtotalEst) * 100) / 100;

                  return (
                    <div
                      key={cot.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0032A0]">
                            {cot.folio}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Aprobada
                          </span>
                          {cot.autorizacion?.fechaHora && (
                            <span className="text-[11px] text-slate-400">
                              Autorizada el {cot.autorizacion.fechaHora}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-800">
                          <strong>Cliente:</strong> {cli?.nombre || 'Cliente'} &bull;{' '}
                          <strong>Vehículo:</strong> {veh ? `${veh.marca} ${veh.modelo} (${veh.placas})` : 'N/D'}
                        </div>

                        <p className="text-xs text-slate-600 italic line-clamp-1">
                          {cot.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 font-mono">
                            Subtotal: ${subtotalEst.toFixed(2)} + IVA 16%: ${ivaEst.toFixed(2)}
                          </div>
                          <div className="text-base font-bold font-mono text-slate-900">
                            ${cot.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenCreateWithCotizacion(cot.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Facturar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No hay cotizaciones pendientes de facturar</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Todas las cotizaciones aprobadas ya cuentan con factura emitida o no hay cotizaciones en estado «Aprobada».
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PROCESO SENCILLO DE FACTURACIÓN (PASOS 1 AL 4)    */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
          onClick={createModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#231F20] text-base">
                    Generar comprobante administrativo
                  </h3>
                  <p className="text-[11px] text-[#5F6B73]">
                    Proceso guiado de facturación de demostración
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={createModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFactura} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {availableApprovedCotizacionesOrCurrent(selectedCotizacionId, cotizaciones, facturas).length > 0 ? (
                <>
                  {/* PASO 1: SELECCIONAR COTIZACIÓN APROBADA */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-[#DDE4E8] space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-[#1D7EAE] text-white flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Seleccionar cotización aprobada</span>
                    </div>

                    <select
                      value={selectedCotizacionId}
                      onChange={(e) => handleSelectQuoteChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] font-medium focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20"
                    >
                      {availableApprovedCotizacionesOrCurrent(selectedCotizacionId, cotizaciones, facturas).map((cot) => {
                        const cli = clienteMap.get(cot.clienteId);
                        const veh = vehiculoMap.get(cot.vehiculoId);
                        return (
                          <option key={cot.id} value={cot.id}>
                            {cot.folio} — {cli?.nombre || 'Cliente'} ({veh?.placas || 'S/P'}) — Total: ${cot.total.toFixed(2)} MXN
                          </option>
                        );
                      })}
                    </select>

                    {selectedQuoteForCreate && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-400 block">Vehículo:</span>
                          <span className="font-semibold text-slate-800">
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.marca}{' '}
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.modelo} (
                            {vehiculoMap.get(selectedQuoteForCreate.vehiculoId)?.placas})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Concepto:</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {selectedQuoteForCreate.descripcion}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PASO 2: FOLIO AUTOMÁTICO */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-[#DDE4E8] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-[#1D7EAE] text-white flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>Folio automático de comprobante</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Consecutivo asignado
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Folio de emisión
                        </label>
                        <input
                          type="text"
                          value={folioManual}
                          onChange={(e) => setFolioManual(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs font-mono font-bold text-[#0032A0] focus:outline-none focus:border-[#1D7EAE]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Fecha de comprobante
                        </label>
                        <div className="px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-slate-700">
                          {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PASO 3: CAPTURAR RAZÓN SOCIAL, RFC, USO DE CFDI Y FORMA DE PAGO */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-[#DDE4E8] space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-[#1D7EAE] text-white flex items-center justify-center text-[10px]">
                        3
                      </span>
                      <span>Datos fiscales del receptor</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#231F20] mb-1">
                          Razón social / Nombre fiscal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formRazonSocial}
                          onChange={(e) => setFormRazonSocial(e.target.value.toUpperCase())}
                          placeholder="Ej. TRANSPORTES DEL NORTE S.A. DE C.V."
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#231F20] mb-1">
                          RFC del receptor <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formRfc}
                          onChange={(e) => setFormRfc(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          placeholder="XAXX010101000"
                          maxLength={13}
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs font-mono font-bold text-[#231F20] focus:outline-none focus:border-[#1D7EAE]"
                          required
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Usa XAXX010101000 para público en general.</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#231F20] mb-1">
                          Uso de CFDI <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formUsoCfdi}
                          onChange={(e) => setFormUsoCfdi(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE]"
                        >
                          {CATALOGO_USO_CFDI.map((u) => (
                            <option key={u.codigo} value={u.descripcion}>
                              {u.descripcion}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#231F20] mb-1">
                          Forma de pago SAT <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formFormaPago}
                          onChange={(e) => setFormFormaPago(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE]"
                        >
                          {CATALOGO_FORMA_PAGO.map((fp) => (
                            <option key={fp.codigo} value={fp.descripcion}>
                              {fp.descripcion}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#231F20] mb-1">
                          Método de pago
                        </label>
                        <select
                          value={formMetodoPagoSat}
                          onChange={(e) => setFormMetodoPagoSat(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-[#231F20] focus:outline-none focus:border-[#1D7EAE]"
                        >
                          <option value="PUE - Pago en una sola exhibición">PUE - Pago en una sola exhibición</option>
                          <option value="PPD - Pago en parcialidades o diferido">PPD - Pago en parcialidades o diferido</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PASO 4: MOSTRAR SUBTOTAL, IVA DEL 16% Y TOTAL */}
                  <div className="bg-white p-4 rounded-xl border-2 border-[#1D7EAE]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-[#1D7EAE] text-white flex items-center justify-center text-[10px]">
                          4
                        </span>
                        <span>Desglose de Subtotal, IVA (16 %) y Total</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <label className="text-slate-600 font-medium">Cotización incluye IVA:</label>
                        <select
                          value={ivaModo}
                          onChange={(e) => setIvaModo(e.target.value as 'incluido' | 'desglosar')}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-[#1D7EAE]"
                        >
                          <option value="incluido">Sí (Desglosar del total)</option>
                          <option value="desglosar">No (Añadir 16% adicional)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200 font-mono text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal gravable (Base):</span>
                        <span>${calculosFactura.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA Trasladado (16.00 %):</span>
                        <span className="text-[#1D7EAE] font-semibold">
                          +${calculosFactura.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-slate-900">
                        <span>Total comprobante:</span>
                        <span className="text-base text-[#0032A0]">
                          ${calculosFactura.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </span>
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{createError}</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={createModalDismiss.handleClose}
                      className="px-4 py-2.5 border border-[#DDE4E8] rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Emitir comprobante ({folioManual || 'FAC'})</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    No hay cotizaciones aprobadas disponibles
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Para emitir una factura, primero debes autorizar una cotización en la sección de Cotizaciones.
                  </p>
                  <button
                    type="button"
                    onClick={createModalDismiss.handleClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 5: REGISTRAR EL PAGO CON MONTO Y REFERENCIA          */}
      {/* ======================================================== */}
      {payingFactura && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
          onClick={payingModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Registrar cobro de factura {payingFactura.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={payingModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Receptor:</span>
                  <span className="font-bold text-slate-800 text-xs block">
                    {payingFactura.razonSocial || payingFactura.clienteNombre}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Folio: {payingFactura.folio}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Total a cobrar:</span>
                  <span className="font-bold text-emerald-700 text-base font-mono">
                    ${payingFactura.total.toFixed(2)} MXN
                  </span>
                </div>
              </div>

              {/* MONTO RECIBIDO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto pagado / recibido <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1D7EAE]"
                    required
                  />
                </div>
              </div>

              {/* REFERENCIA DE PAGO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referencia o Folio de transacción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pagoReferencia}
                  onChange={(e) => setPagoReferencia(e.target.value)}
                  placeholder="Ej. SPEI-893021, Autorización 48291, Recibo #12"
                  className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-[#1D7EAE]"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Clave de rastreo bancario, voucher o comprobante.</p>
              </div>

              {/* MÉTODO DE PAGO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de pago <span className="text-red-500">*</span>
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1D7EAE]"
                >
                  <option value="Transferencia electrónica de fondos (SPEI)">Transferencia electrónica (SPEI)</option>
                  <option value="Efectivo">Efectivo en caja</option>
                  <option value="Tarjeta de débito">Tarjeta de débito</option>
                  <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                  <option value="Cheque nominativo">Cheque nominativo</option>
                </select>
              </div>

              {/* FECHA DE PAGO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de cobro <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1D7EAE]"
                  required
                />
              </div>

              {/* NOTAS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de cobranza <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={notasPago}
                  onChange={(e) => setNotasPago(e.target.value)}
                  placeholder="Ej. Liquidado al entregar vehículo en rampa..."
                  className="w-full px-3 py-2 bg-white border border-[#DDE4E8] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1D7EAE]"
                />
              </div>

              {pagoError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {pagoError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={payingModalDismiss.handleClose}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar cobro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 6: CANCELAR COMPROBANTE                            */}
      {/* ======================================================== */}
      {cancelingFactura && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
          onClick={cancelingModalDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Cancelar comprobante {cancelingFactura.folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelingModalDismiss.handleClose}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Esta acción marcará el comprobante <strong>{cancelingFactura.folio}</strong> como{' '}
                <span className="text-rose-700 font-bold">Cancelado</span>. El registro se conservará para fines de bitácora y auditoría interna.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full p-2.5 bg-white border border-[#DDE4E8] rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
                {cancelError && <p className="text-rose-600 mt-1">{cancelError}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelingModalDismiss.handleClose}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 6: VER E IMPRIMIR COMPROBANTE DE FACTURACIÓN       */}
      {/* ======================================================== */}
      {viewingFactura && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 print:bg-white print:p-0 print:static overflow-hidden"
          onClick={viewingFacturaDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col print-area print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar (Fija y visible al desplazarse, oculta en impresión) */}
            <div className="no-print bg-white border-b border-[#DDE4E8] text-[#231F20] px-5 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#1D7EAE] flex items-center justify-center shrink-0 border border-sky-200">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#231F20]">
                    Vista previa
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-xs font-mono font-semibold text-[#1D7EAE] hidden sm:inline">
                    {viewingFactura.folio}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs min-h-[34px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={viewingFacturaDismiss.handleClose}
                  className="p-1.5 text-slate-400 hover:text-[#231F20] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Cerrar comprobante"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento Imprimible y Desplazable */}
            <div className="p-6 sm:p-8 md:p-10 bg-white text-slate-800 space-y-6 text-xs overflow-y-auto flex-1 print:overflow-visible print:p-4 print:space-y-4">
              {/* Marca de agua / Cinta superior demostrativa */}
              <div className="p-2.5 bg-slate-100 border border-slate-300 rounded text-center text-[10px] uppercase tracking-wider font-bold text-slate-600">
                COMPROBANTE ADMINISTRATIVO DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL NI CONEXIÓN CON EL SAT
              </div>

              {/* Encabezado del Comprobante */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <div className="mb-2">
                    <IotLogo size="sm" variant="dark" />
                  </div>
                  <h1 className="text-lg font-bold text-[#231F20] tracking-tight">
                    {configuracion?.nombre || 'IOT Technologies'}
                  </h1>
                  <p className="text-[11px] font-mono text-slate-600">RFC: IOT150820AA1</p>
                  {configuracion?.telefono && (
                    <p className="text-[11px] text-slate-500">Tel: {configuracion.telefono}</p>
                  )}
                  {configuracion?.direccion && (
                    <p className="text-[11px] text-slate-500">{configuracion.direccion}</p>
                  )}
                  <p className="text-[11px] text-slate-500">Régimen: 601 - General de Ley Personas Morales</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider">Comprobante Interno</div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {viewingFactura.folio}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Fecha de emisión:{' '}
                    {new Date(viewingFactura.fechaCreacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded ${
                        viewingFactura.estado === 'Pagada'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : viewingFactura.estado === 'Cancelada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {viewingFactura.estado === 'Pendiente' ? 'Por cobrar' : viewingFactura.estado === 'Pagada' ? 'Cobrado' : 'Cancelada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos del Receptor / Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Datos del receptor
                  </h4>
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-bold text-slate-900 text-xs">
                      {viewingFactura.razonSocial || viewingFactura.clienteNombre}
                    </p>
                    <p className="font-mono text-slate-700">
                      RFC: <strong>{viewingFactura.rfc || 'XAXX010101000'}</strong>
                    </p>
                    <p className="text-slate-600">
                      Uso CFDI: {viewingFactura.usoCfdi || 'G03 - Gastos en general'}
                    </p>
                    {viewingFactura.clienteTelefono && (
                      <p className="text-slate-500">Tel: {viewingFactura.clienteTelefono}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Datos del vehículo y servicio
                  </h4>
                  <div className="space-y-0.5 text-slate-800">
                    <p className="font-semibold text-slate-900">{viewingFactura.vehiculoDesc}</p>
                    <p className="text-slate-600">
                      Placas:{' '}
                      <strong className="font-mono bg-white px-1.5 py-0.5 border rounded">
                        {viewingFactura.vehiculoPlacas}
                      </strong>
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Cotización vinculada: {viewingFactura.cotizacionFolio}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Forma de pago: {viewingFactura.formaPago || '03 - Transferencia electrónica'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Concepto del Servicio */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Concepto y descripción de los trabajos
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewingFactura.descripcion}
                </div>
              </div>

              {/* Desglose de partidas y totales */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                      <th className="py-2">Clave / Concepto</th>
                      <th className="py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 text-slate-800 font-medium">
                        Refacciones y partes automotrices suministradas
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-900">
                        ${viewingFactura.importeRefacciones.toFixed(2)} MXN
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-800 font-medium">
                        Servicios y mano de obra mecánica especializada
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-900">
                        ${viewingFactura.importeManoObra.toFixed(2)} MXN
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 text-xs font-mono">
                    <tr>
                      <td className="py-2 text-slate-600 font-sans">Subtotal gravable (16%):</td>
                      <td className="py-2 text-right text-slate-900">
                        ${(viewingFactura.subtotal ?? Math.round((viewingFactura.total / 1.16) * 100) / 100).toFixed(2)} MXN
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-600 font-sans">IVA Trasladado (16.00 %):</td>
                      <td className="py-1 text-right text-slate-900">
                        ${(viewingFactura.iva ?? Math.round((viewingFactura.total - (viewingFactura.subtotal ?? Math.round((viewingFactura.total / 1.16) * 100) / 100)) * 100) / 100).toFixed(2)} MXN
                      </td>
                    </tr>
                    <tr className="border-t border-slate-300">
                      <td className="py-2 font-bold text-slate-900 font-sans text-sm">Total a pagar:</td>
                      <td className="py-2 text-right font-bold text-slate-900 text-base">
                        ${viewingFactura.total.toFixed(2)} MXN
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Información del cobro registrado (si está pagada) */}
              {viewingFactura.estado === 'Pagada' && viewingFactura.pago && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registro de Cobro Conciliado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-emerald-950 pt-1 text-[11px] font-mono">
                    <div>
                      <span className="text-emerald-700 font-sans">Método de pago:</span>{' '}
                      <strong>{viewingFactura.pago.metodoPago}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-sans">Fecha de liquidación:</span>{' '}
                      <strong>{viewingFactura.pago.fechaPago}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-sans">Monto recibido:</span>{' '}
                      <strong>${(viewingFactura.pago.monto || viewingFactura.total).toFixed(2)} MXN</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-sans">Referencia / Folio:</span>{' '}
                      <strong className="text-emerald-800">{viewingFactura.pago.referencia || 'N/D'}</strong>
                    </div>
                  </div>
                  {viewingFactura.pago.notas && (
                    <div className="text-emerald-800 text-[11px] pt-1">
                      <span className="text-emerald-700">Notas:</span> {viewingFactura.pago.notas}
                    </div>
                  )}
                </div>
              )}

              {/* Información de cancelación (si está cancelada) */}
              {viewingFactura.estado === 'Cancelada' && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5 text-xs">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Comprobante Cancelado</span>
                  </div>
                  {viewingFactura.motivoCancelacion && (
                    <p className="text-rose-900 text-xs pt-1">
                      <span className="text-rose-700 font-semibold">Motivo:</span>{' '}
                      {viewingFactura.motivoCancelacion}
                    </p>
                  )}
                  {viewingFactura.fechaCancelacion && (
                    <p className="text-rose-700 text-[11px]">
                      Cancelado el:{' '}
                      {new Date(viewingFactura.fechaCancelacion).toLocaleString('es-MX')}
                    </p>
                  )}
                </div>
              )}

              {/* Pie de página con simulación fiscal */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
                <div className="space-y-1 font-mono">
                  <p><strong>Folio Fiscal (UUID Demo):</strong> 4A9B883F-IOT1-42CF-B810-{viewingFactura.id.slice(-8).toUpperCase()}</p>
                  <p><strong>Cadena Original SAT:</strong> ||1.1|{viewingFactura.folio}|{viewingFactura.fechaCreacion}|IOT150820AA1|{viewingFactura.total}||</p>
                  <p className="text-slate-400 font-sans">
                    Emisión interna de demostración desarrollada para {configuracion?.nombre || 'IOT Technologies'}.
                  </p>
                </div>

                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-[8px] text-slate-400 text-center shrink-0">
                  <Hash className="w-4 h-4 text-slate-400 mb-0.5" />
                  <span>QR DEMO</span>
                </div>
              </div>

              {/* Botones de acción al final del comprobante (no imprimibles) */}
              <div className="no-print pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> o haz clic fuera para cerrar
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={viewingFacturaDismiss.handleClose}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cerrar comprobante
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir comprobante</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Helper: lista de cotizaciones que incluye la seleccionada actualmente si ya fue asignada
function availableApprovedCotizacionesOrCurrent(
  currentId: string,
  cotizaciones: Cotizacion[],
  facturas: Factura[]
): Cotizacion[] {
  const activeFacturasQuoteIds = new Set(
    facturas.filter((f) => f.estado !== 'Cancelada').map((f) => f.cotizacionId)
  );
  return cotizaciones.filter(
    (c) =>
      c.id === currentId ||
      (c.estado === 'Aprobada' && !activeFacturasQuoteIds.has(c.id))
  );
}
