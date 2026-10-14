import {
  Cliente,
  Vehiculo,
  OrdenTrabajo,
  Cotizacion,
  Factura,
  Garantia,
  Seguimiento,
  ConfiguracionTaller,
  CasoSeguimientoInteligente,
  TonoSeguimiento,
  PrioridadSeguimiento,
  ResultadoSeguimientoInteligenteIA,
  AlertaGarantiaSeguimiento,
} from '../types';

export interface ParametrosSeguimientoInteligente {
  cliente: Cliente;
  vehiculo?: Vehiculo;
  caso?: CasoSeguimientoInteligente;
  tono?: TonoSeguimiento;
  comentarioCliente?: string;
  ordenes?: OrdenTrabajo[];
  cotizaciones?: Cotizacion[];
  facturas?: Factura[];
  garantias?: Garantia[];
  seguimientos?: Seguimiento[];
  configuracion?: ConfiguracionTaller;
}

// Palabras clave que denotan riesgo de garantía o posible falla reportada
const PALABRAS_CLAVE_GARANTIA = [
  'ruido',
  'falla',
  'falla de nuevo',
  'tiembla',
  'vibra',
  'vibración',
  'fuga',
  'gotea',
  'testigo',
  'check engine',
  'garantía',
  'reclamar',
  'no quedó',
  'sigue igual',
  'rechinido',
  'humo',
  'olor',
  'calienta',
  'tirón',
  'no arranca',
  'tronido',
  'pedal',
  'frenos',
  'dirección',
];

export function detectarRiesgoGarantia(
  comentario?: string,
  ordenesRecientes: OrdenTrabajo[] = [],
  garantiasVigentes: Garantia[] = []
): AlertaGarantiaSeguimiento {
  const texto = (comentario || '').toLowerCase().trim();

  // Buscar coincidencia en comentario
  const palabraEncontrada = PALABRAS_CLAVE_GARANTIA.find((palabra) => texto.includes(palabra));

  if (palabraEncontrada) {
    const ordenRelacionada = ordenesRecientes[0];
    const garantiaAsociada = garantiasVigentes[0];

    return {
      requiereGarantia: true,
      titulo: `Posible reclamación de garantía detectada ("${palabraEncontrada}")`,
      explicacion: `El cliente mencionó términos asociados a una anomalía ("${palabraEncontrada}"). Requiere inspección física prioritaria en el taller para verificar componentes intervenidos sin asumir conclusiones precipitadas.`,
      trabajoRelacionado: garantiaAsociada
        ? `${garantiaAsociada.trabajoCubierto} (Póliza ${garantiaAsociada.folio})`
        : ordenRelacionada
        ? `${ordenRelacionada.servicio} (Orden ${ordenRelacionada.folio})`
        : 'Servicio mecánico anterior',
      recomiendaRevisionFisica: true,
    };
  }

  // Si hay garantía vigente próxima a vencer o cliente reportó comentarios previos
  if (garantiasVigentes.length > 0) {
    const gar = garantiasVigentes[0];
    return {
      requiereGarantia: false,
      titulo: `Vehículo con póliza de garantía vigente (${gar.folio})`,
      explicacion: `Cuenta con garantía activa hasta el ${gar.fechaVencimiento} para "${gar.trabajoCubierto}".`,
      trabajoRelacionado: `${gar.trabajoCubierto} (${gar.folio})`,
      recomiendaRevisionFisica: false,
    };
  }

  return {
    requiereGarantia: false,
    recomiendaRevisionFisica: false,
  };
}

