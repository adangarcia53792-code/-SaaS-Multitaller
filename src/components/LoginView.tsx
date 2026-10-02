import React, { useState } from 'react';
import {
  Wrench,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Usuario, SesionUsuario, RolUsuario } from '../types';

interface LoginViewProps {
  workshopName: string;
  usuarios: Usuario[];
  onLogin: (sesion: SesionUsuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  workshopName,
  usuarios,
  onLogin,
}) => {
  const [userInput, setUserInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    // Match by usuario or correo (case-insensitive)
    const foundUser = usuarios.find(
      (u) =>
        u.usuario.toLowerCase() === cleanUser ||
        (cleanUser.includes('@') && u.usuario.toLowerCase().split('@')[0] === cleanUser.split('@')[0])
    );

    if (!foundUser) {
      setErrorMsg('Usuario o contraseña incorrectos.');
      return;
    }

    // Validate password (demo local check)
    if (foundUser.password !== cleanPass) {
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
    const demoUser = usuarios.find((u) => u.rol === role && u.activo);
    if (demoUser) {
      setUserInput(demoUser.usuario);
      setPasswordInput(demoUser.password || '');
      setErrorMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] relative flex flex-col items-center justify-center p-4 sm:p-6 text-[#202124] font-sans selection:bg-[#E9504F] selection:text-white overflow-hidden">
      {/* Abstract subtle decorative pattern */}
      <div className="absolute inset-0 merkatics-dots-pattern pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E9504F]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#E9504F]/5 blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/merkatics-logo-light.png"
              alt="Merkatics"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E4E7EC] text-xs font-semibold text-[#5F6368] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E9504F]" />
            <span>Sistema de Talleres Mecánicos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202124]">
            {workshopName || 'Taller Mecánico'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368]">
            Gestión integral de citas, cotizaciones, órdenes y taller
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E4E7EC] border-t-4 border-t-[#E9504F] rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#202124] mb-1">Iniciar sesión</h2>
          <p className="text-xs text-[#5F6368] mb-5">
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
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Correo o usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] placeholder-slate-400 focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
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
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E4E7EC] rounded-lg text-sm text-[#202124] placeholder-slate-400 focus:outline-none focus:border-[#E9504F] focus:ring-2 focus:ring-[#E9504F]/20 transition-all"
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
                  className="w-4 h-4 rounded border-[#E4E7EC] text-[#E9504F] focus:ring-[#E9504F]"
                />
                <span className="text-xs text-[#5F6368] font-medium">Recordar sesión</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 min-h-[42px] bg-[#E9504F] hover:bg-[#C93F43] active:scale-[0.99] text-white font-semibold rounded-lg text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Ingresar al sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credenciales de demostración discretas para agilizar la prueba */}
          <div className="mt-6 pt-5 border-t border-[#E4E7EC] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5F6368]">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-[#5F6368]">
                Usuarios de demostración
              </span>
              <span className="text-[10px] text-[#E9504F] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                Clic para autocompletar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('Administrador')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E4E7EC] hover:border-[#E9504F] text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#202124] group-hover:text-[#E9504F]">
                  Administrador
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono">admin@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Recepción')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E4E7EC] hover:border-blue-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#202124] group-hover:text-blue-600">
                  Recepción
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono">recepcion@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: recepcion123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Mecánico')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E4E7EC] hover:border-amber-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-[#202124] group-hover:text-amber-600">
                  Mecánico
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono">mecanico@taller.demo</div>
                <div className="text-[10px] text-slate-400">Clave: mecanico123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="p-3.5 bg-white border border-[#E4E7EC] rounded-xl text-[11px] text-[#5F6368] flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-[#E9504F] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#202124] font-medium">Aviso de demostración:</strong> Este inicio de sesión
            y los permisos operan localmente en el navegador (localStorage / sessionStorage).
          </p>
        </div>
      </div>
    </div>
  );
};
