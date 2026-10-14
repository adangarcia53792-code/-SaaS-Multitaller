import { Cotizacion, Cliente, Vehiculo, ServicioCatalogo, ConfiguracionTaller, Refaccion } from '../types';

export type EstadoAnalisis = 'Correcta' | 'Requiere revisión' | 'Incompleta';

export interface AlertaAnalisis {
  tipo: 'error' | 'advertencia' | 'info';
  titulo: string;
  descripcion: string;
}

export interface MetricasFinancierasAnalisis {
  costoEstimado: number;
  precioVenta: number;
  margenEstimadoPorcentaje: number;
  utilidadBruta: number;
  observacionMargen: string;
}

export interface AnalisisCotizacionResultado {
  estadoGeneral: EstadoAnalisis;
  resumenEstado: string;
  alertas: AlertaAnalisis[];
  metricasFinancieras: MetricasFinancierasAnalisis;
  recomendaciones: string[];
  descripcionMejorada: string;
  mensajeWhatsApp: string;
  esAnalisisLocal: boolean;
  modeloUtilizado?: string;
}

export interface ParametrosAnalisis {
  cotizacion: Cotizacion;
  cliente?: Cliente | null;
  vehiculo?: Vehiculo | null;
  servicios?: ServicioCatalogo[];
  refacciones?: Refaccion[];
  configuracion?: ConfiguracionTaller | null;
}

/**
 * Genera un análisis heurístico local inteligente para la cotización seleccionada.
 * Garantiza que la función de IA siempre entregue resultados completos y accionables
 * incluso si no hay conexión a internet o clave de Gemini configurada.
 */
