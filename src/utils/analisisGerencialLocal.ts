import {
  OrdenTrabajo,
  Cotizacion,
  Cita,
  Factura,
  Refaccion,
  ServicioCatalogo,
  MovimientoInventario,
  Empleado,
  Cliente,
  Seguimiento,
  Garantia,
  ConfiguracionTaller,
  PeriodoAnalisisGerencial,
  ResultadoAnalisisGerencialIA,
  IndicadoresGerenciales,
  RecomendacionGerencialIA,
  ComparacionPeriodoAnteriorIA,
} from '../types';

export interface ParametrosAnalisisGerencial {
  ordenes: OrdenTrabajo[];
  cotizaciones: Cotizacion[];
  citas: Cita[];
  facturas: Factura[];
  refacciones: Refaccion[];
  servicios: ServicioCatalogo[];
  movimientos?: MovimientoInventario[];
  empleados?: Empleado[];
  clientes?: Cliente[];
  seguimientos?: Seguimiento[];
  garantias?: Garantia[];
  configuracion?: ConfiguracionTaller;
  periodo: PeriodoAnalisisGerencial;
  fechaDesde?: string;
  fechaHasta?: string;
}

// Helper para calcular rangos de fecha ISO (YYYY-MM-DD)
export function calcularRangosPeriodo(
  periodo: PeriodoAnalisisGerencial,
  fechaDesdeCustom?: string,
  fechaHastaCustom?: string
): {
  desdeActual: string;
  hastaActual: string;
  etiquetaActual: string;
  desdeAnterior: string;
  hastaAnterior: string;
  etiquetaAnterior: string;
} {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === 'hoy') {
    const hoyStr = formatISO(hoy);
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = formatISO(ayer);

    return {
      desdeActual: hoyStr,
      hastaActual: hoyStr,
      etiquetaActual: 'Hoy',
      desdeAnterior: ayerStr,
      hastaAnterior: ayerStr,
      etiquetaAnterior: 'Ayer',
    };
  }

  if (periodo === 'ultimos_7_dias') {
    const hasta = new Date(hoy);
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - 6);

    const hastaAnt = new Date(desde);
    hastaAnt.setDate(hastaAnt.getDate() - 1);
    const desdeAnt = new Date(hastaAnt);
    desdeAnt.setDate(desdeAnt.getDate() - 6);

    return {
      desdeActual: formatISO(desde),
      hastaActual: formatISO(hasta),
      etiquetaActual: 'Últimos 7 días',
      desdeAnterior: formatISO(desdeAnt),
      hastaAnterior: formatISO(hastaAnt),
      etiquetaAnterior: '7 días previos',
    };
  }

  if (periodo === 'este_mes') {
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const desde = new Date(anio, mes, 1);
    const hasta = new Date(anio, mes + 1, 0); // Último día de este mes

    // Mes anterior
    const desdeAnt = new Date(anio, mes - 1, 1);
    const hastaAnt = new Date(anio, mes, 0);

    const nombresMes = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return {
      desdeActual: formatISO(desde),
      hastaActual: formatISO(hasta),
      etiquetaActual: `${nombresMes[mes]} ${anio}`,
      desdeAnterior: formatISO(desdeAnt),
      hastaAnterior: formatISO(hastaAnt),
      etiquetaAnterior: `${nombresMes[desdeAnt.getMonth()]} ${desdeAnt.getFullYear()}`,
    };
  }

  // Personalizado
  const dInicio = fechaDesdeCustom || formatISO(new Date(hoy.getTime() - 30 * 86400000));
  const dFin = fechaHastaCustom || formatISO(hoy);
  
  const dateObjInicio = new Date(dInicio);
  const dateObjFin = new Date(dFin);
  const diffTime = Math.max(0, dateObjFin.getTime() - dateObjInicio.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const antFin = new Date(dateObjInicio);
  antFin.setDate(antFin.getDate() - 1);
  const antInicio = new Date(antFin);
  antInicio.setDate(antInicio.getDate() - diffDays + 1);

  return {
    desdeActual: dInicio,
    hastaActual: dFin,
    etiquetaActual: `Personalizado (${dInicio} al ${dFin})`,
    desdeAnterior: formatISO(antInicio),
    hastaAnterior: formatISO(antFin),
    etiquetaAnterior: `Periodo previo equivalente (${formatISO(antInicio)} al ${formatISO(antFin)})`,
  };
}

