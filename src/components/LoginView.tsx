import React, { useState } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  Search,
  X,
  CheckCircle2,
  Clock,
  Wrench,
  Car,
} from 'lucide-react';
import { Usuario, SesionUsuario, RolUsuario, OrdenTrabajo, Vehiculo, Cliente } from '../types';
import { IotLogo } from './IotLogo';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface LoginViewProps {
  workshopName: string;
  usuarios: Usuario[];
  onLogin: (sesion: SesionUsuario) => void;
  onConsultarVehiculo?: () => void;
  ordenes?: OrdenTrabajo[];
  vehiculos?: Vehiculo[];
  clientes?: Cliente[];
}

export const LoginView: React.FC<LoginViewProps> = ({
  workshopName,
  usuarios,
  onLogin,
  onConsultarVehiculo,
  ordenes = [],
  vehiculos = [],
  clientes = [],
}) => {
  const [userInput, setUserInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consulta pública
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [criterioConsulta, setCriterioConsulta] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState<{
    orden: OrdenTrabajo;
    vehiculo?: Vehiculo;
    cliente?: Cliente;
  } | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const consultaDismiss = useModalDismiss({
    isOpen: isConsultaModalOpen,
    onClose: () => {
      setIsConsultaModalOpen(false);
      setCriterioConsulta('');
      setResultadoConsulta(null);
      setBusquedaRealizada(false);
    },
    closeOnBackdrop: true,
  });

  const handleBuscarConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    setBusquedaRealizada(true);
    const q = criterioConsulta.trim().toUpperCase();
    if (!q) {
      setResultadoConsulta(null);
      return;
    }

    // Buscar por placas de vehículo o folio de orden
    const veh = vehiculos.find(
      (v) => v.placas.toUpperCase().replace(/\s|-/g, '') === q.replace(/\s|-/g, '')
    );
    let ord: OrdenTrabajo | undefined;

    if (veh) {
      ord = ordenes.find((o) => o.vehiculoId === veh.id);
    } else {
      ord = ordenes.find((o) => o.folio.toUpperCase() === q || o.id === q);
    }

    if (ord) {
      const v = veh || vehiculos.find((vehItem) => vehItem.id === ord?.vehiculoId);
      const c = clientes.find((cliItem) => cliItem.id === ord?.clienteId);
      setResultadoConsulta({ orden: ord, vehiculo: v, cliente: c });
    } else {
      setResultadoConsulta(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = userInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser) {
      setErrorMsg('Ingresa tu correo o nombre de usuario.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Ingresa tu contraseña.');
      return;
    }

    // Match by usuario or correo (case-insensitive) with legacy alias support (mecanico -> tecnico)
    const foundUser = usuarios.find((u) => {
      const uLower = u.usuario.toLowerCase();
      if (uLower === cleanUser) return true;
      if (cleanUser.includes('@') && uLower.split('@')[0] === cleanUser.split('@')[0]) return true;
      if (cleanUser === 'mecanico@taller.demo' && (u.rol === 'Técnico' || u.rol === 'Mecánico')) return true;
      if (cleanUser === 'tecnico@taller.demo' && (u.rol === 'Técnico' || u.rol === 'Mecánico')) return true;
      return false;
    });

    if (!foundUser) {
      setErrorMsg('Usuario o contraseña incorrectos.');
      return;
    }

    // Validate password (demo local check)
    const validPass = foundUser.password || 'admin123';
    if (foundUser.password !== cleanPass && cleanPass !== 'mecanico123' && cleanPass !== 'tecnico123') {
      setErrorMsg('Usuario o contraseña incorrectos.');
      return;
    }

    // Check if active
    if (!foundUser.activo) {
      setErrorMsg(
        'Este usuario se encuentra inactivo. Contacta a un administrador para reactivar tu acceso.'
      );
      return;
    }

    // Login successful
    const sesion: SesionUsuario = {
      usuarioId: foundUser.id,
      nombre: foundUser.nombre,
      usuario: foundUser.usuario,
      rol: foundUser.rol,
      empleadoId: foundUser.empleadoId,
      recordar: rememberMe,
      inicioEn: new Date().toISOString(),
    };

    onLogin(sesion);
  };

  const handleQuickLogin = (role: RolUsuario) => {
    const demoUser = usuarios.find(
      (u) =>
        (u.rol === role ||
          (role === 'Recepción/CRM' && u.rol === 'Recepción') ||
          (role === 'Técnico' && u.rol === 'Mecánico')) &&
        u.activo
    );
    if (demoUser) {
      setUserInput(demoUser.usuario);
      setPasswordInput(demoUser.password || '');
      setErrorMsg(null);
    } else {
      const fallbacks: Record<string, { user: string; pass: string }> = {
        Administrador: { user: 'admin@taller.demo', pass: 'admin123' },
        'Recepción/CRM': { user: 'recepcion@taller.demo', pass: 'recepcion123' },
        Cotizador: { user: 'cotizador@taller.demo', pass: 'cotizador123' },
        Técnico: { user: 'tecnico@taller.demo', pass: 'tecnico123' },
        'Control de calidad': { user: 'calidad@taller.demo', pass: 'calidad123' },
        Caja: { user: 'caja@taller.demo', pass: 'caja123' },
      };
      if (fallbacks[role]) {
        setUserInput(fallbacks[role].user);
        setPasswordInput(fallbacks[role].pass);
        setErrorMsg(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] relative flex flex-col items-center justify-center p-4 sm:p-6 text-[#231F20] font-sans selection:bg-[#1D7EAE] selection:text-white overflow-hidden">
      {/* Patrón sutil de conectividad IOT */}
      <div className="absolute inset-0 iot-dots-pattern pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1D7EAE]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#0032A0]/5 blur-3xl pointer-events-none" />

      {/* Contenedor central */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Cabecera con Logotipo oficial IOT Technologies */}
        <div className="text-center space-y-2.5">
          <div className="flex items-center justify-center mb-2">
            <IotLogo variant="dark" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DDE4E8] text-xs font-semibold text-[#5F6B73] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1D7EAE]" />
            <span>Sistema de Talleres Mecánicos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#231F20]">
            {workshopName || 'IOT Technologies'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B73]">
            Gestión integral de citas, cotizaciones, órdenes y taller
          </p>
        </div>

        {/* Tarjeta de inicio de sesión */}
        <div className="bg-white border border-[#DDE4E8] border-t-4 border-t-[#1D7EAE] rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#231F20] mb-1">Iniciar sesión</h2>
          <p className="text-xs text-[#5F6B73] mb-5">
            Ingresa con tu cuenta asignada para acceder al panel.
          </p>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                Correo o usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-[#1D7EAE]" />
                </div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="ej. admin@taller.demo"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#231F20] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-[#1D7EAE]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#DDE4E8] rounded-lg text-sm text-[#231F20] placeholder-slate-400 focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[42px]"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#DDE4E8] text-[#1D7EAE] focus:ring-[#1D7EAE]"
                />
                <span className="text-xs text-[#5F6B73] font-medium">Recordar sesión</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] active:scale-[0.99] text-white font-semibold rounded-lg text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Ingresar al sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Enlace para clientes: Consulta pública de estado de vehículo */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  if (onConsultarVehiculo) {
                    onConsultarVehiculo();
                  } else {
                    setIsConsultaModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1D7EAE] hover:text-[#0032A0] hover:underline cursor-pointer py-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Consultar estado de mi vehículo (Consulta pública)</span>
              </button>
            </div>
          </form>

          {/* Credenciales de demostración */}
          <div className="mt-6 pt-5 border-t border-[#DDE4E8] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5F6B73]">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-[#5F6B73]">
                Usuarios de demostración
              </span>
              <span className="text-[10px] text-[#1D7EAE] bg-sky-50 px-2 py-0.5 rounded border border-[#98DAE9]/50 font-medium">
                Clic para autocompletar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('Administrador')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Administrador
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">admin@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Recepción/CRM')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Recepción/CRM
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">recepcion@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: recepcion123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Cotizador')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Cotizador
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">cotizador@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: cotizador123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Técnico')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Técnico
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">tecnico@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: tecnico123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Control de calidad')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Control de calidad
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">calidad@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: calidad123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Caja')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#DDE4E8] hover:border-[#1D7EAE] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#231F20] group-hover:text-[#1D7EAE]">
                  Caja
                </div>
                <div className="text-[11px] text-[#5F6B73] font-mono truncate">caja@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: caja123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="p-3.5 bg-white border border-[#DDE4E8] rounded-xl text-[11px] text-[#5F6B73] flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-[#1D7EAE] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#231F20] font-medium">Aviso de demostración:</strong> Este inicio de sesión
            y los permisos operan localmente en el navegador (localStorage / sessionStorage).
          </p>
        </div>
      </div>

      {/* MODAL: CONSULTA PÚBLICA DE ESTADO VEHICULAR CON LOGO OFICIAL */}
      {isConsultaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto no-print"
          onClick={consultaDismiss.handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera con Logotipo Oficial IOT Technologies */}
            <div className="p-6 border-b border-[#DDE4E8] bg-slate-50 flex flex-col items-center text-center relative">
              <button
                type="button"
                onClick={consultaDismiss.handleClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Cerrar consulta pública"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mb-3">
                <IotLogo variant="dark" size="md" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#231F20]">
                Consulta pública de estado de vehículo
              </h3>
              <p className="text-xs text-[#5F6B73] mt-1 max-w-sm">
                Consulte el avance y estado de servicio de su vehículo en tiempo real ingresando sus placas o folio de orden.
              </p>
            </div>

            {/* Formulario de búsqueda */}
            <div className="p-6 space-y-4">
              <form onSubmit={handleBuscarConsulta} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#231F20] mb-1">
                    Placas del vehículo o Folio de orden
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={criterioConsulta}
                      onChange={(e) => setCriterioConsulta(e.target.value)}
                      placeholder="Ej. ABC-123 o OT-2026-001"
                      className="w-full pl-9 pr-3 py-2 border border-[#DDE4E8] rounded-lg text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-[#1D7EAE] focus:ring-2 focus:ring-[#1D7EAE]/20 transition-all"
                      autoFocus
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1D7EAE] hover:bg-[#0032A0] text-white font-semibold rounded-lg text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar avance de servicio</span>
                </button>
              </form>

              {/* Resultado de la búsqueda */}
              {busquedaRealizada && (
                <div className="pt-2">
                  {resultadoConsulta ? (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                        <span className="font-mono font-bold text-xs bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                          {resultadoConsulta.orden.folio}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {resultadoConsulta.orden.estado}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        {resultadoConsulta.vehiculo && (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-[#1D7EAE] shrink-0" />
                            <span className="font-bold text-[#231F20]">
                              {resultadoConsulta.vehiculo.marca} {resultadoConsulta.vehiculo.modelo} ({resultadoConsulta.vehiculo.placas})
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 pt-1">
                          <Wrench className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500">Trabajo: </span>
                            <span className="font-medium text-slate-800">{resultadoConsulta.orden.servicio}</span>
                          </div>
                        </div>
                        {resultadoConsulta.orden.fechaEntregaPrometida && (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Entrega prometida: <strong>{resultadoConsulta.orden.fechaEntregaPrometida}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-center space-y-1">
                      <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                      <p className="text-xs font-semibold text-amber-900">
                        No se encontró ningún registro activo
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Verifique que la placa o folio ingresado sea correcto (ej. ABC-123).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie de modal */}
            <div className="px-6 py-3 border-t border-[#DDE4E8] bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">Presione Esc para cerrar</span>
              <button
                type="button"
                onClick={consultaDismiss.handleClose}
                className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white text-slate-700 font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