export function generarAnalisisCotizacionLocal({
  cotizacion,
  cliente,
  vehiculo,
  configuracion,
}: ParametrosAnalisis): AnalisisCotizacionResultado {
  const alertas: AlertaAnalisis[] = [];
  const recomendaciones: string[] = [];

  const clienteNombre = cliente?.nombre || 'Cliente';
  const clienteTelefono = cliente?.telefono?.trim();
  const clienteRfc = (cliente as any)?.rfc?.trim();

  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año || ''}`.trim()
    : 'Vehículo del cliente';
  const vehiculoPlacas = vehiculo?.placas?.trim();
  const vehiculoKm = (vehiculo as any)?.kilometraje?.trim();

  const refaccionesVal = Number(cotizacion.importeRefacciones) || 0;
  const manoObraVal = Number(cotizacion.importeManoObra) || 0;
  const totalVal = Number(cotizacion.total) || 0;
  const descripcion = (cotizacion.descripcion || '').trim();

  // 1. REVISIÓN: DATOS DEL CLIENTE Y VEHÍCULO
  if (!cliente) {
    alertas.push({
      tipo: 'error',
      titulo: 'Cliente no vinculado',
      descripcion: 'La cotización no tiene un cliente válido asociado en la base de datos.',
    });
  } else {
    if (!clienteTelefono) {
      alertas.push({
        tipo: 'advertencia',
        titulo: 'Teléfono no registrado',
        descripcion: 'El cliente no tiene número de teléfono registrado, lo que impedirá enviarle el mensaje por WhatsApp.',
      });
      recomendaciones.push('Solicitar y registrar el número de WhatsApp del cliente para agilizar la autorización digital.');
    }
    if (!clienteRfc || clienteRfc.toUpperCase() === 'XAXX010101000') {
      alertas.push({
        tipo: 'info',
        titulo: 'RFC al público en general',
        descripcion: 'El cliente cuenta con RFC genérico. Si requiere factura con validez fiscal, se deberá solicitar su Constancia de Situación Fiscal.',
      });
    }
  }

  if (!vehiculo) {
    alertas.push({
      tipo: 'error',
      titulo: 'Vehículo no seleccionado',
      descripcion: 'No se ha asociado un automóvil específico a esta cotización.',
    });
  } else {
    if (!vehiculoPlacas || vehiculoPlacas.toUpperCase() === 'S/P' || vehiculoPlacas.length < 3) {
      alertas.push({
        tipo: 'advertencia',
        titulo: 'Placas ausentes o incompletas',
        descripcion: 'Es recomendable registrar las placas oficiales para evitar confusiones en el patio de servicio.',
      });
    }
    if (!vehiculoKm || vehiculoKm === '0') {
      alertas.push({
        tipo: 'advertencia',
        titulo: 'Kilometraje no registrado',
        descripcion: 'No se registró el odómetro actual. El kilometraje es indispensable para validar garantías y próximos mantenimientos.',
      });
      recomendaciones.push('Verificar y capturar el odómetro exacto al recibir la unidad en taller.');
    }
  }

  // 2. REVISIÓN: DESCRIPCIÓN DEL SERVICIO Y CLARIDAD
  const palabrasClaveRefacciones = ['balatas', 'aceite', 'filtro', 'bujia', 'bujías', 'amortiguador', 'bomba', 'disco', 'banda', 'kit', 'refaccion', 'pieza'];
  const mencionaPiezasEnTexto = palabrasClaveRefacciones.some((kw) =>
    descripcion.toLowerCase().includes(kw)
  );

  if (descripcion.length < 15) {
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Descripción demasiado escueta',
      descripcion: 'La descripción actual es muy breve o vaga. Un detalle insuficiente puede generar dudas o reclamos del cliente.',
    });
    recomendaciones.push('Desglosar los puntos de inspección, marca de componentes y mano de obra técnica para mayor transparencia.');
  }

  // 3. REVISIÓN: COSTOS, IMPORTES EN CERO E INCONSISTENCIAS
  if (totalVal <= 0) {
    alertas.push({
      tipo: 'error',
      titulo: 'Total en $0.00 MXN',
      descripcion: 'El importe total de la cotización es cero o negativo. No se puede presentar una cotización sin valor comercial.',
    });
  }

  if (refaccionesVal === 0 && mencionaPiezasEnTexto) {
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Refacciones en $0.00 MXN con piezas descritas',
      descripcion: 'La descripción menciona repuestos o insumos mecánicos, pero el importe de refacciones está en ceros. Verifica si faltó cotizar las partes.',
    });
    recomendaciones.push('Verificar si las piezas serán suministradas por el cliente o si se omitió ingresar el costo de refacciones.');
  }

  if (manoObraVal === 0 && totalVal > 0) {
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Mano de obra en $0.00 MXN',
      descripcion: 'El concepto de servicio o mano de obra está en ceros. Si hay tiempo de taller invertido, debe presupuestarse.',
    });
  }

  const sumaEsperada = Math.round((refaccionesVal + manoObraVal) * 100) / 100;
  const diferencia = Math.abs(totalVal - sumaEsperada);
  if (diferencia > 0.05) {
    alertas.push({
      tipo: 'error',
      titulo: 'Inconsistencia en la suma',
      descripcion: `La suma de refacciones ($${refaccionesVal.toFixed(2)}) y mano de obra ($${manoObraVal.toFixed(2)}) es $${sumaEsperada.toFixed(2)}, pero el total es $${totalVal.toFixed(2)}.`,
    });
    recomendaciones.push('Ajustar el importe total para que coincida exactamente con la suma de las partidas.');
  }

  // 4. PRECIO TOTAL Y MARGEN ESTIMADO
  // Modelo financiero automotriz: costo de refacciones ~62% del PVP, costo directo MO ~38% de PVP
  const costoRefaccionesEstimado = Math.round(refaccionesVal * 0.62 * 100) / 100;
  const costoManoObraEstimado = Math.round(manoObraVal * 0.38 * 100) / 100;
  const costoTotalEstimado = Math.round((costoRefaccionesEstimado + costoManoObraEstimado) * 100) / 100;
  const utilidadBruta = Math.round((totalVal - costoTotalEstimado) * 100) / 100;
  const margenEstimadoPorcentaje = totalVal > 0
    ? Math.round((utilidadBruta / totalVal) * 1000) / 10
    : 0;

  let observacionMargen = 'Margen saludable y competitivo dentro de los parámetros del taller (35% - 55%).';
  if (margenEstimadoPorcentaje < 25 && totalVal > 0) {
    observacionMargen = 'Margen ajustado (< 25%). Se sugiere evaluar si el costo de adquisición de piezas o el tiempo de taller permite un ajuste.';
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Margen de utilidad reducido',
      descripcion: `El margen bruto estimado es del ${margenEstimadoPorcentaje}%. Considera revisar el costo de repuestos o el tabulador de mano de obra.`,
    });
  } else if (margenEstimadoPorcentaje > 65) {
    observacionMargen = 'Margen alto (> 65%), típico de servicios donde predomina diagnóstico y mano de obra especializada.';
  }

  // 5. VIGENCIA, CONDICIONES Y AUTORIZACIÓN
  if (cotizacion.estado === 'Por autorizar') {
    alertas.push({
      tipo: 'info',
      titulo: 'Pendiente de confirmación del cliente',
      descripcion: 'La cotización aún no ha sido autorizada. Se aconseja no iniciar compras de partes bajo pedido hasta contar con el visto bueno del cliente.',
    });
    recomendaciones.push('Enviar propuesta por WhatsApp y solicitar respuesta explícita para registrar la autorización en el sistema.');
  } else if (cotizacion.estado === 'Aprobada') {
    alertas.push({
      tipo: 'info',
      titulo: 'Cotización aprobada',
      descripcion: 'Cuenta con visto bueno. Puedes proceder con la generación de orden de trabajo o comprobante de cobro.',
    });
  } else if (cotizacion.estado === 'Rechazada') {
    alertas.push({
      tipo: 'advertencia',
      titulo: 'Cotización rechazada',
      descripcion: 'El cliente declinó el presupuesto. Verifica si se requiere preparar una alternativa con refacciones equivalentes.',
    });
  }

  // 6. ESTADO GENERAL
  let estadoGeneral: EstadoAnalisis = 'Correcta';
  let resumenEstado = 'La cotización cuenta con datos completos, importes consistentes y margen de rentabilidad adecuado.';

  const tieneErrores = alertas.some((a) => a.tipo === 'error');
  const conteoAdvertencias = alertas.filter((a) => a.tipo === 'advertencia').length;

  if (totalVal <= 0 || !cliente || !vehiculo || diferencia > 0.05) {
    estadoGeneral = 'Incompleta';
    resumenEstado = 'La cotización tiene inconsistencias críticas o datos indispensables faltantes que deben corregirse antes de presentarla.';
  } else if (tieneErrores || conteoAdvertencias >= 2) {
    estadoGeneral = 'Requiere revisión';
    resumenEstado = 'La cotización es viable pero presenta alertas de datos, importes en ceros o margen que ameritan validación.';
  } else if (conteoAdvertencias === 1) {
    estadoGeneral = 'Requiere revisión';
    resumenEstado = 'Cotización casi lista; se identificó un detalle puntual a verificar antes de enviar.';
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push('Confirmar con el cliente la fecha tentativa de entrega antes de formalizar la orden.');
    recomendaciones.push('Recordar al cliente la vigencia estándar de la cotización (15 días naturales).');
    recomendaciones.push('Conservar nota de refacciones utilizadas para alimentar la bitácora del vehículo.');
  }

  // 7. DESCRIPCIÓN MEJORADA
  const tallerNombre = configuracion?.nombre || 'TUNNO';
  const descripcionLimpia = descripcion || 'Servicio de mantenimiento y reparación mecánica';
  const descripcionMejorada = `Mantenimiento profesional para ${vehiculoDesc} (${vehiculoPlacas || 'S/P'}):
