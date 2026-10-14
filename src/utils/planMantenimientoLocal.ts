import {
  Vehiculo,
  Cliente,
  OrdenTrabajo,
  Cita,
  Garantia,
  ConfiguracionTaller,
  ResultadoPlanMantenimiento,
  EstadoMantenimientoGeneral,
  PrioridadPlanMantenimiento,
  ServicioRecomendadoPlan,
  ItemPlanResumido,
} from '../types';

interface GenerarPlanParams {
  vehiculo: Vehiculo;
  cliente?: Cliente;
  ordenes?: OrdenTrabajo[];
  citas?: Cita[];
  garantias?: Garantia[];
  configuracion?: ConfiguracionTaller;
}

/**
 * Normaliza y extrae número de kilometraje desde strings tipo "42,100 km", "42000", etc.
 */
export const extraerKilometrajeNumerico = (km: number | string | undefined | null): number | null => {
  if (km === undefined || km === null) return null;
  if (typeof km === 'number') return isNaN(km) || km <= 0 ? null : km;
  const digits = String(km).replace(/[^0-9]/g, '');
  if (!digits) return null;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

/**
 * Calcula la diferencia en días entre dos fechas (YYYY-MM-DD o ISO)
 */
const calcularDiasDiferencia = (fechaIsoOStr: string, fechaBase = new Date()): number => {
  try {
    const f = new Date(fechaIsoOStr);
    if (isNaN(f.getTime())) return 999;
    const diffMs = fechaBase.getTime() - f.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
};

/**
 * Formatea una fecha sumándole días
 */
const sumarDiasAFecha = (fechaBase: Date, dias: number): string => {
  const target = new Date(fechaBase);
  target.setDate(target.getDate() + dias);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Motor heurístico local para Plan de Mantenimiento con IA
 * Basado estrictamente en los datos disponibles del vehículo, órdenes, citas y garantías
 */
export const generarPlanMantenimientoLocal = ({
  vehiculo,
  cliente,
  ordenes = [],
  citas = [],
  garantias = [],
  configuracion,
}: GenerarPlanParams): ResultadoPlanMantenimiento => {
  const hoy = new Date();
  const nombreTaller = configuracion?.nombre || 'TUNNO';
  const vehDesc = `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.año ? ` (${vehiculo.año})` : ''}`;
  const propietarioNombre = cliente?.nombre || 'Estimado cliente';

  // 1. Filtrar registros del vehículo
  const ordenesVeh = ordenes.filter((o) => o.vehiculoId === vehiculo.id);
  const citasVeh = citas.filter((c) => c.vehiculoId === vehiculo.id);
  const garantiasVeh = garantias.filter((g) => g.vehiculoId === vehiculo.id);

  // Ordenar órdenes por fecha más reciente
  const ordenesOrdenadas = [...ordenesVeh].sort((a, b) =>
    (b.creadoEn || '').localeCompare(a.creadoEn || '')
  );

  const ultimaOrden = ordenesOrdenadas[0];
  const ordenesEnProceso = ordenesVeh.filter((o) => o.estado === 'En proceso' || o.estado === 'Pendiente');
  const garantiasActivas = garantiasVeh.filter((g) => g.estado === 'Vigente' || g.estado === 'Aplicada');
  const citasProgramadas = citasVeh.filter((c) => c.estado === 'Programada');

  // 2. Extraer kilometraje actual registrado
  let kmActual = extraerKilometrajeNumerico(vehiculo.kilometraje);
  let kmOrigen = 'ficha del vehículo';

  if (!kmActual && ultimaOrden?.kilometraje) {
    kmActual = extraerKilometrajeNumerico(ultimaOrden.kilometraje);
    kmOrigen = `última orden ${ultimaOrden.folio}`;
  }

  // Si aún no hay km, buscar en cualquier orden que lo tenga
  if (!kmActual) {
    for (const o of ordenesOrdenadas) {
      if (o.kilometraje) {
        kmActual = extraerKilometrajeNumerico(o.kilometraje);
        if (kmActual) {
          kmOrigen = `orden ${o.folio}`;
          break;
        }
      }
    }
  }

  // 3. Evaluar días y fecha desde la última visita
  let diasDesdeUltimoServicio = 999;
  let fechaUltimoServicioStr = '';
  let servicioUltimoNombre = '';

  if (ultimaOrden) {
    diasDesdeUltimoServicio = calcularDiasDiferencia(ultimaOrden.creadoEn, hoy);
    fechaUltimoServicioStr = new Date(ultimaOrden.creadoEn).toLocaleDateString('es-MX');
    servicioUltimoNombre = ultimaOrden.servicio;
  } else if (citasProgramadas.length > 0) {
    fechaUltimoServicioStr = citasProgramadas[0].fecha;
    servicioUltimoNombre = citasProgramadas[0].servicio;
  }

  // 4. Determinar Estado General del Mantenimiento
  let estadoGeneral: EstadoMantenimientoGeneral = 'Al corriente';
  let prioridadGlobal: PrioridadPlanMantenimiento = 'Baja';
  let justificacionEstadoGeneral = '';

  if (ordenesEnProceso.length > 0) {
    estadoGeneral = 'Próximo';
    prioridadGlobal = 'Media';
    justificacionEstadoGeneral = `El vehículo cuenta con la orden ${ordenesEnProceso[0].folio} en proceso (${ordenesEnProceso[0].servicio}). Se recomienda programar la siguiente revisión preventiva tras concluir estos trabajos.`;
  } else if (garantiasActivas.length > 0) {
    estadoGeneral = 'Próximo';
    prioridadGlobal = 'Media';
    justificacionEstadoGeneral = `Tiene póliza de garantía vigente (${garantiasActivas[0].folio}) con vencimiento próximo. Se aconseja inspección preventiva de control de calidad.`;
  } else if (diasDesdeUltimoServicio >= 180 || ordenesVeh.length === 0) {
    estadoGeneral = 'Vencido';
    prioridadGlobal = 'Alta';
    if (ordenesVeh.length === 0) {
      justificacionEstadoGeneral = `No se registran órdenes de mantenimiento preventivo previas en el taller para este vehículo. Por seguridad se recomienda una inspección general preventiva inicial.`;
    } else {
      justificacionEstadoGeneral = `Han transcurrido más de 6 meses (${diasDesdeUltimoServicio} días) desde el último servicio registrado (${fechaUltimoServicioStr}), superando el intervalo preventivo estándar recomendado.`;
    }
  } else if (diasDesdeUltimoServicio >= 90) {
    estadoGeneral = 'Próximo';
    prioridadGlobal = 'Media';
    justificacionEstadoGeneral = `Han transcurrido ${diasDesdeUltimoServicio} días desde el último servicio (${servicioUltimoNombre}). Está próximo a cumplir el ciclo preventivo trimestral/semestral.`;
  } else {
    estadoGeneral = 'Al corriente';
    prioridadGlobal = 'Baja';
    justificacionEstadoGeneral = `Servicio reciente realizado hace ${diasDesdeUltimoServicio} días (${fechaUltimoServicioStr}: ${servicioUltimoNombre}). Mantenimiento preventivo en tiempo y forma.`;
  }

  // 5. Determinar Fecha y Kilometraje Sugeridos para la próxima revisión
  let diasParaSiguienteRevision = 30;
  if (estadoGeneral === 'Vencido') {
    diasParaSiguienteRevision = 7; // Próximos 7 días
  } else if (estadoGeneral === 'Próximo') {
    diasParaSiguienteRevision = 21; // Próximas 3 semanas
  } else {
    // Al corriente: sugerir a los 4 meses (120 días) del último servicio
    diasParaSiguienteRevision = Math.max(30, 180 - diasDesdeUltimoServicio);
  }

  const fechaSugeridaRevision = sumarDiasAFecha(hoy, diasParaSiguienteRevision);

  let kilometrajeSugeridoRevision = '';
  if (kmActual) {
    if (estadoGeneral === 'Vencido') {
      kilometrajeSugeridoRevision = `${kmActual.toLocaleString('es-MX')} km (Inmediato)`;
    } else if (estadoGeneral === 'Próximo') {
      const meta = kmActual + 1500;
      kilometrajeSugeridoRevision = `${meta.toLocaleString('es-MX')} km`;
    } else {
      const meta = kmActual + 5000;
      kilometrajeSugeridoRevision = `${meta.toLocaleString('es-MX')} km (+5,000 km)`;
    }
  } else {
    kilometrajeSugeridoRevision = 'Por confirmar (capturar km actual)';
  }

  // 6. Generar Servicios Recomendados Preventivos
  const serviciosRecomendados: ServicioRecomendadoPlan[] = [];

  // Mantenimiento de motor: Aceite y filtros
  const tuvoAceiteReciente = ordenesVeh.some((o) =>
    o.servicio.toLowerCase().includes('aceite') ||
    o.servicio.toLowerCase().includes('afinación') ||
    (o.diagnostico && o.diagnostico.toLowerCase().includes('aceite'))
  );

  if (!tuvoAceiteReciente || diasDesdeUltimoServicio >= 150) {
    serviciosRecomendados.push({
      id: 'srv-rec-1',
      servicio: 'Cambio de aceite y filtro de motor (Preventivo)',
      sistema: 'Motor y lubricación',
      prioridad: estadoGeneral === 'Vencido' ? 'Alta' : 'Media',
      fechaSugerida: fechaSugeridaRevision,
      kilometrajeSugerido: kmActual ? `${(kmActual + (estadoGeneral === 'Vencido' ? 500 : 3000)).toLocaleString('es-MX')} km` : undefined,
      justificacion: tuvoAceiteReciente
        ? `Último registro de cambio de aceite hace aprox. ${diasDesdeUltimoServicio} días; se recomienda renovar lubricante según intervalo de 6 meses o 5,000 km.`
        : 'Sin registro reciente de cambio de lubricante o afinación en el historial del vehículo.',
    });
  }

  // Inspección de frenos
  const tuvoFrenosReciente = ordenesVeh.some((o) =>
    o.servicio.toLowerCase().includes('freno') ||
    o.servicio.toLowerCase().includes('balata') ||
    (o.diagnostico && o.diagnostico.toLowerCase().includes('frenos'))
  );

  serviciosRecomendados.push({
    id: 'srv-rec-2',
    servicio: 'Inspección preventiva de frenos (pastillas, discos y líquido DOT)',
    sistema: 'Frenos y seguridad',
    prioridad: tuvoFrenosReciente ? 'Baja' : 'Media',
    fechaSugerida: fechaSugeridaRevision,
    kilometrajeSugerido: kmActual ? `${(kmActual + 3000).toLocaleString('es-MX')} km` : undefined,
    justificacion: tuvoFrenosReciente
      ? 'Se recomienda inspección de rutina preventiva para verificar desgaste uniforme y nivel de fluido.'
      : 'No se detecta servicio preventivo de frenos en visitas recientes; conviene verificar espesor de balatas y calidad de líquido.',
  });

  // Suspensión y dirección
  serviciosRecomendados.push({
    id: 'srv-rec-3',
    servicio: 'Revisión de suspensión, amortiguadores y terminales de dirección',
    sistema: 'Suspensión y dirección',
    prioridad: 'Baja',
    fechaSugerida: sumarDiasAFecha(hoy, diasParaSiguienteRevision + 30),
    kilometrajeSugerido: kmActual ? `${(kmActual + 5000).toLocaleString('es-MX')} km` : undefined,
    justificacion: `Inspección preventiva recomendada para vehículos año ${vehiculo.año || 'registrado'} para prevenir holguras y desgaste prematuro de llantas.`,
  });

  // Neumáticos y alineación
  serviciosRecomendados.push({
    id: 'srv-rec-4',
    servicio: 'Rotación, calibración y balanceo de neumáticos',
    sistema: 'Tren rodante y neumáticos',
    prioridad: 'Media',
    fechaSugerida: fechaSugeridaRevision,
    kilometrajeSugerido: kmActual ? `${(kmActual + 2500).toLocaleString('es-MX')} km` : undefined,
    justificacion: 'La rotación cada 10,000 km asegura un desgaste parejo de la banda de rodadura y mayor adherencia.',
  });

  // Sistema de enfriamiento y batería
  serviciosRecomendados.push({
    id: 'srv-rec-5',
    servicio: 'Verificación de densidad de anticongelante y prueba de carga de batería',
    sistema: 'Sistema eléctrico y enfriamiento',
    prioridad: 'Baja',
    fechaSugerida: sumarDiasAFecha(hoy, diasParaSiguienteRevision + 45),
    kilometrajeSugerido: kmActual ? `${(kmActual + 6000).toLocaleString('es-MX')} km` : undefined,
    justificacion: 'Mantenimiento preventivo estacional para evitar sobrecalentamientos y fallas en el encendido en frío.',
  });

  // 7. Detectar Datos Faltantes
  const datosFaltantes: string[] = [];
  if (!vehiculo.kilometraje && !ultimaOrden?.kilometraje) {
    datosFaltantes.push('Kilometraje actual no registrado en la ficha del vehículo ni en órdenes recientes.');
  } else if (!vehiculo.kilometraje && kmActual) {
    datosFaltantes.push(`Kilometraje tomado de la orden previa (${kmActual.toLocaleString('es-MX')} km); se aconseja actualizar el kilometraje de hoy.`);
  }

  if (!vehiculo.año) {
    datosFaltantes.push('Año del vehículo no especificado; necesario para calibrar intervalos específicos por edad.');
  }

  if (ordenesVeh.length === 0) {
    datosFaltantes.push('Sin historial de servicios previos registrados en la plataforma.');
  }

  if (!ordenesVeh.some((o) => o.servicio.toLowerCase().includes('batería') || (o.diagnostico && o.diagnostico.toLowerCase().includes('batería')))) {
    datosFaltantes.push('Fecha de última instalación o estado de batería no documentados.');
  }

  if (!ordenesVeh.some((o) => o.servicio.toLowerCase().includes('banda') || o.servicio.toLowerCase().includes('correa'))) {
    datosFaltantes.push('Historial de cambio de banda de accesorios / distribución sin registrar.');
  }

  // 8. Mensaje para WhatsApp cordial y breve
  const fechaFormateada = new Date(fechaSugeridaRevision + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const saludoNombre = cliente?.nombre ? cliente.nombre.split(' ')[0] : 'estimado cliente';
  const mensajeRecordatorioWhatsApp =
    `Hola ${saludoNombre}, te saludamos cordialmente de ${nombreTaller}. ` +
    `Te recordamos que tu ${vehDesc} (placas ${vehiculo.placas}) ` +
    (estadoGeneral === 'Vencido'
      ? `presenta su mantenimiento preventivo periódico pendiente. Para cuidar la vida útil del vehículo y tu seguridad, te sugerimos agendar una revisión general.`
      : `se encuentra próximo a su revisión preventiva sugerida (programada tentativamente para el ${fechaFormateada}${kmActual ? ` o aprox. a los ${kmActual.toLocaleString('es-MX')} km` : ''}).`) +
    ` ¿Deseas que reservemos un espacio en taller para tu comodidad? Quedamos a tus órdenes.`;

  // 9. Plan Resumido Ordenado
  const planResumido: ItemPlanResumido[] = [
    {
      id: 'pr-1',
      orden: 1,
      servicio: 'Revisión de niveles y fluidos (frenos, aceite, dirección)',
      fechaSugerida: fechaSugeridaRevision,
      kilometrajeSugerido: kmActual ? `${kmActual.toLocaleString('es-MX')} km` : 'Revisión inmediata',
      prioridad: estadoGeneral === 'Vencido' ? 'Alta' : 'Media',
      accionSugerida: 'Inspección visual técnica sin costo y relleno de niveles.',
    },
    {
      id: 'pr-2',
      orden: 2,
      servicio: 'Mantenimiento de lubricación: Aceite y filtro',
      fechaSugerida: fechaSugeridaRevision,
      kilometrajeSugerido: kmActual ? `${(kmActual + 1500).toLocaleString('es-MX')} km` : 'Intervalo sugerido',
      prioridad: 'Media',
      accionSugerida: 'Reemplazo de lubricante de motor sintético y filtro nuevo.',
    },
    {
      id: 'pr-3',
      orden: 3,
      servicio: 'Rotación de llantas y calibración de presión',
      fechaSugerida: sumarDiasAFecha(hoy, diasParaSiguienteRevision + 15),
      kilometrajeSugerido: kmActual ? `${(kmActual + 3000).toLocaleString('es-MX')} km` : '+3,000 km',
      prioridad: 'Media',
      accionSugerida: 'Rotar neumáticos en X para conservar vida de la banda de rodado.',
    },
    {
      id: 'pr-4',
      orden: 4,
      servicio: 'Inspección de suspensión, frenos y tren motriz',
      fechaSugerida: sumarDiasAFecha(hoy, diasParaSiguienteRevision + 45),
      kilometrajeSugerido: kmActual ? `${(kmActual + 6000).toLocaleString('es-MX')} km` : '+6,000 km',
      prioridad: 'Baja',
      accionSugerida: 'Prueba en rampa: revisión de bujes, amortiguadores y espesor de discos.',
    },
  ];

  return {
    estadoGeneral,
    justificacionEstadoGeneral,
    serviciosRecomendados,
    prioridadGlobal,
    fechaSugeridaRevision,
    kilometrajeSugeridoRevision,
    justificacionGeneral:
      `Plan elaborado a partir de ${ordenesVeh.length} orden(es) registrada(s), ` +
      `${citasVeh.length} cita(s) y ${garantiasVeh.length} garantía(s). ` +
      (kmActual ? `Kilometraje tomado de ${kmOrigen} (${kmActual.toLocaleString('es-MX')} km). ` : 'Kilometraje actual pendiente de confirmar. ') +
      (ultimaOrden ? `Última visita registrada el ${fechaUltimoServicioStr} (${ultimaOrden.servicio}).` : 'Sin registros de visitas anteriores.'),
    datosFaltantes,
    mensajeRecordatorioWhatsApp,
    planResumido,
    avisoResponsabilidad:
      'Plan preventivo de apoyo; debe validarse según el manual del fabricante y la inspección del técnico.',
    esAnalisisLocal: true,
    modeloUtilizado: 'Motor heurístico local de mantenimiento automotriz preventivo',
    generadoEn: new Date().toISOString(),
  };
};
