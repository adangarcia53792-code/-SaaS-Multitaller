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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-[#0d5c58] selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0d5c58] text-white shadow-lg shadow-[#0d5c58]/30 mb-1">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {workshopName || 'Taller Mecánico'}
          </h1>
          <p className="text-sm text-slate-400">
            Sistema de gestión operativa del taller
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xs">
          <h2 className="text-lg font-bold text-white mb-1">Iniciar sesión</h2>
          <p className="text-xs text-slate-400 mb-5">
            Ingresa con tu cuenta asignada para acceder al panel.
          </p>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  placeholder="ej. admin@taller.com"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d5c58] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
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
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#0d5c58] focus:ring-[#0d5c58] focus:ring-offset-slate-800"
                />
                <span className="text-xs text-slate-300 font-medium">Recordar sesión</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0d5c58] hover:bg-[#0a4845] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md shadow-[#0d5c58]/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Ingresar al sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credenciales de demostración discretas para agilizar la prueba */}
          <div className="mt-6 pt-5 border-t border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                Usuarios de demostración
              </span>
              <span className="text-[10px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                Clic para autocompletar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('Administrador')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-teal-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-300">
                  Administrador
                </div>
                <div className="text-[11px] text-slate-400 font-mono">admin@taller.com</div>
                <div className="text-[10px] text-slate-500">Clave: admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Recepción')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-teal-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-300">
                  Recepción
                </div>
                <div className="text-[11px] text-slate-400 font-mono">recepcion@taller.com</div>
                <div className="text-[10px] text-slate-500">Clave: recep123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Mecánico')}
                className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700 hover:border-teal-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-300">
                  Mecánico
                </div>
                <div className="text-[11px] text-slate-400 font-mono">mecanico@taller.com</div>
                <div className="text-[10px] text-slate-500">Clave: meca123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300 font-medium">Aviso de demostración:</strong> Este inicio de sesión
            y los permisos operan únicamente de forma local en el navegador (localStorage / sessionStorage).
            No ofrece seguridad real y, para un entorno de producción, se requerirá un servidor con
            autenticación segura.
          </p>
        </div>
      </div>
    </div>
  );
};
