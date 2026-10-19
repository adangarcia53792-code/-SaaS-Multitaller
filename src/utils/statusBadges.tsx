import React from 'react';

export type StatusCategory = 'verde' | 'amarillo' | 'azul' | 'rojo' | 'gris';

export function getStatusCategory(estado: string): StatusCategory {
  const norm = (estado || '').toLowerCase().trim();

  // Verde: completado, aprobado, pagado, entregado, recibido, activo
  if (
    norm.includes('completad') ||
    norm.includes('terminad') ||
    norm.includes('aprobad') ||
    norm.includes('pagad') ||
    norm.includes('entregad') ||
    norm.includes('recibid') ||
    norm === 'activo' ||
    norm === 'activa' ||
    norm === 'alta'
  ) {
    return 'verde';
  }

  // Amarillo: pendiente, por autorizar, en espera
  if (
    norm.includes('por autorizar') ||
    norm.includes('pendiente') ||
    norm.includes('espera') ||
    norm.includes('por pagar') ||
    norm.includes('parcial')
  ) {
    return 'amarillo';
  }

  // Azul: en proceso, programado, en revisión, diagnóstico
  if (
    norm.includes('en proceso') ||
    norm.includes('programad') ||
    norm.includes('revisión') ||
    norm.includes('revision') ||
    norm.includes('diagnóstic') ||
    norm.includes('diagnostico')
  ) {
    return 'azul';
  }

  // Rojo: urgente, rechazado, vencido, cancelado, stock bajo, agotado
  if (
    norm.includes('urgent') ||
    norm.includes('rechazad') ||
    norm.includes('vencid') ||
    norm.includes('cancelad') ||
    norm.includes('agotad') ||
    norm.includes('stock bajo') ||
    norm.includes('retras') ||
    norm.includes('critico') ||
    norm.includes('crítico')
  ) {
    return 'rojo';
  }

  // Gris: inactivo, sin información, borrador, por defecto
  return 'gris';
}

export function getBadgeClasses(category: StatusCategory): string {
  switch (category) {
    case 'verde':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'amarillo':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'azul':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'rojo':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'gris':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export interface StatusBadgeProps {
  estado: string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, label, className = '' }) => {
  const category = getStatusCategory(estado);
  const classes = getBadgeClasses(category);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${classes} ${className}`}
    >
      {label || estado}
    </span>
  );
};
