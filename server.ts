import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generarAnalisisCotizacionLocal } from './src/utils/analisisCotizacionLocal.js';
import { generarRespuestaAtencionLocal } from './src/utils/respuestaAtencionLocal.js';
import { generarAsistenciaTecnicaLocal } from './src/utils/asistenciaTecnicaLocal.js';
import { generarAnalisisInventarioLocal } from './src/utils/analisisInventarioLocal.js';
import {
  generarAnalisisGerencialLocal,
  calcularRangosPeriodo,
  calcularIndicadoresParaRango,
} from './src/utils/analisisGerencialLocal.js';
import { generarPlanMantenimientoLocal } from './src/utils/planMantenimientoLocal.js';
import { generarRevisionFinalLocal } from './src/utils/revisionFinalLocal.js';
import { generarSeguimientoInteligenteLocal } from './src/utils/seguimientoInteligenteLocal.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

// Endpoint POST /api/analizar-cotizacion
app.post('/api/analizar-cotizacion', async (req, res) => {
  const { cotizacion, cliente, vehiculo, servicios, refacciones, configuracion } = req.body;

  if (!cotizacion) {
    return res.status(400).json({ error: 'Faltan datos de la cotización' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Si no hay API key o es el placeholder de desarrollo, responder con análisis local enriquecido
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const localResult = generarAnalisisCotizacionLocal({
      cotizacion,
      cliente,
      vehiculo,
      servicios,
      refacciones,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis local heurístico (Modo demostración)',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `Eres un auditor técnico y asesor comercial automotriz experto para el sistema de talleres "TUNNO".
Tu función es analizar cotizaciones de servicio mecánico automotriz para auditar su consistencia técnica, financiera, legal y la calidad de comunicación hacia el cliente.
La IA actúa ÚNICAMENTE como apoyo consultivo: no aprueba, no rechaza, no cambia precios ni modifica la cotización automáticamente.

Debes responder ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "estadoGeneral": "Correcta" | "Requiere revisión" | "Incompleta",
  "resumenEstado": "Explicación breve de 1 o 2 líneas con el diagnóstico general",
  "alertas": [
    {
      "tipo": "error" | "advertencia" | "info",
      "titulo": "Título breve",
      "descripcion": "Descripción clara del hallazgo (inconsistencia, importe en cero, dato faltante, etc.)"
    }
  ],
  "metricasFinancieras": {
    "costoEstimado": número (costo base estimado de refacciones y mano de obra),
    "precioVenta": número (total cotizado),
    "margenEstimadoPorcentaje": número (porcentaje de margen de utilidad estimado, ej. 42.5),
    "utilidadBruta": número (ganancia bruta en MXN),
    "observacionMargen": "Evaluación breve de la rentabilidad del trabajo"
  },
  "recomendaciones": [
    "Recomendación concreta y accionable 1",
    "Recomendación concreta y accionable 2",
    "Recomendación concreta y accionable 3"
  ],
  "descripcionMejorada": "Redacción técnica pero entendible para el cliente, desglosada con viñetas de inspección, componentes a instalar y mano de obra garantizada.",
  "mensajeWhatsApp": "Mensaje conciso, amigable y profesional listo para enviar al cliente por WhatsApp (con saludo personalizado, folio, resumen de trabajo, total y solicitud amable de autorización)"
}`;

    const userPrompt = `Realiza una revisión técnica y comercial de la siguiente cotización:

INFORMACIÓN DE LA COTIZACIÓN:
- Folio: ${cotizacion.folio || 'N/D'}
- Estado actual: ${cotizacion.estado}
- Descripción registrada: "${cotizacion.descripcion || 'Sin descripción'}"
- Importe Refacciones: $${cotizacion.importeRefacciones || 0} MXN
- Importe Mano de Obra: $${cotizacion.importeManoObra || 0} MXN
- Importe Total: $${cotizacion.total || 0} MXN
- Fecha de creación: ${cotizacion.creadoEn || 'No especificada'}
- Autorización previa: ${cotizacion.autorizacion ? JSON.stringify(cotizacion.autorizacion) : 'Sin autorización previa'}

CLIENTE:
- Nombre: ${cliente?.nombre || 'No registrado'}
- Teléfono: ${cliente?.telefono || 'No registrado'}
- RFC: ${cliente?.rfc || 'No registrado'}

VEHÍCULO:
- Marca / Modelo / Año: ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}` : 'No registrado'}
- Placas: ${vehiculo?.placas || 'Sin placas'}
- Kilometraje: ${vehiculo?.kilometraje || 'No registrado'}

DATOS DEL TALLER:
- Nombre taller: ${configuracion?.nombre || 'TUNNO'}
- Teléfono taller: ${configuracion?.telefono || 'N/A'}

INSPECCIONA ESTOS PUNTOS CRÍTICOS:
1. Datos del cliente y vehículo (si faltan placas, odómetro o teléfono).
2. Descripción del servicio (si es vaga o carece de alcance claro).
3. Costos e importes en cero o sospechosos (si hay refacciones en $0 teniendo piezas en la descripción, si la mano de obra es $0 o si la suma no coincide con el total).
4. Margen financiero estimado y rentabilidad.
5. Vigencia, condiciones y necesidad de visto bueno formal del cliente.
6. Calidad de redacción para el cliente.`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de respuesta en servicio de IA')), 6000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const responseText = response.text?.trim() || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('La respuesta de Gemini no es un JSON válido');
      }
    }

    return res.json({
      ...parsedResult,
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 3.8 Flash',
    });
  } catch (error: any) {
    console.warn('Error al invocar Gemini API, usando fallback local:', error?.message || error);
    const localResult = generarAnalisisCotizacionLocal({
      cotizacion,
      cliente,
      vehiculo,
      servicios,
      refacciones,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis local heurístico (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// Endpoint POST /api/generar-respuesta-atencion
app.post('/api/generar-respuesta-atencion', async (req, res) => {
  const {
    cliente,
    vehiculo,
    motivo,
    motivoLabel,
    tono = 'cordial',
    comentarioLibre,
    citas = [],
    cotizaciones = [],
    ordenes = [],
    facturas = [],
    configuracion,
    citaSeleccionadaId,
    cotizacionSeleccionadaId,
    ordenSeleccionadaId,
    facturaSeleccionadaId,
  } = req.body;

  if (!cliente) {
    return res.status(400).json({ error: 'Faltan datos del cliente' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Si no hay API key o es el placeholder de desarrollo, responder con motor local enriquecido
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const localResult = generarRespuestaAtencionLocal({
      cliente,
      vehiculo,
      motivo,
      tono,
      comentarioLibre,
      citas,
      cotizaciones,
      ordenes,
      facturas,
      configuracion,
      citaSeleccionadaId,
      cotizacionSeleccionadaId,
      ordenSeleccionadaId,
      facturaSeleccionadaId,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Plantilla heurística local (Modo demostración)',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const tallerNombre = configuracion?.nombre || 'TUNNO';
    const systemPrompt = `Eres un asistente profesional de atención y servicio al cliente para el taller automotriz "${tallerNombre}".
Tu objetivo es preparar respuestas para el personal del taller apoyándote exclusivamente en los datos reales del cliente, su vehículo y los registros del sistema.

REGLAS ESTRICTAS DE NEGOCIO:
1. NO INVENTES DATOS: Precios, fechas, estados, diagnósticos y fallas deben basarse ÚNICAMENTE en la información real suministrada.
2. Si un dato no está registrado o no se proporciona (ej. placas, odómetro, teléfono, cotización), indícalo claramente como "No registrado" o colócalo en el apartado de advertencias.
3. No envíes mensajes directamente: tu rol es preparar la propuesta que el usuario revisará y copiará.
4. Tono solicitado: "${tono}" (formal: respetuoso/usted, cordial: amable y cálido, directo: conciso y al grano). Respeta rigurosamente este estilo en el mensaje de WhatsApp.
5. Si detectas información contradictoria o ausente (ej. orden terminada pero se pide avance, cita cancelada, sin teléfono), señálala en el apartado de advertencias.

Debes responder ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "mensajeWhatsApp": "Texto del mensaje redactado para WhatsApp (breve, amable, profesional, con datos reales y listo para copiar)",
  "resumenInterno": "Resumen ejecutivo de 1 o 2 oraciones para el personal del taller",
  "proximaAccion": "Próxima acción recomendada para el personal del taller",
  "fechaSugeridaSeguimiento": "YYYY-MM-DD" o null (fecha sugerida para programar un recordatorio si corresponde),
  "fechaSugeridaExplicacion": "Explicación breve de por qué se sugiere esa fecha",
  "advertencias": [
    {
      "tipo": "faltante" | "inconsistencia" | "info",
      "texto": "Detalle de la información faltante o inconsistente detectada"
    }
  ],
  "tonoUtilizado": "${tono}"
}`;

    const infoContext = `
DATOS DEL CLIENTE:
- Nombre: ${cliente.nombre || 'No registrado'}
- Teléfono: ${cliente.telefono || 'No registrado'}
- Correo: ${cliente.correo || 'No registrado'}

VEHÍCULO SELECCIONADO:
${vehiculo ? `- Marca: ${vehiculo.marca} | Modelo: ${vehiculo.modelo} | Año: ${vehiculo.año || 'N/D'} | Placas: ${vehiculo.placas || 'Sin placas'} | Kilometraje: ${vehiculo.kilometraje || 'No registrado'}` : 'Sin vehículo vinculado'}

MOTIVO DE ATENCIÓN:
- ${motivoLabel || motivo}

TONO SOLICITADO:
- ${tono}

COMENTARIO / NOTA LIBRE DEL PERSONAL:
${comentarioLibre?.trim() ? `"${comentarioLibre.trim()}"` : 'Ninguno especificado'}

REGISTROS DEL SISTEMA DISPONIBLES:
- Citas registradas (${citas.length}): ${JSON.stringify(citas.slice(0, 5))}
- Cotizaciones registradas (${cotizaciones.length}): ${JSON.stringify(cotizaciones.slice(0, 5))}
- Órdenes de trabajo (${ordenes.length}): ${JSON.stringify(ordenes.slice(0, 5))}
- Facturas (${facturas.length}): ${JSON.stringify(facturas.slice(0, 5))}
- Registro específico Cita ID: ${citaSeleccionadaId || 'Automático'}
- Registro específico Cotización ID: ${cotizacionSeleccionadaId || 'Automático'}
- Registro específico Orden ID: ${ordenSeleccionadaId || 'Automático'}
- Registro específico Factura ID: ${facturaSeleccionadaId || 'Automático'}
`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: infoContext,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de respuesta en servicio de IA')), 6000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const responseText = response.text?.trim() || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('La respuesta de Gemini no es un JSON válido');
      }
    }

    return res.json({
      ...parsedResult,
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 3.8 Flash',
    });
  } catch (error: any) {
    console.warn('Error al invocar Gemini API para atención, usando fallback local:', error?.message || error);
    const localResult = generarRespuestaAtencionLocal({
      cliente,
      vehiculo,
      motivo,
      tono,
      comentarioLibre,
      citas,
      cotizaciones,
      ordenes,
      facturas,
      configuracion,
      citaSeleccionadaId,
      cotizacionSeleccionadaId,
      ordenSeleccionadaId,
      facturaSeleccionadaId,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Plantilla heurística local (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// Endpoint POST /api/asistencia-tecnica-orden (Asistencia técnica con IA)
app.post('/api/asistencia-tecnica-orden', async (req, res) => {
  const {
    orden,
    vehiculo,
    cliente,
    historialServicios = [],
    catalogoRefacciones = [],
    hallazgosMecanico = '',
    versionSeed = 1,
  } = req.body;

  if (!orden) {
    return res.status(400).json({ error: 'Faltan datos de la orden de trabajo' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const localResult = generarAsistenciaTecnicaLocal({
      orden,
      vehiculo,
      cliente,
      historialServicios,
      catalogoRefacciones,
      hallazgosMecanico,
      versionSeed,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Asistencia técnica heurística local (Demostración local activa)',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Resumen del historial de servicios
    const resumenHistorial = historialServicios
      .slice(0, 5)
      .map(
        (h: any) =>
          `- Folio: ${h.folio || 'S/F'}, Fecha: ${h.creadoEn || 'N/D'}, Servicio: ${h.servicio || 'General'}, Diagnóstico: ${h.diagnostico || 'Sin registro'}, Refacciones: ${
            h.refaccionesUtilizadas?.length ? h.refaccionesUtilizadas.map((r: any) => r.nombreRefaccion || 'Refacción').join(', ') : 'Ninguna'
          }`
      )
      .join('\n');

    const prompt = `Actúa como un Ingeniero Mecánico Automotriz Master de soporte técnico en un taller profesional.
Tu tarea es brindar asistencia técnica estructurada para la siguiente Orden de Trabajo:

DATOS DEL VEHÍCULO:
- Marca: ${vehiculo?.marca || 'No especificada'}
- Modelo: ${vehiculo?.modelo || 'No especificado'}
- Año: ${vehiculo?.año || 'No especificado'}
- Placas: ${vehiculo?.placas || 'No registradas'}
- Kilometraje actual: ${orden.kilometraje || vehiculo?.kilometraje || 'No registrado'}

DATOS DE LA ORDEN:
- Folio: ${orden.folio}
- Servicio solicitado: ${orden.servicio || 'No especificado'}
- Síntomas indicados por el cliente: ${orden.sintomasCliente || orden.observaciones || 'No detallados'}
- Daños visibles en recepción: ${orden.dañosVisibles || 'Ninguno reportado'}
- Diagnóstico previo existente: ${orden.diagnostico || 'Ninguno'}
- Observaciones previas del mecánico: ${orden.observacionesMecanico || 'Ninguna'}
- Hallazgos adicionales capturados recientemente por el mecánico: ${hallazgosMecanico || 'Sin hallazgos adicionales'}
- Cliente: ${cliente?.nombre || 'Cliente'} (Tel: ${cliente?.telefono || 'N/D'})

HISTORIAL PREVIO DE ESTE VEHÍCULO EN EL TALLER:
${resumenHistorial || 'No hay servicios previos registrados en el sistema.'}

REGLAS OBLIGATORIAS:
1. NO asegures que una pieza está dañada o rota sin una revisión física. Utiliza obligatoriamente expresiones como "posible causa", "se recomienda revisar", "verificar en banco de trabajo", "medir tolerancia".
2. NO cambies el estado de la orden ni inventes costos o precios.
3. El técnico responsable debe confirmar físicamente cualquier texto antes de guardarlo.
4. Si falta información relevante (p. ej. kilometraje, medición en mm, códigos de falla DTC), señálala claramente en "datosFaltantes".
5. Siempre incluye el aviso: "Sugerencia de apoyo. Requiere revisión y confirmación del técnico responsable."
6. En "diagnosticoSugerido", redacta un texto técnico sobrio, profesional y conciso para que el mecánico lo use en la orden si así lo decide.
7. En "explicacionCliente", redacta una explicación en lenguaje claro, respetuoso y comprensible para el cliente, sin jerga confusa.

Genera un JSON estrictamente con la siguiente estructura:
{
  "resumenProblema": "string con el resumen conciso del problema",
  "sintomasOrganizados": ["lista de síntomas claros extraídos de la queja del cliente y servicio"],
  "posiblesCausas": [
    {
      "causa": "string con posible causa (usar 'posible' o 'se recomienda revisar')",
      "sistema": "sistema vehicular (Frenos, Suspensión, Motor, etc.)",
      "explicacion": "por qué se debe inspeccionar y qué prueba se sugiere"
    }
  ],
  "prioridad": "baja" | "media" | "alta",
  "justificacionPrioridad": "justificación técnica del nivel de prioridad",
  "puntosRevision": [
    {
      "sistema": "sistema",
      "componente": "componente",
      "motivo": "inspección o medición recomendada"
    }
  ],
  "preguntasCliente": [
    {
      "pregunta": "pregunta clave para el cliente",
      "razon": "por qué es importante esta información",
      "dirigidoA": "recepcion" | "mecanico" | "ambos"
    }
  ],
  "checklistTecnico": [
    {
      "id": "chk-1",
      "item": "tarea específica de verificación a marcar",
      "sistema": "sistema relacionado",
      "completado": false
    }
  ],
  "datosFaltantes": ["lista de verificaciones o datos que faltan"],
  "diagnosticoSugerido": "texto sugerido para el diagnóstico técnico",
  "explicacionCliente": "explicación clara y accesible para el cliente",
  "advertenciaRegla": "Sugerencia de apoyo. Requiere revisión y confirmación del técnico responsable."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('La respuesta de Gemini no es un JSON válido');
      }
    }

    return res.json({
      ...parsedResult,
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
      advertenciaRegla: 'Sugerencia de apoyo. Requiere revisión y confirmación del técnico responsable.',
    });
  } catch (error: any) {
    console.warn('Error en asistencia técnica con Gemini, usando motor local:', error?.message || error);
    const localResult = generarAsistenciaTecnicaLocal({
      orden,
      vehiculo,
      cliente,
      historialServicios,
      catalogoRefacciones,
      hallazgosMecanico,
      versionSeed,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Asistencia técnica heurística local (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// ========================================================
// ENDPOINT: POST /api/analizar-inventario
// ========================================================
app.post('/api/analizar-inventario', async (req, res) => {
  const {
    refacciones = [],
    movimientos = [],
    ordenesPendientes = [],
    vehiculos = [],
    ordenesCompra = [],
    versionSeed,
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Inventario IA] GEMINI_API_KEY no detectada. Usando motor heurístico local.');
    const localResult = generarAnalisisInventarioLocal({
      refacciones,
      movimientos,
      ordenesPendientes,
      vehiculos,
      ordenesCompra,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis heurístico local de inventario (Respaldo sin clave API)',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Resumir refacciones para el prompt
    const refaccionesSummary = refacciones.map((r: any) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      existencias: r.existencias,
      minimo: r.minimo,
      precioCompra: r.precioCompra ?? r.costoUnitario ?? 0,
      precioVenta: r.precioVenta ?? 0,
      proveedor: r.proveedor || 'Sin proveedor',
      telefonoProveedor: r.telefonoProveedor || 'N/A',
      diasEntregaEstimados: r.diasEntregaEstimados ?? 2,
      compatibilidad: r.compatibilidad || 'Universal / No especificada',
    }));

    // Resumir movimientos recientes
    const ultimosMovimientos = (movimientos || []).slice(-40).map((m: any) => ({
      tipo: m.tipo,
      refaccionId: m.refaccionId,
      cantidad: m.cantidad,
      motivo: m.motivo,
      fechaHora: m.fechaHora,
    }));

    // Resumir órdenes activas
    const ordenesActivas = (ordenesPendientes || [])
      .filter((o: any) => o.estado === 'En proceso' || o.estado === 'Pendiente' || o.estado === 'Por autorizar')
      .map((o: any) => ({
        folio: o.folio,
        vehiculoDesc: o.vehiculoDesc,
        descripcionServicio: o.descripcionServicio,
        estado: o.estado,
        refaccionesUtilizadas: o.refaccionesUtilizadas || [],
      }));

    const systemInstruction = `Eres un asesor experto en logística, compras e inventarios para talleres automotrices profesionales.
Tu objetivo es analizar el catálogo de refacciones, existencias, mínimos de stock, movimientos de almacén, precios, márgenes y órdenes de trabajo en curso.

REGLAS ESTRICTAS:
1. NO inventar proveedores, precios de compra, precios de venta ni tiempos de entrega que no existan en los datos registrados.
2. Si faltan datos (por ejemplo piezas sin proveedor, sin precio de compra o venta), indícalos con exactitud en "datosFaltantes".
3. Las cantidades a comprar son SUGERENCIAS profesionales para que las revise y apruebe el administrador del taller.
4. Categoriza las prioridades exclusivamente como:
   - "urgente": pieza agotada (0 existencias) o requerida de inmediato en órdenes activas en proceso.
   - "proxima": existencias menores al mínimo pero con stock remanente para corto plazo.
   - "preventiva": existencias cerca del mínimo o sugerencia de lote de rotación.
5. Identifica piezas con problemas de precios o márgenes:
   - Sin precio de compra (costo cero)
   - Sin precio de venta (venta cero)
   - Margen bajo (< 20%) o margen negativo/incongruente (venta <= compra).
6. Muestra siempre la advertencia institucional: "Recomendaciones basadas en los datos registrados; requieren validación del responsable."
7. Devuelve un formato JSON estricto con las claves solicitadas.`;

    const promptText = `Analiza el estado del almacén y genera recomendaciones con versión/semilla ${versionSeed || 1}:

CATÁLOGO DE REFACCIONES (${refaccionesSummary.length} ítems):
${JSON.stringify(refaccionesSummary, null, 2)}

MOVIMIENTOS REGISTRADOS (Muestra de últimos):
${JSON.stringify(ultimosMovimientos, null, 2)}

ÓRDENES DE TRABAJO EN PROCESO / PENDIENTES EN TALLER:
${JSON.stringify(ordenesActivas, null, 2)}

Genera la respuesta estrictamente con la siguiente estructura JSON:
{
  "resumenGeneral": "Resumen ejecutivo del estado del inventario...",
  "refaccionesAtencion": [
    {
      "refaccionId": "ID",
      "codigo": "COD",
      "nombre": "Nombre pieza",
      "existencias": 0,
      "minimo": 5,
      "estadoStock": "agotado" | "stock_bajo" | "proximo_minimo",
      "motivo": "Explicación del riesgo o desabasto"
    }
  ],
  "comprasRecomendadas": [
    {
      "refaccionId": "ID",
      "codigo": "COD",
      "nombre": "Nombre",
      "cantidadSugerida": 5,
      "motivo": "Motivo claro de compra...",
      "prioridad": "urgente" | "proxima" | "preventiva",
      "precioCompraEstimado": 150,
      "proveedorSugerido": "Nombre proveedor registrado",
      "telefonoProveedor": "Tel registrado",
      "diasEntregaEstimados": 2
    }
  ],
  "prioridades": {
    "urgentes": 2,
    "proximas": 3,
    "preventivas": 1
  },
  "impactoEnTaller": [
    {
      "ordenId": "opcional",
      "folioOrden": "OT-001",
      "vehiculoDesc": "Marca Modelo",
      "servicioDesc": "Servicio",
      "estadoOrden": "En proceso",
      "refaccionAfectada": "Nombre y código",
      "descripcionImpacto": "Qué retraso o riesgo existe para el servicio",
      "nivelRiesgo": "alto" | "medio" | "bajo"
    }
  ],
  "preciosMargenAlertas": [
    {
      "refaccionId": "ID",
      "codigo": "COD",
      "nombre": "Nombre",
      "precioCompra": 100,
      "precioVenta": 110,
      "margenPorcentaje": 9,
      "tipoProblema": "sin_precio_compra" | "sin_precio_venta" | "margen_bajo" | "precio_incongruente",
      "detalle": "Detalle del problema",
      "sugerencia": "Recomendación de precio o corrección"
    }
  ],
  "proveedoresSugeridos": [
    {
      "proveedor": "Nombre",
      "telefono": "Tel",
      "diasEntrega": 2,
      "refaccionesDisponibles": ["Filtro", "Aceite"],
      "motivoSugerencia": "Por qué consultar a este proveedor según disponibilidad y tiempo",
      "nivelConfianza": "alto" | "medio" | "regular"
    }
  ],
  "resumenParaCompraTexto": "Texto completo y formateado tipo reporte listo para copiar o imprimir...",
  "datosFaltantes": ["Lista de datos ausentes detectados"],
  "advertenciaRegla": "Recomendaciones basadas en los datos registrados; requieren validación del responsable."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('[Inventario IA] Fallo parseo JSON Gemini, sanitizando respuesta:', parseError);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    }

    // Asegurar estructura
    const fallback = generarAnalisisInventarioLocal({
      refacciones,
      movimientos,
      ordenesPendientes,
      vehiculos,
      ordenesCompra,
    });

    return res.json({
      resumenGeneral: parsed.resumenGeneral || fallback.resumenGeneral,
      refaccionesAtencion: Array.isArray(parsed.refaccionesAtencion) ? parsed.refaccionesAtencion : fallback.refaccionesAtencion,
      comprasRecomendadas: Array.isArray(parsed.comprasRecomendadas) ? parsed.comprasRecomendadas : fallback.comprasRecomendadas,
      prioridades: parsed.prioridades || fallback.prioridades,
      impactoEnTaller: Array.isArray(parsed.impactoEnTaller) ? parsed.impactoEnTaller : fallback.impactoEnTaller,
      preciosMargenAlertas: Array.isArray(parsed.preciosMargenAlertas) ? parsed.preciosMargenAlertas : fallback.preciosMargenAlertas,
      proveedoresSugeridos: Array.isArray(parsed.proveedoresSugeridos) ? parsed.proveedoresSugeridos : fallback.proveedoresSugeridos,
      resumenParaCompraTexto: parsed.resumenParaCompraTexto || fallback.resumenParaCompraTexto,
      datosFaltantes: Array.isArray(parsed.datosFaltantes) ? parsed.datosFaltantes : fallback.datosFaltantes,
      advertenciaRegla: 'Recomendaciones basadas en los datos registrados; requieren validación del responsable.',
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
    });
  } catch (error: any) {
    console.error('[Inventario IA] Error llamando a Gemini, utilizando motor heurístico local:', error?.message || error);
    const localResult = generarAnalisisInventarioLocal({
      refacciones,
      movimientos,
      ordenesPendientes,
      vehiculos,
      ordenesCompra,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis heurístico local de inventario (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// ========================================================
// ENDPOINT: POST /api/analizar-gerencial
// ========================================================
app.post('/api/analizar-gerencial', async (req, res) => {
  const {
    ordenes = [],
    cotizaciones = [],
    citas = [],
    facturas = [],
    refacciones = [],
    servicios = [],
    movimientos = [],
    empleados = [],
    clientes = [],
    seguimientos = [],
    garantias = [],
    configuracion,
    periodo = 'este_mes',
    fechaDesde,
    fechaHasta,
  } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Gerencial IA] GEMINI_API_KEY no detectada. Usando motor heurístico local.');
    const localResult = generarAnalisisGerencialLocal({
      ordenes,
      cotizaciones,
      citas,
      facturas,
      refacciones,
      servicios,
      movimientos,
      empleados,
      clientes,
      seguimientos,
      garantias,
      configuracion,
      periodo,
      fechaDesde,
      fechaHasta,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis gerencial heurístico local (Respaldo sin clave API)',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // 1. Calcular rangos y métricas reales primero en el backend
    const rangos = calcularRangosPeriodo(periodo, fechaDesde, fechaHasta);
    const indActual = calcularIndicadoresParaRango(
      {
        ordenes,
        cotizaciones,
        citas,
        facturas,
        refacciones,
        servicios,
        movimientos,
        empleados,
        clientes,
        seguimientos,
        garantias,
        configuracion,
        periodo,
      },
      rangos.desdeActual,
      rangos.hastaActual
    );
    const indAnterior = calcularIndicadoresParaRango(
      {
        ordenes,
        cotizaciones,
        citas,
        facturas,
        refacciones,
        servicios,
        movimientos,
        empleados,
        clientes,
        seguimientos,
        garantias,
        configuracion,
        periodo,
      },
      rangos.desdeAnterior,
      rangos.hastaAnterior
    );

    const nombreTaller = configuracion?.nombre || configuracion?.nombreTaller || 'Taller Mecánico';

    // Determinar si hay datos previos suficientes para comparar
    const tieneDatosPrevios = indAnterior.ingresosTotales > 0 || indAnterior.ordenesTotales > 0;
    let cambioIngresosPorcentaje: number | undefined;
    let cambioOrdenesPorcentaje: number | undefined;
    let cambioConversionPorcentaje: number | undefined;
    let diferenciaMargenPorcentaje: number | undefined;

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
    }

    const prompt = `Actúa como un Consultor y Director de Operaciones Automotrices especializado en gestión de talleres mecánicos para "${nombreTaller}".
Tu labor es generar un ANÁLISIS GERENCIAL ESTRATÉGICO riguroso basado EXCLUSIVAMENTE en los datos reales del periodo seleccionado.

PERIODO EVALUADO:
- Periodo actual: ${rangos.etiquetaActual} (del ${rangos.desdeActual} al ${rangos.hastaActual})
- Periodo anterior equivalente: ${rangos.etiquetaAnterior} (del ${rangos.desdeAnterior} al ${rangos.hastaAnterior})

INDICADORES REALES DEL PERIODO ACTUAL (NO DEBES INVENTAR NINGUNA CIFRA):
- Ingresos totales generados: $${indActual.ingresosTotales.toLocaleString('es-MX')}
  * Ingresos cobrados (pagados): $${indActual.ingresosCobrados.toLocaleString('es-MX')}
  * Ingresos pendientes de cobro: $${indActual.ingresosPendientes.toLocaleString('es-MX')}
- Costos directos estimados: $${indActual.costosTotales.toLocaleString('es-MX')}
  * Costo refacciones: $${indActual.costoRefacciones.toLocaleString('es-MX')}
  * Costo mano de obra estimada: $${indActual.costoManoObra.toLocaleString('es-MX')}
- Margen bruto estimado: $${indActual.margenEstimadoPesos.toLocaleString('es-MX')} (${indActual.margenEstimadoPorcentaje}%)
- Cotizaciones: ${indActual.cotizacionesTotales} totales
  * Aprobadas: ${indActual.cotizacionesAprobadas}
  * Rechazadas: ${indActual.cotizacionesRechazadas}
  * Pendientes de decisión: ${indActual.cotizacionesPendientes}
  * Tasa de conversión: ${indActual.tasaConversionCotizaciones}%
- Órdenes de trabajo: ${indActual.ordenesTotales} totales
  * Concluidas / entregadas: ${indActual.ordenesTerminadas}
  * En proceso / diagnóstico: ${indActual.ordenesEnProceso}
  * Atrasadas / excedidas de tiempo: ${indActual.ordenesAtrasadas}
  * Tiempo promedio de ciclo: ${indActual.tiempoPromedioAtencionDias} días
- Productividad por técnico:
${indActual.productividadTecnicos.map((t) => `  * ${t.tecnico}: ${t.asignadas} asignadas, ${t.terminadas} terminadas (${t.eficienciaPorcentaje}% eficiencia)`).join('\n') || '  * No hay técnicos asignados'}
- Refacciones con mayor rotación:
${indActual.refaccionesMayorMovimiento.map((r) => `  * ${r.nombre} (${r.codigo}): ${r.unidadesMovidas} unidades`).join('\n') || '  * Sin movimientos registrados'}
- Clientes atendidos: ${indActual.clientesAtendidos} (${indActual.clientesNuevos} nuevos, ${indActual.clientesRecurrentes} recurrentes)
- Seguimientos pendientes: ${indActual.seguimientosPendientes}
- Garantías registradas: ${indActual.garantiasRegistradas} (${indActual.tasaGarantiasPorcentaje}% de incidencia)

DATOS DEL PERIODO ANTERIOR EQUIVALENTE:
- ¿Dispone de datos previos suficientes?: ${tieneDatosPrevios ? 'SÍ' : 'NO'}
${tieneDatosPrevios ? `- Ingresos previos: $${indAnterior.ingresosTotales.toLocaleString('es-MX')} (Variación: ${cambioIngresosPorcentaje}%)
- Órdenes previas: ${indAnterior.ordenesTotales} (Variación: ${cambioOrdenesPorcentaje}%)
- Margen previo: ${indAnterior.margenEstimadoPorcentaje}% (Dif: ${diferenciaMargenPorcentaje}%)
- Conversión previa: ${indAnterior.tasaConversionCotizaciones}% (Dif: ${cambioConversionPorcentaje}%)` : '- Periodo base sin datos previos suficientes.'}

REGLAS OBLIGATORIAS:
1. NO inventes cifras, clientes, ni porcentajes. Cada conclusión DEBE estar explícitamente respaldada por uno de los indicadores listados arriba.
2. Si faltan datos (por ejemplo técnicos sin asignar o costos en cero), señálalo con precisión en "datosFaltantes".
3. Proporciona MÁXIMO cinco recomendaciones de negocio concretas, ordenadas de prioridad 1 (más crítica) a 5 (preventiva o de optimización).
4. El resumen para compartir debe ser un texto profesional, claro y listo para enviar al gerente por WhatsApp o correo.
5. NO presentes el resultado como información fiscal o contable oficial. Debe contener siempre el aviso institucional: "Análisis administrativo basado en los datos disponibles de la demostración."

Devuelve un JSON estrictamente con la siguiente estructura:
{
  "resumenEjecutivo": "string con explicación breve y ejecutiva del periodo",
  "aspectosPositivos": ["lista de 2 a 4 logros favorables respaldados por las cifras"],
  "situacionesAtencion": ["lista de 2 a 4 problemas, retrasos, costos o datos que requieren atención"],
  "recomendaciones": [
    {
      "prioridad": 1,
      "titulo": "Título de la acción",
      "area": "Ingresos" | "Operación" | "Ventas" | "Inventario" | "Calidad",
      "accion": "Acción concreta a ejecutar",
      "impactoEsperado": "Beneficio esperado"
    }
  ],
  "resumenComparativa": "Texto explicativo de la comparación con el periodo previo",
  "resumenParaCompartir": "Texto completo y formateado para enviar al gerente",
  "datosFaltantes": ["string con datos faltantes observados"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('La respuesta de Gemini no es un JSON válido');
      }
    }

    // Armar el objeto completo combinando indicadores numéricos exactos y la redacción analítica de Gemini
    const finalResult = {
      periodoSeleccionado: periodo,
      etiquetaPeriodo: rangos.etiquetaActual,
      rangoFechas: {
        desde: rangos.desdeActual,
        hasta: rangos.hastaActual,
      },
      resumenEjecutivo: parsedResult.resumenEjecutivo || 'Resumen gerencial del periodo.',
      aspectosPositivos: parsedResult.aspectosPositivos || [],
      situacionesAtencion: parsedResult.situacionesAtencion || [],
      recomendaciones: (parsedResult.recomendaciones || []).slice(0, 5).map((r: any, idx: number) => ({
        prioridad: idx + 1,
        titulo: r.titulo || `Acción ${idx + 1}`,
        area: r.area || 'Operación',
        accion: r.accion || '',
        impactoEsperado: r.impactoEsperado || '',
      })),
      indicadores: indActual,
      comparacion: {
        disponible: tieneDatosPrevios,
        periodoAnteriorNombre: rangos.etiquetaAnterior,
        resumenComparativa: parsedResult.resumenComparativa || (tieneDatosPrevios ? 'Comparativa calculada con respecto al ciclo previo.' : 'Sin datos previos suficientes.'),
        cambioIngresosPorcentaje,
        cambioOrdenesPorcentaje,
        cambioConversionPorcentaje,
        diferenciaMargenPorcentaje,
        motivoSiNoDisponible: tieneDatosPrevios ? undefined : 'Historial previo insuficiente en el rango de fechas seleccionado.',
      },
      resumenParaCompartir: parsedResult.resumenParaCompartir || '',
      datosFaltantes: parsedResult.datosFaltantes || [],
      advertenciaRegla: 'Análisis administrativo basado en los datos disponibles de la demostración.',
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
    };

    return res.json(finalResult);
  } catch (error: any) {
    console.warn('Error en análisis gerencial con Gemini, usando motor local:', error?.message || error);
    const localResult = generarAnalisisGerencialLocal({
      ordenes,
      cotizaciones,
      citas,
      facturas,
      refacciones,
      servicios,
      movimientos,
      empleados,
      clientes,
      seguimientos,
      garantias,
      configuracion,
      periodo,
      fechaDesde,
      fechaHasta,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Análisis gerencial heurístico local (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// ========================================================
// ENDPOINT: POST /api/generar-plan-mantenimiento
// ========================================================
app.post('/api/generar-plan-mantenimiento', async (req, res) => {
  const {
    vehiculo,
    cliente,
    ordenes = [],
    citas = [],
    garantias = [],
    configuracion,
  } = req.body;

  if (!vehiculo) {
    return res.status(400).json({ error: 'El parámetro vehiculo es requerido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Plan Mantenimiento IA] GEMINI_API_KEY no detectada. Usando motor heurístico local.');
    const localResult = generarPlanMantenimientoLocal({
      vehiculo,
      cliente,
      ordenes,
      citas,
      garantias,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Motor heurístico local de mantenimiento automotriz preventivo',
    });
  }

  try {
    const ai = new GoogleGenAI();
    const ordenesVeh = ordenes.filter((o: any) => o.vehiculoId === vehiculo.id);
    const citasVeh = citas.filter((c: any) => c.vehiculoId === vehiculo.id);
    const garantiasVeh = garantias.filter((g: any) => g.vehiculoId === vehiculo.id);

    const promptText = `
Eres un asesor técnico automotriz y de servicio al cliente especializado en mantenimiento preventivo.
Tu tarea es generar un PLAN DE MANTENIMIENTO PREVENTIVO personalizado y profesional para el siguiente vehículo registrado en el taller.

DATOS DEL VEHÍCULO:
- Marca: ${vehiculo.marca}
- Modelo: ${vehiculo.modelo}
- Año: ${vehiculo.año || 'No registrado'}
- Placas: ${vehiculo.placas}
- Kilometraje actual registrado: ${vehiculo.kilometraje || 'No especificado en ficha'}
- Color: ${vehiculo.color || 'No especificado'}
- Próximo servicio programado anterior: ${vehiculo.proximoServicioFecha || 'Ninguno'} (Km: ${vehiculo.proximoServicioKm || 'Ninguno'})
- Recomendaciones previas guardadas: ${JSON.stringify(vehiculo.recomendacionesMantenimiento || [])}

PROPIETARIO / CLIENTE:
- Nombre: ${cliente?.nombre || 'Particular'}
- Teléfono: ${cliente?.telefono || 'No registrado'}

HISTORIAL DE ÓRDENES DE TRABAJO REGISTRADAS (${ordenesVeh.length}):
${JSON.stringify(
  ordenesVeh.map((o: any) => ({
    folio: o.folio,
    fecha: o.creadoEn,
    servicio: o.servicio,
    kilometraje: o.kilometraje,
    dañosVisibles: o.dañosVisibles,
    diagnostico: o.diagnostico,
    observaciones: o.observaciones,
    estado: o.estado,
    refaccionesUtilizadas: o.refaccionesUtilizadas?.length || 0,
  })),
  null,
  2
)}

CITAS REGISTRADAS (${citasVeh.length}):
${JSON.stringify(
  citasVeh.map((c: any) => ({
    fecha: c.fecha,
    hora: c.hora,
    servicio: c.servicio,
    estado: c.estado,
  })),
  null,
  2
)}

PÓLIZAS DE GARANTÍA ASOCIADAS (${garantiasVeh.length}):
${JSON.stringify(
  garantiasVeh.map((g: any) => ({
    folio: g.folio,
    trabajoCubierto: g.trabajoCubierto,
    fechaInicio: g.fechaInicio,
    fechaFin: g.fechaFin,
    estado: g.estado,
  })),
  null,
  2
)}

TALLER:
- Nombre: ${configuracion?.nombre || 'TUNNO'}
- Teléfono: ${configuracion?.telefono || '555-432-1000'}

REGLAS OBLIGATORIAS:
1. La IA no debe afirmar que existe una falla sin inspección física. Utiliza términos como "posible causa", "se recomienda revisar", "inspección preventiva".
2. Todas las recomendaciones deben presentarse como estrictamente PREVENTIVAS.
3. No inventes información técnica específica que no esté registrada en la plataforma.
4. No debes modificar fechas, kilometraje u órdenes.
5. Si faltan datos clave (por ejemplo kilometraje actual no registrado, historial de cambio de bandas, bujías o batería sin documentar), debes señalarlos con precisión en "datosFaltantes".
6. El aviso debe ser exactamente: "Plan preventivo de apoyo; debe validarse según el manual del fabricante y la inspección del técnico".
7. Mensaje para el cliente: Un recordatorio breve, formal y cordial adecuado para WhatsApp.
8. Estado general debe ser exactamente uno de: "Al corriente", "Próximo", "Vencido".
9. Prioridad global debe ser exactamente uno de: "Baja", "Media", "Alta".
10. Genera un plan resumido cronológico o por kilometraje con pasos concretos de inspección.

Devuelve EXCLUSIVAMENTE una estructura JSON válida que se ajuste a este esquema:
{
  "estadoGeneral": "Al corriente" | "Próximo" | "Vencido",
  "justificacionEstadoGeneral": "string",
  "serviciosRecomendados": [
    {
      "id": "srv-1",
      "servicio": "string",
      "sistema": "string",
      "prioridad": "Baja" | "Media" | "Alta",
      "fechaSugerida": "YYYY-MM-DD",
      "kilometrajeSugerido": "string",
      "justificacion": "string"
    }
  ],
  "prioridadGlobal": "Baja" | "Media" | "Alta",
  "fechaSugeridaRevision": "YYYY-MM-DD",
  "kilometrajeSugeridoRevision": "string",
  "justificacionGeneral": "string",
  "datosFaltantes": ["string"],
  "mensajeRecordatorioWhatsApp": "string",
  "planResumido": [
    {
      "id": "pr-1",
      "orden": 1,
      "servicio": "string",
      "fechaSugerida": "YYYY-MM-DD",
      "kilometrajeSugerido": "string",
      "prioridad": "Baja" | "Media" | "Alta",
      "accionSugerida": "string"
    }
  ],
  "avisoResponsabilidad": "Plan preventivo de apoyo; debe validarse según el manual del fabricante y la inspección del técnico."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    return res.json({
      ...parsed,
      avisoResponsabilidad:
        'Plan preventivo de apoyo; debe validarse según el manual del fabricante y la inspección del técnico.',
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
      generadoEn: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Plan Mantenimiento IA] Error llamando a Gemini, utilizando motor heurístico local:', error?.message || error);
    const localResult = generarPlanMantenimientoLocal({
      vehiculo,
      cliente,
      ordenes,
      citas,
      garantias,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Motor heurístico local de mantenimiento automotriz preventivo (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// ========================================================
// ENDPOINT: POST /api/revision-final-orden
// ========================================================
app.post('/api/revision-final-orden', async (req, res) => {
  const {
    orden,
    cotizacion,
    vehiculo,
    cliente,
    refacciones = [],
    facturas = [],
    garantias = [],
    configuracion,
    responsable,
  } = req.body;

  if (!orden) {
    return res.status(400).json({ error: 'El parámetro orden es requerido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Revisión Final IA] GEMINI_API_KEY no detectada. Usando motor heurístico local.');
    const localResult = generarRevisionFinalLocal({
      orden,
      cotizacion,
      vehiculo,
      cliente,
      refacciones,
      facturas,
      garantias,
      configuracion,
      responsable,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Motor heurístico local de validación previa a entrega',
    });
  }

  try {
    const ai = new GoogleGenAI();

    const facturaAsociada = facturas.find(
      (f: any) =>
        (f.cotizacionId && cotizacion && f.cotizacionId === cotizacion.id) ||
        (f.vehiculoId && vehiculo && f.vehiculoId === vehiculo.id && f.descripcion?.includes(orden.folio))
    );

    const promptText = `
Eres un inspector jefe de control de calidad y servicio al cliente automotriz.
Tu tarea es auditar una orden de trabajo terminada ANTES de entregar el vehículo al cliente, detectando inconsistencias, pendientes administrativos, estatus de calidad y redactando la información que se entregará al cliente.

ORDEN DE TRABAJO A REVISAR:
- Folio: ${orden.folio}
- Servicio solicitado: ${orden.servicio}
- Kilometraje registrado: ${orden.kilometraje || 'No capturado'}
- Diagnóstico técnico: ${orden.diagnostico || 'No capturado'}
- Observaciones del mecánico: ${orden.observacionesMecanico || 'No capturado'}
- Estado actual de la orden: ${orden.estado}
- Trabajo marcado como terminado: ${orden.trabajoTerminado ? 'Sí' : 'No'}
- Revisión final de control de calidad marcada: ${orden.revisionFinal ? 'Sí' : 'No'}
- Daños visibles / inventario inicial: ${orden.dañosVisibles || 'Sin registro'}
- Refacciones utilizadas en la orden: ${JSON.stringify(orden.refaccionesUtilizadas || [])}

COTIZACIÓN ASOCIADA:
${cotizacion ? JSON.stringify({
  folio: cotizacion.folio,
  descripcion: cotizacion.descripcion,
  importeRefacciones: cotizacion.importeRefacciones,
  importeManoObra: cotizacion.importeManoObra,
  total: cotizacion.total,
  estado: cotizacion.estado,
  autorizacion: cotizacion.autorizacion,
}, null, 2) : 'Sin cotización vinculada en la orden'}

DATOS DEL VEHÍCULO:
${vehiculo ? JSON.stringify({
  marca: vehiculo.marca,
  modelo: vehiculo.modelo,
  año: vehiculo.año,
  placas: vehiculo.placas,
  kilometrajeFicha: vehiculo.kilometraje,
  recomendacionesPrevias: vehiculo.recomendacionesMantenimiento,
}, null, 2) : 'No disponible'}

CLIENTE / PROPIETARIO:
${cliente ? JSON.stringify({
  nombre: cliente.nombre,
  telefono: cliente.telefono,
  correo: cliente.correo,
}, null, 2) : 'No disponible'}

FACTURACIÓN Y COBRO:
${facturaAsociada ? JSON.stringify({
  folio: facturaAsociada.folio,
  total: facturaAsociada.total,
  estado: facturaAsociada.estado,
  pago: facturaAsociada.pago,
}, null, 2) : 'Sin factura emitida en el sistema'}

PÓLIZAS DE GARANTÍA:
${JSON.stringify(garantias.filter((g: any) => g.ordenId === orden.id || (vehiculo && g.vehiculoId === vehiculo.id)), null, 2)}

RESPONSABLE AUDITOR:
- Nombre: ${responsable?.nombre || orden.mecanicoNombre || 'Responsable de calidad'}
- Rol: ${responsable?.rol || 'Control de calidad'}

TALLER:
- Nombre: ${configuracion?.nombre || 'TUNNO'}
- Teléfono: ${configuracion?.telefono || '555-432-1000'}

REGLAS OBLIGATORIAS:
1. La IA no debe marcar la orden como entregada ni modificar el estado de la orden.
2. No debe aprobar el control de calidad automáticamente.
3. No debe inventar trabajos, refacciones, costos o diagnósticos no registrados.
4. Si detecta diferencias (trabajos realizados que no aparezcan autorizados o conceptos autorizados sin terminar, refacciones usadas no presupuestadas), debe detallarlas claramente en "diferencias".
5. La entrega final requiere confirmación del responsable.
6. Muestra el aviso de responsabilidad exactamente: "Revisión de apoyo; la liberación del vehículo corresponde al responsable de calidad".
7. Estado de entrega debe ser exactamente uno de: "Lista para entregar" | "Requiere revisión" | "Incompleta".
8. Redacta un resumen claro, comprensible y profesional para el cliente de los trabajos realizados.
9. Redacta recomendaciones preventivas con fecha o kilometraje sugeridos.
10. Redacta un mensaje de entrega cordial y breve adecuado para enviar por WhatsApp.

Devuelve EXCLUSIVAMENTE una estructura JSON válida que se ajuste a este esquema:
{
  "estadoEntrega": "Lista para entregar" | "Requiere revisión" | "Incompleta",
  "justificacionEstado": "string",
  "datosFaltantes": ["string"],
  "diferencias": [
    {
      "tipo": "trabajo_no_autorizado" | "concepto_no_terminado" | "costo_diferente" | "otra",
      "titulo": "string",
      "descripcion": "string",
      "gravedad": "alta" | "media" | "baja"
    }
  ],
  "pendientesImportantes": [
    {
      "categoria": "Facturación" | "Pago" | "Control de calidad" | "Firma" | "Refacciones" | "General",
      "descripcion": "string",
      "resuelto": true | false
    }
  ],
  "resumenCliente": "string",
  "recomendacionesMantenimiento": [
    {
      "servicio": "string",
      "fechaSugerida": "string",
      "kilometrajeSugerido": "string",
      "motivo": "string"
    }
  ],
  "mensajeEntregaWhatsApp": "string",
  "garantiaAplicableTexto": "string",
  "responsableRevision": {
    "nombre": "string",
    "rol": "string",
    "fechaRevision": "string"
  },
  "avisoResponsabilidad": "Revisión de apoyo; la liberación del vehículo corresponde al responsable de calidad."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    return res.json({
      ...parsed,
      avisoResponsabilidad:
        'Revisión de apoyo; la liberación del vehículo corresponde al responsable de calidad.',
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
      generadoEn: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Revisión Final IA] Error llamando a Gemini, utilizando motor heurístico local:', error?.message || error);
    const localResult = generarRevisionFinalLocal({
      orden,
      cotizacion,
      vehiculo,
      cliente,
      refacciones,
      facturas,
      garantias,
      configuracion,
      responsable,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Motor heurístico local de validación previa a entrega (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});

// ========================================================
// ENDPOINT: POST /api/seguimiento-inteligente
// ========================================================
app.post('/api/seguimiento-inteligente', async (req, res) => {
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
  } = req.body;

  if (!cliente) {
    return res.status(400).json({ error: 'El parámetro cliente es requerido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[Seguimiento Inteligente IA] GEMINI_API_KEY no detectada. Usando motor heurístico local.');
    const localResult = generarSeguimientoInteligenteLocal({
      cliente,
      vehiculo,
      caso,
      tono,
      comentarioCliente,
      ordenes,
      cotizaciones,
      facturas,
      garantias,
      seguimientos,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Plantillas heurísticas locales de seguimiento inteligente',
    });
  }

  try {
    const ai = new GoogleGenAI();

    const ordenesCli = ordenes.filter((o: any) => o.clienteId === cliente.id);
    const cotizacionesCli = cotizaciones.filter((c: any) => c.clienteId === cliente.id);
    const facturasCli = facturas.filter((f: any) => f.clienteId === cliente.id);
    const garantiasCli = garantias.filter((g: any) => g.clienteId === cliente.id);
    const seguimientosCli = seguimientos.filter((s: any) => s.clienteId === cliente.id);

    const promptText = `
Eres un especialista en relaciones con clientes (CRM) y asesor de servicio en un taller mecánico profesional.
Tu tarea es generar un SEGUIMIENTO INTELIGENTE personalizado para un cliente, analizando exhaustivamente toda la información registrada en el taller.

DATOS DEL CLIENTE:
- Nombre: ${cliente.nombre}
- Teléfono: ${cliente.telefono || 'No registrado'}
- Correo: ${cliente.correo || 'No registrado'}

DATOS DEL VEHÍCULO:
${vehiculo ? JSON.stringify({
  marca: vehiculo.marca,
  modelo: vehiculo.modelo,
  año: vehiculo.año,
  placas: vehiculo.placas,
  kilometraje: vehiculo.kilometraje,
  proximoServicioFecha: vehiculo.proximoServicioFecha,
  proximoServicioKm: vehiculo.proximoServicioKm,
  recomendacionesMantenimiento: vehiculo.recomendacionesMantenimiento || [],
}, null, 2) : 'Sin vehículo específico seleccionado'}

HISTORIAL DE ÓRDENES DE TRABAJO (${ordenesCli.length}):
${JSON.stringify(
  ordenesCli.slice(0, 5).map((o: any) => ({
    folio: o.folio,
    fecha: o.creadoEn,
    servicio: o.servicio,
    estado: o.estado,
    trabajoTerminado: o.trabajoTerminado,
    entregado: o.entregado,
    fechaHoraEntrega: o.fechaHoraEntrega,
    observacionesMecanico: o.observacionesMecanico,
  })),
  null,
  2
)}

COTIZACIONES ASOCIADAS (${cotizacionesCli.length}):
${JSON.stringify(
  cotizacionesCli.slice(0, 3).map((c: any) => ({
    folio: c.folio,
    descripcion: c.descripcion,
    total: c.total,
    estado: c.estado,
  })),
  null,
  2
)}

FACTURAS Y PAGOS (${facturasCli.length}):
${JSON.stringify(
  facturasCli.slice(0, 3).map((f: any) => ({
    folio: f.folio,
    total: f.total,
    estado: f.estado,
    pago: f.pago,
  })),
  null,
  2
)}

PÓLIZAS DE GARANTÍA VIGENTES (${garantiasCli.length}):
${JSON.stringify(
  garantiasCli.map((g: any) => ({
    folio: g.folio,
    trabajoCubierto: g.trabajoCubierto,
    fechaFin: g.fechaFin || g.fechaVencimiento,
    estado: g.estado,
  })),
  null,
  2
)}

SEGUIMIENTOS PREVIOS (${seguimientosCli.length}):
${JSON.stringify(
  seguimientosCli.slice(0, 3).map((s: any) => ({
    motivo: s.motivoLabel || s.motivo,
    mensaje: s.mensaje,
    fecha: s.fecha,
    estado: s.estado,
  })),
  null,
  2
)}

COMENTARIOS O REPORTES REGISTRADOS POR EL CLIENTE:
"${comentarioCliente || 'Sin comentario previo registrado por el cliente'}"

CASO SOLICITADO: "${caso}" (si es "auto_detectar", analiza y determina cuál de los 7 casos aplica mejor)
TONO PREFERIDO: "${tono}" (debes generar versiones para los 3 tonos: cordial, formal, directo)

TALLER:
- Nombre: ${configuracion?.nombre || 'TUNNO'}
- Teléfono: ${configuracion?.telefono || '555-432-1000'}

LOS 7 CASOS PERMITIDOS SON:
1. "confirmar_funcionamiento": Confirmar que el vehículo funciona correctamente después del servicio.
2. "solicitar_valoracion": Solicitar una valoración de la atención.
3. "recordar_mantenimiento": Recordar un mantenimiento próximo (por kilometraje o fecha).
4. "seguimiento_cotizacion": Dar seguimiento a una cotización no autorizada.
5. "consultar_factura": Consultar una factura o pago pendiente.
6. "detectar_garantia": Detectar comentarios que podrían relacionarse con una garantía.
7. "recuperar_cliente": Recuperar clientes que llevan mucho tiempo sin regresar.

REGLAS OBLIGATORIAS:
1. La IA NO debe enviar mensajes automáticamente.
2. NO debe crear ni aprobar garantías sin confirmación; solo alerta y recomienda revisión física.
3. NO debe prometer reparaciones gratuitas, descuentos o devoluciones monetarias.
4. Utiliza únicamente la información registrada en el sistema.
5. Si el cliente menciona una posible falla, ruido, anomalía o inconformidad, DEBE recomendar indispensablemente una inspección física en las instalaciones del taller.
6. Incluye preguntas pertinentes y sugerencias de próxima acción según la posible respuesta del cliente.
7. avisoDemostracion debe ser exactamente: "Demostración local: el mensaje no se ha enviado".
8. Genera los 3 tonos: "cordial", "formal" y "directo" para el mensaje de WhatsApp.

Devuelve EXCLUSIVAMENTE una estructura JSON válida que se ajuste a este esquema:
{
  "casoDetectado": "confirmar_funcionamiento" | "solicitar_valoracion" | "recordar_mantenimiento" | "seguimiento_cotizacion" | "consultar_factura" | "detectar_garantia" | "recuperar_cliente",
  "casoTitulo": "string descriptivo del caso",
  "motivoRecomendado": "string con el motivo recomendado del contacto",
  "prioridad": "Baja" | "Media" | "Alta",
  "fechaSugerida": "YYYY-MM-DD",
  "horaSugerida": "10:00",
  "mensajeWhatsApp": "string con el mensaje en el tono solicitado",
  "mensajesPorTono": {
    "cordial": "string con mensaje cordial para WhatsApp",
    "formal": "string con mensaje formal para WhatsApp",
    "directo": "string con mensaje directo y conciso para WhatsApp"
  },
  "preguntasRecomendadas": ["string", "string", "string"],
  "proximaAccion": "string detallando la próxima acción según la posible respuesta",
  "alertaGarantia": {
    "requiereGarantia": boolean,
    "titulo": "string o null",
    "explicacion": "string o null",
    "trabajoRelacionado": "string o null",
    "recomiendaRevisionFisica": boolean
  },
  "resumenContexto": "string breve con el contexto utilizado",
  "avisoDemostracion": "Demostración local: el mensaje no se ha enviado"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsed = JSON.parse(responseText);

    return res.json({
      ...parsed,
      mensajeWhatsApp: parsed.mensajesPorTono?.[tono] || parsed.mensajeWhatsApp,
      avisoDemostracion: 'Demostración local: el mensaje no se ha enviado',
      esAnalisisLocal: false,
      modeloUtilizado: 'Gemini 2.5 Flash',
      generadoEn: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Seguimiento Inteligente IA] Error llamando a Gemini, utilizando motor heurístico local:', error?.message || error);
    const localResult = generarSeguimientoInteligenteLocal({
      cliente,
      vehiculo,
      caso,
      tono,
      comentarioCliente,
      ordenes,
      cotizaciones,
      facturas,
      garantias,
      seguimientos,
      configuracion,
    });
    return res.json({
      ...localResult,
      esAnalisisLocal: true,
      modeloUtilizado: 'Plantillas heurísticas locales de seguimiento inteligente (Respaldo automático)',
      errorDetalle: error?.message || 'Error en servicio de IA remota',
    });
  }
});



async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