// Extraer fecha limpia (YYYY-MM-DD) de cualquier string ISO o timestamp
function limpiarFecha(fechaStr?: string | null): string {
  if (!fechaStr) return '';
  if (fechaStr.length >= 10 && fechaStr.includes('-')) {
    return fechaStr.substring(0, 10);
  }
  try {
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  } catch {
    // fallback
  }
  return '';
}

function estaEnRango(fechaStr?: string | null, desde?: string, hasta?: string): boolean {
  const f = limpiarFecha(fechaStr);
  if (!f) return false;
  if (desde && f < desde) return false;
  if (hasta && f > hasta) return false;
  return true;
}

// Calcular indicadores numéricos para un rango de fechas
export function calcularIndicadoresParaRango(
  params: ParametrosAnalisisGerencial,
  desde: string,
  hasta: string
): IndicadoresGerenciales {
  const {
    ordenes = [],
    cotizaciones = [],
    facturas = [],
    refacciones = [],
    movimientos = [],
    empleados = [],
    clientes = [],
    seguimientos = [],
    garantias = [],
  } = params;

  // 1. Filtrar facturas en rango
  const facturasEnRango = facturas.filter((f) =>
    estaEnRango(f.fechaCreacion, desde, hasta)
  );

  let ingresosCobrados = 0;
  let ingresosPendientes = 0;

  if (facturasEnRango.length > 0) {
    facturasEnRango.forEach((f) => {
      const total = f.total || f.subtotal || 0;
      if (f.estado === 'Pagada') {
        ingresosCobrados += total;
      } else if (f.estado === 'Pendiente') {
        ingresosPendientes += total;
      }
    });
  } else {
    // Si no hay facturas en rango, usar órdenes como fuente de ingresos operativos
    const ordenesEnRango = ordenes.filter((o) =>
      estaEnRango(o.creadoEn, desde, hasta)
    );
    ordenesEnRango.forEach((o) => {
      const total = o.precioCobrado || o.costoRealTotal || 0;
      const esConcluida = o.estado === 'Terminado' || !!o.entregado || !!o.trabajoTerminado;
      if (esConcluida) {
        ingresosCobrados += total;
      } else {
        ingresosPendientes += total;
      }
    });
  }

  const ingresosTotales = ingresosCobrados + ingresosPendientes;

  // 2. Órdenes en rango
  const ordenesEnRango = ordenes.filter((o) =>
    estaEnRango(o.creadoEn, desde, hasta)
  );

  const ordenesTotales = ordenesEnRango.length;
  let ordenesTerminadas = 0;
  let ordenesEnProceso = 0;
  let ordenesAtrasadas = 0;
  let sumaDiasAtencion = 0;
  let ordenesConTiempo = 0;

  const hoyStr = limpiarFecha(new Date().toISOString());

  // Costos acumulados
  let costoRefacciones = 0;
  let costoManoObra = 0;

  ordenesEnRango.forEach((o) => {
    const esTerminada = o.estado === 'Terminado' || !!o.entregado || !!o.trabajoTerminado;
    if (esTerminada) {
      ordenesTerminadas++;
    } else {
      ordenesEnProceso++;
    }

    // Atraso: si no está terminada y la fecha prometida es menor a hoy
    const fechaPrometida = limpiarFecha(o.fechaEntregaPrometida);
    if (!esTerminada && fechaPrometida && fechaPrometida < hoyStr) {
      ordenesAtrasadas++;
    }

    // Tiempo de atención
    const fInicio = limpiarFecha(o.creadoEn);
    const fFin = limpiarFecha(o.fechaHoraEntrega || (esTerminada ? o.actualizadoEn : null));
    if (fInicio && fFin) {
      const d1 = new Date(fInicio).getTime();
      const d2 = new Date(fFin).getTime();
      const dias = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      sumaDiasAtencion += dias;
      ordenesConTiempo++;
    }

    // Refacciones utilizadas en la orden
    if (Array.isArray(o.refaccionesUtilizadas)) {
      o.refaccionesUtilizadas.forEach((u) => {
        const cant = (u.cantidad || 0) - (u.devueltas || 0);
        if (cant > 0) {
          const ref = refacciones.find((r) => r.id === u.refaccionId);
          const costoUnit = ref?.costoUnitario || ref?.precioCompra || (ref?.precioVenta ? ref.precioVenta * 0.65 : 0);
          costoRefacciones += cant * costoUnit;
        }
      });
    } else if (o.costoRealRefacciones) {
      costoRefacciones += o.costoRealRefacciones;
    }

    // Mano de obra
    if (o.costoRealManoObra) {
      costoManoObra += o.costoRealManoObra;
    }
  });

  const tiempoPromedioAtencionDias =
    ordenesConTiempo > 0 ? Number((sumaDiasAtencion / ordenesConTiempo).toFixed(1)) : 1.5;

  // Si los costos calculados son 0 pero hay ingresos, estimar basados en promedios típicos del taller
  if (costoRefacciones === 0 && ingresosTotales > 0) {
    costoRefacciones = Number((ingresosTotales * 0.38).toFixed(2));
  }
  if (costoManoObra === 0 && ingresosTotales > 0) {
    costoManoObra = Number((ingresosTotales * 0.28).toFixed(2));
  }

  const costosTotales = costoRefacciones + costoManoObra;
  const margenEstimadoPesos = Math.max(0, ingresosTotales - costosTotales);
  const margenEstimadoPorcentaje =
    ingresosTotales > 0 ? Number(((margenEstimadoPesos / ingresosTotales) * 100).toFixed(1)) : 0;

  // 3. Cotizaciones en rango
  const cotizacionesEnRango = cotizaciones.filter((c) =>
    estaEnRango(c.creadoEn, desde, hasta)
  );
  const cotizacionesTotales = cotizacionesEnRango.length;
  let cotizacionesAprobadas = 0;
  let cotizacionesRechazadas = 0;
  let cotizacionesPendientes = 0;

  cotizacionesEnRango.forEach((c) => {
    if (c.estado === 'Aprobada') {
      cotizacionesAprobadas++;
    } else if (c.estado === 'Rechazada') {
      cotizacionesRechazadas++;
    } else {
      cotizacionesPendientes++;
    }
  });

  const tasaConversionCotizaciones =
    cotizacionesTotales > 0
      ? Number(((cotizacionesAprobadas / cotizacionesTotales) * 100).toFixed(1))
      : 0;

  // 4. Productividad por técnico
  const tecnicosMap: Record<
    string,
    { asignadas: number; terminadas: number }
  > = {};

  // Inicializar con empleados mecánicos si existen
  empleados
    .filter((e) => (e.puesto || '').toLowerCase().includes('mec') || (e.puesto || '').toLowerCase().includes('téc'))
    .forEach((e) => {
      tecnicosMap[e.nombre] = { asignadas: 0, terminadas: 0 };
    });

  ordenesEnRango.forEach((o) => {
    const tec = o.mecanicoNombre || 'Técnico de guardia';
    if (!tecnicosMap[tec]) {
      tecnicosMap[tec] = { asignadas: 0, terminadas: 0 };
    }
    tecnicosMap[tec].asignadas++;
    const esTerminada = o.estado === 'Terminado' || !!o.entregado || !!o.trabajoTerminado;
    if (esTerminada) {
      tecnicosMap[tec].terminadas++;
    }
  });

  const productividadTecnicos = Object.entries(tecnicosMap).map(
    ([tecnico, data]) => ({
      tecnico,
      asignadas: data.asignadas,
      terminadas: data.terminadas,
      eficienciaPorcentaje:
        data.asignadas > 0
          ? Number(((data.terminadas / data.asignadas) * 100).toFixed(1))
          : 0,
    })
  ).sort((a, b) => b.terminadas - a.terminadas);

  // 5. Refacciones de mayor movimiento
  const refaccionesMovidasMap: Record<string, { nombre: string; codigo: string; unidades: number }> = {};

  // Contar desde órdenes
  ordenesEnRango.forEach((o) => {
    if (Array.isArray(o.refaccionesUtilizadas)) {
      o.refaccionesUtilizadas.forEach((u) => {
        const cant = (u.cantidad || 0) - (u.devueltas || 0);
        if (cant > 0) {
          const key = u.refaccionId;
          const ref = refacciones.find((r) => r.id === u.refaccionId);
          if (!refaccionesMovidasMap[key]) {
            refaccionesMovidasMap[key] = {
              nombre: ref?.nombre || 'Refacción de servicio',
              codigo: ref?.codigo || 'REF',
              unidades: 0,
            };
          }
          refaccionesMovidasMap[key].unidades += cant;
        }
      });
    }
  });

  // Contar desde movimientos en rango
  movimientos
    .filter((m) => m.tipo === 'Salida' && estaEnRango(m.fechaHora, desde, hasta))
    .forEach((m) => {
      const key = m.refaccionId;
      const ref = refacciones.find((r) => r.id === m.refaccionId);
      if (!refaccionesMovidasMap[key]) {
        refaccionesMovidasMap[key] = {
          nombre: ref?.nombre || 'Refacción',
          codigo: ref?.codigo || 'REF',
          unidades: 0,
        };
      }
      refaccionesMovidasMap[key].unidades += m.cantidad;
    });

  const refaccionesMayorMovimiento = Object.values(refaccionesMovidasMap)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5)
    .map((r) => ({
      nombre: r.nombre,
      codigo: r.codigo,
      unidadesMovidas: r.unidades,
    }));

  // 6. Clientes nuevos y recurrentes
  const clientesIdsAtendidos = new Set<string>();
  ordenesEnRango.forEach((o) => {
    if (o.clienteId) clientesIdsAtendidos.add(o.clienteId);
  });
  cotizacionesEnRango.forEach((c) => {
    if (c.clienteId) clientesIdsAtendidos.add(c.clienteId);
  });

  let clientesNuevos = 0;
  let clientesRecurrentes = 0;

  clientesIdsAtendidos.forEach((cid) => {
    const cli = clientes.find((c) => c.id === cid);
    if (cli) {
      // Cliente recurrente si ya existía antes o nuevo si es primera vez
      clientesRecurrentes++;
    } else {
      clientesNuevos++;
    }
  });

  const clientesAtendidos = clientesIdsAtendidos.size;

  // 7. Seguimientos pendientes
  const seguimientosPendientes = seguimientos.filter((s) => {
    const est = (s.estado || '').toLowerCase();
    return est === 'pendiente' || est === 'en seguimiento' || est === 'programado';
  }).length;

  // 8. Garantías y trabajos repetidos
  const garantiasEnRango = garantias.filter((g) =>
    estaEnRango(g.creadoEn || g.fechaInicio, desde, hasta)
  );
  const garantiasRegistradas = garantiasEnRango.length;
  const tasaGarantiasPorcentaje =
    ordenesTotales > 0
      ? Number(((garantiasRegistradas / ordenesTotales) * 100).toFixed(1))
      : 0;

  return {
    ingresosCobrados: Number(ingresosCobrados.toFixed(2)),
    ingresosPendientes: Number(ingresosPendientes.toFixed(2)),
    ingresosTotales: Number(ingresosTotales.toFixed(2)),
    costoRefacciones: Number(costoRefacciones.toFixed(2)),
    costoManoObra: Number(costoManoObra.toFixed(2)),
    costosTotales: Number(costosTotales.toFixed(2)),
    margenEstimadoPesos: Number(margenEstimadoPesos.toFixed(2)),
    margenEstimadoPorcentaje,
    cotizacionesTotales,
    cotizacionesAprobadas,
    cotizacionesRechazadas,
    cotizacionesPendientes,
    tasaConversionCotizaciones,
    ordenesTotales,
    ordenesTerminadas,
    ordenesEnProceso,
    ordenesAtrasadas,
    tiempoPromedioAtencionDias,
    productividadTecnicos,
    refaccionesMayorMovimiento,
    clientesAtendidos,
    clientesNuevos,
    clientesRecurrentes,
    seguimientosPendientes,
    garantiasRegistradas,
    tasaGarantiasPorcentaje,
  };
}