export function determinarCasoOptimo(
  cliente: Cliente,
  vehiculo?: Vehiculo,
  ordenes: OrdenTrabajo[] = [],
  cotizaciones: Cotizacion[] = [],
  facturas: Factura[] = [],
  garantias: Garantia[] = [],
  comentarioCliente?: string
): CasoSeguimientoInteligente {
  const comentario = (comentarioCliente || '').toLowerCase();

  // 1. Si el comentario contiene palabras de falla/garantía -> caso detectar_garantia
  if (PALABRAS_CLAVE_GARANTIA.some((w) => comentario.includes(w))) {
    return 'detectar_garantia';
  }

  // 2. Si tiene facturas pendientes de pago -> consultar_factura
  const tieneFacturaPendiente = facturas.some(
    (f) => f.clienteId === cliente.id && f.estado === 'Pendiente'
  );
  if (tieneFacturaPendiente) {
    return 'consultar_factura';
  }

  // 3. Si tiene cotizaciones en espera de autorización -> seguimiento_cotizacion
  const tieneCotizacionPendiente = cotizaciones.some(
    (c) => c.clienteId === cliente.id && c.estado === 'Por autorizar'
  );
  if (tieneCotizacionPendiente) {
    return 'seguimiento_cotizacion';
  }

  // 4. Si tiene órdenes terminadas o entregadas muy recientes (últimos 10 días) -> confirmar_funcionamiento
  const ordenesCliente = ordenes.filter((o) => o.clienteId === cliente.id);
  const ordenTerminadaReciente = ordenesCliente.find(
    (o) => o.estado === 'Terminado' || o.entregado || o.trabajoTerminado
  );
  if (ordenTerminadaReciente) {
    return 'confirmar_funcionamiento';
  }

  // 5. Si el vehículo tiene fecha o kilometraje de mantenimiento próximo vencido/cercano -> recordar_mantenimiento
  if (vehiculo?.proximoServicioFecha || vehiculo?.proximoServicioKm) {
    return 'recordar_mantenimiento';
  }

  // 6. Si el cliente lleva tiempo sin visitas -> recuperar_cliente
  if (ordenesCliente.length === 0) {
    return 'recuperar_cliente';
  }

  // Default cordial
  return 'solicitar_valoracion';
}

