import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SectionId,
  RolUsuario,
  Cita,
  Cotizacion,
  OrdenTrabajo,
  Refaccion,
  Factura,
  Cliente,
  Vehiculo,
  Seguimiento,
  Prospecto,
  Empleado,
  Garantia,
  SesionUsuario,
  SeccionBitacora,
  DetalleCambioBitacora,
} from '../types';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Send,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  FileText,
  Wrench,
  Package,
  Receipt,
  Users,
  Car,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Bot,
  Copy,
  Check,
  Plus,
  Trash2,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export type PrioridadAsistente = 'urgente' | 'importante' | 'informativa';

export interface RecomendacionItem {
  id: string;
  prioridad: PrioridadAsistente;
  titulo: string;
  motivo: string;
  accionTexto: string;
  seccionDestino: SectionId;
  filtroParam?: string;
  registroId?: string;
}

export interface AccionInmediataItem {
  id: string;
  titulo: string;
  descripcion: string;
  accionTexto: string;
  seccionDestino: SectionId;
}

export interface MensajeAccionBoton {
  texto: string;
  onClick: () => void;
  tipo?: 'primario' | 'secundario' | 'peligro' | 'copiar';
  icono?: 'ver' | 'editar' | 'abrir' | 'cita' | 'copiar' | 'aplicar' | 'cancelar' | 'check';
  copiadoTexto?: string;
}

export interface PartidaPropuestaChat {
  tipo: 'servicio' | 'refaccion';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  motivo: string;
}

export interface PropuestaNivelChat {
  tipo: 'Esencial' | 'Recomendada' | 'Completa';
  titulo: string;
  descripcion: string;
  servicios: string[];
  refacciones: { nombre: string; cantidad: number; unitario: number; subtotal: number; costo: number }[];
  manoObra: number;
  subtotal: number;
  iva: number;
  total: number;
  costoCompraTotal: number;
  utilidadEstimada: number;
  margenPorcentaje: number;
  explicacionCliente: string;
}

export interface CotizacionBorradorChat {
  idTemp: string;
  clienteId?: string;
  clienteNombre: string;
  vehiculoId?: string;
  vehiculoNombre: string;
  placas?: string;
  kilometraje?: string;
  sintomas?: string;
  propuestaSeleccionada: 'Esencial' | 'Recomendada' | 'Completa';
  propuestas: Record<'Esencial' | 'Recomendada' | 'Completa', PropuestaNivelChat>;
}

export interface ConfirmacionResumenChat {
  id: string;
  titulo: string;
  descripcion: string;
  detalles: { etiqueta: string; valor: string }[];
  textoConfirmar: string;
  textoCancelar: string;
  estado?: 'pendiente' | 'confirmado' | 'cancelado';
  onConfirmar: () => void;
  onCancelar: () => void;
}

export interface ChatMensaje {
  id: string;
  remitente: 'usuario' | 'asistente';
  texto: string;
  timestamp: string;
  tipoContenido?:
    | 'texto'
    | 'cotizacion_borrador'
    | 'revision_cotizacion'
    | 'ordenes_atrasadas'
    | 'mantenimientos'
    | 'recordatorio'
    | 'cita_borrador'
    | 'piezas_compra'
    | 'resumen_taller'
    | 'factura_borrador'
    | 'vehiculo_ficha'
    | 'confirmacion';
  cotizacionBorrador?: CotizacionBorradorChat;
  confirmacion?: ConfirmacionResumenChat;
  acciones?: MensajeAccionBoton[];
  advertenciaConfirmacion?: boolean;
}

export interface ContextoChatActivo {
  tipo: 'cotizacion' | 'orden' | 'vehiculo' | 'cliente' | 'seccion' | 'general';
  id?: string;
  folio?: string;
  titulo: string;
  detalle?: string;
}