// Generador de análisis local heurístico cuando no hay conexión o se usa demostración
export function generarAnalisisGerencialLocal(
  params: ParametrosAnalisisGerencial
): ResultadoAnalisisGerencialIA {
  const { periodo, fechaDesde, fechaHasta, configuracion } = params;
  const nombreTaller = configuracion?.nombre || 'Taller Mecánico';

  const rangos = calcularRangosPeriodo(periodo, fechaDesde, fechaHasta);
  const indActual = calcularIndicadoresParaRango(params, rangos.desdeActual, rangos.hastaActual);
  const indAnterior = calcularIndicadoresParaRango(params, rangos.desdeAnterior, rangos.hastaAnterior);

  // 1. Detectar datos faltantes
  const datosFaltantes: string[] = [];
  if (indActual.productividadTecnicos.some((t) => t.tecnico === 'Técnico de guardia')) {
    datosFaltantes.push('Existen órdenes sin mecánico asignado específico.');
  }
  if (indActual.ordenesTotales > 0 && indActual.costoRefacciones === 0) {
    datosFaltantes.push('Órdenes sin desglose de costos directos de refacciones.');
  }
  if (indActual.cotizacionesTotales === 0 && indActual.ordenesTotales > 0) {
    datosFaltantes.push('Se detectan órdenes directas sin cotización previa registrada.');
  }

  // 2. Comparativa con periodo anterior
  const tieneDatosPrevios = indAnterior.ingresosTotales > 0 || indAnterior.ordenesTotales > 0;
  let cambioIngresosPorcentaje: number | undefined;
  let cambioOrdenesPorcentaje: number | undefined;
  let cambioConversionPorcentaje: number | undefined;
  let diferenciaMargenPorcentaje: number | undefined;
  let resumenComparativa = '';

  if (tieneDatosPrevios) {
    if (indAnterior.ingresosTotales > 0) {
      cambioIngresosPorcentaje = Number(
        (((indActual.ingresosTotales - indAnterior.ingresosTotales) / indAnterior.ingresosTotales) * 100).toFixed(1)
      );
    }
    if (indAnterior.ordenesTotales > 0) {
      cambioOrdenesPorcentaje = Number(
        (((indActual.ordenesTotales - indAnterior.ordenesTotales) / indAnterior.ordenesTotales) * 100).toFixed(1)
      );
    }
    cambioConversionPorcentaje = Number(
      (indActual.tasaConversionCotizaciones - indAnterior.tasaConversionCotizaciones).toFixed(1)
    );
    diferenciaMargenPorcentaje = Number(
      (indActual.margenEstimadoPorcentaje - indAnterior.margenEstimadoPorcentaje).toFixed(1)
    );

    const sentidoIngresos =
      (cambioIngresosPorcentaje || 0) >= 0 ? 'incremento' : 'disminución';
    resumenComparativa = `Comparado con ${rangos.etiquetaAnterior}, los ingresos reflejan un ${sentidoIngresos} del ${Math.abs(
      cambioIngresosPorcentaje || 0
    )}% y el volumen de órdenes varió ${
      (cambioOrdenesPorcentaje || 0) >= 0 ? '+' : ''
    }${cambioOrdenesPorcentaje || 0}%.`;
  } else {
    resumenComparativa = `No se registran suficientes movimientos en ${rangos.etiquetaAnterior} para formular un contraste histórico completo; este ciclo servirá como base de referencia.`;
  }

  const comparacion: ComparacionPeriodoAnteriorIA = {
    disponible: tieneDatosPrevios,
    periodoAnteriorNombre: rangos.etiquetaAnterior,
    resumenComparativa,
    cambioIngresosPorcentaje,
    cambioOrdenesPorcentaje,
    cambioConversionPorcentaje,
    diferenciaMargenPorcentaje,
    motivoSiNoDisponible: tieneDatosPrevios
      ? undefined
      : 'Historial previo insuficiente en el rango de fechas seleccionado.',
  };

  // 3. Aspectos positivos
  const aspectosPositivos: string[] = [];
  if (indActual.margenEstimadoPorcentaje >= 30) {
    aspectosPositivos.push(
      `Margen operativo saludable del ${indActual.margenEstimadoPorcentaje}% sobre la facturación del periodo.`
    );
  }
  if (indActual.tasaConversionCotizaciones >= 50) {
    aspectosPositivos.push(
      `Excelente tasa de conversión en cotizaciones (${indActual.tasaConversionCotizaciones}%), con ${indActual.cotizacionesAprobadas} de ${indActual.cotizacionesTotales} aprobadas.`
    );
  } else if (indActual.cotizacionesAprobadas > 0) {
    aspectosPositivos.push(
      `Captación activa con ${indActual.cotizacionesAprobadas} cotizaciones confirmadas y convertidas en trabajo.`
    );
  }
  if (indActual.ordenesTerminadas > 0) {
    aspectosPositivos.push(
      `Cierre operativo de ${indActual.ordenesTerminadas} órdenes de trabajo completadas en tiempo promedio estimado de ${indActual.tiempoPromedioAtencionDias} días.`
    );
  }
  if (indActual.tasaGarantiasPorcentaje <= 5 && indActual.ordenesTotales > 0) {
    aspectosPositivos.push(
      `Índice mínimo de retornos por garantía (${indActual.tasaGarantiasPorcentaje}%), demostrando control de calidad en taller.`
    );
  }
  if (indActual.clientesRecurrentes > 0) {
    aspectosPositivos.push(
      `Fidelización activa con ${indActual.clientesRecurrentes} clientes recurrentes atendidos durante este periodo.`
    );
  }
  if (aspectosPositivos.length === 0) {
    aspectosPositivos.push(
      `Operaciones activas registradas con $${indActual.ingresosTotales.toLocaleString('es-MX')} en movimiento total.`
    );
  }

  // 4. Situaciones que requieren atención
  const situacionesAtencion: string[] = [];
  if (indActual.ingresosPendientes > 0) {
    situacionesAtencion.push(
      `Saldo pendiente por cobrar de $${indActual.ingresosPendientes.toLocaleString('es-MX')} distribuido en órdenes o facturas por liquidar.`
    );
  }
  if (indActual.ordenesAtrasadas > 0) {
    situacionesAtencion.push(
      `${indActual.ordenesAtrasadas} orden(es) excedieron su fecha prometida de entrega o requieren agilización técnica.`
    );
  }
  if (indActual.cotizacionesPendientes > 0) {
    situacionesAtencion.push(
      `${indActual.cotizacionesPendientes} cotización(es) siguen en estado pendiente sin decisión confirmada del cliente.`
    );
  }
  if (indActual.seguimientosPendientes > 0) {
    situacionesAtencion.push(
      `${indActual.seguimientosPendientes} seguimiento(s) de servicio o prospecto comercial pendientes de contacto.`
    );
  }
  if (indActual.garantiasRegistradas > 0) {
    situacionesAtencion.push(
      `${indActual.garantiasRegistradas} reclamación(es) de garantía registrada(s) que requieren auditoría técnica y cierre preventivo.`
    );
  }
  if (situacionesAtencion.length === 0) {
    situacionesAtencion.push(
      'No se identificaron cuellos de botella críticos; se recomienda mantener el ritmo de cierre y seguimiento.'
    );
  }

  // 5. Recomendaciones (máximo 5)
  const recomendaciones: RecomendacionGerencialIA[] = [];

  if (indActual.ingresosPendientes > 0) {
    recomendaciones.push({
      prioridad: 1,
      titulo: 'Cobranza y liquidación de órdenes pendientes',
      area: 'Ingresos',
      accion: `Implementar seguimiento de cobro a clientes con saldo pendiente ($${indActual.ingresosPendientes.toLocaleString('es-MX')}) para mejorar el flujo de caja inmediato.`,
      impactoEsperado: 'Recuperación de liquidez y reducción de cartera vencida.',
    });
  }

  if (indActual.cotizacionesPendientes > 0) {
    recomendaciones.push({
      prioridad: 2,
      titulo: 'Cierre proactivo de cotizaciones abiertas',
      area: 'Ventas',
      accion: `Contactar vía WhatsApp o llamada a los clientes con ${indActual.cotizacionesPendientes} cotizaciones pendientes para resolver dudas y agendar cita.`,
      impactoEsperado: 'Aumento de facturación estimada y mayor ocupación de bahías.',
    });
  }

  if (indActual.ordenesAtrasadas > 0) {
    recomendaciones.push({
      prioridad: 3,
      titulo: 'Agilización de órdenes con tiempo crítico',
      area: 'Operación',
      accion: `Revisar cuellos de botella en las ${indActual.ordenesAtrasadas} órdenes atrasadas (disponibilidad de refacciones o carga de bahía).`,
      impactoEsperado: 'Evitar inconformidad del cliente y cumplir los tiempos prometidos.',
    });
  }

  if (indActual.refaccionesMayorMovimiento.length > 0) {
    const topRef = indActual.refaccionesMayorMovimiento[0].nombre;
    recomendaciones.push({
      prioridad: 4,
      titulo: 'Asegurar stock de refacciones clave',
      area: 'Inventario',
      accion: `Verificar stock de seguridad y precio de compra de piezas de alta rotación como "${topRef}".`,
      impactoEsperado: 'Prevenir paros de bahía y proteger el margen de refacciones.',
    });
  }

  if (indActual.seguimientosPendientes > 0) {
    recomendaciones.push({
      prioridad: 5,
      titulo: 'Atención a cartera y seguimientos preventivos',
      area: 'Calidad',
      accion: `Completar los ${indActual.seguimientosPendientes} seguimientos post-servicio pendientes para reforzar la satisfacción del cliente.`,
      impactoEsperado: 'Aumento de recurrencia y recomendaciones de boca a boca.',
    });
  }

  // Si aún hay espacio para completar hasta 5 recomendaciones
  if (recomendaciones.length < 5) {
    recomendaciones.push({
      prioridad: recomendaciones.length + 1,
      titulo: 'Monitoreo de horas de técnicos y ocupación',
      area: 'Operación',
      accion: 'Balancear la asignación de órdenes entre mecánicos para maximizar la capacidad instalada.',
      impactoEsperado: 'Mayor volumen de vehículos entregados por semana.',
    });
  }

  // Asegurar que las prioridades sean 1 a N y máximo 5
  const topRecomendaciones = recomendaciones.slice(0, 5).map((r, idx) => ({
    ...r,
    prioridad: idx + 1,
  }));

  // 6. Resumen Ejecutivo
  const resumenEjecutivo = `En el periodo ${rangos.etiquetaActual}, ${nombreTaller} generó un total de $${indActual.ingresosTotales.toLocaleString(
    'es-MX'
  )} en ingresos ($${indActual.ingresosCobrados.toLocaleString(
    'es-MX'
  )} cobrados y $${indActual.ingresosPendientes.toLocaleString(
    'es-MX'
  )} pendientes), con un margen bruto estimado del ${indActual.margenEstimadoPorcentaje}%. A nivel operativo se gestionaron ${indActual.ordenesTotales} órdenes (${indActual.ordenesTerminadas} concluidas y ${indActual.ordenesEnProceso} en proceso), logrando una conversión de cotizaciones del ${indActual.tasaConversionCotizaciones}%.`;

  // 7. Resumen para compartir con el gerente (WhatsApp / Correo)
  const formatearMoneda = (val: number) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const resumenParaCompartir = `📊 *INFORME GERENCIAL - ${nombreTaller.toUpperCase()}*
🗓️ *Periodo:* ${rangos.etiquetaActual} (${rangos.desdeActual} al ${rangos.hastaActual})

💰 *FINANZAS & MARGEN:*
• Ingresos totales: ${formatearMoneda(indActual.ingresosTotales)}
• Cobrados: ${formatearMoneda(indActual.ingresosCobrados)} | Pendientes: ${formatearMoneda(indActual.ingresosPendientes)}
• Costos directos est.: ${formatearMoneda(indActual.costosTotales)} (Refacciones + M.O.)
• Margen estimado: ${formatearMoneda(indActual.margenEstimadoPesos)} (${indActual.margenEstimadoPorcentaje}%)

⚙️ *OPERACIONES & TALLER:*
• Órdenes gestionadas: ${indActual.ordenesTotales} (Terminadas: ${indActual.ordenesTerminadas} | En proceso: ${indActual.ordenesEnProceso})
• Órdenes atrasadas: ${indActual.ordenesAtrasadas}
• Tiempo prom. de ciclo: ${indActual.tiempoPromedioAtencionDias} días
• Clientes atendidos: ${indActual.clientesAtendidos} (${indActual.clientesNuevos} nuevos, ${indActual.clientesRecurrentes} recurrentes)

📈 *COMERCIAL & CALIDAD:*
• Cotizaciones: ${indActual.cotizacionesTotales} (Conversión: ${indActual.tasaConversionCotizaciones}%)
• Seguimientos pendientes: ${indActual.seguimientosPendientes}
• Garantías: ${indActual.garantiasRegistradas} (${indActual.tasaGarantiasPorcentaje}%)

🎯 *TOP ACCIONES RECOMENDADAS:*
${topRecomendaciones
  .slice(0, 3)
  .map((r) => `${r.prioridad}. ${r.titulo}: ${r.accion}`)
  .join('\n')}

📌 _Análisis administrativo basado en los datos disponibles de la demostración._`;

  return {
    periodoSeleccionado: periodo,
    etiquetaPeriodo: rangos.etiquetaActual,
    rangoFechas: {
      desde: rangos.desdeActual,
      hasta: rangos.hastaActual,
    },
    resumenEjecutivo,
    aspectosPositivos,
    situacionesAtencion,
    recomendaciones: topRecomendaciones,
    indicadores: indActual,
    comparacion,
    resumenParaCompartir,
    datosFaltantes,
    advertenciaRegla: 'Análisis administrativo basado en los datos disponibles de la demostración.',
    esAnalisisLocal: true,
    modeloUtilizado: 'Análisis gerencial heurístico local',
  };
}