export function generarSeguimientoInteligenteLocal(
  params: ParametrosSeguimientoInteligente
): ResultadoSeguimientoInteligenteIA {
  const {
    cliente,
    vehiculo,
    caso = 'auto_detectar',
    tono = 'cordial',
    comentarioCliente,
    ordenes = [],
    cotizaciones = [],
    facturas = [],
    garantias = [],
    seguimientos = [],
    configuracion,
  } = params;

  const nombreTaller = configuracion?.nombre || 'TUNNO';
  const telefonoTaller = configuracion?.telefono || '555-432-1000';
  const nombreCliente = cliente.nombre || 'Estimado(a) cliente';
  const vehiculoTexto = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.placas ? ` (${vehiculo.placas})` : ''}`
    : 'su vehículo';

  // Filtrar registros vinculados
  const ordenesCliente = ordenes.filter(
    (o) => o.clienteId === cliente.id && (!vehiculo || o.vehiculoId === vehiculo.id)
  );
  const cotizacionesCliente = cotizaciones.filter(
    (c) => c.clienteId === cliente.id && (!vehiculo || c.vehiculoId === vehiculo.id)
  );
  const facturasCliente = facturas.filter(
    (f) => f.clienteId === cliente.id && (!vehiculo || f.vehiculoId === vehiculo.id)
  );
  const garantiasCliente = garantias.filter(
    (g) => g.clienteId === cliente.id && (!vehiculo || g.vehiculoId === vehiculo.id)
  );

  // Última orden
  const ultimaOrden = ordenesCliente[0];
  const servicioRealizado = ultimaOrden?.servicio || 'servicio preventivo general';
  const fechaEntrega = ultimaOrden?.fechaHoraEntrega || ultimaOrden?.creadoEn?.slice(0, 10) || 'días recientes';

  // Última cotización pendiente
  const cotizacionPendiente = cotizacionesCliente.find(
    (c) => c.estado === 'Por autorizar'
  );

  // Factura pendiente
  const facturaPendiente = facturasCliente.find(
    (f) => f.estado === 'Pendiente'
  );

  // Garantías vigentes
  const garantiasVigentes = garantiasCliente.filter((g) => g.estado === 'Vigente');

  // Detectar caso final
  const casoEfectivo: CasoSeguimientoInteligente =
    caso === 'auto_detectar'
      ? determinarCasoOptimo(
          cliente,
          vehiculo,
          ordenesCliente,
          cotizacionesCliente,
          facturasCliente,
          garantiasCliente,
          comentarioCliente
        )
      : caso;

  // Alerta de garantía
  const alertaGarantia = detectarRiesgoGarantia(
    comentarioCliente,
    ordenesCliente,
    garantiasVigentes
  );

  // Calcular fecha sugerida de contacto (mañana o fecha inmediata)
  const hoy = new Date();
  const fechaManana = new Date(hoy);
  fechaManana.setDate(fechaManana.getDate() + 1);
  const fechaSugerida = fechaManana.toISOString().slice(0, 10);

  // Construir mensajes según caso y tonos
  let casoTitulo = '';
  let motivoRecomendado = '';
  let prioridad: PrioridadSeguimiento = 'Media';
  let preguntasRecomendadas: string[] = [];
  let proximaAccion = '';
  let mensajesPorTono = {
    cordial: '',
    formal: '',
    directo: '',
  };

  switch (casoEfectivo) {
    case 'confirmar_funcionamiento': {
      casoTitulo = 'Confirmación de funcionamiento post-servicio';
      motivoRecomendado = 'Verificar satisfacción y correcto desempeño del vehículo';
      prioridad = 'Media';
      preguntasRecomendadas = [
        `¿Cómo ha sentido el desempeño de su ${vehiculoTexto} tras el servicio de ${servicioRealizado}?`,
        '¿Ha detectado algún ruido extraño, vibración o luz de advertencia encendida?',
        '¿El tiempo de entrega y el servicio cumplieron plenamente con sus expectativas?',
      ];
      proximaAccion =
        'Si el cliente confirma que todo marcha excelente, agradecer su preferencia y registrar fecha para su próximo servicio preventivo. Si manifiesta alguna duda o anomalía, agendar una inspección física de cortesía en el taller.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! Esperamos que te encuentres muy bien. Te saludamos de ${nombreTaller} para dar seguimiento al servicio de ${servicioRealizado} efectuado en tu ${vehiculoTexto}. ¿Cómo has sentido el vehículo? Quedamos a tus órdenes para cualquier duda.`,
        formal: `Estimado(a) ${nombreCliente}, le saludamos cordialmente de ${nombreTaller}. Nos comunicamos para dar seguimiento al servicio de ${servicioRealizado} realizado en su ${vehiculoTexto} el ${fechaEntrega} y constatar que el funcionamiento sea enteramente de su conformidad. Quedamos a su entera disposición.`,
        directo: `Hola ${nombreCliente}, te contactamos de ${nombreTaller} para confirmar que tu ${vehiculoTexto} esté funcionando al 100% tras el ${servicioRealizado}. ¿Todo marcha en orden o requieres apoyo con algún detalle?`,
      };
      break;
    }

    case 'solicitar_valoracion': {
      casoTitulo = 'Solicitud de valoración de la atención';
      motivoRecomendado = 'Evaluar calidad del servicio y retroalimentación del cliente';
      prioridad = 'Baja';
      preguntasRecomendadas = [
        'En una escala del 1 al 10, ¿cómo calificaría la claridad de nuestro diagnóstico y presupuesto?',
        '¿La puntualidad en la recepción y entrega de su unidad fue la adecuada?',
        '¿Hay algún aspecto que considere podamos mejorar para su siguiente visita?',
      ];
      proximaAccion =
        'Si la valoración es positiva (9-10), invitar amablemente a compartir una opinión pública. Si señala áreas de oportunidad, turnar la retroalimentación a gerencia para contacto de aseguramiento de calidad.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! En ${nombreTaller} tu opinión es muy valiosa para nosotros. ¿Nos compartirías brevemente cómo fue tu experiencia con la atención recibida en el servicio de tu ${vehiculoTexto}? Tu retroalimentación nos ayuda a seguir mejorando. ¡Gracias por tu confianza!`,
        formal: `Estimado(a) ${nombreCliente}, en ${nombreTaller} estamos comprometidos con los más altos estándares de servicio. Le agradeceríamos enormemente si pudiera brindarnos su retroalimentación sobre la atención recibida en la reciente visita de su ${vehiculoTexto}. Agradecemos su preferencia.`,
        directo: `Hola ${nombreCliente}, de parte de ${nombreTaller}. ¿Qué tal te pareció la atención y el trabajo en tu ${vehiculoTexto}? Tu calificación nos ayuda a mantener la mejor calidad. ¡Muchas gracias!`,
      };
      break;
    }

    case 'recordar_mantenimiento': {
      casoTitulo = 'Recordatorio de próximo mantenimiento preventivo';
      motivoRecomendado = 'Anticipar servicios periódicos y conservación del vehículo';
      prioridad = 'Media';
      const kmSugerido = vehiculo?.proximoServicioKm || vehiculo?.kilometraje || 'kilometraje periódico';
      const fechaSugeridaServ = vehiculo?.proximoServicioFecha || 'fechas próximas';
      preguntasRecomendadas = [
        `¿Qué kilometraje registra actualmente su ${vehiculoTexto}?`,
        '¿Desea programar la cita para esta semana en un horario conveniente?',
        '¿Requiere que reservemos con anticipación refacciones o insumos específicos?',
      ];
      proximaAccion =
        'Ofrecer opciones de horario disponibles en el calendario del taller para revisión preventiva y confirmar cita.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! Te saludamos de ${nombreTaller}. De acuerdo con el historial preventivo de tu ${vehiculoTexto}, se aproxima su siguiente servicio de mantenimiento (${kmSugerido} km / ${fechaSugeridaServ}). ¿Te gustaría apartar un espacio esta semana para mantenerlo al día?`,
        formal: `Estimado(a) ${nombreCliente}, le saludamos de ${nombreTaller}. Le recordamos cordialmente que, con base en el plan preventivo de su ${vehiculoTexto}, es recomendable programar su próxima revisión de mantenimiento (${kmSugerido} km). Con gusto podemos coordinar su cita en el horario de su preferencia.`,
        directo: `Hola ${nombreCliente}, de ${nombreTaller}. Te recordamos que toca revisión preventiva para tu ${vehiculoTexto} (${kmSugerido} km). ¿Deseas que te agendemos cita para estos días?`,
      };
      break;
    }

    case 'seguimiento_cotizacion': {
      casoTitulo = 'Seguimiento a cotización pendiente';
      motivoRecomendado = 'Resolver dudas técnicas y conocer decisión sobre presupuesto';
      prioridad = 'Alta';
      const folioCot = cotizacionPendiente?.folio || 'registrada';
      const descCot = cotizacionPendiente?.descripcion || 'mantenimiento automotriz';
      const totalCot = cotizacionPendiente ? `$${cotizacionPendiente.total.toLocaleString('es-MX')} MXN` : 'presupuestado';
      preguntasRecomendadas = [
        `¿Tiene alguna duda sobre los trabajos o refacciones incluidos en la cotización ${folioCot}?`,
        '¿Desea que prioricemos los conceptos más críticos para su seguridad primero?',
        '¿Le gustaría que coordinemos el ingreso de su unidad al taller esta semana?',
      ];
      proximaAccion =
        'Si el cliente aprueba, registrar la autorización formal en el sistema y cambiar orden a En proceso. Si tiene dudas, explicar el alcance de los trabajos sin prometer descuentos ni modificaciones no autorizadas.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! Te saludamos de ${nombreTaller}. Damos seguimiento a la cotización ${folioCot} (${descCot}) preparada para tu ${vehiculoTexto} por ${totalCot}. ¿Tienes alguna inquietud con los conceptos o te gustaría programar el trabajo? Estamos para apoyarte.`,
        formal: `Estimado(a) ${nombreCliente}, nos comunicamos de ${nombreTaller} con respecto al presupuesto ${folioCot} emitido para su ${vehiculoTexto} por un importe de ${totalCot}. Quedamos atentos para solventar cualquier duda técnica o proceder con la programación de los trabajos correspondientes.`,
        directo: `Hola ${nombreCliente}, de ${nombreTaller}. Te consultamos sobre la cotización ${folioCot} para tu ${vehiculoTexto} (${totalCot}). ¿Deseas autorizar el servicio o necesitas alguna aclaración sobre los conceptos?`,
      };
      break;
    }

    case 'consultar_factura': {
      casoTitulo = 'Consulta de factura o pago pendiente';
      motivoRecomendado = 'Conciliar estatus de pago y facilitar comprobante fiscal';
      prioridad = 'Alta';
      const folioFac = facturaPendiente?.folio || 'pendiente';
      const totalFac = facturaPendiente ? `$${facturaPendiente.total.toLocaleString('es-MX')} MXN` : 'monto pendiente';
      preguntasRecomendadas = [
        `¿Recibió correctamente los archivos PDF y XML de su factura ${folioFac}?`,
        '¿Requiere que le compartamos nuevamente nuestras cuentas bancarias oficiales?',
        '¿Ya cuenta con el comprobante de transferencia para proceder con el timbrado de pago?',
      ];
      proximaAccion =
        'Verificar depósito bancario o aplicar método de pago en el módulo de Facturación una vez confirmado el comprobante.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! Te saludamos cordialmente de administración en ${nombreTaller}. Nos comunicamos para dar seguimiento a la factura ${folioFac} por ${totalFac} correspondiente a tu ${vehiculoTexto}. ¿Nos confirmarías si requieres apoyo con los datos para su liquidación? Muchas gracias.`,
        formal: `Estimado(a) ${nombreCliente}, le saludamos del área administrativa de ${nombreTaller}. Nos ponemos en contacto con relación a la factura ${folioFac} emitida a su nombre por ${totalFac}. Le agradeceremos informarnos sobre el estatus de su pago o si requiere el envío de los archivos correspondientes.`,
        directo: `Hola ${nombreCliente}, de administración en ${nombreTaller}. Te consultamos sobre la factura ${folioFac} (${totalFac}) de tu ${vehiculoTexto}. ¿Ya cuentas con el comprobante de pago o requieres los datos bancarios?`,
      };
      break;
    }

    case 'detectar_garantia': {
      casoTitulo = 'Atención prioritaria y detección de garantía';
      motivoRecomendado = 'Canalizar reporte técnico para inspección física preventiva';
      prioridad = 'Alta';
      preguntasRecomendadas = [
        '¿Bajo qué condiciones específicas se presenta la situación que nos describe?',
        '¿Podría acercar su vehículo al taller hoy o mañana a primera hora para que el técnico realice una inspección física directa?',
        '¿El testigo en el tablero permanece encendido de manera continua o intermitente?',
      ];
      proximaAccion =
        'Agendar cita prioritaria para inspección física inmediata en taller. Crear borrador en el módulo de Garantías para dictamen del responsable de calidad. NO prometer reparaciones gratuitas o devoluciones hasta que el técnico dictamine si corresponde a los trabajos cubiertos.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! En ${nombreTaller} nos tomamos muy en serio tu tranquilidad. Con relación a lo que nos comentas sobre tu ${vehiculoTexto}, para nosotros lo más importante es tu seguridad. Te pedimos traer tu unidad a nuestras instalaciones para que nuestro equipo técnico realice una inspección física detallada. ¿Qué horario te queda mejor hoy o mañana?`,
        formal: `Estimado(a) ${nombreCliente}, acusamos recibo de sus comentarios respecto a su ${vehiculoTexto}. En ${nombreTaller} respaldamos la calidad de nuestros servicios; por tal motivo, es indispensable realizar una inspección física minuciosa en el taller para revisar los componentes intervenidos. Le sugerimos acudir a la brevedad para realizar el diagnóstico correspondiente.`,
        directo: `Hola ${nombreCliente}, en ${nombreTaller} atendemos de inmediato tu mensaje sobre el ${vehiculoTexto}. Es indispensable que traigas el vehículo al taller para que el técnico realice una inspección física y verifique el estado. ¿A qué hora puedes presentarte hoy o mañana?`,
      };
      break;
    }

    case 'recuperar_cliente':
    default: {
      casoTitulo = 'Reactivación de cliente / Mantenimiento general';
      motivoRecomendado = 'Reanudar contacto preventivo y chequeo de seguridad';
      prioridad = 'Baja';
      preguntasRecomendadas = [
        `¿Cómo se ha comportado su ${vehiculoTexto} desde su última visita?`,
        '¿Requiere una revisión preventiva de niveles, frenos y suspensión?',
        '¿Le gustaría agendar un chequeo preventivo de rutina esta semana?',
      ];
      proximaAccion =
        'Ofrecer diagnóstico preventivo de seguridad de cortesía y agendar fecha tentativa en el calendario.';
      mensajesPorTono = {
        cordial: `¡Hola, ${nombreCliente}! Ha pasado algún tiempo desde tu última visita a ${nombreTaller} y esperamos que todo marche excelente con tu ${vehiculoTexto}. Te recordamos la importancia de mantener al día sus revisiones preventivas periódicas. ¿Te gustaría agendar una revisión general esta semana? ¡Será un gusto saludarte de nuevo!`,
        formal: `Estimado(a) ${nombreCliente}, le enviamos un cordial saludo de parte de ${nombreTaller}. Revisando su historial vehicular, consideramos oportuno sugerirle una inspección preventiva general para su ${vehiculoTexto} con el fin de conservar su óptimo rendimiento y seguridad. Quedamos a su disposición para coordinar su cita.`,
        directo: `Hola ${nombreCliente}, de ${nombreTaller}. Hace algún tiempo que no revisamos tu ${vehiculoTexto}. Te recomendamos una inspección preventiva periódica para asegurar su buen funcionamiento. ¿Te apartamos una cita esta semana?`,
      };
      break;
    }
  }

  // Si se detectó riesgo de garantía en el comentario y no era el caso explícito, elevar prioridad a Alta
  if (alertaGarantia.requiereGarantia) {
    prioridad = 'Alta';
  }

  const resumenContexto = `Cliente: ${nombreCliente} | Vehículo: ${vehiculoTexto} | Último servicio: ${servicioRealizado} (${fechaEntrega}) | Garantías vigentes: ${
    garantiasVigentes.length
  } | Facturas pendientes: ${facturaPendiente ? facturaPendiente.folio : 'Ninguna'} | Cotización en trámite: ${
    cotizacionPendiente ? cotizacionPendiente.folio : 'Ninguna'
  } | Comentario registrado: "${comentarioCliente || 'Sin comentario previo'}"`;

  return {
    casoDetectado: casoEfectivo,
    casoTitulo,
    motivoRecomendado,
    prioridad,
    fechaSugerida,
    horaSugerida: '10:00',
    mensajeWhatsApp: mensajesPorTono[tono] || mensajesPorTono.cordial,
    mensajesPorTono,
    preguntasRecomendadas,
    proximaAccion,
    alertaGarantia,
    resumenContexto,
    avisoDemostracion: 'Demostración local: el mensaje no se ha enviado',
    esAnalisisLocal: true,
    modeloUtilizado: 'Motor heurístico local de seguimiento inteligente (Demostración)',
    generadoEn: new Date().toISOString(),
  };
}
