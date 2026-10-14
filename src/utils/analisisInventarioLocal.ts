import {
  Refaccion,
  MovimientoInventario,
  OrdenTrabajo,
  Vehiculo,
  OrdenCompra,
  ResultadoAnalisisInventarioIA,
  RefaccionAtencionIA,
  CompraRecomendadaIA,
  ImpactoTallerIA,
  PrecioMargenAlertaIA,
  ProveedorSugeridoIA,
} from '../types';

export interface ParametrosAnalisisInventario {
  refacciones: Refaccion[];
  movimientos: MovimientoInventario[];
  ordenesPendientes?: OrdenTrabajo[];
  vehiculos?: Vehiculo[];
  ordenesCompra?: OrdenCompra[];
}

export function generarAnalisisInventarioLocal(
  params: ParametrosAnalisisInventario
): ResultadoAnalisisInventarioIA {
  const {
    refacciones = [],
    movimientos = [],
    ordenesPendientes = [],
    ordenesCompra = [],
  } = params;

  // 1. Refacciones que requieren atención (Agotados, stock bajo o próximos al mínimo)
  const refaccionesAtencion: RefaccionAtencionIA[] = [];
  const comprasRecomendadas: CompraRecomendadaIA[] = [];
  const preciosMargenAlertas: PrecioMargenAlertaIA[] = [];
  const datosFaltantes: string[] = [];

  // Agrupar movimientos de salida recientes o uso en órdenes
  const consumoPorRefaccion: Record<string, number> = {};
  movimientos.forEach((m) => {
    if (m.tipo === 'Salida') {
      consumoPorRefaccion[m.refaccionId] = (consumoPorRefaccion[m.refaccionId] || 0) + m.cantidad;
    }
  });

  // Identificar refacciones en órdenes activas (Pendiente o En proceso)
  const ordenesEnTaller = ordenesPendientes.filter(
    (o) => o.estado === 'En proceso' || o.estado === 'Pendiente' || o.estado === 'Por autorizar'
  );

  const demandaPorRefaccionEnOrdenes: Record<string, { ordenes: OrdenTrabajo[]; totalRequerido: number }> = {};
  ordenesEnTaller.forEach((ord) => {
    if (ord.refaccionesUtilizadas && ord.refaccionesUtilizadas.length > 0) {
      ord.refaccionesUtilizadas.forEach((u) => {
        const net = u.cantidad - (u.devueltas || 0);
        if (net > 0) {
          if (!demandaPorRefaccionEnOrdenes[u.refaccionId]) {
            demandaPorRefaccionEnOrdenes[u.refaccionId] = { ordenes: [], totalRequerido: 0 };
          }
          demandaPorRefaccionEnOrdenes[u.refaccionId].ordenes.push(ord);
          demandaPorRefaccionEnOrdenes[u.refaccionId].totalRequerido += net;
        }
      });
    }
  });

  // Evaluar cada refacción
  refacciones.forEach((ref) => {
    const existencias = Number(ref.existencias) || 0;
    const minimo = Number(ref.minimo) || 0;
    const precioCompra = Number(ref.precioCompra ?? ref.costoUnitario ?? 0);
    const precioVenta = Number(ref.precioVenta ?? 0);
    const diasEntrega = ref.diasEntregaEstimados ?? 2;
    const proveedor = ref.proveedor?.trim() || 'Proveedor sin asignar';
    const telefono = ref.telefonoProveedor?.trim() || '';

    // Validar datos faltantes
    if (!ref.proveedor || ref.proveedor.trim() === '') {
      datosFaltantes.push(`Refacción "${ref.nombre}" (${ref.codigo}) no tiene proveedor registrado.`);
    }
    if (precioCompra <= 0) {
      datosFaltantes.push(`Refacción "${ref.nombre}" (${ref.codigo}) no tiene precio de compra registrado.`);
    }
    if (precioVenta <= 0) {
      datosFaltantes.push(`Refacción "${ref.nombre}" (${ref.codigo}) no tiene precio de venta al público.`);
    }

    // 1. Detección de problemas de inventario
    let estadoStock: 'agotado' | 'stock_bajo' | 'proximo_minimo' | null = null;
    let motivoStock = '';

    if (existencias <= 0) {
      estadoStock = 'agotado';
      motivoStock = `Pieza totalmente agotada en almacén (0 existencias, mínimo definido: ${minimo}).`;
    } else if (existencias < minimo) {
      estadoStock = 'stock_bajo';
      motivoStock = `Existencias actuales (${existencias}) están por debajo del nivel de seguridad mínimo (${minimo}).`;
    } else if (existencias <= minimo + 1 && minimo > 0) {
      estadoStock = 'proximo_minimo';
      motivoStock = `Existencias al límite (${existencias}) muy próximas al umbral mínimo (${minimo}).`;
    }

    if (estadoStock) {
      refaccionesAtencion.push({
        refaccionId: ref.id,
        codigo: ref.codigo,
        nombre: ref.nombre,
        existencias,
        minimo,
        estadoStock,
        motivo: motivoStock,
      });

      // Calcular sugerencia de compra
      // Se toma en cuenta el déficit para llegar a mínimo x 2, más la demanda en órdenes
      const demandaOrden = demandaPorRefaccionEnOrdenes[ref.id]?.totalRequerido || 0;
      const deficit = Math.max(0, minimo * 2 - existencias);
      const cantidadSugerida = Math.max(1, deficit + (demandaOrden > existencias ? (demandaOrden - existencias) : 0));

      let prioridad: 'urgente' | 'proxima' | 'preventiva' = 'proxima';
      let motivoCompra = '';

      if (existencias === 0 || demandaOrden > existencias) {
        prioridad = 'urgente';
        motivoCompra = existencias === 0
          ? `Urgente: Reposición inmediata de stock agotado para evitar paros de servicio.`
          : `Urgente: La demanda en órdenes activas (${demandaOrden} pzs) supera el stock disponible (${existencias} pzs).`;
      } else if (existencias < minimo) {
        prioridad = 'proxima';
        motivoCompra = `Próxima: Reabastecimiento necesario para restaurar margen de seguridad antes de los próximos servicios.`;
      } else {
        prioridad = 'preventiva';
        motivoCompra = `Preventiva: Mantenimiento de lote óptimo de rotación según umbral mínimo de almacén.`;
      }

      comprasRecomendadas.push({
        refaccionId: ref.id,
        codigo: ref.codigo,
        nombre: ref.nombre,
        cantidadSugerida,
        motivo: motivoCompra,
        prioridad,
        precioCompraEstimado: precioCompra,
        proveedorSugerido: proveedor,
        telefonoProveedor: telefono,
        diasEntregaEstimados: diasEntrega,
      });
    }

    // 2. Precios y márgenes
    if (precioCompra <= 0) {
      preciosMargenAlertas.push({
        refaccionId: ref.id,
        codigo: ref.codigo,
        nombre: ref.nombre,
        precioCompra: 0,
        precioVenta,
        margenPorcentaje: 0,
        tipoProblema: 'sin_precio_compra',
        detalle: 'No cuenta con costo de compra registrado en el catálogo.',
        sugerencia: 'Capturar el costo real de factura para poder costear órdenes y calcular margen.',
      });
    } else if (precioVenta <= 0) {
      preciosMargenAlertas.push({
        refaccionId: ref.id,
        codigo: ref.codigo,
        nombre: ref.nombre,
        precioCompra,
        precioVenta: 0,
        margenPorcentaje: 0,
        tipoProblema: 'sin_precio_venta',
        detalle: 'Tiene costo de compra pero no se ha fijado precio de venta al cliente.',
        sugerencia: `Establecer precio de venta (por ejemplo, con margen mínimo del 35%: $${(precioCompra * 1.35).toFixed(2)}).`,
      });
    } else {
      const ganancia = precioVenta - precioCompra;
      const margen = (ganancia / precioVenta) * 100;
      if (margen < 20) {
        preciosMargenAlertas.push({
          refaccionId: ref.id,
          codigo: ref.codigo,
          nombre: ref.nombre,
          precioCompra,
          precioVenta,
          margenPorcentaje: Math.round(margen),
          tipoProblema: margen <= 0 ? 'precio_incongruente' : 'margen_bajo',
          detalle: margen <= 0
            ? `El precio de venta ($${precioVenta.toFixed(2)}) es menor o igual al de compra ($${precioCompra.toFixed(2)}), generando pérdidas directas.`
            : `El margen de utilidad es de solo el ${Math.round(margen)}% (menor al estándar de taller automotriz del 30-45%).`,
          sugerencia: `Revisar lista de precios. Sugerido actualizar venta a $${(precioCompra * 1.4).toFixed(2)} (+40%).`,
        });
      }
    }
  });

  // 3. Impacto en el taller (órdenes activas que podrían retrasarse)
  const impactoEnTaller: ImpactoTallerIA[] = [];
  ordenesEnTaller.forEach((ord) => {
    if (ord.refaccionesUtilizadas && ord.refaccionesUtilizadas.length > 0) {
      ord.refaccionesUtilizadas.forEach((u) => {
        const net = u.cantidad - (u.devueltas || 0);
        const refObj = refacciones.find((r) => r.id === u.refaccionId);
        if (refObj && (refObj.existencias <= 0 || refObj.existencias < net)) {
          const vehiculo = params.vehiculos?.find((v) => v.id === ord.vehiculoId);
          const vehiculoDesc = vehiculo
            ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`
            : 'Vehículo en taller';

          impactoEnTaller.push({
            ordenId: ord.id,
            folioOrden: ord.folio,
            vehiculoDesc,
            servicioDesc: ord.servicio || 'Servicio correctivo',
            estadoOrden: ord.estado,
            refaccionAfectada: `${refObj.nombre} (${refObj.codigo})`,
            descripcionImpacto: `La orden requiere ${net} pz(s) pero solo hay ${refObj.existencias} en existencias. Posible retraso de ${refObj.diasEntregaEstimados ?? 2} día(s) hábiles si debe ordenarse a ${refObj.proveedor || 'proveedor'}.`,
            nivelRiesgo: refObj.existencias === 0 ? 'alto' : 'medio',
          });
        }
      });
    }
  });

  // Si no hay órdenes con déficit directo, evaluar servicios comunes o preventivos
  if (impactoEnTaller.length === 0 && refaccionesAtencion.some((r) => r.estadoStock === 'agotado')) {
    const agotadas = refaccionesAtencion.filter((r) => r.estadoStock === 'agotado');
    agotadas.slice(0, 3).forEach((ag) => {
      impactoEnTaller.push({
        refaccionAfectada: `${ag.nombre} (${ag.codigo})`,
        descripcionImpacto: `Pieza agotada en stock. Nuevas órdenes o cotizaciones que requieran este componente experimentarán tiempos de espera de entrega de refacción.`,
        nivelRiesgo: 'medio',
      });
    });
  }

  // 4. Proveedores recomendados según tiempos y catálogo
  const proveedoresMap: Record<string, {
    telefono?: string;
    diasEntrega: number;
    refacciones: string[];
    conteo: number;
  }> = {};

  refacciones.forEach((r) => {
    const provName = r.proveedor?.trim() || 'Sin proveedor asignado';
    if (!proveedoresMap[provName]) {
      proveedoresMap[provName] = {
        telefono: r.telefonoProveedor,
        diasEntrega: r.diasEntregaEstimados ?? 2,
        refacciones: [],
        conteo: 0,
      };
    }
    proveedoresMap[provName].conteo += 1;
    if (proveedoresMap[provName].refacciones.length < 4) {
      proveedoresMap[provName].refacciones.push(`${r.nombre} (${r.codigo})`);
    }
  });

  const proveedoresSugeridos: ProveedorSugeridoIA[] = Object.entries(proveedoresMap)
    .filter(([name]) => name !== 'Sin proveedor asignado')
    .map(([proveedor, data]) => {
      const tiempo = data.diasEntrega;
      const nivelConfianza: 'alto' | 'medio' | 'regular' = tiempo <= 1 ? 'alto' : tiempo <= 3 ? 'medio' : 'regular';
      return {
        proveedor,
        telefono: data.telefono,
        diasEntrega: tiempo,
        refaccionesDisponibles: data.refacciones,
        motivoSugerencia: `Proveedor registrado con tiempo de respuesta estimado de ${tiempo} día(s). Surte ${data.conteo} línea(s) de catálogo activas.`,
        nivelConfianza,
      };
    });

  // Prioridades counts
  const urgentes = comprasRecomendadas.filter((c) => c.prioridad === 'urgente').length;
  const proximas = comprasRecomendadas.filter((c) => c.prioridad === 'proxima').length;
  const preventivas = comprasRecomendadas.filter((c) => c.prioridad === 'preventiva').length;

  // 5. Generar texto resumen de compra para copiar o imprimir
  let resumenParaCompraTexto = `RESUMEN DE REABASTECIMIENTO DE ALMACÉN - TALLER MECÁNICO\n`;
  resumenParaCompraTexto += `Fecha de generación: ${new Date().toLocaleDateString('es-MX')} | Total sugerencias: ${comprasRecomendadas.length}\n`;
  resumenParaCompraTexto += `------------------------------------------------------------\n`;
  if (comprasRecomendadas.length === 0) {
    resumenParaCompraTexto += `El inventario se encuentra en niveles óptimos de existencias.\nNo se detectan compras requeridas con base en el stock mínimo actual.\n`;
  } else {
    comprasRecomendadas.forEach((c, idx) => {
      resumenParaCompraTexto += `${idx + 1}. [${c.prioridad.toUpperCase()}] ${c.nombre} (Cód: ${c.codigo})\n`;
      resumenParaCompraTexto += `   - Cantidad sugerida: ${c.cantidadSugerida} piezas\n`;
      resumenParaCompraTexto += `   - Costo unitario aprox: $${c.precioCompraEstimado.toFixed(2)} MXN | Total aprox: $${(c.cantidadSugerida * c.precioCompraEstimado).toFixed(2)} MXN\n`;
      resumenParaCompraTexto += `   - Proveedor: ${c.proveedorSugerido || 'No especificado'}${c.telefonoProveedor ? ` (Tel: ${c.telefonoProveedor})` : ''}\n`;
      resumenParaCompraTexto += `   - Motivo: ${c.motivo}\n\n`;
    });
    const subtotalEst = comprasRecomendadas.reduce(
      (sum, c) => sum + c.cantidadSugerida * c.precioCompraEstimado,
      0
    );
    resumenParaCompraTexto += `------------------------------------------------------------\n`;
    resumenParaCompraTexto += `Inversión total estimada en compras sugeridas: $${subtotalEst.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
    resumenParaCompraTexto += `* Cantidades sujetas a validación y autorización previa por el encargado de compras.\n`;
  }

  const resumenGeneral = refaccionesAtencion.length > 0
    ? `Se detectaron ${refaccionesAtencion.length} refacciones con atención requerida (${urgentes} urgentes, ${proximas} próximas y ${preventivas} preventivas). Hay ${preciosMargenAlertas.length} alertas de margen o precio, y ${impactoEnTaller.length} posibles impactos operativos.`
    : `El almacén opera con existencias estables. Se analizaron ${refacciones.length} refacciones y ${ordenesPendientes.length} órdenes de trabajo sin registrar desabastos críticos inmediatos.`;

  return {
    resumenGeneral,
    refaccionesAtencion,
    comprasRecomendadas,
    prioridades: {
      urgentes,
      proximas,
      preventivas,
    },
    impactoEnTaller,
    preciosMargenAlertas,
    proveedoresSugeridos,
    resumenParaCompraTexto,
    datosFaltantes: Array.from(new Set(datosFaltantes)),
    advertenciaRegla: 'Recomendaciones basadas en los datos registrados; requieren validación del responsable.',
    esAnalisisLocal: true,
    modeloUtilizado: 'Análisis heurístico local de inventario y rotación',
  };
}
