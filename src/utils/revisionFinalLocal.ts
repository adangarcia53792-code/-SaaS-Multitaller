import {
  OrdenTrabajo,
  Cotizacion,
  Vehiculo,
  Cliente,
  Refaccion,
  Factura,
  Garantia,
  ConfiguracionTaller,
  ResultadoRevisionFinalIA,
  EstadoEntregaRevisionFinal,
  DiferenciaRevisionFinal,
  PendienteImportanteRevisionFinal,
  RecomendacionMantenimientoRevisionFinal,
} from '../types';

interface GenerarRevisionFinalParams {
  orden: OrdenTrabajo;
  cotizacion?: Cotizacion;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
  refacciones?: Refaccion[];
  facturas?: Factura[];
  garantias?: Garantia[];
  configuracion?: ConfiguracionTaller;
  responsable?: {
    nombre?: string;
    rol?: string;
  };
}

export const generarRevisionFinalLocal = ({
  orden,
  cotizacion,
  vehiculo,
  cliente,
  refacciones = [],
  facturas = [],
  garantias = [],
  configuracion,
  responsable,
}: GenerarRevisionFinalParams): ResultadoRevisionFinalIA => {
  const nombreTaller = configuracion?.nombre || 'TUNNO';
  const nombreCliente = cliente?.nombre || 'Estimado cliente';
  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.año ? ` (${vehiculo.año})` : ''}`
    : 'Vehículo';
  const placas = vehiculo?.placas || 'Placas N/D';

  const hoyStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const refaccionMap = new Map<string, Refaccion>();
  refacciones.forEach((r) => refaccionMap.set(r.id, r));

  // 1. Identificar factura asociada
  const facturaAsociada = facturas.find(
    (f) =>
      (f.cotizacionId && cotizacion && f.cotizacionId === cotizacion.id) ||
      (f.vehiculoId && vehiculo && f.vehiculoId === vehiculo.id && f.descripcion?.includes(orden.folio)) ||
      (f.folio && f.folio.includes(orden.folio))
  );

  // 2. Identificar póliza de garantía
  const garantiaAsociada = garantias.find(
    (g) => g.ordenId === orden.id || (vehiculo && g.vehiculoId === vehiculo.id && g.estado === 'Vigente')
  );

  // 3. Revisar checklist y flags de orden
  const tieneTrabajoTerminado = Boolean(orden.trabajoTerminado);
  const tieneRevisionFinal = Boolean(orden.revisionFinal);
  const tieneDiagnostico = Boolean(orden.diagnostico && orden.diagnostico.trim().length > 0);
  const tieneObsMecanico = Boolean(
    orden.observacionesMecanico && orden.observacionesMecanico.trim().length > 0
  );
  const tieneDaños = Boolean(orden.dañosVisibles && orden.dañosVisibles.trim().length > 0);
  const tieneKm = Boolean(orden.kilometraje && orden.kilometraje.trim().length > 0);

  // 4. Detectar Diferencias
  const diferencias: DiferenciaRevisionFinal[] = [];

  if (!cotizacion) {
    diferencias.push({
      tipo: 'trabajo_no_autorizado',
      titulo: 'Sin cotización vinculada',
      descripcion: `La orden ${orden.folio} no cuenta con una cotización presupuestada y vinculada en el sistema.`,
      gravedad: 'media',
    });
  } else if (cotizacion.estado !== 'Aprobada') {
    diferencias.push({
      tipo: 'trabajo_no_autorizado',
      titulo: `Cotización ${cotizacion.folio} en estado "${cotizacion.estado}"`,
      descripcion: 'El trabajo se marcó como terminado pero la cotización no tiene estatus formal de "Aprobada".',
      gravedad: 'alta',
    });
  } else if (!cotizacion.autorizacion) {
    diferencias.push({
      tipo: 'trabajo_no_autorizado',
      titulo: 'Falta firma o registro de autorización en la cotización',
      descripcion: `La cotización ${cotizacion.folio} está aprobada pero no cuenta con nombre ni fecha/hora de autorización registrada.`,
      gravedad: 'media',
    });
  }

  // Refacciones utilizadas vs cotización
  const totalRefaccionesUsadas = orden.refaccionesUtilizadas?.length || 0;
  if (totalRefaccionesUsadas > 0 && cotizacion && cotizacion.importeRefacciones <= 0) {
    diferencias.push({
      tipo: 'costo_diferente',
      titulo: 'Piezas de almacén asignadas sin costo en cotización',
      descripcion: `Se utilizaron ${totalRefaccionesUsadas} partida(s) de refacciones pero la cotización tenía $0.00 en refacciones.`,
      gravedad: 'media',
    });
  }

  // 5. Detectar Pendientes Importantes
  const pendientesImportantes: PendienteImportanteRevisionFinal[] = [];

  // Control de Calidad
  if (tieneRevisionFinal) {
    pendientesImportantes.push({
      categoria: 'Control de calidad',
      descripcion: 'Inspección técnica final y control de calidad aprobado.',
      resuelto: true,
    });
  } else {
    pendientesImportantes.push({
      categoria: 'Control de calidad',
      descripcion: 'Falta realizar o registrar la revisión final de control de calidad.',
      resuelto: false,
    });
  }

  // Firma / Autorización
  if (cotizacion?.autorizacion) {
    pendientesImportantes.push({
      categoria: 'Firma',
      descripcion: `Autorizado por ${cotizacion.autorizacion.autorizadoPor} (${cotizacion.autorizacion.fechaHora || 'Fecha registrada'}).`,
      resuelto: true,
    });
  } else {
    pendientesImportantes.push({
      categoria: 'Firma',
      descripcion: 'Confirmación y firma de autorización de trabajos pendiente de asentar.',
      resuelto: false,
    });
  }

  // Facturación
  if (facturaAsociada) {
    pendientesImportantes.push({
      categoria: 'Facturación',
      descripcion: `Factura ${facturaAsociada.folio} emitida por $${facturaAsociada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${facturaAsociada.estado}).`,
      resuelto: true,
    });
  } else {
    pendientesImportantes.push({
      categoria: 'Facturación',
      descripcion: 'Factura fiscal aún no generada para este servicio.',
      resuelto: false,
    });
  }

  // Pago
  if (facturaAsociada?.estado === 'Pagada' || (facturaAsociada?.pago && facturaAsociada.pago.monto)) {
    pendientesImportantes.push({
      categoria: 'Pago',
      descripcion: `Servicio liquidado en su totalidad ($${facturaAsociada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).`,
      resuelto: true,
    });
  } else if (facturaAsociada?.estado === 'Pendiente') {
    pendientesImportantes.push({
      categoria: 'Pago',
      descripcion: `Importe pendiente de cobro en caja ($${facturaAsociada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN).`,
      resuelto: false,
    });
  } else {
    pendientesImportantes.push({
      categoria: 'Pago',
      descripcion: `Liquidación pendiente: cotización autorizada por $${(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN sin registro de pago previo.`,
      resuelto: false,
    });
  }

  // Refacciones
  if (totalRefaccionesUsadas > 0) {
    const resumenRef = orden.refaccionesUtilizadas!
      .map((ru) => {
        const item = refaccionMap.get(ru.refaccionId);
        return `${ru.cantidad}x ${item?.nombre || 'Refacción'}${ru.devueltas ? ` (${ru.devueltas} devueltas)` : ''}`;
      })
      .join(', ');

    pendientesImportantes.push({
      categoria: 'Refacciones',
      descripcion: `Refacciones documentadas en almacén: ${resumenRef}.`,
      resuelto: true,
    });
  } else {
    pendientesImportantes.push({
      categoria: 'Refacciones',
      descripcion: 'Servicio concluido sin salida de refacciones adicionales de almacén.',
      resuelto: true,
    });
  }

  // 6. Detectar Datos Faltantes
  const datosFaltantes: string[] = [];
  if (!tieneKm) {
    datosFaltantes.push('Kilometraje final al momento de entrega no registrado.');
  }
  if (!tieneDiagnostico) {
    datosFaltantes.push('Diagnóstico técnico inicial sin redactar en la orden.');
  }
  if (!tieneObsMecanico) {
    datosFaltantes.push('Observaciones o bitácora de hallazgos del mecánico en blanco.');
  }
  if (!tieneDaños) {
    datosFaltantes.push('Inventario de daños visibles o estado de carrocería no documentado.');
  }
  if (!cliente?.telefono) {
    datosFaltantes.push('Teléfono del cliente no registrado para envío de notificación de WhatsApp.');
  }

  // 7. Determinar Estado de Entrega
  let estadoEntrega: EstadoEntregaRevisionFinal = 'Lista para entregar';
  let justificacionEstado = '';

  const tienePendientesCriticos =
    !tieneTrabajoTerminado || !tieneRevisionFinal || diferencias.some((d) => d.gravedad === 'alta');

  const tienePendientesSecundarios =
    pendientesImportantes.some((p) => (p.categoria === 'Pago' || p.categoria === 'Firma') && !p.resuelto) ||
    diferencias.length > 0 ||
    datosFaltantes.length > 2;

  if (tienePendientesCriticos) {
    estadoEntrega = 'Incompleta';
    justificacionEstado =
      'El vehículo presenta puntos críticos pendientes de liberación: control de calidad sin registrar o cotización sin formalizar.';
  } else if (tienePendientesSecundarios) {
    estadoEntrega = 'Requiere revisión';
    justificacionEstado =
      'Los trabajos mecánicos finalizaron, pero se detectan cobros o autorizaciones pendientes antes de entregar las llaves al cliente.';
  } else {
    estadoEntrega = 'Lista para entregar';
    justificacionEstado =
      'Trabajos concluidos, control de calidad verificado y expediente en orden para la entrega del vehículo.';
  }

  // 8. Resumen para el cliente
  const detalleTrabajo =
    orden.observacionesMecanico?.trim() ||
    orden.diagnostico?.trim() ||
    orden.servicio ||
    'Mantenimiento general preventivo y correctivo';

  const resumenCliente =
    `Estimado(a) ${nombreCliente}, le informamos que hemos finalizado con éxito los trabajos en su ${vehiculoDesc} ` +
    `(placas ${placas}). Se realizó: ${orden.servicio}. ` +
    (orden.observacionesMecanico
      ? `Detalles técnicos: ${orden.observacionesMecanico}. `
      : 'Todos los componentes intervenidos fueron inspeccionados y probados. ') +
    `Su unidad pasó satisfactoriamente las pruebas de verificación técnica y se encuentra en óptimas condiciones para circular con seguridad.`;

  // 9. Recomendaciones de mantenimiento
  const recomendacionesMantenimiento: RecomendacionMantenimientoRevisionFinal[] = [];

  recomendacionesMantenimiento.push({
    servicio: 'Verificación de torque de ruedas y niveles de fluidos',
    fechaSugerida: 'En 15 días hábiles',
    kilometrajeSugerido: '+500 km',
    motivo: 'Inspección preventiva de asentamiento de componentes y fluidos tras la reparación.',
  });

  recomendacionesMantenimiento.push({
    servicio: 'Próximo servicio de afinación y lubricación de motor',
    fechaSugerida: 'En 6 meses',
    kilometrajeSugerido: '+5,000 km',
    motivo: 'Intervalo estándar recomendado para mantener la protección y vida útil del motor.',
  });

  if (vehiculo?.año && parseInt(vehiculo.año, 10) < 2021) {
    recomendacionesMantenimiento.push({
      servicio: 'Revisión preventiva de suspensión y amortiguadores',
      fechaSugerida: 'En 90 días',
      kilometrajeSugerido: '+3,000 km',
      motivo: 'Inspección de desgaste por kilometraje acumulado para evitar vibraciones o desgaste prematuro de neumáticos.',
    });
  }

  // 10. Mensaje de entrega para WhatsApp
  const mensajeEntregaWhatsApp =
    `¡Hola ${nombreCliente.split(' ')[0]}! Le saludamos cordialmente de ${nombreTaller}. ` +
    `Le informamos con gusto que su ${vehiculoDesc} (placas ${placas}) está LISTO para ser entregado tras concluir el trabajo de: ${orden.servicio}. ` +
    `Puede pasar a recogerlo en nuestro taller en el horario habitual. Con gusto le esperamos para entregarle sus llaves y el informe de servicio.`;

  // 11. Garantía aplicable
  const garantiaTexto = garantiaAsociada
    ? `Póliza de garantía ${garantiaAsociada.folio} (${garantiaAsociada.duracionDias} días de vigencia): ampara "${garantiaAsociada.trabajoCubierto}".`
    : 'Garantía estándar del taller: 90 días o 5,000 km en mano de obra y refacciones suministradas bajo uso ordinario.';

  // 12. Responsable
  const respNombre = responsable?.nombre || orden.mecanicoNombre || 'Responsable de Calidad';
  const respRol = responsable?.rol || 'Control de calidad';

  return {
    estadoEntrega,
    justificacionEstado,
    datosFaltantes,
    diferencias,
    pendientesImportantes,
    resumenCliente,
    recomendacionesMantenimiento,
    mensajeEntregaWhatsApp,
    garantiaAplicableTexto: garantiaTexto,
    responsableRevision: {
      nombre: respNombre,
      rol: respRol,
      fechaRevision: hoyStr,
    },
    avisoResponsabilidad:
      'Revisión de apoyo; la liberación del vehículo corresponde al responsable de calidad.',
    esAnalisisLocal: true,
    modeloUtilizado: 'Motor heurístico local de validación previa a entrega',
    generadoEn: new Date().toISOString(),
  };
};
