import {
  Cliente,
  Vehiculo,
  OrdenTrabajo,
  Refaccion,
  ResultadoAsistenciaTecnica,
  ItemChecklistTecnico,
  PosibleCausaTecnica,
  PuntoRevisionTecnica,
  PreguntaClienteTecnica,
} from '../types';

export interface ParametrosAsistenciaTecnica {
  orden: OrdenTrabajo;
  vehiculo?: Vehiculo;
  cliente?: Cliente;
  historialServicios?: OrdenTrabajo[];
  catalogoRefacciones?: Refaccion[];
  hallazgosMecanico?: string;
  versionSeed?: number;
}

/**
 * Motor de asistencia técnica local automotriz.
 * Funciona como fallback local sin conexión y como base estructurada.
 * Cumple con todas las reglas:
 * - No asegura daños sin revisión física ("posible causa", "se recomienda revisar").
 * - No modifica estados ni agrega costos.
 * - Incluye aviso de confirmación técnica.
 */
export function generarAsistenciaTecnicaLocal(
  params: ParametrosAsistenciaTecnica
): ResultadoAsistenciaTecnica {
  const {
    orden,
    vehiculo,
    cliente,
    historialServicios = [],
    catalogoRefacciones = [],
    hallazgosMecanico = '',
    versionSeed = 1,
  } = params;

  // Extraer información contextual
  const marca = vehiculo?.marca || 'Vehículo';
  const modelo = vehiculo?.modelo || '';
  const anio = vehiculo?.año ? `(${vehiculo.año})` : '';
  const placas = vehiculo?.placas ? `Placas: ${vehiculo.placas}` : '';
  const kmRaw = orden.kilometraje || vehiculo?.kilometraje || '';
  const km = kmRaw ? `${kmRaw} km` : 'No registrado';
  
  const servicioSolicitado = (orden.servicio || '').trim();
  const sintomasCliente = (orden.sintomasCliente || orden.observaciones || '').trim();
  const diagnosticoExistente = (orden.diagnostico || '').trim();
  const obsExistente = (orden.observacionesMecanico || '').trim();
  const dañosVisibles = (orden.dañosVisibles || '').trim();
  const hallazgos = (hallazgosMecanico || '').trim();

  // Historial previo del mismo vehículo
  const serviciosPrevios = historialServicios.filter(
    (h) => h.id !== orden.id && (h.vehiculoId === orden.vehiculoId || (vehiculo && h.vehiculoId === vehiculo.id))
  );

  const refaccionesPrevias: string[] = [];
  serviciosPrevios.forEach((prev) => {
    if (prev.refaccionesUtilizadas && prev.refaccionesUtilizadas.length > 0) {
      prev.refaccionesUtilizadas.forEach((ru) => {
        const found = catalogoRefacciones.find((c) => c.id === ru.refaccionId);
        const name = found ? found.nombre : 'Refacción';
        if (!refaccionesPrevias.includes(name)) {
          refaccionesPrevias.push(name);
        }
      });
    }
  });

  const textoAnalizar = `${servicioSolicitado} ${sintomasCliente} ${obsExistente} ${diagnosticoExistente} ${hallazgos}`.toLowerCase();

  // Detectar categoría técnica predominante
  const esFrenos = /freno|balata|disco|pedal|chirrido|rechin|abs|pastilla|tambor/i.test(textoAnalizar);
  const esSuspension = /suspensi|amortigu|buje|horquilla|golpeteo|tronido|bache|alineaci|balanceo|rotula|bieleta/i.test(textoAnalizar);
  const esMotor = /motor|falla|cilindro|cascabele|potencia|check engine|testigo|humo|aceite|tiron|jalone/i.test(textoAnalizar);
  const esEnfriamiento = /calent|temperatura|anticongelante|radiador|manguera|ventilador|fuga.*verde|fuga.*rosa/i.test(textoAnalizar);
  const esElectrico = /bater[ií]a|alternador|marcha|arranque|no enciende|luces|fusible|cortocircuito/i.test(textoAnalizar);
  const esClima = /aire|ac|a\/c|clima|enfriador|compresor|calefacci|ventilaci/i.test(textoAnalizar);
  const esTransmision = /caja|transmisi|clutch|embrague|cambio|velocidad|patina|engrane/i.test(textoAnalizar);
  const esPreventivo = /afinaci|mantenimiento|servicio mayor|servicio menor|preventivo|cambio de aceite|filtro/i.test(textoAnalizar);

  // 1. Resumen del problema
  let resumenProblema = '';
  if (sintomasCliente) {
    resumenProblema = `Recepción de ${marca} ${modelo} ${anio} con reporte del cliente: "${sintomasCliente}". Servicio registrado: "${servicioSolicitado || 'Revisión general'}".`;
  } else if (servicioSolicitado) {
    resumenProblema = `Ingreso de unidad ${marca} ${modelo} ${anio} para ejecución de "${servicioSolicitado}". Odómetro: ${km}.`;
  } else {
    resumenProblema = `Unidad ${marca} ${modelo} ${anio} ingresada sin descripción detallada de síntomas. Se requiere diagnóstico y entrevista inicial.`;
  }

  // 2. Síntomas organizados
  const sintomasOrganizados: string[] = [];
  if (sintomasCliente) {
    const rawParts = sintomasCliente.split(/[,;\n\.\-]+/).map((s) => s.trim()).filter(Boolean);
    if (rawParts.length > 1) {
      rawParts.forEach((p) => {
        sintomasOrganizados.push(`Síntoma reportado: ${p.charAt(0).toUpperCase() + p.slice(1)}`);
      });
    } else {
      sintomasOrganizados.push(`Reporte principal: ${sintomasCliente}`);
    }
  } else {
    sintomasOrganizados.push(`Servicio solicitado en recepción: ${servicioSolicitado || 'Inspección de diagnóstico'}`);
  }

  if (esFrenos && !sintomasOrganizados.some((s) => /freno|ruido/i.test(s))) {
    sintomasOrganizados.push('Manifestación de posible anomalía en carrera de pedal, vibración o ruido en sistema de frenos.');
  }
  if (esSuspension && !sintomasOrganizados.some((s) => /golpeteo|ruido/i.test(s))) {
    sintomasOrganizados.push('Inestabilidad o ruido sordo/metálico al circular sobre pavimento irregular.');
  }
  if (dañosVisibles && dañosVisibles !== 'Sin daños visibles' && dañosVisibles !== 'Ninguno') {
    sintomasOrganizados.push(`Condición externa reportada en recepción: ${dañosVisibles}.`);
  }
  if (sintomasOrganizados.length < 2) {
    sintomasOrganizados.push(`Condición de marcha a verificar durante la prueba en rampa.`);
  }

  // 3. Posibles causas para revisión (usando "posible causa", "se recomienda revisar")
  const posiblesCausas: PosibleCausaTecnica[] = [];

  if (esFrenos) {
    posiblesCausas.push({
      causa: 'Posible desgaste en material de fricción (balatas/pastillas)',
      sistema: 'Frenos',
      explicacion: 'Se recomienda revisar el espesor de las pastas con calibrador. No se confirma reemplazo hasta desmontar ruedas y verificar desgaste uniforme.',
    });
    posiblesCausas.push({
      causa: 'Posible deformación o ceja perimetral en discos de freno',
      sistema: 'Frenos',
      explicacion: 'Se recomienda medir el alabeo lateral con micrómetro y compararlo con la tolerancia mínima grabada en el disco.',
    });
    posiblesCausas.push({
      causa: 'Posible degradación o burbujas de aire en líquido de frenos',
      sistema: 'Hidráulico de frenos',
      explicacion: 'Se recomienda revisar el punto de ebullición del líquido DOT con probador electrónico.',
    });
  } else if (esSuspension) {
    posiblesCausas.push({
      causa: 'Posible fatiga o pérdida de gas/aceite en amortiguadores',
      sistema: 'Suspensión',
      explicacion: 'Se recomienda revisar vástagos por fuga hidráulica y estado de los cubrepolvos/topes de rebote.',
    });
    posiblesCausas.push({
      causa: 'Posible juego o agrietamiento en bujes de horquilla y barras estabilizadoras',
      sistema: 'Chasis y articulaciones',
      explicacion: 'Se recomienda palanquear los bujes en rampa para detectar holguras no perceptibles con el auto detenido.',
    });
    posiblesCausas.push({
      causa: 'Posible holgura en terminales de dirección o rótulas',
      sistema: 'Dirección',
      explicacion: 'Se recomienda revisar movimientos axiales y radiales en ruedas delanteras suspendidas.',
    });
  } else if (esEnfriamiento) {
    posiblesCausas.push({
      causa: 'Posible microfuga en abrazaderas, mangueras o tanque de radiador',
      sistema: 'Enfriamiento',
      explicacion: 'Se recomienda presurizar el circuito con manómetro para confirmar hermeticidad antes de cualquier desmonte.',
    });
    posiblesCausas.push({
      causa: 'Posible apertura tardía o atascamiento del termostato',
      sistema: 'Enfriamiento',
      explicacion: 'Se recomienda monitorear temperatura de entrada vs. salida con pirómetro infrarrojo.',
    });
    posiblesCausas.push({
      causa: 'Posible fallo en motoventilador (relevador o baja velocidad)',
      sistema: 'Eléctrico de enfriamiento',
      explicacion: 'Se recomienda revisar activación de velocidades 1 y 2 al encender clima o alcanzar temperatura nominal.',
    });
  } else if (esMotor) {
    posiblesCausas.push({
      causa: 'Posible degradación en bujías o bobinas de encendido',
      sistema: 'Ignición / Combustión',
      explicacion: 'Se recomienda revisar resistencia de bobinas y calibración de electrodos de bujía.',
    });
    posiblesCausas.push({
      causa: 'Posible saturación en inyectores o filtro de combustible',
      sistema: 'Alimentación de combustible',
      explicacion: 'Se recomienda medir presión de riel con manómetro y revisar patrones de aspersión.',
    });
    posiblesCausas.push({
      causa: 'Posible lectura errática de sensor de oxígeno o sensor de masa de aire (MAF)',
      sistema: 'Gestión electrónica del motor',
      explicacion: 'Se recomienda escanear con línea de datos en vivo (STFT y LTFT) para verificar compensación de mezcla.',
    });
  } else if (esElectrico) {
    posiblesCausas.push({
      causa: 'Posible pérdida de capacidad de arranque (CCA) en batería',
      sistema: 'Acumulador eléctrico',
      explicacion: 'Se recomienda realizar prueba de conductancia con analizador de baterías bajo carga.',
    });
    posiblesCausas.push({
      causa: 'Posible caída de tensión o deficiencia en diodos del alternador',
      sistema: 'Carga eléctrica',
      explicacion: 'Se recomienda revisar voltaje de carga con luces y clima encendidos (rango óptimo 13.8V - 14.5V).',
    });
  } else {
    posiblesCausas.push({
      causa: 'Posible desgaste normal por kilometraje y tiempo de uso',
      sistema: 'Tren motriz y consumibles',
      explicacion: 'Se recomienda revisar filtros de aire y cabina, fluidos de motor y componentes de alta rotación.',
    });
    posiblesCausas.push({
      causa: 'Posible desajuste o falta de lubricación en puntos de fricción',
      sistema: 'Mecánica general',
      explicacion: 'Se recomienda inspeccionar visualmente bajo rampa para descartar roces o tornillería floja.',
    });
  }

  // Si hay hallazgos capturados por el mecánico, incorporar la causa observada
  if (hallazgos) {
    posiblesCausas.unshift({
      causa: `Hallazgo preliminar reportado por el técnico: "${hallazgos}"`,
      sistema: 'Inspección de taller',
      explicacion: 'Se recomienda documentar medidas o evidencia fotográfica para validación técnica.',
    });
  }

  // 4. Prioridad y justificación
  let prioridad: 'baja' | 'media' | 'alta' = 'media';
  let justificacionPrioridad = 'Servicio estándar preventivo o correctivo sin riesgo inmediato inminente.';

  if (esFrenos || esEnfriamiento || textoAnalizar.includes('fuga') || textoAnalizar.includes('calent')) {
    prioridad = 'alta';
    justificacionPrioridad = 'El sistema involucra seguridad activa de frenado o riesgo de daño severo a la cabeza del motor.';
  } else if (esSuspension || esMotor || esElectrico) {
    prioridad = 'media';
    justificacionPrioridad = 'Afecta la confiabilidad del vehículo, confort de marcha y puede generar daños colaterales si no se atiende oportunamente.';
  } else if (esClima || esPreventivo) {
    prioridad = 'baja';
    justificacionPrioridad = 'Mantenimiento preventivo programado o sistema de confort interior.';
  }

  // 5. Puntos de revisión sugeridos
  const puntosRevision: PuntoRevisionTecnica[] = [];
  if (esFrenos) {
    puntosRevision.push({
      sistema: 'Frenos delanteros',
      componente: 'Pastillas y discos',
      motivo: 'Verificar espesor mínimo en mm, cristalización y homogeneidad del disco.',
    });
    puntosRevision.push({
      sistema: 'Frenos traseros',
      componente: 'Pastillas / Tambores y zapatas',
      motivo: 'Revisar desgaste parejo, mecanismo de auto-ajuste y cilindros de rueda sin humedad.',
    });
    puntosRevision.push({
      sistema: 'Líneas hidráulicas',
      componente: 'Mangueras flexibles y líquido DOT',
      motivo: 'Detectar grietas por fatiga en gomas y humedad en líquido con refractómetro.',
    });
  } else if (esSuspension) {
    puntosRevision.push({
      sistema: 'Amortiguación',
      componente: 'Amortiguadores delanteros y traseros',
      motivo: 'Inspeccionar sellos de aceite, bases superiores y copas de apoyo.',
    });
    puntosRevision.push({
      sistema: 'Bujes y barras',
      componente: 'Bujes de horquilla y gomas de barra estabilizadora',
      motivo: 'Comprobar ausencia de resequedad, rupturas o juego radial.',
    });
    puntosRevision.push({
      sistema: 'Dirección',
      componente: 'Terminales interiores y exteriores de dirección',
      motivo: 'Descartar juego axial con ruedas en el aire y guardapolvos íntegros.',
    });
  } else if (esEnfriamiento) {
    puntosRevision.push({
      sistema: 'Radiador y tapón',
      componente: 'Tapón presurizado y panel disipador',
      motivo: 'Revisar sellos de goma del tapón (libras de presión) y limpieza externa del panel.',
    });
    puntosRevision.push({
      sistema: 'Circuito hidráulico',
      componente: 'Mangueras superior/inferior y bomba de agua',
      motivo: 'Inspeccionar dureza de mangueras y posibles manchas de sarro o testigo de fuga de bomba.',
    });
    puntosRevision.push({
      sistema: 'Termostato y ventilador',
      componente: 'Caja de termostato y motoventilador',
      motivo: 'Verificar temperatura de apertura y accionamiento automático de abanicos.',
    });
  } else if (esMotor) {
    puntosRevision.push({
      sistema: 'Encendido',
      componente: 'Bujías y bobinas individuales',
      motivo: 'Inspeccionar color de combustión en electrodos y ausencia de arco eléctrico en capuchones.',
    });
    puntosRevision.push({
      sistema: 'Admisión',
      componente: 'Cuerpo de aceleración y sensor MAF',
      motivo: 'Revisar acumulación de carbonilla en garganta y limpieza de filamento sensor.',
    });
    puntosRevision.push({
      sistema: 'Filtros y lubricante',
      componente: 'Filtro de aire, aceite y viscosidad',
      motivo: 'Comprobar nivel, color y viscosidad del aceite motor contra especificación.',
    });
  } else {
    puntosRevision.push({
      sistema: 'Inspección de 25 puntos',
      componente: 'Niveles de fluidos y estado de batería',
      motivo: 'Revisar frenos, dirección, refrigerante, limpiaparabrisas y carga de alternador.',
    });
    puntosRevision.push({
      sistema: 'Tren de rodaje',
      componente: 'Llantas y presión de inflado',
      motivo: 'Medir profundidad de piso en milímetros y buscar deformaciones.',
    });
  }

  // 6. Preguntas para el cliente (Recepción / Mecánico)
  const preguntasCliente: PreguntaClienteTecnica[] = [];
  if (esFrenos) {
    preguntasCliente.push({
      pregunta: '¿El chirrido o ruido se escucha al frenar en frío, en caliente o en todo momento?',
      razon: 'Ayuda a diferenciar entre pastillas cristalizadas por humedad vs. balatas en límite de vida.',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿Ha sentido que el pedal de freno baja más de lo normal o se siente blando?',
      razon: 'Permite identificar si requiere purgado o revisión de cilindro maestro.',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿Ha percibido vibración en el volante al frenar a velocidades superiores a 60 km/h?',
      razon: 'Orienta hacia alabeo de discos delanteros vs. traseros.',
      dirigidoA: 'mecanico',
    });
  } else if (esSuspension) {
    preguntasCliente.push({
      pregunta: '¿El ruido o golpeteo ocurre al pasar topes, baches o al girar la dirección?',
      razon: 'Separa problemas de amortiguador/base vs. terminales de dirección o juntas homocinéticas.',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿Siente que el vehículo se desvía hacia algún costado al soltar el volante en recta?',
      razon: 'Verifica necesidad de alineación o bujes de horquilla con holgura.',
      dirigidoA: 'recepcion',
    });
  } else if (esEnfriamiento) {
    preguntasCliente.push({
      pregunta: '¿Ha visto vapor saliendo del cofre o gotas de líquido de color brillante bajo el auto?',
      razon: 'Permite acotar la ubicación de la fuga (radiador frontal o mangueras traseras).',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿Con qué frecuencia ha tenido que rellenar el depósito de anticongelante?',
      razon: 'Establece la severidad y tasa de pérdida del fluido.',
      dirigidoA: 'mecanico',
    });
  } else if (esMotor) {
    preguntasCliente.push({
      pregunta: '¿El jaloneo o falla ocurre al acelerar a fondo, en ralentí o con el clima encendido?',
      razon: 'Ayuda a aislar suministro de combustible vs. bobinas o vacío de admisión.',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿El testigo de Check Engine parpadea o se mantiene fijo?',
      razon: 'Check Engine parpadeando indica riesgo inminente para el convertidor catalítico.',
      dirigidoA: 'recepcion',
    });
  } else {
    preguntasCliente.push({
      pregunta: '¿Aproximadamente cuántos kilómetros o meses han pasado desde el último servicio mayor?',
      razon: 'Permite contrastar el historial de mantenimiento contra la bitácora.',
      dirigidoA: 'recepcion',
    });
    preguntasCliente.push({
      pregunta: '¿Ha notado algún otro síntoma inusual recientemente (olores, vibraciones o luces en tablero)?',
      razon: 'Previene omitir fallas incipientes reportadas por el conductor.',
      dirigidoA: 'mecanico',
    });
  }

  // 7. Checklist técnico interactivo
  const checklistTecnico: ItemChecklistTecnico[] = [];
  let itemCounter = 1;
  const addItem = (item: string, sistema: string) => {
    checklistTecnico.push({
      id: `chk-${itemCounter++}`,
      item,
      sistema,
      completado: false,
    });
  };

  addItem(`Verificar odómetro real y comparar con orden (${km})`, 'Recepción');
  addItem('Revisión visual de niveles de fluidos bajo cofre (aceite, frenos, refrigerante)', 'Compartimento motor');
  
  if (esFrenos) {
    addItem('Medir espesor de pastillas delanteras (especificación mínima 3.0 mm)', 'Frenos delanteros');
    addItem('Medir espesor y verificar alabeo de discos de freno delanteros', 'Frenos delanteros');
    addItem('Inspeccionar balatas / tambores traseros y cilindros de rueda', 'Frenos traseros');
    addItem('Comprobar porcentaje de humedad en líquido de frenos con probador DOT', 'Hidráulico');
    addItem('Revisar estado de mangueras flexibles por agrietamiento o fugas', 'Frenos');
    addItem('Prueba dinámica de frenado en rampa o pista para verificar detención recta', 'Prueba funcional');
  } else if (esSuspension) {
    addItem('Inspeccionar amortiguadores delanteros por fugas de fluido o vástago rayado', 'Suspensión delantera');
    addItem('Palanquear bujes de horquilla superior e inferior para detectar holguras', 'Articulaciones');
    addItem('Revisar juego radial y axial en rótulas de suspensión y terminales de dirección', 'Dirección');
    addItem('Inspeccionar bieletas y bujes de barra estabilizadora', 'Suspensión');
    addItem('Comprobar amortiguadores y resortes traseros', 'Suspensión trasera');
    addItem('Verificar torque de tuercas de rueda con torquímetro', 'Ruedas');
  } else if (esEnfriamiento) {
    addItem('Prueba de presión de estanqueidad del sistema de enfriamiento (15-18 PSI)', 'Prueba presurizada');
    addItem('Revisar tapón de radiador / depósito con probador de presión', 'Sellos');
    addItem('Inspeccionar mangueras superior, inferior y de calefacción al tacto', 'Mangueras');
    addItem('Verificar encendido automático de motoventilador a temperatura nominal', 'Eléctrico');
    addItem('Medir temperatura con termómetro infrarrojo en manguera superior vs inferior', 'Termostato');
  } else if (esMotor) {
    addItem('Escaneo electrónico con escáner OBD2 (lectura de DTCs y línea de datos)', 'Diagnóstico electrónico');
    addItem('Inspección visual de bujías (desgaste de electrodo y color de combustión)', 'Ignición');
    addItem('Comprobar presión de bomba de gasolina con manómetro en riel', 'Combustible');
    addItem('Revisar posibles fugas de vacío con máquina de humo o limpiador dieléctrico', 'Admisión');
    addItem('Inspeccionar condición de filtro de aire y sensor MAF/MAP', 'Admisión');
  } else {
    addItem('Inspección de 25 puntos de seguridad en rampa', 'Inspección general');
    addItem('Verificar estado y presión de las 4 llantas más llanta de refacción', 'Neumáticos');
    addItem('Comprobar luces altas, bajas, direccionales y reversa', 'Iluminación');
    addItem('Revisar suspensión y tren motriz por debajo de la unidad', 'Bajo chasis');
  }

  // 8. Datos faltantes
  const datosFaltantes: string[] = [];
  if (!orden.kilometraje && !vehiculo?.kilometraje) {
    datosFaltantes.push('Lectura confirmada del odómetro al momento del ingreso.');
  }
  if (!sintomasCliente && !orden.servicio) {
    datosFaltantes.push('Detalle puntual de la molestia o ruido descrito por el cliente.');
  }
  if (esFrenos) {
    datosFaltantes.push('Medición en milímetros del espesor remanente de balatas y discos.');
  }
  if (esMotor) {
    datosFaltantes.push('Código(s) de falla DTC registrados en la computadora del motor.');
  }
  if (!orden.mecanicoId && !orden.mecanicoNombre) {
    datosFaltantes.push('Técnico mecánico asignado formalmente a la orden.');
  }
  if (datosFaltantes.length === 0) {
    datosFaltantes.push('Verificación física final por parte del técnico responsable tras desmonte.');
  }

  // 9. Texto sugerido para el diagnóstico
  let diagnosticoSugerido = '';
  if (hallazgos) {
    diagnosticoSugerido = `Se inspeccionó la unidad ${marca} ${modelo} ${anio}. Con base en la revisión en taller: "${hallazgos}". Se recomienda revisar y validar los puntos de desgaste indicados antes de proceder con el armado. Requiere confirmación del técnico responsable previo a emisión de presupuesto.`;
  } else if (esFrenos) {
    diagnosticoSugerido = `Se efectuó revisión técnica preliminar al sistema de frenos de la unidad ${marca} ${modelo} ${anio} con ${km}. Se detecta posible desgaste en material de fricción (pastillas/balatas) y se recomienda inspeccionar físicamente el alabeo de discos y calidad del líquido hidráulico. Se requiere medición milimétrica por parte del técnico responsable.`;
  } else if (esSuspension) {
    diagnosticoSugerido = `Se realizó inspección en rampa del tren de rodaje de ${marca} ${modelo} ${anio}. Se identifican posibles signos de holgura y fatiga elástica en componentes de suspensión/articulaciones. Se recomienda revisar bujes y amortiguadores de manera física sin asegurar daño definitivo hasta prueba bajo carga.`;
  } else if (esEnfriamiento) {
    diagnosticoSugerido = `Se inspeccionó el sistema térmico de la unidad ${marca} ${modelo}. Se identifica posible pérdida de presión o deficiencia en el ciclo de refrigeración. Se recomienda presurizar el sistema y comprobar el accionamiento del termostato y motoventilador antes de emitir recomendación de reemplazo.`;
  } else if (esMotor) {
    diagnosticoSugerido = `Se procedió al protocolo de diagnóstico para ${marca} ${modelo} ${anio}. Se recomienda escanear línea de datos y revisar componentes de ignición/combustión. Se reportan posibles causas en sensores o bujías para comprobación con multímetro y osciloscopio en banco de trabajo.`;
  } else {
    diagnosticoSugerido = `Se llevó a cabo la inspección correspondiente al servicio de "${servicioSolicitado || 'Mantenimiento preventivo'}" para ${marca} ${modelo} ${anio}. Se recomienda revisar puntos críticos de desgaste y confirmar hallazgos para presentar cotización al cliente.`;
  }

  // Si hay versión seed > 1, variar ligeramente la redacción
  if (versionSeed > 1) {
    diagnosticoSugerido = `[Revisión V${versionSeed}] ` + diagnosticoSugerido;
  }

  // 10. Explicación para el cliente (lenguaje claro, amable y profesional)
  let explicacionCliente = '';
  const nombreCliente = cliente?.nombre ? cliente.nombre.split(' ')[0] : 'Estimado cliente';

  if (esFrenos) {
    explicacionCliente = `${nombreCliente}, le informamos que revisamos el sistema de frenos de su ${marca} ${modelo}. Los ruidos o sensaciones reportadas son una advertencia oportuna de que las balatas o discos presentan desgaste natural por uso. Nuestro equipo técnico realizará una medición precisa para confirmarle si únicamente requieren mantenimiento o si es conveniente reemplazar alguna pieza para que maneje con total tranquilidad y seguridad.`;
  } else if (esSuspension) {
    explicacionCliente = `${nombreCliente}, al revisar su ${marca} ${modelo} en nuestra rampa, encontramos que los ruidos al pasar por calles irregulares provienen de piezas de la suspensión que absorben los impactos del camino. El mecánico está comprobando cuáles piezas tienen juego para darle una solución duradera y que su auto recupere la firmeza y suavidad original al conducir.`;
  } else if (esEnfriamiento) {
    explicacionCliente = `${nombreCliente}, respecto al sistema de enfriamiento de su ${marca} ${modelo}, estamos realizando una prueba especial con presión para ubicar exactamente por dónde se pierde líquido o qué componente no está regulando la temperatura correctamente. Cuidar este sistema a tiempo previene calentamientos y protege la vida del motor. Le compartiremos el reporte en cuanto concluya la prueba.`;
  } else if (esMotor) {
    explicacionCliente = `${nombreCliente}, estamos concluyendo el diagnóstico computarizado del motor de su ${marca} ${modelo}. La irregularidad que sintió se relaciona con la combustión o el encendido. Estamos verificando los sensores y bujías para darle un diagnóstico exacto y evitar que gaste en componentes innecesarios. En breve le informamos los resultados.`;
  } else {
    explicacionCliente = `${nombreCliente}, hemos recibido su ${marca} ${modelo} para "${servicioSolicitado || 'su servicio programado'}". Nuestro técnico está realizando la lista de verificación completa de seguridad. En cuanto tengamos los hallazgos confirmados, le informaremos el estado exacto de su vehículo antes de realizar cualquier trabajo adicional.`;
  }

  return {
    resumenProblema,
    sintomasOrganizados,
    posiblesCausas,
    prioridad,
    justificacionPrioridad,
    puntosRevision,
    preguntasCliente,
    checklistTecnico,
    datosFaltantes,
    diagnosticoSugerido,
    explicacionCliente,
    advertenciaRegla: 'Sugerencia de apoyo. Requiere revisión y confirmación del técnico responsable.',
    esAnalisisLocal: true,
    modeloUtilizado: 'Asistencia técnica heurística local (Respaldo automático)',
  };
}
