import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface SecondaryAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'ai';
  disabled?: boolean;
}

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryActions?: SecondaryAction[];
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryActions,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const hasSecondary = secondaryActions && secondaryActions.length > 0;

  return (
    <div
      className={`bg-white border border-[#E5E7EB] border-t-4 border-t-[#1497F2] rounded-xl p-4 md:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      {/* Icon + Title + 1-line Description */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#1497F2] border border-[#73C7FF]/40 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-[#06345A] font-heading tracking-tight truncate">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-[#6B7280] mt-0.5 truncate">
            {description}
          </p>
        </div>
      </div>

      {/* Single primary action + optional 3-dots menu for secondary actions */}
      {(primaryAction || hasSecondary) && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-[#1497F2] hover:bg-[#06345A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold font-heading shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1497F2]/20"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {hasSecondary && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#6B7280] hover:text-[#06345A] flex items-center justify-center transition-colors cursor-pointer shadow-xs focus:outline-none"
                title="Acciones secundarias"
                aria-label="Acciones secundarias"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5 z-40 text-left text-xs font-medium animate-in fade-in duration-100 divide-y divide-slate-100">
                  <div className="py-1">
                    {secondaryActions.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={action.disabled}
                        onClick={() => {
                          setIsMenuOpen(false);
                          action.onClick();
                        }}
                        className={`w-full px-3.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          action.variant === 'danger'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : action.variant === 'ai'
                            ? 'text-[#06345A] hover:bg-sky-50 font-semibold'
                            : 'text-[#374151] hover:bg-slate-50 hover:text-[#1497F2]'
                        }`}
                      >
                        {action.icon && <span className="shrink-0">{action.icon}</span>}
                        <span className="truncate">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
