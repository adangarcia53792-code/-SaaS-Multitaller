import {
  Cliente,
  Vehiculo,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Factura,
  ConfiguracionTaller,
} from '../types';

export type TipoTonoAtencion = 'formal' | 'cordial' | 'directo';

export type MotivoAtencionIA =
  | 'consultar_cotizacion'
  | 'confirmar_cita'
  | 'informar_avance'
  | 'vehiculo_terminado'
  | 'recordar_mantenimiento'
  | 'seguimiento_post_servicio'
  | 'respuesta_libre';

export interface MotivoConfig {
  id: MotivoAtencionIA;
  label: string;
  descripcion: string;
}

export const MOTIVOS_ATENCION_LISTA: MotivoConfig[] = [
  {
    id: 'consultar_cotizacion',
    label: 'Consultar una cotización',
    descripcion: 'Revisar montos presupuestados, refacciones y estado de autorización.',
  },
  {
    id: 'confirmar_cita',
    label: 'Confirmar una cita',
    descripcion: 'Validar fecha, hora programada y motivo de recepción del vehículo.',
  },
  {
    id: 'informar_avance',
    label: 'Informar avance de una reparación',
    descripcion: 'Compartir estatus técnico real, diagnóstico y trabajos en proceso.',
  },
  {
    id: 'vehiculo_terminado',
    label: 'Avisar que el vehículo está terminado',
    descripcion: 'Notificar que la unidad está lista para entrega y saldo a liquidar.',
  },
  {
    id: 'recordar_mantenimiento',
    label: 'Recordar mantenimiento',
    descripcion: 'Sugerir servicio preventivo programado según tiempo o kilometraje.',
  },
  {
    id: 'seguimiento_post_servicio',
    label: 'Dar seguimiento después del servicio',
    descripcion: 'Consultar desempeño del auto y satisfacción del cliente tras la entrega.',
  },
  {
    id: 'respuesta_libre',
    label: 'Redactar una respuesta libre',
    descripcion: 'Elaborar un mensaje personalizado usando los datos reales del cliente.',
  },
];

export interface AdvertenciaIA {
  tipo: 'faltante' | 'inconsistencia' | 'info';
  texto: string;
}

export interface RespuestaAtencionIA {
  mensajeWhatsApp: string;
  resumenInterno: string;
  proximaAccion: string;
  fechaSugeridaSeguimiento: string | null; // YYYY-MM-DD
  fechaSugeridaExplicacion?: string;
  advertencias: AdvertenciaIA[];
  tonoUtilizado: TipoTonoAtencion;
  esAnalisisLocal?: boolean;
  modeloUtilizado?: string;
}

export interface ParametrosRespuestaAtencion {
  cliente: Cliente | null;
  vehiculo: Vehiculo | null;
  motivo: MotivoAtencionIA;
  tono?: TipoTonoAtencion;
  comentarioLibre?: string;
  citas?: Cita[];
  cotizaciones?: Cotizacion[];
  ordenes?: OrdenTrabajo[];
  facturas?: Factura[];
  configuracion?: ConfiguracionTaller | null;
  citaSeleccionadaId?: string;
  cotizacionSeleccionadaId?: string;
  ordenSeleccionadaId?: string;
  facturaSeleccionadaId?: string;
}

/**
 * Calcula una fecha futura en formato YYYY-MM-DD agregando N días naturales
 */
function sumarDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formato de moneda mexicana consistente
 */
