import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Car,
  User,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  Cliente,
  Vehiculo,
  Refaccion,
  Cotizacion,
  SesionUsuario,
  PropuestaCotizacionIA,
  TipoPropuestaIA,
  PartidaCotizacionIA,
  SeccionBitacora,
  DetalleCambioBitacora,
} from '../types';

interface CrearCotizacionIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  refacciones: Refaccion[];
  currentUser?: SesionUsuario;
  onSaveCotizacion: (cot: Cotizacion) => void;
  onRegistrarBitacora?: (
    tipoAccion: string,
    seccion: SeccionBitacora,
    descripcion: string,
    registroId?: string,
    registroFolio?: string,
    detalles?: DetalleCambioBitacora[]
  ) => void;
  onShowToast?: (mensaje: string) => void;
  totalCotizacionesExistentes?: number;
}

export const CrearCotizacionIAModal: React.FC<CrearCotizacionIAModalProps> = ({
  isOpen,
  onClose,
  clientes,
  vehiculos,
  refacciones,
  currentUser,
  onSaveCotizacion,
  onRegistrarBitacora,
  onShowToast,
  totalCotizacionesExistentes = 0,
}) => {
  // Form inputs
  const [clienteId, setClienteId] = useState<string>(clientes[0]?.id || '');
  const [vehiculoId, setVehiculoId] = useState<string>(vehiculos[0]?.id || '');
  const [kilometraje, setKilometraje] = useState<string>('45,000 km');
  const [sintomas, setSintomas] = useState<string>('Ruido al frenar y servicio preventivo programado');
  const [servicioSolicitado, setServicioSolicitado] = useState<string>('Revisión de frenos y lubricación de motor');
  const [observaciones, setObservaciones] = useState<string>('Cliente menciona vibración leve en pedal de freno');

  // Proposal selection state
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoPropuestaIA>('Recomendada');
  const [isGenerado, setIsGenerado] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Vehículos correspondientes al cliente seleccionado
  const vehiculosCliente = useMemo(() => {
    const list = vehiculos.filter((v) => v.clienteId === clienteId);
    return list.length > 0 ? list : vehiculos;
  }, [vehiculos, clienteId]);

  const clienteSeleccionado = useMemo(() => {
    return clientes.find((c) => c.id === clienteId) || clientes[0];
  }, [clientes, clienteId]);

  const vehiculoSeleccionado = useMemo(() => {
    return vehiculos.find((v) => v.id === vehiculoId) || vehiculosCliente[0] || vehiculos[0];
  }, [vehiculos, vehiculoId, vehiculosCliente]);

  // Generador de 3 propuestas (Esencial, Recomendada, Completa)
  const propuestas = useMemo<Record<TipoPropuestaIA, PropuestaCotizacionIA>>(() => {
    // Partidas Esencial
    const partidasEsencial: PartidaCotizacionIA[] = [
      {
        id: 'p-es-1',
        tipo: 'servicio',
        descripcion: 'Cambio de balatas delanteras y purgado de líquido',
        cantidad: 1,
        precioUnitario: 650,
        costoUnitario: 0,
        subtotal: 650,
        urgente: true,
        motivoExplicacion: 'Balatas con 15% de vida restante; crítico para frenado seguro.',
      },
      {
        id: 'p-es-2',
        tipo: 'refaccion',
        descripcion: 'Juego de Balatas Semimetálicas Delanteras',
        cantidad: 1,
        precioUnitario: 950,
        costoUnitario: 520,
        subtotal: 950,
        urgente: true,
        motivoExplicacion: 'Reemplazo directo por desgaste.',
        stockDisponible: 4,
        alertaStockBajo: false,
      },
      {
        id: 'p-es-3',
        tipo: 'servicio',
        descripcion: 'Cambio de aceite de motor y filtro básico',
        cantidad: 1,
        precioUnitario: 350,
        costoUnitario: 0,
        subtotal: 350,
        urgente: false,
        motivoExplicacion: 'Mantenimiento de lubricación indispensable.',
      },
      {
        id: 'p-es-4',
        tipo: 'refaccion',
        descripcion: 'Aceite Sintético 5W-30 (Garrafa 4L)',
        cantidad: 1,
        precioUnitario: 650,
        costoUnitario: 390,
        subtotal: 650,
        urgente: false,
        motivoExplicacion: 'Lubricante sintético certificado.',
        stockDisponible: 6,
      },
    ];

    // Partidas Recomendada
    const partidasRecomendada: PartidaCotizacionIA[] = [
      ...partidasEsencial,
      {
        id: 'p-rec-1',
        tipo: 'servicio',
        descripcion: 'Rectificado de discos delanteros en torno especializado',
        cantidad: 2,
        precioUnitario: 250,
        costoUnitario: 80,
        subtotal: 500,
        urgente: true,
        motivoExplicacion: 'Elimina surcos y la vibración reportada por el cliente al frenar.',
      },
      {
        id: 'p-rec-2',
        tipo: 'refaccion',
        descripcion: 'Filtro de Aceite PH-6607',
        cantidad: 1,
        precioUnitario: 180,
        costoUnitario: 95,
        subtotal: 180,
        urgente: false,
        motivoExplicacion: 'Elemento filtrante de micropartículas.',
        stockDisponible: 5,
      },
      {
        id: 'p-rec-3',
        tipo: 'refaccion',
        descripcion: 'Filtro de Aire de Motor',
        cantidad: 1,
        precioUnitario: 290,
        costoUnitario: 140,
        subtotal: 290,
        urgente: false,
        motivoExplicacion: 'Filtro saturado; su cambio recupera el flujo de aire y rendimiento.',
        stockDisponible: 3,
      },
    ];

    // Partidas Completa
    const partidasCompleta: PartidaCotizacionIA[] = [
      ...partidasRecomendada,
      {
        id: 'p-com-1',
        tipo: 'servicio',
        descripcion: 'Servicio de lubricación y ajuste de frenos traseros',
        cantidad: 1,
        precioUnitario: 450,
        costoUnitario: 0,
        subtotal: 450,
        urgente: false,
        motivoExplicacion: 'Balanceo de potencia de frenado en los 4 ejes.',
      },
      {
        id: 'p-com-2',
        tipo: 'refaccion',
        descripcion: 'Líquido de Frenos DOT 4 Sintético (500 ml)',
        cantidad: 1,
        precioUnitario: 160,
        costoUnitario: 85,
        subtotal: 160,
        urgente: false,
        motivoExplicacion: 'Fluido con alto punto de ebullición.',
        stockDisponible: 8,
      },
      {
        id: 'p-com-3',
        tipo: 'refaccion',
        descripcion: 'Filtro de Cabina con Carbón Activado',
        cantidad: 1,
        precioUnitario: 340,
        costoUnitario: 170,
        subtotal: 340,
        urgente: false,
        motivoExplicacion: 'Purifica el aire del habitáculo y protege el sistema de A/C.',
        stockDisponible: 2,
        alertaStockBajo: true,
      },
    ];

    const calcularTotales = (tipo: TipoPropuestaIA, partidas: PartidaCotizacionIA[]): PropuestaCotizacionIA => {
      let mo = 0;
      let refTotal = 0;
      let costoCompra = 0;

      partidas.forEach((p) => {
        if (p.tipo === 'servicio') {
          mo += p.subtotal;
          costoCompra += (p.costoUnitario || 0) * p.cantidad;
        } else {
          refTotal += p.subtotal;
          costoCompra += (p.costoUnitario || 0) * p.cantidad;
        }
      });

      const sub = mo + refTotal;
      const iva = Math.round(sub * 0.16 * 100) / 100;
      const total = sub + iva;
      const utilidad = total - costoCompra;
      const margen = total > 0 ? Math.round((utilidad / total) * 100) : 0;

      return {
        tipo,
        titulo:
          tipo === 'Esencial'
            ? 'Propuesta Esencial (Correctiva)'
            : tipo === 'Recomendada'
            ? 'Propuesta Recomendada (Óptima TUNNO)'
            : 'Propuesta Completa (Integral Preventiva)',
        descripcionCorta:
          tipo === 'Esencial'
            ? 'Atención a los síntomas críticos de frenos y lubricación básica.'
            : tipo === 'Recomendada'
            ? 'Soluciona la vibración con rectificado y afinación completa de filtros.'
            : 'Mantenimiento integral 360° en frenos, motor y cabina.',
        diagnosticoPreliminar:
          'Desgaste en balatas delanteras por debajo del umbral de seguridad (3mm). Discos con ligera ondulación térmica que provoca la vibración en pedal.',
        revisionesNecesarias: [
          'Grosor de discos y balatas con micrómetro',
          'Punto de ebullición del líquido de frenos',
          'Estado de mordazas (cálipers) y guías',
        ],
        partidas,
        importeManoObra: mo,
        importeRefacciones: refTotal,
        subtotal: sub,
        iva,
        total,
        costoCompraTotal: costoCompra,
        utilidadEstimada: utilidad,
        margenPorcentaje: margen,
        advertencias:
          tipo === 'Completa'
            ? ['Filtro de cabina con solo 2 piezas en almacén (stock bajo).']
            : [],
        explicacionGeneral:
          tipo === 'Esencial'
            ? 'Cubre exclusivamente lo urgente para garantizar tu seguridad en frenado inmediato.'
            : tipo === 'Recomendada'
            ? 'Elimina la vibración mediante rectificado de discos e incrementa el rendimiento con filtros nuevos.'
            : 'Protección máxima recomendada por el fabricante para extender la vida útil y valor de reventa.',
      };
    };

    return {
      Esencial: calcularTotales('Esencial', partidasEsencial),
      Recomendada: calcularTotales('Recomendada', partidasRecomendada),
      Completa: calcularTotales('Completa', partidasCompleta),
    };
  }, []);

  const propuestaActiva = propuestas[tipoSeleccionado];

  // Separar partidas urgentes vs preventivas
  const { urgentes, preventivas } = useMemo(() => {
    return {
      urgentes: propuestaActiva.partidas.filter((p) => p.urgente),
      preventivas: propuestaActiva.partidas.filter((p) => !p.urgente),
    };
  }, [propuestaActiva]);

  // Guardar en sistema con confirmación
  const handleConfirmarGuardado = () => {
    const nuevaCot: Cotizacion = {
      id: `cot-${Date.now()}`,
      folio: `COT-00${totalCotizacionesExistentes + 1}`,
      clienteId: clienteSeleccionado?.id || 'cli-1',
      vehiculoId: vehiculoSeleccionado?.id || 'veh-1',
      descripcion: `${propuestaActiva.titulo} - ${propuestaActiva.partidas.map((p) => p.descripcion).join(', ')}`,
      importeRefacciones: propuestaActiva.importeRefacciones,
      importeManoObra: propuestaActiva.importeManoObra,
      total: propuestaActiva.total,
      estado: 'Por autorizar',
      creadoEn: new Date().toISOString(),
      creadaConIA: true,
      propuestaTipo: propuestaActiva.tipo,
      diagnosticoSugerido: propuestaActiva.diagnosticoPreliminar,
      costoEstimadoCompra: propuestaActiva.costoCompraTotal,
      utilidadEstimada: propuestaActiva.utilidadEstimada,
      margenEstimadoPorcentaje: propuestaActiva.margenPorcentaje,
      partidasDetalladas: propuestaActiva.partidas,
    };

    onSaveCotizacion(nuevaCot);

    if (onRegistrarBitacora) {
      onRegistrarBitacora(
        'Cotización IA creada',
        'Copiloto IA',
        `Cotización ${nuevaCot.folio} (${propuestaActiva.tipo}) creada para ${clienteSeleccionado?.nombre}`,
        nuevaCot.id,
        nuevaCot.folio,
        [
          { etiqueta: 'Propuesta', nuevo: propuestaActiva.tipo },
          { etiqueta: 'Total con IVA', nuevo: `$${propuestaActiva.total.toLocaleString()} MXN` },
          { etiqueta: 'Margen de utilidad', nuevo: `${propuestaActiva.margenPorcentaje}%` },
        ]
      );
    }

    if (onShowToast) {
      onShowToast(`Cotización ${nuevaCot.folio} creada exitosamente (Por autorizar)`);
    }

    setShowConfirmModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#06345A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-4xl max-h-[92vh] flex flex-col font-body animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="px-5 py-4 bg-[#06345A] text-white rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1497F2] to-[#73C7FF] flex items-center justify-center text-[#06345A] font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-white">
                  Crear cotización con IA
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#1497F2]/30 text-[#73C7FF] border border-[#73C7FF]/40">
                  3 Propuestas
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Diagnóstico preliminar, margen de utilidad y desglose estructurado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#374151]">
          {/* Bloque 1: Datos de entrada capturados */}
          <div className="p-4 rounded-xl bg-[#F4F6F8] border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#06345A] mb-1">
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-[#1497F2] outline-none"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#06345A] mb-1">
                Vehículo y Placas
              </label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-[#1497F2] outline-none"
              >
                {vehiculosCliente.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} ({v.placas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#06345A] mb-1">
                Kilometraje
              </label>
              <input
                type="text"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
                placeholder="ej. 45,200 km"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-[#1497F2] outline-none"
              >
              </input>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#06345A] mb-1">
                Síntomas y servicio solicitado
              </label>
              <input
                type="text"
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-[#1497F2] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#06345A] mb-1">
                Observaciones del asesor
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-[#1497F2] outline-none"
              />
            </div>
          </div>

          {/* Selector de las 3 Propuestas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#06345A]">
                Selecciona la propuesta que deseas presentar:
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Puedes alternar libremente antes de guardar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['Esencial', 'Recomendada', 'Completa'] as const).map((tipo) => {
                const p = propuestas[tipo];
                const sel = tipoSeleccionado === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoSeleccionado(tipo)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      sel
                        ? 'bg-sky-50/70 border-[#1497F2] ring-2 ring-[#1497F2]/40 shadow-xs'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-heading font-bold text-xs ${
                            sel ? 'text-[#06345A]' : 'text-[#374151]'
                          }`}
                        >
                          {tipo}
                        </span>
                        {tipo === 'Recomendada' && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#1497F2] text-white">
                            Óptima
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        {p.descripcionCorta}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-[#E5E7EB] flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-[#6B7280]">Total con IVA:</span>
                        <p className="font-heading font-extrabold text-sm text-[#1497F2]">
                          ${p.total.toLocaleString()} MXN
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {p.margenPorcentaje}% margen
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desglose de la propuesta activa */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#06345A]">
                  {propuestaActiva.titulo}
                </h4>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Explicación para el cliente: "{propuestaActiva.explicacionGeneral}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Utilidad est.: ${propuestaActiva.utilidadEstimada.toLocaleString()} MXN (
                  {propuestaActiva.margenPorcentaje}%)
                </span>
              </div>
            </div>

            {/* Diagnóstico preliminar */}
            <div className="p-3 rounded-lg bg-sky-50/60 border border-[#73C7FF]/40 text-xs text-[#06345A]">
              <span className="font-bold block mb-1">Diagnóstico preliminar de la IA:</span>
              <p className="text-[11px] leading-relaxed text-[#374151]">
                {propuestaActiva.diagnosticoPreliminar}
              </p>
            </div>

            {/* Trabajos Urgentes */}
            <div>
              <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Trabajos correctivos urgentes ({urgentes.length})
              </span>
              <div className="space-y-1.5">
                {urgentes.map((partida) => (
                  <div
                    key={partida.id}
                    className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#06345A]">
                          {partida.descripcion}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">
                          ({partida.tipo === 'servicio' ? 'Mano de obra' : 'Refacción'})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        {partida.motivoExplicacion}
                      </p>
                    </div>
                    <span className="font-bold text-[#06345A] shrink-0">
                      ${partida.subtotal.toLocaleString()} MXN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trabajos Preventivos */}
            <div>
              <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Trabajos preventivos recomendados ({preventivas.length})
              </span>
              <div className="space-y-1.5">
                {preventivas.map((partida) => (
                  <div
                    key={partida.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-[#E5E7EB] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#06345A]">
                          {partida.descripcion}
                        </span>
                        {partida.alertaStockBajo && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                            Poco stock
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        {partida.motivoExplicacion}
                      </p>
                    </div>
                    <span className="font-bold text-[#06345A] shrink-0">
                      ${partida.subtotal.toLocaleString()} MXN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen numérico */}
            <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-[#F4F6F8]">
                <span className="text-[10px] text-[#6B7280] block">Mano de obra</span>
                <span className="font-bold text-[#06345A]">
                  ${propuestaActiva.importeManoObra.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#F4F6F8]">
                <span className="text-[10px] text-[#6B7280] block">Refacciones</span>
                <span className="font-bold text-[#06345A]">
                  ${propuestaActiva.importeRefacciones.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#F4F6F8]">
                <span className="text-[10px] text-[#6B7280] block">IVA (16%)</span>
                <span className="font-bold text-[#06345A]">
                  ${propuestaActiva.iva.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-sky-50 border border-[#73C7FF]/50">
                <span className="text-[10px] text-[#06345A] block font-semibold">Total a pagar</span>
                <span className="font-extrabold text-sm text-[#1497F2]">
                  ${propuestaActiva.total.toLocaleString()} MXN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie con botón de confirmación humana */}
        <div className="px-5 py-3.5 bg-[#F4F6F8] border-t border-[#E5E7EB] rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-[#06345A] shrink-0" />
            <span>
              La cotización se guardará en estado <strong>"Por autorizar"</strong>. No se realizarán cargos ni descuentos sin aprobación del cliente.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#06345A] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar cotización ({tipoSeleccionado})</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN SAFEGUARD */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-[#06345A]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] p-5 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#06345A]">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="font-heading font-bold text-sm">
                Confirmar registro de cotización
              </h4>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              ¿Deseas registrar la cotización con la propuesta <strong>{tipoSeleccionado}</strong> por un total de <strong>${propuestaActiva.total.toLocaleString()} MXN</strong> para el cliente <strong>{clienteSeleccionado?.nombre}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#06345A] cursor-pointer"
              >
                Revisar más
              </button>
              <button
                type="button"
                onClick={handleConfirmarGuardado}
                className="px-4 py-1.5 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