• Diagnóstico y servicio técnico: ${descripcionLimpia}.
• Suministro de refacciones automotrices de equipo original / certificadas ($${refaccionesVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).
• Mano de obra especializada por técnicos certificados con torque y pruebas dinámicas ($${manoObraVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).
• Inspección complementaria de seguridad en 25 puntos clave (niveles de fluidos, luces, suspensión y frenos).
• Garantía de servicio por escrito en mano de obra y refacciones suministradas por ${tallerNombre}.`;

  // 8. MENSAJE PARA WHATSAPP
  const primerNombre = clienteNombre.split(' ')[0] || 'Estimado(a) cliente';
  const mensajeWhatsApp = `Hola ${primerNombre}, le saluda ${tallerNombre} 🚗🔧

Le compartimos la cotización *${cotizacion.folio}* para su vehículo *${vehiculoDesc}* (Placas: ${vehiculoPlacas || 'N/D'}):

📋 *Trabajos cotizados:*
${descripcionLimpia}

💰 *Inversión total:* $${totalVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
${refaccionesVal > 0 ? `• Refacciones: $${refaccionesVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` : ''}${manoObraVal > 0 ? `• Mano de obra: $${manoObraVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n` : ''}
Incluye garantía por escrito y revisión preventiva de seguridad.

¿Nos autoriza dar inicio a los trabajos o tiene alguna duda sobre el presupuesto? Quedamos a sus órdenes. ¡Gracias por su confianza!`;

  return {
    estadoGeneral,
    resumenEstado,
    alertas,
    metricasFinancieras: {
      costoEstimado: costoTotalEstimado,
      precioVenta: totalVal,
      margenEstimadoPorcentaje,
      utilidadBruta,
      observacionMargen,
    },
    recomendaciones,
    descripcionMejorada,
    mensajeWhatsApp,
    esAnalisisLocal: true,
  };
}
