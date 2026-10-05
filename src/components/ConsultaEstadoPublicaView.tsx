import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowLeft,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { OrdenTrabajo, Vehiculo, Cotizacion, ConfiguracionTaller } from '../types';
import { IotLogo } from './IotLogo';

interface ConsultaEstadoPublicaViewProps {
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
  cotizaciones: Cotizacion[];
  configuracion: ConfiguracionTaller;
  onVolverAlLogin: () => void;
}

const STORAGE_KEY_ATTEMPTS = 'iot_consulta_failed_attempts';
const STORAGE_KEY_BLOCKED = 'iot_consulta_blocked_until';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 60 * 1000; // 1 minute

export const ConsultaEstadoPublicaView: React.FC<ConsultaEstadoPublicaViewProps> = ({
  ordenes,
  vehiculos,
  cotizaciones,
  configuracion,
  onVolverAlLogin,
}) => {
  const [folioInput, setFolioInput] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [ordenEncontrada, setOrdenEncontrada] = useState<OrdenTrabajo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_ATTEMPTS);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [blockedUntil, setBlockedUntil] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_BLOCKED);
      if (saved) {
        const timestamp = parseInt(saved, 10);
        if (timestamp > Date.now()) return timestamp;
      }
    } catch {
      // fallback
    }
    return null;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [copiedDemo, setCopiedDemo] = useState(false);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!blockedUntil) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setBlockedUntil(null);
        setSecondsRemaining(0);
        setFailedAttempts(0);
        try {
          sessionStorage.removeItem(STORAGE_KEY_BLOCKED);
          sessionStorage.removeItem(STORAGE_KEY_ATTEMPTS);
        } catch {
          // ignore
        }
      } else {
        setSecondsRemaining(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  // Keep live order updated in case state changes in background
  const liveOrden = useMemo(() => {
    if (!ordenEncontrada) return null;
    return ordenes.find((o) => o.id === ordenEncontrada.id) || ordenEncontrada;
  }, [ordenes, ordenEncontrada]);

  // Linked vehicle
  const vehiculo = useMemo(() => {
    if (!liveOrden) return null;
    return vehiculos.find((v) => v.id === liveOrden.vehiculoId) || null;
  }, [liveOrden, vehiculos]);

  // Linked quote
  const cotizacion = useMemo(() => {
    if (!liveOrden || !liveOrden.cotizacionId) return null;
    return cotizaciones.find((c) => c.id === liveOrden.cotizacionId) || null;
  }, [liveOrden, cotizaciones]);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();

    if (blockedUntil && Date.now() < blockedUntil) {
      return;
    }

    const cleanFolio = folioInput.trim().toUpperCase();
    const cleanCodigo = codigoInput.trim().toUpperCase();

    if (!cleanFolio || !cleanCodigo) {
      setErrorMsg('Por favor ingresa tanto el folio como el código de consulta.');
      return;
    }

    // Lookup order by folio (case-insensitive) and codigoConsulta (case-insensitive)
    const matched = ordenes.find(
      (o) =>
        o.folio.trim().toUpperCase() === cleanFolio &&
        o.codigoConsulta &&
        o.codigoConsulta.trim().toUpperCase() === cleanCodigo
    );

    if (matched) {
      setErrorMsg(null);
      setOrdenEncontrada(matched);
      setFailedAttempts(0);
      try {
        sessionStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      } catch {
        // ignore
      }
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      try {
        sessionStorage.setItem(STORAGE_KEY_ATTEMPTS, String(nextAttempts));
      } catch {
        // ignore
      }

      if (nextAttempts >= MAX_ATTEMPTS) {
        const blockTimestamp = Date.now() + BLOCK_DURATION_MS;
        setBlockedUntil(blockTimestamp);
        try {
          sessionStorage.setItem(STORAGE_KEY_BLOCKED, String(blockTimestamp));
        } catch {
          // ignore
        }
        setErrorMsg(
          'Has alcanzado el límite de 5 intentos fallidos. Nuevas consultas bloqueadas temporalmente durante 1 minuto por seguridad.'
        );
      } else {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setErrorMsg(
          `Folio o código de consulta no encontrados. Verifica los datos e intenta nuevamente (te quedan ${remaining} ${
            remaining === 1 ? 'intento' : 'intentos'
          }).`
        );
      }
    }
  };

  const handleNuevaConsulta = () => {
    setOrdenEncontrada(null);
    setFolioInput('');
    setCodigoInput('');
    setErrorMsg(null);
  };

  // Status text translation as strictly required by prompt
  const getTextoEstadoPublico = (ord: OrdenTrabajo): string => {
    if (ord.entregado) return 'Vehículo entregado';
    switch (ord.estado) {
      case 'Por autorizar':
        return 'Esperando autorización';
      case 'Pendiente':
        return 'Servicio pendiente de iniciar';
      case 'En proceso':
        return 'Vehículo en servicio';
      case 'Terminado':
        return 'Trabajo terminado';
      default:
        return 'Vehículo en servicio';
    }
  };

  // Progress step mapping (1 to 7)
  // 1. Recibido, 2. Presupuesto, 3. Autorizado, 4. En servicio, 5. Revisión, 6. Listo para entrega, 7. Entregado
  const progresoStep = useMemo(() => {
    if (!liveOrden) return 1;
    if (liveOrden.entregado) return 7;
    if (liveOrden.revisionFinal && liveOrden.trabajoTerminado) return 6;
    if (liveOrden.trabajoTerminado) return 5;
    if (liveOrden.estado === 'En proceso') return 4;
    if (cotizacion && (cotizacion.estado === 'Aprobada' || cotizacion.autorizacion)) return 3;
    if (liveOrden.estado === 'Por autorizar' || (cotizacion && cotizacion.estado === 'Por autorizar')) return 2;
    return 1;
  }, [liveOrden, cotizacion]);

  const STEPS = [
    { numero: 1, label: 'Recibido' },
    { numero: 2, label: 'Presupuesto' },
    { numero: 3, label: 'Autorizado' },
    { numero: 4, label: 'En servicio' },
    { numero: 5, label: 'Revisión' },
    { numero: 6, label: 'Listo para entrega' },
    { numero: 7, label: 'Entregado' },
  ];

  // Helper for quick demo filling
  const sampleOrder = useMemo(() => {
    return ordenes.find((o) => o.codigoConsulta);
  }, [ordenes]);

  const handleFillDemo = () => {
    if (sampleOrder && sampleOrder.codigoConsulta) {
      setFolioInput(sampleOrder.folio);
      setCodigoInput(sampleOrder.codigoConsulta);
      setErrorMsg(null);
      setCopiedDemo(true);
      setTimeout(() => setCopiedDemo(false), 2000);
    }
  };

  const isBlocked = Boolean(blockedUntil && Date.now() < blockedUntil);

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#231F20]">
      <div className="w-full max-w-xl space-y-5">
        {/* Cabecera institucional con Logo oficial */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-1">
            <IotLogo variant="dark" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DDE4E8] text-xs font-semibold text-[#5F6B73] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1D7EAE]" />
            <span>Portal de seguimiento para clientes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#231F20]">
            {configuracion.nombre || 'IOT Technologies'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B73]">
            Consulta en tiempo real el avance y estatus de servicio de tu vehículo
          </p>
        </div>

        {/* Tarjeta central única */}
        <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-2xl p-6 sm:p-8 shadow-sm">
          {!liveOrden ? (
            /* Formulario de búsqueda */
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#231F20]">
                  Consultar estado de mi vehículo
                </h2>
                <p className="text-xs text-[#5F6B73] mt-1">
                  Ingresa el folio de tu orden de trabajo y el código de consulta que te entregamos en el taller.
                </p>
              </div>

              {/* Banner de bloqueo por exceso de intentos */}
              {isBlocked && (
                <div className="p-4 bg-orange-50 border border-[#FF661B]/30 rounded-xl text-xs flex items-start gap-3 animate-in fade-in">
                  <ShieldAlert className="w-5 h-5 text-[#FF661B] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#FF661B]">Bloqueo de seguridad temporal</h4>
                    <p className="text-[#231F20] mt-0.5 leading-relaxed">
                      Has alcanzado el límite de 5 intentos fallidos. Las consultas están bloqueadas durante{' '}
                      <strong className="text-[#FF661B] font-mono text-sm">{secondsRemaining}s</strong> por protección.
                    </p>
                  </div>
                </div>
              )}

              {/* Mensaje de error si hubo fallo */}
              {errorMsg && !isBlocked && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleConsultar} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Folio de la orden <span className="text-[#1D7EAE]">*</span>
                  </label>
                  <input
                    type="text"
                    value={folioInput}
                    disabled={isBlocked}
                    onChange={(e) => {
                      setFolioInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Ej. ORD-001"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all uppercase font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Número que aparece en tu nota de recepción o presupuesto.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                    Código de consulta <span className="text-[#1D7EAE]">*</span>
                  </label>
                  <input
                    type="text"
                    value={codigoInput}
                    disabled={isBlocked}
                    onChange={(e) => {
                      setCodigoInput(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Ej. 7F9K2A"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all font-mono uppercase tracking-wider disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Código alfanumérico confidencial entregado por el taller.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isBlocked}
                  className="w-full py-2.5 px-4 min-h-[44px] bg-[#1D7EAE] hover:bg-[#0032A0] active:scale-[0.99] text-white font-semibold rounded-lg text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  <span>{isBlocked ? `Bloqueado (${secondsRemaining}s)` : 'Consultar estado'}</span>
                </button>
              </form>

              {/* Botón de ayuda para la demostración */}
              {sampleOrder && sampleOrder.codigoConsulta && (
                <div className="pt-4 border-t border-[#DDE4E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-[#5F6B73]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1D7EAE]" />
                    <span>Datos de demostración disponibles:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#98DAE9]/20 hover:bg-[#98DAE9]/30 text-[#1D7EAE] font-semibold border border-[#98DAE9]/40 cursor-pointer transition-colors"
                  >
                    {copiedDemo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Llenar con {sampleOrder.folio} ({sampleOrder.codigoConsulta})</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Vista de resultados del estado del vehículo */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Encabezado del resultado */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#DDE4E8] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-[#1D7EAE] font-bold">
                      Orden de servicio
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-[#231F20] border border-[#DDE4E8]">
                      {liveOrden.folio}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#231F20] mt-1">
                    {getTextoEstadoPublico(liveOrden)}
                  </h2>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNuevaConsulta}
                    className="px-3 py-1.5 text-xs font-medium text-[#1D7EAE] hover:text-[#0032A0] hover:bg-sky-50 rounded-lg border border-[#DDE4E8] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Consultar otra orden</span>
                  </button>
                </div>
              </div>

              {/* LÍNEA DE PROGRESO DE 7 PASOS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6B73]">
                    Avance de tu servicio
                  </h3>
                  <span className="text-xs font-bold text-[#1D7EAE]">
                    Paso {progresoStep} de 7: {STEPS[progresoStep - 1]?.label}
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="relative pt-2 pb-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1D7EAE] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${(progresoStep / 7) * 100}%` }}
                    />
                  </div>

                  {/* Badges horizontales */}
                  <div className="grid grid-cols-7 gap-1 mt-3">
                    {STEPS.map((step) => {
                      const isCurrent = step.numero === progresoStep;
                      const isCompleted = step.numero < progresoStep;

                      return (
                        <div
                          key={step.numero}
                          className={`text-center flex flex-col items-center gap-1 ${
                            isCurrent
                              ? 'text-[#1D7EAE] font-bold'
                              : isCompleted
                              ? 'text-slate-600 font-medium'
                              : 'text-slate-300 font-normal'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                              isCurrent
                                ? 'bg-[#1D7EAE] text-white ring-4 ring-[#98DAE9]/40 font-bold scale-110'
                                : isCompleted
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? '✓' : step.numero}
                          </div>
                          <span className="text-[10px] sm:text-[11px] line-clamp-1 leading-tight hidden sm:block">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Datos públicos seguros del vehículo y servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F6F8FA] p-4 rounded-xl border border-[#DDE4E8]">
                <div>
                  <span className="text-[11px] font-semibold text-[#5F6B73] block uppercase tracking-wider">
                    Vehículo
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Car className="w-4 h-4 text-[#1D7EAE] shrink-0" />
                    <span className="text-sm font-bold text-[#231F20]">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año || ''}`.trim() : 'Vehículo registrado'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-[#5F6B73] block uppercase tracking-wider">
                    Estado actual
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        liveOrden.entregado
                          ? 'bg-emerald-100 text-emerald-800'
                          : liveOrden.estado === 'En proceso'
                          ? 'bg-blue-100 text-[#0032A0]'
                          : liveOrden.estado === 'Terminado'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{getTextoEstadoPublico(liveOrden)}</span>
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] font-semibold text-[#5F6B73] block uppercase tracking-wider">
                    Servicio solicitado
                  </span>
                  <p className="text-sm text-[#231F20] mt-1 font-medium leading-relaxed">
                    {liveOrden.servicio}
                  </p>
                </div>

                {liveOrden.fechaEntregaPrometida && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#5F6B73] block uppercase tracking-wider">
                      Fecha estimada de entrega
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-[#231F20]">
                      <Clock className="w-4 h-4 text-[#1D7EAE]" />
                      <span>
                        {new Date(liveOrden.fechaEntregaPrometida + 'T12:00:00').toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-semibold text-[#5F6B73] block uppercase tracking-wider">
                    Última actualización
                  </span>
                  <p className="text-xs text-[#5F6B73] mt-1 font-medium">
                    {liveOrden.actualizadoEn
                      ? new Date(liveOrden.actualizadoEn).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : liveOrden.fechaHoraEntrega ||
                        new Date(liveOrden.creadoEn).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                  </p>
                </div>
              </div>

              {/* Mensaje breve del taller si existe */}
              {liveOrden.mensajePublico && (
                <div className="p-4 rounded-xl bg-[#98DAE9]/15 border border-[#98DAE9]/40 space-y-1">
                  <span className="text-xs font-bold text-[#1D7EAE] uppercase tracking-wider block">
                    Mensaje del taller para ti:
                  </span>
                  <p className="text-sm text-[#231F20] italic font-medium leading-relaxed">
                    "{liveOrden.mensajePublico}"
                  </p>
                </div>
              )}

              {/* Confirmación si está entregado */}
              {liveOrden.entregado && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900">Vehículo entregado con conformidad</h4>
                    <p className="mt-0.5 leading-relaxed text-emerald-800">
                      El vehículo fue entregado satisfactoriamente al cliente. Muchas gracias por confiar en{' '}
                      <strong>{configuracion.nombre || 'IOT Technologies'}</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enlace de regreso al acceso del personal */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onVolverAlLogin}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1D7EAE] hover:text-[#0032A0] hover:underline cursor-pointer min-h-[38px] px-3 py-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al acceso del personal</span>
          </button>
        </div>

        {/* Disclaimer formal exigido por la instrucción */}
        <div className="p-3.5 bg-white border border-[#DDE4E8] rounded-xl text-[11px] text-[#5F6B73] flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-[#1D7EAE] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#231F20] font-semibold">Consulta de demostración.</strong> En producción
            requiere un servidor seguro con validación de identidad y protección de endpoints.
          </p>
        </div>
      </div>
    </div>
  );
};
