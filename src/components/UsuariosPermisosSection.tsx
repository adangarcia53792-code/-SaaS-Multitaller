import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Pencil,
  KeyRound,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from 'lucide-react';
import { Usuario, RolUsuario, Empleado, SesionUsuario, ROLES_SISTEMA } from '../types';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface UsuariosPermisosSectionProps {
  usuarios: Usuario[];
  empleados: Empleado[];
  currentUser: SesionUsuario;
  onSaveUsuario: (usuario: Usuario) => void;
  onUpdateUsuario: (usuario: Usuario) => void;
  onToggleActivoUsuario: (usuarioId: string) => { success: boolean; message?: string };
  onChangePasswordUsuario: (usuarioId: string, newPassword: string) => void;
}

export const UsuariosPermisosSection: React.FC<UsuariosPermisosSectionProps> = ({
  usuarios,
  empleados,
  currentUser,
  onSaveUsuario,
  onUpdateUsuario,
  onToggleActivoUsuario,
  onChangePasswordUsuario,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [passwordTargetUsuario, setPasswordTargetUsuario] = useState<Usuario | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<RolUsuario>('Recepción/CRM');
  const [formEmpleadoId, setFormEmpleadoId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Password modal form
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isUserFormDirty = useMemo(() => {
    if (!isAddModalOpen) return false;
    if (editingUsuario) {
      return (
        formNombre !== editingUsuario.nombre ||
        formUsuario !== editingUsuario.usuario ||
        formRol !== editingUsuario.rol ||
        formEmpleadoId !== (editingUsuario.empleadoId || '') ||
        Boolean(formPassword.trim())
      );
    }
    return Boolean(formNombre.trim() || formUsuario.trim() || formPassword.trim() || formEmpleadoId);
  }, [isAddModalOpen, editingUsuario, formNombre, formUsuario, formRol, formEmpleadoId, formPassword]);

  const userFormDismiss = useModalDismiss({
    isOpen: isAddModalOpen,
    onClose: () => {
      setIsAddModalOpen(false);
      setEditingUsuario(null);
      setFormErrors({});
    },
    isDirty: isUserFormDirty,
    dirtyMessage: '¿Deseas descartar los cambios del usuario sin guardar?',
    closeOnBackdrop: true,
  });

  const isPasswordFormDirty = useMemo(() => {
    if (!passwordTargetUsuario) return false;
    return Boolean(newPasswordInput.trim());
  }, [passwordTargetUsuario, newPasswordInput]);

  const passwordModalDismiss = useModalDismiss({
    isOpen: Boolean(passwordTargetUsuario),
    onClose: () => {
      setPasswordTargetUsuario(null);
      setNewPasswordInput('');
      setPasswordError(null);
    },
    isDirty: isPasswordFormDirty,
    dirtyMessage: '¿Deseas descartar el cambio de contraseña?',
    closeOnBackdrop: true,
  });

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingUsuario(null);
    setFormNombre('');
    setFormUsuario('');
    setFormPassword('');
    setFormRol('Recepción/CRM');
    setFormEmpleadoId('');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: Usuario) => {
    setEditingUsuario(u);
    setFormNombre(u.nombre);
    setFormUsuario(u.usuario);
    setFormRol(u.rol);
    setFormEmpleadoId(u.empleadoId || '');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenChangePassword = (u: Usuario) => {
    setPasswordTargetUsuario(u);
    setNewPasswordInput('');
    setPasswordError(null);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formNombre.trim()) {
      errors.nombre = 'El nombre completo es obligatorio.';
    }

    if (!formUsuario.trim()) {
      errors.usuario = 'El correo o nombre de usuario es obligatorio.';
    } else {
      // Check duplicate username
      const cleanUser = formUsuario.trim().toLowerCase();
      const duplicate = usuarios.find(
        (u) =>
          u.usuario.toLowerCase() === cleanUser &&
          (!editingUsuario || u.id !== editingUsuario.id)
      );
      if (duplicate) {
        errors.usuario = 'Este nombre de usuario o correo ya está registrado.';
      }
    }

    if (!editingUsuario && !formPassword.trim()) {
      errors.password = 'La contraseña inicial es obligatoria.';
    }

    // If editing, check if changing role of the last active admin
    if (editingUsuario && editingUsuario.rol === 'Administrador' && formRol !== 'Administrador') {
      const activeAdmins = usuarios.filter((u) => u.rol === 'Administrador' && u.activo);
      if (activeAdmins.length <= 1) {
        errors.rol = 'No puedes cambiar el rol al único Administrador activo del sistema.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingUsuario) {
      const updated: Usuario = {
        ...editingUsuario,
        nombre: formNombre.trim(),
        usuario: formUsuario.trim(),
        rol: formRol,
        empleadoId: formRol === 'Mecánico' && formEmpleadoId ? formEmpleadoId : undefined,
      };
      onUpdateUsuario(updated);
      showFeedback('success', `Usuario "${updated.nombre}" actualizado exitosamente.`);
    } else {
      const newUser: Usuario = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nombre: formNombre.trim(),
        usuario: formUsuario.trim(),
        password: formPassword.trim(),
        rol: formRol,
        activo: true,
        empleadoId: formRol === 'Mecánico' && formEmpleadoId ? formEmpleadoId : undefined,
        creadoEn: new Date().toISOString(),
      };
      onSaveUsuario(newUser);
      showFeedback('success', `Usuario "${newUser.nombre}" agregado exitosamente.`);
    }

    setIsAddModalOpen(false);
  };

  // Submit Password Change
  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUsuario) return;

    if (!newPasswordInput.trim()) {
      setPasswordError('Ingresa la nueva contraseña.');
      return;
    }

    onChangePasswordUsuario(passwordTargetUsuario.id, newPasswordInput.trim());
    showFeedback(
      'success',
      `Contraseña actualizada para el usuario "${passwordTargetUsuario.nombre}".`
    );
    setPasswordTargetUsuario(null);
  };

  // Toggle Activo
  const handleToggle = (u: Usuario) => {
    const res = onToggleActivoUsuario(u.id);
    if (!res.success) {
      showFeedback('error', res.message || 'No fue posible cambiar el estado del usuario.');
    } else {
      showFeedback(
        'success',
        `El usuario "${u.nombre}" ahora está ${!u.activo ? 'activo' : 'inactivo'}.`
      );
    }
  };

  const getRolBadge = (rol: RolUsuario) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Recepción':
      case 'Recepción/CRM':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Cotizador':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Mecánico':
      case 'Técnico':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Control de calidad':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Caja':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#DDE4E8] overflow-hidden shadow-xs">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#98DAE9]/10 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#231F20] text-base flex items-center gap-2">
              <span>Usuarios y permisos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[#5F6B73] font-semibold border border-[#DDE4E8]">
                {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
              </span>
            </h3>
            <p className="text-xs text-[#5F6B73]">
              Administración de cuentas locales, roles y restricciones de acceso.
            </p>
          </div>
        </div>

        <div className="p-1 rounded-md text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-6 border-t border-slate-100 space-y-5">
          {/* Important Security Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-sm">
                Demostración local — Información de seguridad
              </p>
              <p className="text-amber-800 leading-relaxed">
                Esta etapa funciona únicamente como <strong>demostración local</strong> dentro del navegador.
                El almacenamiento en localStorage o sessionStorage <strong>no ofrece seguridad real</strong>.
                Para un entorno de producción se requerirá un servidor con autenticación segura, tokens firmados
                y contraseñas debidamente cifradas.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Action header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Cuentas registradas</h4>
              <p className="text-xs text-slate-500">
                Gestiona roles y vinculaciones con el personal del taller.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar usuario</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#DDE4E8] rounded-xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F8FA] border-b border-[#DDE4E8] text-[#5F6B73] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Usuario / Nombre</th>
                  <th className="py-3 px-4">Correo / Login</th>
                  <th className="py-3 px-4">Rol asignado</th>
                  <th className="py-3 px-4">Empleado vinculado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => {
                  const linkedEmpleado = u.empleadoId
                    ? empleados.find((e) => e.id === u.empleadoId)
                    : null;
                  const isCurrent = currentUser.usuarioId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nombre */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#231F20] flex items-center gap-1.5">
                          <span>{u.nombre}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-[#1D7EAE] font-bold border border-rose-200">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {u.usuario}
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border text-[11px] ${getRolBadge(
                            u.rol
                          )}`}
                        >
                          {u.rol}
                        </span>
                      </td>

                      {/* Empleado vinculado */}
                      <td className="py-3 px-4 text-slate-600">
                        {u.rol === 'Mecánico' || u.rol === 'Técnico' ? (
                          linkedEmpleado ? (
                            <span className="font-medium text-slate-800">
                              {linkedEmpleado.nombre}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin vincular</span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            u.activo
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {u.activo ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar nombre y rol"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenChangePassword(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cambiar contraseña de demostración"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(u)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                              u.activo
                                ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Matriz y descripción de roles y permisos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1D7EAE]" />
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Guía de roles y permisos del sistema
              </h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ROLES_SISTEMA.map((item) => (
                <div key={item.rol} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getRolBadge(item.rol)}`}>
                      {item.rol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {item.descripcion}
                  </p>
                  <ul className="text-[10px] text-slate-500 list-disc list-inside space-y-0.5 pt-1 border-t border-slate-100">
                    {item.permisos.map((p, idx) => (
                      <li key={idx} className="truncate">{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-500 space-y-1">
            <p>
              💡 <strong>Reglas del sistema:</strong> No se permite eliminar usuarios ni desactivar al último administrador activo. Los usuarios inactivos no pueden iniciar sesión.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AGREGAR / EDITAR USUARIO */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in"
          onClick={userFormDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-white text-[#231F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#231F20]">
                  {editingUsuario ? 'Editar usuario' : 'Agregar usuario'}
                </h3>
              </div>
              <button
                type="button"
                onClick={userFormDismiss.handleClose}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => {
                    setFormNombre(e.target.value);
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: '' });
                  }}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full px-3 py-2 border rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                    formErrors.nombre ? 'border-red-400 bg-red-50/30' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Correo o nombre de usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUsuario}
                  onChange={(e) => {
                    setFormUsuario(e.target.value);
                    if (formErrors.usuario) setFormErrors({ ...formErrors, usuario: '' });
                  }}
                  placeholder="Ej. juan@taller.com o juanp"
                  className={`w-full px-3 py-2 border rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                    formErrors.usuario ? 'border-red-400 bg-red-50/30' : 'border-[#DDE4E8]'
                  }`}
                />
                {formErrors.usuario && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.usuario}</p>
                )}
              </div>

              {!editingUsuario && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contraseña inicial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => {
                      setFormPassword(e.target.value);
                      if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                    }}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 border rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] ${
                      formErrors.password ? 'border-red-400 bg-red-50/30' : 'border-[#DDE4E8]'
                    }`}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.password}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rol de usuario <span className="text-red-500">*</span>
                </label>
                <select
                  value={formRol}
                  onChange={(e) => {
                    setFormRol(e.target.value as RolUsuario);
                    if (formErrors.rol) setFormErrors({ ...formErrors, rol: '' });
                  }}
                  className="w-full px-3 py-2 border border-[#DDE4E8] rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE] bg-white cursor-pointer"
                >
                  <option value="Administrador">Administrador — Acceso completo</option>
                  <option value="Recepción/CRM">Recepción/CRM — Clientes, vehículos, citas, prospectos, seguimientos y creación inicial de órdenes</option>
                  <option value="Cotizador">Cotizador — Servicios, refacciones y elaboración de cotizaciones</option>
                  <option value="Técnico">Técnico — Diagnóstico y actualización de órdenes asignadas</option>
                  <option value="Control de calidad">Control de calidad — Revisión, aprobación o rechazo de trabajos terminados</option>
                  <option value="Caja">Caja — Facturas, pagos y consulta del resumen de la orden</option>
                </select>
                {formErrors.rol && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.rol}</p>
                )}
              </div>

              {/* Si es técnico / mecánico, permitir vincular con un Empleado */}
              {(formRol === 'Técnico' || formRol === 'Mecánico') && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                  <label className="block font-semibold text-amber-900">
                    Vincular con empleado técnico en Personal (Opcional):
                  </label>
                  <select
                    value={formEmpleadoId}
                    onChange={(e) => setFormEmpleadoId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#DDE4E8] rounded bg-white text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                  >
                    <option value="">-- Sin vincular a empleado específico --</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} — {emp.puesto} {emp.activo ? '(Activo)' : '(Inactivo)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-800">
                    Permite asignarle órdenes directamente por su nombre o registro de personal.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={userFormDismiss.handleClose}
                  className="px-3.5 py-2 min-h-[42px] border border-[#DDE4E8] rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingUsuario ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAMBIAR CONTRASEÑA */}
      {/* ========================================================================= */}
      {passwordTargetUsuario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto animate-in fade-in"
          onClick={passwordModalDismiss.handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#DDE4E8] flex items-center justify-between bg-white text-[#231F20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#98DAE9]/20 border border-[#98DAE9]/40 flex items-center justify-center text-[#1D7EAE]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#231F20]">
                  Cambiar contraseña: {passwordTargetUsuario.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={passwordModalDismiss.handleClose}
                className="p-1 text-slate-400 hover:text-[#231F20] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPassword} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nueva contraseña de demostración <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#DDE4E8] rounded-lg text-[#231F20] text-xs focus:outline-none focus:border-[#1D7EAE] focus:ring-1 focus:ring-[#1D7EAE]"
                />
                {passwordError && (
                  <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={passwordModalDismiss.handleClose}
                  className="px-3.5 py-1.5 min-h-[42px] border border-[#DDE4E8] rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 min-h-[42px] bg-[#1D7EAE] hover:bg-[#0032A0] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