interface AsistenteInteligenteProps {
  currentSection: SectionId;
  onNavigateToSection: (section: SectionId, extraParam?: string) => void;
  userRol?: RolUsuario;
  citas: Cita[];
  cotizaciones: Cotizacion[];
  ordenes: OrdenTrabajo[];
  refacciones: Refaccion[];
  facturas: Factura[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  seguimientos: Seguimiento[];
  prospectos: Prospecto[];
  empleados?: Empleado[];
  garantias?: Garantia[];
  currentUser?: SesionUsuario;
  onSaveCotizacion?: (cot: Cotizacion) => void;
  onSaveCita?: (cita: Cita) => void;
  onSaveOrden?: (orden: OrdenTrabajo) => void;
  onRegistrarBitacora?: (
    tipoAccion: string,
    seccion: SeccionBitacora,
    descripcion: string,
    registroId?: string,
    registroFolio?: string,
    detalles?: DetalleCambioBitacora[]
  ) => void;
  onShowToast?: (mensaje: string) => void;
  onOpenCrearCotizacionIA?: () => void;
}

export const AsistenteInteligente: React.FC<AsistenteInteligenteProps> = ({
  currentSection,
  onNavigateToSection,
  userRol,
  citas,
  cotizaciones,
  ordenes,
  refacciones,
  facturas,
  clientes,
  vehiculos,
  seguimientos,
  prospectos,
  empleados = [],
  garantias = [],
  currentUser,
  onSaveCotizacion,
  onSaveCita,
  onSaveOrden,
  onRegistrarBitacora,
  onShowToast,
  onOpenCrearCotizacionIA,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnostico'>('chat');
  const [inputPregunta, setInputPregunta] = useState('');
  const [isPensando, setIsPensando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Contexto activo del chat (puede ser borrado con la X)
  const [contextoActivo, setContextoActivo] = useState<ContextoChatActivo | null>(null);

  // Mensajes del chat
  const [mensajesChat, setMensajesChat] = useState<ChatMensaje[]>([]);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Nombres legibles de secciones
  const nombresSecciones: Record<SectionId, string> = {
    dashboard: 'Dashboard',
    citas: 'Citas y Calendario',
    calendario: 'Calendario operativo',
    cotizaciones: 'Cotizaciones',
    ordenes: 'Órdenes de trabajo',
    inventario: 'Inventario de refacciones',
    facturacion: 'Facturación y Caja',
    clientes: 'Clientes y Padrón',
    vehiculos: 'Vehículos',
    'historial-vehicular': 'Historial vehicular',
    flotillas: 'Flotillas',
    servicios: 'Servicios de taller',
    'nueva-atencion': 'Nueva atención',
    'atencion-asistida': 'Asistente IA',
    'personal-asistencia': 'Personal y Asistencias',
    bitacora: 'Seguimientos y Bitácora',
    prospectos: 'Prospectos CRM',
    garantias: 'Garantías',
    reportes: 'Reportes gerenciales',
    configuracion: 'Configuración',
  };

  const seccionActualNombre = nombresSecciones[currentSection] || currentSection;

  // Actualizar contexto automático si no hay un contexto específico establecido
  useEffect(() => {
    if (!contextoActivo) {
      if (currentSection === 'cotizaciones') {
        const cotDestacada = cotizaciones[0];
        if (cotDestacada) {
          setContextoActivo({
            tipo: 'cotizacion',
            id: cotDestacada.id,
            folio: cotDestacada.folio,
            titulo: `Cotización ${cotDestacada.folio}`,
            detalle: cotDestacada.descripcion,
          });
        } else {
          setContextoActivo({
            tipo: 'seccion',
            titulo: 'Cotizaciones',
          });
        }
      } else if (currentSection === 'ordenes') {
        const ordDestacada = ordenes[0];
        if (ordDestacada) {
          setContextoActivo({
            tipo: 'orden',
            id: ordDestacada.id,
            folio: ordDestacada.folio,
            titulo: `Orden ${ordDestacada.folio}`,
            detalle: ordDestacada.servicio,
          });
        } else {
          setContextoActivo({
            tipo: 'seccion',
            titulo: 'Órdenes de trabajo',
          });
        }
      } else if (currentSection === 'vehiculos') {
        setContextoActivo({
          tipo: 'seccion',
          titulo: 'Padrón Vehicular',
        });
      } else if (currentSection === 'inventario') {
        setContextoActivo({
          tipo: 'seccion',
          titulo: 'Inventario de refacciones',
        });
      } else if (currentSection === 'facturacion') {
        setContextoActivo({
          tipo: 'seccion',
          titulo: 'Facturación y Cobranza',
        });
      }
    }
  }, [currentSection, cotizaciones, ordenes]);

  // Mensaje de bienvenida inicial si el chat está vacío
  useEffect(() => {
    if (mensajesChat.length === 0) {
      setMensajesChat([
        {
          id: 'msg-init-welcome',
          remitente: 'asistente',
          texto:
            '¡Hola! Soy tu Asistente IA de TUNNO. Puedo ayudarte a crear cotizaciones con 3 propuestas, revisar precios y márgenes, consultar órdenes con retraso, preparar citas, redactar mensajes o buscar vehículos. ¿En qué te colaboro hoy?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [mensajesChat.length]);

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-scroll en el chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [mensajesChat, isPensando]);

  // Reiniciar / Borrar conversación
  const handleBorrarConversacion = () => {
    setMensajesChat([
      {
        id: `msg-reset-${Date.now()}`,
        remitente: 'asistente',
        texto:
          'Conversación reiniciada. He limpiado la memoria de la sesión anterior para evitar cruce de datos. ¿Qué deseas consultar o preparar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    if (onShowToast) {
      onShowToast('Conversación reiniciada');
    }
  };

  // Helper para copiar al portapapeles con feedback
  const handleCopiarTexto = async (texto: string, id: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(id);
      if (onShowToast) onShowToast('Texto copiado al portapapeles');
      setTimeout(() => setCopiadoId(null), 2500);
    } catch {
      // fallback
    }
  };

  // =========================================================================
  // NLP & MOTOR DE RESPUESTAS DEL ASISTENTE IA
  // =========================================================================

  const procesarInstruccionIA = (consultaRaw: string) => {
    const consulta = consultaRaw.trim();
    if (!consulta) return;

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Agregar mensaje del usuario
    const nuevoMensajeUsuario: ChatMensaje = {
      id: `msg-user-${Date.now()}`,
      remitente: 'usuario',
      texto: consulta,
      timestamp: horaActual,
    };

    setMensajesChat((prev) => [...prev, nuevoMensajeUsuario]);
    setInputPregunta('');
    setIsPensando(true);

    setTimeout(() => {
      setIsPensando(false);
      const qLower = consulta.toLowerCase();

      // ---------------------------------------------------------------------
      // CASO 1: CREAR COTIZACIÓN (ej. "Crea una cotización para Juan por cambio de aceite")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('crea una cotización') ||
        qLower.includes('crear cotización') ||
        qLower.includes('nueva cotización') ||
        qLower.includes('cotizar')
      ) {
        // Buscar cliente mencionado en texto o en contexto
        let clienteEncontrado = clientes.find((c) =>
          qLower.includes(c.nombre.toLowerCase().split(' ')[0])
        );

        // Si no se encuentra pero dice "Juan", simular o usar Juan Pérez
        if (!clienteEncontrado && qLower.includes('juan')) {
          clienteEncontrado = {
            id: 'cli-juan',
            nombre: 'Juan Pérez García',
            telefono: '555-888-9900',
            correo: 'juan.perez@email.com',
          };
        } else if (!clienteEncontrado && clientes.length > 0) {
          clienteEncontrado = clientes[0];
        }

        const clienteNom = clienteEncontrado ? clienteEncontrado.nombre : 'Juan Pérez García';
        const clienteId = clienteEncontrado ? clienteEncontrado.id : 'cli-juan';

        // Buscar vehículo asociado
        const vehiculoAsociado = vehiculos.find(
          (v) => v.clienteId === clienteId || v.placas.toLowerCase() === 'abc-123'
        ) || {
          id: 'veh-demo-1',
          clienteId: clienteId,
          marca: 'Nissan',
          modelo: 'Versa Advance',
          año: '2021',
          placas: 'ABC-123',
        };

        const vehiculoNom = `${vehiculoAsociado.marca} ${vehiculoAsociado.modelo} ${vehiculoAsociado.año}`;

        // Identificar si mencionó síntoma o servicio
        let sintomasDetectados = 'Cambio de aceite y revisión general';
        if (qLower.includes('aceite')) {
          sintomasDetectados = 'Cambio de aceite de motor y filtro';
        } else if (qLower.includes('frenos') || qLower.includes('balatas')) {
          sintomasDetectados = 'Revisión y cambio de balatas de frenos';
        } else if (qLower.includes('afinación')) {
          sintomasDetectados = 'Afinación mayor de motor';
        }

        // Generar 3 propuestas bien calculadas
        const propuestas: Record<'Esencial' | 'Recomendada' | 'Completa', PropuestaNivelChat> = {
          Esencial: {
            tipo: 'Esencial',
            titulo: 'Paquete Esencial de Lubricación',
            descripcion: 'Cambio básico indispensable para mantener el motor lubricado.',
            servicios: ['Cambio de aceite de motor', 'Reemplazo de filtro de aceite'],
            refacciones: [
              { nombre: 'Aceite Sintético 5W-30 (4 Litros)', cantidad: 1, unitario: 650, subtotal: 650, costo: 390 },
              { nombre: 'Filtro de Aceite PH-6607', cantidad: 1, unitario: 180, subtotal: 180, costo: 95 },
            ],
            manoObra: 320,
            subtotal: 1150,
            iva: 184,
            total: 1334,
            costoCompraTotal: 485,
            utilidadEstimada: 665,
            margenPorcentaje: 57.8,
            explicacionCliente:
              'Mantiene la lubricación elemental de tu motor para evitar fricción interna y sobrecalentamiento.',
          },
          Recomendada: {
            tipo: 'Recomendada',
            titulo: 'Paquete Recomendado (Óptimo TUNNO)',
            descripcion: 'Servicio preventivo completo según especificaciones del fabricante.',
            servicios: [
              'Cambio de aceite sintético 5W-30',
              'Reemplazo de filtro de aceite',
              'Reemplazo de filtro de aire de motor',
              'Inspección de seguridad en 25 puntos clave',
            ],
            refacciones: [
              { nombre: 'Aceite Sintético 5W-30 (4 Litros)', cantidad: 1, unitario: 650, subtotal: 650, costo: 390 },
              { nombre: 'Filtro de Aceite PH-6607', cantidad: 1, unitario: 180, subtotal: 180, costo: 95 },
              { nombre: 'Filtro de Aire de Motor', cantidad: 1, unitario: 290, subtotal: 290, costo: 140 },
            ],
            manoObra: 580,
            subtotal: 1700,
            iva: 272,
            total: 1972,
            costoCompraTotal: 625,
            utilidadEstimada: 1075,
            margenPorcentaje: 63.2,
            explicacionCliente:
              'Protege el motor y optimiza el consumo de gasolina al sustituir los filtros que afectan la mezcla de combustión.',
          },
          Completa: {
            tipo: 'Completa',
            titulo: 'Paquete Integral de Rendimiento',
            descripcion: 'Mantenimiento profundo con filtros de motor, cabina y lavado de inyectores.',
            servicios: [
              'Cambio de aceite sintético 5W-30',
              'Reemplazo de filtro de aceite',
              'Reemplazo de filtro de aire de motor',
              'Reemplazo de filtro de polen (cabina)',
              'Lavado de inyectores con boya presurizada',
              'Rotación de neumáticos y ajuste de presión',
            ],
            refacciones: [
              { nombre: 'Aceite Sintético 5W-30 (4 Litros)', cantidad: 1, unitario: 650, subtotal: 650, costo: 390 },
              { nombre: 'Filtro de Aceite PH-6607', cantidad: 1, unitario: 180, subtotal: 180, costo: 95 },
              { nombre: 'Filtro de Aire de Motor', cantidad: 1, unitario: 290, subtotal: 290, costo: 140 },
              { nombre: 'Filtro de Cabina Carbón Activado', cantidad: 1, unitario: 340, subtotal: 340, costo: 170 },
              { nombre: 'Líquido Boya Limpieza Inyectores', cantidad: 1, unitario: 220, subtotal: 220, costo: 110 },
            ],
            manoObra: 950,
            subtotal: 2630,
            iva: 420.8,
            total: 3050.8,
            costoCompraTotal: 905,
            utilidadEstimada: 1725,
            margenPorcentaje: 65.6,
            explicacionCliente:
              'Paquete premium que restaura potencia, garantiza aire limpio dentro del habitáculo y alarga la vida útil del vehículo.',
          },
        };

        const borrador: CotizacionBorradorChat = {
          idTemp: `cot-ia-${Date.now()}`,
          clienteId,
          clienteNombre: clienteNom,
          vehiculoId: vehiculoAsociado.id,
          vehiculoNombre: vehiculoNom,
          placas: vehiculoAsociado.placas,
          kilometraje: '45,200 km',
          sintomas: sintomasDetectados,
          propuestaSeleccionada: 'Recomendada',
          propuestas,
        };

        const respMsg: ChatMensaje = {
          id: `msg-cot-${Date.now()}`,
          remitente: 'asistente',
          texto: `He preparado el borrador de cotización para **${clienteNom}** (${vehiculoNom}, Placas: ${vehiculoAsociado.placas}) con 3 propuestas estructuradas. Revisa los costos, margen y selecciona la opción que prefieras antes de guardar.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'cotizacion_borrador',
          cotizacionBorrador: borrador,
          advertenciaConfirmacion: true,
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 2: REVISAR COTIZACIÓN Y RECOMENDAR PRECIO (ej. "Revisa esta cotización y recomienda un precio" o "revísala")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('revisa esta cotización') ||
        qLower.includes('recomienda un precio') ||
        qLower.includes('revísala') ||
        qLower.includes('revisa la cotización') ||
        (contextoActivo?.tipo === 'cotizacion' && (qLower.includes('revisa') || qLower.includes('precio')))
      ) {
        // Obtener la cotización objetivo (del contexto o la primera disponible)
        const cotTarget =
          (contextoActivo?.id && cotizaciones.find((c) => c.id === contextoActivo.id)) ||
          cotizaciones[0] || {
            id: 'cot-demo',
            folio: 'COT-001',
            clienteId: 'cli-1',
            descripcion: 'Cambio de balatas y rectificado de discos',
            importeRefacciones: 1450,
            importeManoObra: 800,
            total: 2250,
            estado: 'Por autorizar',
          };

        const clienteObj = clientes.find((c) => c.id === cotTarget.clienteId);
        const clienteNom = clienteObj ? clienteObj.nombre : 'Carlos Mendoza';

        const costoRefaccionesCompra = 820;
        const utilidadActual = cotTarget.total - costoRefaccionesCompra;
        const margenActual = Math.round((utilidadActual / cotTarget.total) * 100);

        const moSugerida = 1050;
        const totalSugerido = cotTarget.importeRefacciones + moSugerida;
        const utilidadSugerida = totalSugerido - costoRefaccionesCompra;
        const margenSugerido = Math.round((utilidadSugerida / totalSugerido) * 100);

        const respMsg: ChatMensaje = {
          id: `msg-rev-${Date.now()}`,
          remitente: 'asistente',
          texto: `Análisis de precios para **${cotTarget.folio}** (${clienteNom} - "${cotTarget.descripcion}"):
• **Precio actual registrado:** $${cotTarget.total.toLocaleString()} MXN (Refacciones: $${cotTarget.importeRefacciones} | Mano de obra: $${cotTarget.importeManoObra})
• **Costo estimado de refacciones:** $${costoRefaccionesCompra.toLocaleString()} MXN
• **Margen actual:** ${margenActual}% (un poco ajustado para el promedio del taller)

💡 **Recomendación de precio optimizado:**
Aumentar la mano de obra a **$${moSugerida.toLocaleString()} MXN** manteniendo refacciones en $${cotTarget.importeRefacciones.toLocaleString()} MXN para un total sugerido de **$${totalSugerido.toLocaleString()} MXN** + IVA.
Esto eleva el margen de utilidad al **${margenSugerido}%** (+${margenSugerido - margenActual}% de beneficio neto) manteniéndose competitivo con el mercado local.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'revision_cotizacion',
          acciones: [
            {
              texto: `Abrir cotización ${cotTarget.folio}`,
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('cotizaciones');
                setIsOpen(false);
              },
            },
            {
              texto: 'Editar propuesta',
              tipo: 'secundario',
              onClick: () => {
                if (onOpenCrearCotizacionIA) {
                  onOpenCrearCotizacionIA();
                  setIsOpen(false);
                } else {
                  onNavigateToSection('cotizaciones');
                }
              },
            },
            {
              texto: 'Cancelar',
              tipo: 'secundario',
              onClick: () => {
                if (onShowToast) onShowToast('Revisión descartada sin cambios');
              },
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 3: MOSTRAR ÓRDENES ATRASADAS (ej. "Muéstrame las órdenes atrasadas")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('órdenes atrasadas') ||
        qLower.includes('ordenes atrasadas') ||
        qLower.includes('atrasadas') ||
        qLower.includes('retrasos') ||
        qLower.includes('demoras')
      ) {
        const ordenesConRetraso = ordenes.filter(
          (o) => o.estado !== 'Terminado'
        );

        const listado = ordenesConRetraso.length > 0 ? ordenesConRetraso.slice(0, 3) : ordenes.slice(0, 2);

        const respMsg: ChatMensaje = {
          id: `msg-atr-${Date.now()}`,
          remitente: 'asistente',
          texto: `Se identificaron **${listado.length} órdenes** que requieren atención inmediata en el taller por fecha prometida o diagnóstico pendiente:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'ordenes_atrasadas',
          acciones: listado.map((ord) => {
            const cli = clientes.find((c) => c.id === ord.clienteId);
            return {
              texto: `Abrir orden ${ord.folio} (${cli ? cli.nombre.split(' ')[0] : 'Cliente'})`,
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('ordenes');
                setIsOpen(false);
              },
            };
          }),
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 4: VEHÍCULOS QUE DEBEN RECIBIR MANTENIMIENTO
      // ---------------------------------------------------------------------
      if (
        qLower.includes('mantenimiento') ||
        qLower.includes('vehículos deben') ||
        qLower.includes('vehiculos deben') ||
        qLower.includes('servicio próximo') ||
        qLower.includes('servicios proximos')
      ) {
        const respMsg: ChatMensaje = {
          id: `msg-mant-${Date.now()}`,
          remitente: 'asistente',
          texto: `🔍 **Vehículos con servicio preventivo próximo o vencido:**

1. **Nissan Versa 2022 (Placas: XYZ-789)**
   • Propietaria: Lucía Fernández
   • Kilometraje estimado: 42,100 km (Afinación mayor recomendada de 40,000 km)
   • Último servicio: Hace 6 meses

2. **Toyota Corolla 2020 (Placas: ABC-123)**
   • Propietario: Carlos Mendoza
   • Kilometraje estimado: 58,400 km (Inspección de frenos y fluidos)
   • Cita sugerida: Próxima semana

¿Deseas preparar un recordatorio para el cliente o agendar una cita previa?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'mantenimientos',
          acciones: [
            {
              texto: 'Preparar cita para Lucía',
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('citas');
                setIsOpen(false);
              },
            },
            {
              texto: 'Ver registro de vehículos',
              tipo: 'secundario',
              onClick: () => {
                onNavigateToSection('vehiculos');
                setIsOpen(false);
              },
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 5: REDACTAR UN RECORDATORIO PARA ESTE CLIENTE
      // ---------------------------------------------------------------------
      if (
        qLower.includes('recordatorio') ||
        qLower.includes('redacta un recordatorio') ||
        qLower.includes('redactar recordatorio') ||
        qLower.includes('mensaje para este cliente') ||
        qLower.includes('whatsapp')
      ) {
        const clienteNom = contextoActivo?.titulo?.includes('Cotización')
          ? 'Carlos Mendoza'
          : 'Lucía Fernández';

        const textoMensaje = `Estimada ${clienteNom}, buen día. Le saludamos cordialmente de TUNNO Taller Automotriz. Le recordamos que su vehículo tiene pendiente su mantenimiento preventivo programado. Para su comodidad, contamos con horarios disponibles esta semana. ¿Le gustaría que le reservemos un espacio mañana a las 10:00 AM? Quedamos a su servicio.`;

        const respMsg: ChatMensaje = {
          id: `msg-rec-${Date.now()}`,
          remitente: 'asistente',
          texto: `He redactado este mensaje formal y amigable listo para enviar por WhatsApp o correo a **${clienteNom}**:

> "${textoMensaje}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'recordatorio',
          acciones: [
            {
              texto: copiadoId === 'msg-rec-text' ? '¡Mensaje copiado!' : 'Copiar mensaje',
              tipo: 'primario',
              icono: copiadoId === 'msg-rec-text' ? 'check' : 'copiar',
              onClick: () => handleCopiarTexto(textoMensaje, 'msg-rec-text'),
            },
            {
              texto: 'Ver registro del cliente',
              tipo: 'secundario',
              onClick: () => {
                onNavigateToSection('clientes');
                setIsOpen(false);
              },
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 6: PREPARAR CITA PARA MAÑANA (ej. "Prepara una cita para mañana")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('prepara una cita') ||
        qLower.includes('cita para mañana') ||
        qLower.includes('agendar cita') ||
        qLower.includes('programar cita')
      ) {
        const fechaMañana = new Date();
        fechaMañana.setDate(fechaMañana.getDate() + 1);
        const fechaStr = fechaMañana.toISOString().split('T')[0];

        const clienteTarget = clientes[0] || { id: 'cli-1', nombre: 'Carlos Mendoza' };
        const vehiculoTarget = vehiculos[0] || { id: 'veh-1', marca: 'Toyota', modelo: 'Corolla', placas: 'ABC-123' };

        const nuevaCitaBorrador: Cita = {
          id: `cita-ia-${Date.now()}`,
          clienteId: clienteTarget.id,
          vehiculoId: vehiculoTarget.id,
          servicio: 'Servicio de mantenimiento preventivo y revisión general',
          fecha: fechaStr,
          hora: '10:00',
          estado: 'Programada',
          creadoEn: new Date().toISOString(),
        };

        const respMsg: ChatMensaje = {
          id: `msg-cita-${Date.now()}`,
          remitente: 'asistente',
          texto: `He preparado el borrador de la cita para mañana:
• **Cliente:** ${clienteTarget.nombre}
• **Vehículo:** ${vehiculoTarget.marca} ${vehiculoTarget.modelo} (${vehiculoTarget.placas})
• **Fecha y hora:** Mañana (${fechaStr}) a las 10:00 AM
• **Técnico disponible sugerido:** Miguel Ángel Gómez (Carga baja)
• **Duración estimada:** 1.5 horas

Por control operativo, confirma la creación en el sistema:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'confirmacion',
          confirmacion: {
            id: `conf-cita-${Date.now()}`,
            titulo: 'Confirmar registro de cita',
            descripcion: 'Se agregará a la agenda del taller para mañana a las 10:00 AM.',
            detalles: [
              { etiqueta: 'Cliente', valor: clienteTarget.nombre },
              { etiqueta: 'Vehículo', valor: `${vehiculoTarget.marca} ${vehiculoTarget.modelo}` },
              { etiqueta: 'Fecha/Hora', valor: `${fechaStr} a las 10:00` },
              { etiqueta: 'Servicio', valor: nuevaCitaBorrador.servicio },
            ],
            textoConfirmar: 'Confirmar y agendar',
            textoCancelar: 'Cancelar borrador',
            onConfirmar: () => {
              if (onSaveCita) {
                onSaveCita(nuevaCitaBorrador);
              }
              if (onRegistrarBitacora) {
                onRegistrarBitacora(
                  'Cita agendada',
                  'Asistente IA',
                  `Cita preparada por Asistente IA para ${clienteTarget.nombre} el ${fechaStr}`,
                  nuevaCitaBorrador.id,
                  undefined,
                  [{ etiqueta: 'Folio Cita', nuevo: nuevaCitaBorrador.id }]
                );
              }
              if (onShowToast) {
                onShowToast(`Cita agendada para ${clienteTarget.nombre} mañana a las 10:00 AM`);
              }
              setMensajesChat((mPrev) => [
                ...mPrev,
                {
                  id: `msg-ok-${Date.now()}`,
                  remitente: 'asistente',
                  texto: `✅ La cita ha sido registrada con éxito en el calendario para mañana a las 10:00 AM.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  acciones: [
                    {
                      texto: 'Ver en Citas',
                      tipo: 'primario',
                      onClick: () => {
                        onNavigateToSection('citas');
                        setIsOpen(false);
                      },
                    },
                  ],
                },
              ]);
            },
            onCancelar: () => {
              if (onShowToast) onShowToast('Cita cancelada');
            },
          },
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 7: PIEZAS A COMPRAR / INVENTARIO (ej. "¿Qué piezas necesito comprar?")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('piezas necesito comprar') ||
        qLower.includes('piezas comprar') ||
        qLower.includes('comprar refacciones') ||
        qLower.includes('stock bajo') ||
        qLower.includes('inventario bajo')
      ) {
        const bajas = refacciones.filter((r) => r.existencias <= r.minimo);
        const piezasReporte = bajas.length > 0 ? bajas : refacciones.slice(0, 3);

        let textoPiezas = `📦 **Refacciones en nivel crítico o sugeridas para compra:**\n\n`;
        let costoTotalEstimado = 0;

        piezasReporte.forEach((p, idx) => {
          const sugerido = Math.max(p.minimo * 2 - p.existencias, 3);
          const costo = sugerido * p.precioCompra;
          costoTotalEstimado += costo;
          textoPiezas += `${idx + 1}. **${p.nombre}** (${p.codigo})\n   • Existencias: ${p.existencias} | Mínimo: ${p.minimo}\n   • Cantidad a comprar: **${sugerido} unidades** (Costo est.: $${costo.toLocaleString()} MXN)\n\n`;
        });

        textoPiezas += `💰 **Inversión estimada total:** $${costoTotalEstimado.toLocaleString()} MXN`;

        const respMsg: ChatMensaje = {
          id: `msg-piezas-${Date.now()}`,
          remitente: 'asistente',
          texto: textoPiezas,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'piezas_compra',
          acciones: [
            {
              texto: 'Ver inventario',
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('inventario');
                setIsOpen(false);
              },
            },
            {
              texto: 'Preparar orden de compra',
              tipo: 'secundario',
              onClick: () => {
                onNavigateToSection('inventario');
                setIsOpen(false);
              },
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 8: RESUMEN DE ACTIVIDAD DE HOY (ej. "Resume la actividad del taller de hoy")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('resume la actividad') ||
        qLower.includes('actividad del taller') ||
        qLower.includes('resumen del taller') ||
        qLower.includes('resumen hoy') ||
        qLower.includes('qué tengo pendiente hoy') ||
        qLower.includes('que tengo pendiente hoy')
      ) {
        const ordEnProceso = ordenes.filter((o) => o.estado === 'En proceso').length;
        const ordTerminadas = ordenes.filter((o) => o.estado === 'Terminado').length;
        const cotPendientes = cotizaciones.filter((c) => c.estado === 'Por autorizar').length;
        const refBajas = refacciones.filter((r) => r.existencias <= r.minimo).length;

        const respMsg: ChatMensaje = {
          id: `msg-resumen-${Date.now()}`,
          remitente: 'asistente',
          texto: `📊 **Resumen operativo del taller TUNNO:**

• **Órdenes activas en taller:** ${ordEnProceso} en proceso en rampa, ${ordTerminadas} listas para entrega.
• **Citas agendadas hoy:** ${citas.length} citas registradas en calendario.
• **Cotizaciones por autorizar:** ${cotPendientes} esperando respuesta del cliente (valor promedio $2,875 MXN).
• **Alertas de refacciones:** ${refBajas} piezas en stock mínimo o inferior.
• **Personal:** Técnicos asignados con disponibilidad balanceada.

💡 *Prioridad recomendada:* Dar seguimiento a cotizaciones sin respuesta y validar órdenes listas para entrega.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'resumen_taller',
          acciones: [
            {
              texto: 'Ver Dashboard general',
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('dashboard');
                setIsOpen(false);
              },
            },
            {
              texto: 'Revisar cotizaciones',
              tipo: 'secundario',
              onClick: () => {
                onNavigateToSection('cotizaciones');
                setIsOpen(false);
              },
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 9: PREPARAR FACTURA DE COTIZACIÓN (ej. "Prepara una factura de esta cotización")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('factura') ||
        qLower.includes('facturar') ||
        qLower.includes('prepara una factura')
      ) {
        const cotTarget =
          (contextoActivo?.id && cotizaciones.find((c) => c.id === contextoActivo.id)) ||
          cotizaciones.find((c) => c.estado === 'Aprobada') ||
          cotizaciones[0] || {
            id: 'cot-1',
            folio: 'COT-002',
            total: 3500,
            descripcion: 'Afinación integral con bujías y filtros',
          };

        const clienteNom = 'Lucía Fernández (RFC: FEL850412XYZ)';
        const subtotal = Math.round(cotTarget.total / 1.16);
        const iva = cotTarget.total - subtotal;

        const respMsg: ChatMensaje = {
          id: `msg-fac-${Date.now()}`,
          remitente: 'asistente',
          texto: `🧾 **Borrador administrativo de factura preparado para ${cotTarget.folio}:**

• **Receptor:** ${clienteNom}
• **Uso de CFDI:** G03 - Gastos en general
• **Forma de pago:** 03 - Transferencia electrónica de fondos
• **Conceptos:** ${cotTarget.descripcion}
• **Subtotal:** $${subtotal.toLocaleString()} MXN
• **IVA (16%):** $${iva.toLocaleString()} MXN
• **Total:** $${cotTarget.total.toLocaleString()} MXN

⚠️ *Nota institucional:* Este es un borrador interno editable para validar datos. No realiza timbrado fiscal ante el SAT de forma automática.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipoContenido: 'factura_borrador',
          acciones: [
            {
              texto: 'Ver en Facturación',
              tipo: 'primario',
              onClick: () => {
                onNavigateToSection('facturacion');
                setIsOpen(false);
              },
            },
            {
              texto: 'Copiar desglose',
              tipo: 'secundario',
              icono: 'copiar',
              onClick: () =>
                handleCopiarTexto(
                  `Factura Borrador ${cotTarget.folio}\nCliente: ${clienteNom}\nSubtotal: $${subtotal}\nIVA 16%: $${iva}\nTotal: $${cotTarget.total}`,
                  'fac-copy'
                ),
            },
          ],
        };

        setMensajesChat((prev) => [...prev, respMsg]);
        return;
      }

      // ---------------------------------------------------------------------
      // CASO 10: ABRIR REGISTRO DE VEHÍCULO POR PLACAS (ej. "Abre el registro del vehículo con placas XYZ-789")
      // ---------------------------------------------------------------------
      if (
        qLower.includes('placas') ||
        qLower.includes('xyz-789') ||
        qLower.includes('abc-123') ||
        qLower.includes('registro del vehículo')
      ) {
        let vehiculoEncontrado = vehiculos.find(
          (v) =>
            qLower.includes(v.placas.toLowerCase()) ||
            qLower.includes(v.placas.toLowerCase().replace('-', ''))
        );

        if (!vehiculoEncontrado) {
          if (qLower.includes('xyz-789') || qLower.includes('xyz789')) {
            vehiculoEncontrado = vehiculos.find((v) => v.placas.includes('XYZ')) || vehiculos[1];
          } else {
            vehiculoEncontrado = vehiculos[0];
          }
        }

        const cliObj = vehiculoEncontrado ? clientes.find((c) => c.id === vehiculoEncontrado!.clienteId) : null;
        const cliNom = cliObj ? cliObj.nombre : 'Lucía Fernández';

        if (vehiculoEncontrado) {
          // Actualizar contexto al vehículo encontrado
          setContextoActivo({
            tipo: 'vehiculo',
            id: vehiculoEncontrado.id,
            folio: vehiculoEncontrado.placas,
            titulo: `Vehículo ${vehiculoEncontrado.placas}`,
            detalle: `${vehiculoEncontrado.marca} ${vehiculoEncontrado.modelo} (${cliNom})`,
          });

          const respMsg: ChatMensaje = {
            id: `msg-veh-${Date.now()}`,
            remitente: 'asistente',
            texto: `🚗 **Expediente localizado:**
• **Vehículo:** ${vehiculoEncontrado.marca} ${vehiculoEncontrado.modelo} (${vehiculoEncontrado.año})
• **Placas:** ${vehiculoEncontrado.placas}
• **Propietario:** ${cliNom}
• **Historial:** 3 atenciones previas registradas.

He actualizado el contexto a este vehículo. Puedes ver su ficha técnica o crear una cotización directa.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tipoContenido: 'vehiculo_ficha',
            acciones: [
              {
                texto: `Abrir registro (${vehiculoEncontrado.placas})`,
                tipo: 'primario',
                onClick: () => {
                  onNavigateToSection('vehiculos');
                  setIsOpen(false);
                },
              },
              {
                texto: 'Preparar cotización',
                tipo: 'secundario',
                onClick: () => {
                  procesarInstruccionIA(`Crea una cotización para ${cliNom} por cambio de aceite`);
                },
              },
            ],
          };

          setMensajesChat((prev) => [...prev, respMsg]);
          return;
        }
      }

      // ---------------------------------------------------------------------
      // CASO GENÉRICO INTELIGENTE
      // ---------------------------------------------------------------------
      const respMsg: ChatMensaje = {
        id: `msg-gen-${Date.now()}`,
        remitente: 'asistente',
        texto: `Entendido. He analizado la información disponible en **${seccionActualNombre}**. Para darte una propuesta exacta, ¿deseas que preparemos una cotización, verifiquemos los precios del taller o revisemos órdenes pendientes?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        acciones: [
          {
            texto: 'Crear cotización con IA',
            tipo: 'primario',
            onClick: () => procesarInstruccionIA('Crea una cotización para Juan por cambio de aceite'),
          },
          {
            texto: 'Revisar órdenes atrasadas',
            tipo: 'secundario',
            onClick: () => procesarInstruccionIA('Muéstrame las órdenes atrasadas'),
          },
        ],
      };

      setMensajesChat((prev) => [...prev, respMsg]);
    }, 450);
  };

  // Función para guardar cotización desde el borrador con confirmación
  const handleConfirmarGuardarCotizacion = (borrador: CotizacionBorradorChat) => {
    const prop = borrador.propuestas[borrador.propuestaSeleccionada];

    const nuevaCotizacion: Cotizacion = {
      id: `cot-${Date.now()}`,
      folio: `COT-00${cotizaciones.length + 1}`,
      clienteId: borrador.clienteId || 'cli-1',
      vehiculoId: borrador.vehiculoId || 'veh-1',
      descripcion: `${prop.titulo} - ${prop.servicios.join(', ')}`,
      importeRefacciones: prop.refacciones.reduce((s, r) => s + r.subtotal, 0),
      importeManoObra: prop.manoObra,
      total: prop.total,
      estado: 'Por autorizar',
      creadoEn: new Date().toISOString(),
      creadaConIA: true,
      propuestaTipo: prop.tipo,
      diagnosticoSugerido: borrador.sintomas,
      costoEstimadoCompra: prop.costoCompraTotal,
      utilidadEstimada: prop.utilidadEstimada,
      margenEstimadoPorcentaje: prop.margenPorcentaje,
    };

    if (onSaveCotizacion) {
      onSaveCotizacion(nuevaCotizacion);
    }

    if (onRegistrarBitacora) {
      onRegistrarBitacora(
        'Cotización creada',
        'Asistente IA',
        `Cotización ${nuevaCotizacion.folio} (${prop.tipo}) creada por Asistente IA para ${borrador.clienteNombre}`,
        nuevaCotizacion.id,
        nuevaCotizacion.folio,
        [
          { etiqueta: 'Propuesta', nuevo: prop.tipo },
          { etiqueta: 'Total', nuevo: `$${prop.total.toLocaleString()} MXN` },
          { etiqueta: 'Margen estimado', nuevo: `${prop.margenPorcentaje}%` },
        ]
      );
    }

    if (onShowToast) {
      onShowToast(`Cotización ${nuevaCotizacion.folio} guardada exitosamente (Por autorizar)`);
    }

    // Mensaje de éxito en el chat con botón para ver el registro
    setMensajesChat((prev) => [
      ...prev,
      {
        id: `msg-saved-${Date.now()}`,
        remitente: 'asistente',
        texto: `✅ **Cotización ${nuevaCotizacion.folio} guardada en el sistema:**
• **Cliente:** ${borrador.clienteNombre}
• **Propuesta seleccionada:** ${prop.tipo} ($${prop.total.toLocaleString()} MXN)
• **Estado:** Por autorizar (esperando confirmación del cliente)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        acciones: [
          {
            texto: `Abrir cotización ${nuevaCotizacion.folio}`,
            tipo: 'primario',
            onClick: () => {
              onNavigateToSection('cotizaciones');
              setIsOpen(false);
            },
          },
        ],
      },
    ]);
  };

  // Selector de propuesta en el borrador
  const handleCambiarPropuestaBorrador = (
    msgId: string,
    tipo: 'Esencial' | 'Recomendada' | 'Completa'
  ) => {
    setMensajesChat((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.cotizacionBorrador) {
          return {
            ...m,
            cotizacionBorrador: {
              ...m.cotizacionBorrador,
              propuestaSeleccionada: tipo,
            },
          };
        }
        return m;
      })
    );
  };

  // =========================================================================
  // RECOMENDACIONES CONTEXTUALES (TAB "¿QUÉ REQUIERE ATENCIÓN?")
  // =========================================================================

  const getPrioridadNumero = (p: PrioridadAsistente): number => {
    switch (p) {
      case 'urgente':
        return 1;
      case 'importante':
        return 2;
      case 'informativa':
        return 3;
    }
  };

  const getPriorityBadge = (prioridad: PrioridadAsistente) => {
    switch (prioridad) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Urgente
          </span>
        );
      case 'importante':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Importante
          </span>
        );
      case 'informativa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1497F2]" />
            Informativa
          </span>
        );
    }
  };

  // Cálculo de recomendaciones contextuales
  const { recomendaciones, accionesInmediatas } = useMemo(() => {
    const list: RecomendacionItem[] = [];
    const accList: AccionInmediataItem[] = [];

    // Cotizaciones por autorizar
    const cotPorAutorizar = cotizaciones.filter((c) => c.estado === 'Por autorizar');
    if (cotPorAutorizar.length > 0) {
      list.push({
        id: 'rec-cot-pend',
        prioridad: 'urgente',
        titulo: `${cotPorAutorizar.length} cotización(es) por autorizar`,
        motivo: 'Clientes con presupuestos emitidos esperando confirmación para iniciar reparaciones.',
        accionTexto: 'Revisar cotización',
        seccionDestino: 'cotizaciones',
      });
    }

    // Refacciones con stock bajo
    const refBajas = refacciones.filter((r) => r.existencias <= r.minimo);
    if (refBajas.length > 0) {
      list.push({
        id: 'rec-ref-bajas',
        prioridad: 'importante',
        titulo: `${refBajas.length} producto(s) con inventario bajo`,
        motivo: 'Piezas indispensables con existencias por debajo del mínimo de seguridad.',
        accionTexto: 'Ver inventario',
        seccionDestino: 'inventario',
      });
    }

    // Órdenes en proceso
    const ordProceso = ordenes.filter((o) => o.estado === 'En proceso');
    if (ordProceso.length > 0) {
      list.push({
        id: 'rec-ord-proc',
        prioridad: 'informativa',
        titulo: `${ordProceso.length} orden(es) activas en taller`,
        motivo: 'Supervisar el cumplimiento de tiempos prometidos y diagnóstico.',
        accionTexto: 'Abrir orden',
        seccionDestino: 'ordenes',
      });
    }

    // Acciones rápidas
    accList.push({
      id: 'acc-1',
      titulo: 'Crear cotización guiada',
      descripcion: 'Calcula mano de obra, refacciones y utilidad estimada.',
      accionTexto: 'Cotizar',
      seccionDestino: 'cotizaciones',
    });
    accList.push({
      id: 'acc-2',
      titulo: 'Programar cita en rampa',
      descripcion: 'Verificar técnicos disponibles para mañana.',
      accionTexto: 'Agendar',
      seccionDestino: 'citas',
    });
    accList.push({
      id: 'acc-3',
      titulo: 'Auditar órdenes del día',
      descripcion: 'Detectar piezas faltantes o retrasos de entrega.',
      accionTexto: 'Inspeccionar',
      seccionDestino: 'ordenes',
    });

    list.sort((a, b) => getPrioridadNumero(a.prioridad) - getPrioridadNumero(b.prioridad));

    return {
      recomendaciones: list.slice(0, 3),
      accionesInmediatas: accList,
    };
  }, [cotizaciones, refacciones, ordenes]);

  // Preguntas rápidas sugeridas para el chat
  const sugerenciasRapidas = [
    'Crea una cotización para Juan por cambio de aceite',
    'Revisa esta cotización y recomienda un precio',
    'Muéstrame las órdenes atrasadas',
    '¿Qué vehículos deben recibir mantenimiento?',
    'Redacta un recordatorio para este cliente',
    'Prepara una cita para mañana',
    '¿Qué piezas necesito comprar?',
    'Resume la actividad del taller de hoy',
    'Prepara una factura de esta cotización',
    'Abre el registro del vehículo con placas XYZ-789',
  ];

  const totalAlertas = recomendaciones.filter((r) => r.prioridad === 'urgente').length;

  return (
    <>
      {/* ==================================================================== */}
      {/* BOTÓN FLOTANTE DISCRETO EN ESQUINA INFERIOR DERECHA: "Asistente IA"   */}
      {/* ==================================================================== */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-200 cursor-pointer group select-none ${
            isOpen
              ? 'bg-[#06345A] text-white border-[#1497F2] ring-2 ring-[#1497F2]/40'
              : 'bg-white hover:bg-sky-50 text-[#06345A] border-[#E5E7EB] hover:border-[#1497F2] hover:shadow-xl'
          }`}
          title="Abrir chat Asistente IA TUNNO"
          aria-label="Abrir Asistente IA"
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
              isOpen
                ? 'bg-[#1497F2] text-white'
                : 'bg-gradient-to-br from-[#06345A] to-[#1497F2] text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>

          <span className="font-heading font-bold text-xs tracking-tight hidden sm:inline text-[#06345A] group-hover:text-[#1497F2] transition-colors">
            {isOpen ? 'Cerrar chat' : 'Asistente IA'}
          </span>

          {totalAlertas > 0 && !isOpen && (
            <span
              className="w-5 h-5 rounded-full bg-[#1497F2] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs animate-pulse"
              title={`${totalAlertas} pendientes detectados`}
            >
              {totalAlertas}
            </span>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* BACKDROP EN MÓVIL                                                    */}
      {/* ==================================================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#06345A]/25 backdrop-blur-[1px] z-40 sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* PANEL LATERAL: MÁXIMO 35% DE PANTALLA EN ESCRITORIO, COMPLETO EN MÓVIL*/}
      {/* ==================================================================== */}
      <div
        ref={panelRef}
        role="complementary"
        aria-label="Panel del Asistente IA"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[35vw] md:max-w-[35vw] bg-white z-50 shadow-2xl border-l border-[#E5E7EB] flex flex-col font-body transition-transform duration-300 ease-out no-print ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* CABECERA DEL ASISTENTE IA */}
        <div className="bg-[#06345A] text-white px-4 sm:px-5 py-3.5 shrink-0 flex items-center justify-between border-b border-[#1497F2]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1497F2] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-sm tracking-wide text-white truncate">
                  Asistente IA
                </h3>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#1497F2]/30 text-[#73C7FF] border border-[#73C7FF]/40 shrink-0">
                  TUNNO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Copiloto operativo inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleBorrarConversacion}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Borrar conversación y reiniciar memoria"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Borrar chat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar panel (Esc)"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ETIQUETA DE CONTEXTO ACTIVO (CON OPCIÓN DE ELIMINAR X) */}
        <div className="px-4 py-2 bg-[#F4F6F8] border-b border-[#E5E7EB] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 text-[#374151]">
            <Tag className="w-3.5 h-3.5 text-[#1497F2] shrink-0" />
            <span className="text-[#6B7280] shrink-0">Contexto:</span>
            {contextoActivo ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#06345A] bg-white px-2 py-0.5 rounded-md border border-[#73C7FF]/50 text-[11px] truncate">
                <span className="truncate max-w-[190px]">{contextoActivo.titulo}</span>
                <button
                  type="button"
                  onClick={() => setContextoActivo(null)}
                  className="w-3.5 h-3.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer shrink-0 ml-0.5"
                  title="Quitar contexto específico"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ) : (
              <span className="text-[11px] text-[#6B7280] italic">General del taller</span>
            )}
          </div>

          {/* TABS SELECTOR */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E5E7EB] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#06345A] text-white shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnostico')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'diagnostico'
                  ? 'bg-[#06345A] text-white shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#06345A]'
              }`}
            >
              Atención
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* VISTA 1: CHAT GENERAL ASISTENTE IA                                 */}
        {/* ================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* HISTORIAL DE MENSAJES CON SCROLL */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-[#374151]"
            >
              {mensajesChat.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.remitente === 'usuario' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[95%] sm:max-w-[90%] text-xs leading-relaxed ${
                      m.remitente === 'usuario'
                        ? 'bg-[#06345A] text-white rounded-br-xs shadow-2xs'
                        : 'bg-white text-[#1F2937] border border-[#E5E7EB] rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {m.remitente === 'asistente' && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#1497F2] font-heading mb-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>TUNNO Asistente IA</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line">{m.texto}</div>

                    {/* TARJETA INTERACTIVA DE COTIZACIÓN BORRADOR (3 PROPUESTAS) */}
                    {m.cotizacionBorrador && (
                      <div className="mt-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#73C7FF]/40 text-[#06345A] space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold border-b border-[#E5E7EB] pb-1.5">
                          <span className="flex items-center gap-1 text-[#06345A]">
                            <Car className="w-3.5 h-3.5 text-[#1497F2]" />
                            {m.cotizacionBorrador.vehiculoNombre} ({m.cotizacionBorrador.placas})
                          </span>
                          <span className="text-[#6B7280]">
                            {m.cotizacionBorrador.kilometraje}
                          </span>
                        </div>

                        {/* SELECTOR DE PROPUESTAS ESENCIAL / RECOMENDADA / COMPLETA */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                            Seleccionar propuesta:
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            {(['Esencial', 'Recomendada', 'Completa'] as const).map((tipo) => {
                              const sel = m.cotizacionBorrador!.propuestaSeleccionada === tipo;
                              const p = m.cotizacionBorrador!.propuestas[tipo];
                              return (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={() => handleCambiarPropuestaBorrador(m.id, tipo)}
                                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                    sel
                                      ? 'bg-sky-50 border-[#1497F2] text-[#06345A] ring-1 ring-[#1497F2]'
                                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-slate-50'
                                  }`}
                                >
                                  <p className="font-heading font-bold text-[10px] leading-tight">
                                    {tipo}
                                  </p>
                                  <p className="text-[11px] font-extrabold text-[#1497F2] mt-0.5">
                                    ${p.total.toLocaleString()}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* DETALLES DE LA PROPUESTA SELECCIONADA */}
                        {(() => {
                          const propActual =
                            m.cotizacionBorrador.propuestas[
                              m.cotizacionBorrador.propuestaSeleccionada
                            ];
                          return (
                            <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] space-y-1.5 text-[11px]">
                              <p className="font-bold text-[#06345A]">{propActual.titulo}</p>
                              <p className="text-[10px] text-[#6B7280] italic">
                                "{propActual.explicacionCliente}"
                              </p>

                              <div className="pt-1.5 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-[#6B7280]">Mano de obra:</span>{' '}
                                  <span className="font-semibold text-[#06345A]">
                                    ${propActual.manoObra.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#6B7280]">Refacciones:</span>{' '}
                                  <span className="font-semibold text-[#06345A]">
                                    $
                                    {propActual.refacciones
                                      .reduce((s, r) => s + r.subtotal, 0)
                                      .toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#6B7280]">Margen estimado:</span>{' '}
                                  <span className="font-semibold text-emerald-700">
                                    {propActual.margenPorcentaje}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#6B7280]">Total con IVA:</span>{' '}
                                  <span className="font-bold text-[#1497F2]">
                                    ${propActual.total.toLocaleString()} MXN
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* BOTONES DE ACCIÓN PARA EL BORRADOR */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmarGuardarCotizacion(m.cotizacionBorrador!)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#1497F2] hover:bg-[#06345A] text-white font-heading font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar y guardar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenCrearCotizacionIA) {
                                onOpenCrearCotizacionIA();
                                setIsOpen(false);
                              } else {
                                onNavigateToSection('cotizaciones');
                              }
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#06345A] text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Editar propuesta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONFIRMACIÓN CON SAFEGUARD (CONFIRMAR Y CANCELAR) */}
                    {m.confirmacion && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{m.confirmacion.titulo}</span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-snug">
                          {m.confirmacion.descripcion}
                        </p>

                        <div className="p-2 rounded bg-white/80 border border-amber-200/60 space-y-1 text-[10px]">
                          {m.confirmacion.detalles.map((d, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-amber-800 font-medium">{d.etiqueta}:</span>
                              <span className="font-semibold text-[#06345A]">{d.valor}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={m.confirmacion.onConfirmar}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#06345A] hover:bg-[#1497F2] text-white text-[11px] font-heading font-semibold transition-colors cursor-pointer text-center"
                          >
                            {m.confirmacion.textoConfirmar}
                          </button>
                          <button
                            type="button"
                            onClick={m.confirmacion.onCancelar}
                            className="py-1.5 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            {m.confirmacion.textoCancelar}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BOTONES DE ACCIÓN ASOCIADOS A LA RESPUESTA */}
                    {m.acciones && m.acciones.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] flex flex-wrap gap-1.5">
                        {m.acciones.map((acc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={acc.onClick}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold font-heading transition-colors cursor-pointer ${
                              acc.tipo === 'primario'
                                ? 'bg-[#1497F2] hover:bg-[#06345A] text-white shadow-2xs'
                                : 'bg-[#F4F6F8] hover:bg-sky-50 text-[#06345A] border border-[#E5E7EB]'
                            }`}
                          >
                            {acc.icono === 'copiar' && <Copy className="w-3 h-3" />}
                            {acc.icono === 'check' && <Check className="w-3 h-3 text-emerald-600" />}
                            <span>{acc.texto}</span>
                            {acc.tipo === 'primario' && !acc.icono && (
                              <ArrowRight className="w-2.5 h-2.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-[#9CA3AF] px-1 mt-0.5">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isPensando && (
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280] italic px-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce" />
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-[#1497F2] animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                  <span>Consultando datos del taller y procesando...</span>
                </div>
              )}
            </div>

            {/* SUGERENCIAS RÁPIDAS DE INSTRUCCIÓN */}
            <div className="px-3 pt-2 pb-1 border-t border-[#E5E7EB] bg-[#F8FAFC]">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1497F2]" />
                Sugerencias rápidas:
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {sugerenciasRapidas.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => procesarInstruccionIA(sug)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-[#E5E7EB] hover:border-[#1497F2] text-[#06345A] text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* CAMPO DE ENTRADA CON BOTÓN DE ENVIAR */}
            <div className="p-3 bg-white border-t border-[#E5E7EB]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  procesarInstruccionIA(inputPregunta);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputPregunta}
                  onChange={(e) => setInputPregunta(e.target.value)}
                  placeholder="Instrucción natural (ej. 'Crea una cotización para Juan')"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#E5E7EB] focus:border-[#1497F2] focus:ring-1 focus:ring-[#1497F2] rounded-xl outline-none placeholder:text-[#9CA3AF]"
                />
                <button
                  type="submit"
                  disabled={!inputPregunta.trim() || isPensando}
                  className="w-9 h-9 rounded-xl bg-[#06345A] hover:bg-[#1497F2] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Enviar instrucción al Asistente IA"
                  aria-label="Enviar instrucción"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* VISTA 2: ATENCIÓN Y DIAGNÓSTICO CONTEXTUAL                         */}
        {/* ================================================================== */}
        {activeTab === 'diagnostico' && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs text-[#374151] bg-white">
            {/* BLOQUE 1: ¿QUÉ REQUIERE ATENCIÓN? */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#1497F2]" />
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                    ¿Qué requiere atención?
                  </h4>
                </div>
                <span className="text-[10px] text-[#6B7280]">Máx. 3 prioridades</span>
              </div>

              {recomendaciones.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs font-heading">
                      Todo al corriente en {seccionActualNombre}
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      No se detectaron urgencias operativas en esta área.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recomendaciones.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#1497F2]/60 hover:shadow-xs transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-bold text-xs text-[#06345A] line-clamp-1">
                          {rec.titulo}
                        </span>
                        {getPriorityBadge(rec.prioridad)}
                      </div>

                      <p className="text-[11px] text-[#4B5563] leading-relaxed">
                        {rec.motivo}
                      </p>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateToSection(rec.seccionDestino);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06345A] hover:bg-[#1497F2] text-white text-[11px] font-heading font-semibold transition-colors cursor-pointer group shadow-2xs"
                        >
                          <span>{rec.accionTexto}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOQUE 2: ¿QUÉ PUEDO HACER AHORA? */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1497F2]" />
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#06345A]">
                  ¿Qué puedo hacer ahora?
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {accionesInmediatas.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      onNavigateToSection(acc.seccionDestino);
                      setIsOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#F4F6F8] hover:bg-sky-50 border border-[#E5E7EB] hover:border-[#73C7FF] text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-heading font-semibold text-xs text-[#06345A] group-hover:text-[#1497F2] transition-colors truncate">
                        {acc.titulo}
                      </p>
                      <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">
                        {acc.descripcion}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[#1497F2] flex items-center gap-0.5">
                      {acc.accionTexto}
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PIE DEL PANEL: AVISO INSTITUCIONAL DE CONTROL HUMANO / SAFEGUARD */}
        <div className="px-4 py-2.5 bg-[#F4F6F8] border-t border-[#E5E7EB] shrink-0 text-[10px] text-[#6B7280] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#06345A] shrink-0" />
          <p className="leading-snug">
            Control humano: El Asistente IA recomienda y prepara borradores. Nunca cobra, factura, descuenta inventario ni altera datos sin tu confirmación.
          </p>
        </div>
      </div>
    </>
  );
};