function formatoMoneda(val?: number): string {
  if (typeof val !== 'number' || isNaN(val)) return 'Importe no registrado';
  return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

/**
 * Formato de fecha para visualización en texto
 */
function formatoFecha(dateStr?: string): string {
  if (!dateStr) return 'Fecha no registrada';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Generador local heurístico de respuestas estructuradas de atención al cliente.
 * Utiliza estrictamente datos reales registrados, respeta los 3 tonos y nunca inventa datos.
 */
export function generarRespuestaAtencionLocal({
  cliente,
  vehiculo,
  motivo,
  tono = 'cordial',
  comentarioLibre = '',
  citas = [],
  cotizaciones = [],
  ordenes = [],
  facturas = [],
  configuracion,
  citaSeleccionadaId,
  cotizacionSeleccionadaId,
  ordenSeleccionadaId,
  facturaSeleccionadaId,
}: ParametrosRespuestaAtencion): RespuestaAtencionIA {
  const tallerNombre = configuracion?.nombre || 'TUNNO';
  const clienteNombre = cliente?.nombre || 'Cliente';
  const clienteTelefono = cliente?.telefono?.trim();
  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año || ''}`.trim()
    : 'Vehículo del cliente';
  const placas = vehiculo?.placas || 'Placas no registradas';
  const kmNum = typeof vehiculo?.kilometraje === 'number'
    ? vehiculo.kilometraje
    : typeof vehiculo?.kilometraje === 'string'
    ? parseInt(vehiculo.kilometraje, 10)
    : undefined;
  const odometro = kmNum && !isNaN(kmNum) && kmNum > 0 ? `${kmNum.toLocaleString()} km` : 'Kilometraje no registrado';

  const advertencias: AdvertenciaIA[] = [];

  // Verificación de datos de contacto y vehículo
  if (!clienteTelefono) {
    advertencias.push({
      tipo: 'faltante',
      texto: 'El cliente no tiene teléfono registrado en el sistema. Verifica con recepción para capturarlo.',
    });
  }
  if (!vehiculo) {
    advertencias.push({
      tipo: 'faltante',
      texto: 'No se ha vinculado un vehículo específico para esta atención.',
    });
  } else {
    if (!vehiculo.placas || vehiculo.placas.trim().toLowerCase() === 'sin placas') {
      advertencias.push({
        tipo: 'faltante',
        texto: 'El vehículo seleccionado no tiene placas registradas.',
      });
    }
    if (!kmNum || isNaN(kmNum) || kmNum <= 0) {
      advertencias.push({
        tipo: 'faltante',
        texto: 'El odómetro/kilometraje del vehículo no está registrado o figura en cero.',
      });
    }
  }

  // Filtrado de registros pertenecientes al cliente y vehículo
  const cotizacionesRel = cotizaciones.filter(
    (c) => (!cliente || c.clienteId === cliente.id) && (!vehiculo || c.vehiculoId === vehiculo.id)
  );
  const citasRel = citas.filter(
    (c) => (!cliente || c.clienteId === cliente.id) && (!vehiculo || c.vehiculoId === vehiculo.id)
  );
  const ordenesRel = ordenes.filter(
    (o) => (!cliente || o.clienteId === cliente.id) && (!vehiculo || o.vehiculoId === vehiculo.id)
  );
  const facturasRel = facturas.filter(
    (f) => (!cliente || f.clienteId === cliente.id) && (!vehiculo || f.vehiculoId === vehiculo.id)
  );

  // Registro enfocado según selección
  const cotizacionTarget =
    cotizacionesRel.find((c) => c.id === cotizacionSeleccionadaId) ||
    cotizacionesRel[cotizacionesRel.length - 1] ||
    null;

  const citaTarget =
    citasRel.find((c) => c.id === citaSeleccionadaId) ||
    citasRel[citasRel.length - 1] ||
    null;

  const ordenTarget =
    ordenesRel.find((o) => o.id === ordenSeleccionadaId) ||
    ordenesRel[ordenesRel.length - 1] ||
    null;

  const facturaTarget =
    facturasRel.find((f) => f.id === facturaSeleccionadaId) ||
    facturasRel[facturasRel.length - 1] ||
    null;

  let resumenInterno = '';
  let proximaAccion = '';
  let fechaSugeridaSeguimiento: string | null = null;
  let fechaSugeridaExplicacion = '';
  let mensajeWhatsApp = '';

  const comentarioNota = comentarioLibre.trim() ? ` Respecto a su nota: "${comentarioLibre.trim()}".` : '';
  const comentarioNotaDirecto = comentarioLibre.trim() ? ` Sobre tu consulta: "${comentarioLibre.trim()}".` : '';

  switch (motivo) {
    case 'consultar_cotizacion': {
      if (!cotizacionTarget) {
        advertencias.push({
          tipo: 'faltante',
          texto: 'No existe ninguna cotización registrada para este cliente/vehículo en el sistema.',
        });
        resumenInterno = `Cliente ${clienteNombre} no tiene cotizaciones previas en el sistema para ${vehiculoDesc}.`;
        proximaAccion = 'Elaborar un presupuesto o cotización formal en el módulo de Cotizaciones antes de brindar precios.';
        fechaSugeridaSeguimiento = sumarDias(1);
        fechaSugeridaExplicacion = 'Mañana para dar de alta la cotización formal.';

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos cordialmente del taller ${tallerNombre}.${comentarioNota} Con gusto podemos preparar una cotización formal y detallada para su vehículo ${vehiculoDesc} (Placas: ${placas}). ¿Nos permitiría programar una inspección en nuestras instalaciones?`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, te escribimos de ${tallerNombre}.${comentarioNotaDirecto} Actualmente no tenemos una cotización activa registrada para tu ${vehiculoDesc} (Placas: ${placas}). Con gusto podemos recibir tu auto para evaluarlo y enviarte tu presupuesto.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Esperamos que se encuentre muy bien. Nos comunicamos de ${tallerNombre}.${comentarioNota} Con mucho gusto podemos prepararle una cotización personalizada para su ${vehiculoDesc} (Placas: ${placas}). Quedamos a sus órdenes para recibir su vehículo y brindarle una atención oportuna.`;
        }
      } else {
        const folio = cotizacionTarget.folio || 'S/F';
        const total = formatoMoneda(cotizacionTarget.total);
        const est = cotizacionTarget.estado;
        const trabajo = cotizacionTarget.descripcion || 'Servicios y refacciones especificados en el desglose';

        if (est === 'Rechazada') {
          advertencias.push({
            tipo: 'inconsistencia',
            texto: `La cotización ${folio} se encuentra en estado "${est}". Confirma si se creará una nueva versión o si el cliente reconsiderará.`,
          });
        }

        resumenInterno = `Cotización ${folio} por ${total} en estado "${est}" para ${vehiculoDesc} (${placas}).`;
        proximaAccion = `Consultar con el cliente si desea autorizar los trabajos de la cotización ${folio} para apartar refacciones.`;
        fechaSugeridaSeguimiento = sumarDias(2);
        fechaSugeridaExplicacion = 'En 2 días hábiles para confirmar decisión o dudas de la cotización.';

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos cordialmente de ${tallerNombre}.${comentarioNota} Le compartimos el seguimiento a su cotización ${folio} para el vehículo ${vehiculoDesc} (Placas: ${placas}). El importe total presupuestado es de ${total}, correspondiente a: ${trabajo}. Su cotización figura actualmente como ${est}. Quedamos atentos en caso de que requiera alguna precisión o desee autorizar los trabajos.`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, te contactamos de ${tallerNombre} sobre tu cotización ${folio} para el ${vehiculoDesc} (Placas: ${placas}).${comentarioNotaDirecto} El total es de ${total} (${est}) que incluye: ${trabajo}. Avísanos si deseas autorizarla o si requieres algún cambio.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Esperamos que esté teniendo un excelente día. Le saludamos de ${tallerNombre} para darle seguimiento a su cotización ${folio} de su ${vehiculoDesc} (Placas: ${placas}).${comentarioNota} El monto total considerado es de ${total} y comprende: ${trabajo}. Con gusto estamos a su entera disposición en caso de que decida autorizar el servicio o si tiene alguna pregunta.`;
        }
      }
      break;
    }

    case 'confirmar_cita': {
      if (!citaTarget) {
        advertencias.push({
          tipo: 'faltante',
          texto: 'No se encontró ninguna cita registrada en la agenda para este cliente.',
        });
        resumenInterno = `No hay citas agendadas registradas para ${clienteNombre} y su ${vehiculoDesc}.`;
        proximaAccion = 'Agendar cita en el módulo de Citas para asignar bahía y fecha de recepción.';
        fechaSugeridaSeguimiento = sumarDias(1);
        fechaSugeridaExplicacion = 'Próximo día hábil para concertar cita.';

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos de ${tallerNombre}.${comentarioNota} Con gusto podemos agendar una cita para la recepción técnica de su vehículo ${vehiculoDesc} (Placas: ${placas}). ¿Qué día y horario le resultaría más conveniente?`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, te contactamos de ${tallerNombre}.${comentarioNotaDirecto} Queremos apoyarte para agendar la cita de servicio de tu ${vehiculoDesc} (Placas: ${placas}). Indícanos el horario que mejor te acomode.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Le saludamos cordialmente de ${tallerNombre}.${comentarioNota} Nos ponemos en contacto para apoyarle a programar su cita para su ${vehiculoDesc} (Placas: ${placas}). Quedamos a sus órdenes para apartar su espacio en el taller.`;
        }
      } else {
        const fechaCita = formatoFecha(citaTarget.fecha);
        const horaCita = citaTarget.hora || 'Horario por confirmar';
        const servicioCita = citaTarget.servicio || 'Revisión y diagnóstico general';
        const estadoCita = citaTarget.estado || 'Programada';

        if (!citaTarget.hora) {
          advertencias.push({
            tipo: 'faltante',
            texto: 'La cita agendada no tiene una hora específica definida.',
          });
        }
        if (estadoCita === 'Cancelada') {
          advertencias.push({
            tipo: 'inconsistencia',
            texto: `La cita seleccionada figura como "${estadoCita}". Verifica si el cliente desea programar una nueva fecha.`,
          });
        }

        resumenInterno = `Cita programada para el ${fechaCita} a las ${horaCita} hrs (${servicioCita}) para ${vehiculoDesc}.`;
        proximaAccion = 'Verificar disponibilidad de bahía y herramientas necesarias antes del horario programado.';
        fechaSugeridaSeguimiento = citaTarget.fecha || sumarDias(1);
        fechaSugeridaExplicacion = `El día ${fechaCita} para dar la bienvenida en recepción.`;

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos de ${tallerNombre}.${comentarioNota} Nos permitimos confirmar su cita para su vehículo ${vehiculoDesc} (Placas: ${placas}) programada para el ${fechaCita} a las ${horaCita} hrs, con motivo de: ${servicioCita}. Agradecemos su puntual asistencia y quedamos a su disposición en caso de requerir cualquier ajuste de horario.`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, te recordamos tu cita en ${tallerNombre} para tu ${vehiculoDesc} (Placas: ${placas}): el ${fechaCita} a las ${horaCita} hrs (${servicioCita}).${comentarioNotaDirecto} Por favor confírmanos tu asistencia o avísanos si necesitas reagendar.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Esperamos que se encuentre muy bien. Nos comunicamos de ${tallerNombre} para recordarle su cita programada el día ${fechaCita} a las ${horaCita} hrs para su ${vehiculoDesc} (Placas: ${placas}).${comentarioNota} Estaremos listos para recibir su auto para el servicio de: ${servicioCita}. Si necesita ajustar la hora, con gusto le apoyamos.`;
        }
      }
      break;
    }

    case 'informar_avance': {
      if (!ordenTarget) {
        advertencias.push({
          tipo: 'faltante',
          texto: 'No existe una orden de trabajo activa registrada para este cliente/vehículo.',
        });
        resumenInterno = `Sin órdenes de trabajo activas en sistema para ${clienteNombre}.`;
        proximaAccion = 'Revisar si el vehículo ingresó a taller y registrar la orden de trabajo correspondiente.';
        fechaSugeridaSeguimiento = sumarDias(1);
        fechaSugeridaExplicacion = 'Mañana para actualizar el estatus de ingreso.';

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos de ${tallerNombre}.${comentarioNota} Respecto a su ${vehiculoDesc} (Placas: ${placas}), estamos revisando el ingreso y con gusto le compartiremos el diagnóstico formal a la brevedad.`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, de ${tallerNombre}.${comentarioNotaDirecto} Estamos revisando los detalles de tu ${vehiculoDesc} (Placas: ${placas}) y en breve te compartimos el reporte técnico.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Le saludamos de ${tallerNombre}.${comentarioNota} Estamos al pendiente de su ${vehiculoDesc} (Placas: ${placas}) y en cuanto contemos con la actualización del equipo técnico se la compartiremos puntualmente.`;
        }
      } else {
        const folioOrd = ordenTarget.folio || 'S/F';
        const estadoOrd = ordenTarget.estado || 'En proceso';
        const servOrd = ordenTarget.servicio || 'Servicio mecánico automotriz';
        const diagOrd = ordenTarget.diagnostico ? `Diagnóstico técnico: ${ordenTarget.diagnostico}.` : 'Diagnóstico en revisión técnica.';

        if (ordenTarget.entregado) {
          advertencias.push({
            tipo: 'inconsistencia',
            texto: `La orden ${folioOrd} figura en sistema como ya ENTREGADA. Confirma si corresponde informar avance o dar seguimiento post-servicio.`,
          });
        }

        resumenInterno = `Orden ${folioOrd} en estado "${estadoOrd}" para ${vehiculoDesc} (${placas}). ${diagOrd}`;
        proximaAccion = 'Monitorear avance con el jefe de taller y registrar cualquier requerimiento de refacciones adicionales.';
        fechaSugeridaSeguimiento = sumarDias(1);
        fechaSugeridaExplicacion = 'Mañana a mediodía para reportar avance o término.';

        if (tono === 'formal') {
          mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos de ${tallerNombre}.${comentarioNota} Le informamos sobre el avance de la orden ${folioOrd} para su vehículo ${vehiculoDesc} (Placas: ${placas}). Actualmente se encuentra en estado "${estadoOrd}". Trabajo en desarrollo: ${servOrd}. ${diagOrd} Le mantendremos informado de cualquier novedad adicional.`;
        } else if (tono === 'directo') {
          mensajeWhatsApp = `Hola ${clienteNombre}, te compartimos el avance de la orden ${folioOrd} en tu ${vehiculoDesc} (Placas: ${placas}): Estatus actual: "${estadoOrd}". Trabajo: ${servOrd}. ${diagOrd}${comentarioNotaDirecto} Continuamos trabajando en tu unidad y te avisamos en cuanto avance a la siguiente fase.`;
        } else {
          mensajeWhatsApp = `¡Hola, ${clienteNombre}! Nos da gusto saludarle de ${tallerNombre} para compartirle el avance de su ${vehiculoDesc} (Placas: ${placas}) bajo la orden ${folioOrd}.${comentarioNota} El trabajo de ${servOrd} se encuentra actualmente "${estadoOrd}". ${diagOrd} Seguimos al cuidado de su vehículo y con gusto le notificaremos oportunamente.`;
        }
      }
      break;
    }

    case 'vehiculo_terminado': {
      const folioOrd = ordenTarget?.folio || 'de servicio';
      const servicioDesc = ordenTarget?.servicio || 'Mantenimiento y reparación';
      const totalPagar = facturaTarget
        ? formatoMoneda(facturaTarget.total)
        : cotizacionTarget
        ? formatoMoneda(cotizacionTarget.total)
        : 'Consultar en recepción';

      if (!ordenTarget) {
        advertencias.push({
          tipo: 'faltante',
          texto: 'No se encontró la orden de trabajo para validar que las tareas técnicas hayan concluido.',
        });
      } else if (!ordenTarget.trabajoTerminado && ordenTarget.estado !== 'Terminado') {
        advertencias.push({
          tipo: 'inconsistencia',
          texto: `La orden ${folioOrd} tiene estado "${ordenTarget.estado}" y no está marcada explícitamente como "Terminado". Verifica con el técnico antes de notificar al cliente.`,
        });
      }

      if (facturaTarget && facturaTarget.estado === 'Pendiente') {
        advertencias.push({
          tipo: 'info',
          texto: `Existe la factura ${facturaTarget.folio} por ${formatoMoneda(facturaTarget.total)} pendiente de liquidar al momento de la entrega.`,
        });
      }

      resumenInterno = `Vehículo ${vehiculoDesc} (${placas}) terminado bajo orden ${folioOrd}. Total a liquidar/registrado: ${totalPagar}.`;
      proximaAccion = 'Tener listas las llaves, orden de salida y comprobante de pago en el módulo de recepción.';
      fechaSugeridaSeguimiento = sumarDias(3);
      fechaSugeridaExplicacion = 'En 3 días para seguimiento de satisfacción tras la entrega.';

      if (tono === 'formal') {
        mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, nos complace informarle de ${tallerNombre} que su vehículo ${vehiculoDesc} (Placas: ${placas}) ha concluido satisfactoriamente los trabajos de: ${servicioDesc} (Orden ${folioOrd}).${comentarioNota} Su unidad ya se encuentra lista para su entrega e inspección en nuestras instalaciones. El importe registrado es de ${totalPagar}. Puede pasar a recoger su auto en nuestro horario habitual. Quedamos a sus respetables órdenes.`;
      } else if (tono === 'directo') {
        mensajeWhatsApp = `Hola ${clienteNombre}, te avisamos de ${tallerNombre} que tu ${vehiculoDesc} (Placas: ${placas}) ya está terminado (Orden ${folioOrd}).${comentarioNotaDirecto} Los trabajos de ${servicioDesc} fueron concluidos y revisados. Importe registrado: ${totalPagar}. Ya puedes pasar a recogerlo al taller. ¡Te esperamos!`;
      } else {
        mensajeWhatsApp = `¡Buenas noticias, ${clienteNombre}! Le saludamos con gusto de ${tallerNombre} para avisarle que su ${vehiculoDesc} (Placas: ${placas}) está listo para ser entregado.${comentarioNota} Se concluyó exitosamente el servicio de: ${servicioDesc} (Orden ${folioOrd}). El saldo registrado es de ${totalPagar}. Puede pasar por su vehículo cuando guste dentro de nuestro horario de atención. ¡Será un placer recibirle!`;
      }
      break;
    }

    case 'recordar_mantenimiento': {
      const fechaSugerida = sumarDias(15);
      const fechaFmt = formatoFecha(fechaSugerida);

      resumenInterno = `Recordatorio de servicio preventivo para ${vehiculoDesc} (${placas}). Kilometraje actual: ${odometro}.`;
      proximaAccion = 'Ofrecer cita preventiva en los próximos 10 a 15 días hábiles para cambio de fluidos y revisión de puntos de seguridad.';
      fechaSugeridaSeguimiento = sumarDias(7);
      fechaSugeridaExplicacion = 'En 7 días para confirmar si ya desea programar el servicio preventivo.';

      if (tono === 'formal') {
        mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos cordialmente de ${tallerNombre}.${comentarioNota} Le recordamos que es momento oportuno para realizar el servicio de mantenimiento preventivo a su vehículo ${vehiculoDesc} (Placas: ${placas}), con odómetro registrado de ${odometro}. Realizar el mantenimiento a tiempo previene desgastes mayores y protege el valor de su unidad. Le sugerimos programar su atención próxima al ${fechaFmt}. Con gusto podemos reservar su espacio.`;
      } else if (tono === 'directo') {
        mensajeWhatsApp = `Hola ${clienteNombre}, te saludamos de ${tallerNombre}.${comentarioNotaDirecto} Te recordamos el mantenimiento preventivo recomendado para tu ${vehiculoDesc} (Placas: ${placas}, Odómetro: ${odometro}). Mantenerlo al día evita fallas imprevistas. Te sugerimos agendar hacia el ${fechaFmt}. ¿Te apartamos una cita?`;
      } else {
        mensajeWhatsApp = `¡Hola, ${clienteNombre}! Esperamos que se encuentre muy bien. Nos comunicamos de ${tallerNombre} para recordarle la importancia del próximo mantenimiento preventivo de su ${vehiculoDesc} (Placas: ${placas}).${comentarioNota} Con un odómetro de ${odometro}, una revisión a tiempo garantiza su tranquilidad y el óptimo rendimiento del motor. Le sugerimos programar su visita alrededor del ${fechaFmt}. ¿Le gustaría que le reservemos un horario?`;
      }
      break;
    }

    case 'seguimiento_post_servicio': {
      const ultimaOrden = ordenTarget;
      const servicioPrevio = ultimaOrden?.servicio || 'último servicio realizado';
      const folioPrevio = ultimaOrden?.folio ? ` (Orden ${ultimaOrden.folio})` : '';

      if (!ultimaOrden) {
        advertencias.push({
          tipo: 'info',
          texto: 'No se localizó una orden previa concluida; el mensaje se formulará como seguimiento general de satisfacción.',
        });
      }

      resumenInterno = `Seguimiento post-servicio para evaluar la satisfacción de ${clienteNombre} tras la entrega de su ${vehiculoDesc}.`;
      proximaAccion = 'Registrar en bitácora el nivel de satisfacción reportado por el cliente y solventar cualquier inquietud.';
      fechaSugeridaSeguimiento = sumarDias(15);
      fechaSugeridaExplicacion = 'En 15 días para verificar que el auto mantenga un óptimo funcionamiento.';

      if (tono === 'formal') {
        mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos de ${tallerNombre}.${comentarioNota} Nos comunicamos para dar seguimiento a la entrega de su ${vehiculoDesc} (Placas: ${placas}) tras el ${servicioPrevio}${folioPrevio}. Esperamos que el desempeño de su unidad sea plenamente satisfactorio. Su tranquilidad y seguridad son nuestra prioridad. Quedamos a sus respetables órdenes para cualquier consulta adicional.`;
      } else if (tono === 'directo') {
        mensajeWhatsApp = `Hola ${clienteNombre}, te escribimos de ${tallerNombre} para saber cómo sientes tu ${vehiculoDesc} (Placas: ${placas}) después del ${servicioPrevio}${folioPrevio}.${comentarioNotaDirecto} ¿Todo ha funcionado al 100%? Quedamos a tus órdenes para cualquier duda o revisión de garantía.`;
      } else {
        mensajeWhatsApp = `¡Hola, ${clienteNombre}! Esperamos que esté disfrutando de un excelente día. Nos comunicamos de ${tallerNombre} para conocer cómo ha respondido su ${vehiculoDesc} (Placas: ${placas}) tras el ${servicioPrevio}${folioPrevio}.${comentarioNota} Para nosotros es muy importante que todo marche a la perfección. Si tiene cualquier duda o requiere algo adicional, con todo gusto estamos a sus órdenes.`;
      }
      break;
    }

    case 'respuesta_libre':
    default: {
      const contextoRegistro = ordenTarget
        ? `Orden activa ${ordenTarget.folio} (${ordenTarget.estado})`
        : cotizacionTarget
        ? `Cotización ${cotizacionTarget.folio} (${cotizacionTarget.estado})`
        : citaTarget
        ? `Cita agendada el ${formatoFecha(citaTarget.fecha)}`
        : `Expediente de cliente con vehículo ${vehiculoDesc}`;

      if (!comentarioLibre.trim()) {
        advertencias.push({
          tipo: 'info',
          texto: 'No se introdujo un texto libre específico; se redactó una plantilla base de cortesía.',
        });
      }

      resumenInterno = `Respuesta personalizada para ${clienteNombre} sobre su ${vehiculoDesc} (${placas}). Contexto: ${contextoRegistro}.`;
      proximaAccion = 'Revisar la redacción y enviar al cliente confirmando cualquier requerimiento particular.';
      fechaSugeridaSeguimiento = sumarDias(2);
      fechaSugeridaExplicacion = 'En 2 días para seguimiento a la consulta.';

      const asunto = comentarioLibre.trim()
        ? `Respecto a su solicitud: "${comentarioLibre.trim()}".`
        : `Estamos atentos a cualquier necesidad de mantenimiento o soporte para su unidad.`;
      const asuntoDirecto = comentarioLibre.trim()
        ? `Sobre lo que nos comentaste: "${comentarioLibre.trim()}".`
        : `Estamos a la orden para lo que requieras con tu auto.`;

      if (tono === 'formal') {
        mensajeWhatsApp = `Estimado(a) Sr(a). ${clienteNombre}, le saludamos con respeto de ${tallerNombre}. En relación con su vehículo ${vehiculoDesc} (Placas: ${placas}): ${asunto} En ${tallerNombre} estamos comprometidos con brindarle el mejor servicio automotriz. Quedamos a su entera disposición.`;
      } else if (tono === 'directo') {
        mensajeWhatsApp = `Hola ${clienteNombre}, te escribimos de ${tallerNombre} sobre tu ${vehiculoDesc} (Placas: ${placas}). ${asuntoDirecto} Cuenta con nosotros para apoyarte. Avísanos si requieres agendar o revisar algún detalle.`;
      } else {
        mensajeWhatsApp = `¡Hola, ${clienteNombre}! Le saludamos cordialmente de ${tallerNombre}. Con gusto le atendemos sobre su ${vehiculoDesc} (Placas: ${placas}). ${asunto} Siempre es un gusto atenderle y estamos atentos para lo que necesite.`;
      }
      break;
    }
  }

  // Si no se generaron advertencias de inconsistencia o faltantes, incluir aviso informativo de integridad
  if (advertencias.length === 0) {
    advertencias.push({
      tipo: 'info',
      texto: 'Información completa: datos del cliente, vehículo y registros coinciden con el expediente técnico.',
    });
  }

  return {
    mensajeWhatsApp,
    resumenInterno,
    proximaAccion,
    fechaSugeridaSeguimiento,
    fechaSugeridaExplicacion,
    advertencias,
    tonoUtilizado: tono,
    esAnalisisLocal: true,
    modeloUtilizado: 'Plantilla heurística local (Modo demostración)',
  };
}
